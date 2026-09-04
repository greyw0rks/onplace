import type { AgentStatus } from "@/generated/prisma/enums";

/**
 * One place for how a status looks and reads, so the card, the detail page and
 * any future dashboard can't drift into describing the same state differently.
 */
export const AGENT_STATUS_PRESENTATION: Record<
  AgentStatus,
  { label: string; color: string; blurb: string }
> = {
  HEALTHY: {
    label: "Healthy",
    color: "#42f099",
    blurb: "Responding, and above the uptime floor across recorded checks.",
  },
  DEGRADED: {
    label: "Degraded",
    color: "#ffb13e",
    blurb: "Failing checks or below the uptime floor. Treat results with caution.",
  },
  MONITORING: {
    label: "Monitoring",
    color: "#A3A3A3",
    blurb: "Too few checks recorded to rate this agent yet.",
  },
  TESTING: {
    label: "Testing",
    color: "#3ef2ff",
    blurb: "A verification run is in progress.",
  },
  SUSPENDED: {
    label: "Suspended",
    color: "#FF3B30",
    blurb: "Taken down by an operator. Not available to hire.",
  },
};

export function statusPresentation(status: AgentStatus) {
  return AGENT_STATUS_PRESENTATION[status] ?? AGENT_STATUS_PRESENTATION.MONITORING;
}
