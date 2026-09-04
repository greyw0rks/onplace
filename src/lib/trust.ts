import { prisma } from "@/lib/db";

/**
 * The 60/40 trust model: 60% evidence Onplaced gathered itself, 40% what the
 * community reports.
 *
 * This used to live inline in `POST /api/agents/[id]/trust`, which nothing ever
 * called — no cron, no UI — so the elaborate model produced no rows while the
 * score shown in the UI came from a much cruder formula in health-check.ts. It
 * lives here now so both the human-facing route and the paid agent-to-agent API
 * compute the same number from the same evidence.
 */
export const ONPLACED_WEIGHTS = {
  benchmark: 0.3,
  reliability: 0.25,
  security: 0.2,
  versionStability: 0.15,
  recentPerformance: 0.1,
} as const;

export const COMMUNITY_WEIGHTS = {
  verifiedRatings: 0.35,
  userSuccess: 0.25,
  retention: 0.2,
  reviewQuality: 0.1,
  usageReputation: 0.1,
} as const;

export const ONPLACED_SHARE = 0.6;
export const COMMUNITY_SHARE = 0.4;

export interface TrustBreakdown {
  benchmarkScore: number;
  reliabilityScore: number;
  securityScore: number;
  versionStability: number;
  recentPerformance: number;
  onplacedTotal: number;
  verifiedRatings: number;
  userSuccess: number;
  retention: number;
  reviewQuality: number;
  usageReputation: number;
  communityTotal: number;
  finalTrustScore: number;
  /** How much evidence backs the number, so callers can say "provisional". */
  sampleSizes: {
    healthChecks: number;
    testResults: number;
    reviews: number;
    completedHires: number;
    securityAudits: number;
  };
}

function ratio(part: number, whole: number): number {
  return whole === 0 ? 0 : (part / whole) * 100;
}

const SECURITY_LEVEL_SCORES: Record<string, number> = {
  CRITICAL: 100,
  COMPREHENSIVE: 90,
  STANDARD: 75,
  BASIC: 60,
  NOT_AUDITED: 40,
};

/**
 * Loads every piece of evidence for an agent and derives the score. Returns null
 * when the agent does not exist so callers can 404 rather than invent a score.
 */
export async function computeTrust(agentId: string): Promise<TrustBreakdown | null> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      healthChecks: { orderBy: { timestamp: "desc" }, take: 100 },
      reviews: { where: { verified: true }, include: { user: true } },
      testResults: { orderBy: { executedAt: "desc" }, take: 50 },
      versions: { orderBy: { createdAt: "desc" }, take: 10 },
      securityAudits: { orderBy: { auditedAt: "desc" }, take: 1 },
      hires: { where: { status: "completed" } },
    },
  });

  if (!agent) return null;

  const benchmarkScore = ratio(
    agent.testResults.filter((t) => t.status === "PASSED").length,
    agent.testResults.length
  );

  const reliabilityScore = ratio(
    agent.healthChecks.filter((h) => h.success).length,
    agent.healthChecks.length
  );

  // No audit is not the same as a bad audit, so an unaudited agent sits at the
  // midpoint rather than at zero.
  const securityScore =
    agent.securityAudits.length === 0
      ? 50
      : SECURITY_LEVEL_SCORES[agent.securityAudits[0].securityLevel] ?? 50;

  const versionStability =
    agent.versions.length <= 1
      ? 100
      : ratio(
          agent.versions.filter((v) => v.verificationStatus === "VERIFIED").length,
          agent.versions.length
        );

  const recent = agent.testResults.slice(0, 10);
  const recentPerformance =
    recent.length === 0
      ? 0
      : recent.reduce((sum, t) => sum + (t.score ?? 0), 0) / recent.length;

  const onplacedTotal =
    benchmarkScore * ONPLACED_WEIGHTS.benchmark +
    reliabilityScore * ONPLACED_WEIGHTS.reliability +
    securityScore * ONPLACED_WEIGHTS.security +
    versionStability * ONPLACED_WEIGHTS.versionStability +
    recentPerformance * ONPLACED_WEIGHTS.recentPerformance;

  // Reviews are weighted by the reviewer's own reputation, normalised around
  // 50 so an average reviewer counts once.
  let verifiedRatings = 50;
  if (agent.reviews.length > 0) {
    let weighted = 0;
    let totalWeight = 0;
    for (const review of agent.reviews) {
      const weight = (review.weight ?? 1) * ((review.user?.reputation ?? 50) / 50);
      weighted += (review.rating / 5) * 100 * weight;
      totalWeight += weight;
    }
    verifiedRatings = totalWeight > 0 ? weighted / totalWeight : 50;
  }

  // Only completed hires are loaded above, so this is the completion rate over
  // hires we can see. It was previously a hardcoded `return 100`, which quietly
  // handed every agent a tenth of the total score for free.
  const allHires = await prisma.hire.count({ where: { agentId } });
  const userSuccess = allHires === 0 ? 50 : ratio(agent.hires.length, allHires);

  const perUser = new Map<string, number>();
  for (const hire of agent.hires) {
    if (hire.userId) perUser.set(hire.userId, (perUser.get(hire.userId) ?? 0) + 1);
  }
  const retention = ratio(
    [...perUser.values()].filter((n) => n > 1).length,
    perUser.size
  );

  const reviewQuality =
    agent.reviews.length === 0
      ? 50
      : agent.reviews.reduce((sum, review) => {
          let score = 50;
          if (review.comment && review.comment.length > 50) score += 20;
          if (review.verified) score += 20;
          if (review.helpfulCount > 5) score += 10;
          return sum + Math.min(score, 100);
        }, 0) / agent.reviews.length;

  const usageReputation =
    agent.viewCount === 0 ? 0 : Math.min(ratio(agent.hireCount, agent.viewCount) * 2, 100);

  const communityTotal =
    verifiedRatings * COMMUNITY_WEIGHTS.verifiedRatings +
    userSuccess * COMMUNITY_WEIGHTS.userSuccess +
    retention * COMMUNITY_WEIGHTS.retention +
    reviewQuality * COMMUNITY_WEIGHTS.reviewQuality +
    usageReputation * COMMUNITY_WEIGHTS.usageReputation;

  return {
    benchmarkScore,
    reliabilityScore,
    securityScore,
    versionStability,
    recentPerformance,
    onplacedTotal,
    verifiedRatings,
    userSuccess,
    retention,
    reviewQuality,
    usageReputation,
    communityTotal,
    finalTrustScore: onplacedTotal * ONPLACED_SHARE + communityTotal * COMMUNITY_SHARE,
    sampleSizes: {
      healthChecks: agent.healthChecks.length,
      testResults: agent.testResults.length,
      reviews: agent.reviews.length,
      completedHires: agent.hires.length,
      securityAudits: agent.securityAudits.length,
    },
  };
}

/** Computes, persists a TrustCalculation row, and syncs Agent.reputationScore. */
export async function computeAndPersistTrust(agentId: string) {
  const breakdown = await computeTrust(agentId);
  if (!breakdown) return null;

  const { sampleSizes, ...columns } = breakdown;

  const calculation = await prisma.trustCalculation.create({
    data: { agentId, ...columns },
  });

  await prisma.agent.update({
    where: { id: agentId },
    data: { reputationScore: breakdown.finalTrustScore },
  });

  return { calculation, breakdown };
}
