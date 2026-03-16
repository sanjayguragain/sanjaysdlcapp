"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { EvaluationCard } from "@/components/evaluations/EvaluationCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface EvalItem {
  id: string;
  overallScore: number;
  interpretation: string;
  createdAt: string;
  document: { name: string; artifactType: string; fileType: string };
}

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<EvalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/evaluations")
      .then((r) => r.json())
      .then((data) => setEvaluations(data.evaluations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <Header
        title="Evaluation History"
        subtitle="All artifact quality evaluations"
        actions={
          <Link href="/evaluate">
            <Button variant="primary" size="md">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Evaluation
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : evaluations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mt-6">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="font-semibold text-gray-900 mb-2">No evaluations yet</h3>
          <p className="text-sm text-gray-500 mb-4">Upload an artifact to get your first quality evaluation.</p>
          <Link href="/evaluate">
            <Button variant="primary" size="md">Evaluate an Artifact</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {evaluations.map((e) => (
            <EvaluationCard
              key={e.id}
              id={e.id}
              documentName={e.document.name}
              artifactType={e.document.artifactType}
              overallScore={e.overallScore}
              createdAt={e.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
