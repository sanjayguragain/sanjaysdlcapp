"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";

interface ProjectCardProps {
  name: string;
  description?: string | null;
  phase: string;
  artifactCount: number;
  sdlcMode?: "modern" | "traditional" | null;
  createdAt?: string;
  awaitingApproval?: number;
}

export function ProjectCard({
  name,
  description,
  phase,
  artifactCount,
  sdlcMode,
  createdAt,
  awaitingApproval,
}: ProjectCardProps) {
  const totalArtifacts = sdlcMode === "traditional" ? 5 : 9;
  const progress = Math.round((Math.min(artifactCount, totalArtifacts) / totalArtifacts) * 100);
  const isTraditional = sdlcMode === "traditional";

  // Color scheme based on SDLC mode
  const borderColor = isTraditional ? "border-red-300" : "border-green-300";
  const bgColor = isTraditional ? "bg-red-50" : "bg-green-50";
  const hoverBorderColor = isTraditional ? "hover:border-red-400" : "hover:border-green-400";
  const progressColor = isTraditional ? "bg-red-600" : "bg-green-600";
  const titleHoverColor = isTraditional ? "group-hover:text-red-600" : "group-hover:text-green-600";

  return (
    <div className={`block rounded-xl border ${borderColor} ${bgColor} p-6 hover:shadow-lg ${hoverBorderColor} transition-all group`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-semibold text-gray-900 ${titleHoverColor} transition-colors truncate`}>
            {name}
          </h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
          <Badge className="bg-indigo-100 text-indigo-700">
            {phase}
          </Badge>
          <Badge className={isTraditional ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
            {isTraditional ? "Traditional SDLC" : "Modern SDLC"}
          </Badge>
          {awaitingApproval !== undefined && awaitingApproval > 0 && (
            <Badge className="bg-amber-100 text-amber-700">
              {awaitingApproval} pending
            </Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>
            {artifactCount} of {totalArtifacts} artifacts
          </span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${progressColor} rounded-full transition-all duration-500`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {createdAt && (
        <div className="mt-4 text-xs text-gray-400">
          Created {new Date(createdAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
