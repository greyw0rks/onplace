import Link from 'next/link';
import { getCategoryColor } from '@/lib/network-layout';
import { statusPresentation } from '@/lib/agent-status';
import type { AgentStatus } from '@/generated/prisma/enums';

export const TRUST_BAND_COLOR: Record<string, string> = {
  excellent: '#42f099',
  strong: '#c6ff3e',
  moderate: '#FF7A00',
  weak: '#ffb13e',
  'high-risk': '#FF3B30',
};

export interface AgentCardData {
  id: string;
  name: string;
  developer: string;
  description: string;
  category: string;
  trust: number;
  band: string;
  /** Derived lifecycle state. Preferred over `healthy`, which can only say ok/error. */
  status?: AgentStatus | null;
  /** Capability labels traced back to the agent's own registry metadata. */
  capabilities?: string[] | null;
  protocols?: string[] | null;
  uptimePct?: number | null;
  latencyMs?: number | null;
  healthy?: boolean | null;
  live?: boolean;
  footer?: string | null;
}

/**
 * Floating translucent agent card for the dark canvas. Colour-coded by
 * category on the left edge so cards read against the network map's legend.
 */
export function AgentCard({ agent }: { agent: AgentCardData }) {
  const trustColor = TRUST_BAND_COLOR[agent.band] ?? '#A3A3A3';
  const state = agent.status
    ? statusPresentation(agent.status)
    : agent.healthy != null
      ? { label: agent.healthy ? 'Healthy' : 'Error', color: agent.healthy ? '#42f099' : '#FF3B30' }
      : null;

  return (
    <Link
      href={`/agents/${agent.id}`}
      className="floating-card group relative block p-5 pl-6 transition hover:border-[#FF7A00]/50"
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: getCategoryColor(agent.category) }}
      />

      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#FF7A00] transition-colors">
            {agent.name}
          </h3>
          <p className="text-[10px] text-[#A3A3A3] mt-0.5">by {agent.developer}</p>
        </div>
        {agent.live && (
          <span className="shrink-0 text-[9px] uppercase tracking-wider px-2 py-1 bg-[#FF7A00]/15 text-[#FF7A00] border border-[#FF7A00]/30">
            Live
          </span>
        )}
      </div>

      <p className="text-[11px] text-[#A3A3A3] leading-relaxed mb-3 line-clamp-2">
        {agent.description}
      </p>

      {/* What the agent actually does, derived from its own registry metadata —
          the single most useful thing for choosing between two agents whose trust
          scores are identical because neither has been benchmarked yet. */}
      {agent.capabilities && agent.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {agent.capabilities.slice(0, 3).map((capability) => (
            <span
              key={capability}
              className="text-[9px] px-1.5 py-0.5 bg-white/[0.06] text-[#C8C8C8] border border-white/10"
            >
              {capability}
            </span>
          ))}
          {agent.capabilities.length > 3 && (
            <span className="text-[9px] px-1.5 py-0.5 text-[#808080]">
              +{agent.capabilities.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Measurements, not just a score: uptime and latency are what actually
          differ between agents today. */}
      <dl className="flex items-center gap-3 text-[10px] mb-3 tabular-nums">
        {agent.uptimePct != null && (
          <div className="flex items-baseline gap-1">
            <dt className="text-[#808080]">uptime</dt>
            <dd className="text-white font-semibold">{Math.round(agent.uptimePct * 100)}%</dd>
          </div>
        )}
        {agent.latencyMs != null && (
          <div className="flex items-baseline gap-1">
            <dt className="text-[#808080]">latency</dt>
            <dd className="text-white font-semibold">{agent.latencyMs}ms</dd>
          </div>
        )}
        {agent.protocols && agent.protocols.length > 0 && (
          <div className="flex items-baseline gap-1 min-w-0">
            <dt className="text-[#808080]">via</dt>
            <dd className="text-white font-semibold truncate">{agent.protocols.join('/')}</dd>
          </div>
        )}
      </dl>

      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#A3A3A3]">
          Trust{' '}
          <span className="font-semibold" style={{ color: trustColor }}>
            {agent.trust.toFixed(0)}
          </span>
        </span>

        {state && (
          <span className="flex items-center gap-1.5 text-[#A3A3A3]">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: state.color }}
            />
            {state.label}
          </span>
        )}

        {agent.footer && <span className="text-[#A3A3A3]">{agent.footer}</span>}
      </div>
    </Link>
  );
}
