"use client";

import React from "react";
import { ARTIFACT_DEFINITIONS, STATUS_COLORS, STATUS_LABELS, ArtifactStatus } from "@/types";
import { Badge } from "@/components/ui/Badge";

interface ArtifactState {
  type: string;
  status: ArtifactStatus;
  title: string;
  id?: string;
}

interface ProgressTrackerProps {
  artifacts: ArtifactState[];
  sdlcMode?: "modern" | "traditional";
  onArtifactClick?: (type: string) => void;
}

const MODERN_PHASES = [
  { name: "PRD Generation", types: ["prd"] },
  { name: "Clarification", types: ["prd_validation", "preliminary_estimation"] },
  { name: "Parallel Reviews", types: ["cyber_risk_analysis", "compliance_report"] },
  { name: "Revised Estimation", types: ["revised_estimation"] },
  { name: "QA Phase", types: ["test_plan", "quality_review"] },
  { name: "Deployment", types: ["deployment_plan"] },
];

const TRADITIONAL_PHASES = [
  { name: "Business Definition", types: ["brd"] },
  { name: "Architecture Vision", types: ["avd"] },
  { name: "Requirements Engineering", types: ["srs"] },
  { name: "Solution Architecture", types: ["sad"] },
  { name: "Engineering Specification", types: ["ses"] },
];

const TRADITIONAL_LABELS: Record<string, { label: string; owner: string }> = {
  brd: { label: "Business Requirements Document", owner: "Business Analyst" },
  avd: { label: "Architecture Vision Document", owner: "Enterprise Architect" },
  srs: { label: "System Requirements Specification", owner: "Systems Analyst" },
  sad: { label: "Solution Architecture Definition", owner: "Solution Architect" },
  ses: { label: "System Engineering Specification", owner: "Engineering Lead" },
};

export function ProgressTracker({ artifacts, sdlcMode = "modern", onArtifactClick }: ProgressTrackerProps) {
  const artifactMap = new Map(artifacts.map((a) => [a.type, a]));
  const phases = sdlcMode === "traditional" ? TRADITIONAL_PHASES : MODERN_PHASES;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Project Progress
      </h2>

      <div className="space-y-6">
        {phases.map((phase, phaseIndex) => (
          <div key={phase.name} className="relative">
            {/* Phase connector */}
            {phaseIndex < phases.length - 1 && (
              <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200" style={{ height: "calc(100% + 1.5rem)" }} />
            )}

            {/* Phase header */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  phase.types.every(
                    (t) =>
                      artifactMap.get(t)?.status === "approved" ||
                      artifactMap.get(t)?.status === "completed"
                  )
                    ? "bg-emerald-100 text-emerald-700"
                    : phase.types.some(
                        (t) =>
                          artifactMap.get(t)?.status === "in_progress" ||
                          artifactMap.get(t)?.status === "awaiting_approval"
                      )
                    ? "bg-edison-100 text-edison-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {phaseIndex + 1}
              </div>
              <h3 className="font-medium text-gray-900 text-sm">
                {phase.name}
              </h3>
            </div>

            {/* Artifacts in phase */}
            <div className="ml-11 space-y-2">
              {phase.types.map((type) => {
                const artifact = artifactMap.get(type);
                const definition = ARTIFACT_DEFINITIONS.find(
                  (d) => d.type === type
                );
                const traditionalDef = TRADITIONAL_LABELS[type];
                const status = (artifact?.status || "not_started") as ArtifactStatus;
                const label = sdlcMode === "traditional"
                  ? (traditionalDef?.label ?? artifact?.title ?? type)
                  : (definition?.label || type);
                const owner = sdlcMode === "traditional"
                  ? (traditionalDef?.owner ?? "Traditional SDLC")
                  : (definition?.owner ?? "");

                return (
                  <button
                    key={type}
                    onClick={() => onArtifactClick?.(type)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-edison-200 hover:bg-edison-50/50 transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {owner}
                      </p>
                    </div>
                    <Badge className={STATUS_COLORS[status]}>
                      {STATUS_LABELS[status]}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
