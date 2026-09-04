import "dotenv/config";
import { syncAgents } from "../src/lib/sync-agents";
import { prisma } from "../src/lib/db";

async function main() {
  const report = await syncAgents();

  console.log(`candidates discovered: ${report.candidates}`);
  console.log(`written:               ${report.written}`);
  console.log(`listed:                ${report.listed}`);

  const r = report.reconciled;
  console.log(
    `reconciled:            ${r.examined} examined, ${r.recategorised} recategorised, ` +
      `${r.unlisted} unlisted, ${r.relisted} relisted`
  );

  console.log("\nlisted per category (whole marketplace):");
  for (const [category, count] of Object.entries(report.perCategory).sort()) {
    console.log(`  ${category.padEnd(26)} ${count}`);
  }

  if (Object.keys(report.unlisted).length > 0) {
    console.log("\nunlisted (kept in the database, hidden from listings):");
    for (const [reason, count] of Object.entries(report.unlisted).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(count).padStart(3)}  ${reason}`);
    }
  }

  if (report.unclassified.length > 0) {
    console.log(
      `\nskipped as unclassifiable (below the relevance floor) — ${report.unclassified.length}:`
    );
    for (const { name, score } of report.unclassified.slice(0, 25)) {
      console.log(`  ${String(score).padStart(2)}  ${name}`);
    }
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
