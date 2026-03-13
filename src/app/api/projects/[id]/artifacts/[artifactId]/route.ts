import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateArtifact } from "@/lib/ai";
import { ArtifactType, ArtifactStatus, ARTIFACT_DEFINITIONS } from "@/types";
import { getProjectPhase } from "@/lib/workflow";

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

    const projectContext = `Project: ${project.name}\nDescription: ${project.description || "N/A"}\n\nExisting Documents:\n${docsContent}\n\nOther Artifacts:\n${otherArtifacts.map((a) => `[${a.type}]: ${a.content.substring(0, 500)}`).join("\n")}`;

    const result = await generateArtifact(
      artifact.type as ArtifactType,
      projectContext
    );

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

  // Regular update
  const updateData: Record<string, unknown> = {};
  if (body.content !== undefined) updateData.content = body.content;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.title !== undefined) updateData.title = body.title;

  // When content changes, save current content as a version snapshot before updating
  if (body.content !== undefined && body.content !== artifact.content) {
    await prisma.artifactVersion.create({
      data: {
        artifactId,
        content: artifact.content,
        version: artifact.version,
      },
    });
    updateData.version = { increment: 1 };
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
