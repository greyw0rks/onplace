import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const notification = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  return NextResponse.json({ notification });
}
