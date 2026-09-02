-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CapabilityType" AS ENUM ('READ_WALLET', 'READ_TRANSACTIONS', 'READ_MARKET_DATA', 'ANALYZE_PORTFOLIO', 'GENERATE_TRANSACTION', 'SIGN_TRANSACTION', 'EXECUTE_SWAP', 'TRANSFER_FUNDS', 'ACCESS_API', 'MODIFY_CONFIG');

-- CreateEnum
CREATE TYPE "CapabilityLevel" AS ENUM ('NONE', 'INFORMATION', 'READ', 'ANALYZE', 'PREPARE', 'EXECUTE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REVERTED');

-- CreateTable
CREATE TABLE "SecurityAudit" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "auditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auditedBy" TEXT,
    "securityLevel" "SecurityLevel" NOT NULL,
    "permissionSpecId" TEXT NOT NULL,

    CONSTRAINT "SecurityAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityFinding" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "severity" "FindingSeverity" NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "remediation" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SecurityFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionSpec" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "version" TEXT NOT NULL,

    CONSTRAINT "PermissionSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capability" (
    "id" TEXT NOT NULL,
    "specId" TEXT NOT NULL,
    "name" "CapabilityType" NOT NULL,
    "level" "CapabilityLevel" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Capability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HireSession" (
    "id" TEXT NOT NULL,
    "hireId" TEXT NOT NULL,
    "maxTransactionAmount" TEXT,
    "dailySpendingLimit" TEXT,
    "sessionSpendingLimit" TEXT,
    "allowedContracts" TEXT[],
    "allowedActions" TEXT[],
    "status" "SessionStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "HireSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HireTransaction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "data" TEXT,
    "status" "TxStatus" NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HireTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SecurityAudit_agentId_auditedAt_idx" ON "SecurityAudit"("agentId", "auditedAt");

-- CreateIndex
CREATE INDEX "SecurityFinding_auditId_severity_idx" ON "SecurityFinding"("auditId", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionSpec_agentId_version_key" ON "PermissionSpec"("agentId", "version");

-- CreateIndex
CREATE INDEX "Capability_specId_name_idx" ON "Capability"("specId", "name");

-- CreateIndex
CREATE INDEX "HireSession_hireId_status_idx" ON "HireSession"("hireId", "status");

-- CreateIndex
CREATE INDEX "HireTransaction_sessionId_submittedAt_idx" ON "HireTransaction"("sessionId", "submittedAt");

-- AddForeignKey
ALTER TABLE "SecurityAudit" ADD CONSTRAINT "SecurityAudit_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAudit" ADD CONSTRAINT "SecurityAudit_permissionSpecId_fkey" FOREIGN KEY ("permissionSpecId") REFERENCES "PermissionSpec"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityFinding" ADD CONSTRAINT "SecurityFinding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "SecurityAudit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionSpec" ADD CONSTRAINT "PermissionSpec_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Capability" ADD CONSTRAINT "Capability_specId_fkey" FOREIGN KEY ("specId") REFERENCES "PermissionSpec"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HireSession" ADD CONSTRAINT "HireSession_hireId_fkey" FOREIGN KEY ("hireId") REFERENCES "Hire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HireTransaction" ADD CONSTRAINT "HireTransaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HireSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
