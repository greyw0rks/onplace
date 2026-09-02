import "dotenv/config";
import { ethers } from "ethers";
import {
  getRelayerWallet,
  getVenusComptroller,
  getVToken,
  getVenusOracle,
  VBNB_ADDRESS,
  VUSDT_ADDRESS,
} from "../src/lib/chain";

const SUPPLY_BNB = "0.01";
const TARGET_BORROW_RATIO = 0.3; // fraction of max borrowable value to actually borrow

async function main() {
  const wallet = getRelayerWallet();
  const address = await wallet.getAddress();
  console.log(`Opening Venus position for ${address}...`);

  const comptroller = getVenusComptroller(wallet);
  const vBNB = getVToken(VBNB_ADDRESS, wallet);
  const vUSDT = getVToken(VUSDT_ADDRESS, wallet);

  console.log("Entering vBNB market...");
  const enterTx = await comptroller.enterMarkets([VBNB_ADDRESS]);
  await enterTx.wait();
  console.log(`  tx=${enterTx.hash}`);

  const supplyAmountWei = ethers.parseEther(SUPPLY_BNB);
  console.log(`Supplying ${SUPPLY_BNB} tBNB into vBNB...`);
  const mintTx = await vBNB.getFunction("mint()")({ value: supplyAmountWei });
  await mintTx.wait();
  console.log(`  tx=${mintTx.hash}`);

  const oracleAddress = await comptroller.oracle();
  const oracle = getVenusOracle(oracleAddress, wallet);

  const [, collateralFactorMantissa] = await comptroller.markets(VBNB_ADDRESS);
  const bnbPriceMantissa: bigint = await oracle.getUnderlyingPrice(VBNB_ADDRESS);
  const usdtPriceMantissa: bigint = await oracle.getUnderlyingPrice(VUSDT_ADDRESS);

  const supplyBnb = Number(SUPPLY_BNB);
  const bnbPriceUsd = Number(ethers.formatUnits(bnbPriceMantissa, 18));
  const collateralFactor = Number(ethers.formatUnits(collateralFactorMantissa, 18));
  const usdtPriceUsd = Number(ethers.formatUnits(usdtPriceMantissa, 30)); // 36 - 6 decimals

  const maxBorrowUsd = supplyBnb * bnbPriceUsd * collateralFactor;
  const targetBorrowUsd = maxBorrowUsd * TARGET_BORROW_RATIO;
  const borrowAmountUsdt = targetBorrowUsd / usdtPriceUsd;
  const borrowAmountWei = ethers.parseUnits(borrowAmountUsdt.toFixed(6), 6);

  console.log(
    `Max borrow ~$${maxBorrowUsd.toFixed(2)}, borrowing ~$${targetBorrowUsd.toFixed(2)} (${borrowAmountUsdt.toFixed(6)} USDT)...`,
  );
  const borrowTx = await vUSDT.borrow(borrowAmountWei);
  await borrowTx.wait();
  console.log(`  tx=${borrowTx.hash}`);

  const [, bnbSnapshotBalance, , bnbExchangeRate] = await vBNB.getAccountSnapshot(address);
  const [, , usdtBorrowBalance] = await vUSDT.getAccountSnapshot(address);

  console.log("Position opened.");
  console.log(`  vBNB balance: ${ethers.formatUnits(bnbSnapshotBalance, 8)} (exchangeRate ${bnbExchangeRate})`);
  console.log(`  vUSDT borrow balance: ${ethers.formatUnits(usdtBorrowBalance, 6)} USDT`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
