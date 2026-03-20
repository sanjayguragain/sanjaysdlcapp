"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { ScoreGauge } from "@/components/evaluations/ScoreGauge";
import { CATEGORY_LABELS } from "@/types";

interface AnalyticsData {
  total: number;
  avgScore: number;
  distribution: { excellent: number; good: number; needsImprovement: number; reworkRequired: number };
  avgByCategory: Record<string, number> | null;
  byDocType: { artifactType: string; count: number; avgScore: number }[];
  commonIssues: { recommendation: string; count: number }[];
  scoreTrend: { date: string; score: number; documentName: string }[];
}

export default function EvalAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/evaluations/analytics")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="p-8">
        <Header title="Eval Analytics" subtitle="Quality evaluation insights and trends" />
        <div className="mt-12 text-center text-gray-500">
          <div className="text-4xl mb-4">📊</div>
          <p className="font-medium">No evaluations yet</p>
          <p className="text-sm mt-1">Evaluate some artifacts to see analytics.</p>
        </div>
      </div>
    );
  }

  const { total, avgScore, distribution, avgByCategory, byDocType, commonIssues, scoreTrend } = data;
  const maxDocCount = Math.max(...byDocType.map((d) => d.count), 1);

  return (
    <div className="p-8">
      <Header title="Eval Analytics" subtitle="Quality evaluation insights and trends" />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6 mb-8">
        <MetricCard label="Total Evaluations" value={total} color="bg-edison-blue-50 text-edison-blue-600" />
        <MetricCard label="Avg Score" value={avgScore.toFixed(1)} color="bg-edison-50 text-edison-600" />
        <MetricCard label="Excellent" value={distribution.excellent} color="bg-emerald-50 text-emerald-600" />
        <MetricCard label="Good" value={distribution.good} color="bg-blue-50 text-blue-600" />
        <MetricCard label="Needs Work" value={distribution.needsImprovement + distribution.reworkRequired} color="bg-amber-50 text-amber-600" />
      </div>

      {/* Average Score Gauge + Score by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Overall Average</h3>
          <ScoreGauge score={avgScore} size="lg" label="Average Score" />
        </div>

        {avgByCategory && (
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Average Score by Category</h3>
            <div className="space-y-3">
              {Object.entries(avgByCategory).map(([cat, score]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>{(CATEGORY_LABELS as Record<string, string>)[cat] ?? cat}</span>
                    <span className="font-medium">{score.toFixed(1)}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* By Document Type + Common Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">By Document Type</h3>
          <div className="space-y-3">
            {byDocType.map((d) => (
              <div key={d.artifactType}>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span className="capitalize">{d.artifactType.replace(/_/g, " ")}</span>
                  <span className="font-medium">{d.count} (avg: {d.avgScore})</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-edison-500 rounded-full transition-all duration-500"
                    style={{ width: `${(d.count / maxDocCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Recurring Issues</h3>
          {commonIssues.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No patterns detected yet</p>
          ) : (
            <div className="space-y-2">
              {commonIssues.slice(0, 8).map((issue, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="shrink-0 text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full mt-0.5">
                    {issue.count}x
                  </span>
                  <p className="text-sm text-gray-700">{issue.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Score Trend */}
      {scoreTrend.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Score Trend (Recent)</h3>
          <div className="flex items-end gap-1 h-32">
            {scoreTrend.map((d, i) => {
              const h = (d.score / 100) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                    <div
                      className={`w-full rounded-t ${
                        d.score >= 80 ? "bg-emerald-400" : d.score >= 60 ? "bg-amber-400" : "bg-red-400"
                      }`}
                      style={{ height: `${h}%` }}
                      title={`${d.documentName}: ${d.score.toFixed(1)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
