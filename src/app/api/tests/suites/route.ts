import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const includeHidden = searchParams.get("includeHidden") === "true";

  const suites = await prisma.testSuite.findMany({
    where: {
      ...(category && { category: category as any }),
      ...(includeHidden ? {} : { hidden: false }),
    },
    include: {
      testCases: true,
      _count: { select: { testCases: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ suites });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const suite = await prisma.testSuite.create({
    data: {
      name: body.name,
      category: body.category,
      description: body.description,
      hidden: body.hidden || false,
    },
  });

  return NextResponse.json({ suite });
}
