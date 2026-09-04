import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trustScoreOf } from "@/lib/health-check";
import { getCategoryColor } from "@/lib/network-layout";

export async function GET() {
  try {
    // Fetch top 50 agents by activity
    const agents = await prisma.agent.findMany({
      // The homepage canvas is a marketplace view, so it shows only listed agents.
      where: { listed: true },
      take: 50,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        healthChecks: {
          take: 1,
          orderBy: { timestamp: 'desc' },
        },
        hires: {
          take: 10,
          select: { userId: true },
        },
      },
    });

    // Build nodes
    const nodes = agents.map((agent) => {
      const trust = trustScoreOf(agent);
      const lastCheck = agent.healthChecks[0];
      const isActive = lastCheck
        ? Date.now() - new Date(lastCheck.timestamp).getTime() < 3600000 // 1 hour
        : false;

      return {
        id: agent.id,
        name: agent.name,
        x: 0,
        y: 0,
        size: Math.max(10, Math.min(40, trust / 2.5)), // 0-100 → 10-40px
        category: agent.categorySlug,
        color: getCategoryColor(agent.categorySlug),
        active: isActive,
        trustScore: trust,
        developer: agent.developer,
      };
    });

    // Build edges (connections between agents)
    const edges: Array<{
      source: string;
      target: string;
      type: string;
      strength: number;
    }> = [];

    // Connect agents by same developer
    const developerGroups = new Map<string, string[]>();
    agents.forEach((agent) => {
      const group = developerGroups.get(agent.developer) || [];
      group.push(agent.id);
      developerGroups.set(agent.developer, group);
    });

    developerGroups.forEach((group) => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          edges.push({
            source: group[i],
            target: group[j],
            type: 'same_developer',
            strength: 1.0,
          });
        }
      }
    });

    // Connect agents by same category (weaker connection)
    const categoryGroups = new Map<string, string[]>();
    agents.forEach((agent) => {
      const group = categoryGroups.get(agent.categorySlug) || [];
      group.push(agent.id);
      categoryGroups.set(agent.categorySlug, group);
    });

    categoryGroups.forEach((group) => {
      // Limit connections to avoid clutter
      for (let i = 0; i < Math.min(group.length, 5); i++) {
        for (let j = i + 1; j < Math.min(group.length, 5); j++) {
          // Only add if not already connected
          const exists = edges.some(
            (e) =>
              (e.source === group[i] && e.target === group[j]) ||
              (e.source === group[j] && e.target === group[i])
          );
          if (!exists) {
            edges.push({
              source: group[i],
              target: group[j],
              type: 'similar_category',
              strength: 0.3,
            });
          }
        }
      }
    });

    // Connect agents hired by same users
    const userHireMap = new Map<string, Set<string>>();
    agents.forEach((agent) => {
      agent.hires.forEach((hire) => {
        if (!hire.userId) return;
        const set = userHireMap.get(hire.userId) || new Set();
        set.add(agent.id);
        userHireMap.set(hire.userId, set);
      });
    });

    userHireMap.forEach((agentIds) => {
      const ids = Array.from(agentIds);
      if (ids.length > 1) {
        for (let i = 0; i < Math.min(ids.length, 3); i++) {
          for (let j = i + 1; j < Math.min(ids.length, 3); j++) {
            const exists = edges.some(
              (e) =>
                (e.source === ids[i] && e.target === ids[j]) ||
                (e.source === ids[j] && e.target === ids[i])
            );
            if (!exists) {
              edges.push({
                source: ids[i],
                target: ids[j],
                type: 'user_cohire',
                strength: 0.5,
              });
            }
          }
        }
      }
    });

    return NextResponse.json({
      nodes,
      edges,
    });
  } catch (error) {
    console.error("Network API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch network data" },
      { status: 500 }
    );
  }
}
