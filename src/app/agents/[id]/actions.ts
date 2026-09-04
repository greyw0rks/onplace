"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function createHire(formData: FormData) {
  const agentId = formData.get("agentId") as string;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { name: true, status: true },
  });

  if (!agent) {
    redirect(`/agents/${agentId}`);
  }

  // A suspended agent is one an operator pulled; letting it still be hired would
  // make the status badge decorative.
  if (agent.status === "SUSPENDED") {
    redirect(`/agents/${agentId}?hired=blocked`);
  }

  await prisma.hire.create({
    data: { agentId, status: "pending" },
  });

  await prisma.agent.update({
    where: { id: agentId },
    data: { hireCount: { increment: 1 } },
  });

  // The feed is the marketplace's only "something is happening here" signal, so
  // every user-visible action should leave a trace in it.
  await prisma.marketplaceActivity.create({
    data: {
      type: "AGENT_HIRED",
      agentId,
      title: `${agent.name} was hired`,
      description: null,
    },
  });

  redirect(`/agents/${agentId}?hired=1`);
}
