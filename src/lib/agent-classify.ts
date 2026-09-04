import { CategorySlug } from "@/generated/prisma/enums";

/**
 * Per-agent category classification.
 *
 * The previous sync ran one semantic query per category and filed the top ten
 * results under it regardless of relevance, so a weather demo landed in Grid
 * Trading. Worse, `erc8004Id` is unique and the categories upserted in sequence,
 * so an agent matching two queries had its category overwritten by whichever
 * category iterated last — the assignment was a function of loop order.
 *
 * This scores each agent once against all four categories and requires a floor,
 * so an agent that matches nothing is reported as unclassifiable rather than
 * silently filed somewhere.
 *
 * Term weights follow the brief's own definitions of the four categories.
 */
const LEXICON: Record<CategorySlug, Array<[string, number]>> = {
  rebalancing: [
    ["rebalanc", 5],
    ["lp range", 5],
    ["liquidity range", 5],
    ["concentrated liquidity", 4],
    ["reset position", 4],
    ["position manag", 3],
    ["range order", 3],
    ["v3 pool", 3],
    ["uniswap v3", 2],
    ["pancakeswap v3", 3],
    ["portfolio", 2],
    ["allocation", 2],
    ["impermanent loss", 2],
    ["range", 2],
  ],
  grid_trading: [
    ["grid trading", 6],
    ["grid order", 6],
    ["grid bot", 5],
    ["grid strateg", 5],
    ["grid", 3],
    ["dca", 2],
    ["limit order", 2],
    ["price range order", 2],
    ["automated trading", 2],
    ["trading bot", 2],
    ["market making", 2],
    ["spot trading", 1],
    ["pancakeswap grid", 5],
  ],
  yield_optimisation: [
    ["yield optimi", 6],
    ["yield aggregat", 5],
    ["highest apr", 5],
    ["best apy", 5],
    ["apr", 3],
    ["apy", 3],
    ["yield farm", 4],
    ["auto-compound", 4],
    ["autocompound", 4],
    ["staking reward", 3],
    ["route liquidity", 3],
    ["vault strateg", 3],
    ["yield", 3],
    ["harvest", 3],
    ["compound", 3],
    ["beefy", 3],
  ],
  health_factor_monitoring: [
    ["health factor", 6],
    ["liquidation", 5],
    ["collateral ratio", 5],
    ["lending position", 4],
    ["loan health", 4],
    ["margin call", 3],
    ["risk monitor", 3],
    ["risk assess", 3],
    ["venus", 2],
    ["aave", 2],
    ["borrow", 2],
    ["collateral", 2],
    ["liquidation risk", 5],
    ["protect", 2],
    ["shield", 2],
    ["health monitor", 4],
  ],
};

/**
 * Below this an agent is treated as unclassifiable rather than mis-filed.
 *
 * Set against measured results: at 4, genuine agents named `GridPilot`,
 * `AltanaGridBot`, `Assay Grid` and `YieldPilot` were all discarded on a score of
 * 2–3, which starved Grid Trading while Rebalancing kept seven agents — the exact
 * imbalance the brief penalises. At 3, with name matches weighted double, those
 * land in the right category and the genuinely undescribable ones (`weatherdemo`,
 * `claw`, `terry.agent`) still score 0 and stay out.
 */
export const CLASSIFY_FLOOR = 3;

/** A term in the agent's *name* is far more diagnostic than one buried in prose. */
const NAME_WEIGHT_MULTIPLIER = 2;

export interface Classification {
  category: CategorySlug | null;
  score: number;
  /** Terms that actually matched, so a card can show why it is in this category. */
  matched: string[];
  runnerUp: { category: CategorySlug; score: number } | null;
}

export function classifyAgent(input: {
  name?: string | null;
  description?: string | null;
  protocols?: string[] | null;
}): Classification {
  const name = (input.name ?? "").toLowerCase();
  const body = [input.description ?? "", (input.protocols ?? []).join(" ")]
    .join(" ")
    .toLowerCase();

  const scored = (Object.keys(LEXICON) as CategorySlug[])
    .map((category) => {
      const matched: string[] = [];
      let score = 0;
      for (const [term, weight] of LEXICON[category]) {
        const inName = name.includes(term);
        const inBody = body.includes(term);
        if (!inName && !inBody) continue;
        score += inName ? weight * NAME_WEIGHT_MULTIPLIER : weight;
        matched.push(term);
      }
      return { category, score, matched };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const second = scored[1];

  if (best.score < CLASSIFY_FLOOR) {
    return { category: null, score: best.score, matched: [], runnerUp: null };
  }

  return {
    category: best.category,
    score: best.score,
    matched: best.matched,
    runnerUp: second.score > 0 ? { category: second.category, score: second.score } : null,
  };
}

/**
 * Capabilities worth showing on a card, derived from the terms that matched.
 * Labelled from the lexicon rather than invented, so every chip on the profile
 * traces back to a word the agent's own registry metadata used.
 */
const CAPABILITY_LABELS: Record<string, string> = {
  rebalanc: "Rebalancing",
  "lp range": "LP range management",
  "liquidity range": "LP range management",
  "concentrated liquidity": "Concentrated liquidity",
  "reset position": "Position resets",
  "position manag": "Position management",
  "pancakeswap v3": "PancakeSwap v3",
  "uniswap v3": "Uniswap v3",
  "v3 pool": "v3 pools",
  portfolio: "Portfolio management",
  "impermanent loss": "Impermanent-loss aware",
  "grid trading": "Grid trading",
  "grid order": "Grid orders",
  "grid bot": "Grid automation",
  "grid strateg": "Grid strategy",
  dca: "DCA",
  "limit order": "Limit orders",
  "market making": "Market making",
  "trading bot": "Automated trading",
  "automated trading": "Automated trading",
  "yield optimi": "Yield optimisation",
  "yield aggregat": "Yield aggregation",
  "highest apr": "APR routing",
  "best apy": "APY routing",
  "yield farm": "Yield farming",
  "auto-compound": "Auto-compounding",
  autocompound: "Auto-compounding",
  "staking reward": "Staking rewards",
  "vault strateg": "Vault strategies",
  "health factor": "Health-factor monitoring",
  liquidation: "Liquidation protection",
  "liquidation risk": "Liquidation risk scoring",
  "collateral ratio": "Collateral ratio tracking",
  "lending position": "Lending positions",
  "loan health": "Loan health",
  "risk monitor": "Risk monitoring",
  "risk assess": "Risk assessment",
  venus: "Venus",
  aave: "Aave",
  borrow: "Borrow positions",
  range: "Range management",
  "pancakeswap grid": "PancakeSwap grid",
  harvest: "Reward harvesting",
  compound: "Auto-compounding",
  beefy: "Beefy",
  protect: "Position protection",
  shield: "Position protection",
  "health monitor": "Health monitoring",
  grid: "Grid trading",
  yield: "Yield strategies",
  apr: "APR tracking",
  apy: "APY tracking",
  allocation: "Allocation management",
  "range order": "Range orders",
  "price range order": "Range orders",
  "spot trading": "Spot trading",
  "margin call": "Margin monitoring",
  collateral: "Collateral tracking",
};

export function capabilitiesFrom(matched: string[]): string[] {
  const labels = matched.map((term) => CAPABILITY_LABELS[term]).filter(Boolean) as string[];
  return [...new Set(labels)].slice(0, 6);
}

/**
 * Whether an endpoint could ever be reached by a user's browser or agent.
 *
 * A quarter of the synced marketplace advertised hosts that cannot resolve for
 * anyone: `http://risk-assessor:8000/a2a` (a docker service name),
 * `portfolio-rebalancer.bnbagent.example`, `localhost:8000`, `127.0.0.1:9000`.
 * These are real registry entries, so they stay in the database — but listing
 * them as hireable agents is what makes uptime read as 66% failure.
 */
export function endpointProblem(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "endpoint is not a valid URL";
  }

  const host = parsed.hostname.toLowerCase();

  if (host === "localhost" || host.endsWith(".localhost")) return "endpoint points at localhost";
  if (host === "127.0.0.1" || host.startsWith("127.")) return "endpoint points at loopback";
  if (host === "0.0.0.0" || host === "::1") return "endpoint points at loopback";
  if (/\.(example|invalid|test|local|internal)$/.test(host)) {
    return `endpoint uses the reserved .${host.split(".").pop()} suffix`;
  }
  // A bare label with no dot is a container/service name, not a public host.
  if (!host.includes(".")) return "endpoint host is not publicly resolvable";
  // RFC1918 ranges.
  if (/^10\./.test(host) || /^192\.168\./.test(host)) return "endpoint points at a private network";
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return "endpoint points at a private network";

  return null;
}
