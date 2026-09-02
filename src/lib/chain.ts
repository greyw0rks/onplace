import { ethers } from "ethers";
import IdentityRegistryAbi from "./abis/IdentityRegistry.json";
import ReputationRegistryAbi from "./abis/ReputationRegistry.json";
import HealthCheckLogAbi from "./abis/HealthCheckLog.json";
import VenusComptrollerAbi from "./abis/VenusComptroller.json";
import VenusVTokenAbi from "./abis/VenusVToken.json";
import VenusOracleAbi from "./abis/VenusOracle.json";
import Erc20Abi from "./abis/ERC20.json";

export const IDENTITY_REGISTRY_ADDRESS = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
export const REPUTATION_REGISTRY_ADDRESS = "0x8004B663056A597Dffe9eCcC1965A193B7388713";

// Venus Protocol core pool on BSC testnet (chainId 97), per testnetapi.venus.io/markets.
export const VENUS_COMPTROLLER_ADDRESS = "0x94d1820b2D1c7c7452A163983Dc888CEC546b77D";
export const VBNB_ADDRESS = "0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c";
export const VUSDT_ADDRESS = "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A";

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

export function getVenusComptroller(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(VENUS_COMPTROLLER_ADDRESS, VenusComptrollerAbi, signerOrProvider);
}

export function getVToken(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, VenusVTokenAbi, signerOrProvider);
}

export function getVenusOracle(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, VenusOracleAbi, signerOrProvider);
}

export function getErc20(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, Erc20Abi, signerOrProvider);
}

export function tokenIdFromErc8004Id(erc8004Id: string): bigint {
  const parts = erc8004Id.split(":");
  const tokenId = parts[parts.length - 1];
  return BigInt(tokenId);
}
