import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const battles = await prisma.agentBattle.findMany({
    include: {
      participants: {
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              developer: true,
            },
          },
        },
        orderBy: { rank: "asc" },
      },
    },
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ battles });
}

export async function POST(request: Request) {
  const body = await request.json();

  const battle = await prisma.agentBattle.create({
    data: {
      name: body.name,
      description: body.description,
      category: body.category,
      taskSpec: body.taskSpec,
      status: "PENDING",
      startedAt: new Date(),
    },
  });

  return NextResponse.json({ battle });
}
