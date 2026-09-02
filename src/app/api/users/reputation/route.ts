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
      reviews: { include: { agent: true } },
      hires: { where: { status: "completed" } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let reputation = 50.0; // Start at neutral

  // Factor 1: Review count (up to +10)
  const reviewBonus = Math.min(user.reviews.length * 2, 10);
  reputation += reviewBonus;

  // Factor 2: Hire completion (up to +15)
  const hireBonus = Math.min(user.hires.length * 1.5, 15);
  reputation += hireBonus;

  // Factor 3: Review quality (up to +10)
  const detailedReviews = user.reviews.filter(r => r.comment && r.comment.length > 50);
  const qualityBonus = Math.min((detailedReviews.length / Math.max(user.reviews.length, 1)) * 10, 10);
  reputation += qualityBonus;

  // Factor 4: Helpful votes (up to +10)
  const totalHelpful = user.reviews.reduce((sum, r) => sum + r.helpfulCount, 0);
  const helpfulBonus = Math.min(totalHelpful * 0.5, 10);
  reputation += helpfulBonus;

  // Factor 5: Longevity (up to +5)
  const accountAge = Date.now() - user.joinedAt.getTime();
  const daysOld = accountAge / (1000 * 60 * 60 * 24);
  const longevityBonus = Math.min(daysOld / 30, 5); // 1 point per 30 days, max 5
  reputation += longevityBonus;

  // Penalty: Suspicious activity (-20 to 0)
  reputation -= user.suspiciousActivityScore * 0.2;

  // Penalty: Reported reviews (-5 per reported review)
  const reportedReviews = user.reviews.filter(r => r.reportedCount > 0);
  reputation -= reportedReviews.length * 5;

  // Cap between 0 and 100
  reputation = Math.max(0, Math.min(100, reputation));

  await prisma.user.update({
    where: { id: userId },
    data: { reputation },
  });

  return NextResponse.json({ userId, reputation, breakdown: {
    base: 50,
    reviewBonus,
    hireBonus,
    qualityBonus,
    helpfulBonus,
    longevityBonus,
    suspiciousPenalty: -user.suspiciousActivityScore * 0.2,
    reportedPenalty: -reportedReviews.length * 5,
    final: reputation,
  }});
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      walletAddress: true,
      reputation: true,
      reviewCount: true,
      hireCount: true,
      suspiciousActivityScore: true,
      joinedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
