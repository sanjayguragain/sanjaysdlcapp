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
