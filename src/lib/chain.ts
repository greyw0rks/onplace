import { ethers } from "ethers";
import IdentityRegistryAbi from "./abis/IdentityRegistry.json";
import ReputationRegistryAbi from "./abis/ReputationRegistry.json";
import HealthCheckLogAbi from "./abis/HealthCheckLog.json";

export const IDENTITY_REGISTRY_ADDRESS = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
export const REPUTATION_REGISTRY_ADDRESS = "0x8004B663056A597Dffe9eCcC1965A193B7388713";

export function getProvider() {
  const rpcUrl = process.env.BSC_TESTNET_RPC_URL;
  if (!rpcUrl) throw new Error("BSC_TESTNET_RPC_URL is not set");
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getRelayerWallet() {
  const privateKey = process.env.RELAYER_WALLET_PRIVATE_KEY;
  if (!privateKey) throw new Error("RELAYER_WALLET_PRIVATE_KEY is not set");
  return new ethers.Wallet(privateKey, getProvider());
}

export function getIdentityRegistry(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(IDENTITY_REGISTRY_ADDRESS, IdentityRegistryAbi, signerOrProvider);
}

export function getReputationRegistry(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(REPUTATION_REGISTRY_ADDRESS, ReputationRegistryAbi, signerOrProvider);
}

export function getHealthCheckLog(signerOrProvider: ethers.Signer | ethers.Provider) {
  const address = process.env.HEALTH_CHECK_LOG_ADDRESS;
  if (!address) throw new Error("HEALTH_CHECK_LOG_ADDRESS is not set");
  return new ethers.Contract(address, HealthCheckLogAbi, signerOrProvider);
}

export function tokenIdFromErc8004Id(erc8004Id: string): bigint {
  const parts = erc8004Id.split(":");
  const tokenId = parts[parts.length - 1];
  return BigInt(tokenId);
}
