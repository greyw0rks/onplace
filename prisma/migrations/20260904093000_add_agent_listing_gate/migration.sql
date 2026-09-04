-- Marketplace listing gate.
--
-- 9 of 36 synced agents were redundant on-chain registrations of the same
-- service (eight copies of rune-a2a-risk-assessor alone, all pointing at the
-- docker-internal host http://risk-assessor:8000/a2a), and several more advertise
-- endpoints that can never resolve for a user — .example domains, localhost,
-- 127.0.0.1. Deleting them would discard real registry facts and their check
-- history, so they are unlisted instead and kept auditable.

-- AlterTable
ALTER TABLE "Agent"
  ADD COLUMN "listed" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "unlistedReason" TEXT;

-- CreateIndex
CREATE INDEX "Agent_listed_categorySlug_idx" ON "Agent"("listed", "categorySlug");
