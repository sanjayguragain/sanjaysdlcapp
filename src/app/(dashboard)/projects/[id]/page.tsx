"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressTracker } from "@/components/projects/ProgressTracker";
import { ArtifactCard } from "@/components/artifacts/ArtifactCard";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { ArtifactType, ArtifactStatus, ARTIFACT_DEFINITIONS } from "@/types";

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  content: string;
  createdAt: string;
}

interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  status: ArtifactStatus;
  confidenceScore: number | null;
  version: number;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  phase: string;
  createdAt: string;
  artifacts: Artifact[];
}

/** Returns artifact types whose dependencies are all approved/completed */
function getUnlockedTypes(artifacts: Artifact[]): Set<ArtifactType> {
  const approved = new Set(
    artifacts
      .filter((a) => a.status === "approved" || a.status === "completed")
      .map((a) => a.type)
  );
  return new Set(
    ARTIFACT_DEFINITIONS.filter((def) =>
      def.dependencies.every((dep) => approved.has(dep))
    ).map((def) => def.type)
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [projRes, docsRes] = await Promise.all([
          fetch(`/api/projects/${params.id}`),
          fetch(`/api/projects/${params.id}/documents`),
        ]);
        if (projRes.ok) {
          const data = await projRes.json();
          setProject(data);
        }
        if (docsRes.ok) {
          const data = await docsRes.json();
          setDocuments(data.documents || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Project not found
        </h2>
        <Link href="/projects" className="text-indigo-600 hover:text-indigo-700">
          Back to projects
        </Link>
      </div>
    );
  }

  const artifactStates = project.artifacts.map((a) => ({
    type: a.type,
    status: a.status as ArtifactStatus,
    title: a.title,
    id: a.id,
  }));

  const existingTypes = new Set(project.artifacts.map((a) => a.type));
  const unlockedTypes = getUnlockedTypes(project.artifacts);

  // Artifacts not yet generated: split into unlocked (ready) vs locked
  const pendingDefs = ARTIFACT_DEFINITIONS.filter((d) => !existingTypes.has(d.type));
  const readyDefs = pendingDefs.filter((d) => unlockedTypes.has(d.type));
  const lockedDefs = pendingDefs.filter((d) => !unlockedTypes.has(d.type));

  return (
    <div className="p-8">
      <Header
        title={project.name}
        subtitle={project.description || "No description"}
        actions={
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-100 text-indigo-700">
              {project.phase.replace(/_/g, " ")}
            </Badge>
            <Link href={`/projects/${project.id}/settings`}>
              <Button variant="secondary" size="md">
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Button>
            </Link>
            <Link href={`/projects/${project.id}/chat`}>
              <Button variant="primary" size="md">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Open Chat
              </Button>
            </Link>
          </div>
        }
      />

      {/* Progress Tracker */}
      <div className="mt-6">
        <ProgressTracker
          artifacts={artifactStates}
          onArtifactClick={(type) => {
            const artifact = project.artifacts.find((a) => a.type === type);
            if (artifact) {
              router.push(`/projects/${project.id}/artifacts/${artifact.id}`);
            }
          }}
        />
      </div>

      {/* Two-column layout: Documents + Artifacts */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documents Upload */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {documents.length} file{documents.length !== 1 ? "s" : ""}
            </span>
          </div>
          <DocumentUpload
            projectId={project.id}
            documents={documents}
            onUpload={(doc) => setDocuments((prev) => [doc, ...prev])}
            onDelete={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
          />
        </div>

        {/* Artifacts Grid */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Artifacts</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {project.artifacts.length}/9
            </span>
          </div>

          {project.artifacts.length === 0 && readyDefs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="text-3xl mb-3">💬</div>
              <h4 className="font-semibold text-gray-900 mb-2">No artifacts yet</h4>
              <p className="text-sm text-gray-500 mb-4">
                Open the AI chat to start generating documentation artifacts.
              </p>
              <Link href={`/projects/${project.id}/chat`}>
                <Button variant="primary" size="md">Start Chat</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Existing artifacts */}
              {project.artifacts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {project.artifacts.map((artifact) => (
                    <ArtifactCard
                      key={artifact.id}
                      id={artifact.id}
                      type={artifact.type}
                      title={artifact.title}
                      status={artifact.status}
                      confidenceScore={artifact.confidenceScore}
                      version={artifact.version}
                      updatedAt={artifact.updatedAt}
                      onClick={() =>
                        router.push(`/projects/${project.id}/artifacts/${artifact.id}`)
                      }
                    />
                  ))}
                </div>
              )}

              {/* Ready to generate */}
              {readyDefs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Ready to Generate
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {readyDefs.map((def) => (
                      <Link
                        key={def.type}
                        href={`/projects/${project.id}/chat`}
                        className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 hover:bg-emerald-100 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{def.label}</p>
                          <p className="text-xs text-gray-500">{def.owner}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Locked artifacts */}
              {lockedDefs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Waiting for Dependencies
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {lockedDefs.map((def) => {
                      // Find which dependencies are not yet approved
                      const blockers = def.dependencies.filter((dep) => {
                        const art = project.artifacts.find((a) => a.type === dep);
                        return !art || (art.status !== "approved" && art.status !== "completed");
                      });
                      const blockerLabels = blockers
                        .map((b) => ARTIFACT_DEFINITIONS.find((d) => d.type === b)?.label ?? b)
                        .join(", ");
                      return (
                        <div
                          key={def.type}
                          className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4 opacity-70"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-600 truncate">{def.label}</p>
                            <p className="text-xs text-gray-400 line-clamp-2">
                              Requires: {blockerLabels}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>{/* end lg:col-span-2 */}
      </div>{/* end two-column grid */}
    </div>
  );
}

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  content: string;
  createdAt: string;
}

interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  status: ArtifactStatus;
  confidenceScore: number | null;
  version: number;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  phase: string;
  createdAt: string;
  artifacts: Artifact[];
}

