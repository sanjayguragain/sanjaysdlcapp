import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DocumentType, interpretScore } from "@/types";
import { runDeterministicEvaluation, buildEvaluationResult } from "@/lib/evaluationEngine";
import { evaluateWithLLM } from "@/lib/evaluationAi";
import { evaluateArtifactQuality } from "@/lib/artifactChecks";
import { ArtifactType, AiRiskIndicatorItem } from "@/types";

function mapSdlcArtifactTypeToDocumentType(artifactType: string): DocumentType {
  switch (artifactType) {
    case "prd":
    case "prd_validation":
      return "prd";
    case "test_plan":
      return "srs";
    case "deployment_plan":
      return "sad";
    default:
      return "other";
  }
}

async function runAndPersistEvaluation(params: {
  userId: string;
  documentId: string;
  textContent: string;
  artifactType: DocumentType;
}) {
  const deterministicEval = runDeterministicEvaluation(params.textContent, params.artifactType);
  const llmResult = await evaluateWithLLM(params.textContent, params.artifactType);
  const evalResult = buildEvaluationResult(params.artifactType, deterministicEval, llmResult);

  const evaluation = await prisma.evaluation.create({
    data: {
      documentId: params.documentId,
      userId: params.userId,
      overallScore: evalResult.overall_score,
      interpretation: evalResult.interpretation,
      structureScore: evalResult.category_scores.structure,
      requirementsQuality: evalResult.category_scores.requirements_quality,
      architectureCompleteness: evalResult.category_scores.architecture_completeness,
      traceability: evalResult.category_scores.traceability,
      security: evalResult.category_scores.security,
      operationalReadiness: evalResult.category_scores.operational_readiness,
      aiSpecificity: evalResult.category_scores.ai_specificity,
      recommendations: JSON.stringify(evalResult.recommendations),
      reportJson: JSON.stringify(evalResult),
    },
  });

  return { evaluation, evalResult };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const evaluations = await prisma.evaluation.findMany({
    where: { userId: session.user.id },
    include: { document: { select: { name: true, artifactType: true, fileType: true } } as { select: Record<string, boolean> } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const stats = {
    totalEvaluations: evaluations.length,
    averageScore: evaluations.length > 0
      ? Math.round(evaluations.reduce((s, e) => s + e.overallScore, 0) / evaluations.length)
      : 0,
    excellent: evaluations.filter((e) => e.overallScore >= 90).length,
    good: evaluations.filter((e) => e.overallScore >= 75 && e.overallScore < 90).length,
    needsImprovement: evaluations.filter((e) => e.overallScore >= 60 && e.overallScore < 75).length,
    reworkRequired: evaluations.filter((e) => e.overallScore < 60).length,
  };

  return NextResponse.json({ evaluations, stats });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    // ── SDLC artifact selection mode (JSON body) ────────────────────────────
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const artifactId = body?.artifactId as string | undefined;
      const requestedType = body?.artifactType as DocumentType | undefined;

      if (!artifactId) {
        return NextResponse.json({ error: "artifactId is required" }, { status: 400 });
      }

      const artifact = await prisma.artifact.findUnique({
        where: { id: artifactId },
        include: { project: { select: { name: true } } },
      });

      if (!artifact) {
        return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
      }

      const textContent = artifact.content
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z#0-9]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!textContent || textContent.length < 50) {
        return NextResponse.json(
          { error: "Selected artifact content is too short to evaluate" },
          { status: 400 }
        );
      }

      const artifactType = requestedType || mapSdlcArtifactTypeToDocumentType(artifact.type);

      const document = await prisma.evalDocument.create({
        data: {
          name: `${artifact.project.name} - ${artifact.title}`,
          artifactType,
          content: textContent,
          fileType: "sdlc-artifact",
          fileSize: Buffer.byteLength(textContent, "utf-8"),
          uploadedById: session.user.id,
        },
      });

      // Keep score consistent with SDLC artifact header and quality tab.
      const quality = evaluateArtifactQuality(
        artifact.type as ArtifactType,
        artifact.content
      );

      const evalResult = {
        overall_score: quality.overallScore,
        interpretation: quality.interpretation,
        category_scores: {
          structure: quality.categoryScores.structure,
          requirements_quality: quality.categoryScores.requirements_quality,
          architecture_completeness: quality.categoryScores.architecture_completeness,
          traceability: quality.categoryScores.traceability,
          security: quality.categoryScores.security,
          operational_readiness: quality.categoryScores.operational_readiness,
          ai_specificity: quality.categoryScores.ai_specificity,
        },
        recommendations: quality.recommendations.map((text) => ({ text, sections: ["General"] })),
        structural_analysis: {
          present_sections: quality.structuralAnalysis.presentSections,
          missing_sections: quality.structuralAnalysis.missingSections,
          section_order_correct: quality.structuralAnalysis.sectionOrderCorrect,
        },
        ai_risk_indicators: quality.aiRiskIndicators.map<AiRiskIndicatorItem>((text) => ({
          text,
          sections: ["General"],
        })),
      };

      const evaluation = await prisma.evaluation.create({
        data: {
          documentId: document.id,
          userId: session.user.id,
          overallScore: evalResult.overall_score,
          interpretation: evalResult.interpretation,
          structureScore: evalResult.category_scores.structure,
          requirementsQuality: evalResult.category_scores.requirements_quality,
          architectureCompleteness: evalResult.category_scores.architecture_completeness,
          traceability: evalResult.category_scores.traceability,
          security: evalResult.category_scores.security,
          operationalReadiness: evalResult.category_scores.operational_readiness,
          aiSpecificity: evalResult.category_scores.ai_specificity,
          recommendations: JSON.stringify(evalResult.recommendations),
          reportJson: JSON.stringify(evalResult),
        },
      });

      return NextResponse.json({ evaluation, result: evalResult });
    }

    // ── Standalone upload mode (multipart form-data) ───────────────────────
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const artifactType = (formData.get("artifactType") as DocumentType) || "other";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExts = ["txt", "md", "docx", "pdf"];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json(
        { error: "Unsupported file type. Accepted: .txt, .md, .docx, .pdf" },
        { status: 400 }
      );
    }

    // Extract text content
    let textContent: string;
    if (ext === "txt" || ext === "md") {
      textContent = await file.text();
    } else if (ext === "docx") {
      // For DOCX, extract raw text from the file buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      textContent = await extractDocxText(buffer);
    } else if (ext === "pdf") {
      // For PDF, extract text
      const buffer = Buffer.from(await file.arrayBuffer());
      textContent = await extractPdfText(buffer);
    } else {
      textContent = await file.text();
    }

    if (!textContent || textContent.trim().length < 50) {
      return NextResponse.json(
        { error: "Document content is too short or could not be extracted" },
        { status: 400 }
      );
    }

    // Save document
    const document = await prisma.evalDocument.create({
      data: {
        name: file.name,
        artifactType,
        content: textContent,
        fileType: ext,
        fileSize: file.size,
        uploadedById: session.user.id,
      },
    });

    const { evaluation, evalResult } = await runAndPersistEvaluation({
      userId: session.user.id,
      documentId: document.id,
      textContent,
      artifactType,
    });

    return NextResponse.json({ evaluation, result: evalResult });
  } catch (err) {
    console.error("[evaluations] Error:", err);
    return NextResponse.json(
      { error: "Evaluation failed" },
      { status: 500 }
    );
  }
}

/** Extract text from DOCX using basic XML parsing (no external deps). */
async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    // DOCX files are ZIP archives. We need to extract word/document.xml
    // Use a lightweight approach: decompress and parse
    const { Readable } = await import("stream");
    const { createUnzip } = await import("zlib");
    const AdmZip = (await import("adm-zip")).default;

    const zip = new AdmZip(buffer);
    const entry = zip.getEntry("word/document.xml");
    if (!entry) return "Could not extract document content";

    const xml = entry.getData().toString("utf-8");
    // Strip XML tags, keeping text content
    const text = xml
      .replace(/<w:p[^>]*>/g, "\n")
      .replace(/<w:tab[^>]*\/>/g, "\t")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return text;
  } catch {
    return "Could not extract DOCX content — upload as .txt or .md instead";
  }
}

/** Extract text from PDF (basic extraction). */
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Simple PDF text extraction — handles basic text PDFs
    const text = buffer.toString("utf-8");
    // Try to find text between stream operators
    const matches = text.match(/\(([^)]+)\)/g);
    if (matches && matches.length > 10) {
      return matches.map((m) => m.slice(1, -1)).join(" ");
    }
    // Fallback: extract readable ASCII strings
    const readable = text.replace(/[^\x20-\x7E\n]/g, " ").replace(/\s{3,}/g, "\n").trim();
    if (readable.length > 100) return readable;
    return "Could not extract PDF text — upload as .txt or .md for best results";
  } catch {
    return "Could not extract PDF content — upload as .txt or .md instead";
  }
}
