import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const agents = await prisma.agent.findMany({
    where: { verified: true, listed: true },
    include: {
      category: true,
      healthChecks: { orderBy: { timestamp: "desc" }, take: 1 },
      _count: { select: { reviews: true, followers: true, hires: true } },
    },
    orderBy: [
      { reputationScore: "desc" },
      { performanceScore: "desc" },
      { uptimePct: "desc" },
    ],
    take: 20,
  });

  return NextResponse.json({ agents });
}
