"use client";

import React, { useEffect, useRef, useState } from "react";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { ArtifactEditor } from "./ArtifactEditor";
import { ArtifactType, ARTIFACT_DEFINITIONS } from "@/types";

export interface SidePanelArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  version: number;
  status: string;
  confidenceScore?: number | null;
}

interface ArtifactSidePanelProps {
  artifact: SidePanelArtifact | null;
  isGenerating?: boolean;
  onClose: () => void;
  onSave?: (content: string) => void;
  onImprove?: () => void;
}

export function ArtifactSidePanel({
  artifact,
  isGenerating,
  onClose,
  onSave,
  onImprove,
}: ArtifactSidePanelProps) {
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!artifact && !isGenerating) return null;

  const def = artifact
    ? ARTIFACT_DEFINITIONS.find((d) => d.type === artifact.type)
    : null;

  const handleSave = async () => {
    if (!onSave || editedContent === null) return;
    setIsSaving(true);
    try {
      onSave(editedContent);
    } finally {
      setIsSaving(false);
    }
  };

  const slug = (title: string, version: number) =>
    `${title.replace(/\s+/g, "-").toLowerCase()}-v${version}`;

  const htmlToMarkdown = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const lines: string[] = [];
    const processNode = (node: Node, listType?: "ul" | "ol", depth = 0) => {
      if (node.nodeType === Node.TEXT_NODE) return;
      const el = node as Element;
      const tag = el.tagName?.toLowerCase();
      if (tag === "h1") lines.push(`# ${el.textContent?.trim()}\n`);
      else if (tag === "h2") lines.push(`## ${el.textContent?.trim()}\n`);
      else if (tag === "h3") lines.push(`### ${el.textContent?.trim()}\n`);
      else if (tag === "h4") lines.push(`#### ${el.textContent?.trim()}\n`);
      else if (tag === "h5") lines.push(`##### ${el.textContent?.trim()}\n`);
      else if (tag === "h6") lines.push(`###### ${el.textContent?.trim()}\n`);
      else if (tag === "p") {
        const text = inlineToMarkdown(el);
        if (text.trim()) lines.push(`${text}\n`);
        else lines.push("");
      } else if (tag === "strong" || tag === "b") {
        lines.push(`**${el.textContent}**`);
      } else if (tag === "em" || tag === "i") {
        lines.push(`*${el.textContent}*`);
      } else if (tag === "code" && el.parentElement?.tagName.toLowerCase() !== "pre") {
        lines.push(`\`${el.textContent}\``);
      } else if (tag === "pre") {
        lines.push(`\`\`\`\n${el.textContent}\n\`\`\`\n`);
      } else if (tag === "blockquote") {
        lines.push(`> ${el.textContent?.trim()}\n`);
      } else if (tag === "hr") {
        lines.push("---\n");
      } else if (tag === "ul") {
        for (const child of el.children) processNode(child, "ul", depth);
      } else if (tag === "ol") {
        let idx = 1;
        for (const child of el.children) {
          if (child.tagName.toLowerCase() === "li") {
            const indent = "  ".repeat(depth);
            lines.push(`${indent}${idx}. ${inlineToMarkdown(child)}`);
            for (const sub of child.children) {
              if (sub.tagName.toLowerCase() === "ul" || sub.tagName.toLowerCase() === "ol") {
                processNode(sub, sub.tagName.toLowerCase() as "ul" | "ol", depth + 1);
              }
            }
            idx++;
          }
        }
      } else if (tag === "li") {
        const indent = "  ".repeat(depth);
        const marker = listType === "ol" ? "1." : "-";
        lines.push(`${indent}${marker} ${inlineToMarkdown(el)}`);
        for (const sub of el.children) {
          if (sub.tagName.toLowerCase() === "ul" || sub.tagName.toLowerCase() === "ol") {
            processNode(sub, sub.tagName.toLowerCase() as "ul" | "ol", depth + 1);
          }
        }
      } else if (tag === "table") {
        const rows = Array.from(el.querySelectorAll("tr"));
        rows.forEach((row, i) => {
          const cells = Array.from(row.querySelectorAll("td, th")).map(c => c.textContent?.trim() ?? "");
          lines.push(`| ${cells.join(" | ")} |`);
          if (i === 0) lines.push(`| ${cells.map(() => "---").join(" | ")} |`);
        });
        lines.push("");
      } else if (tag === "br") {
        lines.push("  ");
      } else {
        for (const child of el.childNodes) processNode(child, listType, depth);
      }
    };
    const inlineToMarkdown = (el: Element): string => {
      let result = "";
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          result += node.textContent ?? "";
        } else {
          const child = node as Element;
          const t = child.tagName?.toLowerCase();
          if (t === "strong" || t === "b") result += `**${child.textContent}**`;
          else if (t === "em" || t === "i") result += `*${child.textContent}*`;
          else if (t === "code") result += `\`${child.textContent}\``;
          else if (t === "a") result += `[${child.textContent}](${child.getAttribute("href") ?? ""})`;
          else result += child.textContent ?? "";
        }
      }
      return result;
    };
    for (const child of doc.body.childNodes) processNode(child);
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  };

  const exportMarkdown = () => {
    if (!artifact) return;
    const raw = editedContent ?? artifact.content;
    const isHtml = /<[a-z][\s\S]*>/i.test(raw);
    const content = isHtml ? htmlToMarkdown(raw) : raw;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug(artifact.title, artifact.version)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportWord = async () => {
    if (!artifact) return;
    const content = editedContent ?? artifact.content;
    const children: Paragraph[] = [];
    const isHtml = /<[a-z][\s\S]*>/i.test(content);

    if (isHtml) {
      // TipTap HTML content — parse with DOMParser
      const parsed = new DOMParser().parseFromString(content, "text/html");
      const processEl = (el: Element) => {
        const tag = el.tagName.toLowerCase();
        if (tag === "h1") {
          children.push(new Paragraph({ text: el.textContent ?? "", heading: HeadingLevel.HEADING_1 }));
        } else if (tag === "h2") {
          children.push(new Paragraph({ text: el.textContent ?? "", heading: HeadingLevel.HEADING_2 }));
        } else if (tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6") {
          children.push(new Paragraph({ text: el.textContent ?? "", heading: HeadingLevel.HEADING_3 }));
        } else if (tag === "p") {
          const text = el.textContent ?? "";
          children.push(text.trim() ? new Paragraph({ text }) : new Paragraph({}));
        } else if (tag === "ul") {
          for (const li of el.children) {
            if (li.tagName.toLowerCase() === "li") {
              children.push(new Paragraph({ text: li.textContent ?? "", bullet: { level: 0 } }));
            }
          }
        } else if (tag === "ol") {
          for (const li of el.children) {
            if (li.tagName.toLowerCase() === "li") {
              children.push(new Paragraph({ text: li.textContent ?? "", numbering: { reference: "default", level: 0 } }));
            }
          }
        } else if (tag === "table") {
          for (const row of el.querySelectorAll("tr")) {
            const cells = Array.from(row.querySelectorAll("td, th")).map(c => c.textContent ?? "");
            children.push(new Paragraph({ text: cells.join(" | ") }));
          }
        } else if (tag === "blockquote" || tag === "pre") {
          children.push(new Paragraph({ text: el.textContent ?? "" }));
        } else {
          for (const child of el.children) processEl(child);
        }
      };
      for (const child of parsed.body.children) processEl(child);
    } else {
      // Raw markdown content from AI
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.startsWith("### ")) {
          children.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }));
        } else if (line.startsWith("## ")) {
          children.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 }));
        } else if (line.startsWith("# ")) {
          children.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 }));
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
          children.push(new Paragraph({ text: line.slice(2), bullet: { level: 0 } }));
        } else if (/^\d+\.\s/.test(line)) {
          children.push(new Paragraph({ text: line.replace(/^\d+\.\s/, ""), numbering: { reference: "default", level: 0 } }));
        } else {
          children.push(new Paragraph({ children: parseInlineRuns(line) }));
        }
      }
    }

    const doc = new Document({
      numbering: {
        config: [{
          reference: "default",
          levels: [{ level: 0, format: "decimal", text: "%1.", alignment: "start" }],
        }],
      },
      sections: [{ properties: {}, children }],
    });

    const buffer = await Packer.toBlob(doc);
    const url = URL.createObjectURL(buffer);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug(artifact.title, artifact.version)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportPDF = () => {
    if (!artifact) return;
    const content = editedContent ?? artifact.content;
    // TipTap editor outputs HTML; raw AI-generated content is markdown — detect which
    const isHtml = /<[a-z][\s\S]*>/i.test(content);
    const htmlBody = isHtml ? content : renderPreview(content);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${artifact.title} v${artifact.version}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #111; font-size: 14px; line-height: 1.7; }
    h1, h2, h3 { color: #1e1b4b; margin-top: 1.5em; margin-bottom: 0.5em; }
    h1 { font-size: 22px; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px; }
    h2 { font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    h3 { font-size: 15px; }
    p { margin: 0.6em 0; }
    ul { padding-left: 1.5em; } li { margin: 0.3em 0; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; }
    th { background: #f3f4f6; font-weight: 600; }
    code { background: #f3f4f6; border-radius: 3px; padding: 1px 5px; font-family: monospace; font-size: 12px; }
    strong { font-weight: 600; } em { font-style: italic; }
    @page { margin: 2cm; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1 style="color:#3730a3">${artifact.title}</h1>
  <p style="color:#6b7280;font-size:12px;margin-bottom:2em">Version ${artifact.version} · Exported ${new Date().toLocaleDateString()}</p>
  <div>${htmlBody}</div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
    setShowExportMenu(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-white border-l border-gray-200 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Document icon */}
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {isGenerating && !artifact
                ? "Generating artifact..."
                : artifact?.title || "Artifact"}
            </h3>
            {def && (
              <p className="text-xs text-gray-500 truncate">{def.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Version badge */}
          {artifact && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium">
              v{artifact.version}
            </span>
          )}

          {/* Confidence score */}
          {artifact?.confidenceScore != null && (
            <div className="flex items-center gap-1">
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                  style={{ width: `${Math.round(artifact.confidenceScore * 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {Math.round(artifact.confidenceScore * 100)}%
              </span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      {artifact && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50 shrink-0">
          {/* Edit/Preview toggle */}
          <div className="flex items-center bg-gray-200 rounded-md p-0.5 mr-1">
            <button
              onClick={() => setViewMode("edit")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === "edit"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                viewMode === "preview"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Preview
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={editedContent === null || isSaving}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1"
            >
              Export
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExportMenu && (
              <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-lg border border-gray-200 shadow-lg z-50 overflow-hidden">
                <button
                  onClick={exportMarkdown}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-base">📄</span>
                  Markdown (.md)
                </button>
                <button
                  onClick={exportWord}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-base">📝</span>
                  Word (.docx)
                </button>
                <button
                  onClick={exportPDF}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-base">📕</span>
                  PDF (print)
                </button>
              </div>
            )}
          </div>
          {onImprove && (
            <button
              onClick={onImprove}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              Improve with AI
            </button>
          )}
          <div className="flex-1" />
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              artifact.status === "approved"
                ? "bg-green-100 text-green-700"
                : artifact.status === "awaiting_approval"
                ? "bg-amber-100 text-amber-700"
                : artifact.status === "rejected"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {artifact.status.replace(/_/g, " ")}
          </span>
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {isGenerating && !artifact ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-100" />
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                Generating artifact...
              </p>
              <p className="text-xs text-gray-500 mt-1">
                AI is creating your document
              </p>
            </div>
          </div>
        ) : artifact ? (
          viewMode === "preview" ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div
                className="prose text-sm text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const c = editedContent ?? artifact.content;
                    return /<[a-z][\s\S]*>/i.test(c) ? c : renderPreview(c);
                  })()
                }}
              />
            </div>
          ) : (
          <ArtifactEditor
            content={artifact.content}
            onChange={setEditedContent}
            editable={artifact.status !== "approved"}
          />
          )
        ) : null}
      </div>
    </div>
  );
}

function renderPreview(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}

/** Convert a markdown inline string to an array of docx TextRun objects. */
function parseInlineRuns(line: string): TextRun[] {
  const runs: TextRun[] = [];
  // Tokenise **bold**, *italic*, `code`, and plain text
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|([^*`]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    if (match[1]) {
      runs.push(new TextRun({ text: match[1], bold: true }));
    } else if (match[2]) {
      runs.push(new TextRun({ text: match[2], italics: true }));
    } else if (match[3]) {
      runs.push(new TextRun({ text: match[3], font: "Courier New", size: 20 }));
    } else if (match[4]) {
      runs.push(new TextRun({ text: match[4] }));
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text: line })];
}
