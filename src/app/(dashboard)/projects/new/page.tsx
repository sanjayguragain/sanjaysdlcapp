"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { DocumentUpload } from "@/components/documents/DocumentUpload";

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  content: string;
  createdAt: string;
}

interface Stakeholder {
  id: string;
  name: string;
  role: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const addStakeholder = () =>
    setStakeholders((prev) => [{ id: crypto.randomUUID(), name: "", role: "" }, ...prev]);

  const updateStakeholder = (id: string, field: "name" | "role", value: string) =>
    setStakeholders((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));

  const removeStakeholder = (id: string) =>
    setStakeholders((prev) => prev.filter((s) => s.id !== id));

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          stakeholders: stakeholders.filter((s) => s.name.trim()),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      const data = await res.json();
      setCreatedProjectId(data.id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = useCallback((doc: DocumentItem) => {
    setDocuments((prev) => [...prev, doc]);
  }, []);

  const handleDocumentDelete = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return (
    <div className="p-8">
      <Header
        title="Create New Project"
        subtitle="Start a new SDLC documentation project"
      />

      {/* Step indicator */}
      <div className="mt-4 flex items-center gap-3 max-w-2xl">
        <div className={`flex items-center gap-2 text-sm font-medium ${step === 1 ? "text-indigo-600" : "text-gray-400"}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? "bg-indigo-600 text-white" : "bg-green-500 text-white"}`}>
            {step > 1 ? "✓" : "1"}
          </div>
          Project Details
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div className={`flex items-center gap-2 text-sm font-medium ${step === 2 ? "text-indigo-600" : "text-gray-400"}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"}`}>
            2
          </div>
          Upload Documents
        </div>
      </div>

      <div className="mt-6 max-w-2xl">
        {step === 1 ? (
          <form onSubmit={handleCreateProject} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g., Customer Portal Redesign"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Briefly describe the project, its goals, and key features..."
              />
            </div>

            {/* Stakeholders */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stakeholders</label>
                  <p className="text-xs text-gray-400 mt-0.5">Added to all generated artifacts (optional)</p>
                </div>
                <button
                  type="button"
                  onClick={addStakeholder}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-md border border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Stakeholder
                </button>
              </div>

              {stakeholders.length > 0 && (
                <div className="space-y-2">
                  {stakeholders.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={s.name}
                        onChange={(e) => updateStakeholder(s.id, "name", e.target.value)}
                        placeholder="Name"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={s.role}
                        onChange={(e) => updateStakeholder(s.id, "role", e.target.value)}
                        placeholder="Role (e.g. Product Owner)"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removeStakeholder(s.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Continue →"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => router.push("/projects")}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Upload Supporting Documents</h3>
              <p className="text-sm text-gray-500 mt-1">
                Upload meeting transcripts, emails, feature briefs, or any relevant files. The AI will use these to generate more accurate and detailed artifacts.
              </p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 text-sm text-indigo-700">
              <strong>Tip:</strong> Meeting notes, stakeholder emails, existing specs, and user research documents all make PRDs and risk analyses significantly better.
            </div>

            <DocumentUpload
              projectId={createdProjectId!}
              documents={documents}
              onUpload={handleDocumentUpload}
              onDelete={handleDocumentDelete}
            />

            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => router.push(`/projects/${createdProjectId}/chat?autoGenerate=prd`)}
              >
                Generate PRD Now →
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => router.push(`/projects/${createdProjectId}`)}
              >
                Go to Project Overview
              </Button>
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-gray-600 ml-auto"
                onClick={() => router.push(`/projects/${createdProjectId}/chat`)}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
