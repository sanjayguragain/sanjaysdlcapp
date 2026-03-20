import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { refineArtifactWithFeedback } from "@/lib/ai";
import { evaluateArtifactQuality } from "@/lib/artifactChecks";
import { ArtifactType } from "@/types";

const MAX_VERSIONS = 50;

function formatStakeholders(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    const list = JSON.parse(raw) as { name: string; role: string }[];
    if (!Array.isArray(list) || list.length === 0) return "";
    return "\n\nStakeholders:\n" + list.map((s) => `- ${s.name} (${s.role || "no role specified"})`).join("\n");
  } catch {
    return "";
  }
}

async function saveVersionSnapshot(artifactId: string, content: string, version: number) {
  await prisma.artifactVersion.create({ data: { artifactId, content, version } });
  const count = await prisma.artifactVersion.count({ where: { artifactId } });
  if (count > MAX_VERSIONS) {
    const oldest = await prisma.artifactVersion.findFirst({
      where: { artifactId },
      orderBy: { savedAt: "asc" },
    });
    if (oldest) {
      await prisma.artifactVersion.delete({ where: { id: oldest.id } });
    }
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; artifactId: string }> }
) {
  const { id, artifactId } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { artifacts: true, documents: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const prd = project.artifacts.find((a) => a.id === artifactId);
  if (!prd) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }
  if (prd.type !== "prd") {
    return NextResponse.json({ error: "Sync feedback is supported for PRD artifacts only" }, { status: 400 });
  }

  const sourceTypes: ArtifactType[] = ["cyber_risk_analysis", "compliance_report", "quality_review"];
  const feedbackSources = project.artifacts.filter(
    (a) => a.id !== artifactId && sourceTypes.includes(a.type as ArtifactType)
  );

  if (feedbackSources.length === 0) {
    return NextResponse.json(
      {
        error: "No Security/Compliance/Quality artifacts found to sync from",
        requiredAnyOf: sourceTypes,
      },
      { status: 422 }
    );
  }

  const before = evaluateArtifactQuality("prd", prd.content);

  const docsContext = project.documents.map((d) => d.content).join("\n\n");
  const projectContext = `Project: ${project.name}\nDescription: ${project.description || "N/A"}${formatStakeholders(project.stakeholders)}\n\nDocuments:\n${docsContext || "None"}`;

  const session = await getServerSession(authOptions);
  const authorName =
    session?.user?.name ??
    session?.user?.email ??
    (session?.user?.email
      ? (await prisma.user.findUnique({ where: { email: session.user.email }, select: { name: true } }))?.name
      : null) ??
    "Unknown";
  const today = new Date().toISOString().slice(0, 10);

  const refined = await refineArtifactWithFeedback({
    artifactType: "prd",
    projectContext,
    currentContent: prd.content,
    feedbackSources: feedbackSources.map((a) => ({
      type: a.type as ArtifactType,
      title: a.title,
      content: a.content,
    })),
    authorName,
    modifiedDate: today,
  });

  await saveVersionSnapshot(prd.id, prd.content, prd.version);

  const updated = await prisma.artifact.update({
    where: { id: prd.id },
    data: {
      content: refined.content,
      version: prd.version + 1,
      status: "in_progress",
      confidenceScore: refined.metadata?.confidenceScore ?? evaluateArtifactQuality("prd", refined.content).confidenceScore,
    },
  });

  const after = evaluateArtifactQuality("prd", updated.content);

  const summary = {
    syncedAt: new Date().toISOString(),
    sourceArtifacts: feedbackSources.map((a) => ({ id: a.id, type: a.type, title: a.title })),
    before: {
      overallScore: before.overallScore,
      confidenceScore: before.confidenceScore,
      recommendations: before.recommendations.length,
      blockers: before.blockers.length,
    },
    after: {
      overallScore: after.overallScore,
      confidenceScore: after.confidenceScore,
      recommendations: after.recommendations.length,
      blockers: after.blockers.length,
    },
    delta: {
      overallScore: after.overallScore - before.overallScore,
      confidenceScore: Number((after.confidenceScore - before.confidenceScore).toFixed(4)),
      recommendations: after.recommendations.length - before.recommendations.length,
      blockers: after.blockers.length - before.blockers.length,
    },
  };

  return NextResponse.json({ artifact: updated, syncSummary: summary });
}
