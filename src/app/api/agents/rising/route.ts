import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Agents with the most momentum over the last 7 days: recent successful checks
 * first, recent hires as the tiebreak.
 *
 * This deliberately does NOT use $queryRaw. The previous version did, and spelled
 * its columns in snake_case (a.reputation_score, h.created_at) — but the schema
 * declares no @map, so the real Postgres columns are quoted camelCase and every
 * request 500'd. The discover page's fetch helper swallowed it into an empty
 * section, so it failed silently for weeks. Prisma's query builder can express
 * this, so let it own the column names.
 */
export async function GET() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [recentSuccesses, recentHires] = await Promise.all([
    prisma.healthCheck.groupBy({
      by: ["agentId"],
      where: { success: true, timestamp: { gte: sevenDaysAgo } },
      _count: { _all: true },
    }),
    prisma.hire.groupBy({
      by: ["agentId"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { _all: true },
    }),
  ]);

  const successCount = new Map(recentSuccesses.map((r) => [r.agentId, r._count._all]));
  const hireCount = new Map(recentHires.map((r) => [r.agentId, r._count._all]));

  const candidateIds = [...new Set([...successCount.keys(), ...hireCount.keys()])];

  if (candidateIds.length === 0) {
    return NextResponse.json({ agents: [] });
  }

  const agents = await prisma.agent.findMany({
    where: { id: { in: candidateIds }, listed: true, reputationScore: { not: null } },
    include: {
      category: true,
      healthChecks: { orderBy: { timestamp: "desc" }, take: 1 },
      _count: { select: { reviews: true, followers: true, hires: true } },
    },
  });

  const ranked = agents
    .map((agent) => ({
      ...agent,
      recentSuccesses: successCount.get(agent.id) ?? 0,
      recentHires: hireCount.get(agent.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.recentSuccesses - a.recentSuccesses ||
        b.recentHires - a.recentHires ||
        (b.reputationScore ?? 0) - (a.reputationScore ?? 0)
    )
    .slice(0, 20);

  return NextResponse.json({ agents: ranked });
}
