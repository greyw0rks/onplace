import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, agentIds } = body;

  if (!agentIds || agentIds.length < 2 || agentIds.length > 5) {
    return NextResponse.json({ error: "Provide 2-5 agent IDs to compare" }, { status: 400 });
  }

  const comparison = await prisma.comparison.create({
    data: {
      userId,
      agentIds,
    },
  });

  const agents = await prisma.agent.findMany({
    where: { id: { in: agentIds } },
    include: {
      category: true,
      healthChecks: { orderBy: { timestamp: "desc" }, take: 1 },
      reviews: { where: { verified: true } },
      testResults: { orderBy: { executedAt: "desc" }, take: 10 },
      trustCalculations: { orderBy: { calculatedAt: "desc" }, take: 1 },
      securityAudits: { orderBy: { auditedAt: "desc" }, take: 1 },
      _count: { select: { reviews: true, hires: true, followers: true } },
    },
  });

  return NextResponse.json({ comparison, agents });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ids = searchParams.get("ids")?.split(",");

  if (!ids || ids.length < 2) {
    return NextResponse.json({ error: "Provide 2+ agent IDs" }, { status: 400 });
  }

  const agents = await prisma.agent.findMany({
    where: { id: { in: ids } },
    include: {
      category: true,
      healthChecks: { orderBy: { timestamp: "desc" }, take: 1 },
      reviews: { where: { verified: true } },
      testResults: { orderBy: { executedAt: "desc" }, take: 10 },
      trustCalculations: { orderBy: { calculatedAt: "desc" }, take: 1 },
      securityAudits: { orderBy: { auditedAt: "desc" }, take: 1 },
      _count: { select: { reviews: true, hires: true, followers: true } },
    },
  });

  return NextResponse.json({ agents });
}
