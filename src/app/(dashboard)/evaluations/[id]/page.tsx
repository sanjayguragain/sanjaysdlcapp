"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ScoreGauge, InterpretationBadge } from "@/components/evaluations/ScoreGauge";
import { CategoryScores } from "@/components/evaluations/CategoryScores";
import { RecommendationList } from "@/components/evaluations/RecommendationList";
import { DOCUMENT_TYPE_LABELS, type DocumentType, type EvaluationCategory, type EvaluationResult, type RecommendationItem, type ScoreInterpretation } from "@/types";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface EvaluationDetail {
  id: string;
  overallScore: number;
  interpretation: ScoreInterpretation;
  structureScore: number;
  requirementsQuality: number;
  architectureCompleteness: number;
  traceability: number;
  security: number;
  operationalReadiness: number;
  aiSpecificity: number;
  recommendations: Array<string | RecommendationItem>;
  report: EvaluationResult;
  createdAt: string;
  document: {
    name: string;
    artifactType: string;
    fileType: string;
    fileSize: number;
    createdAt: string;
  };
}

export default function EvaluationDetailPage() {
  const params = useParams();
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/evaluations/${params.id}`)
      .then((r) => r.json())
      .then((data) => setEvaluation(data.evaluation))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Evaluation not found</p>
        <Link href="/evaluations" className="text-edison-600 text-sm mt-2 inline-block">← Back to evaluations</Link>
      </div>
    );
  }

  const categoryScores: Record<EvaluationCategory, number> = {
    structure: evaluation.structureScore,
    requirements_quality: evaluation.requirementsQuality,
    architecture_completeness: evaluation.architectureCompleteness,
    traceability: evaluation.traceability,
    security: evaluation.security,
    operational_readiness: evaluation.operationalReadiness,
    ai_specificity: evaluation.aiSpecificity,
  };

  const typeLabel = DOCUMENT_TYPE_LABELS[evaluation.document.artifactType as DocumentType] || evaluation.document.artifactType;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/evaluations" className="hover:text-edison-600">Evaluations</Link>
        <span>/</span>
        <span className="text-gray-900">Report</span>
      </div>

      <Header
        title={evaluation.document.name}
        subtitle={`${typeLabel} · Evaluated ${new Date(evaluation.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowJson(!showJson)}>
              {showJson ? "Hide" : "Show"} JSON
            </Button>
            <Link href="/evaluate">
              <Button variant="primary" size="sm">New Evaluation</Button>
            </Link>
          </div>
        }
      />

      {/* Score Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mt-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ScoreGauge score={evaluation.overallScore} size="lg" label="Overall Score" />
          <div className="flex-1 text-center md:text-left">
            <InterpretationBadge interpretation={evaluation.interpretation} />
            <p className="text-sm text-gray-500 mt-3">
              {evaluation.overallScore >= 90
                ? "This artifact meets enterprise quality standards with excellence."
                : evaluation.overallScore >= 75
                ? "This artifact is in good shape with minor areas to improve."
                : evaluation.overallScore >= 60
                ? "Several quality gaps need attention before this artifact is production-ready."
                : "This artifact needs significant rework across multiple quality dimensions."}
            </p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              <span>File: {evaluation.document.fileType.toUpperCase()}</span>
              <span>Size: {(evaluation.document.fileSize / 1024).toFixed(1)} KB</span>
              <span>Recommendations: {evaluation.recommendations.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Scores + Recommendations side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Category Scores</h2>
          <CategoryScores scores={categoryScores} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recommendations</h2>
          <RecommendationList
            recommendations={evaluation.recommendations}
            aiRiskIndicators={evaluation.report?.ai_risk_indicators}
          />
        </div>
      </div>

      {/* Structural Analysis */}
      {evaluation.report?.structural_analysis && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Structural Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-emerald-700 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Present Sections ({evaluation.report.structural_analysis.present_sections.length})
              </h3>
              <ul className="space-y-1">
                {evaluation.report.structural_analysis.present_sections.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Missing Sections ({evaluation.report.structural_analysis.missing_sections.length})
              </h3>
              <ul className="space-y-1">
                {evaluation.report.structural_analysis.missing_sections.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {s}
                  </li>
                ))}
                {evaluation.report.structural_analysis.missing_sections.length === 0 && (
                  <li className="text-sm text-gray-400 italic">All expected sections present</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Section Order</h3>
              <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                evaluation.report.structural_analysis.section_order_correct
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {evaluation.report.structural_analysis.section_order_correct ? "Correct" : "Non-standard order"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* JSON Report */}
      {showJson && (
        <div className="bg-gray-900 rounded-xl p-6 mt-6 overflow-auto max-h-[600px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300">Evaluation Report (JSON)</h2>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(evaluation.report, null, 2))}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Copy to clipboard
            </button>
          </div>
          <pre className="text-sm text-emerald-400 font-mono whitespace-pre-wrap">
            {JSON.stringify(evaluation.report, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
