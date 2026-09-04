/**
 * Demonstrates the full x402 loop against Onplaced's paid trust API.
 *
 * The payer never sends a transaction and needs no BNB: it signs an EIP-3009
 * `transferWithAuthorization` off-chain, and AEON's facilitator submits it. That
 * is the whole point of the `exact` scheme, and it is why the token had to
 * implement EIP-3009 (see contracts/OnplacedUSD.sol).
 *
 * Usage:
 *   X402_DEMO_PAYER_KEY=0x... npx tsx scripts/x402-demo-payment.ts [baseUrl] [agentId]
 *
 * If no payer key is set, a throwaway wallet is generated and minted oUSD —
 * `mint` on OnplacedUSD is deliberately open, since it is a valueless testnet
 * faucet token.
 */
import "dotenv/config";
import { ethers } from "ethers";
import { privateKeyToAccount } from "viem/accounts";
import { x402Client } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPayment } from "@x402/fetch";

const BASE_URL = process.argv[2] ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3111";
const RPC_URL = process.env.BSC_TESTNET_RPC_URL ?? "https://bsc-testnet-rpc.publicnode.com";
const TOKEN = process.env.ONPLACED_USD_ADDRESS ?? "0xf7975Eb6A4E13f5929e21b61e9e298e74aFC8f88";

const TOKEN_ABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address) view returns (uint256)",
];

/** Populated by the client hook so a rejected payment can be replayed. */
let lastPayload: unknown = null;
let lastRequirements: unknown = null;

async function ensureFunded(payer: string, key: string) {
  const provider = new ethers.JsonRpcProvider(RPC_URL, 97, { staticNetwork: true });
  const token = new ethers.Contract(TOKEN, TOKEN_ABI, provider);
  const balance: bigint = await token.balanceOf(payer);
  console.log(`payer ${payer} holds ${ethers.formatUnits(balance, 6)} oUSD`);

  if (balance >= 1_000_000n) return;

  // Minting needs gas, so it is signed by the relayer rather than the payer —
  // the payer stays gasless, which is the property worth demonstrating.
  const funder = process.env.RELAYER_WALLET_PRIVATE_KEY;
  if (!funder) throw new Error("payer has no oUSD and RELAYER_WALLET_PRIVATE_KEY is unset to mint");

  console.log("minting 10 oUSD to the payer...");
  const tx = await new ethers.Contract(TOKEN, TOKEN_ABI, new ethers.Wallet(funder, provider)).mint(
    payer,
    10_000_000n
  );
  const receipt = await tx.wait();
  console.log(`  minted in block ${receipt?.blockNumber}, tx ${tx.hash}`);
  void key;
}

async function main() {
  // `||` not `??`: an env var set to the empty string should fall through to a
  // generated wallet, and ?? would hand "" to privateKeyToAccount.
  const configuredKey = process.env.X402_DEMO_PAYER_KEY || undefined;
  const key = (configuredKey ?? ethers.Wallet.createRandom().privateKey) as `0x${string}`;
  const account = privateKeyToAccount(key);

  if (!configuredKey) {
    console.log("no X402_DEMO_PAYER_KEY set — generated a throwaway payer for this run");
  }

  await ensureFunded(account.address, key);

  let agentId = process.argv[3];
  if (!agentId) {
    const res = await fetch(`${BASE_URL}/api/agents/top`);
    const body = (await res.json()) as { agents: Array<{ id: string; name: string }> };
    agentId = body.agents[0].id;
    console.log(`no agent id given — using ${body.agents[0].name} (${agentId})`);
  }

  const url = `${BASE_URL}/api/v1/trust/${agentId}`;

  console.log("\n--- request without payment ---");
  const unpaid = await fetch(url, { headers: { Accept: "application/json" } });
  console.log(`  HTTP ${unpaid.status}`);
  const challenge = unpaid.headers.get("payment-required");
  if (challenge) {
    const decoded = JSON.parse(Buffer.from(challenge, "base64").toString());
    console.log(`  accepts: ${JSON.stringify(decoded.accepts)}`);
  }

  console.log("\n--- retrying with payment ---");
  // oUSD is not a registry "default asset", so the client's spend controls reject
  // it unless allowlisted. Allowlisting with an explicit atomic cap rather than
  // passing `spendControls: false` is the shape a real payer agent should use:
  // it still refuses to overpay if the server raises its price.
  //
  // Two API traps here: the bare constructor takes a payment requirements
  // *selector*, so `new x402Client({ spendControls })` silently discards the
  // controls; and `x402Client.fromConfig` throws unless you also hand it
  // `schemes`. Constructing then calling setSpendControls avoids both.
  const client = new x402Client().setSpendControls({
    allowedAssets: [{ network: "eip155:97", asset: TOKEN, maxAmountPerPayment: "100000" }],
  });
  registerExactEvmScheme(client, {
    signer: account,
    schemeOptions: { rpcUrl: RPC_URL },
  });

  // Capture what the client actually signed so a rejection can be replayed
  // against the facilitator directly.
  client.onAfterPaymentCreation(async (context: any) => {
    lastPayload = context?.paymentPayload ?? context?.payload ?? null;
    lastRequirements = context?.paymentRequirements ?? context?.selectedRequirements ?? null;
    return undefined;
  });

  const paidFetch = wrapFetchWithPayment(fetch, client);
  const paid = await paidFetch(url, { headers: { Accept: "application/json" } });
  console.log(`  HTTP ${paid.status}`);

  // A 402 on the retry means the facilitator refused the payment. The reason
  // rides in the re-issued challenge, not the body, so surface it.
  if (paid.status === 402) {
    const retryChallenge = paid.headers.get("payment-required");
    if (retryChallenge) {
      const decoded = JSON.parse(Buffer.from(retryChallenge, "base64").toString());
      console.log(`  rejected: ${decoded.error ?? "(no error field)"}`);
    }
    console.log(`  body: ${(await paid.text()).slice(0, 400)}`);

    // The server only relays a summary, so ask the facilitator directly with the
    // exact payload the client produced. Its raw error is far more specific.
    if (lastPayload && process.env.X402_DEBUG_VERIFY) {
      const facilitator = process.env.X402_FACILITATOR_URL ?? "https://facilitator.x402.rs";
      console.log(`\n--- posting the same payload straight to ${facilitator}/verify ---`);
      console.log(`  payload: ${JSON.stringify(lastPayload).slice(0, 600)}`);
      const res = await fetch(`${facilitator}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          x402Version: 2,
          paymentPayload: lastPayload,
          paymentRequirements: lastRequirements,
        }),
      });
      console.log(`  HTTP ${res.status}: ${(await res.text()).slice(0, 800)}`);
    }
    return;
  }

  const settlement = paid.headers.get("payment-response");
  if (settlement) {
    const decoded = JSON.parse(Buffer.from(settlement, "base64").toString());
    console.log(`  settlement: ${JSON.stringify(decoded)}`);
    if (decoded.transaction) {
      console.log(`  https://testnet.bscscan.com/tx/${decoded.transaction}`);
    }
  }

  const body = await paid.json();
  console.log(`\n${JSON.stringify(body, null, 2).slice(0, 1400)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
