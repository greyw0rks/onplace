import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TestStatus } from "@/generated/prisma/enums";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { agentId, suiteId, testCaseId } = body;

  if (!agentId) {
    return NextResponse.json({ error: "agentId required" }, { status: 400 });
  }

  let testCases;
  if (testCaseId) {
    testCases = await prisma.testCase.findMany({
      where: { id: testCaseId },
      include: { suite: true },
    });
  } else if (suiteId) {
    testCases = await prisma.testCase.findMany({
      where: { suiteId },
      include: { suite: true },
    });
  } else {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { categorySlug: true },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    testCases = await prisma.testCase.findMany({
      where: {
        suite: {
          category: agent.categorySlug,
          hidden: false,
        },
      },
      include: { suite: true },
    });
  }

  const results = [];
  for (const testCase of testCases) {
    const result = await runTest(agentId, testCase);
    results.push(result);
  }

  const passed = results.filter((r) => r.status === "PASSED").length;
  const failed = results.filter((r) => r.status === "FAILED").length;

  await prisma.agent.update({
    where: { id: agentId },
    data: {
      performanceScore: (passed / results.length) * 100,
    },
  });

  return NextResponse.json({
    results,
    summary: {
      total: results.length,
      passed,
      failed,
      passRate: (passed / results.length) * 100,
    },
  });
}

async function runTest(agentId: string, testCase: any) {
  const started = Date.now();

  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    const spec = testCase.spec as any;
    const timeout = testCase.timeout || 30000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let status: TestStatus = "PASSED";
    let score = 100;
    let error = null;
    let output = null;

    try {
      const response = await fetch(agent.endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(spec.input || {}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        status = "FAILED";
        error = `HTTP ${response.status}`;
        score = 0;
      } else {
        output = await response.json();

        if (spec.expectedOutput) {
          const matches = compareOutput(output, spec.expectedOutput);
          if (!matches) {
            status = "FAILED";
            error = "Output mismatch";
            score = 50;
          }
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        status = "TIMEOUT";
        error = "Test timed out";
      } else {
        status = "ERROR";
        error = err.message;
      }
      score = 0;
    }

    const latencyMs = Date.now() - started;

    const result = await prisma.testResult.create({
      data: {
        testCaseId: testCase.id,
        agentId,
        status,
        score,
        latencyMs,
        error,
        output,
      },
    });

    return result;
  } catch (err: any) {
    const latencyMs = Date.now() - started;

    return await prisma.testResult.create({
      data: {
        testCaseId: testCase.id,
        agentId,
        status: "ERROR",
        score: 0,
        latencyMs,
        error: err.message,
      },
    });
  }
}

function compareOutput(actual: any, expected: any): boolean {
  if (typeof expected !== "object") {
    return actual === expected;
  }

  for (const key in expected) {
    if (actual[key] !== expected[key]) {
      return false;
    }
  }

  return true;
}
