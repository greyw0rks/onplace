import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgent } from "@/lib/agents";
import { trustScoreOf, trustBand } from "@/lib/health-check";
import { createHire } from "./actions";
import { AgentScopeCanvas } from "../agent-scope-canvas";

const CATEGORY_LABELS: Record<string, string> = {
  rebalancing: "Rebalancing",
  grid_trading: "Grid Trading",
  yield_optimisation: "Yield Optimisation",
  health_factor_monitoring: "Health Factor Monitoring",
};

const BSCSCAN_TESTNET_TX_BASE = "https://testnet.bscscan.com/tx/";

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
  const isLive = agent.sourceType === "self_built";

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-bg/90 backdrop-blur z-10">
        <div className="mx-auto max-w-[1320px] px-6 py-4 flex items-center justify-between">
          <Link href="/agents" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-cyan flex items-center justify-center font-heading font-bold text-bg text-sm">
              AP
            </div>
            <span className="font-heading text-lg font-semibold">AgentProof</span>
          </Link>
          <Link href="/agents" className="text-sm text-text-1 hover:text-cyan transition-colors">
            ← Back to agents
          </Link>
        </div>
      </header>

      {/* Hero scope */}
      <div className="border-b border-border bg-ink">
        <div className="mx-auto max-w-[1320px] px-6">
          <div className="h-40 relative overflow-hidden">
            <AgentScopeCanvas
              agentId={agent.id}
              healthy={agent.healthChecks?.[0]?.success ?? true}
              sourceType={agent.sourceType}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-6 py-8">
        {hired && (
          <div className="mb-6 border border-green rounded-lg p-4 bg-green/5">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green"></span>
              <span className="text-sm text-green font-semibold">Agent hired successfully!</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="chip chip-idle text-[10px] px-2 py-1">
                  {CATEGORY_LABELS[agent.categorySlug]}
                </span>
                {isLive && (
                  <span className="chip chip-success text-[10px] px-2 py-1">
                    <span className="pulse-dot inline-block w-1.5 h-1.5 rounded-full bg-green mr-1"></span>
                    Live on BSC Testnet
                  </span>
                )}
              </div>
              <h1 className="font-heading text-3xl font-bold mb-2">{agent.name}</h1>
              <p className="text-sm text-text-2">by {agent.developer}</p>
            </div>

            {/* Description */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="font-heading text-sm uppercase tracking-wider text-text-2 mb-3">
                Description
              </h2>
              <p className="text-sm text-text-1 leading-relaxed">{agent.description}</p>
            </div>

            {/* Health check history */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="font-heading text-sm uppercase tracking-wider text-text-2 mb-4">
                Health Check History
              </h2>
              {agent.healthChecks.length > 0 ? (
                <div className="space-y-2">
                  {agent.healthChecks.map((check) => (
                    <div
                      key={check.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="text-xs text-text-2 font-mono">
                        {check.timestamp.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-semibold ${
                            check.success ? "text-green" : "text-red"
                          }`}
                        >
                          {check.success ? "OK" : check.error ?? "Failed"}
                        </span>
                        {check.txHash ? (
                          <a
                            href={`${BSCSCAN_TESTNET_TX_BASE}${check.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-cyan hover:underline"
                          >
                            View tx ↗
                          </a>
                        ) : (
                          <span className="text-xs text-text-2 font-mono">
                            {check.latencyMs != null ? `${check.latencyMs}ms` : "—"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-2">No health checks recorded yet.</p>
              )}
            </div>

            {/* Details */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="font-heading text-sm uppercase tracking-wider text-text-2 mb-4">
                Technical Details
              </h2>
              <dl className="grid grid-cols-2 gap-4 text-xs">
                <Detail label="ERC-8004 ID" value={agent.erc8004Id || "—"} mono />
                <Detail label="Chain" value={agent.chain || "—"} />
                <Detail label="Wallet" value={agent.walletAddress || "—"} mono />
                <Detail label="Category" value={CATEGORY_LABELS[agent.categorySlug]} />
                {agent.priceAmount && agent.priceAsset && (
                  <Detail label="Price" value={`${agent.priceAmount} ${agent.priceAsset}`} mono />
                )}
                <Detail
                  label="Registered"
                  value={agent.createdAt.toLocaleDateString()}
                />
              </dl>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trust score */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="font-heading text-sm uppercase tracking-wider text-text-2 mb-4">
                Trust Score
              </h2>
              <div className="text-center">
                <div className={`text-5xl font-heading font-bold text-${getTrustColor(band)} mb-2`}>
                  {trust.toFixed(1)}%
                </div>
                <div className="text-xs text-text-2 uppercase tracking-wider">{band}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="border border-border rounded-lg p-6">
              <h2 className="font-heading text-sm uppercase tracking-wider text-text-2 mb-4">
                Metrics
              </h2>
              <div className="space-y-3">
                <Stat label="Uptime" value={agent.uptimePct ? `${agent.uptimePct.toFixed(1)}%` : "—"} />
                <Stat label="Avg Latency" value={agent.latencyMs ? `${agent.latencyMs}ms` : "—"} />
                <Stat label="Last Check" value={agent.lastHealthCheckAt ? new Date(agent.lastHealthCheckAt).toLocaleTimeString() : "Never"} />
                <Stat label="Total Checks" value={agent.healthChecks.length.toString()} />
              </div>
            </div>

            {/* Hire */}
            <div className="border border-cyan/40 rounded-lg p-6 glow-cyan">
              <h2 className="font-heading text-sm uppercase tracking-wider text-text-2 mb-4">
                Hire This Agent
              </h2>
              <p className="text-xs text-text-1 mb-4 leading-relaxed">
                Deploy this verified agent to your wallet. All on-chain activity will be logged and verifiable.
              </p>
              <form action={createHire}>
                <input type="hidden" name="agentId" value={agent.id} />
                <button type="submit" className="w-full btn btn-primary">
                  Hire Agent
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <Ticker />
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-text-2 uppercase tracking-wider mb-1">{label}</dt>
      <dd className={`${mono ? "font-mono" : ""} truncate`}>{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-xs text-text-2 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-mono font-semibold">{value}</span>
    </div>
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
