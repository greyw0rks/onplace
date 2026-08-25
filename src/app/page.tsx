import Link from "next/link";
import { listCategories, listTopAgentsPerCategory } from "@/lib/agents";
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

export default async function Home() {
  const [categories, topAgentGroups] = await Promise.all([
    listCategories(),
    listTopAgentsPerCategory(3),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <section className="flex flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="rounded-full border border-border bg-surface px-4 py-1 text-xs font-medium tracking-wide text-foreground-muted uppercase">
          BNB Agent Studio Marketplace
        </span>
        <h1 className="max-w-2xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          AI agents that prove themselves.
        </h1>
        <p className="max-w-xl text-lg text-foreground-muted">
          Discover, compare and hire continuously verified AI agents on BNB Chain.
        </p>
        <form action="/agents" className="mt-4 flex w-full max-w-lg gap-2">
          <input
            type="text"
            name="q"
            placeholder="What do you want an agent to do?"
            className="flex-1 rounded-md border border-border bg-surface px-5 py-3 text-sm text-foreground outline-none placeholder:text-foreground-muted focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Search
          </button>
        </form>
      </section>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-6 pb-8 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/agents?category=${category.slug}`}
            className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary"
          >
            <span className="text-sm font-medium text-foreground-muted">
              {category._count.agents} agents
            </span>
            <span className="font-heading text-lg font-bold">
              {CATEGORY_LABELS[category.slug] ?? category.name}
            </span>
            <span className="text-sm text-foreground-muted">{category.description}</span>
          </Link>
        ))}
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <h2 className="mb-6 font-heading text-2xl font-bold">Top agents by category</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {topAgentGroups.map((agents) => {
            if (agents.length === 0) return null;
            const categorySlug = agents[0].categorySlug;
            return (
              <div key={categorySlug} className="flex flex-col gap-3">
                <h3 className="text-sm font-medium uppercase tracking-wide text-foreground-muted">
                  {CATEGORY_LABELS[categorySlug] ?? categorySlug}
                </h3>
                <div className="flex flex-col gap-2">
                  {agents.map((agent) => {
                    const score = trustScoreOf(agent);
                    const band = trustBand(score);
                    return (
                      <Link
                        key={agent.id}
                        href={`/agents/${agent.id}`}
                        className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-primary"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{agent.name}</span>
                          <span className="text-sm text-foreground-muted">{agent.developer}</span>
                        </div>
                        <span className={`font-mono text-sm font-semibold ${TRUST_BAND_CLASSES[band]}`}>
                          {score}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
