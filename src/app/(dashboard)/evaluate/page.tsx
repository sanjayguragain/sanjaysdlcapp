"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/types";

const DOC_TYPES = Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][];

interface ProjectSummary {
  id: string;
  name: string;
}

interface ProjectArtifact {
  id: string;
  title: string;
  type: string;
  status: string;
  updatedAt: string;
}

export default function EvaluatePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"upload" | "artifact">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [artifactType, setArtifactType] = useState<DocumentType>("sad");
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectArtifacts, setProjectArtifacts] = useState<ProjectArtifact[]>([]);
  const [artifactsLoading, setArtifactsLoading] = useState(false);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string>("");

  async function loadProjects() {
    if (projects.length > 0 || projectsLoading) return;
    setProjectsLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to load projects");
      const data = await res.json();
      setProjects((data.projects || []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setProjectsLoading(false);
    }
  }

  async function loadProjectArtifacts(projectId: string) {
    if (!projectId) {
      setProjectArtifacts([]);
      setSelectedArtifactId("");
      return;
    }
    setArtifactsLoading(true);
    setSelectedArtifactId("");
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to load project artifacts");
      const data = await res.json();
      setProjectArtifacts(data.artifacts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project artifacts");
    } finally {
      setArtifactsLoading(false);
    }
  }

  function handleFile(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["txt", "md", "docx", "pdf"].includes(ext || "")) {
      setError("Unsupported file type. Please upload .txt, .md, .docx, or .pdf");
      return;
    }
    setFile(f);
    setError(null);
  }

  async function handleEvaluate() {
    if (mode === "upload" && !file) return;
    if (mode === "artifact" && !selectedArtifactId) return;
    setEvaluating(true);
    setError(null);

    try {
      let res: Response;
      if (mode === "upload") {
        const formData = new FormData();
        formData.append("file", file!);
        formData.append("artifactType", artifactType);
        res = await fetch("/api/evaluations", { method: "POST", body: formData });
      } else {
        res = await fetch("/api/evaluations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artifactId: selectedArtifactId, artifactType }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Evaluation failed");
      }

      const data = await res.json();
      router.push(`/evaluations/${data.evaluation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setEvaluating(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Header
        title="Evaluate Artifact"
        subtitle="Evaluate quality by uploading a document or selecting an existing SDLC project artifact"
      />

      {/* Mode selector */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Evaluation Source</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => { setMode("upload"); setError(null); }}
            className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all text-left ${
              mode === "upload"
                ? "bg-indigo-50 border-indigo-300 text-indigo-700 ring-1 ring-indigo-300"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <div className="font-semibold">Standalone Upload</div>
            <div className="text-xs opacity-80 mt-0.5">Upload .txt, .md, .docx, or .pdf</div>
          </button>
          <button
            onClick={() => {
              setMode("artifact");
              setError(null);
              loadProjects();
            }}
            className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all text-left ${
              mode === "artifact"
                ? "bg-indigo-50 border-indigo-300 text-indigo-700 ring-1 ring-indigo-300"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <div className="font-semibold">Browse SDLC Project Artifacts</div>
            <div className="text-xs opacity-80 mt-0.5">Select from existing project artifacts</div>
          </button>
        </div>
      </div>

      {/* Document Type Selector */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DOC_TYPES.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setArtifactType(value)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                artifactType === value
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 ring-1 ring-indigo-300"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Source input */}
      {mode === "upload" ? (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Document</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-indigo-400 bg-indigo-50"
                : file
                ? "border-emerald-300 bg-emerald-50"
                : "border-gray-300 hover:border-gray-400 bg-white"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.docx,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-xs text-red-500 hover:underline mt-1"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600">
                  <span className="text-indigo-600 font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">DOCX, PDF, Markdown, or Text files</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                const projectId = e.target.value;
                setSelectedProjectId(projectId);
                loadProjectArtifacts(projectId);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={projectsLoading}
            >
              <option value="">{projectsLoading ? "Loading projects..." : "Select a project"}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Artifact</label>
            <div className="border border-gray-200 rounded-xl bg-white max-h-72 overflow-y-auto">
              {!selectedProjectId ? (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">Select a project to browse its artifacts.</p>
              ) : artifactsLoading ? (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">Loading artifacts...</p>
              ) : projectArtifacts.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">No artifacts found in this project.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {projectArtifacts.map((artifact) => (
                    <li key={artifact.id}>
                      <button
                        onClick={() => setSelectedArtifactId(artifact.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          selectedArtifactId === artifact.id ? "bg-indigo-50" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{artifact.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Type: {artifact.type} · Status: {artifact.status.replace(/_/g, " ")}
                            </p>
                          </div>
                          {selectedArtifactId === artifact.id && (
                            <span className="text-xs text-indigo-600 font-semibold">Selected</span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit button */}
      <div className="mt-6 flex justify-end">
        <Button
          variant="primary"
          size="lg"
          disabled={(mode === "upload" ? !file : !selectedArtifactId) || evaluating}
          onClick={handleEvaluate}
        >
          {evaluating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Evaluating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Evaluate Quality
            </>
          )}
        </Button>
      </div>

      {/* Evaluation info */}
      <div className="mt-8 bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">What gets evaluated?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">1.</span>
            <span><strong>Structure Completeness</strong> — Required sections, headings, order</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">2.</span>
            <span><strong>Requirements Quality</strong> — Precision, testability, metrics</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">3.</span>
            <span><strong>Architecture Completeness</strong> — Components, data flows, integrations</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">4.</span>
            <span><strong>Traceability</strong> — Goals linked to decisions</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">5.</span>
            <span><strong>Security Coverage</strong> — Threat model, controls</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">6.</span>
            <span><strong>Operational Readiness</strong> — Monitoring, deployment</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">7.</span>
            <span><strong>AI Specificity</strong> — Detects generic AI content</span>
          </div>
        </div>
      </div>
    </div>
  );
}
