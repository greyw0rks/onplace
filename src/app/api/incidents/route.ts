import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { agentId, severity, title, description } = body;

  if (!agentId || !severity || !title || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const incident = await prisma.incident.create({
    data: {
      agentId,
      severity,
      status: "DETECTED",
      title,
      description,
    },
  });

  if (severity === "CRITICAL" || severity === "ERROR") {
    await prisma.agent.update({
      where: { id: agentId },
      data: { verified: false },
    });

    await prisma.notification.create({
      data: {
        userId: agentId,
        type: "SECURITY_ALERT",
        title: `Critical Incident: ${title}`,
        message: description,
        metadata: { incidentId: incident.id },
      },
    });
  }

  return NextResponse.json({ incident });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const agentId = searchParams.get("agentId");
  const status = searchParams.get("status");

  const incidents = await prisma.incident.findMany({
    where: {
      ...(agentId && { agentId }),
      ...(status && { status: status as any }),
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
    orderBy: { detectedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ incidents });
}
