import "dotenv/config";
import { ethers } from "ethers";
import { getRelayerWallet, getIdentityRegistry, IDENTITY_REGISTRY_ADDRESS } from "../src/lib/chain";
import { prisma } from "../src/lib/db";

const AGENT_CARD = {
  name: "Onplaced Health Factor Monitor",
  description:
    "Self-built Onplaced agent that monitors a wallet's testnet BNB balance and reports a health signal, submitting a real feedback transaction to the ERC-8004 Reputation Registry each run.",
  endpoints: [
    {
      name: "monitor",
      endpoint: "https://onplaced.example/api/agents/self-built/health-factor-monitor",
      version: "0.1.0",
    },
  ],
};

function buildAgentUri() {
  const json = JSON.stringify(AGENT_CARD);
  const base64 = Buffer.from(json, "utf-8").toString("base64");
  return `data:application/json;base64,${base64}`;
}

async function main() {
  const wallet = getRelayerWallet();
  const registry = getIdentityRegistry(wallet);
  const agentUri = buildAgentUri();

  console.log(`Registering agent from ${await wallet.getAddress()} on ${IDENTITY_REGISTRY_ADDRESS}...`);
  const tx = await registry.getFunction("register(string)")(agentUri);
  const receipt = await tx.wait();

  const registeredEvent = receipt.logs
    .map((log: ethers.Log) => {
      try {
        return registry.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed: ethers.LogDescription | null) => parsed?.name === "Registered");

  if (!registeredEvent) throw new Error("Registered event not found in receipt logs");

  const tokenId = registeredEvent.args.agentId as bigint;
  const erc8004Id = `97:${IDENTITY_REGISTRY_ADDRESS.toLowerCase()}:${tokenId.toString()}`;

  console.log(`Registered. tx=${receipt.hash} tokenId=${tokenId} erc8004Id=${erc8004Id}`);

  const agent = await prisma.agent.create({
    data: {
      erc8004Id,
      name: AGENT_CARD.name,
      description: AGENT_CARD.description,
      developer: "Onplaced",
      endpointUrl: "https://onplaced.example/api/agents/self-built/health-factor-monitor",
      chain: "bsc-testnet",
      walletAddress: await wallet.getAddress(),
      sourceType: "self_built",
      categorySlug: "health_factor_monitoring",
    },
  });

  console.log(`Created Agent row ${agent.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
