import { prisma } from "@/lib/db";
import { verifyOnchain } from "@/lib/self-built-agent";

const TIMEOUT_MS = 6000;

interface CheckResult {
  success: boolean;
  latencyMs: number | null;
  error: string | null;
  txHash?: string | null;
  healthFactor?: number | null;
  collateralValueUsd?: number | null;
  borrowValueUsd?: number | null;
}

async function pingEndpoint(url: string): Promise<CheckResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    const latencyMs = Date.now() - started;
    // Any HTTP response means the endpoint is reachable, even if it rejects
    // a bare GET (many MCP/A2A endpoints only accept POST).
    return { success: true, latencyMs, error: res.ok ? null : `HTTP ${res.status}` };
  } catch (err) {
    return {
      success: false,
      latencyMs: null,
      error: err instanceof Error ? err.message : "unknown error",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function computeTrustScore(reputationScore: number | null, uptimePct: number | null): number {
  const reputationComponent = Math.min(100, reputationScore ?? 0);
  const uptimeComponent = (uptimePct ?? 0) * 100;
  return Math.round(reputationComponent * 0.6 + uptimeComponent * 0.4);
}

export function trustScoreOf(agent: { reputationScore: number | null; uptimePct: number | null }) {
  return computeTrustScore(agent.reputationScore, agent.uptimePct);
}

export function trustBand(score: number): "excellent" | "strong" | "moderate" | "weak" | "high-risk" {
  if (score >= 90) return "excellent";
  if (score >= 80) return "strong";
  if (score >= 70) return "moderate";
  if (score >= 50) return "weak";
  return "high-risk";
}

/**
 * Runs the self-built agent's real verification: reads its live Venus position
 * and writes the outcome to HealthCheckLog on BSC.
 *
 * Failures are returned rather than thrown so that a chain or RPC outage still
 * records a failed check. Throwing here would leave a gap in the reliability
 * history that reads as "no problem" instead of "we couldn't verify".
 *
 * latencyMs stays null on purpose: this path waits on a block confirmation, and
 * folding a few seconds of block time into the same field that holds endpoint
 * ping latency would make the two incomparable.
 */
async function verifySelfBuilt(agent: { erc8004Id: string | null }): Promise<CheckResult> {
  if (!agent.erc8004Id) {
    return { success: false, latencyMs: null, error: "agent has no erc8004Id; register it first" };
  }

  try {
    const { txHash, monitored } = await verifyOnchain();
    return {
      success: true,
      latencyMs: null,
      error: null,
      txHash,
      healthFactor: Number.isFinite(monitored.healthFactor) ? monitored.healthFactor : null,
      collateralValueUsd: monitored.collateralValueUsd,
      borrowValueUsd: monitored.borrowValueUsd,
    };
  } catch (err) {
    return {
      success: false,
      latencyMs: null,
      error: err instanceof Error ? err.message : "on-chain verification failed",
    };
  }
}

/**
 * One agent, one check. Self-built agents get a real verification with an
 * on-chain receipt; third-party agents can only be probed for reachability,
 * since we don't control what runs behind their endpoint. Both outcomes are
 * persisted through the same path so uptime stays comparable across them.
 */
export async function checkAgentHealth(agentId: string) {
  const agent = await prisma.agent.findUniqueOrThrow({ where: { id: agentId } });

  const result =
    agent.sourceType === "self_built"
      ? await verifySelfBuilt(agent)
      : await pingEndpoint(agent.endpointUrl);

  await prisma.healthCheck.create({
    data: {
      agentId,
      success: result.success,
      latencyMs: result.latencyMs,
      error: result.error,
      txHash: result.txHash ?? null,
      healthFactor: result.healthFactor ?? null,
      collateralValueUsd: result.collateralValueUsd ?? null,
      borrowValueUsd: result.borrowValueUsd ?? null,
    },
  });

  const recentChecks = await prisma.healthCheck.findMany({
    where: { agentId },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  const uptimePct =
    recentChecks.filter((c) => c.success).length / recentChecks.length;
  const latencyMs = result.latencyMs ?? agent.latencyMs;

  await prisma.agent.update({
    where: { id: agentId },
    data: {
      lastHealthCheckAt: new Date(),
      latencyMs,
      uptimePct,
    },
  });

  return { agentId, ...result, uptimePct };
}

type SweepResult =
  | Awaited<ReturnType<typeof checkAgentHealth>>
  | { agentId: string; success: false; latencyMs: null; error: string; uptimePct: null };

async function settleChecks(ids: string[]): Promise<SweepResult[]> {
  const settled = await Promise.allSettled(ids.map((id) => checkAgentHealth(id)));

  return settled.map((outcome, j) =>
    outcome.status === "fulfilled"
      ? outcome.value
      : {
          // One agent failing to record shouldn't abort the whole sweep.
          agentId: ids[j],
          success: false as const,
          latencyMs: null,
          error: outcome.reason instanceof Error ? outcome.reason.message : "check failed",
          uptimePct: null,
        }
  );
}

/**
 * Check every agent.
 *
 * Self-built agents go first and one at a time. Their check is an on-chain
 * verification — several sequential RPC reads plus a transaction — and running
 * that alongside a batch of concurrent endpoint pings starves the RPC
 * connection until it times out, turning a real verification into a spurious
 * failure. Endpoint pings then run in bounded parallel batches, because doing
 * those sequentially costs `agents × TIMEOUT_MS` in the worst case and blows
 * past a serverless function's time limit.
 */
export async function checkAllAgentsHealth(concurrency = 8) {
  const agents = await prisma.agent.findMany({ select: { id: true, sourceType: true } });
  const selfBuilt = agents.filter((a) => a.sourceType === "self_built").map((a) => a.id);
  const pingable = agents.filter((a) => a.sourceType !== "self_built").map((a) => a.id);

  const results: SweepResult[] = [];

  for (const id of selfBuilt) {
    results.push(...(await settleChecks([id])));
  }

  for (let i = 0; i < pingable.length; i += concurrency) {
    results.push(...(await settleChecks(pingable.slice(i, i + concurrency))));
  }

  return results;
}
