import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, type, title, message, metadata } = body;

  if (!userId || !type || !title || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      metadata,
    },
  });

  return NextResponse.json({ notification });
}
