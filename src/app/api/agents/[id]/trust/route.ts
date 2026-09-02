import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      healthChecks: { orderBy: { timestamp: "desc" }, take: 100 },
      reviews: { where: { verified: true }, include: { user: true } },
      testResults: { orderBy: { executedAt: "desc" }, take: 50 },
      versions: { orderBy: { createdAt: "desc" }, take: 10 },
      securityAudits: { orderBy: { auditedAt: "desc" }, take: 1 },
      hires: { where: { status: "completed" } },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // AgentProof Component (60%)
  const benchmarkScore = calculateBenchmarkScore(agent.testResults);
  const reliabilityScore = calculateReliabilityScore(agent.healthChecks);
  const securityScore = calculateSecurityScore(agent.securityAudits);
  const versionStability = calculateVersionStability(agent.versions);
  const recentPerformance = calculateRecentPerformance(agent.testResults.slice(0, 10));

  const agentProofTotal = (
    benchmarkScore * 0.3 +
    reliabilityScore * 0.25 +
    securityScore * 0.2 +
    versionStability * 0.15 +
    recentPerformance * 0.1
  );

  // Community Component (40%)
  const verifiedRatings = calculateVerifiedRatings(agent.reviews);
  const userSuccess = calculateUserSuccess(agent.hires);
  const retention = calculateRetention(agent.hires);
  const reviewQuality = calculateReviewQuality(agent.reviews);
  const usageReputation = calculateUsageReputation(agent);

  const communityTotal = (
    verifiedRatings * 0.35 +
    userSuccess * 0.25 +
    retention * 0.2 +
    reviewQuality * 0.1 +
    usageReputation * 0.1
  );

  // Final Trust Score
  const finalTrustScore = agentProofTotal * 0.6 + communityTotal * 0.4;

  const calculation = await prisma.trustCalculation.create({
    data: {
      agentId: id,
      benchmarkScore,
      reliabilityScore,
      securityScore,
      versionStability,
      recentPerformance,
      agentProofTotal,
      verifiedRatings,
      userSuccess,
      retention,
      reviewQuality,
      usageReputation,
      communityTotal,
      finalTrustScore,
    },
  });

  await prisma.agent.update({
    where: { id },
    data: { reputationScore: finalTrustScore },
  });

  return NextResponse.json({ calculation, finalTrustScore });
}

function calculateBenchmarkScore(testResults: any[]): number {
  if (testResults.length === 0) return 0;
  const passedTests = testResults.filter(t => t.status === "PASSED");
  return (passedTests.length / testResults.length) * 100;
}

function calculateReliabilityScore(healthChecks: any[]): number {
  if (healthChecks.length === 0) return 0;
  const successful = healthChecks.filter(h => h.success);
  return (successful.length / healthChecks.length) * 100;
}

function calculateSecurityScore(audits: any[]): number {
  if (audits.length === 0) return 50; // Default middle score

  const audit = audits[0];
  const levelScores: Record<string, number> = {
    CRITICAL: 100,
    COMPREHENSIVE: 90,
    STANDARD: 75,
    BASIC: 60,
    NOT_AUDITED: 40,
  };

  return levelScores[audit.securityLevel] || 50;
}

function calculateVersionStability(versions: any[]): number {
  if (versions.length <= 1) return 100;

  const verifiedVersions = versions.filter(v => v.verificationStatus === "VERIFIED");
  return (verifiedVersions.length / versions.length) * 100;
}

function calculateRecentPerformance(recentTests: any[]): number {
  if (recentTests.length === 0) return 0;
  const avgScore = recentTests.reduce((sum, t) => sum + (t.score || 0), 0) / recentTests.length;
  return avgScore;
}

function calculateVerifiedRatings(reviews: any[]): number {
  if (reviews.length === 0) return 50; // Neutral

  const weightedSum = reviews.reduce((sum, review) => {
    const weight = review.weight || 1.0;
    const reputation = review.user?.reputation || 50;
    const reputationMultiplier = reputation / 50; // Normalize around 1.0
    return sum + (review.rating / 5) * 100 * weight * reputationMultiplier;
  }, 0);

  const totalWeight = reviews.reduce((sum, review) => {
    const weight = review.weight || 1.0;
    const reputation = review.user?.reputation || 50;
    return sum + weight * (reputation / 50);
  }, 0);

  return totalWeight > 0 ? weightedSum / totalWeight : 50;
}

function calculateUserSuccess(hires: any[]): number {
  if (hires.length === 0) return 50;
  // Completed hires / total hires
  return 100; // All provided hires are completed in this query
}

function calculateRetention(hires: any[]): number {
  if (hires.length === 0) return 0;

  // Calculate repeat users
  const userCounts = hires.reduce((acc: Record<string, number>, hire) => {
    if (hire.userId) {
      acc[hire.userId] = (acc[hire.userId] || 0) + 1;
    }
    return acc;
  }, {});

  const repeatUsers = Object.values(userCounts).filter(count => count > 1).length;
  const totalUsers = Object.keys(userCounts).length;

  return totalUsers > 0 ? (repeatUsers / totalUsers) * 100 : 0;
}

function calculateReviewQuality(reviews: any[]): number {
  if (reviews.length === 0) return 50;

  const qualityScore = reviews.reduce((sum, review) => {
    let score = 50; // Base score

    // Has detailed comment
    if (review.comment && review.comment.length > 50) score += 20;

    // Verified review
    if (review.verified) score += 20;

    // Helpful votes
    if (review.helpfulCount > 5) score += 10;

    return sum + Math.min(score, 100);
  }, 0);

  return qualityScore / reviews.length;
}

function calculateUsageReputation(agent: any): number {
  const hireCount = agent.hireCount || 0;
  const viewCount = agent.viewCount || 0;

  if (viewCount === 0) return 0;

  const conversionRate = (hireCount / viewCount) * 100;
  return Math.min(conversionRate * 2, 100); // Scale up, cap at 100
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const calculations = await prisma.trustCalculation.findMany({
    where: { agentId: id },
    orderBy: { calculatedAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ calculations });
}
