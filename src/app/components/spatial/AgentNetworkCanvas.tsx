"use client";

import { useMemo, useState } from 'react';
import { NetworkNode, NetworkEdge } from './types';
import { calculateNetworkLayout, getCategoryColor } from '@/lib/network-layout';

interface AgentNetworkCanvasProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  onNodeClick?: (node: NetworkNode) => void;
  selectedId?: string | null;
  /** 1 = fit to canvas; >1 zooms in */
  zoom?: number;
  width?: number;
  height?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  health_factor_monitoring: 'Health monitoring',
  grid_trading: 'Grid trading',
  yield_optimisation: 'Yield optimisation',
  rebalancing: 'Rebalancing',
};

export function AgentNetworkCanvas({
  nodes,
  edges,
  onNodeClick,
  selectedId,
  zoom = 1,
  width = 1200,
  height = 800,
}: AgentNetworkCanvasProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // The layout is a pure function of the graph and canvas size, so derive it
  // rather than pushing it through state in an effect.
  const layoutNodes = useMemo(
    () =>
      nodes.length === 0
        ? []
        : calculateNetworkLayout(nodes, edges, { width, height, iterations: 100 }),
    [nodes, edges, width, height]
  );

  const positions = useMemo(
    () => new Map(layoutNodes.map((n) => [n.id, n])),
    [layoutNodes]
  );

  // Legend reflects only the categories actually on the map.
  const legend = useMemo(() => {
    const seen = new Map<string, number>();
    nodes.forEach((n) => seen.set(n.category, (seen.get(n.category) ?? 0) + 1));
    return Array.from(seen.entries()).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  const view = `${width / 2 - width / (2 * zoom)} ${height / 2 - height / (2 * zoom)} ${width / zoom} ${height / zoom}`;

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 dot-grid pointer-events-none" />

      <svg viewBox={view} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="edges">
          {edges.map((edge, i) => {
            const source = positions.get(edge.source);
            const target = positions.get(edge.target);
            if (!source || !target) return null;

            const touchesHover = hoveredNode === edge.source || hoveredNode === edge.target;
            return (
              <line
                key={`${edge.source}-${edge.target}-${i}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={touchesHover ? '#FF7A00' : '#FFFFFF'}
                strokeWidth={touchesHover ? 1.5 : 1}
                strokeOpacity={touchesHover ? 0.5 : edge.strength * 0.18}
              />
            );
          })}
        </g>

        <g className="nodes">
          {layoutNodes.map((node) => {
            const color = node.color || getCategoryColor(node.category);
            const isHovered = hoveredNode === node.id;
            const isSelected = selectedId === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onNodeClick?.(node)}
                role="button"
                aria-label={`${node.name}, trust score ${node.trustScore}`}
              >
                {/* Inner group carries the hover scale: a CSS transform on the
                    outer group would override its translate attribute and fling
                    the node to the canvas origin. */}
                <g className={`network-node ${node.active ? 'active' : ''}`}>
                  {node.active && (
                    <circle r={node.size + 8} fill={color} opacity={0.18} className="animate-ping" style={{ animationDuration: '2s' }} />
                  )}

                  <circle
                    r={node.size}
                    fill={node.active ? color : 'transparent'}
                    stroke={color}
                    strokeWidth={isSelected ? 3 : 2}
                    opacity={isHovered || isSelected ? 1 : 0.8}
                    filter={node.active ? 'url(#glow-orange)' : undefined}
                  />

                  {node.trustScore > 70 && <circle r={4} fill="#42f099" opacity={0.85} />}
                </g>
              </g>
            );
          })}
        </g>

        {/* Labels live in their own layer so they always draw above every node
            and never widen a node's hit target. */}
        <g className="labels" pointerEvents="none">
          {layoutNodes
            .filter((node) => node.id === hoveredNode || node.id === selectedId)
            .map((node) => (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <rect x={node.size + 10} y={-14} width={node.name.length * 6.6 + 20} height={28} fill="#1C1C1C" stroke="#333333" />
                <text x={node.size + 18} y={-1} fontSize="11" fill="#FFFFFF">{node.name}</text>
                <text x={node.size + 18} y={10} fontSize="9" fill="#A3A3A3">
                  trust {node.trustScore} · {node.active ? 'active' : 'idle'}
                </text>
              </g>
            ))}
        </g>
      </svg>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-[#A3A3A3]">
          No agents registered yet
        </div>
      )}

      {legend.length > 0 && (
        <div className="absolute bottom-6 right-6 floating-card p-3 flex flex-col gap-2 z-10">
          {legend.map(([category, count]) => (
            <div key={category} className="flex items-center gap-2 text-[10px]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: getCategoryColor(category) }} />
              <span className="text-white">{CATEGORY_LABELS[category] ?? category}</span>
              <span className="text-[#A3A3A3] ml-auto pl-2">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
