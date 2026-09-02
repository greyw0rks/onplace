import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  {
    slug: "rebalancing" as const,
    name: "Rebalancing",
    description: "Manages LP ranges and resets positions automatically to stay in the efficient range.",
  },
  {
    slug: "grid_trading" as const,
    name: "Grid Trading",
    description: "Places and manages automated grid orders within a set price range.",
  },
  {
    slug: "yield_optimisation" as const,
    name: "Yield Optimisation",
    description: "Routes liquidity to the highest available APR across protocols.",
  },
  {
    slug: "health_factor_monitoring" as const,
    name: "Health Factor Monitoring",
    description: "Protects lending positions from liquidation by tracking health factor and acting early.",
  },
];

// Local development fixtures. Deliberately carry no `verified` flag: the badge
// is derived from real evidence by src/lib/verification.ts, and these have
// example.com endpoints that will never pass a health check.
const SAMPLE_AGENTS = [
  {
    name: "YieldMaximizer Pro",
    description: "Advanced yield optimization agent that scans multiple DeFi protocols to find the highest APY opportunities. Automatically rebalances based on market conditions.",
    developer: "DeFi Labs",
    endpointUrl: "https://api.example.com/agents/yield-maximizer",
    categorySlug: "yield_optimisation" as const,
    capabilities: ["READ_WALLET", "READ_MARKET_DATA", "ANALYZE_POSITION"],
    supportedChains: ["bsc", "ethereum", "polygon"],
    supportedProtocols: ["pancakeswap", "aave", "compound"],
    riskLevel: "MEDIUM" as const,
    reputationScore: 85,
    uptimePct: 0.98,
    priceAmount: "0.01",
    priceAsset: "BNB",
  },
  {
    name: "GridTrader Elite",
    description: "Automated grid trading bot for volatile markets. Sets up buy and sell orders at predetermined intervals to profit from price swings.",
    developer: "Trading Bots Inc",
    endpointUrl: "https://api.example.com/agents/grid-trader",
    categorySlug: "grid_trading" as const,
    capabilities: ["READ_WALLET", "READ_MARKET_DATA", "EXECUTE_SWAP"],
    supportedChains: ["bsc", "ethereum"],
    supportedProtocols: ["pancakeswap", "uniswap"],
    riskLevel: "HIGH" as const,
    reputationScore: 78,
    uptimePct: 0.95,
    priceAmount: "0.02",
    priceAsset: "BNB",
  },
  {
    name: "SafeHealth Guardian",
    description: "Monitors lending positions 24/7 and alerts you before liquidation risk. Tracks health factors across multiple protocols.",
    developer: "Safety First Labs",
    endpointUrl: "https://api.example.com/agents/safe-health",
    categorySlug: "health_factor_monitoring" as const,
    capabilities: ["READ_WALLET", "ANALYZE_POSITION"],
    supportedChains: ["bsc", "ethereum", "polygon", "arbitrum"],
    supportedProtocols: ["aave", "compound", "venus"],
    riskLevel: "LOW" as const,
    reputationScore: 92,
    uptimePct: 0.99,
    priceAmount: "0.005",
    priceAsset: "BNB",
  },
  {
    name: "LP Rebalancer",
    description: "Automatically rebalances liquidity provider positions to maintain optimal range. Reduces impermanent loss and maximizes fee collection.",
    developer: "LP Tools",
    endpointUrl: "https://api.example.com/agents/lp-rebalancer",
    categorySlug: "rebalancing" as const,
    capabilities: ["READ_WALLET", "READ_MARKET_DATA", "EXECUTE_SWAP"],
    supportedChains: ["bsc", "polygon"],
    supportedProtocols: ["pancakeswap", "uniswap"],
    riskLevel: "MEDIUM" as const,
    reputationScore: 81,
    uptimePct: 0.97,
    priceAmount: "0.015",
    priceAsset: "BNB",
  },
];

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category,
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);

  for (const agent of SAMPLE_AGENTS) {
    const existing = await prisma.agent.findFirst({
      where: { name: agent.name, developer: agent.developer },
    });

    if (existing) {
      await prisma.agent.update({
        where: { id: existing.id },
        data: agent,
      });
    } else {
      await prisma.agent.create({
        data: { ...agent, sourceType: "discovered" },
      });
    }
  }
  console.log(`Seeded ${SAMPLE_AGENTS.length} sample agents.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
