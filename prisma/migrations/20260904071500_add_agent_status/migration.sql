-- Operational status for agents.
--
-- Until now the only state an agent had was the boolean `verified`, which
-- conflates "we have not proven this yet" with "we proved it is broken". That
-- made it impossible to express the outcome a failing test should have, so a
-- failed verification changed nothing a user could see.
--
-- SUSPENDED is an operator decision and is never set by the sweep; the other
-- states are recomputed from health-check evidence on every run.

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('MONITORING', 'TESTING', 'HEALTHY', 'DEGRADED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Agent"
  ADD COLUMN "status" "AgentStatus" NOT NULL DEFAULT 'MONITORING',
  ADD COLUMN "statusReason" TEXT,
  ADD COLUMN "statusChangedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Agent_status_idx" ON "Agent"("status");

-- AlterEnum
-- Status transitions need feed entries of their own; reusing
-- PERFORMANCE_MILESTONE for "went degraded" would render the wrong icon and
-- colour in ActivityFeed.
ALTER TYPE "ActivityType" ADD VALUE 'AGENT_UNVERIFIED' AFTER 'AGENT_VERIFIED';
ALTER TYPE "ActivityType" ADD VALUE 'AGENT_DEGRADED' AFTER 'AGENT_UNVERIFIED';
ALTER TYPE "ActivityType" ADD VALUE 'AGENT_RECOVERED' AFTER 'AGENT_DEGRADED';
