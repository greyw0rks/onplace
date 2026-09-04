import { CategorySlug, AgentSourceType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { searchAgentsSemantic, type EightAgent } from "@/lib/eight004scan";
import {
  capabilitiesFrom,
  classifyAgent,
  endpointProblem,
  type Classification,
} from "@/lib/agent-classify";

const BSC_CHAIN_IDS = [56, 97]; // mainnet, testnet

/**
 * Queries used only to *discover* candidates. They no longer decide the
 * category — every candidate is pooled and then classified once. Filing the top
 * ten of each query under that query is what put a weather demo in Grid Trading.
 */
const DISCOVERY_QUERIES: Record<CategorySlug, string> = {
  rebalancing:
    "manages LP ranges resets positions automatically rebalancing liquidity provider concentrated liquidity",
  grid_trading: "automated grid trading places grid orders within a price range",
  yield_optimisation: "yield optimisation routes liquidity highest APR farming best yield",
  health_factor_monitoring:
    "health factor monitoring lending liquidation protection risk detection",
};

const CANDIDATES_PER_QUERY = 25;

function pickDeveloper(agent: EightAgent): string {
  if (agent.owner_ens) return agent.owner_ens;
  if (agent.owner_username) return agent.owner_username;
  return `${agent.owner_address.slice(0, 6)}...${agent.owner_address.slice(-4)}`;
}

function pickEndpoint(agent: EightAgent): string | null {
  return agent.services?.a2a?.endpoint ?? agent.services?.mcp?.endpoint ?? agent.agent_url ?? null;
}

/**
 * Community score from the registry's own feedback, damped by sample size so one
 * five-star rating does not outrank twenty good ones. Returns null when there is
 * no feedback at all, rather than inventing a midpoint.
 */
function communityScoreFrom(agent: EightAgent): number | null {
  if (!agent.total_feedbacks || agent.total_feedbacks < 1) return null;
  const confidence = Math.min(agent.total_feedbacks / 10, 1);
  const normalised = Math.max(0, Math.min(agent.average_score, 5)) / 5;
  return Math.round(normalised * 100 * confidence * 100) / 100;
}

export interface SyncReport {
  candidates: number;
  written: number;
  listed: number;
  unlisted: Record<string, number>;
  perCategory: Record<string, number>;
  unclassified: Array<{ name: string; score: number }>;
  reconciled: {
    examined: number;
    recategorised: number;
    unlisted: number;
    relisted: number;
  };
}

/**
 * Re-derive category, capabilities and listing state for every discovered agent
 * already in the database, using the metadata we stored rather than the registry.
 *
 * This exists because a sync run only sees what the semantic search happens to
 * return: rows written by earlier runs keep whatever category the old
 * top-ten-per-query logic gave them, so `weatherdemo` stayed filed under Grid
 * Trading long after the classifier would have rejected it. Reconciling from
 * stored metadata costs no network calls and makes the marketplace self-heal, so
 * a legitimate agent that simply fell out of today's search results is
 * re-examined instead of silently dropped.
 */
async function reconcileAgents(): Promise<SyncReport["reconciled"]> {
  const agents = await prisma.agent.findMany({
    where: { sourceType: AgentSourceType.discovered },
    select: {
      id: true,
      erc8004Id: true,
      name: true,
      description: true,
      endpointUrl: true,
      categorySlug: true,
      supportedProtocols: true,
      reputationScore: true,
      listed: true,
    },
    orderBy: { reputationScore: "desc" },
  });

  const result = { examined: agents.length, recategorised: 0, unlisted: 0, relisted: 0 };
  const canonical = new Map<string, string>();

  for (const agent of agents) {
    const classification = classifyAgent({
      name: agent.name,
      description: agent.description,
      protocols: agent.supportedProtocols,
    });

    const dedupeKey = `${agent.name.toLowerCase()}|${agent.endpointUrl.toLowerCase()}`;

    let unlistedReason: string | null = endpointProblem(agent.endpointUrl);

    if (!unlistedReason && !classification.category) {
      unlistedReason = `no category matched above the relevance floor (scored ${classification.score})`;
    }

    if (!unlistedReason && canonical.has(dedupeKey)) {
      unlistedReason = `duplicate registration of ${canonical.get(dedupeKey)}`;
    }

    if (!unlistedReason) canonical.set(dedupeKey, agent.erc8004Id ?? agent.id);

    const shouldList = unlistedReason === null;
    const nextCategory = classification.category ?? agent.categorySlug;
    const categoryChanged = nextCategory !== agent.categorySlug;

    if (!categoryChanged && shouldList === agent.listed) continue;

    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        categorySlug: nextCategory,
        capabilities: capabilitiesFrom(classification.matched),
        listed: shouldList,
        unlistedReason,
      },
    });

    if (categoryChanged) result.recategorised += 1;
    if (shouldList !== agent.listed) {
      if (shouldList) result.relisted += 1;
      else result.unlisted += 1;
    }
  }

  return result;
}

/** Collect every candidate across all four queries and both chains, keyed by agent id. */
async function gatherCandidates(): Promise<Map<string, EightAgent>> {
  const pool = new Map<string, EightAgent>();

  for (const query of Object.values(DISCOVERY_QUERIES)) {
    for (const chainId of BSC_CHAIN_IDS) {
      try {
        const { items } = await searchAgentsSemantic(query, {
          chainId,
          limit: CANDIDATES_PER_QUERY,
        });
        for (const agent of items) {
          if (!pool.has(agent.agent_id)) pool.set(agent.agent_id, agent);
        }
      } catch (err) {
        // One failing query must not empty the marketplace.
        console.error(`8004scan query failed (chain ${chainId}):`, err);
      }
    }
  }

  return pool;
}

export async function syncAgents(): Promise<SyncReport> {
  const pool = await gatherCandidates();

  const report: SyncReport = {
    candidates: pool.size,
    written: 0,
    listed: 0,
    unlisted: {},
    perCategory: {},
    unclassified: [],
    reconciled: { examined: 0, recategorised: 0, unlisted: 0, relisted: 0 },
  };

  const decided: Array<{
    agent: EightAgent;
    endpointUrl: string;
    classification: Classification;
    category: CategorySlug;
  }> = [];

  for (const agent of pool.values()) {
    const endpointUrl = pickEndpoint(agent);
    if (!endpointUrl || !agent.name) continue;

    const classification = classifyAgent({
      name: agent.name,
      description: agent.description,
      protocols: agent.supported_protocols,
    });

    if (!classification.category) {
      report.unclassified.push({ name: agent.name, score: classification.score });
      continue;
    }

    decided.push({ agent, endpointUrl, classification, category: classification.category });
  }

  // Strongest first, so the registration that wins a dedupe is the one with the
  // best registry score rather than whichever happened to be seen first.
  decided.sort((a, b) => (b.agent.total_score ?? 0) - (a.agent.total_score ?? 0));

  // A service registered N times is still one service. Keep the strongest
  // registration listed and unlist its clones instead of showing identical cards.
  const canonical = new Map<string, string>();

  for (const { agent, endpointUrl, classification, category } of decided) {
    const dedupeKey = `${agent.name!.toLowerCase()}|${endpointUrl.toLowerCase()}`;

    let unlistedReason: string | null = endpointProblem(endpointUrl);

    if (!unlistedReason && canonical.has(dedupeKey)) {
      unlistedReason = `duplicate registration of ${canonical.get(dedupeKey)}`;
    }

    if (!unlistedReason) canonical.set(dedupeKey, agent.agent_id);

    const shared = {
      name: agent.name!,
      description: agent.description ?? "",
      developer: pickDeveloper(agent),
      endpointUrl,
      chain: agent.is_testnet ? "bsc-testnet" : "bsc-mainnet",
      walletAddress: agent.agent_wallet,
      categorySlug: category,
      reputationScore: agent.total_score,
      capabilities: capabilitiesFrom(classification.matched),
      supportedChains: [agent.is_testnet ? "bsc-testnet" : "bsc-mainnet"],
      supportedProtocols: agent.supported_protocols ?? [],
      communityScore: communityScoreFrom(agent),
      healthScore: agent.health_score,
      listed: unlistedReason === null,
      unlistedReason,
    };

    await prisma.agent.upsert({
      where: { erc8004Id: agent.agent_id },
      update: shared,
      create: { erc8004Id: agent.agent_id, sourceType: AgentSourceType.discovered, ...shared },
    });

    report.written += 1;

    if (unlistedReason === null) {
      report.listed += 1;
      report.perCategory[category] = (report.perCategory[category] ?? 0) + 1;
    } else {
      const bucket = unlistedReason.startsWith("duplicate")
        ? "duplicate registration"
        : unlistedReason;
      report.unlisted[bucket] = (report.unlisted[bucket] ?? 0) + 1;
    }
  }

  // Rows written by earlier runs carry categories from the old logic, so bring
  // the whole table up to the current classifier before reporting totals.
  report.reconciled = await reconcileAgents();

  const listedByCategory = await prisma.agent.groupBy({
    by: ["categorySlug"],
    where: { listed: true },
    _count: { _all: true },
  });
  report.perCategory = Object.fromEntries(
    listedByCategory.map((row) => [row.categorySlug, row._count._all])
  );
  report.listed = await prisma.agent.count({ where: { listed: true } });

  return report;
}
