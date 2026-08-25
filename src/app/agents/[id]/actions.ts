"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function createHire(agentId: string) {
  await prisma.hire.create({
    data: { agentId, status: "pending" },
  });
  redirect(`/agents/${agentId}?hired=1`);
}
