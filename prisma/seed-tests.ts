import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TEST_SUITES = [
  {
    name: "Yield Optimization Benchmark",
    category: "yield_optimisation" as const,
    description: "Tests APY accuracy, opportunity discovery, and risk assessment for yield agents",
    hidden: false,
    testCases: [
      {
        name: "APY Calculation Accuracy",
        spec: {
          input: {
            pool: "PancakeSwap USDT-BUSD",
            tvl: 1000000,
            rewards24h: 100,
          },
          expectedOutput: {
            apy: 3.65,
          },
        },
        weight: 2.0,
        timeout: 10000,
      },
      {
        name: "Opportunity Discovery",
        spec: {
          input: {
            chains: ["bsc", "ethereum"],
            minAPY: 5,
            maxRisk: "MEDIUM",
          },
          expectedOutput: {
            opportunities: [{ protocol: "string", pool: "string", apy: 0 }],
          },
        },
        weight: 1.5,
        timeout: 15000,
      },
      {
        name: "Risk Assessment",
        spec: {
          input: {
            protocol: "Venus",
            pool: "USDT",
          },
          expectedOutput: {
            riskLevel: "LOW",
          },
        },
        weight: 1.0,
        timeout: 10000,
      },
    ],
  },
  {
    name: "Health Factor Monitoring Benchmark",
    category: "health_factor_monitoring" as const,
    description: "Tests calculation accuracy, risk classification, and liquidation warnings",
    hidden: false,
    testCases: [
      {
        name: "Health Factor Calculation",
        spec: {
          input: {
            collateral: 10000,
            debt: 5000,
            liquidationThreshold: 0.75,
          },
          expectedOutput: {
            healthFactor: 1.5,
          },
        },
        weight: 2.0,
        timeout: 5000,
      },
      {
        name: "Risk Classification",
        spec: {
          input: {
            healthFactor: 1.05,
          },
          expectedOutput: {
            riskLevel: "HIGH",
            alert: true,
          },
        },
        weight: 1.5,
        timeout: 5000,
      },
      {
        name: "Multi-Protocol Monitoring",
        spec: {
          input: {
            wallet: "0x1234567890123456789012345678901234567890",
            protocols: ["Aave", "Compound", "Venus"],
          },
          expectedOutput: {
            positions: [],
            overallHealthFactor: 0,
          },
        },
        weight: 1.0,
        timeout: 15000,
      },
    ],
  },
  {
    name: "Grid Trading Benchmark",
    category: "grid_trading" as const,
    description: "Tests strategy execution, slippage handling, and grid optimization",
    hidden: false,
    testCases: [
      {
        name: "Grid Setup Optimization",
        spec: {
          input: {
            pair: "BNB/USDT",
            budget: 10000,
            priceRange: { min: 200, max: 300 },
            gridLevels: 10,
          },
          expectedOutput: {
            gridSpacing: 10,
            orderSize: 1000,
          },
        },
        weight: 1.5,
        timeout: 10000,
      },
      {
        name: "Slippage Handling",
        spec: {
          input: {
            expectedPrice: 250,
            actualPrice: 252,
            maxSlippage: 1,
          },
          expectedOutput: {
            shouldExecute: false,
            reason: "Slippage exceeded",
          },
        },
        weight: 2.0,
        timeout: 5000,
      },
    ],
  },
  {
    name: "Rebalancing Benchmark",
    category: "rebalancing" as const,
    description: "Tests LP range optimization and rebalancing logic",
    hidden: false,
    testCases: [
      {
        name: "Range Optimization",
        spec: {
          input: {
            pair: "ETH/USDT",
            currentPrice: 2000,
            volatility: 0.05,
          },
          expectedOutput: {
            lowerBound: 1900,
            upperBound: 2100,
          },
        },
        weight: 1.5,
        timeout: 10000,
      },
      {
        name: "Rebalance Decision",
        spec: {
          input: {
            currentPrice: 2050,
            rangeMin: 1900,
            rangeMax: 2100,
            impermanentLoss: 0.02,
          },
          expectedOutput: {
            shouldRebalance: false,
          },
        },
        weight: 2.0,
        timeout: 5000,
      },
    ],
  },
  {
    name: "Hidden Security Tests",
    category: "yield_optimisation" as const,
    description: "Secret tests to prevent gaming",
    hidden: true,
    testCases: [
      {
        name: "Edge Case Handling",
        spec: {
          input: {
            pool: "Unknown Protocol",
            tvl: -1000,
          },
          expectedOutput: {
            error: "Invalid input",
          },
        },
        weight: 1.0,
        timeout: 5000,
      },
    ],
  },
];

async function main() {
  for (const suiteData of TEST_SUITES) {
    const { testCases, ...suiteInfo } = suiteData;

    const existing = await prisma.testSuite.findFirst({
      where: { name: suiteData.name },
    });

    let suite;
    if (existing) {
      suite = await prisma.testSuite.update({
        where: { id: existing.id },
        data: suiteInfo,
      });
    } else {
      suite = await prisma.testSuite.create({
        data: suiteInfo,
      });
    }

    for (const testCase of testCases) {
      const existing = await prisma.testCase.findFirst({
        where: {
          suiteId: suite.id,
          name: testCase.name,
        },
      });

      if (existing) {
        await prisma.testCase.update({
          where: { id: existing.id },
          data: testCase,
        });
      } else {
        await prisma.testCase.create({
          data: {
            ...testCase,
            suiteId: suite.id,
          },
        });
      }
    }

    console.log(`Seeded test suite: ${suite.name} with ${testCases.length} test cases`);
  }

  console.log(`\nSeeded ${TEST_SUITES.length} test suites with benchmarks`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
