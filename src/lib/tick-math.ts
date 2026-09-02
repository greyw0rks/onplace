/**
 * Minimal Uniswap V3 / PancakeSwap V3 tick math helpers, hand-rolled to avoid
 * pulling in the full Uniswap SDK for this scope. Ticks encode price as
 * price = 1.0001^tick, where price is expressed in raw token units
 * (token1 per token0), not decimal-adjusted human units.
 *
 * All three helpers are covered by scripts/test-tick-math.ts against known
 * price/tick pairs before being wired into any live mint/reposition path.
 */

const TICK_BASE = 1.0001;

/** Converts a raw price (token1 per token0, in raw integer units) to the nearest tick. */
export function priceToTick(rawPrice: number): number {
  return Math.floor(Math.log(rawPrice) / Math.log(TICK_BASE));
}

/** Converts a tick back to a raw price (token1 per token0, in raw integer units). */
export function tickToPrice(tick: number): number {
  return Math.pow(TICK_BASE, tick);
}

/** Rounds a tick down to the nearest multiple of tickSpacing (required by mint()). */
export function alignTickDown(tick: number, tickSpacing: number): number {
  return Math.floor(tick / tickSpacing) * tickSpacing;
}

/** Rounds a tick up to the nearest multiple of tickSpacing (required by mint()). */
export function alignTickUp(tick: number, tickSpacing: number): number {
  return Math.ceil(tick / tickSpacing) * tickSpacing;
}

/**
 * Computes an aligned [tickLower, tickUpper] range spanning +/- widthPct around
 * the current raw price, rounded outward to tickSpacing so mint() won't revert.
 */
export function computeTickRange(
  currentRawPrice: number,
  widthPct: number,
  tickSpacing: number,
): { tickLower: number; tickUpper: number } {
  const lowerPrice = currentRawPrice * (1 - widthPct);
  const upperPrice = currentRawPrice * (1 + widthPct);
  const tickLower = alignTickDown(priceToTick(lowerPrice), tickSpacing);
  const tickUpper = alignTickUp(priceToTick(upperPrice), tickSpacing);
  return { tickLower, tickUpper };
}

/** Converts a pool's sqrtPriceX96 (from slot0()) to a raw price (token1 per token0). */
export function sqrtPriceX96ToRawPrice(sqrtPriceX96: bigint): number {
  const Q96 = 2 ** 96;
  const sqrtPrice = Number(sqrtPriceX96) / Q96;
  return sqrtPrice * sqrtPrice;
}
