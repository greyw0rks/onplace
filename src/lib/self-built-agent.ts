import { ethers } from "ethers";
import { prisma } from "@/lib/db";
import { getRelayerWallet, getHealthCheckLog, getProvider } from "@/lib/chain";

export const SELF_BUILT_AGENT_NAME = "AgentProof Health Factor Monitor";

/**
 * Reads a real on-chain signal for the monitored wallet: its native BNB balance
 * on BSC testnet. Standing in for a lending-position health factor until a
 * confirmed testnet lending market address is wired in — still a genuine,
 * unfabricated on-chain read.
 */
export async function readMonitoredWalletHealth(address: string) {
  const provider = getProvider();
  const balanceWei = await provider.getBalance(address);
  const balance = Number(ethers.formatEther(balanceWei));
  // Treat "healthy" as having a non-trivial testnet balance buffer.
  const healthy = balance > 0.01;
  return { address, balance, healthy };
}

export async function runHealthFactorCheck(agentId: string) {
  const agent = await prisma.agent.findUniqueOrThrow({ where: { id: agentId } });
  if (!agent.erc8004Id) throw new Error("Agent has no erc8004Id; register it first");

  const wallet = getRelayerWallet();
  const walletAddress = await wallet.getAddress();
  const monitored = await readMonitoredWalletHealth(walletAddress);

  const healthCheckLog = getHealthCheckLog(wallet);
  const value = BigInt(Math.round(monitored.balance * 100)); // scaled fixed-point, 2 decimals
  const tx = await healthCheckLog.recordCheck(walletAddress, monitored.healthy, value);
  const receipt = await tx.wait();

  await prisma.healthCheck.create({
    data: {
      agentId,
      success: true,
      txHash: receipt?.hash ?? tx.hash,
    },
  });

  await prisma.agent.update({
    where: { id: agentId },
    data: { lastHealthCheckAt: new Date() },
  });

  return { txHash: receipt?.hash ?? tx.hash, monitored };
}
