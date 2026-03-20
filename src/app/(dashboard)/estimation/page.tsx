"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";

interface EstimationData {
  summary: {
    totalProjects: number;
    inFlightProjects: number;
    totalCurrentArtifacts: number;
    projectedTotalArtifacts: number;
    overallCompletionPct: number;
    totalRemainingHours: number;
    projectedCompletionDate: string;
  };
  velocity: {
    approvedLast14Days: number;
    artifactsPerWeek: number;
    avgLeadTimeHours: number | null;
  };
  distribution: {
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
  };
  projects: {
    id: string;
    name: string;
    mode: string;
    phase: string;
    status: string;
    artifactCount: number;
    targetArtifacts: number;
    completionPct: number;
    remainingHours: number;
    risk: "low" | "medium" | "high";
  }[];
}

function riskClass(risk: "low" | "medium" | "high") {
  if (risk === "high") return "bg-red-100 text-red-700";
  if (risk === "medium") return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}

function kpiSubLabel(dateIso: string) {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "No forecast";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EstimationDashboardPage() {
  const [data, setData] = useState<EstimationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/estimations");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const topAtRisk = useMemo(() => {
    if (!data) return [];
    return [...data.projects]
      .sort((a, b) => b.remainingHours - a.remainingHours)
      .slice(0, 5);
  }, [data]);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-28 bg-white border border-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-sm text-gray-500">Failed to load estimation dashboard.</div>;
  }

  const riskTotal = data.distribution.lowRisk + data.distribution.mediumRisk + data.distribution.highRisk;
  const lowPct = riskTotal ? (data.distribution.lowRisk / riskTotal) * 100 : 0;
  const mediumPct = riskTotal ? (data.distribution.mediumRisk / riskTotal) * 100 : 0;
  const highPct = riskTotal ? (data.distribution.highRisk / riskTotal) * 100 : 0;

  return (
    <div className="p-8">
      <Header
        title="Estimation Dashboard"
        subtitle="Forecast delivery effort, completion risk, and execution velocity"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 mb-8">
        <KpiCard
          label="Remaining Effort"
          value={`${data.summary.totalRemainingHours}h`}
          sub="Estimated team hours"
          color="bg-edison-50 text-edison-700"
        />
        <KpiCard
          label="Projected Completion"
          value={kpiSubLabel(data.summary.projectedCompletionDate)}
          sub="Based on recent throughput"
          color="bg-blue-50 text-blue-700"
        />
        <KpiCard
          label="Overall Completion"
          value={`${data.summary.overallCompletionPct}%`}
          sub={`${data.summary.totalCurrentArtifacts}/${data.summary.projectedTotalArtifacts} artifacts`}
          color="bg-emerald-50 text-emerald-700"
        />
        <KpiCard
          label="Velocity"
          value={`${data.velocity.artifactsPerWeek}/week`}
          sub={`${data.velocity.approvedLast14Days} approved in 14 days`}
          color="bg-edison-blue-50 text-edison-blue-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Completion by Project</h3>
          <div className="space-y-3">
            {data.projects.length === 0 && <p className="text-sm text-gray-500">No projects available.</p>}
            {data.projects.map((project) => (
              <div key={project.id}>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span className="font-medium text-gray-800 truncate pr-2">{project.name}</span>
                  <span>{project.completionPct}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-edison-500 rounded-full transition-all duration-500"
                    style={{ width: `${project.completionPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Risk Distribution</h3>
          <div className="h-3 rounded-full overflow-hidden flex mb-4">
            <div className="bg-green-400" style={{ width: `${lowPct}%` }} />
            <div className="bg-amber-400" style={{ width: `${mediumPct}%` }} />
            <div className="bg-red-400" style={{ width: `${highPct}%` }} />
          </div>
          <div className="space-y-2 text-sm">
            <RiskRow label="Low" count={data.distribution.lowRisk} color="bg-green-400" />
            <RiskRow label="Medium" count={data.distribution.mediumRisk} color="bg-amber-400" />
            <RiskRow label="High" count={data.distribution.highRisk} color="bg-red-400" />
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500">
            Avg lead time: {data.velocity.avgLeadTimeHours ? `${data.velocity.avgLeadTimeHours}h` : "N/A"}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Project Estimation Details</h3>
          <span className="text-xs text-gray-500">Top risk and workload drivers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-6 py-3 font-medium">Project</th>
                <th className="text-left px-4 py-3 font-medium">Mode</th>
                <th className="text-left px-4 py-3 font-medium">Phase</th>
                <th className="text-left px-4 py-3 font-medium">Progress</th>
                <th className="text-left px-4 py-3 font-medium">Remaining</th>
                <th className="text-left px-4 py-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {topAtRisk.map((project) => (
                <tr key={project.id} className="border-t border-gray-100">
                  <td className="px-6 py-3 text-gray-900 font-medium">{project.name}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{project.mode}</td>
                  <td className="px-4 py-3 text-gray-600">{project.phase}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {project.artifactCount}/{project.targetArtifacts} ({project.completionPct}%)
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{project.remainingHours}h</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${riskClass(project.risk)}`}>
                      {project.risk}
                    </span>
                  </td>
                </tr>
              ))}
              {topAtRisk.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No project estimation data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold mb-3 ${color}`}>{label}</div>
      <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function RiskRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <span className="text-gray-700">{label}</span>
      </div>
      <span className="font-medium text-gray-900">{count}</span>
    </div>
  );
}