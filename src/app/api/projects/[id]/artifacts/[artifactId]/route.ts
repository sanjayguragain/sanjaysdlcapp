import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateArtifact, TemplateValidationError } from "@/lib/ai";
import { ArtifactType, ArtifactStatus, ARTIFACT_DEFINITIONS } from "@/types";
import { getProjectPhase } from "@/lib/workflow";
import { evaluateArtifactQuality } from "@/lib/artifactChecks";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Format stakeholders JSON into a context block for the AI prompt. */
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

const MAX_VERSIONS = 50;

/** Save a version snapshot and prune oldest if the cap is exceeded. */
async function saveVersionSnapshot(
  artifactId: string,
  content: string,
  version: number
) {
  await prisma.artifactVersion.create({
    data: { artifactId, content, version },
  });
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; artifactId: string }> }
) {
  const { artifactId } = await params;

  const artifact = await prisma.artifact.findUnique({
    where: { id: artifactId },
    include: { owner: true, approvals: { include: { user: true } } },
  });

  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  return NextResponse.json(artifact);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; artifactId: string }> }
) {
  const { id, artifactId } = await params;
  const body = await req.json();

  const QUALITY_SUBMIT_THRESHOLD = 0.8; // 80%

  const artifact = await prisma.artifact.findUnique({
    where: { id: artifactId },
  });

  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  // Regenerate artifact
  if (body.regenerate) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { artifacts: true, documents: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const docsContent = project.documents.map((d) => d.content).join("\n\n");
    const otherArtifacts = project.artifacts
      .filter((a) => a.id !== artifactId)
      .map((a) => ({ type: a.type, content: a.content }));

    const projectContext = `Project: ${project.name}\nDescription: ${project.description || "N/A"}${formatStakeholders(project.stakeholders)}\n\nExisting Documents:\n${docsContent}\n\nOther Artifacts:\n${otherArtifacts.map((a) => `[${a.type}]: ${a.content.substring(0, 500)}`).join("\n")}`;

    const session = await getServerSession(authOptions);
    const sessionUser = session?.user?.email
      ? await prisma.user.findUnique({ where: { email: session.user.email }, select: { name: true } })
      : null;
    const authorName = sessionUser?.name ?? "Unknown";
    const today = new Date().toISOString().slice(0, 10);

    let result;
    try {
      result = await generateArtifact(
        artifact.type as ArtifactType,
        projectContext,
        undefined,
        { authorName, createdDate: today, isUpdate: true, changeSummary: "Document regenerated" }
      );
    } catch (error) {
      if (error instanceof TemplateValidationError) {
        return NextResponse.json(
          {
            error: error.message,
            missingHeadings: error.missingHeadings,
          },
          { status: 422 }
        );
      }
      throw error;
    }

    const updated = await prisma.artifact.update({
      where: { id: artifactId },
      data: {
        content: result.content,
        confidenceScore: result.metadata?.confidenceScore ?? 0.85,
        version: { increment: 1 },
        status: "generated",
      },
    });

    // Clear previous approvals
    await prisma.approval.deleteMany({ where: { artifactId } });

    return NextResponse.json(updated);
  }

  // Guard: block submission if the document still has unresolved placeholders or open questions
  if (body.status === "awaiting_approval") {
    const contentToCheck: string = body.content ?? artifact.content ?? "";
    const quality = evaluateArtifactQuality(artifact.type as ArtifactType, contentToCheck);
    const bypassBlockers = quality.confidenceScore >= QUALITY_SUBMIT_THRESHOLD;

    if (quality.blockers.length > 0 && !bypassBlockers) {
      return NextResponse.json(
        {
          error: `Cannot submit for approval: ${quality.blockers.length} open question(s) must be resolved first.`,
          openQuestions: quality.blockers,
          qualityScore: quality.confidenceScore,
          qualityPct: quality.overallScore,
          categoryScores: quality.categoryScores,
          recommendations: quality.recommendations,
        },
        { status: 422 }
      );
    }
  }

  // Regular update
  const updateData: Record<string, unknown> = {};
  if (body.content !== undefined) updateData.content = body.content;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.title !== undefined) updateData.title = body.title;

  // When submitting for approval, always re-score quality on the submitted content.
  if (body.status === "awaiting_approval") {
    const contentToScore: string = body.content ?? artifact.content ?? "";
    const quality = evaluateArtifactQuality(artifact.type as ArtifactType, contentToScore);
    updateData.confidenceScore = quality.confidenceScore;
  }

  // When content changes, save current content as a version snapshot before updating
  if (body.content !== undefined && body.content !== artifact.content) {
    await saveVersionSnapshot(artifactId, artifact.content, artifact.version);
    updateData.version = { increment: 1 };
    // If we already re-scored for submission, keep that value; otherwise score now.
    if (updateData.confidenceScore === undefined) {
      const quality = evaluateArtifactQuality(artifact.type as ArtifactType, body.content);
      updateData.confidenceScore = quality.confidenceScore;
    }
  }

  const updated = await prisma.artifact.update({
    where: { id: artifactId },
    data: updateData,
  });

  // Update project phase
  const allArtifacts = await prisma.artifact.findMany({
    where: { projectId: id },
  });
  const artifactStates = allArtifacts.map((a) => ({
    type: a.type as ArtifactType,
    status: a.status as ArtifactStatus,
  }));
  const newPhase = getProjectPhase(artifactStates);
  await prisma.project.update({
    where: { id },
    data: { phase: newPhase },
  });

  return NextResponse.json(updated);
}
