import "dotenv/config";
import { runHealthFactorCheck } from "../src/lib/self-built-agent";
import { prisma } from "../src/lib/db";

async function main() {
  const agent = await prisma.agent.findFirstOrThrow({
    where: { sourceType: "self_built", categorySlug: "health_factor_monitoring" },
  });
  const result = await runHealthFactorCheck(agent.id);
  console.log(`Feedback tx: ${result.txHash}`);
  console.log(`Monitored wallet: ${JSON.stringify(result.monitored)}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
