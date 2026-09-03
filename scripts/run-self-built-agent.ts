import "dotenv/config";
import { checkAgentHealth } from "../src/lib/health-check";
import { prisma } from "../src/lib/db";

async function main() {
  const agent = await prisma.agent.findFirstOrThrow({
    where: { sourceType: "self_built", categorySlug: "health_factor_monitoring" },
  });

  // Same path the scheduled sweep uses, so a manual run and a cron run produce
  // identical records rather than two subtly different kinds of health check.
  const result = await checkAgentHealth(agent.id);

  if (!result.success) {
    throw new Error(`verification failed: ${result.error}`);
  }

  console.log(`On-chain proof: ${result.txHash}`);
  console.log(`Health factor:  ${result.healthFactor}`);
  console.log(`Collateral USD: ${result.collateralValueUsd}`);
  console.log(`Borrowed USD:   ${result.borrowValueUsd}`);
  console.log(`Uptime:         ${(result.uptimePct * 100).toFixed(1)}%`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
