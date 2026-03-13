"use client";

import React, { useState, useRef, useCallback } from "react";

interface Document {
  id: string;
  name: string;
  type: string;
  content: string;
  createdAt: string;
}

interface DocumentUploadProps {
  projectId: string;
  documents: Document[];
  onUpload: (doc: Document) => void;
  onDelete?: (id: string) => void;
}

const ACCEPTED_TYPES: Record<string, string> = {
  "text/plain": "txt",
  "text/markdown": "md",
  "text/csv": "csv",
  "application/json": "json",
  "application/pdf": "pdf",
};

function fileIcon(type: string) {
  const icons: Record<string, string> = {
    md: "📝",
    txt: "📄",
    csv: "📊",
    json: "🔧",
    pdf: "📑",
  };
  return icons[type] ?? "📄";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string ?? "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export function DocumentUpload({
  projectId,
  documents,
  onUpload,
  onDelete,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "txt";
      if (!Object.values(ACCEPTED_TYPES).includes(ext) && !Object.keys(ACCEPTED_TYPES).includes(file.type)) {
        setError(`Unsupported file type: .${ext}. Accepted: txt, md, csv, json, pdf`);
        return;
      }

      setUploading((prev) => [...prev, file.name]);
      setError(null);

      try {
        const content = await readFileContent(file);
        const res = await fetch(`/api/projects/${projectId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, content, type: ext }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Upload failed");
        }

        const doc = await res.json();
        onUpload(doc);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading((prev) => prev.filter((n) => n !== file.name));
      }
    },
    [projectId, onUpload]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach(uploadFile);
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/projects/${projectId}/documents?documentId=${id}`, {
        method: "DELETE",
      });
      onDelete?.(id);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".txt,.md,.csv,.json,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isDragging ? "bg-indigo-100" : "bg-white border border-gray-200"
          }`}>
            <svg className={`w-6 h-6 ${isDragging ? "text-indigo-600" : "text-gray-400"}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? "Drop files here" : "Drag & drop files, or click to browse"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports .txt, .md, .csv, .json, .pdf
            </p>
          </div>
        </div>

        {uploading.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-indigo-600">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading {uploading.join(", ")}...
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Document list */}
      {documents.length > 0 && (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
              <span className="text-xl">{fileIcon(doc.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                <p className="text-xs text-gray-500">
                  {formatSize(doc.content.length)} · Uploaded {formatDate(doc.createdAt)}
                </p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono uppercase">
                {doc.type}
              </span>
              {onDelete && (
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove document"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {documents.length === 0 && uploading.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-1">
          No documents uploaded yet. Upload context documents to improve AI artifact quality.
        </p>
      )}
    </div>
  );
}
