import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const agents = await prisma.agent.findMany({
    where: {
      OR: [
        { updatedAt: { gte: twentyFourHoursAgo } },
        { hires: { some: { createdAt: { gte: twentyFourHoursAgo } } } },
      ],
    },
    include: {
      category: true,
      healthChecks: { orderBy: { timestamp: "desc" }, take: 1 },
      _count: { select: { reviews: true, followers: true, hires: true } },
    },
    orderBy: [
      { trendingScore: "desc" },
      { viewCount: "desc" },
      { hireCount: "desc" },
    ],
    take: 20,
  });

  return NextResponse.json({ agents });
}
