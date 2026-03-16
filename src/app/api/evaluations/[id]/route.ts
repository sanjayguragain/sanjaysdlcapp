import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const evaluation = await prisma.evaluation.findUnique({
    where: { id },
    include: {
      document: {
        select: { name: true, artifactType: true, fileType: true, fileSize: true, createdAt: true },
      } as { select: Record<string, boolean> },
    },
  });

  if (!evaluation) {
    return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
  }

  if (evaluation.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse the stored JSON fields
  const report = JSON.parse(evaluation.reportJson);
  const recommendations = JSON.parse(evaluation.recommendations);

  return NextResponse.json({
    evaluation: {
      ...evaluation,
      recommendations,
      report,
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const evaluation = await prisma.evaluation.findUnique({ where: { id } });
  if (!evaluation || evaluation.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.evaluation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
