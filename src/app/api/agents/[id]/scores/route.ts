import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trustScoreOf } from "@/lib/health-check";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      healthChecks: { orderBy: { timestamp: "desc" }, take: 100 },
      reviews: { orderBy: { createdAt: "desc" } },
      hires: { where: { status: "completed" } },
      versions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Trust Score (60% Onplace + 40% Community)
  const trustScore = trustScoreOf(agent);

  // Health Score (current operational status)
  const recentChecks = agent.healthChecks.slice(0, 20);
  const recentSuccessRate = recentChecks.length > 0
    ? recentChecks.filter(c => c.success).length / recentChecks.length
    : 0;
  const healthScore = Math.round(recentSuccessRate * 100);

  // Performance Score (from test results and benchmarks)
  const performanceScore = agent.performanceScore || 0;

  // Community Score (reviews + retention)
  const avgRating = agent.reviews.length > 0
    ? agent.reviews.reduce((sum, r) => sum + r.rating, 0) / agent.reviews.length
    : 0;
  const completionRate = agent.hireCount > 0
    ? agent.hires.length / agent.hireCount
    : 0;
  const communityScore = Math.round((avgRating / 5) * 70 + completionRate * 30);

  // Match Score (contextual - would be calculated based on user query in real implementation)
  const matchScore = null; // Placeholder - computed on-demand with query context

  return NextResponse.json({
    scores: {
      trust: trustScore,
      health: healthScore,
      performance: performanceScore,
      community: communityScore,
      match: matchScore,
    },
    breakdown: {
      trust: {
        onplace: trustScore * 0.6,
        community: trustScore * 0.4,
      },
      health: {
        recentSuccessRate,
        checksAnalyzed: recentChecks.length,
      },
      community: {
        avgRating,
        totalReviews: agent.reviews.length,
        completionRate,
        totalHires: agent.hireCount,
      },
    },
  });
}
