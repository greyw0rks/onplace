-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('AGENT_REGISTERED', 'AGENT_VERIFIED', 'AGENT_HIRED', 'VERSION_RELEASED', 'PERFORMANCE_MILESTONE', 'SECURITY_INCIDENT', 'TEST_PASSED', 'BATTLE_COMPLETED');

-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "MarketplaceActivity" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "agentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentBattle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "CategorySlug" NOT NULL,
    "taskSpec" JSONB NOT NULL,
    "status" "BattleStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AgentBattle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentBattleResult" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "AgentBattleResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketplaceActivity_type_createdAt_idx" ON "MarketplaceActivity"("type", "createdAt");

-- CreateIndex
CREATE INDEX "MarketplaceActivity_createdAt_idx" ON "MarketplaceActivity"("createdAt");

-- CreateIndex
CREATE INDEX "AgentBattle_status_startedAt_idx" ON "AgentBattle"("status", "startedAt");

-- CreateIndex
CREATE INDEX "AgentBattle_category_idx" ON "AgentBattle"("category");

-- CreateIndex
CREATE INDEX "AgentBattleResult_battleId_rank_idx" ON "AgentBattleResult"("battleId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "AgentBattleResult_battleId_agentId_key" ON "AgentBattleResult"("battleId", "agentId");

-- AddForeignKey
ALTER TABLE "MarketplaceActivity" ADD CONSTRAINT "MarketplaceActivity_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentBattleResult" ADD CONSTRAINT "AgentBattleResult_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "AgentBattle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentBattleResult" ADD CONSTRAINT "AgentBattleResult_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
