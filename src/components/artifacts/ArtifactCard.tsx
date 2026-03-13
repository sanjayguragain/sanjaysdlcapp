"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { ArtifactType, ArtifactStatus, ARTIFACT_DEFINITIONS, STATUS_COLORS, STATUS_LABELS } from "@/types";

interface ArtifactCardProps {
  id: string;
  type: ArtifactType;
  title: string;
  status: ArtifactStatus;
  confidenceScore: number | null;
  version: number;
  updatedAt: string;
  onClick?: () => void;
}

export function ArtifactCard({
  type,
  title,
  status,
  confidenceScore,
  version,
  updatedAt,
  onClick,
}: ArtifactCardProps) {
  const def = ARTIFACT_DEFINITIONS.find((d) => d.type === type);
  const statusColor = STATUS_COLORS[status] || "bg-gray-100 text-gray-700";
  const statusLabel = STATUS_LABELS[status] || status;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <Badge className={statusColor}>{statusLabel}</Badge>
        </div>
        <span className="text-xs text-gray-400">v{version}</span>
      </div>

      <h3 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">
        {title}
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        {def?.description || "SDLC artifact"}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {def && (
            <span className="text-xs text-gray-400">
              Owner: {def.owner}
            </span>
          )}
        </div>
        {confidenceScore !== null && (
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                style={{ width: `${confidenceScore}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{confidenceScore}%</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span>
          Updated {new Date(updatedAt).toLocaleDateString()}
        </span>
        <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
