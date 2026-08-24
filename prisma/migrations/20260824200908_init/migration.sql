-- CreateEnum
CREATE TYPE "CategorySlug" AS ENUM ('rebalancing', 'grid_trading', 'yield_optimisation', 'health_factor_monitoring');

-- CreateEnum
CREATE TYPE "AgentSourceType" AS ENUM ('discovered', 'self_built');

-- CreateEnum
CREATE TYPE "HireStatus" AS ENUM ('pending', 'paid', 'completed', 'failed');

-- CreateTable
CREATE TABLE "Category" (
    "slug" "CategorySlug" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "erc8004Id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "developer" TEXT NOT NULL,
    "endpointUrl" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'bsc-testnet',
    "walletAddress" TEXT,
    "sourceType" "AgentSourceType" NOT NULL,
    "categorySlug" "CategorySlug" NOT NULL,
    "priceAmount" TEXT,
    "priceAsset" TEXT,
    "lastHealthCheckAt" TIMESTAMP(3),
    "latencyMs" INTEGER,
    "uptimePct" DOUBLE PRECISION,
    "reputationScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthCheck" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "latencyMs" INTEGER,
    "error" TEXT,

    CONSTRAINT "HealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hire" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "userWallet" TEXT,
    "txHash" TEXT,
    "amount" TEXT,
    "asset" TEXT,
    "status" "HireStatus" NOT NULL DEFAULT 'pending',
    "resultData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "hireId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_erc8004Id_key" ON "Agent"("erc8004Id");

-- CreateIndex
CREATE INDEX "Agent_categorySlug_idx" ON "Agent"("categorySlug");

-- CreateIndex
CREATE INDEX "HealthCheck_agentId_timestamp_idx" ON "HealthCheck"("agentId", "timestamp");

-- CreateIndex
CREATE INDEX "Hire_agentId_idx" ON "Hire"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_hireId_key" ON "Review"("hireId");

-- CreateIndex
CREATE INDEX "Review_agentId_idx" ON "Review"("agentId");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_categorySlug_fkey" FOREIGN KEY ("categorySlug") REFERENCES "Category"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCheck" ADD CONSTRAINT "HealthCheck_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hire" ADD CONSTRAINT "Hire_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_hireId_fkey" FOREIGN KEY ("hireId") REFERENCES "Hire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
