import { prisma } from "@/lib/db";

const TIMEOUT_MS = 6000;

interface CheckResult {
  success: boolean;
  latencyMs: number | null;
  error: string | null;
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

export async function checkAgentHealth(agentId: string) {
  const agent = await prisma.agent.findUniqueOrThrow({ where: { id: agentId } });
  const result = await pingEndpoint(agent.endpointUrl);

  await prisma.healthCheck.create({
    data: {
      agentId,
      success: result.success,
      latencyMs: result.latencyMs,
      error: result.error,
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

export async function checkAllAgentsHealth() {
  const agents = await prisma.agent.findMany({ select: { id: true } });
  const results = [];
  for (const agent of agents) {
    results.push(await checkAgentHealth(agent.id));
  }
  return results;
}
