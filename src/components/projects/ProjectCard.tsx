"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";

interface ProjectCardProps {
  name: string;
  description?: string | null;
  phase: string;
  artifactCount: number;
  createdAt?: string;
  awaitingApproval?: number;
}

export function ProjectCard({
  name,
  description,
  phase,
  artifactCount,
  createdAt,
  awaitingApproval,
}: ProjectCardProps) {
  const progress = Math.round((artifactCount / 9) * 100);

  return (
    <div className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
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
            {artifactCount} of 9 artifacts
          </span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
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
