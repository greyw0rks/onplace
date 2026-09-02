import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await prisma.hireSession.findUnique({
    where: { id },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status === "REVOKED") {
    return NextResponse.json({ error: "Session already revoked" }, { status: 400 });
  }

  const updated = await prisma.hireSession.update({
    where: { id },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });

  return NextResponse.json({ session: updated });
}
