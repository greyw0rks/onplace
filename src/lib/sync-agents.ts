import { CategorySlug, AgentSourceType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { searchAgentsSemantic, type EightAgent } from "@/lib/eight004scan";

const BSC_CHAIN_IDS = [56, 97]; // mainnet, testnet

const CATEGORY_QUERIES: Record<CategorySlug, string> = {
  rebalancing:
    "manages LP ranges resets positions automatically rebalancing liquidity provider concentrated liquidity",
  grid_trading: "automated grid trading places grid orders within a price range",
  yield_optimisation: "yield optimisation routes liquidity highest APR farming best yield",
  health_factor_monitoring:
    "health factor monitoring lending liquidation protection risk detection",
};

const AGENTS_PER_CATEGORY = 10;

function pickDeveloper(agent: EightAgent): string {
  if (agent.owner_ens) return agent.owner_ens;
  if (agent.owner_username) return agent.owner_username;
  return `${agent.owner_address.slice(0, 6)}...${agent.owner_address.slice(-4)}`;
}

function pickEndpoint(agent: EightAgent): string | null {
  return (
    agent.services?.a2a?.endpoint ??
    agent.services?.mcp?.endpoint ??
    agent.agent_url ??
    null
  );
}

async function syncCategory(slug: CategorySlug, query: string) {
  const seen = new Set<string>();
  let synced = 0;

  for (const chainId of BSC_CHAIN_IDS) {
    if (synced >= AGENTS_PER_CATEGORY) break;

    const { items } = await searchAgentsSemantic(query, { chainId, limit: AGENTS_PER_CATEGORY });

    for (const agent of items) {
      if (synced >= AGENTS_PER_CATEGORY) break;
      if (seen.has(agent.agent_id)) continue;
      seen.add(agent.agent_id);

      const endpointUrl = pickEndpoint(agent);
      if (!endpointUrl || !agent.name) continue;

      await prisma.agent.upsert({
        where: { erc8004Id: agent.agent_id },
        update: {
          name: agent.name,
          description: agent.description ?? "",
          developer: pickDeveloper(agent),
          endpointUrl,
          chain: agent.is_testnet ? "bsc-testnet" : "bsc-mainnet",
          walletAddress: agent.agent_wallet,
          categorySlug: slug,
          reputationScore: agent.total_score,
        },
        create: {
          erc8004Id: agent.agent_id,
          name: agent.name,
          description: agent.description ?? "",
          developer: pickDeveloper(agent),
          endpointUrl,
          chain: agent.is_testnet ? "bsc-testnet" : "bsc-mainnet",
          walletAddress: agent.agent_wallet,
          sourceType: AgentSourceType.discovered,
          categorySlug: slug,
          reputationScore: agent.total_score,
        },
      });
      synced += 1;
    }
  }

  return synced;
}

export async function syncAgents() {
  const results: Record<string, number> = {};
  for (const slug of Object.values(CategorySlug)) {
    results[slug] = await syncCategory(slug, CATEGORY_QUERIES[slug]);
  }
  return results;
}
