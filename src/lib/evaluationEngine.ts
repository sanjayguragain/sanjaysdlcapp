/**
 * evaluationEngine.ts
 *
 * Core evaluation logic:
 * 1. Structure parser — compare headings with expected templates
 * 2. Rule engine — deterministic structural compliance checks
 * 3. Scoring engine — calculate weighted scores
 * 4. Recommendation engine — generate improvement actions
 */
import {
  AiRiskIndicatorItem,
  DocumentType,
  EvaluationCategory,
  EvaluationResult,
  RecommendationItem,
  SCORING_WEIGHTS,
  interpretScore,
} from "@/types";
import { DOCUMENT_TEMPLATES, SectionTemplate } from "./templates";

// ── Heading extraction ──────────────────────────────────────────────────────

interface ExtractedSection {
  heading: string;
  level: number;
  content: string;
}

/** Extract headings and their content from plain text or markdown. */
export function extractSections(text: string): ExtractedSection[] {
  const lines = text.split("\n");
  const sections: ExtractedSection[] = [];
  let currentHeading = "";
  let currentLevel = 0;
  let currentContent: string[] = [];

  for (const line of lines) {
    // Markdown headings: # Heading, ## Heading, etc.
    const mdMatch = line.match(/^(#{1,6})\s+(.+)/);
    // Or all-caps lines that look like section headings
    const capsMatch = !mdMatch && line.match(/^([A-Z][A-Z\s]{3,})$/);

    if (mdMatch || capsMatch) {
      if (currentHeading) {
        sections.push({
          heading: currentHeading,
          level: currentLevel,
          content: currentContent.join("\n").trim(),
        });
      }
      if (mdMatch) {
        currentHeading = mdMatch[2].trim();
        currentLevel = mdMatch[1].length;
      } else if (capsMatch) {
        currentHeading = capsMatch[1].trim();
        currentLevel = 1;
      }
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentHeading) {
    sections.push({
      heading: currentHeading,
      level: currentLevel,
      content: currentContent.join("\n").trim(),
    });
  }

  return sections;
}

// ── Structure analysis ──────────────────────────────────────────────────────

interface StructuralAnalysis {
  presentSections: string[];
  missingSections: string[];
  sectionOrderCorrect: boolean;
  score: number; // 0-100
  recommendations: string[];
}

/** Compare document sections against expected template. */
export function analyzeStructure(
  text: string,
  documentType: DocumentType
): StructuralAnalysis {
  const template = DOCUMENT_TEMPLATES[documentType] || DOCUMENT_TEMPLATES.other;
  const sections = extractSections(text);
  const lowerText = text.toLowerCase();

  const presentSections: string[] = [];
  const missingSections: string[] = [];
  const recommendations: string[] = [];
  const matchedIndices: number[] = [];

  for (const expected of template) {
    const found = expected.patterns.some((p) => p.test(lowerText));
    if (found) {
      presentSections.push(expected.name);
      const idx = template.indexOf(expected);
      matchedIndices.push(idx);
    } else {
      missingSections.push(expected.name);
      if (expected.required) {
        recommendations.push(`Add required section: ${expected.name}`);
      }
    }
  }

  // Check section order
  let sectionOrderCorrect = true;
  for (let i = 1; i < matchedIndices.length; i++) {
    if (matchedIndices[i] < matchedIndices[i - 1]) {
      sectionOrderCorrect = false;
      break;
    }
  }
  if (!sectionOrderCorrect) {
    recommendations.push("Reorder sections to follow the standard template structure");
  }

  // Check for diagrams
  const hasDiagramRef = /diagram|figure|fig\.|image|chart/i.test(text);
  if (!hasDiagramRef && documentType === "sad") {
    recommendations.push("Include architecture diagrams (system context, component, deployment)");
  }

  // Check for glossary
  const hasGlossary = /glossary|definition|terminology/i.test(text);
  if (!hasGlossary) {
    recommendations.push("Add a glossary section for technical terms");
  }

  // Score: required sections have higher weight
  const requiredSections = template.filter((s) => s.required);
  const optionalSections = template.filter((s) => !s.required);

  const requiredFound = requiredSections.filter((s) =>
    s.patterns.some((p) => p.test(lowerText))
  ).length;
  const optionalFound = optionalSections.filter((s) =>
    s.patterns.some((p) => p.test(lowerText))
  ).length;

  const requiredScore = requiredSections.length > 0
    ? (requiredFound / requiredSections.length) * 70
    : 70;
  const optionalScore = optionalSections.length > 0
    ? (optionalFound / optionalSections.length) * 20
    : 20;
  const orderScore = sectionOrderCorrect ? 10 : 0;

  const score = Math.round(requiredScore + optionalScore + orderScore);

  return { presentSections, missingSections, sectionOrderCorrect, score, recommendations };
}

// ── Rule engine — deterministic checks ──────────────────────────────────────

interface RuleEngineResult {
  requirementsQuality: number;
  traceability: number;
  aiSpecificity: number;
  aiRiskIndicators: string[];
  recommendations: string[];
}

/** Run deterministic rule checks on document content. */
export function runRuleEngine(
  text: string,
  documentType: DocumentType
): RuleEngineResult {
  const lowerText = text.toLowerCase();
  const recommendations: string[] = [];
  const aiRiskIndicators: string[] = [];

  // ── Requirements quality checks ──
  let reqScore = 50; // baseline

  // Numbered requirements (FR-1, NFR-2, REQ-1)
  const numberedReqs = (text.match(/\b(FR|NFR|REQ|BR|SR|IR)-\d+/gi) || []).length;
  if (numberedReqs > 0) reqScore += 15;
  else recommendations.push("Use numbered requirement identifiers (e.g., FR-1, NFR-2)");

  // Testable language (shall, must, will)
  const testableCount = (lowerText.match(/\b(shall|must|will)\b/g) || []).length;
  if (testableCount >= 5) reqScore += 10;
  else if (testableCount > 0) reqScore += 5;
  else recommendations.push("Use testable requirement language (shall, must, will)");

  // Measurable metrics
  const hasMetrics = /\b\d+\s*(%|ms|seconds?|minutes?|hours?|mb|gb|users?|requests?|concurrent)\b/i.test(text);
  if (hasMetrics) reqScore += 10;
  else recommendations.push("Add measurable metrics to requirements (response times, throughput, etc.)");

  // Acceptance criteria
  const hasAcceptance = /acceptance\s*criter|given\s*.*when\s*.*then/i.test(text);
  if (hasAcceptance) reqScore += 15;
  else if (documentType === "prd" || documentType === "srs") {
    recommendations.push("Define acceptance criteria for key requirements");
  }

  reqScore = Math.min(100, reqScore);

  // ── Traceability checks ──
  let traceScore = 30; // baseline

  const hasTraceMatrix = /traceability|trace\s*matrix/i.test(text);
  if (hasTraceMatrix) traceScore += 30;
  else recommendations.push("Add a traceability matrix linking business goals to requirements");

  const hasGoalLinkage = /business\s*goal.*requirement|requirement.*business\s*goal|maps?\s*to|traces?\s*to/i.test(text);
  if (hasGoalLinkage) traceScore += 20;

  const hasDecisionRationale = /decision\s*rationale|rationale|reasoning|justification/i.test(text);
  if (hasDecisionRationale) traceScore += 20;
  else if (documentType === "sad") {
    recommendations.push("Document architecture decision rationale");
  }

  traceScore = Math.min(100, traceScore);

  // ── AI risk indicators ──
  let aiScore = 70; // start optimistic

  // Generic statements
  const genericPhrases = [
    /\bstate.of.the.art\b/i,
    /\brobust\s+and\s+scalable\b/i,
    /\bseamless\s+integration\b/i,
    /\bleverag(e|ing)\s+(the\s+)?(latest|cutting.edge|modern)/i,
    /\bworld.class\b/i,
    /\bhighly\s+scalable\b/i,
    /\bindustry.leading\b/i,
    /\bnext.generation\b/i,
  ];
  const genericCount = genericPhrases.filter((p) => p.test(text)).length;
  if (genericCount > 0) {
    aiScore -= genericCount * 10;
    aiRiskIndicators.push(`${genericCount} generic/marketing statement(s) detected without implementation detail`);
  }

  // Unrealistic scalability
  if (/\b(infinite|unlimited|zero\s*latency|100%\s*uptime)\b/i.test(text)) {
    aiScore -= 15;
    aiRiskIndicators.push("Unrealistic scalability or availability claims detected");
  }

  // Missing constraints
  const hasConstraints = /constraint|limitation|trade.off|not\s*support/i.test(text);
  if (!hasConstraints) {
    aiScore -= 10;
    aiRiskIndicators.push("No constraints or limitations documented — common AI omission");
    recommendations.push("Document system constraints and trade-offs");
  }

  // Missing decision rationale (specific check for SAD)
  if (documentType === "sad" && !hasDecisionRationale) {
    aiScore -= 10;
    aiRiskIndicators.push("Architecture decision rationale missing — may indicate AI-generated content");
  }

  // Specificity: does document contain concrete technology names, versions, etc.?
  const hasTechSpecifics = /\b(v\d+\.\d+|version\s*\d|postgresql|mysql|redis|kafka|kubernetes|docker|aws|azure|gcp|react|angular|vue|node\.?js|python|java|\.net)\b/i.test(text);
  if (hasTechSpecifics) aiScore += 10;
  else {
    aiRiskIndicators.push("No specific technology references — content may be generic");
  }

  // Content length as specificity proxy
  if (text.length < 1000) {
    aiScore -= 15;
    aiRiskIndicators.push("Document is very short — likely lacks sufficient detail");
  } else if (text.length > 5000) {
    aiScore += 10;
  }

  aiScore = Math.max(0, Math.min(100, aiScore));

  return { requirementsQuality: reqScore, traceability: traceScore, aiSpecificity: aiScore, aiRiskIndicators, recommendations };
}

// ── Scoring engine ──────────────────────────────────────────────────────────

export interface CategoryScores {
  structure: number;
  requirements_quality: number;
  architecture_completeness: number;
  traceability: number;
  security: number;
  operational_readiness: number;
  ai_specificity: number;
}

/** Calculate the weighted overall score. */
export function calculateOverallScore(categories: CategoryScores): number {
  let total = 0;
  for (const [cat, weight] of Object.entries(SCORING_WEIGHTS)) {
    const key = cat as EvaluationCategory;
    total += (categories[key] ?? 0) * weight;
  }
  return Math.round(Math.max(0, Math.min(100, total)));
}

// ── Full evaluation (deterministic portion) ─────────────────────────────────

export interface DeterministicEvaluation {
  structuralAnalysis: StructuralAnalysis;
  ruleEngineResult: RuleEngineResult;
  partialScores: {
    structure: number;
    requirements_quality: number;
    traceability: number;
    ai_specificity: number;
  };
  allRecommendations: string[];
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function inferRecommendationSections(
  recommendation: string,
  documentType: DocumentType
): string[] {
  const rec = recommendation.toLowerCase();
  const template = DOCUMENT_TEMPLATES[documentType] || DOCUMENT_TEMPLATES.other;
  const matchedFromTemplate = template
    .filter((s) => s.patterns.some((p) => p.test(rec)) || rec.includes(s.name.toLowerCase()))
    .map((s) => s.name);

  const sections: string[] = [...matchedFromTemplate];

  // Heuristic mapping for cross-cutting recommendations.
  if (/numbered requirement|fr-|nfr-|atomic/.test(rec)) {
    sections.push("Functional Requirements", "Non-Functional Requirements");
  }
  if (/acceptance criteria|given\s+.*when\s+.*then/.test(rec)) {
    sections.push("Acceptance Criteria", "User Stories");
  }
  if (/traceability matrix|traceability/.test(rec)) {
    sections.push("Traceability Matrix");
  }
  if (/measurable metrics|throughput|response time|latency|slo|sla|kpi/.test(rec)) {
    sections.push("Non-Functional Requirements", "Success Metrics");
  }
  if (/glossary|terminology|definition/.test(rec)) {
    sections.push("Glossary");
  }
  if (/security|threat|mitigation|control/.test(rec)) {
    sections.push("Security Architecture", "Security Requirements");
  }
  if (/operational|monitoring|alerting|observability|deployment|rollback/.test(rec)) {
    sections.push("Operational Design", "Deployment Architecture");
  }
  if (/decision rationale|adr|architecture decision/.test(rec)) {
    sections.push("Architecture Decision Records", "Component Architecture");
  }
  if (/constraint|trade-off|limitation/.test(rec)) {
    sections.push("Assumptions and Constraints", "Design Constraints");
  }

  if (sections.length === 0) {
    sections.push("General");
  }

  return dedupeStrings(sections);
}

function toRecommendationItems(
  recommendations: string[],
  documentType: DocumentType
): RecommendationItem[] {
  return dedupeStrings(recommendations).map((text) => ({
    text,
    sections: inferRecommendationSections(text, documentType),
  }));
}

function inferAiRiskSections(indicator: string, documentType: DocumentType): string[] {
  const text = indicator.toLowerCase();
  const sections: string[] = [];

  if (/generic|marketing|technology references|specific technology/.test(text)) {
    sections.push("Component Architecture", "Integration Architecture", "Functional Requirements");
  }
  if (/unrealistic scalability|availability|uptime|zero latency/.test(text)) {
    sections.push("Non-Functional Requirements", "Operational Design", "Deployment Architecture");
  }
  if (/constraints|limitations|trade-offs/.test(text)) {
    sections.push("Assumptions and Constraints", "Design Constraints");
  }
  if (/decision rationale|architecture decision/.test(text)) {
    sections.push("Architecture Decision Records", "Component Architecture");
  }
  if (/very short|lacks sufficient detail/.test(text)) {
    sections.push("Executive Summary", "Functional Requirements", "Non-Functional Requirements");
  }

  // Try to map against template section names as a fallback.
  const template = DOCUMENT_TEMPLATES[documentType] || DOCUMENT_TEMPLATES.other;
  const fromTemplate = template
    .filter((s) => text.includes(s.name.toLowerCase()))
    .map((s) => s.name);
  sections.push(...fromTemplate);

  if (sections.length === 0) {
    sections.push("General");
  }

  return dedupeStrings(sections);
}

function toAiRiskIndicatorItems(
  indicators: string[],
  documentType: DocumentType
): AiRiskIndicatorItem[] {
  return dedupeStrings(indicators).map((text) => ({
    text,
    sections: inferAiRiskSections(text, documentType),
  }));
}

/** Run the deterministic portion of evaluation (no LLM call). */
export function runDeterministicEvaluation(
  text: string,
  documentType: DocumentType
): DeterministicEvaluation {
  const structuralAnalysis = analyzeStructure(text, documentType);
  const ruleEngineResult = runRuleEngine(text, documentType);

  const allRecommendations = [
    ...structuralAnalysis.recommendations,
    ...ruleEngineResult.recommendations,
  ];

  return {
    structuralAnalysis,
    ruleEngineResult,
    partialScores: {
      structure: structuralAnalysis.score,
      requirements_quality: ruleEngineResult.requirementsQuality,
      traceability: ruleEngineResult.traceability,
      ai_specificity: ruleEngineResult.aiSpecificity,
    },
    allRecommendations,
  };
}

/** Build the final EvaluationResult by merging deterministic + LLM scores. */
export function buildEvaluationResult(
  documentType: DocumentType,
  deterministicEval: DeterministicEvaluation,
  llmScores: {
    architecture_completeness: number;
    security: number;
    operational_readiness: number;
    llmRecommendations: string[];
  }
): EvaluationResult {
  const categoryScores: Record<EvaluationCategory, number> = {
    structure: deterministicEval.partialScores.structure,
    requirements_quality: deterministicEval.partialScores.requirements_quality,
    architecture_completeness: llmScores.architecture_completeness,
    traceability: deterministicEval.partialScores.traceability,
    security: llmScores.security,
    operational_readiness: llmScores.operational_readiness,
    ai_specificity: deterministicEval.partialScores.ai_specificity,
  };

  const overallScore = calculateOverallScore(categoryScores);

  // Deduplicate recommendations
  const allRecs = [
    ...deterministicEval.allRecommendations,
    ...llmScores.llmRecommendations,
  ];
  const recommendationItems = toRecommendationItems(allRecs, documentType);
  const aiRiskIndicatorItems = toAiRiskIndicatorItems(
    deterministicEval.ruleEngineResult.aiRiskIndicators,
    documentType
  );

  return {
    artifact_type: documentType,
    overall_score: overallScore,
    interpretation: interpretScore(overallScore),
    category_scores: categoryScores,
    recommendations: recommendationItems,
    structural_analysis: {
      present_sections: deterministicEval.structuralAnalysis.presentSections,
      missing_sections: deterministicEval.structuralAnalysis.missingSections,
      section_order_correct: deterministicEval.structuralAnalysis.sectionOrderCorrect,
    },
    ai_risk_indicators: aiRiskIndicatorItems,
  };
}
