/**
 * Applies a migration to a database Prisma's Rust migration engine cannot reach
 * (P1001 against db.prisma.io while the Node pg client connects fine), then
 * writes the _prisma_migrations row by hand so Prisma does not report drift.
 *
 * Statements run one at a time outside an explicit transaction: Postgres refuses
 * ALTER TYPE ... ADD VALUE inside a transaction block that also uses the new
 * value, and these migrations are additive so there is nothing to roll back.
 *
 * Usage:
 *   npx tsx scripts/apply-migration.ts 20260904093000_add_agent_listing_gate [--env .env.production]
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { Client } from "pg";

function loadEnvValue(path: string, key: string): string | undefined {
  // Read directly rather than via dotenv: dotenv will not override an already-set
  // var, and .env points at a local dev database that is usually not running.
  try {
    const match = readFileSync(path, "utf8").match(
      new RegExp(`^${key}=["']?(.+?)["']?$`, "m")
    );
    return match?.[1];
  } catch {
    return undefined;
  }
}

/** Split on semicolons that end a line, which is enough for DDL we author ourselves. */
function statementsOf(sql: string): string[] {
  return sql
    .split(/;\s*$/m)
    .map((chunk) =>
      chunk
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter((chunk) => chunk.length > 0);
}

async function main() {
  const migration = process.argv[2];
  if (!migration) throw new Error("usage: apply-migration.ts <migration_dir_name> [--env <file>]");

  const envFlag = process.argv.indexOf("--env");
  const envPath = envFlag > -1 ? process.argv[envFlag + 1] : ".env.production";

  const sqlPath = `prisma/migrations/${migration}/migration.sql`;
  const sql = readFileSync(sqlPath, "utf8");

  const connectionString = loadEnvValue(envPath, "DATABASE_URL") ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error(`DATABASE_URL not found in ${envPath} or the environment`);

  const host = new URL(connectionString.replace(/^postgres(ql)?:\/\//, "https://")).host;
  console.log(`applying ${migration} to ${host}`);

  const client = new Client({ connectionString });
  await client.connect();

  try {
    for (const statement of statementsOf(sql)) {
      const label = statement.slice(0, 78).replace(/\s+/g, " ");
      try {
        await client.query(statement);
        console.log(`  ok    ${label}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Re-running must be safe; a partial earlier run should not block the rest.
        if (/already exists|duplicate/i.test(message)) {
          console.log(`  skip  ${label}  (${message})`);
        } else {
          throw err;
        }
      }
    }

    const checksum = createHash("sha256").update(readFileSync(sqlPath)).digest("hex");
    const existing = await client.query(
      `SELECT id FROM "_prisma_migrations" WHERE migration_name = $1`,
      [migration]
    );

    if (existing.rowCount === 0) {
      await client.query(
        `INSERT INTO "_prisma_migrations"
           (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
         VALUES (gen_random_uuid()::text, $1, now(), $2, NULL, NULL, now(), 1)`,
        [checksum, migration]
      );
      console.log(`recorded ${migration} (checksum ${checksum.slice(0, 12)}…)`);
    } else {
      console.log(`${migration} was already recorded`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
