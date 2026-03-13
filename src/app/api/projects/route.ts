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
  const { name, description, stakeholders } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 }
    );
  }

  // Validate + serialize stakeholders
  let stakeholdersJson: string | null = null;
  if (Array.isArray(stakeholders) && stakeholders.length > 0) {
    const clean = stakeholders
      .filter((s: unknown) => s && typeof s === "object")
      .map((s: { name?: unknown; role?: unknown }) => ({
        name: String(s.name ?? "").trim(),
        role: String(s.role ?? "").trim(),
      }))
      .filter((s) => s.name);
    if (clean.length > 0) stakeholdersJson = JSON.stringify(clean);
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
      stakeholders: stakeholdersJson,
      status: "active",
      phase: "initiation",
      ownerId: user.id,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
