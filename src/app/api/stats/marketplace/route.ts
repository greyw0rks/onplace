import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const HOUR_MS = 60 * 60 * 1000;
const ACTIVITY_WINDOW_HOURS = 24;

export async function GET() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * HOUR_MS);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * HOUR_MS);
  const windowStart = new Date(now.getTime() - ACTIVITY_WINDOW_HOURS * HOUR_MS);

  const [
    totalAgents,
    registeredAgents,
    totalTxs,
    totalCategories,
    recentHires,
    successfulChecks,
    onchainProofs,
    openIncidents,
    activeAgentGroups,
    lastCheck,
  ] = await Promise.all([
    prisma.agent.count({ where: { verified: true, listed: true } }),
    prisma.agent.count({ where: { listed: true } }),
    prisma.healthCheck.count(),
    prisma.category.count(),
    prisma.hire.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.healthCheck.count({ where: { success: true } }),
    prisma.healthCheck.count({ where: { txHash: { not: null } } }),
    prisma.incident.count({ where: { status: { in: ["DETECTED", "INVESTIGATING"] } } }),
    prisma.healthCheck.groupBy({
      by: ["agentId"],
      where: { timestamp: { gte: windowStart } },
    }),
    prisma.healthCheck.findFirst({
      orderBy: { timestamp: "desc" },
      select: { timestamp: true },
    }),
  ]);

  const agentGrowth = await prisma.agent.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: true,
  });

  const txGrowth = await prisma.healthCheck.groupBy({
    by: ["timestamp"],
    where: { timestamp: { gte: thirtyDaysAgo } },
    _count: true,
  });

  const hireGrowth = await prisma.hire.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: true,
  });

  return NextResponse.json({
    stats: {
      totalAgents,
      totalTxs,
      totalCategories,
      recentHires,
      registeredAgents,
      activeAgents: activeAgentGroups.length,
      warnings: openIncidents,
      successfulChecks,
      failedChecks: totalTxs - successfulChecks,
      onchainProofs,
      lastCheckAt: lastCheck?.timestamp ?? null,
      activityWindowHours: ACTIVITY_WINDOW_HOURS,
      hourlyActivity: await hourlyActivity(),
    },
    growth: {
      agents: agentGrowth,
      transactions: txGrowth,
      hires: hireGrowth,
    },
  });
}

/**
 * Health checks bucketed by hour, ending with the current (partial) hour.
 * Always returns one entry per hour — including empty hours — so the client can
 * render a fixed bar chart without inventing values.
 *
 * Buckets are keyed by epoch milliseconds rather than Date objects: Prisma
 * hands back `date_trunc` results as local-time Dates, which never match a
 * UTC-aligned key.
 */
async function hourlyActivity() {
  const lastBucketMs = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
  const firstBucketMs = lastBucketMs - (ACTIVITY_WINDOW_HOURS - 1) * HOUR_MS;

  const rows = await prisma.$queryRaw<Array<{ bucket_epoch: number; checks: number }>>`
    SELECT
      extract(epoch FROM date_trunc('hour', "timestamp"))::float8 AS bucket_epoch,
      count(*)::int AS checks
    FROM "HealthCheck"
    WHERE "timestamp" >= ${new Date(firstBucketMs)}
    GROUP BY 1
    ORDER BY 1
  `;

  const counts = new Map(rows.map((r) => [Number(r.bucket_epoch) * 1000, Number(r.checks)]));

  return Array.from({ length: ACTIVITY_WINDOW_HOURS }, (_, i) => {
    const bucketMs = firstBucketMs + i * HOUR_MS;
    return {
      hour: new Date(bucketMs).toISOString(),
      checks: counts.get(bucketMs) ?? 0,
    };
  });
}
