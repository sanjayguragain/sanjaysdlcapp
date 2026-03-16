"use client";

import React from "react";
import { AiRiskIndicatorItem, RecommendationItem } from "@/types";

interface RecommendationListProps {
  recommendations: Array<string | RecommendationItem>;
  aiRiskIndicators?: Array<string | AiRiskIndicatorItem>;
}

function normalizeRecommendations(recommendations: Array<string | RecommendationItem>): RecommendationItem[] {
  return recommendations.map((rec) =>
    typeof rec === "string"
      ? { text: rec, sections: [] }
      : { text: rec.text, sections: rec.sections ?? [] }
  );
}

function normalizeAiRiskIndicators(indicators: Array<string | AiRiskIndicatorItem>): AiRiskIndicatorItem[] {
  return indicators.map((risk) =>
    typeof risk === "string"
      ? { text: risk, sections: [] }
      : { text: risk.text, sections: risk.sections ?? [] }
  );
}

export function RecommendationList({ recommendations, aiRiskIndicators }: RecommendationListProps) {
  const normalized = normalizeRecommendations(recommendations);
  const normalizedRisks = normalizeAiRiskIndicators(aiRiskIndicators ?? []);

  return (
    <div className="space-y-6">
      {/* Improvement Recommendations */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Improvement Recommendations ({normalized.length})
        </h3>
        {normalized.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No recommendations — document meets quality standards.</p>
        ) : (
          <ul className="space-y-2">
            {normalized.map((rec, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p>{rec.text}</p>
                  {rec.sections.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {rec.sections.map((section, idx) => (
                        <span
                          key={idx}
                          className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                        >
                          {section}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* AI Risk Indicators */}
      {normalizedRisks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            AI Risk Indicators ({normalizedRisks.length})
          </h3>
          <ul className="space-y-2">
            {normalizedRisks.map((indicator, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                </svg>
                <div className="min-w-0">
                  <p>{indicator.text}</p>
                  {indicator.sections.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {indicator.sections.map((section, idx) => (
                        <span
                          key={idx}
                          className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200"
                        >
                          {section}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
