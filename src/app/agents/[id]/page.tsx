import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ExternalLink, X } from "lucide-react";
import { getAgent } from "@/lib/agents";
import { prisma } from "@/lib/db";
import { trustScoreOf, trustBand } from "@/lib/health-check";
import { VERIFICATION_CRITERIA, MIN_UPTIME } from "@/lib/verification";
import { createHire } from "./actions";
import { AgentScopeCanvas } from "../agent-scope-canvas";
import { SpatialPage } from "../../components/spatial/SpatialPage";
import { PanelHeader, PanelStat, PanelSection } from "../../components/spatial/PanelHeader";
import { CanvasScroll } from "../../components/spatial/CanvasScroll";
import { TRUST_BAND_COLOR } from "../../components/spatial/AgentCard";
import { getCategoryColor } from "@/lib/network-layout";

const CATEGORY_LABELS: Record<string, string> = {
  rebalancing: "Rebalancing",
  grid_trading: "Grid Trading",
  yield_optimisation: "Yield Optimisation",
  health_factor_monitoring: "Health Factor Monitoring",
};

const BSCSCAN_TESTNET_TX_BASE = "https://testnet.bscscan.com/tx/";

function healthFactorBand(hf: number): "healthy" | "warning" | "critical" {
  if (hf >= 1.2) return "healthy";
  if (hf >= 1.05) return "warning";
  return "critical";
}

function healthFactorColor(hf: number): string {
  const band = healthFactorBand(hf);
  return band === "healthy" ? "#42f099" : band === "warning" ? "#ffb13e" : "#FF3B30";
}

export default async function AgentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hired?: string }>;
}) {
  const { id } = await params;
  const { hired } = await searchParams;
  const agent = await getAgent(id);

  if (!agent) {
    notFound();
  }

  const trust = trustScoreOf(agent);
  const band = trustBand(trust);
  const trustColor = TRUST_BAND_COLOR[band] ?? "#A3A3A3";
  const isLive = agent.sourceType === "self_built";
  const latestHealthFactor =
    agent.healthChecks.find((c) => c.healthFactor != null)?.healthFactor ?? null;

  const successfulChecks = await prisma.healthCheck.count({
    where: { agentId: agent.id, success: true },
  });

  // Same evidence the verification sweep uses, shown so the badge is auditable.
  const checks = [
    { label: VERIFICATION_CRITERIA[0], passed: Boolean(agent.erc8004Id) },
    { label: VERIFICATION_CRITERIA[1], passed: agent.healthChecks[0]?.success ?? false },
    { label: VERIFICATION_CRITERIA[2], passed: (agent.uptimePct ?? 0) >= MIN_UPTIME },
  ];

  return (
    <SpatialPage
      status={isLive ? "Live on BSC Testnet" : CATEGORY_LABELS[agent.categorySlug]}
      left={
        <>
          <PanelHeader breadcrumb={`Agent / ${agent.developer}`} title={agent.name} />

          <div className="flex flex-wrap items-center gap-1.5 mb-6">
            <span
              className="text-[9px] uppercase tracking-wider px-2 py-1 border"
              style={{
                color: "#111111",
                borderColor: `${getCategoryColor(agent.categorySlug)}88`,
                background: `${getCategoryColor(agent.categorySlug)}22`,
              }}
            >
              {CATEGORY_LABELS[agent.categorySlug]}
            </span>
            {isLive && (
              <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-[#FF7A00]/10 text-[#FF7A00] border border-[#FF7A00]/30">
                Live on BSC Testnet
              </span>
            )}
            {agent.verified && (
              <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-black/[0.04] text-[#111111] border border-black/15">
                Verified
              </span>
            )}
          </div>

          {hired && (
            <div className="mb-6 border border-[#42f099] bg-[#42f099]/10 px-3 py-2 text-xs text-[#111111]">
              Agent hired successfully.
            </div>
          )}

          <div className="mb-8 pb-6 border-b border-black/10">
            <PanelStat
              value={`${trust.toFixed(0)}`}
              caption={
                <>
                  trust score
                  <br />
                  <span style={{ color: trustColor }}>{band}</span>
                </>
              }
            />
          </div>

          {latestHealthFactor != null && (
            <PanelSection label="Venus health factor" className="mb-8">
              <PanelStat
                value={
                  <span style={{ color: healthFactorColor(latestHealthFactor) }}>
                    {latestHealthFactor.toFixed(2)}
                  </span>
                }
                caption={healthFactorBand(latestHealthFactor)}
              />
            </PanelSection>
          )}

          <PanelSection label="Verification" className="mb-8">
            <ul className="flex flex-col gap-2">
              {checks.map((check) => (
                <li key={check.label} className="flex items-start gap-2 text-[11px] leading-snug">
                  {check.passed ? (
                    <Check className="w-3 h-3 mt-0.5 shrink-0 text-[#FF7A00]" />
                  ) : (
                    <X className="w-3 h-3 mt-0.5 shrink-0 text-[#808080]" />
                  )}
                  <span className={check.passed ? "text-[#111111]" : "text-[#808080]"}>
                    {check.label}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-[#808080] mt-3 leading-relaxed">
              {agent.verified
                ? "All criteria met — the badge is re-checked on every sweep and revoked if the endpoint stops responding."
                : "Not currently verified. The badge is granted automatically once every criterion is met."}
            </p>
          </PanelSection>

          <PanelSection label="Scores" className="mb-8">
            <div className="flex flex-col gap-3">
              <ScoreBar label="Health" value={agent.healthScore ?? 0} color="#42f099" />
              <ScoreBar label="Performance" value={agent.performanceScore ?? 0} color="#FF7A00" />
              <ScoreBar label="Community" value={agent.communityScore ?? 0} color="#3ef2ff" />
            </div>
          </PanelSection>

          <PanelSection label="Metrics" className="mb-8">
            <dl className="flex flex-col">
              <Metric label="Uptime" value={agent.uptimePct != null ? `${(agent.uptimePct * 100).toFixed(1)}%` : "—"} />
              <Metric label="Avg latency" value={agent.latencyMs != null ? `${agent.latencyMs}ms` : "—"} />
              <Metric
                label="Last check"
                value={agent.lastHealthCheckAt ? new Date(agent.lastHealthCheckAt).toLocaleString() : "Never"}
              />
              <Metric
                label="Checks recorded"
                value={`${successfulChecks} ok / ${agent.healthChecks.length} shown`}
              />
              <Metric label="Followers" value={agent.followCount.toString()} />
              <Metric label="Views" value={agent.viewCount.toString()} />
            </dl>
          </PanelSection>

          <PanelSection label="Hire" className="mt-auto">
            <p className="text-[10px] text-[#808080] leading-relaxed mb-3">
              Deploy this agent against your wallet. Every check it runs is logged on-chain and
              verifiable.
            </p>
            <form action={createHire}>
              <input type="hidden" name="agentId" value={agent.id} />
              <button
                type="submit"
                className="w-full text-[11px] uppercase tracking-wider py-2.5 bg-[#FF7A00] text-black font-semibold hover:bg-[#FFA500] transition"
              >
                Hire agent
              </button>
            </form>
            <Link
              href={`/compare?ids=${agent.id}`}
              className="block w-full text-center text-[11px] uppercase tracking-wider py-2.5 mt-2 border border-black/15 text-[#111111] hover:border-[#FF7A00] transition"
            >
              Compare
            </Link>
          </PanelSection>
        </>
      }
      right={
        <CanvasScroll className="flex flex-col gap-4">
          <div className="floating-card overflow-hidden">
            <div className="h-32 relative overflow-hidden border-b border-white/10">
              <AgentScopeCanvas
                agentId={agent.id}
                healthy={agent.healthChecks?.[0]?.success ?? true}
                sourceType={agent.sourceType}
              />
            </div>
            <div className="p-5">
              <h2 className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-semibold mb-2">
                Description
              </h2>
              <p className="text-xs text-white/90 leading-relaxed">{agent.description}</p>
            </div>
          </div>

          <div className="floating-card p-5">
            <h2 className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-semibold mb-3">
              Health check history
            </h2>
            {agent.healthChecks.length > 0 ? (
              <div className="flex flex-col">
                {agent.healthChecks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.06] last:border-0"
                  >
                    <span className="text-[10px] text-[#A3A3A3] tabular-nums">
                      {check.timestamp.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-3">
                      {check.healthFactor != null ? (
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: healthFactorColor(check.healthFactor) }}
                        >
                          HF {check.healthFactor.toFixed(2)}
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: check.success ? "#42f099" : "#FF3B30" }}
                        >
                          {check.success ? "OK" : check.error ?? "Failed"}
                        </span>
                      )}
                      {check.txHash ? (
                        <a
                          href={`${BSCSCAN_TESTNET_TX_BASE}${check.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-[#FF7A00] hover:underline"
                        >
                          View tx
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-[#A3A3A3] tabular-nums">
                          {check.latencyMs != null ? `${check.latencyMs}ms` : "—"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#A3A3A3]">No health checks recorded yet.</p>
            )}
          </div>

          <div className="floating-card p-5">
            <h2 className="text-[10px] uppercase tracking-wider text-[#A3A3A3] font-semibold mb-3">
              Technical details
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <Detail label="ERC-8004 ID" value={agent.erc8004Id || "—"} />
              <Detail label="Chain" value={agent.chain || "—"} />
              <Detail label="Wallet" value={agent.walletAddress || "—"} />
              <Detail label="Category" value={CATEGORY_LABELS[agent.categorySlug]} />
              {agent.priceAmount && agent.priceAsset && (
                <Detail label="Price" value={`${agent.priceAmount} ${agent.priceAsset}`} />
              )}
              <Detail label="Registered" value={agent.createdAt.toLocaleDateString()} />
              <Detail label="Endpoint" value={agent.endpointUrl} />
              <Detail label="Risk level" value={agent.riskLevel} />
            </dl>
          </div>
        </CanvasScroll>
      }
    />
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-[#808080]">{label}</span>
        <span className="text-[10px] font-semibold text-[#111111] tabular-nums">
          {value.toFixed(0)}%
        </span>
      </div>
      <div className="h-1 bg-black/[0.08] overflow-hidden">
        <div className="h-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-black/[0.06] last:border-0">
      <dt className="text-[10px] text-[#808080]">{label}</dt>
      <dd className="text-[10px] font-semibold text-[#111111] tabular-nums truncate">{value}</dd>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] uppercase tracking-wider text-[#A3A3A3] mb-0.5">{label}</dt>
      <dd className="text-[10px] text-white truncate" title={value}>
        {value}
      </dd>
    </div>
  );
}
