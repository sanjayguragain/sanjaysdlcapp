"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/core";

function sanitizeMermaidEditorCode(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/^\s*%%\s*mermaid\s*\n?/i, "")
    .replace(/^\s*```\s*mermaid\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

// ─── React NodeView component ─────────────────────────────────────────────────

function MermaidNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const code = (node.attrs.code as string) ?? "";
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState(code);

  // Keep local edit buffer in sync when the node attribute is updated externally
  useEffect(() => {
    setEditCode(code);
  }, [code]);

  const handleApply = useCallback(() => {
    updateAttributes({ code: sanitizeMermaidEditorCode(editCode) });
    setIsEditing(false);
  }, [editCode, updateAttributes]);

  const handleCancel = useCallback(() => {
    setEditCode(code);
    setIsEditing(false);
  }, [code]);

  const isEditable = editor?.isEditable ?? false;

  return (
    // contentEditable=false stops the browser inserting carets inside the atom node
    <NodeViewWrapper contentEditable={false}>
      <div className="my-4 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden select-none">

        {/* ── Diagram view ── */}
        {!isEditing && (
          <div className="p-4 overflow-x-auto bg-slate-950">
            <pre className="text-xs text-slate-100 font-mono whitespace-pre-wrap">{code}</pre>
          </div>
        )}

        {/* ── Code editor ── */}
        {isEditing && (
          <div className="p-3 bg-gray-900">
            <div className="text-xs text-gray-400 mb-1 font-mono select-text">mermaid</div>
            <textarea
              className="w-full min-h-[140px] bg-gray-800 text-green-300 font-mono text-xs p-2 rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-edison-400 resize-y select-text"
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              spellCheck={false}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handleApply}
                className="px-3 py-1 text-xs bg-edison-600 text-white rounded hover:bg-edison-700 transition-colors"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Footer bar ── */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            {/* Mermaid squiggle icon */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
            Mermaid Source
          </div>
          {isEditable && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs text-edison-600 hover:text-edison-800 flex items-center gap-1 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Code
            </button>
          )}
          {isEditable && isEditing && (
            <span className="text-xs text-amber-600">editing…</span>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// ─── TipTap Node Extension ────────────────────────────────────────────────────

export const MermaidBlock = Node.create({
  name: "mermaidBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      code: {
        default: "",
        parseHTML: (element) => {
          // Case 1: <pre class="mermaid">graph TD...</pre>  (AI-generated)
          if (element.classList.contains("mermaid")) {
            return element.textContent?.trim() ?? "";
          }
          // Case 2: <pre><code>%% mermaid\ngraph TD...</code></pre>  (toolbar-inserted)
          const raw = (
            element.querySelector("code")?.textContent ?? element.textContent ?? ""
          ).trim();
          return raw.replace(/^%%\s*mermaid\s*\n?/i, "").trim();
        },
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [
      // Rule 1: <pre class="mermaid">  — what the AI generates
      {
        tag: "pre.mermaid",
        priority: 1001,
      },
      // Rule 2: <pre><code>%% mermaid…</code></pre>  — toolbar / legacy format
      {
        tag: "pre",
        priority: 1000,
        getAttrs(node) {
          const element = node as HTMLElement;
          const text = (
            element.querySelector("code")?.textContent ?? element.textContent ?? ""
          ).trim();
          if (!/^%%\s*mermaid\b/i.test(text)) return false;
          return {};
        },
      },
    ];
  },

  renderHTML({ node }) {
    // Emit <pre class="mermaid">…</pre> — matched by Rule 1 on reload,
    // and recognised by mermaidRender.ts extractMermaidCodeFromPre().
    return ["pre", mergeAttributes({ class: "mermaid" }), node.attrs.code as string];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView);
  },
});
