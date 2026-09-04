import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { prisma } from "@/lib/db";
import { computeAndPersistTrust } from "@/lib/trust";
import { statusPresentation } from "@/lib/agent-status";
import { VERIFICATION_CRITERIA, MIN_UPTIME } from "@/lib/verification";
import { priceOf, payTo, resourceServer, X402_NETWORK } from "@/lib/x402";

/**
 * Paid agent-to-agent trust lookup.
 *
 * This is the machine-facing half of the marketplace: an agent about to delegate
 * work pays a fraction of a cent to ask whether the counterparty is trustworthy,
 * and gets back the score with the evidence behind it rather than a bare number.
 *
 * Charging here rather than on `hire` is deliberate. Hiring is a human action in
 * a browser form, where a 402 challenge has nobody to answer it; a trust query is
 * exactly the kind of call another agent makes programmatically.
 *
 * Settlement runs only after this handler returns < 400 (that is what `withX402`
 * guarantees over middleware), so a 404 for an unknown agent is free.
 */
const PRICE_OUSD = 0.01;

async function handler(request: NextRequest): Promise<NextResponse> {
  // withX402 wraps a single-argument handler, so the dynamic segment is read from
  // the path rather than from a params argument.
  const id = new URL(request.url).pathname.split("/").filter(Boolean).pop() ?? "";

  const agent = await prisma.agent.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      developer: true,
      erc8004Id: true,
      chain: true,
      endpointUrl: true,
      categorySlug: true,
      capabilities: true,
      supportedChains: true,
      supportedProtocols: true,
      status: true,
      statusReason: true,
      statusChangedAt: true,
      verified: true,
      verifiedAt: true,
      uptimePct: true,
      latencyMs: true,
      riskLevel: true,
      lastHealthCheckAt: true,
      healthChecks: {
        orderBy: { timestamp: "desc" },
        take: 5,
        select: { timestamp: true, success: true, latencyMs: true, txHash: true, error: true },
      },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const trust = await computeAndPersistTrust(agent.id);

  if (!trust) {
    return NextResponse.json({ error: "Trust could not be computed" }, { status: 500 });
  }

  const { breakdown } = trust;
  const state = statusPresentation(agent.status);

  return NextResponse.json({
    agent: {
      id: agent.id,
      name: agent.name,
      developer: agent.developer,
      erc8004Id: agent.erc8004Id,
      chain: agent.chain,
      endpoint: agent.endpointUrl,
      category: agent.categorySlug,
      capabilities: agent.capabilities,
      supportedChains: agent.supportedChains,
      supportedProtocols: agent.supportedProtocols,
      riskLevel: agent.riskLevel,
    },
    trust: {
      score: Number(breakdown.finalTrustScore.toFixed(2)),
      model: "60% independent verification / 40% community reputation",
      onplaced: {
        total: Number(breakdown.onplacedTotal.toFixed(2)),
        benchmark: Number(breakdown.benchmarkScore.toFixed(2)),
        reliability: Number(breakdown.reliabilityScore.toFixed(2)),
        security: Number(breakdown.securityScore.toFixed(2)),
        versionStability: Number(breakdown.versionStability.toFixed(2)),
        recentPerformance: Number(breakdown.recentPerformance.toFixed(2)),
      },
      community: {
        total: Number(breakdown.communityTotal.toFixed(2)),
        verifiedRatings: Number(breakdown.verifiedRatings.toFixed(2)),
        userSuccess: Number(breakdown.userSuccess.toFixed(2)),
        retention: Number(breakdown.retention.toFixed(2)),
        reviewQuality: Number(breakdown.reviewQuality.toFixed(2)),
        usageReputation: Number(breakdown.usageReputation.toFixed(2)),
      },
      // Stated plainly so a caller can discount the score instead of trusting a
      // component that rests on no observations.
      sampleSizes: breakdown.sampleSizes,
    },
    status: {
      state: agent.status,
      label: state.label,
      reason: agent.statusReason ?? state.blurb,
      since: agent.statusChangedAt,
    },
    verification: {
      verified: agent.verified,
      verifiedAt: agent.verifiedAt,
      criteria: VERIFICATION_CRITERIA,
      minUptime: MIN_UPTIME,
      uptimePct: agent.uptimePct,
      latencyMs: agent.latencyMs,
      lastCheckAt: agent.lastHealthCheckAt,
      recentChecks: agent.healthChecks,
    },
  });
}

export const GET = withX402(
  handler,
  {
    "/api/v1/trust/[id]": {
      accepts: {
        scheme: "exact",
        network: X402_NETWORK,
        payTo: payTo(),
        price: priceOf(PRICE_OUSD),
      },
      description:
        "Trust score, score breakdown, live operational status and verification evidence for one agent",
    },
  },
  resourceServer()
);
