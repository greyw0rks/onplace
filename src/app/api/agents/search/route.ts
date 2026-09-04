import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CategorySlug, RiskLevel } from "@/generated/prisma/enums";

interface SearchFilters {
  query?: string;
  category?: CategorySlug;
  chain?: string;
  protocol?: string;
  capability?: string;
  riskLevel?: RiskLevel;
  minTrust?: number;
  maxPrice?: string;
  verified?: boolean;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const filters: SearchFilters = {
    query: searchParams.get("q") || undefined,
    category: searchParams.get("category") as CategorySlug | undefined,
    chain: searchParams.get("chain") || undefined,
    protocol: searchParams.get("protocol") || undefined,
    capability: searchParams.get("capability") || undefined,
    riskLevel: searchParams.get("riskLevel") as RiskLevel | undefined,
    minTrust: searchParams.get("minTrust") ? parseFloat(searchParams.get("minTrust")!) : undefined,
    maxPrice: searchParams.get("maxPrice") || undefined,
    verified: searchParams.get("verified") === "true" ? true : undefined,
  };

  const userId = searchParams.get("userId") || undefined;

  // Unlisted agents (duplicate registrations, unresolvable endpoints) never
  // appear in search — see Agent.listed.
  const where: any = { listed: true };

  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: "insensitive" } },
      { description: { contains: filters.query, mode: "insensitive" } },
      { developer: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  if (filters.category) {
    where.categorySlug = filters.category;
  }

  if (filters.chain) {
    where.supportedChains = { has: filters.chain };
  }

  if (filters.protocol) {
    where.supportedProtocols = { has: filters.protocol };
  }

  if (filters.capability) {
    where.capabilities = { has: filters.capability };
  }

  if (filters.riskLevel) {
    where.riskLevel = filters.riskLevel;
  }

  if (filters.minTrust !== undefined) {
    where.reputationScore = { gte: filters.minTrust };
  }

  if (filters.maxPrice) {
    where.priceAmount = { lte: filters.maxPrice };
  }

  if (filters.verified) {
    where.verified = true;
  }

  const agents = await prisma.agent.findMany({
    where,
    include: {
      category: true,
      healthChecks: { orderBy: { timestamp: "desc" }, take: 1 },
      _count: { select: { reviews: true, followers: true } },
    },
    orderBy: [
      { featured: "desc" },
      { reputationScore: "desc" },
      { uptimePct: "desc" },
    ],
    take: 50,
  });

  await prisma.searchQuery.create({
    data: {
      userId,
      query: filters.query || "",
      filters: filters as any,
      resultCount: agents.length,
    },
  });

  return NextResponse.json({ agents, count: agents.length });
}
