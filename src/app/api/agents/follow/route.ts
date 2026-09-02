import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, agentId } = body;

  if (!userId || !agentId) {
    return NextResponse.json({ error: "userId and agentId required" }, { status: 400 });
  }

  const existing = await prisma.userFollow.findUnique({
    where: { userId_agentId: { userId, agentId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Already following" }, { status: 400 });
  }

  const follow = await prisma.userFollow.create({
    data: { userId, agentId },
  });

  await prisma.agent.update({
    where: { id: agentId },
    data: { followCount: { increment: 1 } },
  });

  return NextResponse.json({ follow });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");
  const agentId = searchParams.get("agentId");

  if (!userId || !agentId) {
    return NextResponse.json({ error: "userId and agentId required" }, { status: 400 });
  }

  await prisma.userFollow.delete({
    where: { userId_agentId: { userId, agentId } },
  });

  await prisma.agent.update({
    where: { id: agentId },
    data: { followCount: { decrement: 1 } },
  });

  return NextResponse.json({ success: true });
}
