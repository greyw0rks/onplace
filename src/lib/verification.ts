import { prisma } from "@/lib/db";
import type { ActivityType, AgentStatus } from "@/generated/prisma/enums";

/**
 * What "verified" means on Onplaced.
 *
 * The badge is derived from evidence we can point at, never set by hand:
 *
 *  1. **On-chain identity** — the agent has an ERC-8004 token id in the
 *     registry, so its owner and metadata are publicly checkable.
 *  2. **Responding now** — the most recent health check we ran against its
 *     advertised endpoint succeeded.
 *  3. **Track record** — its uptime across our recorded checks is at least
 *     `MIN_UPTIME`, so an agent that mostly fails can't earn the badge on the
 *     strength of one lucky ping.
 *
 * Because criterion 2 looks at the *latest* check, verification is revoked
 * automatically when an agent goes dark. That is the point: the claim is
 * "verified right now", not "verified once in the past".
 */
export const MIN_UPTIME = 0.8;

export const VERIFICATION_CRITERIA = [
  "Registered in the ERC-8004 identity registry",
  "Most recent health check succeeded",
  `Uptime of ${Math.round(MIN_UPTIME * 100)}% or better across recorded checks`,
] as const;

export interface VerificationEvidence {
  hasOnchainIdentity: boolean;
  lastCheckSucceeded: boolean;
  uptimePct: number | null;
}

export function evaluateVerification(evidence: VerificationEvidence): boolean {
  return (
    evidence.hasOnchainIdentity &&
    evidence.lastCheckSucceeded &&
    (evidence.uptimePct ?? 0) >= MIN_UPTIME
  );
}

export interface VerificationSweep {
  evaluated: number;
  verified: number;
  granted: number;
  revoked: number;
  statusChanges: number;
  activityLogged: number;
}

/**
 * Below this many recorded checks we don't have the evidence to call an agent
 * healthy or broken, so it sits in MONITORING. Without this floor one unlucky
 * ping on a brand-new agent would brand it DEGRADED.
 */
const MIN_CHECKS_FOR_STATUS = 3;

interface StatusEvidence {
  current: AgentStatus;
  checkCount: number;
  lastCheckSucceeded: boolean;
  uptimePct: number | null;
}

/**
 * SUSPENDED is deliberately sticky: it means a human took the agent down, and a
 * sweep that happens to land one good ping must not quietly put it back in
 * front of users. Every other state is recomputed from evidence each time.
 */
export function deriveStatus(evidence: StatusEvidence): AgentStatus {
  if (evidence.current === "SUSPENDED") return "SUSPENDED";
  if (evidence.checkCount < MIN_CHECKS_FOR_STATUS) return "MONITORING";
  if (evidence.lastCheckSucceeded && (evidence.uptimePct ?? 0) >= MIN_UPTIME) {
    return "HEALTHY";
  }
  return "DEGRADED";
}

function statusReasonFor(status: AgentStatus, evidence: StatusEvidence): string | null {
  const uptime =
    evidence.uptimePct != null ? `${Math.round(evidence.uptimePct * 100)}%` : "unknown";

  switch (status) {
    case "MONITORING":
      return `Only ${evidence.checkCount} check(s) recorded; ${MIN_CHECKS_FOR_STATUS} needed to rate`;
    case "HEALTHY":
      return `Last check succeeded, uptime ${uptime}`;
    case "DEGRADED":
      return evidence.lastCheckSucceeded
        ? `Uptime ${uptime} is below the ${Math.round(MIN_UPTIME * 100)}% floor`
        : "Most recent check failed";
    default:
      return null;
  }
}

/**
 * Recompute the verified flag *and* the operational status for every agent from
 * current evidence, and record each transition on the marketplace activity feed.
 * Intended to run straight after a health-check sweep, so both track reality.
 *
 * Transitions are what get logged, not states: writing a row per agent per sweep
 * would bury the one event a user cares about under 36 identical lines.
 */
export async function refreshVerification(): Promise<VerificationSweep> {
  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      name: true,
      erc8004Id: true,
      uptimePct: true,
      verified: true,
      status: true,
      healthChecks: {
        orderBy: { timestamp: "desc" },
        take: 1,
        select: { success: true },
      },
      _count: { select: { healthChecks: true } },
    },
  });

  let granted = 0;
  let revoked = 0;
  let statusChanges = 0;
  const updates: Array<Promise<unknown>> = [];
  const activity: Array<{
    type: ActivityType;
    agentId: string;
    title: string;
    description: string | null;
  }> = [];

  for (const agent of agents) {
    const lastCheckSucceeded = agent.healthChecks[0]?.success ?? false;

    const shouldBeVerified = evaluateVerification({
      hasOnchainIdentity: Boolean(agent.erc8004Id),
      lastCheckSucceeded,
      uptimePct: agent.uptimePct,
    });

    const evidence: StatusEvidence = {
      current: agent.status,
      checkCount: agent._count.healthChecks,
      lastCheckSucceeded,
      uptimePct: agent.uptimePct,
    };
    const nextStatus = deriveStatus(evidence);

    const badgeChanged = shouldBeVerified !== agent.verified;
    const statusChanged = nextStatus !== agent.status;

    if (!badgeChanged && !statusChanged) continue;

    if (badgeChanged) {
      if (shouldBeVerified) granted += 1;
      else revoked += 1;

      activity.push({
        type: shouldBeVerified ? "AGENT_VERIFIED" : "AGENT_UNVERIFIED",
        agentId: agent.id,
        title: shouldBeVerified
          ? `${agent.name} passed verification`
          : `${agent.name} lost its verified badge`,
        description: shouldBeVerified
          ? VERIFICATION_CRITERIA.join(" · ")
          : statusReasonFor(nextStatus, evidence),
      });
    }

    if (statusChanged) {
      statusChanges += 1;

      // Only transitions a user would act on get a feed entry. Coming out of
      // MONITORING is not a recovery — the agent was unproven, not broken — and
      // treating it as one made the very first sweep announce "healthy again"
      // for 12 agents that had never been rated.
      const recovered = nextStatus === "HEALTHY" && agent.status !== "MONITORING";
      const degraded = nextStatus === "DEGRADED";

      if (recovered || degraded) {
        activity.push({
          type: degraded ? "AGENT_DEGRADED" : "AGENT_RECOVERED",
          agentId: agent.id,
          title: degraded
            ? `${agent.name} is degraded`
            : `${agent.name} is healthy again`,
          description: statusReasonFor(nextStatus, evidence),
        });
      }
    }

    updates.push(
      prisma.agent.update({
        where: { id: agent.id },
        data: {
          ...(badgeChanged
            ? shouldBeVerified
              ? { verified: true, verifiedAt: new Date() }
              : { verified: false, verifiedAt: null }
            : {}),
          ...(statusChanged
            ? {
                status: nextStatus,
                statusReason: statusReasonFor(nextStatus, evidence),
                statusChangedAt: new Date(),
              }
            : {}),
        },
      })
    );
  }

  await Promise.all(updates);

  // A feed write must never take down the sweep that produced the evidence.
  let activityLogged = 0;
  if (activity.length > 0) {
    try {
      const written = await prisma.marketplaceActivity.createMany({ data: activity });
      activityLogged = written.count;
    } catch (err) {
      console.error("failed to record verification activity:", err);
    }
  }

  const verified = await prisma.agent.count({ where: { verified: true } });

  return {
    evaluated: agents.length,
    verified,
    granted,
    revoked,
    statusChanges,
    activityLogged,
  };
}
