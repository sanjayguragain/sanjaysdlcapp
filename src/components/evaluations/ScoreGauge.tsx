"use client";

import React from "react";
import { INTERPRETATION_RING_COLORS, type ScoreInterpretation, interpretScore } from "@/types";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const SIZE_MAP = {
  sm: { dimension: 80, strokeWidth: 6, fontSize: "text-lg", labelSize: "text-[10px]" },
  md: { dimension: 120, strokeWidth: 8, fontSize: "text-2xl", labelSize: "text-xs" },
  lg: { dimension: 180, strokeWidth: 10, fontSize: "text-4xl", labelSize: "text-sm" },
};

export function ScoreGauge({ score, size = "md", label }: ScoreGaugeProps) {
  const { dimension, strokeWidth, fontSize, labelSize } = SIZE_MAP[size];
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const offset = circumference * (1 - progress);
  const interpretation = interpretScore(score);
  const colorClass = INTERPRETATION_RING_COLORS[interpretation];

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={dimension} height={dimension} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100"
        />
        {/* Score arc */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClass} transition-all duration-700 ease-out`}
        />
        {/* Center text */}
        <text
          x={dimension / 2}
          y={dimension / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className={`${fontSize} font-bold fill-gray-900 rotate-90`}
          style={{ transformOrigin: "center" }}
        >
          {Math.round(score)}
        </text>
      </svg>
      {label && <span className={`${labelSize} text-gray-500 font-medium`}>{label}</span>}
    </div>
  );
}

export function InterpretationBadge({ interpretation }: { interpretation: ScoreInterpretation }) {
  const colors: Record<ScoreInterpretation, string> = {
    Excellent: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Good: "bg-blue-100 text-blue-700 border-blue-200",
    "Needs Improvement": "bg-amber-100 text-amber-700 border-amber-200",
    "Rework Required": "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${colors[interpretation]}`}>
      {interpretation}
    </span>
  );
}
