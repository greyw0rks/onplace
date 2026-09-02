import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      follows: { include: { agent: true } },
      hires: { include: { agent: true } },
      reviews: { include: { agent: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const candidates = await prisma.agent.findMany({
    where: { verified: true },
    include: {
      reviews: { where: { verified: true } },
      testResults: { orderBy: { executedAt: "desc" }, take: 10 },
      _count: { select: { hires: true } },
    },
    take: 100,
  });

  const recommendations = [];

  for (const agent of candidates) {
    let score = 50;

    const followedCategories = new Set(user.follows.map(f => f.agent.categorySlug));
    if (followedCategories.has(agent.categorySlug)) score += 20;

    const hiredAgentIds = new Set(user.hires.map(h => h.agentId));
    if (!hiredAgentIds.has(agent.id)) score += 10;

    const avgRating = agent.reviews.length > 0
      ? agent.reviews.reduce((sum, r) => sum + r.rating, 0) / agent.reviews.length
      : 3;
    score += (avgRating - 3) * 10;

    const passRate = agent.testResults.length > 0
      ? agent.testResults.filter(t => t.status === "PASSED").length / agent.testResults.length
      : 0.5;
    score += passRate * 20;

    if (agent._count.hires > 10) score += 10;

    if (score >= 60) {
      recommendations.push({
        userId,
        agentId: agent.id,
        score,
        reason: {
          categoryMatch: followedCategories.has(agent.categorySlug),
          avgRating,
          passRate,
          popularity: agent._count.hires,
        },
      });
    }
  }

  recommendations.sort((a, b) => b.score - a.score);
  const topRecommendations = recommendations.slice(0, 10);

  for (const rec of topRecommendations) {
    await prisma.recommendation.create({
      data: rec,
    });
  }

  return NextResponse.json({ recommendations: topRecommendations });
}
