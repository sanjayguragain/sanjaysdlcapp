import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateArtifact, TemplateValidationError } from "@/lib/ai";
import { ARTIFACT_DEFINITIONS, ArtifactType, ArtifactStatus } from "@/types";
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

const STANDALONE_ARTIFACT_LABELS: Partial<Record<ArtifactType, string>> = {
  brd: "Business Requirements Document",
  avd: "Architecture Vision Document",
  srs: "System Requirements Specification",
  sad: "Solution Architecture Definition",
  ses: "System Engineering Specification",
};

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

const VALID_TYPES: ArtifactType[] = [
  "brd",
  "avd",
  "srs",
  "sad",
  "ses",
  ...ARTIFACT_DEFINITIONS.map((d) => d.type),
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const artifacts = await prisma.artifact.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ artifacts });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { type } = body;

  if (!type || !VALID_TYPES.includes(type as ArtifactType)) {
    return NextResponse.json(
      { error: "Invalid artifact type" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: { artifacts: true, documents: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Check if artifact already exists
  const existing = project.artifacts.find((a: { type: string }) => a.type === type);
  if (existing) {
    return NextResponse.json(
      { error: "Artifact of this type already exists. Use PUT to regenerate." },
      { status: 409 }
    );
  }

  const def = ARTIFACT_DEFINITIONS.find((d) => d.type === type);
  const artifactLabel = def?.label ?? STANDALONE_ARTIFACT_LABELS[type as ArtifactType];
  if (!artifactLabel) {
    return NextResponse.json({ error: "Unknown artifact type" }, { status: 400 });
  }

  // Resolve the logged-in user (from session, else DB fallback)
  const session = await getServerSession(authOptions);
  let user = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email } })
    : null;
  if (!user) {
    user = await prisma.user.findFirst() ?? await prisma.user.create({
      data: { name: "Default User", email: "user@example.com", role: "product_manager" },
    });
  }

  // Gather context
  const docsContent = project.documents.map((d: { content: string }) => d.content).join("\n\n");
  const existingArtifacts = project.artifacts.map((a: { type: string; content: string }) => ({
    type: a.type,
    content: a.content,
  }));

  const projectContext = `Project: ${project.name}\nDescription: ${project.description || "N/A"}${formatStakeholders(project.stakeholders)}\n\nExisting Documents:\n${docsContent}\n\nExisting Artifacts:\n${existingArtifacts.map((a: { type: string; content: string }) => `[${a.type}]: ${a.content.substring(0, 500)}`).join("\n")}`;

  const today = new Date().toISOString().slice(0, 10);

  // Generate content
  let result;
  try {
    result = await generateArtifact(
      type as ArtifactType,
      projectContext,
      undefined,
      { authorName: user.name, createdDate: today, isUpdate: false }
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

  const artifact = await prisma.artifact.create({
    data: {
      type,
      title: artifactLabel,
      content: result.content,
      status: "generated",
      confidenceScore: result.metadata?.confidenceScore ?? 0.85,
      version: 1,
      projectId: id,
      ownerId: user.id,
    },
  });

  // Update project phase
  const allArtifacts = [...project.artifacts, artifact];
  const artifactStates = allArtifacts.map((a) => ({
    type: a.type as ArtifactType,
    status: a.status as ArtifactStatus,
  }));
  const newPhase = getProjectPhase(artifactStates);
  await prisma.project.update({
    where: { id },
    data: { phase: newPhase },
  });

  return NextResponse.json(artifact, { status: 201 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const artifactId = url.searchParams.get("artifactId");

  if (!artifactId) {
    return NextResponse.json(
      { error: "artifactId query parameter is required" },
      { status: 400 }
    );
  }

  const artifact = await prisma.artifact.findFirst({
    where: { id: artifactId, projectId: id },
  });

  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const body = await req.json();
  const { content, title } = body;

  if (!content) {
    return NextResponse.json(
      { error: "content is required" },
      { status: 400 }
    );
  }

  // Snapshot the current content before overwriting
  if (content !== artifact.content) {
    await saveVersionSnapshot(artifactId, artifact.content, artifact.version);
  }

  const updated = await prisma.artifact.update({
    where: { id: artifactId },
    data: {
      content,
      ...(title ? { title } : {}),
      confidenceScore: evaluateArtifactQuality(artifact.type as ArtifactType, content).confidenceScore,
      version: artifact.version + 1,
      status: "in_progress",
    },
  });

  return NextResponse.json(updated);
}
