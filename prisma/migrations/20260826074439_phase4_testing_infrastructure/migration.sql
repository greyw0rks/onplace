-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('PASSED', 'FAILED', 'TIMEOUT', 'ERROR', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TestFrequency" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ON_DEMAND');

-- CreateEnum
CREATE TYPE "ChangeRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "TestSuite" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CategorySlug" NOT NULL,
    "description" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestSuite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCase" (
    "id" TEXT NOT NULL,
    "suiteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "timeout" INTEGER NOT NULL DEFAULT 30000,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "versionId" TEXT,
    "status" "TestStatus" NOT NULL,
    "score" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "error" TEXT,
    "output" JSONB,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSchedule" (
    "id" TEXT NOT NULL,
    "agentId" TEXT,
    "suiteId" TEXT,
    "category" "CategorySlug",
    "frequency" "TestFrequency" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitRepository" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "lastCommit" TEXT,
    "lastCheck" TIMESTAMP(3),
    "webhookSecret" TEXT,

    CONSTRAINT "GitRepository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitCommit" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "analyzed" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" "ChangeRiskLevel",
    "changesSummary" JSONB,

    CONSTRAINT "GitCommit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestSuite_category_hidden_idx" ON "TestSuite"("category", "hidden");

-- CreateIndex
CREATE INDEX "TestCase_suiteId_idx" ON "TestCase"("suiteId");

-- CreateIndex
CREATE INDEX "TestResult_agentId_executedAt_idx" ON "TestResult"("agentId", "executedAt");

-- CreateIndex
CREATE INDEX "TestResult_testCaseId_agentId_idx" ON "TestResult"("testCaseId", "agentId");

-- CreateIndex
CREATE INDEX "TestResult_status_idx" ON "TestResult"("status");

-- CreateIndex
CREATE INDEX "TestSchedule_enabled_nextRun_idx" ON "TestSchedule"("enabled", "nextRun");

-- CreateIndex
CREATE UNIQUE INDEX "GitRepository_agentId_key" ON "GitRepository"("agentId");

-- CreateIndex
CREATE INDEX "GitCommit_repoId_timestamp_idx" ON "GitCommit"("repoId", "timestamp");

-- CreateIndex
CREATE INDEX "GitCommit_analyzed_idx" ON "GitCommit"("analyzed");

-- CreateIndex
CREATE UNIQUE INDEX "GitCommit_repoId_hash_key" ON "GitCommit"("repoId", "hash");

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "TestSuite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "TestCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "AgentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSchedule" ADD CONSTRAINT "TestSchedule_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSchedule" ADD CONSTRAINT "TestSchedule_suiteId_fkey" FOREIGN KEY ("suiteId") REFERENCES "TestSuite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitRepository" ADD CONSTRAINT "GitRepository_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GitCommit" ADD CONSTRAINT "GitCommit_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "GitRepository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
