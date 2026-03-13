"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";

interface AnalyticsData {
  totals: {
    totalArtifacts: number;
    approvedArtifacts: number;
    rejectedArtifacts: number;
    awaitingArtifacts: number;
  };
  rates: {
    approvalRate: number | null;
    rejectionRate: number | null;
    avgConfidence: number | null;
    avgRevisions: number;
  };
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  topRevised: {
    artifactId: string;
    revisions: number;
    title: string;
    type: string;
    projectName: string;
  }[];
  approvalTrend: { date: string; approved: number; rejected: number }[];
}

function pct(val: number | null): string {
  if (val === null) return "—";
  return `${Math.round(val * 100)}%`;
}

function statusColor(status: string) {
  switch (status) {
    case "approved": return "bg-green-500";
    case "rejected": return "bg-red-500";
    case "awaiting_approval": return "bg-amber-500";
    case "generated": return "bg-blue-500";
    default: return "bg-gray-400";
  }
}

function confColor(score: number | null) {
  if (score === null) return "bg-gray-300";
  if (score >= 0.8) return "from-green-400 to-green-500";
  if (score >= 0.6) return "from-amber-400 to-amber-500";
  return "from-red-400 to-red-500";
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) setData(await res.json());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
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

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500">Failed to load analytics.</div>
    );
  }

  const { totals, rates, byType, byStatus, topRevised, approvalTrend } = data;
  const maxByType = Math.max(...byType.map((t) => t.count), 1);
  const trendMax = Math.max(...approvalTrend.map((d) => d.approved + d.rejected), 1);

  return (
    <div className="p-8">
      <Header
        title="Analytics"
        subtitle="AI generation quality, approval metrics, and usage insights"
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-8">
        <MetricCard
          label="Total Artifacts"
          value={totals.totalArtifacts}
          color="bg-indigo-50 text-indigo-600"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <MetricCard
          label="Approval Rate"
          value={pct(rates.approvalRate)}
          color="bg-green-50 text-green-600"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Rejection Rate"
          value={pct(rates.rejectionRate)}
          color="bg-red-50 text-red-600"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Avg AI Confidence"
          value={pct(rates.avgConfidence)}
          color="bg-violet-50 text-violet-600"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        />
      </div>

      {/* Second KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Approved"
          value={totals.approvedArtifacts}
          color="bg-green-50 text-green-600"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <MetricCard
          label="Rejected"
          value={totals.rejectedArtifacts}
          color="bg-red-50 text-red-600"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
        />
        <MetricCard
          label="Awaiting Approval"
          value={totals.awaitingArtifacts}
          color="bg-amber-50 text-amber-600"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Avg Revisions"
          value={rates.avgRevisions.toFixed(1)}
          color="bg-blue-50 text-blue-600"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Artifacts by type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Artifacts by Type</h3>
          {byType.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No artifacts yet</p>
          ) : (
            <div className="space-y-3">
              {byType.map((t) => (
                <div key={t.type}>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span className="capitalize">{t.type.replace(/_/g, " ")}</span>
                    <span className="font-medium">{t.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${(t.count / maxByType) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Artifacts by status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Artifacts by Status</h3>
          {byStatus.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No artifacts yet</p>
          ) : (
            <>
              {/* Stacked bar */}
              <div className="flex h-6 rounded-full overflow-hidden mb-4">
                {byStatus.map((s) => (
                  <div
                    key={s.status}
                    className={`${statusColor(s.status)} transition-all`}
                    style={{ width: `${(s.count / totals.totalArtifacts) * 100}%` }}
                    title={`${s.status}: ${s.count}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {byStatus.map((s) => (
                  <div key={s.status} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${statusColor(s.status)}`} />
                    <span className="text-xs text-gray-600 capitalize">
                      {s.status.replace(/_/g, " ")} ({s.count})
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Approval trend + top revised */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-day approval trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Approval Trend (7 days)</h3>
          <div className="flex items-end gap-1 h-32">
            {approvalTrend.map((d) => {
              const total = d.approved + d.rejected;
              const approvedH = total > 0 ? (d.approved / trendMax) * 100 : 0;
              const rejectedH = total > 0 ? (d.rejected / trendMax) * 100 : 0;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: "100px" }}>
                    {d.approved > 0 && (
                      <div
                        className="w-full bg-green-400 rounded-t"
                        style={{ height: `${approvedH}%` }}
                        title={`${d.approved} approved`}
                      />
                    )}
                    {d.rejected > 0 && (
                      <div
                        className="w-full bg-red-400 rounded-b"
                        style={{ height: `${rejectedH}%` }}
                        title={`${d.rejected} rejected`}
                      />
                    )}
                    {total === 0 && (
                      <div className="w-full bg-gray-100 rounded" style={{ height: "4px" }} />
                    )}
                  </div>
                  <span className="text-[9px] text-gray-400">
                    {new Date(d.date + "T00:00:00").toLocaleDateString([], { weekday: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="text-xs text-gray-600">Approved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-xs text-gray-600">Rejected</span>
            </div>
          </div>
        </div>

        {/* Top revised artifacts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Most Revised Artifacts</h3>
          {topRevised.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No revision history yet</p>
          ) : (
            <div className="space-y-3">
              {topRevised.map((t) => (
                <div key={t.artifactId} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {t.type.replace(/_/g, " ")} · {t.projectName}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                    {t.revisions} rev{t.revisions !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Confidence distribution */}
      {rates.avgConfidence !== null && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Average AI Confidence Score</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${confColor(rates.avgConfidence)}`}
                style={{ width: `${Math.round(rates.avgConfidence * 100)}%` }}
              />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {pct(rates.avgConfidence)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Confidence scores measure how well the AI estimated the completeness and accuracy of each generated artifact.
          </p>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
