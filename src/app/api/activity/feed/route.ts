import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const activities = await prisma.marketplaceActivity.findMany({
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
    take: 50,
  });

  return NextResponse.json({ activities });
}

export async function POST(request: Request) {
  const body = await request.json();

  const activity = await prisma.marketplaceActivity.create({
    data: {
      type: body.type,
      agentId: body.agentId,
      title: body.title,
      description: body.description,
      metadata: body.metadata,
    },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          developer: true,
        },
      },
    },
  });

  return NextResponse.json({ activity });
}
