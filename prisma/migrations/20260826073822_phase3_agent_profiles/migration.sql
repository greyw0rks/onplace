-- CreateEnum
CREATE TYPE "SecurityLevel" AS ENUM ('NOT_AUDITED', 'BASIC', 'STANDARD', 'COMPREHENSIVE', 'CRITICAL');

-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('PENDING', 'TESTING', 'VERIFIED', 'FAILED', 'DEPRECATED');

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "currentVersion" TEXT,
ADD COLUMN     "documentationUrl" TEXT,
ADD COLUMN     "followCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "githubUrl" TEXT,
ADD COLUMN     "lastSecurityAudit" TIMESTAMP(3),
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "securityLevel" "SecurityLevel",
ADD COLUMN     "twitterHandle" TEXT,
ADD COLUMN     "websiteUrl" TEXT;

-- CreateTable
CREATE TABLE "AgentVersion" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "releaseNotes" TEXT,
    "commitHash" TEXT,
    "buildFingerprint" TEXT,
    "verificationStatus" "VersionStatus" NOT NULL,
    "performanceScore" DOUBLE PRECISION,
    "testsPassed" INTEGER,
    "testsFailed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "AgentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentVersion_agentId_createdAt_idx" ON "AgentVersion"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentVersion_verificationStatus_idx" ON "AgentVersion"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "AgentVersion_agentId_version_key" ON "AgentVersion"("agentId", "version");

-- AddForeignKey
ALTER TABLE "AgentVersion" ADD CONSTRAINT "AgentVersion_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
