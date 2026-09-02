import { ethers } from "ethers";
import { prisma } from "@/lib/db";
import {
  getRelayerWallet,
  getHealthCheckLog,
  getProvider,
  getVenusComptroller,
  getVToken,
  getVenusOracle,
  getErc20,
} from "@/lib/chain";

export const SELF_BUILT_AGENT_NAME = "Onplace Health Factor Monitor";

const HEALTHY_THRESHOLD = 1.2;

interface MarketPosition {
  vToken: string;
  underlying: string;
  underlyingDecimals: number;
  collateralFactor: number;
  supplyBalance: bigint; // underlying units
  borrowBalance: bigint; // underlying units
  underlyingPriceUsd: number; // USD per whole underlying token
}

async function readMarketPosition(
  vTokenAddress: string,
  account: string,
  provider: ethers.Provider,
  oracleAddress: string,
  comptroller: ethers.Contract,
): Promise<MarketPosition> {
  const vToken = getVToken(vTokenAddress, provider);
  const oracle = getVenusOracle(oracleAddress, provider);

  const [, vTokenBalanceRaw, borrowBalanceRaw, exchangeRateMantissaRaw] = await vToken.getAccountSnapshot(account);
  const vTokenBalance: bigint = BigInt(vTokenBalanceRaw);
  const borrowBalance: bigint = BigInt(borrowBalanceRaw);
  const exchangeRateMantissa: bigint = BigInt(exchangeRateMantissaRaw);
  const [, collateralFactorMantissaRaw] = await comptroller.markets(vTokenAddress);
  const collateralFactorMantissa: bigint = BigInt(collateralFactorMantissaRaw);
  const underlyingPriceMantissa: bigint = BigInt(await oracle.getUnderlyingPrice(vTokenAddress));

  let underlyingAddress = ethers.ZeroAddress;
  let underlyingDecimals = 18;
  try {
    underlyingAddress = await vToken.underlying();
    const erc20 = getErc20(underlyingAddress, provider);
    underlyingDecimals = Number(await erc20.decimals());
  } catch {
    // vBNB has no underlying() call (native BNB), keep 18 decimals.
  }

  // Venus oracle prices are scaled to 36 - underlyingDecimals, so USD-per-whole-token
  // requires dividing by 10^(36 - underlyingDecimals).
  const underlyingPriceUsd = Number(
    ethers.formatUnits(underlyingPriceMantissa, 36 - underlyingDecimals),
  );

  // vTokenBalance is in vToken units (8 decimals); exchangeRateMantissa converts
  // vToken units -> underlying units, scaled by 1e18 * 10^(18 - underlyingDecimals... )
  // Simplify by computing underlying supply directly via ethers big-number math:
  // supplyUnderlying = vTokenBalance * exchangeRateMantissa / 1e18
  const supplyBalance = (vTokenBalance * exchangeRateMantissa) / BigInt(10) ** BigInt(18);

  return {
    vToken: vTokenAddress,
    underlying: underlyingAddress,
    underlyingDecimals,
    collateralFactor: Number(ethers.formatUnits(collateralFactorMantissa, 18)),
    supplyBalance,
    borrowBalance,
    underlyingPriceUsd,
  };
}

export interface VenusHealthFactor {
  address: string;
  collateralValueUsd: number;
  borrowValueUsd: number;
  healthFactor: number;
  healthy: boolean;
  markets: string[];
}

/**
 * Reads the account's real Venus Protocol core-pool position on BSC testnet and
 * computes an actual health factor (collateral value adjusted by collateral factor,
 * divided by borrow value) — not the raw liquidity/shortfall Comptroller.getAccountLiquidity
 * would return, which does not directly express the ratio.
 */
export async function readVenusHealthFactor(address: string): Promise<VenusHealthFactor> {
  const provider = getProvider();
  const comptroller = getVenusComptroller(provider);

  const marketAddresses: string[] = await comptroller.getAssetsIn(address);
  const oracleAddress: string = await comptroller.oracle();

  let collateralValueUsd = 0;
  let borrowValueUsd = 0;

  for (const vTokenAddress of marketAddresses) {
    const position = await readMarketPosition(vTokenAddress, address, provider, oracleAddress, comptroller);

    const supplyWhole = Number(ethers.formatUnits(position.supplyBalance, position.underlyingDecimals));
    const borrowWhole = Number(ethers.formatUnits(position.borrowBalance, position.underlyingDecimals));

    collateralValueUsd += supplyWhole * position.underlyingPriceUsd * position.collateralFactor;
    borrowValueUsd += borrowWhole * position.underlyingPriceUsd;
  }

  const healthFactor = borrowValueUsd === 0 ? Infinity : collateralValueUsd / borrowValueUsd;

  return {
    address,
    collateralValueUsd,
    borrowValueUsd,
    healthFactor,
    healthy: healthFactor >= HEALTHY_THRESHOLD,
    markets: marketAddresses,
  };
}

export async function runHealthFactorCheck(agentId: string) {
  const agent = await prisma.agent.findUniqueOrThrow({ where: { id: agentId } });
  if (!agent.erc8004Id) throw new Error("Agent has no erc8004Id; register it first");

  const wallet = getRelayerWallet();
  const walletAddress = await wallet.getAddress();
  const result = await readVenusHealthFactor(walletAddress);

  const healthCheckLog = getHealthCheckLog(wallet);
  const finiteHealthFactor = Number.isFinite(result.healthFactor) ? result.healthFactor : 999;
  const value = BigInt(Math.round(finiteHealthFactor * 100)); // scaled fixed-point, 2 decimals
  const tx = await healthCheckLog.recordCheck(walletAddress, result.healthy, value);
  const receipt = await tx.wait();

  await prisma.healthCheck.create({
    data: {
      agentId,
      success: true,
      txHash: receipt?.hash ?? tx.hash,
      healthFactor: Number.isFinite(result.healthFactor) ? result.healthFactor : null,
      collateralValueUsd: result.collateralValueUsd,
      borrowValueUsd: result.borrowValueUsd,
    },
  });

  await prisma.agent.update({
    where: { id: agentId },
    data: { lastHealthCheckAt: new Date() },
  });

  return { txHash: receipt?.hash ?? tx.hash, monitored: result };
}
