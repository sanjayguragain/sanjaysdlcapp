"use client";

import React from "react";
import { CATEGORY_LABELS, CATEGORY_DESCRIPTIONS, SCORING_WEIGHTS, type EvaluationCategory } from "@/types";

interface CategoryScoresProps {
  scores: Record<EvaluationCategory, number>;
}

function scoreColor(score: number): string {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 75) return "bg-blue-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function scoreTextColor(score: number): string {
  if (score >= 90) return "text-emerald-700";
  if (score >= 75) return "text-blue-700";
  if (score >= 60) return "text-amber-700";
  return "text-red-700";
}

export function CategoryScores({ scores }: CategoryScoresProps) {
  const categories = Object.keys(CATEGORY_LABELS) as EvaluationCategory[];

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const score = scores[cat] ?? 0;
        const weight = SCORING_WEIGHTS[cat];

        return (
          <div key={cat} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">{CATEGORY_LABELS[cat]}</span>
                <span className="text-[10px] text-gray-400 font-mono">{Math.round(weight * 100)}%</span>
              </div>
              <span className={`text-sm font-bold ${scoreTextColor(score)}`}>{Math.round(score)}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreColor(score)}`}
                style={{ width: `${Math.max(2, score)}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {CATEGORY_DESCRIPTIONS[cat]}
            </p>
          </div>
        );
      })}
    </div>
  );
}
