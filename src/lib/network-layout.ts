// Force-directed network layout algorithm
import { NetworkNode, NetworkEdge } from '../app/components/spatial/types';

interface LayoutConfig {
  width: number;
  height: number;
  iterations?: number;
  attractionStrength?: number;
  repulsionStrength?: number;
  centeringForce?: number;
}

export function calculateNetworkLayout(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  config: LayoutConfig
): NetworkNode[] {
  const {
    width,
    height,
    iterations = 100,
    attractionStrength = 0.006,
    repulsionStrength = 24000,
    centeringForce = 0.012,
  } = config;

  // Seed positions deterministically on a sunflower spiral. Callers hand us
  // nodes at (0, 0), and coincident nodes generate zero repulsion — every node
  // would collapse onto the centre — so an even initial spread is required.
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const spread = Math.min(width, height) * 0.4;

  const layoutNodes = nodes.map((node, i) => {
    const seeded = node.x !== 0 || node.y !== 0;
    const angle = i * GOLDEN_ANGLE;
    const radius = Math.sqrt((i + 1) / nodes.length) * spread;

    return {
      ...node,
      x: seeded ? node.x : width / 2 + Math.cos(angle) * radius,
      y: seeded ? node.y : height / 2 + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
    };
  });

  // Create node lookup
  const nodeMap = new Map(layoutNodes.map((n) => [n.id, n]));

  // Run force-directed layout
  for (let iter = 0; iter < iterations; iter++) {
    // Cooling factor (reduces forces over time)
    const alpha = 1 - iter / iterations;

    // Reset velocities
    layoutNodes.forEach((node) => {
      node.vx = 0;
      node.vy = 0;
    });

    // Repulsion between all nodes
    for (let i = 0; i < layoutNodes.length; i++) {
      for (let j = i + 1; j < layoutNodes.length; j++) {
        const nodeA = layoutNodes[i];
        const nodeB = layoutNodes[j];

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Coincident nodes have no direction to push along; nudge them apart on
        // a per-pair deterministic axis instead of leaving them stacked.
        let ux: number;
        let uy: number;
        if (distance < 0.01) {
          const angle = (i * 31 + j * 17) % 360 * (Math.PI / 180);
          ux = Math.cos(angle);
          uy = Math.sin(angle);
          distance = 1;
        } else {
          ux = dx / distance;
          uy = dy / distance;
        }

        // Repulsion force (inverse square), floored at the two radii so large
        // nodes still clear each other.
        const minGap = nodeA.size + nodeB.size + 12;
        const effective = Math.max(distance, 1);
        const force =
          (repulsionStrength * alpha) / (effective * effective) +
          (distance < minGap ? (minGap - distance) * 0.5 * alpha : 0);

        const fx = ux * force;
        const fy = uy * force;

        nodeA.vx -= fx;
        nodeA.vy -= fy;
        nodeB.vx += fx;
        nodeB.vy += fy;
      }
    }

    // Attraction along edges
    edges.forEach((edge) => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);

      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      // Attraction force (linear)
      const force = distance * attractionStrength * edge.strength * alpha;

      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    });

    // Centering force
    const centerX = width / 2;
    const centerY = height / 2;

    layoutNodes.forEach((node) => {
      const dx = centerX - node.x;
      const dy = centerY - node.y;

      node.vx += dx * centeringForce * alpha;
      node.vy += dy * centeringForce * alpha;
    });

    // Update positions
    layoutNodes.forEach((node) => {
      // Clamp per-step displacement so a close pair can't fling a node across
      // the canvas before the cooling factor takes hold.
      const step = Math.hypot(node.vx, node.vy);
      const maxStep = 30;
      const scale = step > maxStep ? maxStep / step : 1;

      node.x += node.vx * scale;
      node.y += node.vy * scale;

      // Boundary constraints (with padding)
      const padding = node.size + 10;
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    });
  }

  return fitToCanvas(layoutNodes, width, height);
}

/**
 * Rescale the settled graph so it fills the canvas. Force tuning alone leaves
 * the cluster size dependent on node count, which makes small registries look
 * like a dot in the middle of the map.
 */
function fitToCanvas<T extends NetworkNode>(nodes: T[], width: number, height: number): T[] {
  if (nodes.length < 2) return nodes;

  const maxRadius = Math.max(...nodes.map((n) => n.size));
  const padding = maxRadius + 24;
  const minX = Math.min(...nodes.map((n) => n.x));
  const maxX = Math.max(...nodes.map((n) => n.x));
  const minY = Math.min(...nodes.map((n) => n.y));
  const maxY = Math.max(...nodes.map((n) => n.y));

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  if (spanX < 1 || spanY < 1) return nodes;

  // Uniform scale keeps the graph's shape; cap it so tight clusters don't get
  // blown up past a sensible density.
  const scale = Math.min((width - 2 * padding) / spanX, (height - 2 * padding) / spanY, 3);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;

  return nodes.map((node) => ({
    ...node,
    x: (node.x - minX) * scale + offsetX,
    y: (node.y - minY) * scale + offsetY,
  }));
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    health_factor_monitoring: '#FF7A00', // Orange
    grid_trading: '#3ef2ff', // Cyan
    yield_optimisation: '#c6ff3e', // Lime
    rebalancing: '#ff3ea5', // Magenta
  };
  return colors[category] || '#8b8c96'; // Default gray
}
