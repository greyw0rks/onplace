import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const agents = await prisma.$queryRaw<any[]>`
    SELECT
      a.*,
      COUNT(DISTINCT CASE WHEN h.created_at >= ${sevenDaysAgo} THEN h.id END) as recent_hires,
      COUNT(DISTINCT CASE WHEN hc.timestamp >= ${sevenDaysAgo} AND hc.success = true THEN hc.id END) as recent_successes,
      COALESCE(
        (a.reputation_score - LAG(a.reputation_score, 7) OVER (PARTITION BY a.id ORDER BY a.updated_at)) / NULLIF(LAG(a.reputation_score, 7) OVER (PARTITION BY a.id ORDER BY a.updated_at), 0),
        0
      ) as score_delta
    FROM "Agent" a
    LEFT JOIN "Hire" h ON h.agent_id = a.id
    LEFT JOIN "HealthCheck" hc ON hc.agent_id = a.id
    WHERE a.reputation_score IS NOT NULL
    GROUP BY a.id
    ORDER BY recent_successes DESC, recent_hires DESC
    LIMIT 20
  `;

  for (const agent of agents) {
    const fullAgent = await prisma.agent.findUnique({
      where: { id: agent.id },
      include: {
        category: true,
        healthChecks: { orderBy: { timestamp: "desc" }, take: 1 },
        _count: { select: { reviews: true, followers: true, hires: true } },
      },
    });
    Object.assign(agent, fullAgent);
  }

  return NextResponse.json({ agents });
}
