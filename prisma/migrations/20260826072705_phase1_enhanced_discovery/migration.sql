-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "capabilities" TEXT[],
ADD COLUMN     "communityScore" DOUBLE PRECISION,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "healthScore" DOUBLE PRECISION,
ADD COLUMN     "hireCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "performanceScore" DOUBLE PRECISION,
ADD COLUMN     "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "supportedChains" TEXT[],
ADD COLUMN     "supportedProtocols" TEXT[],
ADD COLUMN     "trendingScore" DOUBLE PRECISION,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserFollow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchQuery" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "clickedAgentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserFollow_userId_idx" ON "UserFollow"("userId");

-- CreateIndex
CREATE INDEX "UserFollow_agentId_idx" ON "UserFollow"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_userId_agentId_key" ON "UserFollow"("userId", "agentId");

-- CreateIndex
CREATE INDEX "SearchQuery_userId_idx" ON "SearchQuery"("userId");

-- CreateIndex
CREATE INDEX "SearchQuery_query_idx" ON "SearchQuery"("query");

-- CreateIndex
CREATE INDEX "Agent_verified_verifiedAt_idx" ON "Agent"("verified", "verifiedAt");

-- CreateIndex
CREATE INDEX "Agent_trendingScore_idx" ON "Agent"("trendingScore");

-- CreateIndex
CREATE INDEX "Agent_featured_idx" ON "Agent"("featured");

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
