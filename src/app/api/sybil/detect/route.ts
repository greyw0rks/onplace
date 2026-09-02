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
      reviews: { orderBy: { createdAt: "desc" }, take: 50 },
      hires: { orderBy: { createdAt: "desc" }, take: 50 },
      follows: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const indicators: Record<string, any> = {};
  let suspicionScore = 0;

  // Indicator 1: Rapid burst activity
  const activityTimestamps = [
    ...user.reviews.map(r => r.createdAt.getTime()),
    ...user.hires.map(h => h.createdAt.getTime()),
    ...user.follows.map(f => f.createdAt.getTime()),
  ].sort();

  if (activityTimestamps.length > 5) {
    const timeDiffs = [];
    for (let i = 1; i < activityTimestamps.length; i++) {
      timeDiffs.push(activityTimestamps[i] - activityTimestamps[i - 1]);
    }

    const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    const burstCount = timeDiffs.filter(d => d < 60000).length; // < 1 minute apart

    if (burstCount > 10) {
      indicators.rapidBurst = true;
      suspicionScore += 30;
    }
  }

  // Indicator 2: All positive reviews
  if (user.reviews.length > 5) {
    const allFiveStars = user.reviews.every(r => r.rating === 5);
    if (allFiveStars) {
      indicators.allPositive = true;
      suspicionScore += 20;
    }
  }

  // Indicator 3: No diversity in activity
  const agentIds = new Set([
    ...user.reviews.map(r => r.agentId),
    ...user.hires.map(h => h.agentId),
    ...user.follows.map(f => f.agentId),
  ]);

  if (agentIds.size === 1 && user.reviews.length > 3) {
    indicators.noDiversity = true;
    suspicionScore += 25;
  }

  // Indicator 4: Review without hire
  const hiredAgentIds = new Set(user.hires.map(h => h.agentId));
  const reviewedWithoutHire = user.reviews.filter(r => !hiredAgentIds.has(r.agentId));

  if (reviewedWithoutHire.length > 0) {
    indicators.reviewWithoutHire = true;
    suspicionScore += 15;
  }

  // Indicator 5: Identical review patterns
  if (user.reviews.length > 3) {
    const reviewTexts = user.reviews.map(r => r.comment || "").filter(c => c.length > 0);
    if (reviewTexts.length > 2) {
      const similarities = [];
      for (let i = 0; i < reviewTexts.length - 1; i++) {
        for (let j = i + 1; j < reviewTexts.length; j++) {
          const sim = stringSimilarity(reviewTexts[i], reviewTexts[j]);
          similarities.push(sim);
        }
      }

      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      if (avgSimilarity > 0.7) {
        indicators.identicalReviews = true;
        suspicionScore += 20;
      }
    }
  }

  const confidence = Math.min(suspicionScore, 100);
  let action: "NONE" | "FLAG" | "WEIGHT_REDUCE" | "BAN" = "NONE";

  if (confidence >= 80) {
    action = "BAN";
  } else if (confidence >= 60) {
    action = "WEIGHT_REDUCE";
  } else if (confidence >= 40) {
    action = "FLAG";
  }

  const detection = await prisma.sybilDetection.create({
    data: {
      userId,
      indicators,
      confidence,
      action,
    },
  });

  if (action === "WEIGHT_REDUCE" || action === "BAN") {
    const newWeight = action === "BAN" ? 0 : 0.3;

    await prisma.review.updateMany({
      where: { userId },
      data: { weight: newWeight },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { suspiciousActivityScore: confidence },
    });
  }

  return NextResponse.json({ detection, indicators, confidence, action });
}

function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
