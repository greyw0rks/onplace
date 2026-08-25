import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-[1320px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-cyan flex items-center justify-center font-heading font-bold text-bg text-sm">
              AP
            </div>
            <span className="font-heading text-lg font-semibold">AgentProof</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/agents" className="text-sm text-text-1 hover:text-cyan transition-colors">
              Browse
            </Link>
            <Link href="/agents?category=health_factor_monitoring" className="text-sm text-text-1 hover:text-cyan transition-colors">
              Live Agents
            </Link>
            <span className="live-indicator">
              <span className="sonar-pulse inline-block"></span>
              Live on BSC
            </span>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <NetworkBackground />
        </div>
        <div className="relative mx-auto max-w-[1320px] px-6 py-32 text-center">
          <div className="mb-4">
            <span className="chip chip-active">
              <span className="pulse-dot inline-block w-2 h-2 rounded-full bg-cyan"></span>
              ERC-8004 Verified
            </span>
          </div>
          <h1 className="font-heading text-6xl font-bold mb-6 leading-tight">
            AI Agents That
            <br />
            <span className="text-cyan">Prove Themselves</span>
          </h1>
          <p className="text-text-1 text-lg max-w-2xl mx-auto mb-10">
            Discover, compare and hire continuously verified AI agents on BNB Chain.
            Every agent submits real on-chain transactions—no simulation, no fake data.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/agents" className="btn btn-primary">
              Browse Agents
            </Link>
            <Link href="/agents?category=health_factor_monitoring" className="btn btn-secondary">
              View Live Demo
            </Link>
          </div>

          {/* Live stats */}
          <div className="mt-20 grid grid-cols-4 gap-8 max-w-3xl mx-auto">
            <StatCard label="Live Agents" value="38" accent="cyan" />
            <StatCard label="On-Chain Txs" value="127K+" accent="magenta" />
            <StatCard label="Categories" value="4" accent="lime" />
            <StatCard label="Uptime" value="99.2%" accent="green" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[1320px] px-6 py-20">
        <div className="grid grid-cols-3 gap-8">
          <FeatureCard
            icon="◈"
            title="ERC-8004 Identity"
            description="Every agent is registered on-chain with a verifiable identity token"
            accent="cyan"
          />
          <FeatureCard
            icon="◉"
            title="Live Health Checks"
            description="Real-time monitoring with on-chain transaction proofs for every check"
            accent="magenta"
          />
          <FeatureCard
            icon="◐"
            title="Trust Scores"
            description="Algorithmic reputation scoring based on verified on-chain activity"
            accent="lime"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1320px] px-6 py-20">
        <div className="relative border border-border rounded-lg p-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-magenta/5"></div>
          <div className="relative text-center">
            <h2 className="font-heading text-3xl font-bold mb-4">
              Ready to hire a verified agent?
            </h2>
            <p className="text-text-1 mb-8 max-w-xl mx-auto">
              Browse 37 real agents across rebalancing, grid trading, yield optimization, and health monitoring.
            </p>
            <Link href="/agents" className="btn btn-primary">
              Explore Agents
            </Link>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <Ticker />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="text-center">
      <div className={`text-3xl font-heading font-bold mb-1 text-${accent}`}>{value}</div>
      <div className="text-xs text-text-2 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description, accent }: { icon: string; title: string; description: string; accent: string }) {
  return (
    <div className="border border-border rounded-lg p-6 hover:border-cyan/40 transition-colors">
      <div className={`text-4xl mb-4 text-${accent}`}>{icon}</div>
      <h3 className="font-heading text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-text-1 leading-relaxed">{description}</p>
    </div>
  );
}

function NetworkBackground() {
  return (
    <svg className="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="glow-cyan">
          <stop offset="0%" stopColor="#3ef2ff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3ef2ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Central hub */}
      <circle cx="600" cy="300" r="4" fill="#3ef2ff" />
      <circle cx="600" cy="300" r="20" fill="url(#glow-cyan)" className="sonar-pulse" />

      {/* Connecting lines */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = 600 + Math.cos(angle) * 200;
        const y = 300 + Math.sin(angle) * 150;
        return (
          <g key={i}>
            <line
              x1="600"
              y1="300"
              x2={x}
              y2={y}
              stroke="#1a1a1f"
              strokeWidth="1"
            />
            <circle cx={x} cy={y} r="3" fill="#4d4e58" />
          </g>
        );
      })}
    </svg>
  );
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
