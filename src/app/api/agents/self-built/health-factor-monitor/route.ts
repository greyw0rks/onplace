import { NextResponse } from "next/server";
import { readVenusHealthFactor } from "@/lib/self-built-agent";

export async function GET() {
  const address = process.env.RELAYER_WALLET_ADDRESS;
  if (!address) {
    return NextResponse.json({ error: "RELAYER_WALLET_ADDRESS is not set" }, { status: 500 });
  }
  const result = await readVenusHealthFactor(address);
  return NextResponse.json({
    agent: "AgentProof Health Factor Monitor",
    category: "health_factor_monitoring",
    chain: "bsc-testnet",
    protocol: "venus",
    ...result,
  });
}
