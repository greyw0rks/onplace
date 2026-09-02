import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    hireId,
    maxTransactionAmount,
    dailySpendingLimit,
    sessionSpendingLimit,
    allowedContracts,
    allowedActions,
    durationHours,
  } = body;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (durationHours || 24));

  const session = await prisma.hireSession.create({
    data: {
      hireId,
      maxTransactionAmount,
      dailySpendingLimit,
      sessionSpendingLimit,
      allowedContracts: allowedContracts || [],
      allowedActions: allowedActions || [],
      status: "ACTIVE",
      expiresAt,
    },
  });

  return NextResponse.json({ session });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const hireId = searchParams.get("hireId");
  const status = searchParams.get("status");

  const sessions = await prisma.hireSession.findMany({
    where: {
      ...(hireId && { hireId }),
      ...(status && { status: status as any }),
    },
    include: {
      hire: {
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              developer: true,
            },
          },
        },
      },
      transactions: {
        orderBy: { submittedAt: "desc" },
        take: 10,
      },
    },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json({ sessions });
}
