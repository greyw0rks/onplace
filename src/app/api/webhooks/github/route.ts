import { getBaseUrl } from "@/lib/base-url";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-hub-signature-256");
  const body = await request.text();

  const payload = JSON.parse(body);

  if (payload.ref && payload.commits) {
    const repoUrl = payload.repository?.html_url;

    const gitRepo = await prisma.gitRepository.findFirst({
      where: { repoUrl },
    });

    if (!gitRepo) {
      return NextResponse.json({ error: "Repository not tracked" }, { status: 404 });
    }

    if (signature && gitRepo.webhookSecret) {
      const hmac = crypto.createHmac("sha256", gitRepo.webhookSecret);
      hmac.update(body);
      const calculatedSignature = "sha256=" + hmac.digest("hex");

      if (signature !== calculatedSignature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    for (const commit of payload.commits) {
      await prisma.gitCommit.create({
        data: {
          repoId: gitRepo.id,
          hash: commit.id,
          message: commit.message,
          author: commit.author?.name || commit.author?.username || "unknown",
          timestamp: new Date(commit.timestamp),
          analyzed: false,
        },
      });
    }

    await prisma.gitRepository.update({
      where: { id: gitRepo.id },
      data: {
        lastCommit: payload.commits[payload.commits.length - 1].id,
        lastCheck: new Date(),
      },
    });

    await triggerTestsForAgent(gitRepo.agentId);

    return NextResponse.json({ success: true, commitsProcessed: payload.commits.length });
  }

  return NextResponse.json({ success: true, message: "Event ignored" });
}

async function triggerTestsForAgent(agentId: string) {
  const baseUrl = getBaseUrl();

  try {
    await fetch(`${baseUrl}/api/tests/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    });
  } catch (error) {
    console.error("Failed to trigger tests:", error);
  }
}
