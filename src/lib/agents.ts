import { CategorySlug } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

export function listCategories() {
  return prisma.category.findMany({
    orderBy: { slug: "asc" },
    include: { _count: { select: { agents: true } } },
  });
}

export type AgentSort = "trust" | "latency" | "price";

export function listAgentsByCategory(
  slug: CategorySlug | null,
  opts: { sort?: AgentSort } = {},
) {
  const orderBy =
    opts.sort === "latency"
      ? [{ latencyMs: "asc" as const }]
      : opts.sort === "price"
        ? [{ priceAmount: "asc" as const }]
        : [{ reputationScore: "desc" as const }, { uptimePct: "desc" as const }];

  return prisma.agent.findMany({
    where: slug ? { categorySlug: slug } : undefined,
    include: {
      category: true,
      healthChecks: { orderBy: { timestamp: "desc" }, take: 1 },
    },
    orderBy,
  });
}

export function getAgent(id: string) {
  return prisma.agent.findUnique({
    where: { id },
    include: {
      category: true,
      healthChecks: { orderBy: { timestamp: "desc" }, take: 10 },
      reviews: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export function listTopAgentsPerCategory(perCategory = 3) {
  return Promise.all(
    Object.values(CategorySlug).map((slug) =>
      prisma.agent.findMany({
        where: { categorySlug: slug },
        include: { category: true },
        orderBy: { reputationScore: "desc" },
        take: perCategory,
      }),
    ),
  );
}
