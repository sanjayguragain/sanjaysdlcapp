import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { artifacts: true } },
      artifacts: { select: { status: true } },
    },
  });

  const totalArtifacts = await prisma.artifact.count();
  const approvedArtifacts = await prisma.artifact.count({
    where: { status: "approved" },
  });
  const awaitingApproval = await prisma.artifact.count({
    where: { status: "awaiting_approval" },
  });

  const projectsWithCounts = projects.map((p) => ({
    ...p,
    awaitingApproval: p.artifacts.filter((a) => a.status === "awaiting_approval").length,
    artifacts: undefined,
  }));

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === "active").length,
    totalArtifacts,
    approvedArtifacts,
    awaitingApproval,
  };

  return NextResponse.json({ projects: projectsWithCounts, stats });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 }
    );
  }

  // Get or create a default user
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

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      status: "active",
      phase: "initiation",
      ownerId: user.id,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
