import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { agentId } = body;

  const testResults = await prisma.testResult.findMany({
    where: {
      agentId,
      status: "FAILED",
    },
    include: {
      testCase: {
        include: {
          suite: true,
        },
      },
    },
    orderBy: { executedAt: "desc" },
    take: 20,
  });

  const insights = [];

  for (const result of testResults) {
    const category = analyzeFailureCategory(result);
    const recommendation = generateRecommendation(result, category);
    const priority = calculatePriority(result);

    const insight = await prisma.testFailureInsight.create({
      data: {
        testResultId: result.id,
        category,
        recommendation,
        priority,
      },
    });

    insights.push(insight);
  }

  return NextResponse.json({ insights });
}

function analyzeFailureCategory(result: any): string {
  if (result.status === "TIMEOUT") return "PERFORMANCE";
  if (result.error?.includes("connection")) return "CONNECTIVITY";
  if (result.error?.includes("parse") || result.error?.includes("JSON")) return "DATA_FORMAT";
  if (result.error?.includes("unauthorized") || result.error?.includes("forbidden")) return "AUTHENTICATION";
  return "LOGIC_ERROR";
}

function generateRecommendation(result: any, category: string): string {
  const recommendations: Record<string, string> = {
    PERFORMANCE: `Test timed out after ${result.testCase.timeout}ms. Consider optimizing query performance or increasing timeout. Check for N+1 queries, unindexed database lookups, or blocking I/O.`,
    CONNECTIVITY: `Connection error detected. Verify endpoint URL is correct, check network configuration, and ensure the service is running. Consider adding retry logic with exponential backoff.`,
    DATA_FORMAT: `Data parsing failed. Ensure response format matches expected schema. Add input validation and handle edge cases. Consider using TypeScript for type safety.`,
    AUTHENTICATION: `Authentication issue detected. Verify API keys are configured correctly, check token expiration, and ensure proper permission levels are set.`,
    LOGIC_ERROR: `Logic error in test '${result.testCase.name}'. Review test expectations, check business logic implementation, and ensure edge cases are handled.`,
  };

  return recommendations[category] || "Review test implementation and agent logic.";
}

function calculatePriority(result: any): number {
  let priority = 5;

  if (result.status === "TIMEOUT") priority += 3;
  if (result.testCase.weight > 1.5) priority += 2;

  return Math.min(priority, 10);
}
