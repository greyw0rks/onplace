import Link from "next/link";
import { CategorySlug } from "@/generated/prisma/enums";
import { listAgentsByCategory, type AgentSort } from "@/lib/agents";
import { trustScoreOf, trustBand } from "@/lib/health-check";

const CATEGORY_LABELS: Record<string, string> = {
  rebalancing: "Rebalancing",
  grid_trading: "Grid Trading",
  yield_optimisation: "Yield Optimisation",
  health_factor_monitoring: "Health Factor Monitoring",
};

const TRUST_BAND_CLASSES: Record<string, string> = {
  excellent: "text-trust-excellent",
  strong: "text-trust-strong",
  moderate: "text-trust-moderate",
  weak: "text-trust-weak",
  "high-risk": "text-trust-high-risk",
};

const SORTS: { value: AgentSort; label: string }[] = [
  { value: "trust", label: "Trust" },
  { value: "latency", label: "Latency" },
  { value: "price", label: "Price" },
];

function isCategorySlug(value: string | undefined): value is CategorySlug {
  return !!value && Object.values(CategorySlug).includes(value as CategorySlug);
}

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; q?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = isCategorySlug(params.category) ? params.category : null;
  const activeSort: AgentSort = params.sort === "latency" || params.sort === "price" ? params.sort : "trust";
  const query = params.q?.trim().toLowerCase() ?? "";

  const agents = await listAgentsByCategory(activeCategory, { sort: activeSort });
  const filtered = query
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query),
      )
    : agents;

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <h1 className="font-heading text-3xl font-bold">Agents</h1>
        <p className="mt-2 text-foreground-muted">
          Browse continuously verified AI agents on BNB Chain.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Link
            href="/agents"
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              !activeCategory
                ? "border-primary bg-primary text-foreground"
                : "border-border bg-surface text-foreground-muted hover:border-primary"
            }`}
          >
            All
          </Link>
          {Object.values(CategorySlug).map((slug) => (
            <Link
              key={slug}
              href={`/agents?category=${slug}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === slug
                  ? "border-primary bg-primary text-foreground"
                  : "border-border bg-surface text-foreground-muted hover:border-primary"
              }`}
            >
              {CATEGORY_LABELS[slug]}
            </Link>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-foreground-muted">Sort by</span>
            {SORTS.map((s) => (
              <Link
                key={s.value}
                href={{
                  pathname: "/agents",
                  query: { ...(activeCategory ? { category: activeCategory } : {}), sort: s.value },
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeSort === s.value
                    ? "bg-surface-elevated text-foreground"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => {
            const score = trustScoreOf(agent);
            const band = trustBand(score);
            return (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-heading text-lg font-bold">{agent.name}</span>
                    <p className="text-sm text-foreground-muted">{agent.developer}</p>
                  </div>
                  <span className={`font-mono text-lg font-semibold ${TRUST_BAND_CLASSES[band]}`}>
                    {score}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-foreground-muted">{agent.description}</p>
                <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-foreground-muted">
                  <span>{CATEGORY_LABELS[agent.categorySlug]}</span>
                  <span className="font-mono">
                    {agent.latencyMs != null ? `${agent.latencyMs}ms` : "—"} ·{" "}
                    {agent.uptimePct != null ? `${Math.round(agent.uptimePct * 100)}% up` : "not checked"}
                  </span>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center text-foreground-muted">
              No agents found. Try a different category or search term.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
