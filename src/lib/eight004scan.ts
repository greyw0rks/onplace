const RAW_API_BASE = process.env.EIGHT004SCAN_API_BASE ?? "https://api.8004scan.io";
const API_BASE = RAW_API_BASE.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "") + "/api/v1/";
const API_KEY = process.env.EIGHT004SCAN_API_KEY;

export interface EightAgentServices {
  mcp?: { endpoint?: string | null } | null;
  a2a?: { endpoint?: string | null } | null;
}

export interface EightAgent {
  id: string;
  agent_id: string;
  token_id: string;
  chain_id: number;
  is_testnet: boolean;
  contract_address: string;
  owner_address: string;
  owner_ens: string | null;
  owner_username: string | null;
  name: string | null;
  description: string | null;
  is_verified: boolean;
  is_active?: boolean;
  agent_wallet: string | null;
  x402_supported: boolean;
  supported_protocols: string[];
  services: EightAgentServices | null;
  agent_url?: string | null;
  total_score: number;
  average_score: number;
  total_feedbacks: number;
  health_score: number | null;
  updated_at: string;
}

interface EightAgentSearchResponse {
  items: EightAgent[];
  total?: number;
}

async function eightFetch<T>(path: string, params: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(path, API_BASE);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = {};
  if (API_KEY) headers["X-API-Key"] = API_KEY;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`8004scan request failed: ${res.status} ${res.statusText} (${url.pathname})`);
  }
  return res.json() as Promise<T>;
}

export function searchAgentsSemantic(
  query: string,
  opts: { chainId: number; limit?: number },
): Promise<EightAgentSearchResponse> {
  return eightFetch<EightAgentSearchResponse>("agents/search/semantic", {
    q: query,
    chain_id: opts.chainId,
    limit: opts.limit ?? 10,
  });
}

export function getAgentByChainAndToken(chainId: number, tokenId: string): Promise<EightAgent> {
  return eightFetch<EightAgent>(`agents/${chainId}/${tokenId}`, {});
}
