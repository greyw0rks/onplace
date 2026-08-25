import "dotenv/config";
import { checkAllAgentsHealth } from "../src/lib/health-check";
import { prisma } from "../src/lib/db";

async function main() {
  const results = await checkAllAgentsHealth();
  for (const r of results) {
    console.log(
      `${r.agentId}: ${r.success ? "OK" : "FAIL"} latency=${r.latencyMs ?? "-"}ms uptime=${(r.uptimePct * 100).toFixed(0)}%${r.error ? ` error=${r.error}` : ""}`,
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
