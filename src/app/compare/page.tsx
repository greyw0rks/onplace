import Link from "next/link";
import { GitCompare, ShieldCheck } from "lucide-react";
import { fetchInternalJson } from "@/lib/base-url";
import { SpatialPage } from "../components/spatial/SpatialPage";
import { PanelHeader, PanelMetric, PanelSection } from "../components/spatial/PanelHeader";
import { CanvasScroll, CanvasEmpty } from "../components/spatial/CanvasScroll";

interface CompareAgent {
  id: string;
  name: string;
  developer: string;
  reputationScore: number | null;
  uptimePct: number | null;
  verified: boolean;
  riskLevel: string;
  securityLevel: string | null;
  _count?: { reviews?: number; hires?: number; followers?: number };
  testResults?: Array<{ status: string }>;
}

async function getAgentsForComparison(ids: string[]): Promise<{ agents: CompareAgent[] }> {
  return fetchInternalJson<{ agents: CompareAgent[] }>(
    `/api/compare?ids=${ids.join(",")}`,
    { agents: [] }
  );
}

function testPassRate(agent: CompareAgent): string {
  const total = agent.testResults?.length ?? 0;
  if (total === 0) return "—";
  const passed = agent.testResults!.filter((t) => t.status === "PASSED").length;
  return `${Math.round((passed / total) * 100)}%`;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: idsParam } = await searchParams;
  const ids = idsParam?.split(",").filter(Boolean) ?? [];

  if (ids.length < 2) {
    return (
      <SpatialPage
        status="Nothing selected"
        left={
          <>
            <PanelHeader breadcrumb="Marketplace / Compare" title={<>Side-by-side<br />Comparison</>} />
            <p className="text-xs text-[#808080] leading-relaxed mb-6">
              Pick between two and five agents to line their trust, uptime, audit and usage
              numbers up against each other.
            </p>
            <Link
              href="/agents"
              className="inline-block text-[11px] uppercase tracking-wider py-2.5 px-4 bg-[#111111] text-white hover:bg-[#FF7A00] hover:text-black transition"
            >
              Browse agents
            </Link>
          </>
        }
        right={
          <CanvasScroll>
            <CanvasEmpty>
              Add <code className="text-white">?ids=</code> with two or more agent ids to compare.
            </CanvasEmpty>
          </CanvasScroll>
        }
      />
    );
  }

  const { agents } = await getAgentsForComparison(ids);
  const verified = agents.filter((a) => a.verified).length;

  const rows: Array<{ label: string; values: Array<string | number> }> = [
    { label: "Trust score", values: agents.map((a) => `${Math.round(a.reputationScore ?? 0)}`) },
    { label: "Uptime", values: agents.map((a) => (a.uptimePct != null ? `${(a.uptimePct * 100).toFixed(1)}%` : "—")) },
    { label: "Verified", values: agents.map((a) => (a.verified ? "Yes" : "No")) },
    { label: "Risk level", values: agents.map((a) => a.riskLevel) },
    { label: "Security level", values: agents.map((a) => a.securityLevel ?? "Not audited") },
    { label: "Reviews", values: agents.map((a) => a._count?.reviews ?? 0) },
    { label: "Hires", values: agents.map((a) => a._count?.hires ?? 0) },
    { label: "Followers", values: agents.map((a) => a._count?.followers ?? 0) },
    { label: "Test pass rate", values: agents.map(testPassRate) },
  ];

  return (
    <SpatialPage
      status={`Comparing ${agents.length}`}
      left={
        <>
          <PanelHeader breadcrumb="Marketplace / Compare" title={<>Side-by-side<br />Comparison</>} />

          <div className="grid grid-cols-2 gap-4 mb-8 pb-6 border-b border-black/10">
            <PanelMetric icon={<GitCompare className="w-3.5 h-3.5 text-[#808080]" />} label="Selected" value={agents.length} />
            <PanelMetric icon={<ShieldCheck className="w-3.5 h-3.5 text-[#FF7A00]" />} label="Verified" value={verified} />
          </div>

          <PanelSection label="In this comparison" className="mb-8">
            <div className="flex flex-col">
              {agents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="py-2.5 px-3 -mx-3 border-l-2 border-transparent hover:border-[#FF7A00] hover:bg-black/[0.03] transition"
                >
                  <div className="text-xs font-semibold text-[#111111] truncate">{agent.name}</div>
                  <div className="text-[10px] text-[#808080]">by {agent.developer}</div>
                </Link>
              ))}
            </div>
          </PanelSection>

          <PanelSection label="Change selection" className="mt-auto">
            <Link
              href="/agents"
              className="inline-block text-[11px] uppercase tracking-wider py-2.5 px-4 bg-[#111111] text-white hover:bg-[#FF7A00] hover:text-black transition"
            >
              Browse agents
            </Link>
          </PanelSection>
        </>
      }
      right={
        <CanvasScroll>
          {agents.length === 0 ? (
            <CanvasEmpty>None of those agent ids matched a listing.</CanvasEmpty>
          ) : (
            <div className="floating-card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#A3A3A3] font-semibold">
                      Metric
                    </th>
                    {agents.map((agent) => (
                      <th key={agent.id} className="px-4 py-3 text-left">
                        <Link href={`/agents/${agent.id}`} className="text-xs font-semibold text-white hover:text-[#FF7A00] transition-colors">
                          {agent.name}
                        </Link>
                        <div className="text-[10px] text-[#A3A3A3] font-normal mt-0.5">
                          by {agent.developer}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <td className="px-4 py-3 text-[11px] text-[#A3A3A3] font-medium whitespace-nowrap">
                        {row.label}
                      </td>
                      {row.values.map((value, i) => (
                        <td key={i} className="px-4 py-3 text-[11px] text-white tabular-nums">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CanvasScroll>
      }
    />
  );
}
