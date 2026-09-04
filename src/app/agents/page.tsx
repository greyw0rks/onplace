import Link from "next/link";
import { Boxes, ShieldCheck, Activity } from "lucide-react";
import { listAgentsByCategory } from "@/lib/agents";
import { trustScoreOf, trustBand } from "@/lib/health-check";
import { SpatialPage } from "../components/spatial/SpatialPage";
import { PanelHeader, PanelMetric, PanelStat, PanelSection } from "../components/spatial/PanelHeader";
import { CanvasScroll, CanvasGrid, CanvasEmpty } from "../components/spatial/CanvasScroll";
import { AgentCard } from "../components/spatial/AgentCard";
import { getCategoryColor } from "@/lib/network-layout";
import { CategorySlug } from "@/generated/prisma/enums";

const CATEGORIES: Array<{ slug: CategorySlug | null; label: string }> = [
  { slug: null, label: "All categories" },
  { slug: "health_factor_monitoring", label: "Health monitoring" },
  { slug: "grid_trading", label: "Grid trading" },
  { slug: "yield_optimisation", label: "Yield optimisation" },
  { slug: "rebalancing", label: "Rebalancing" },
];

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const agents = await listAgentsByCategory((category as CategorySlug) ?? null);

  const cards = agents.map((agent) => {
    const trust = trustScoreOf(agent);
    return {
      id: agent.id,
      name: agent.name,
      developer: agent.developer,
      description: agent.description,
      category: agent.categorySlug,
      trust,
      band: trustBand(trust),
      status: agent.status,
      capabilities: agent.capabilities,
      protocols: agent.supportedProtocols,
      uptimePct: agent.uptimePct,
      latencyMs: agent.latencyMs,
      healthy: agent.healthChecks?.[0]?.success ?? null,
      live: agent.sourceType === "self_built",
    };
  });

  const verified = agents.filter((a) => a.verified).length;
  const healthy = cards.filter((c) => c.healthy === true).length;
  const checked = cards.filter((c) => c.healthy != null).length;
  const activeLabel = CATEGORIES.find((c) => c.slug === (category ?? null))?.label ?? "All categories";

  return (
    <SpatialPage
      status={`${agents.length} agents · ${activeLabel.toLowerCase()}`}
      left={
        <>
          <PanelHeader
            breadcrumb="Marketplace / Browse"
            title={
              <>
                Agent
                <br />
                Registry
              </>
            }
          />

          <div className="grid grid-cols-3 gap-4 mb-3">
            <PanelMetric icon={<Boxes className="w-3.5 h-3.5 text-[#808080]" />} label="Listed" value={agents.length} />
            <PanelMetric icon={<ShieldCheck className="w-3.5 h-3.5 text-[#FF7A00]" />} label="Verified" value={verified} />
            <PanelMetric icon={<Activity className="w-3.5 h-3.5 text-[#808080]" />} label="Healthy" value={healthy} />
          </div>

          <p className="text-[10px] text-[#808080] leading-relaxed mb-8 pb-6 border-b border-black/10">
            Verified means an ERC-8004 on-chain identity, a passing health check on our last sweep,
            and 80%+ uptime across recorded checks. It is revoked automatically when an endpoint
            stops responding.
          </p>

          <PanelSection label="Category" className="mb-8">
            <div className="flex flex-col">
              {CATEGORIES.map(({ slug, label }) => {
                const active = (category ?? null) === slug;
                const count = slug ? agents.filter((a) => a.categorySlug === slug).length : agents.length;
                return (
                  <Link
                    key={label}
                    href={slug ? `/agents?category=${slug}` : "/agents"}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between py-2.5 px-3 -mx-3 text-xs border-l-2 transition ${
                      active
                        ? "border-[#FF7A00] bg-[#FF7A00]/10 text-[#111111] font-semibold"
                        : "border-transparent text-[#808080] hover:text-[#111111] hover:bg-black/[0.03]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {slug && (
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ background: getCategoryColor(slug) }}
                        />
                      )}
                      {label}
                    </span>
                    <span className="tabular-nums">{count}</span>
                  </Link>
                );
              })}
            </div>
          </PanelSection>

          <PanelSection label="Health" className="mt-auto">
            <PanelStat
              value={checked > 0 ? `${Math.round((healthy / checked) * 100)}%` : "—"}
              caption={
                <>
                  responding
                  <br />
                  <span className="text-[#111111]">{healthy}</span> of {checked} checked
                </>
              }
            />
            {checked < agents.length && (
              <p className="text-[10px] text-[#808080] mt-4">
                {agents.length - checked} agents have no health check yet
              </p>
            )}
          </PanelSection>
        </>
      }
      right={
        <CanvasScroll>
          <CanvasGrid>
            {cards.length > 0 ? (
              cards.map((agent) => <AgentCard key={agent.id} agent={agent} />)
            ) : (
              <CanvasEmpty>No agents in this category.</CanvasEmpty>
            )}
          </CanvasGrid>
        </CanvasScroll>
      }
    />
  );
}
