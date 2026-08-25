import { NextResponse } from "next/server";
import { checkAllAgentsHealth } from "@/lib/health-check";

export async function POST() {
  const results = await checkAllAgentsHealth();
  return NextResponse.json({ checked: results.length, results });
}
