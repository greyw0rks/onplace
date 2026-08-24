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

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category,
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
