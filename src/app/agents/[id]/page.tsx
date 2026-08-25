import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgent } from "@/lib/agents";
import { trustScoreOf, trustBand } from "@/lib/health-check";
import { createHire } from "./actions";

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

  if (!agent) notFound();

  const score = trustScoreOf(agent);
  const band = trustBand(score);
  const hireAction = createHire.bind(null, agent.id);

  return (
    <div className="flex flex-1 flex-col bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        <Link href="/agents" className="text-sm text-foreground-muted hover:text-foreground">
          ← Back to agents
        </Link>

        {hired && (
          <div className="mt-6 rounded-lg border border-primary bg-surface px-4 py-3 text-sm">
            Hire request submitted. Payment execution is coming soon — this reserves the agent
            for you.
          </div>
        )}

        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground-muted">
                {CATEGORY_LABELS[agent.categorySlug]}
              </span>
              {agent.sourceType === "self_built" && (
                <span className="rounded-full border border-trust-excellent bg-surface px-3 py-1 text-xs font-medium text-trust-excellent">
                  Live on BSC Testnet
                </span>
              )}
            </div>
            <h1 className="mt-3 font-heading text-3xl font-bold">{agent.name}</h1>
            <p className="mt-1 text-foreground-muted">by {agent.developer}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className={`font-mono text-4xl font-bold ${TRUST_BAND_CLASSES[band]}`}>
              {score}
            </span>
            <span className="text-xs uppercase tracking-wide text-foreground-muted">
              Trust score · {band.replace("-", " ")}
            </span>
          </div>
        </div>

        <p className="mt-6 text-foreground-muted">{agent.description}</p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Chain" value={agent.chain} />
          <Stat
            label="Latency"
            value={agent.latencyMs != null ? `${agent.latencyMs}ms` : "Not checked"}
          />
          <Stat
            label="Uptime"
            value={agent.uptimePct != null ? `${Math.round(agent.uptimePct * 100)}%` : "Not checked"}
          />
          <Stat
            label="Last checked"
            value={agent.lastHealthCheckAt ? agent.lastHealthCheckAt.toLocaleString() : "Never"}
          />
        </div>

        <div className="mt-8 rounded-lg border border-border bg-surface p-5">
          <h2 className="font-heading text-lg font-bold">Identity & endpoint</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <Detail label="ERC-8004 ID" value={agent.erc8004Id ?? "—"} mono />
            <Detail label="Wallet" value={agent.walletAddress ?? "—"} mono />
            <Detail label="Endpoint" value={agent.endpointUrl} mono />
            <Detail label="Source" value={agent.sourceType === "discovered" ? "Discovered via 8004scan" : "Self-built"} />
          </dl>
        </div>

        <div className="mt-8 rounded-lg border border-border bg-surface p-5">
          <h2 className="font-heading text-lg font-bold">Recent health checks</h2>
          {agent.healthChecks.length === 0 ? (
            <p className="mt-2 text-sm text-foreground-muted">No health checks recorded yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border text-sm">
              {agent.healthChecks.map((check) => (
                <li key={check.id} className="flex items-center justify-between py-2">
                  <span className="text-foreground-muted">
                    {check.timestamp.toLocaleString()}
                  </span>
                  <span
                    className={check.success ? "text-trust-excellent" : "text-trust-high-risk"}
                  >
                    {check.success ? "OK" : check.error ?? "Failed"}
                  </span>
                  {check.txHash ? (
                    <a
                      href={`${BSCSCAN_TESTNET_TX_BASE}${check.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-primary underline-offset-2 hover:underline"
                    >
                      View tx ↗
                    </a>
                  ) : (
                    <span className="font-mono text-foreground-muted">
                      {check.latencyMs != null ? `${check.latencyMs}ms` : "—"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-border bg-surface p-5">
          <h2 className="font-heading text-lg font-bold">Permissions & pricing</h2>
          <p className="mt-2 text-sm text-foreground-muted">
            {agent.priceAmount
              ? `${agent.priceAmount} ${agent.priceAsset ?? ""} per use`
              : "Pricing not yet listed by the developer."}
          </p>
          <p className="mt-2 text-sm text-foreground-muted">
            Scoped session permissions and spend caps are coming soon. Hiring today reserves the
            agent; payment execution is not yet enabled.
          </p>
          <form action={hireAction} className="mt-4">
            <button
              type="submit"
              className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Hire this agent
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-foreground-muted">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-foreground-muted">{label}</dt>
      <dd className={`mt-0.5 truncate ${mono ? "font-mono text-sm" : "text-sm"}`}>{value}</dd>
    </div>
  );
}
