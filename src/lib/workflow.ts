import { ArtifactType, ARTIFACT_DEFINITIONS, ArtifactStatus } from "@/types";

interface ArtifactState {
  type: ArtifactType;
  status: ArtifactStatus;
}

export function getNextPhaseArtifacts(
  currentArtifacts: ArtifactState[]
): ArtifactType[] {
  const completedTypes = new Set(
    currentArtifacts
      .filter((a) => a.status === "approved" || a.status === "completed")
      .map((a) => a.type)
  );

  return ARTIFACT_DEFINITIONS.filter((def) => {
    const alreadyExists = currentArtifacts.some((a) => a.type === def.type);
    if (alreadyExists) return false;

    return def.dependencies.every((dep) => completedTypes.has(dep));
  }).map((def) => def.type);
}

export function getProjectPhase(artifacts: ArtifactState[]): string {
  const statusMap = new Map(artifacts.map((a) => [a.type, a.status]));

  if (!statusMap.has("prd") || statusMap.get("prd") === "not_started") {
    return "PRD Generation";
  }
  if (statusMap.get("prd") === "in_progress") {
    return "PRD Generation";
  }
  if (statusMap.get("prd") === "awaiting_approval") {
    return "PRD Approval";
  }

  const parallelTypes: ArtifactType[] = [
    "cyber_risk_analysis",
    "compliance_report",
    "preliminary_estimation",
  ];
  const parallelDone = parallelTypes.every(
    (t) =>
      statusMap.get(t) === "approved" || statusMap.get(t) === "completed"
  );

  if (!parallelDone) {
    return "Parallel Reviews";
  }

  if (
    statusMap.get("revised_estimation") !== "approved" &&
    statusMap.get("revised_estimation") !== "completed"
  ) {
    return "Revised Estimation";
  }

  if (
    statusMap.get("test_plan") !== "approved" &&
    statusMap.get("quality_review") !== "approved"
  ) {
    return "QA Phase";
  }

  if (statusMap.get("deployment_plan") !== "approved") {
    return "Deployment Phase";
  }

  return "Completed";
}

export function calculateProjectProgress(artifacts: ArtifactState[]): number {
  if (artifacts.length === 0) return 0;

  const weights: Record<ArtifactStatus, number> = {
    not_started: 0,
    in_progress: 0.3,
    awaiting_approval: 0.7,
    approved: 1,
    blocked: 0.2,
    rejected: 0.1,
    completed: 1,
  };

  const totalPossible = ARTIFACT_DEFINITIONS.length;
  const completedWeight = artifacts.reduce(
    (sum, a) => sum + (weights[a.status] || 0),
    0
  );

  return Math.round((completedWeight / totalPossible) * 100);
}
