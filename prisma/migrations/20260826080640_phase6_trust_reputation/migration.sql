-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('AGENT', 'REVIEW', 'USER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "SybilAction" AS ENUM ('NONE', 'FLAG', 'WEIGHT_REDUCE', 'BAN');

-- AlterTable
ALTER TABLE "Hire" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "helpfulCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reportedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reviewerReputation" DOUBLE PRECISION,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "reputation" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "hireCount" INTEGER NOT NULL DEFAULT 0,
    "suspiciousActivityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustCalculation" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "benchmarkScore" DOUBLE PRECISION NOT NULL,
    "reliabilityScore" DOUBLE PRECISION NOT NULL,
    "securityScore" DOUBLE PRECISION NOT NULL,
    "versionStability" DOUBLE PRECISION NOT NULL,
    "recentPerformance" DOUBLE PRECISION NOT NULL,
    "agentProofTotal" DOUBLE PRECISION NOT NULL,
    "verifiedRatings" DOUBLE PRECISION NOT NULL,
    "userSuccess" DOUBLE PRECISION NOT NULL,
    "retention" DOUBLE PRECISION NOT NULL,
    "reviewQuality" DOUBLE PRECISION NOT NULL,
    "usageReputation" DOUBLE PRECISION NOT NULL,
    "communityTotal" DOUBLE PRECISION NOT NULL,
    "finalTrustScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TrustCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SybilDetection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "indicators" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "action" "SybilAction" NOT NULL,

    CONSTRAINT "SybilDetection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_walletAddress_idx" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX "User_reputation_idx" ON "User"("reputation");

-- CreateIndex
CREATE INDEX "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TrustCalculation_agentId_calculatedAt_idx" ON "TrustCalculation"("agentId", "calculatedAt");

-- CreateIndex
CREATE INDEX "SybilDetection_userId_detectedAt_idx" ON "SybilDetection"("userId", "detectedAt");

-- CreateIndex
CREATE INDEX "SybilDetection_action_idx" ON "SybilDetection"("action");

-- CreateIndex
CREATE INDEX "Hire_userId_idx" ON "Hire"("userId");

-- CreateIndex
CREATE INDEX "Review_verified_idx" ON "Review"("verified");

-- AddForeignKey
ALTER TABLE "Hire" ADD CONSTRAINT "Hire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustCalculation" ADD CONSTRAINT "TrustCalculation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
