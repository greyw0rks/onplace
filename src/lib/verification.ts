import { prisma } from "@/lib/db";

/**
 * What "verified" means on Onplaced.
 *
 * The badge is derived from evidence we can point at, never set by hand:
 *
 *  1. **On-chain identity** — the agent has an ERC-8004 token id in the
 *     registry, so its owner and metadata are publicly checkable.
 *  2. **Responding now** — the most recent health check we ran against its
 *     advertised endpoint succeeded.
 *  3. **Track record** — its uptime across our recorded checks is at least
 *     `MIN_UPTIME`, so an agent that mostly fails can't earn the badge on the
 *     strength of one lucky ping.
 *
 * Because criterion 2 looks at the *latest* check, verification is revoked
 * automatically when an agent goes dark. That is the point: the claim is
 * "verified right now", not "verified once in the past".
 */
export const MIN_UPTIME = 0.8;

export const VERIFICATION_CRITERIA = [
  "Registered in the ERC-8004 identity registry",
  "Most recent health check succeeded",
  `Uptime of ${Math.round(MIN_UPTIME * 100)}% or better across recorded checks`,
] as const;

export interface VerificationEvidence {
  hasOnchainIdentity: boolean;
  lastCheckSucceeded: boolean;
  uptimePct: number | null;
}

export function evaluateVerification(evidence: VerificationEvidence): boolean {
  return (
    evidence.hasOnchainIdentity &&
    evidence.lastCheckSucceeded &&
    (evidence.uptimePct ?? 0) >= MIN_UPTIME
  );
}

export interface VerificationSweep {
  evaluated: number;
  verified: number;
  granted: number;
  revoked: number;
}

/**
 * Recompute the verified flag for every agent from current evidence. Intended
 * to run straight after a health-check sweep, so the badge tracks reality.
 */
export async function refreshVerification(): Promise<VerificationSweep> {
  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      erc8004Id: true,
      uptimePct: true,
      verified: true,
      healthChecks: {
        orderBy: { timestamp: "desc" },
        take: 1,
        select: { success: true },
      },
    },
  });

  let granted = 0;
  let revoked = 0;
  const updates: Array<Promise<unknown>> = [];

  for (const agent of agents) {
    const shouldBeVerified = evaluateVerification({
      hasOnchainIdentity: Boolean(agent.erc8004Id),
      lastCheckSucceeded: agent.healthChecks[0]?.success ?? false,
      uptimePct: agent.uptimePct,
    });

    if (shouldBeVerified === agent.verified) continue;

    if (shouldBeVerified) granted += 1;
    else revoked += 1;

    updates.push(
      prisma.agent.update({
        where: { id: agent.id },
        data: shouldBeVerified
          ? { verified: true, verifiedAt: new Date() }
          : { verified: false, verifiedAt: null },
      })
    );
  }

  await Promise.all(updates);

  const verified = await prisma.agent.count({ where: { verified: true } });

  return { evaluated: agents.length, verified, granted, revoked };
}
