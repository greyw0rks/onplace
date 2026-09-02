import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const profile = await prisma.developerProfile.findUnique({
    where: { userId },
    include: {
      user: {
        include: {
          reviews: {
            where: { verified: true },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
    },
  });

  if (!profile) {
    const newProfile = await prisma.developerProfile.create({
      data: { userId },
    });
    return NextResponse.json({ profile: newProfile });
  }

  return NextResponse.json({ profile });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId } = body;

  const agents = await prisma.agent.findMany({
    where: { developer: userId },
    include: {
      hires: { where: { status: "completed" } },
      reviews: { where: { verified: true } },
      revenueRecords: true,
    },
  });

  const agentCount = agents.length;
  const totalHires = agents.reduce((sum, a) => sum + a.hires.length, 0);
  const totalRevenue = agents
    .reduce((sum, a) => {
      return sum + a.revenueRecords.reduce((s, r) => s + parseFloat(r.amount), 0);
    }, 0)
    .toString();

  const allReviews = agents.flatMap(a => a.reviews);
  const avgRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : null;

  const profile = await prisma.developerProfile.upsert({
    where: { userId },
    update: { agentCount, totalRevenue, totalHires, avgRating },
    create: { userId, agentCount, totalRevenue, totalHires, avgRating },
  });

  return NextResponse.json({ profile });
}
