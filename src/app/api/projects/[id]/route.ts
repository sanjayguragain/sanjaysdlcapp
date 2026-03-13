import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      artifacts: {
        orderBy: { createdAt: "asc" },
      },
      owner: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, status, phase } = body;

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(status && { status }),
      ...(phase && { phase }),
    },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Delete related records first
  await prisma.chatMessage.deleteMany({ where: { projectId: id } });
  await prisma.document.deleteMany({ where: { projectId: id } });
  const artifacts = await prisma.artifact.findMany({ where: { projectId: id } });
  for (const artifact of artifacts) {
    await prisma.approval.deleteMany({ where: { artifactId: artifact.id } });
  }
  await prisma.artifact.deleteMany({ where: { projectId: id } });
  await prisma.project.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
