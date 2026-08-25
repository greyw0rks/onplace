import Link from "next/link";
import { listAgentsByCategory } from "@/lib/agents";
import { trustScoreOf, trustBand } from "@/lib/health-check";
import { AgentScopeCanvas } from "./agent-scope-canvas";
import { CategorySlug } from "@/generated/prisma/enums";

const CATEGORY_LABELS: Record<string, string> = {
  rebalancing: "Rebalancing",
  grid_trading: "Grid Trading",
  yield_optimisation: "Yield Optimisation",
  health_factor_monitoring: "Health Factor Monitoring",
};

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const agents = await listAgentsByCategory(category as CategorySlug | null);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-bg/90 backdrop-blur z-10">
        <div className="mx-auto max-w-[1320px] px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-cyan flex items-center justify-center font-heading font-bold text-bg text-sm">
              AP
            </div>
            <span className="font-heading text-lg font-semibold">AgentProof</span>
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm text-text-2">
              {agents.length} agents {category ? `in ${CATEGORY_LABELS[category]}` : "total"}
            </span>
            <span className="live-indicator">
              <span className="sonar-pulse inline-block"></span>
              Live
            </span>
          </div>
        </div>
      </header>

      {/* Category filter */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-[1320px] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-2 uppercase tracking-wider">Filter:</span>
            <CategoryChip href="/agents" label="All" active={!category} />
            <CategoryChip
              href="/agents?category=rebalancing"
              label="Rebalancing"
              active={category === "rebalancing"}
            />
            <CategoryChip
              href="/agents?category=grid_trading"
              label="Grid Trading"
              active={category === "grid_trading"}
            />
            <CategoryChip
              href="/agents?category=yield_optimisation"
              label="Yield Optimisation"
              active={category === "yield_optimisation"}
            />
            <CategoryChip
              href="/agents?category=health_factor_monitoring"
              label="Health Monitoring"
              active={category === "health_factor_monitoring"}
            />
          </div>
        </div>
      </div>

      {/* Agent grid */}
      <div className="mx-auto max-w-[1320px] px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const trust = trustScoreOf(agent);
            const band = trustBand(trust);
            return (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="block border border-border rounded-lg overflow-hidden hover:border-cyan/40 transition-all fade-in group"
              >
                {/* Scope visualization */}
                <div className="h-24 bg-ink border-b border-border relative overflow-hidden">
                  <AgentScopeCanvas
                    agentId={agent.id}
                    healthy={agent.healthChecks?.[0]?.success ?? true}
                    sourceType={agent.sourceType}
                  />
                </div>

                {/* Card content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-base font-semibold truncate group-hover:text-cyan transition-colors">
                        {agent.name}
                      </h3>
                      <p className="text-xs text-text-2 mt-0.5">by {agent.developer}</p>
                    </div>
                    {agent.sourceType === "self_built" && (
                      <span className="chip chip-success text-[10px] px-2 py-1 ml-2 flex-shrink-0">
                        Live
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-text-1 leading-relaxed mb-4 line-clamp-2">
                    {agent.description}
                  </p>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-text-2">Trust:</span>{" "}
                      <span className={`font-semibold text-${getTrustColor(band)}`}>
                        {trust.toFixed(1)}% {band}
                      </span>
                    </div>
                    {agent.healthChecks?.[0] && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${
                            agent.healthChecks[0].success ? "bg-green" : "bg-red"
                          }`}
                        ></span>
                        <span className="text-text-2">
                          {agent.healthChecks[0].success ? "Healthy" : "Error"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {agents.length === 0 && (
          <div className="text-center py-20">
            <p className="text-text-2">No agents found in this category.</p>
          </div>
        )}
      </div>

      {/* Ticker */}
      <Ticker />
    </div>
  );
}

function CategoryChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`chip text-[11px] px-3 py-1.5 ${active ? "chip-active" : "chip-idle"} hover:border-cyan/60 transition-colors`}
    >
      {label}
    </Link>
  );
}

function getTrustColor(band: string) {
  const map: Record<string, string> = {
    excellent: "green",
    strong: "lime",
    moderate: "amber",
    weak: "amber",
    "high-risk": "red",
  };
  return map[band] || "text-1";
}

function Ticker() {
  const logs = [
    { text: "Agent #1907 health check → 0xc15229...", color: "cyan" },
    { text: "Grid trader rebalanced 3 positions", color: "green" },
    { text: "Yield optimizer: +2.4% APY detected", color: "lime" },
    { text: "Health monitor: wallet balance OK", color: "cyan" },
    { text: "New agent registered: tokenId 2108", color: "magenta" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-ink/90 backdrop-blur overflow-hidden">
      <div className="ticker-scroll flex items-center gap-8 py-3">
        {[...logs, ...logs].map((log, i) => (
          <div key={i} className="flex items-center gap-2 text-xs whitespace-nowrap">
            <span className={`inline-block w-1.5 h-1.5 rounded-full bg-${log.color}`}></span>
            <span className="text-text-1">{log.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
