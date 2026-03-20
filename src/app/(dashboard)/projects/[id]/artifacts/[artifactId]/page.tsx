"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArtifactViewer } from "@/components/artifacts/ArtifactViewer";
import { ArtifactType, ArtifactStatus } from "@/types";

interface Approval {
  id: string;
  status: string;
  comment: string | null;
  createdAt: string;
  user: { name: string; role: string };
}

interface ArtifactData {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  status: ArtifactStatus;
  confidenceScore: number | null;
  version: number;
  projectId: string;
  approvals?: Approval[];
}

interface ArtifactVersionItem {
  id: string;
  version: number;
  content: string;
  savedAt: string;
}

export default function ArtifactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const artifactId = params.artifactId as string;
  const [artifact, setArtifact] = useState<ArtifactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");
  const [versions, setVersions] = useState<ArtifactVersionItem[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  const loadArtifact = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/artifacts/${artifactId}`
      );
      if (res.ok) {
        const data = await res.json();
        setArtifact(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [projectId, artifactId]);

  const loadVersions = useCallback(async () => {
    setVersionsLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/artifacts/${artifactId}/versions`
      );
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch {
      // ignore
    } finally {
      setVersionsLoading(false);
    }
  }, [projectId, artifactId]);

  useEffect(() => {
    loadArtifact();
  }, [loadArtifact]);

  useEffect(() => {
    if (activeTab === "history") {
      loadVersions();
    }
  }, [activeTab, loadVersions]);

  const handleApprove = async (comment: string) => {
    const res = await fetch(
      `/api/projects/${projectId}/artifacts/${artifactId}/approve`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", comment }),
      }
    );
    if (res.ok) await loadArtifact();
  };

  const handleReject = async (comment: string) => {
    const res = await fetch(
      `/api/projects/${projectId}/artifacts/${artifactId}/approve`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", comment }),
      }
    );
    if (res.ok) await loadArtifact();
  };

  const handleSubmitForApproval = async (content: string) => {
    const res = await fetch(
      `/api/projects/${projectId}/artifacts/${artifactId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "awaiting_approval", content }),
      }
    );
    if (res.ok) {
      await loadArtifact();
      return { ok: true } as const;
    }

    let err: any = null;
    try {
      err = await res.json();
    } catch {
      // ignore
    }

    return {
      ok: false,
      error: err?.error ?? `Submit for approval failed (${res.status}).`,
      openQuestions: err?.openQuestions,
      qualityPct: err?.qualityPct,
    } as const;
  };

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-96 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Artifact not found
        </h2>
        <Link href={`/projects/${projectId}`} className="text-edison-600 hover:text-edison-700">
          Back to project
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-4">
        <Link
          href={`/projects/${projectId}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to project
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "details"
              ? "border-edison-600 text-edison-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Details & Approvals
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "history"
              ? "border-edison-600 text-edison-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Version History
          {versions.length > 0 && (
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
              {versions.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "details" && (
        <ArtifactViewer
          id={artifact.id}
          type={artifact.type}
          title={artifact.title}
          content={artifact.content}
          status={artifact.status}
          confidenceScore={artifact.confidenceScore}
          version={artifact.version}
          projectId={projectId}
          approvals={artifact.approvals ?? []}
          onApprove={handleApprove}
          onReject={handleReject}
          onSubmitForApproval={handleSubmitForApproval}
          onEdit={() => router.push(`/projects/${projectId}/chat?artifact=${artifactId}`)}
        />
      )}

      {activeTab === "history" && (
        <div>
          {versionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-20" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-3">📄</div>
              <h3 className="font-semibold text-gray-900 mb-1">No version history yet</h3>
              <p className="text-sm text-gray-500">
                Previous versions are saved here whenever you edit and save this artifact.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((v) => (
                <div key={v.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => setExpandedVersion(expandedVersion === v.id ? null : v.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded">
                        v{v.version}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(v.savedAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${expandedVersion === v.id ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedVersion === v.id && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      <pre className="mt-3 text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                        {v.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
