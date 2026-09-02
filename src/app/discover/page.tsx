import { Suspense } from "react";
import { Compass, ShieldCheck } from "lucide-react";
import { SearchBar } from "../components/SearchBar";
import { FilterPanel } from "../components/FilterPanel";
import { SpatialPage } from "../components/spatial/SpatialPage";
import { PanelHeader, PanelMetric, PanelSection } from "../components/spatial/PanelHeader";
import { CanvasScroll, CanvasGrid, CanvasEmpty } from "../components/spatial/CanvasScroll";
import { AgentCard, AgentCardData } from "../components/spatial/AgentCard";
import { trustBand } from "@/lib/health-check";
import { fetchInternalJson } from "@/lib/base-url";

interface DiscoverAgent {
  id: string;
  name: string;
  developer: string;
  description: string;
  categorySlug: string;
  reputationScore: number | null;
  uptimePct: number | null;
  verified: boolean;
  _count?: { reviews?: number; hires?: number };
}

const FILTER_KEYS = ["q", "category", "chain", "riskLevel", "capability", "minTrust", "verified"] as const;

async function fetchAgents(path: string): Promise<{ agents: DiscoverAgent[]; count?: number }> {
  return fetchInternalJson<{ agents: DiscoverAgent[]; count?: number }>(path, { agents: [] });
}

function toCard(agent: DiscoverAgent): AgentCardData {
  const trust = Math.round((agent.reputationScore ?? 0) * 0.6 + (agent.uptimePct ?? 0) * 40);
  return {
    id: agent.id,
    name: agent.name,
    developer: agent.developer,
    description: agent.description,
    category: agent.categorySlug,
    trust,
    band: trustBand(trust),
    live: agent.verified,
    footer: `${agent._count?.hires ?? 0} hires`,
  };
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const activeFilters = FILTER_KEYS.filter((key) => params[key]);
  const hasFilters = activeFilters.length > 0;

  const search = new URLSearchParams();
  FILTER_KEYS.forEach((key) => {
    if (params[key]) search.set(key, params[key]!);
  });

  const sections = hasFilters
    ? [{ title: `Results for your filters`, agents: (await fetchAgents(`/api/agents/search?${search}`)).agents }]
    : await Promise.all(
        [
          { title: "Top agents", path: "/api/agents/top" },
          { title: "Rising", path: "/api/agents/rising" },
          { title: "Trending now", path: "/api/agents/trending" },
          { title: "Recently verified", path: "/api/agents/verified" },
        ].map(async ({ title, path }) => ({ title, agents: (await fetchAgents(path)).agents.slice(0, 6) }))
      );

  const total = sections.reduce((sum, s) => sum + s.agents.length, 0);
  const verified = sections.reduce((sum, s) => sum + s.agents.filter((a) => a.verified).length, 0);

  return (
    <SpatialPage
      status={hasFilters ? `${total} matches` : "Curated lists"}
      left={
        <>
          <PanelHeader breadcrumb="Marketplace / Discover" title={<>Find the right<br />Agent</>} />

          <div className="mb-6">
            <Suspense fallback={<div className="h-10 bg-black/[0.04]" />}>
              <SearchBar />
            </Suspense>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-black/10">
            <PanelMetric icon={<Compass className="w-3.5 h-3.5 text-[#808080]" />} label={hasFilters ? "Matches" : "Listed"} value={total} />
            <PanelMetric icon={<ShieldCheck className="w-3.5 h-3.5 text-[#FF7A00]" />} label="Verified" value={verified} />
          </div>

          <Suspense fallback={<div className="h-64 bg-black/[0.04]" />}>
            <FilterPanel />
          </Suspense>

          {hasFilters && (
            <PanelSection label="Active filters" className="mt-8">
              <div className="flex flex-wrap gap-1.5">
                {activeFilters.map((key) => (
                  <span
                    key={key}
                    className="text-[10px] px-2 py-1 bg-[#FF7A00]/10 text-[#111111] border border-[#FF7A00]/30"
                  >
                    {key}: {params[key]}
                  </span>
                ))}
              </div>
            </PanelSection>
          )}
        </>
      }
      right={
        <CanvasScroll className="flex flex-col gap-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-semibold mb-4">
                {section.title}
                <span className="ml-2 text-white">{section.agents.length}</span>
              </h2>
              <CanvasGrid>
                {section.agents.length > 0 ? (
                  section.agents.map((agent) => <AgentCard key={agent.id} agent={toCard(agent)} />)
                ) : (
                  <CanvasEmpty>
                    {hasFilters ? "No agents match these filters." : "Nothing here yet."}
                  </CanvasEmpty>
                )}
              </CanvasGrid>
            </section>
          ))}
        </CanvasScroll>
      }
    />
  );
}
