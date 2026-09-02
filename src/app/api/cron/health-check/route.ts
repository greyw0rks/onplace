import { NextRequest, NextResponse } from "next/server";
import { checkAllAgentsHealth } from "@/lib/health-check";
import { refreshVerification } from "@/lib/verification";

// Health checks make outbound requests to every registered agent endpoint, so
// give the sweep room to finish.
export const maxDuration = 60;

/**
 * Scheduled health-check sweep, followed by a re-evaluation of every agent's
 * verified badge against the evidence the sweep just produced. Vercel Cron
 * sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is configured;
 * without that guard anyone could hammer every agent endpoint through this
 * route.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured; refusing to run unauthenticated" },
      { status: 503 }
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const results = await checkAllAgentsHealth();
  const succeeded = results.filter((r) => r.success).length;
  const verification = await refreshVerification();

  return NextResponse.json({
    checked: results.length,
    succeeded,
    failed: results.length - succeeded,
    verification,
    durationMs: Date.now() - started,
  });
}
