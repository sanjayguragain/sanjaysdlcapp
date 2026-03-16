// Types for the SDLC Platform

export type UserRole =
  | "Administrator"
  | "Product Manager"
  | "Security Lead"
  | "Compliance Officer"
  | "QA Lead"
  | "Infrastructure Lead"
  | "Engineering Team"
  | "Executive Stakeholder";

export type ArtifactType =
  | "prd"
  | "prd_validation"
  | "preliminary_estimation"
  | "cyber_risk_analysis"
  | "compliance_report"
  | "revised_estimation"
  | "test_plan"
  | "quality_review"
  | "deployment_plan";

export type ArtifactStatus =
  | "not_started"
  | "in_progress"
  | "awaiting_approval"
  | "approved"
  | "blocked"
  | "rejected"
  | "completed";

export type ProjectPhase =
  | "PRD Generation"
  | "Clarification"
  | "PRD Approval"
  | "Parallel Reviews"
  | "Revised Estimation"
  | "QA Phase"
  | "Build Phase"
  | "Deployment Phase";

export interface ArtifactDefinition {
  type: ArtifactType;
  label: string;
  owner: string;
  approver: string;
  description: string;
  phase: ProjectPhase;
  dependencies: ArtifactType[];
}

export const ARTIFACT_DEFINITIONS: ArtifactDefinition[] = [
  {
    type: "prd",
    label: "Product Requirements Document",
    owner: "Product Manager",
    approver: "Product Leadership",
    description: "Functional and business requirements",
    phase: "PRD Generation",
    dependencies: [],
  },
  {
    type: "prd_validation",
    label: "PRD Validation Report",
    owner: "Product Manager",
    approver: "Product Manager",
    description: "Requirement clarity and completeness analysis",
    phase: "Clarification",
    dependencies: ["prd"],
  },
  {
    type: "preliminary_estimation",
    label: "Preliminary Estimation",
    owner: "Product Manager",
    approver: "Product Manager",
    description: "Initial effort and schedule estimate",
    phase: "Clarification",
    dependencies: ["prd"],
  },
  {
    type: "cyber_risk_analysis",
    label: "Cyber Risk Analysis",
    owner: "Security Lead",
    approver: "Security",
    description: "Threat model and mitigation plan",
    phase: "Parallel Reviews",
    dependencies: ["prd"],
  },
  {
    type: "compliance_report",
    label: "Compliance Report",
    owner: "Compliance Officer",
    approver: "Compliance",
    description: "Regulatory assessment",
    phase: "Parallel Reviews",
    dependencies: ["prd"],
  },
  {
    type: "revised_estimation",
    label: "Revised Estimation",
    owner: "Product Manager",
    approver: "Product Manager",
    description: "Updated estimate with risk and compliance impact",
    phase: "Revised Estimation",
    dependencies: ["cyber_risk_analysis", "compliance_report", "preliminary_estimation"],
  },
  {
    type: "test_plan",
    label: "Test Plan",
    owner: "QA Lead",
    approver: "QA",
    description: "Testing strategy and coverage",
    phase: "QA Phase",
    dependencies: ["prd", "revised_estimation"],
  },
  {
    type: "quality_review",
    label: "Quality Review",
    owner: "QA Lead",
    approver: "QA",
    description: "Release readiness review",
    phase: "QA Phase",
    dependencies: ["test_plan"],
  },
  {
    type: "deployment_plan",
    label: "Deployment Plan",
    owner: "Infrastructure Lead",
    approver: "Infrastructure",
    description: "Deployment strategy and environment readiness",
    phase: "Deployment Phase",
    dependencies: ["quality_review"],
  },
];

export const STATUS_COLORS: Record<ArtifactStatus, string> = {
  not_started: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  awaiting_approval: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-600",
  completed: "bg-emerald-100 text-emerald-700",
};

export const STATUS_LABELS: Record<ArtifactStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  awaiting_approval: "Awaiting Approval",
  approved: "Approved",
  blocked: "Blocked",
  rejected: "Rejected",
  completed: "Completed",
};

// ─── Quality Evaluator Types ─────────────────────────────────────────────────

export type DocumentType =
  | "vision_document"
  | "prd"
  | "srs"
  | "sad"
  | "other";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  vision_document: "Vision Document",
  prd: "Product Requirements Document",
  srs: "System Requirements Specification",
  sad: "Solution Architecture Document",
  other: "Other",
};

export type ScoreInterpretation =
  | "Excellent"
  | "Good"
  | "Needs Improvement"
  | "Rework Required";

export function interpretScore(score: number): ScoreInterpretation {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Needs Improvement";
  return "Rework Required";
}

export const INTERPRETATION_COLORS: Record<ScoreInterpretation, string> = {
  Excellent: "bg-emerald-100 text-emerald-700",
  Good: "bg-blue-100 text-blue-700",
  "Needs Improvement": "bg-amber-100 text-amber-700",
  "Rework Required": "bg-red-100 text-red-700",
};

export const INTERPRETATION_RING_COLORS: Record<ScoreInterpretation, string> = {
  Excellent: "stroke-emerald-500",
  Good: "stroke-blue-500",
  "Needs Improvement": "stroke-amber-500",
  "Rework Required": "stroke-red-500",
};

export type EvaluationCategory =
  | "structure"
  | "requirements_quality"
  | "architecture_completeness"
  | "traceability"
  | "security"
  | "operational_readiness"
  | "ai_specificity";

export const CATEGORY_LABELS: Record<EvaluationCategory, string> = {
  structure: "Structure Completeness",
  requirements_quality: "Requirements Quality",
  architecture_completeness: "Architecture Completeness",
  traceability: "Traceability",
  security: "Security Coverage",
  operational_readiness: "Operational Readiness",
  ai_specificity: "AI Specificity Score",
};

export const CATEGORY_DESCRIPTIONS: Record<EvaluationCategory, string> = {
  structure: "Required sections exist, follow correct order, headings present, diagrams referenced",
  requirements_quality: "Requirements are atomic, testable, precise, and complete",
  architecture_completeness: "System context, components, data flows, integration points documented",
  traceability: "Business goals linked to requirements and architecture decisions",
  security: "Security controls and threat considerations documented",
  operational_readiness: "Monitoring, deployment, reliability design documented",
  ai_specificity: "Content is specific and implementation-detailed rather than generic AI output",
};

export const SCORING_WEIGHTS: Record<EvaluationCategory, number> = {
  structure: 0.20,
  requirements_quality: 0.20,
  architecture_completeness: 0.20,
  traceability: 0.15,
  security: 0.10,
  operational_readiness: 0.10,
  ai_specificity: 0.05,
};

export interface RecommendationItem {
  text: string;
  sections: string[];
}

export interface AiRiskIndicatorItem {
  text: string;
  sections: string[];
}

export interface EvaluationResult {
  artifact_type: string;
  overall_score: number;
  interpretation: ScoreInterpretation;
  category_scores: Record<EvaluationCategory, number>;
  recommendations: RecommendationItem[];
  structural_analysis: {
    present_sections: string[];
    missing_sections: string[];
    section_order_correct: boolean;
  };
  ai_risk_indicators: AiRiskIndicatorItem[];
}

export const STRUCTURAL_QUALITY_SCALE: Record<number, string> = {
  1: "Poor",
  2: "Weak",
  3: "Acceptable",
  4: "Strong",
  5: "Excellent",
};
