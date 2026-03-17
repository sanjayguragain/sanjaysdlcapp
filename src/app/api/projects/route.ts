import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
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
  } catch (error) {
    console.error("GET /api/projects failed:", error);
    return NextResponse.json(
      {
        error: "Failed to load projects",
        details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, stakeholders, sdlcMode } = body;

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

    const projectData = {
      name: name.trim(),
      description: description?.trim() || null,
      sdlcMode: sdlcMode === "traditional" ? "traditional" : "modern",
      stakeholders: stakeholdersJson,
      status: "active",
      phase: "initiation",
      ownerId: user.id,
    };

    let project;
    try {
      project = await prisma.project.create({ data: projectData });
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "";
      if (message.includes("Unknown argument `sdlcMode`")) {
        const { sdlcMode: _ignored, ...legacyProjectData } = projectData;
        project = await prisma.project.create({ data: legacyProjectData });
      } else {
        throw createError;
      }
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects failed:", error);
    return NextResponse.json(
      {
        error: "Failed to create project",
        details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
