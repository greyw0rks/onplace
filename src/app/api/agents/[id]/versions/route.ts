import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const versions = await prisma.agentVersion.findMany({
    where: { agentId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ versions });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const version = await prisma.agentVersion.create({
    data: {
      agentId: body.agentId,
      version: body.version,
      releaseNotes: body.releaseNotes,
      commitHash: body.commitHash,
      buildFingerprint: body.buildFingerprint,
      verificationStatus: body.verificationStatus || "PENDING",
      performanceScore: body.performanceScore,
      testsPassed: body.testsPassed,
      testsFailed: body.testsFailed,
    },
  });

  await prisma.agent.update({
    where: { id: body.agentId },
    data: { currentVersion: body.version },
  });

  return NextResponse.json({ version });
}
