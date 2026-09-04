import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import type { Network } from "@x402/core/types";

/**
 * x402 wiring for Onplaced.
 *
 * Chain choice: BSC testnet, `eip155:97`.
 *
 * Facilitator choice: x402.rs, whose /supported advertises scheme `exact` on
 * eip155:97 and which needs no credential. AEON's facilitator also lists
 * eip155:97, but its /verify and /settle require an API key that only comes from
 * a KYB-gated merchant onboarding (support@aeon.xyz, business registration
 * documents), and AEON's published x402 docs describe a different product
 * entirely — x402 as a rail for fiat QR retail payments, with its own header
 * names and a non-standard `tokenTransferWithAuthorization` scheme. Set
 * X402_FACILITATOR_URL to switch.
 *
 * Token choice: our own OnplacedUSD. BSC testnet has no EIP-3009 asset (the
 * usual test USDT/USDC there are plain BEP20, and AEON's TESTU is mainnet-only),
 * and the `exact` scheme settles by submitting a signed
 * `transferWithAuthorization`, so an EIP-3009 token is not optional.
 *
 * Price is expressed as an explicit AssetAmount rather than a "$0.01" string:
 * dollar-denominated prices resolve through a registry of known stablecoins, and
 * docs.x402.org lists no BSC entry at all, so a Money price cannot be priced.
 */
export const X402_NETWORK: Network = "eip155:97";

export const ONPLACED_USD = {
  address: process.env.ONPLACED_USD_ADDRESS ?? "0xf7975Eb6A4E13f5929e21b61e9e298e74aFC8f88",
  decimals: 6,
  // Must match the token's own name()/version(), or the EIP-712 domain the payer
  // signs won't match the one the token reconstructs and settlement reverts.
  name: "Onplaced USD",
  version: "2",
} as const;

const FACILITATOR_URL = process.env.X402_FACILITATOR_URL ?? "https://facilitator.x402.rs";

/** Wallet that receives payments. Falls back to the relayer, which already exists on 97. */
export function payTo(): string {
  const address = process.env.X402_PAY_TO ?? process.env.RELAYER_WALLET_ADDRESS;
  if (!address) {
    throw new Error("X402_PAY_TO (or RELAYER_WALLET_ADDRESS) must be set to accept payments");
  }
  return address;
}

/** Price in atomic units. `0.01` oUSD at 6 decimals is `"10000"`. */
export function atomicPrice(amount: number): string {
  return BigInt(Math.round(amount * 10 ** ONPLACED_USD.decimals)).toString();
}

export function priceOf(amount: number) {
  return {
    asset: ONPLACED_USD.address,
    amount: atomicPrice(amount),
    extra: { name: ONPLACED_USD.name, version: ONPLACED_USD.version },
  };
}

/**
 * Built lazily and cached: constructing this at module scope would fire a
 * facilitator sync on every cold start, including for routes that never charge.
 */
let cached: x402ResourceServer | null = null;

export function resourceServer(): x402ResourceServer {
  if (cached) return cached;

  const apiKey = process.env.X402_FACILITATOR_API_KEY;

  const facilitator = new HTTPFacilitatorClient({
    url: FACILITATOR_URL,
    ...(apiKey
      ? {
          createAuthHeaders: async () => ({
            verify: { Authorization: `Bearer ${apiKey}` },
            settle: { Authorization: `Bearer ${apiKey}` },
            supported: { Authorization: `Bearer ${apiKey}` },
          }),
        }
      : {}),
  });

  cached = new x402ResourceServer(facilitator).register(X402_NETWORK, new ExactEvmScheme());
  return cached;
}
