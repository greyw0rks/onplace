import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeAndPersistTrust } from "@/lib/trust";

/**
 * Human-facing trust recalculation. The model itself lives in lib/trust.ts so
 * this and the paid agent-to-agent endpoint can't drift apart.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await computeAndPersistTrust(id);

  if (!result) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json({
    calculation: result.calculation,
    finalTrustScore: result.breakdown.finalTrustScore,
    sampleSizes: result.breakdown.sampleSizes,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const calculations = await prisma.trustCalculation.findMany({
    where: { agentId: id },
    orderBy: { calculatedAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ calculations });
}
