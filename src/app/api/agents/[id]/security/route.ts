import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const audits = await prisma.securityAudit.findMany({
    where: { agentId: id },
    include: {
      findings: true,
      permissionSpec: {
        include: {
          capabilities: true,
        },
      },
    },
    orderBy: { auditedAt: "desc" },
  });

  return NextResponse.json({ audits });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { agentId, securityLevel, capabilities, findings } = body;

  const permissionSpec = await prisma.permissionSpec.create({
    data: {
      agentId,
      version: body.version || "1.0.0",
      capabilities: {
        create: capabilities.map((cap: any) => ({
          name: cap.name,
          level: cap.level,
          required: cap.required || false,
        })),
      },
    },
  });

  const audit = await prisma.securityAudit.create({
    data: {
      agentId,
      securityLevel,
      auditedBy: body.auditedBy,
      permissionSpecId: permissionSpec.id,
      findings: {
        create: findings.map((finding: any) => ({
          severity: finding.severity,
          category: finding.category,
          title: finding.title,
          description: finding.description,
          remediation: finding.remediation,
        })),
      },
    },
    include: {
      findings: true,
      permissionSpec: {
        include: {
          capabilities: true,
        },
      },
    },
  });

  await prisma.agent.update({
    where: { id: agentId },
    data: {
      securityLevel,
      lastSecurityAudit: new Date(),
    },
  });

  return NextResponse.json({ audit });
}
