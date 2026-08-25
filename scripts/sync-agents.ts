import "dotenv/config";
import { syncAgents } from "../src/lib/sync-agents";
import { prisma } from "../src/lib/db";

async function main() {
  const results = await syncAgents();
  for (const [slug, count] of Object.entries(results)) {
    console.log(`${slug}: synced ${count} agents`);
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
