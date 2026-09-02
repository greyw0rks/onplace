import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  const sandbox = await prisma.sandbox.findUnique({
    where: { id },
    include: { agent: true },
  });

  if (!sandbox) {
    return NextResponse.json({ error: "Sandbox not found" }, { status: 404 });
  }

  // Simulate agent action
  try {
    const response = await fetch(sandbox.agent.endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portfolio: sandbox.portfolioState,
        action,
        simulation: true,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const result = await response.json();

    const updatedSandbox = await prisma.sandbox.update({
      where: { id },
      data: {
        actions: {
          push: { action, result, timestamp: new Date() },
        },
        results: result,
      },
    });

    return NextResponse.json({ sandbox: updatedSandbox, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
