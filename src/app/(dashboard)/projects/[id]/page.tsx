"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ProgressTracker } from "@/components/projects/ProgressTracker";
import { ArtifactCard } from "@/components/artifacts/ArtifactCard";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { ArtifactType, ArtifactStatus, ARTIFACT_DEFINITIONS } from "@/types";

const TRADITIONAL_ARTIFACT_DEFINITIONS: Array<{
  type: ArtifactType;
  label: string;
  owner: string;
  dependencies: ArtifactType[];
}> = [
  {
    type: "brd",
    label: "Business Requirements Document",
    owner: "Business Analyst",
    dependencies: [],
  },
  {
    type: "avd",
    label: "Architecture Vision Document",
    owner: "Enterprise Architect",
    dependencies: ["brd"],
  },
  {
    type: "srs",
    label: "System Requirements Specification",
    owner: "Systems Analyst",
    dependencies: ["brd", "avd"],
  },
  {
    type: "sad",
    label: "Solution Architecture Definition",
    owner: "Solution Architect",
    dependencies: ["srs", "avd"],
  },
  {
    type: "ses",
    label: "System Engineering Specification",
    owner: "Engineering Lead",
    dependencies: ["sad", "srs"],
  },
];

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
  sdlcMode?: "modern" | "traditional" | null;
  status: string;
  phase: string;
  createdAt: string;
  artifacts: Artifact[];
}

/** Returns artifact types whose dependencies are all approved/completed */
function getUnlockedTypes(
  artifacts: Artifact[],
  definitions: Array<{ type: ArtifactType; dependencies: ArtifactType[] }>
): Set<ArtifactType> {
  const approved = new Set(
    artifacts
      .filter((a) => a.status === "approved" || a.status === "completed")
      .map((a) => a.type)
  );
  return new Set(
    definitions.filter((def) =>
      def.dependencies.every((dep) => approved.has(dep))
    ).map((def) => def.type)
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "sdlc-project";
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoDescription, setRepoDescription] = useState("");
  const [privateRepo, setPrivateRepo] = useState(true);
  const [includeAllArtifacts, setIncludeAllArtifacts] = useState(true);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccessUrl, setPublishSuccessUrl] = useState<string | null>(null);

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

  const hasPrd = project.artifacts.some((a) => a.type === "prd");

  const openPublishModal = () => {
    setRepoName(slugify(project.name));
    setRepoDescription(`SDLC project export: ${project.name}`);
    setPublishError(null);
    setPublishSuccessUrl(null);
    setPublishOpen(true);
  };

  const handlePublish = async () => {
    setPublishLoading(true);
    setPublishError(null);
    setPublishSuccessUrl(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/github/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName,
          description: repoDescription,
          privateRepo,
          includeAllArtifacts,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPublishError(data?.error || "Failed to publish repository.");
        return;
      }

      setPublishSuccessUrl(data?.repository?.url || null);
    } catch {
      setPublishError("Network error while publishing repository.");
    } finally {
      setPublishLoading(false);
    }
  };

  const artifactStates = project.artifacts.map((a) => ({
    type: a.type,
    status: a.status as ArtifactStatus,
    title: a.title,
    id: a.id,
  }));

  const activeDefinitions = project.sdlcMode === "traditional"
    ? TRADITIONAL_ARTIFACT_DEFINITIONS
    : ARTIFACT_DEFINITIONS;

  const existingTypes = new Set(project.artifacts.map((a) => a.type));
  const unlockedTypes = getUnlockedTypes(project.artifacts, activeDefinitions);

  // Long-description handling: >160 chars or multi-line → collapsible card
  const desc = project.description ?? "";
  const isLongDesc = desc.length > 160 || desc.includes("\n");
  const descPreview = isLongDesc
    ? desc.slice(0, 160).replace(/\s+\S*$/, "") + "…"
    : desc;
  const descParagraphs = desc.split(/\n+/).filter(Boolean);

  // Artifacts not yet generated: split into unlocked (ready) vs locked
  const pendingDefs = activeDefinitions.filter((d) => !existingTypes.has(d.type));
  const readyDefs = pendingDefs.filter((d) => unlockedTypes.has(d.type));
  const lockedDefs = pendingDefs.filter((d) => !unlockedTypes.has(d.type));

  return (
    <div className="p-8">
      <Header
        title={project.name}
        actions={
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-100 text-indigo-700">
              {project.phase.replace(/_/g, " ")}
            </Badge>
            <Badge className={project.sdlcMode === "traditional" ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-700"}>
              {project.sdlcMode === "traditional" ? "Traditional SDLC" : "Modern SDLC"}
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
            <Button
              variant="secondary"
              size="md"
              onClick={openPublishModal}
              disabled={!hasPrd}
              title={hasPrd ? "Create GitHub repository and publish artifacts" : "Generate PRD first"}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Publish to GitHub
            </Button>
          </div>
        }
      />

      {/* Project Description — collapsible if long */}
      {desc && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {!isLongDesc ? (
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              ) : descExpanded ? (
                <div className="space-y-2">
                  {descParagraphs.map((para, i) => (
                    <p key={i} className="text-sm text-gray-600 leading-relaxed">{para}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed">{descPreview}</p>
              )}
            </div>
            {isLongDesc && (
              <button
                onClick={() => setDescExpanded((v) => !v)}
                className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap mt-0.5 transition-colors"
              >
                {descExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress Tracker */}
      <div className="mt-6">
        <ProgressTracker
            sdlcMode={project.sdlcMode === "traditional" ? "traditional" : "modern"}
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
              {project.artifacts.length}/{activeDefinitions.length}
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
                        .map((b) => activeDefinitions.find((d) => d.type === b)?.label ?? b)
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

      <Modal
        isOpen={publishOpen}
        onClose={() => setPublishOpen(false)}
        title="Publish Project to GitHub"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Create a new GitHub repository and push your PRD plus project artifacts.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repository Name</label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="my-sdlc-project"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={repoDescription}
              onChange={(e) => setRepoDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="SDLC project export"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={privateRepo}
              onChange={(e) => setPrivateRepo(e.target.checked)}
            />
            Create as private repository
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeAllArtifacts}
              onChange={(e) => setIncludeAllArtifacts(e.target.checked)}
            />
            Include all artifacts (not just PRD)
          </label>

          {publishError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {publishError}
            </div>
          )}

          {publishSuccessUrl && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              Repository created successfully: {" "}
              <a href={publishSuccessUrl} target="_blank" rel="noreferrer" className="underline">
                Open repository
              </a>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setPublishOpen(false)} disabled={publishLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePublish}
              disabled={publishLoading || !repoName.trim()}
            >
              {publishLoading ? "Publishing..." : "Create Repo and Push"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

