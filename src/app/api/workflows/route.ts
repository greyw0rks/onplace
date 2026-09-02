import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, agentIds, steps, name, description } = body;

  if (!userId || !steps || !Array.isArray(steps) || steps.length === 0) {
    return NextResponse.json({ error: "Invalid workflow data" }, { status: 400 });
  }

  const workflow = await prisma.workflow.create({
    data: {
      userId,
      name: name || "Untitled Workflow",
      description,
      steps,
    },
  });

  return NextResponse.json({ workflow });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    include: {
      executions: {
        orderBy: { startedAt: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ workflows });
}
