import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const evaluations = await prisma.evaluation.findMany({
      where: { userId },
      include: {
        document: { select: { name: true, artifactType: true } } as { select: Record<string, boolean> },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = evaluations.length;
    const avgScore = total > 0
      ? Math.round(evaluations.reduce((s, e) => s + e.overallScore, 0) / total)
      : 0;

    const distribution = {
      excellent: evaluations.filter((e) => e.overallScore >= 90).length,
      good: evaluations.filter((e) => e.overallScore >= 75 && e.overallScore < 90).length,
      needsImprovement: evaluations.filter((e) => e.overallScore >= 60 && e.overallScore < 75).length,
      reworkRequired: evaluations.filter((e) => e.overallScore < 60).length,
    };

    const avgByCategory = total > 0 ? {
      structure: Math.round(evaluations.reduce((s, e) => s + e.structureScore, 0) / total),
      requirements_quality: Math.round(evaluations.reduce((s, e) => s + e.requirementsQuality, 0) / total),
      architecture_completeness: Math.round(evaluations.reduce((s, e) => s + e.architectureCompleteness, 0) / total),
      traceability: Math.round(evaluations.reduce((s, e) => s + e.traceability, 0) / total),
      security: Math.round(evaluations.reduce((s, e) => s + e.security, 0) / total),
      operational_readiness: Math.round(evaluations.reduce((s, e) => s + e.operationalReadiness, 0) / total),
      ai_specificity: Math.round(evaluations.reduce((s, e) => s + e.aiSpecificity, 0) / total),
    } : null;

    // Evaluations by document type
    const byDocTypeMap: Record<string, { count: number; totalScore: number }> = {};
    for (const e of evaluations) {
      const dt = (e as unknown as { document: { artifactType: string } }).document.artifactType;
      if (!byDocTypeMap[dt]) byDocTypeMap[dt] = { count: 0, totalScore: 0 };
      byDocTypeMap[dt].count++;
      byDocTypeMap[dt].totalScore += e.overallScore;
    }
    const byDocType = Object.entries(byDocTypeMap).map(([artifactType, v]) => ({
      artifactType,
      count: v.count,
      avgScore: Math.round(v.totalScore / v.count),
    }));

    // Common recommendations
    const recCounts: Record<string, number> = {};
    for (const e of evaluations) {
      const recs: string[] = JSON.parse(e.recommendations);
      for (const rec of recs) {
        recCounts[rec] = (recCounts[rec] || 0) + 1;
      }
    }
    const commonIssues = Object.entries(recCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([recommendation, count]) => ({ recommendation, count }));

    // Score trend (last 30 evaluations)
    const scoreTrend = evaluations
      .slice(0, 30)
      .reverse()
      .map((e) => ({
        date: e.createdAt,
        score: e.overallScore,
        documentName: (e as unknown as { document: { name: string } }).document.name,
      }));

    return NextResponse.json({
      total,
      avgScore,
      distribution,
      avgByCategory,
      byDocType,
      commonIssues,
      scoreTrend,
    });
  } catch (err) {
    console.error("[evaluations/analytics] route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
