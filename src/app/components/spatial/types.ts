// Spatial Dashboard Type Definitions

export interface NetworkNode {
  id: string;
  name: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  size: number; // trust score 0-100 → radius 10-40px
  category: string;
  color: string;
  active: boolean; // health check in last hour
  trustScore: number;
  developer: string;
}

export interface NetworkEdge {
  source: string;
  target: string;
  type: 'same_developer' | 'similar_tests' | 'user_cohire';
  strength: number; // 0-1
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface AgentActivity {
  hour: string;
  checks: number;
}

export interface MarketplaceStats {
  totalAgents: number;
  registeredAgents: number;
  activeAgents: number;
  totalTxs: number;
  totalCategories: number;
  recentHires: number;
  warnings: number;
  successfulChecks: number;
  failedChecks: number;
  onchainProofs: number;
  lastCheckAt: string | null;
  activityWindowHours: number;
  hourlyActivity: AgentActivity[];
}
