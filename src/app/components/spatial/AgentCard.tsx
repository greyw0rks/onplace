import Link from 'next/link';
import { getCategoryColor } from '@/lib/network-layout';

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

      <p className="text-[11px] text-[#A3A3A3] leading-relaxed mb-4 line-clamp-2">
        {agent.description}
      </p>

      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#A3A3A3]">
          Trust{' '}
          <span className="font-semibold" style={{ color: trustColor }}>
            {agent.trust.toFixed(0)}
          </span>
        </span>

        {agent.healthy != null && (
          <span className="flex items-center gap-1.5 text-[#A3A3A3]">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: agent.healthy ? '#42f099' : '#FF3B30' }}
            />
            {agent.healthy ? 'Healthy' : 'Error'}
          </span>
        )}

        {agent.footer && <span className="text-[#A3A3A3]">{agent.footer}</span>}
      </div>
    </Link>
  );
}
