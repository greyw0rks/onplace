import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const agentId = searchParams.get("agentId");

  const schedules = await prisma.testSchedule.findMany({
    where: agentId ? { agentId } : undefined,
    include: {
      agent: { select: { id: true, name: true } },
      suite: { select: { id: true, name: true } },
    },
    orderBy: { nextRun: "asc" },
  });

  return NextResponse.json({ schedules });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const schedule = await prisma.testSchedule.create({
    data: {
      agentId: body.agentId,
      suiteId: body.suiteId,
      category: body.category,
      frequency: body.frequency,
      enabled: body.enabled !== false,
      nextRun: new Date(body.nextRun || Date.now() + 3600000), // Default 1 hour from now
    },
  });

  return NextResponse.json({ schedule });
}
