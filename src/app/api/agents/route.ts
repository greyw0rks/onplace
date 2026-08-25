import { NextRequest, NextResponse } from "next/server";
import { CategorySlug } from "@/generated/prisma/enums";
import { listAgentsByCategory, type AgentSort } from "@/lib/agents";

const VALID_SLUGS = new Set<string>(Object.values(CategorySlug));
const VALID_SORTS = new Set<AgentSort>(["trust", "latency", "price"]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const sort = searchParams.get("sort");

  if (category && !VALID_SLUGS.has(category)) {
    return NextResponse.json({ error: `Invalid category: ${category}` }, { status: 400 });
  }
  if (sort && !VALID_SORTS.has(sort as AgentSort)) {
    return NextResponse.json({ error: `Invalid sort: ${sort}` }, { status: 400 });
  }

  const agents = await listAgentsByCategory(category as CategorySlug | null, {
    sort: (sort as AgentSort) ?? undefined,
  });

  return NextResponse.json({ agents });
}
