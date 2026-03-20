import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type ProjectEstimate = {
  id: string;
  name: string;
  mode: string;
  phase: string;
  status: string;
  artifactCount: number;
  targetArtifacts: number;
  completionPct: number;
  remainingHours: number;
  risk: "low" | "medium" | "high";
};

function clampPercent(val: number) {
  return Math.max(0, Math.min(100, Math.round(val)));
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        artifacts: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const projectIds = projects.map((p) => p.id);
    const approvals = projectIds.length
      ? await prisma.approval.findMany({
          where: { artifact: { projectId: { in: projectIds } } },
          select: {
            status: true,
            createdAt: true,
            artifact: {
              select: {
                id: true,
                createdAt: true,
                projectId: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        })
      : [];

    const baselineByMode: Record<string, number> = {
      modern: 8,
      traditional: 10,
    };

    const projectEstimates: ProjectEstimate[] = projects.map((project) => {
      const artifactCount = project.artifacts.length;
      const targetBase = baselineByMode[project.sdlcMode] ?? 8;
      const targetArtifacts = Math.max(targetBase, artifactCount);

      const approved = project.artifacts.filter((a) => a.status === "approved").length;
      const rejected = project.artifacts.filter((a) => a.status === "rejected").length;
      const awaiting = project.artifacts.filter((a) => a.status === "awaiting_approval").length;
      const generated = project.artifacts.filter((a) => a.status === "generated").length;

      const completionPct = clampPercent((approved / targetArtifacts) * 100);

      const missingArtifacts = Math.max(targetArtifacts - artifactCount, 0);
      const remainingHours =
        missingArtifacts * 7 + // create + iterate + review cycle
        generated * 5 +
        awaiting * 2 +
        rejected * 6;

      const riskScore =
        (rejected * 2 + awaiting + (project.status !== "active" ? 1 : 0)) /
        Math.max(artifactCount, 1);
      const risk = riskScore >= 1.4 ? "high" : riskScore >= 0.7 ? "medium" : "low";

      return {
        id: project.id,
        name: project.name,
        mode: project.sdlcMode,
        phase: project.phase,
        status: project.status,
        artifactCount,
        targetArtifacts,
        completionPct,
        remainingHours,
        risk,
      };
    });

    const totalProjects = projects.length;
    const inFlightProjects = projects.filter((p) => p.status === "active").length;
    const totalCurrentArtifacts = projectEstimates.reduce((sum, p) => sum + p.artifactCount, 0);
    const projectedTotalArtifacts = projectEstimates.reduce((sum, p) => sum + p.targetArtifacts, 0);
    const totalRemainingHours = projectEstimates.reduce((sum, p) => sum + p.remainingHours, 0);
    const overallCompletionPct = projectedTotalArtifacts
      ? clampPercent((projectEstimates.reduce((sum, p) => sum + p.completionPct, 0) / (totalProjects || 1)))
      : 0;

    const now = Date.now();
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const approvedRecently = approvals.filter(
      (a) => a.status === "approved" && new Date(a.createdAt) >= fourteenDaysAgo
    ).length;
    const artifactsPerWeek = Number(((approvedRecently / 14) * 7).toFixed(1));

    // Average duration from artifact creation to first approval decision.
    const firstApprovalByArtifact = new Map<string, Date>();
    for (const approval of approvals) {
      if (!firstApprovalByArtifact.has(approval.artifact.id)) {
        firstApprovalByArtifact.set(approval.artifact.id, approval.createdAt);
      }
    }
    const leadTimes = approvals
      .map((a) => {
        const first = firstApprovalByArtifact.get(a.artifact.id);
        if (!first || first.getTime() !== a.createdAt.getTime()) return null;
        return (a.createdAt.getTime() - a.artifact.createdAt.getTime()) / (1000 * 60 * 60);
      })
      .filter((x): x is number => x !== null && Number.isFinite(x) && x >= 0);
    const avgLeadTimeHours = leadTimes.length
      ? Number((leadTimes.reduce((sum, h) => sum + h, 0) / leadTimes.length).toFixed(1))
      : null;

    // Convert remaining hours to projected completion date using ~30 effective team hours/day.
    const effectiveHoursPerDay = 30;
    const daysToComplete = effectiveHoursPerDay > 0 ? Math.ceil(totalRemainingHours / effectiveHoursPerDay) : 0;
    const projectedCompletionDate = new Date(now + daysToComplete * 24 * 60 * 60 * 1000);

    return NextResponse.json({
      summary: {
        totalProjects,
        inFlightProjects,
        totalCurrentArtifacts,
        projectedTotalArtifacts,
        overallCompletionPct,
        totalRemainingHours,
        projectedCompletionDate: projectedCompletionDate.toISOString(),
      },
      velocity: {
        approvedLast14Days: approvedRecently,
        artifactsPerWeek,
        avgLeadTimeHours,
      },
      distribution: {
        lowRisk: projectEstimates.filter((p) => p.risk === "low").length,
        mediumRisk: projectEstimates.filter((p) => p.risk === "medium").length,
        highRisk: projectEstimates.filter((p) => p.risk === "high").length,
      },
      projects: projectEstimates,
    });
  } catch (err) {
    console.error("[estimations] route error:", err);
    return NextResponse.json({ error: "Failed to load estimations" }, { status: 500 });
  }
}