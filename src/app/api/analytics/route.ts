import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Total counts
  const totalArtifacts = await prisma.artifact.count();
  const approvedArtifacts = await prisma.artifact.count({ where: { status: "approved" } });
  const rejectedArtifacts = await prisma.artifact.count({ where: { status: "rejected" } });
  const awaitingArtifacts = await prisma.artifact.count({ where: { status: "awaiting_approval" } });

  // Confidence scores
  const withScore = await prisma.artifact.findMany({
    where: { confidenceScore: { not: null } },
    select: { confidenceScore: true },
  });
  // Normalise: scores accidentally stored as percentages (>1) are divided back to 0-1
  const normalisedScores = withScore.map((a) => {
    const s = a.confidenceScore ?? 0;
    return s > 1 ? s / 100 : s;
  });
  const avgConfidence =
    normalisedScores.length > 0
      ? normalisedScores.reduce((sum, s) => sum + s, 0) / normalisedScores.length
      : null;

  // Approval rate and rejection rate (out of artifacts that reached the review stage)
  const reviewed = approvedArtifacts + rejectedArtifacts;
  const approvalRate = reviewed > 0 ? approvedArtifacts / reviewed : null;
  const rejectionRate = reviewed > 0 ? rejectedArtifacts / reviewed : null;

  // Artifacts by type
  const byType = await prisma.artifact.groupBy({
    by: ["type"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  // Artifacts by status
  const byStatus = await prisma.artifact.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  // Version revisions: average number of saved versions per artifact
  const versionCounts = await prisma.artifactVersion.groupBy({
    by: ["artifactId"],
    _count: { id: true },
  });
  const avgRevisions =
    versionCounts.length > 0
      ? versionCounts.reduce((sum, v) => sum + v._count.id, 0) / versionCounts.length
      : 0;

  // Top revised artifacts (most version snapshots)
  const topRevised = await prisma.artifactVersion.groupBy({
    by: ["artifactId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });
  const topRevisedWithTitles = await Promise.all(
    topRevised.map(async (t) => {
      const artifact = await prisma.artifact.findUnique({
        where: { id: t.artifactId },
        select: { title: true, type: true, project: { select: { name: true } } },
      });
      return {
        artifactId: t.artifactId,
        revisions: t._count.id,
        title: artifact?.title ?? "Unknown",
        type: artifact?.type ?? "unknown",
        projectName: artifact?.project?.name ?? "Unknown",
      };
    })
  );

  // Recent approvals trend (last 7 days, by day)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentApprovals = await prisma.approval.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const approvalsByDay: Record<string, { approved: number; rejected: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    approvalsByDay[key] = { approved: 0, rejected: 0 };
  }
  for (const a of recentApprovals) {
    const key = new Date(a.createdAt).toISOString().slice(0, 10);
    if (approvalsByDay[key]) {
      if (a.status === "approved") approvalsByDay[key].approved++;
      else if (a.status === "rejected") approvalsByDay[key].rejected++;
    }
  }

  return NextResponse.json({
    totals: {
      totalArtifacts,
      approvedArtifacts,
      rejectedArtifacts,
      awaitingArtifacts,
    },
    rates: {
      approvalRate,
      rejectionRate,
      avgConfidence,
      avgRevisions,
    },
    byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
    topRevised: topRevisedWithTitles,
    approvalTrend: Object.entries(approvalsByDay).map(([date, counts]) => ({
      date,
      ...counts,
    })),
  });
  } catch (err) {
    console.error("[analytics] route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
