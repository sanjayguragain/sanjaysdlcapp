import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getProjectPhase } from "@/lib/workflow";
import { ArtifactType, ArtifactStatus } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; artifactId: string }> }
) {
  const { artifactId } = await params;

  const approvals = await prisma.approval.findMany({
    where: { artifactId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ approvals });
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; artifactId: string }> }
) {
  const { id, artifactId } = await params;
  const body = await req.json();
  const { status, comment } = body;

  if (!status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json(
      { error: "Status must be 'approved' or 'rejected'" },
      { status: 400 }
    );
  }

  const artifact = await prisma.artifact.findUnique({
    where: { id: artifactId },
  });

  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Default User",
        email: "user@example.com",
        role: "product_manager",
      },
    });
  }

  // Create approval record
  const approval = await prisma.approval.create({
    data: {
      artifactId,
      userId: user.id,
      status,
      comment: comment || null,
    },
  });

  // Update artifact status
  await prisma.artifact.update({
    where: { id: artifactId },
    data: { status },
  });

  // Update project phase
  const allArtifacts = await prisma.artifact.findMany({
    where: { projectId: id },
  });
  const artifactStates = allArtifacts.map((a) => ({
    type: a.type as ArtifactType,
    status: (a.id === artifactId ? status : a.status) as ArtifactStatus,
  }));
  const newPhase = getProjectPhase(artifactStates);
  await prisma.project.update({
    where: { id },
    data: { phase: newPhase },
  });

  return NextResponse.json(approval, { status: 201 });
}
