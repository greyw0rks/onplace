import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { ethers } from "ethers";
import { getRelayerWallet } from "../src/lib/chain";

async function main() {
  const wallet = getRelayerWallet();
  const abi = JSON.parse(
    readFileSync(path.join(__dirname, "../src/lib/abis/HealthCheckLog.json"), "utf-8"),
  );
  const bytecode = `0x${readFileSync(path.join(__dirname, "../src/lib/abis/HealthCheckLog.bin"), "utf-8").trim()}`;

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log(`Deploying HealthCheckLog from ${await wallet.getAddress()}...`);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`Deployed HealthCheckLog at ${address}`);
  console.log(`Set HEALTH_CHECK_LOG_ADDRESS="${address}" in .env`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
