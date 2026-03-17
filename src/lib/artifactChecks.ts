/**
 * Shared utility for detecting blocking issues in artifact content
 * AND deep quality evaluation using the evaluation engine.
 *
 * Used by:
 *  - ArtifactSidePanel (client) — pre-submission gate
 *  - ArtifactViewer (client)    — pre-submission gate
 *  - PUT /artifacts/:id route   — server-side guard
 *  - Quality API endpoint        — detailed quality breakdown
 */
import type { ArtifactType, DocumentType, EvaluationCategory } from "@/types";
import { interpretScore } from "@/types";
import {
  runDeterministicEvaluation,
  buildEvaluationResult,
  calculateOverallScore,
  type CategoryScores,
} from "./evaluationEngine";

// ── ArtifactType → DocumentType mapping ─────────────────────────────────────

const ARTIFACT_TO_DOC_TYPE: Record<ArtifactType, DocumentType> = {
  brd: "vision_document",
  avd: "vision_document",
  srs: "srs",
  sad: "sad",
  ses: "sad",
  prd: "prd",
  prd_validation: "prd",
  preliminary_estimation: "other",
  cyber_risk_analysis: "other",
  compliance_report: "other",
  revised_estimation: "other",
  test_plan: "srs",
  quality_review: "other",
  deployment_plan: "sad",
};

/** Strip HTML tags and decode entities to plain text for evaluation. */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Quality evaluation result (for SDLC artifacts) ──────────────────────────

export interface ArtifactQualityResult {
  overallScore: number;            // 0-100
  confidenceScore: number;         // 0-1 (for backward compat with Prisma field)
  interpretation: string;
  categoryScores: Record<EvaluationCategory, number>;
  blockers: string[];
  recommendations: string[];
  structuralAnalysis: {
    presentSections: string[];
    missingSections: string[];
    sectionOrderCorrect: boolean;
  };
  aiRiskIndicators: string[];
}

/**
 * Run the full quality evaluation on an SDLC artifact.
 * Combines the existing blocker detection with the evaluation engine's
 * 7-category scoring (deterministic portion — no LLM call).
 *
 * For LLM-enhanced scores (architecture_completeness, security,
 * operational_readiness), default estimates are used based on the
 * deterministic signals. Use `evaluateArtifactQualityWithLLM()` for
 * the full LLM-augmented evaluation.
 */
export function evaluateArtifactQuality(
  type: ArtifactType,
  htmlContent: string
): ArtifactQualityResult {
  const text = htmlToPlainText(htmlContent);
  const docType = ARTIFACT_TO_DOC_TYPE[type] ?? "other";

  // Run blocker detection on the raw HTML (needs tags for heading parsing)
  const blockers = extractBlockers(htmlContent);

  // Run deterministic evaluation engine
  const deterministicEval = runDeterministicEvaluation(text, docType);

  // Estimate LLM categories from deterministic signals
  const structureScore = deterministicEval.partialScores.structure;
  const reqScore = deterministicEval.partialScores.requirements_quality;

  // Architecture completeness: derive from structure + content length
  const archScore = Math.round(
    structureScore * 0.6 + Math.min(100, text.length / 50) * 0.4
  );
  // Security: check for security-related keywords
  const securityKeywords = /security|threat|vulnerability|authentication|authorization|encryption|access\s*control|compliance/i;
  const secScore = securityKeywords.test(text)
    ? Math.min(100, structureScore * 0.5 + 40)
    : Math.max(20, structureScore * 0.3);
  // Operational readiness: check for ops keywords
  const opsKeywords = /monitoring|alerting|deployment|rollback|health\s*check|incident|sla|slo|logging|observability/i;
  const opsScore = opsKeywords.test(text)
    ? Math.min(100, structureScore * 0.5 + 35)
    : Math.max(20, structureScore * 0.3);

  const fullResult = buildEvaluationResult(docType, deterministicEval, {
    architecture_completeness: archScore,
    security: Math.round(secScore),
    operational_readiness: Math.round(opsScore),
    llmRecommendations: [],
  });

  // Apply blocker penalty: each unresolved blocker reduces score
  const blockerPenalty = Math.min(20, blockers.length * 3);
  const adjustedScore = Math.max(0, fullResult.overall_score - blockerPenalty);

  // Add blocker-related recommendations
  const allRecs = fullResult.recommendations.map((r) => r.text);
  if (blockers.length > 0) {
    allRecs.unshift(
      `Resolve ${blockers.length} open question(s) / placeholder(s) before submission`
    );
  }

  return {
    overallScore: adjustedScore,
    confidenceScore: Math.min(0.98, Math.max(0.05, adjustedScore / 100)),
    interpretation: interpretScore(adjustedScore),
    categoryScores: fullResult.category_scores,
    blockers,
    recommendations: allRecs,
    structuralAnalysis: {
      presentSections: fullResult.structural_analysis.present_sections,
      missingSections: fullResult.structural_analysis.missing_sections,
      sectionOrderCorrect: fullResult.structural_analysis.section_order_correct,
    },
    aiRiskIndicators: fullResult.ai_risk_indicators.map((risk) => risk.text),
  };
}

/**
 * Decode dash HTML entities so regex matching works regardless of whether the
 * AI / serialiser emitted the Unicode character or an HTML entity.
 * We intentionally do NOT decode < > & because we still need the HTML structure.
 */
function decodeDashEntities(html: string): string {
  return html
    .replace(/&mdash;/gi, "\u2014")   // —
    .replace(/&#x2014;/gi, "\u2014")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&ndash;/gi, "\u2013")   // –
    .replace(/&#x2013;/gi, "\u2013")
    .replace(/&#8211;/g, "\u2013");
}

/**
 * Scan the artifact HTML content and return every blocking item that must be
 * resolved before the artifact can be submitted for approval.
 *
 * Detects:
 *  1. Inline `[To be confirmed — <label>]` placeholders (labelled)
 *  2. Bare `[To be confirmed]` placeholders (unlabelled)
 *  3. Any list item or paragraph inside a heading section whose text contains
 *     an "open questions" variant (e.g. "Open Questions", "Questions for
 *     Stakeholders", "Pending Questions", "Outstanding Items").
 *
 * Returns a deduplicated, human-readable list of blocking items.
 */
export function extractBlockers(rawHtml: string): string[] {
  const html = decodeDashEntities(rawHtml);
  const blockers: string[] = [];

  const shouldIgnoreOpenQuestionsText = (text: string): boolean => {
    const normalized = text.replace(/\s+/g, " ").trim().toLowerCase();
    if (!normalized) return true;
    // Common non-blocking sentinel phrases that indicate there are no remaining questions.
    if (normalized === "none" || normalized === "n/a" || normalized === "na") return true;
    if (normalized.includes("no open questions")) return true;
    if (normalized.includes("no outstanding")) return true;
    if (normalized.includes("all open questions have been resolved")) return true;
    if (normalized.includes("all previously open questions have been resolved")) return true;
    if (normalized.includes("have been resolved and incorporated")) return true;
    return false;
  };

  const add = (text: string) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean && !blockers.includes(clean)) blockers.push(clean);
  };

  // ── 1. Labelled [To be confirmed — <label>] markers ─────────────────────
  const labeledRe = /\[To be confirmed\s*[\u2014\u2013\-]\s*([^\]<]{2,})\]/gi;
  let m: RegExpExecArray | null;
  while ((m = labeledRe.exec(html)) !== null) {
    add(m[1]);
  }

  // ── 2. Bare [To be confirmed] markers not already accounted for ──────────
  const totalMarkers = (html.match(/\[To be confirmed/gi) || []).length;
  for (let i = blockers.length; i < totalMarkers; i++) {
    add("Unspecified section (no label provided)");
  }

  // ── 3. Open Questions section items ─────────────────────────────────────
  // Match any heading whose visible text contains an "open questions" variant.
  // Heading tag + number is captured so we can find the matching close tag.
  const oqHeadingRe =
    /<h([1-6])[^>]*>([\s\S]*?(?:open\s+questions?|questions?\s+for\s+stakeholders?|pending\s+questions?|unanswered\s+questions?|outstanding\s+(?:items?|questions?))[^<]*)<\/h\1>/gi;

  while ((m = oqHeadingRe.exec(html)) !== null) {
    const level = parseInt(m[1], 10);
    const sectionStart = m.index + m[0].length;

    // Section ends at the next heading of same or higher level (h1..hLevel),
    // or at the end of the document.
    const nextHeadingRe = new RegExp(`<h[1-${level}][\\s>]`, "i");
    const rest = html.slice(sectionStart);
    const nextMatch = nextHeadingRe.exec(rest);
    const sectionHtml = nextMatch ? rest.slice(0, nextMatch.index) : rest;

    // Extract <li> items
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let li: RegExpExecArray | null;
    while ((li = liRe.exec(sectionHtml)) !== null) {
      const text = li[1].replace(/<[^>]+>/g, "");
      if (!shouldIgnoreOpenQuestionsText(text)) add(text);
    }

    // Extract non-empty <p> paragraphs (for when items are not in a list)
    const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let p: RegExpExecArray | null;
    while ((p = pRe.exec(sectionHtml)) !== null) {
      const text = p[1].replace(/<[^>]+>/g, "");
      if (!shouldIgnoreOpenQuestionsText(text)) add(text);
    }
  }

  return blockers;
}
