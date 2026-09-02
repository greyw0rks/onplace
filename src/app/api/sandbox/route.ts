import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, agentId, portfolioState } = body;

  if (!userId || !agentId || !portfolioState) {
    return NextResponse.json({ error: "userId, agentId, portfolioState required" }, { status: 400 });
  }

  const sandbox = await prisma.sandbox.create({
    data: {
      userId,
      agentId,
      portfolioState,
      actions: [],
    },
  });

  return NextResponse.json({ sandbox });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const sandboxes = await prisma.sandbox.findMany({
    where: { userId },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          developer: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ sandboxes });
}
