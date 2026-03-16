"use client";

import React from "react";
import Link from "next/link";
import { DOCUMENT_TYPE_LABELS, interpretScore, INTERPRETATION_COLORS, type DocumentType } from "@/types";

interface EvaluationCardProps {
  id: string;
  documentName: string;
  artifactType: string;
  overallScore: number;
  createdAt: string;
}

export function EvaluationCard({ id, documentName, artifactType, overallScore, createdAt }: EvaluationCardProps) {
  const interpretation = interpretScore(overallScore);
  const colorClass = INTERPRETATION_COLORS[interpretation];
  const typeLabel = DOCUMENT_TYPE_LABELS[artifactType as DocumentType] || artifactType;

  const scoreColor = overallScore >= 90
    ? "text-emerald-600"
    : overallScore >= 75
    ? "text-blue-600"
    : overallScore >= 60
    ? "text-amber-600"
    : "text-red-600";

  return (
    <Link href={`/evaluations/${id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{documentName}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{typeLabel}</p>
          </div>
          <div className="flex flex-col items-end ml-3">
            <span className={`text-2xl font-bold ${scoreColor}`}>{Math.round(overallScore)}</span>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${colorClass}`}>
              {interpretation}
            </span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
          <span>{new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          <span className="text-indigo-500 font-medium">View Report →</span>
        </div>
      </div>
    </Link>
  );
}
