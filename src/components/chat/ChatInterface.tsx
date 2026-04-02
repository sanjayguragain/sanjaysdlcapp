"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { Button } from "@/components/ui/Button";
import { ArtifactType, ARTIFACT_DEFINITIONS } from "@/types";
import { DocumentUpload } from "@/components/documents/DocumentUpload";

interface Document {
  id: string;
  name: string;
  type: string;
  content: string;
  createdAt: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  metadata?: string | null;
}

interface QuickReplyOption {
  label: string;
  value: string;
}

interface ChatInterfaceProps {
  projectId: string;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  onQuickReply?: (value: string) => Promise<void> | void;
  quickReplies?: QuickReplyOption[];
  onGenerateArtifact: (type: ArtifactType) => Promise<void>;
  sdlcMode?: "modern" | "traditional";
  isLoading: boolean;
  documents?: Document[];
  onDocumentUploaded?: (doc: Document) => void;
  onDocumentDeleted?: (id: string) => void;
  existingArtifactTypes?: ArtifactType[];
}

const MODERN_QUICK_ACTIONS = [
  { label: "Generate PRD", type: "prd" as ArtifactType },
  { label: "Risk Analysis", type: "cyber_risk_analysis" as ArtifactType },
  { label: "Compliance Report", type: "compliance_report" as ArtifactType },
  { label: "Test Plan", type: "test_plan" as ArtifactType },
  { label: "Deployment Plan", type: "deployment_plan" as ArtifactType },
];

const TRADITIONAL_QUICK_ACTIONS = [
  { label: "Create BRD", type: "brd" as ArtifactType },
  { label: "Create AVD", type: "avd" as ArtifactType },
  { label: "Create SRS", type: "srs" as ArtifactType },
  { label: "Create SAD", type: "sad" as ArtifactType },
  { label: "Create SES", type: "ses" as ArtifactType },
];

const TRADITIONAL_ARTIFACT_MENU = [
  { type: "brd" as ArtifactType, label: "Business Requirements Document", description: "Business objectives, scope, and requirements" },
  { type: "avd" as ArtifactType, label: "Architecture Vision Document", description: "Target architecture vision and constraints" },
  { type: "srs" as ArtifactType, label: "System Requirements Specification", description: "Functional and non-functional system requirements" },
  { type: "sad" as ArtifactType, label: "Solution Architecture Definition", description: "Solution architecture and deployment views" },
  { type: "ses" as ArtifactType, label: "System Engineering Specification", description: "Engineering-level specs and readiness criteria" },
];

const ARTIFACT_DELIM_START = "<<<ARTIFACT_UPDATE>>>";
const ARTIFACT_DELIM_END = "<<<END_ARTIFACT_UPDATE>>>";
const QA_DONE_MARKER = "<<<ALL_QUESTIONS_ANSWERED>>>";

function sanitizeAssistantForChat(content: string): string {
  if (!content) return content;

  // Remove internal control marker if present.
  let cleaned = content.replace(new RegExp(QA_DONE_MARKER, "g"), "").trim();

  // Strip any trailing JSON confidence/review blocks the model may append.
  // Matches patterns like: ```json\n{ ... }\n``` or ```\n{ ... }\n```
  cleaned = cleaned.replace(/\n*`{2,}(?:json)?\s*\n\s*\{[\s\S]*?\}\s*\n`{2,}/g, "").trim();
  // Also strip a trailing "Confidence & review flag" label line that precedes such blocks.
  cleaned = cleaned.replace(/\n*Confidence\s*[&and]+\s*review\s*flag[^\n]*\n*/gi, "").trim();

  // Strip replayed Q&A history: the model sometimes prepends all prior Q&A separated by
  // "---" lines before giving the actual answer. Keep only the last "---" segment.
  const qaSegments = cleaned.split(/\n\s*---+\s*\n/);
  if (qaSegments.length > 1) {
    cleaned = qaSegments[qaSegments.length - 1].trim();
  }

  // If an artifact payload is present, keep only user-facing text around delimiters.
  const startIdx = cleaned.indexOf(ARTIFACT_DELIM_START);
  if (startIdx !== -1) {
    const endIdx = cleaned.indexOf(ARTIFACT_DELIM_END, startIdx);
    const pre = cleaned.slice(0, startIdx).replace(/\s*-{3,}\s*$/, "").trim();
    const post = endIdx !== -1
      ? cleaned.slice(endIdx + ARTIFACT_DELIM_END.length).replace(/^\s*-{3,}\s*/, "").trim()
      : "";
    return [pre, post].filter(Boolean).join("\n\n");
  }

  // Backward-compat safety: old messages may contain full HTML artifact bodies without delimiters.
  const htmlTagCount = (cleaned.match(/<\/?(h[1-6]|p|ul|ol|li|table|tr|td|th|br|strong|em)\b/gi) || []).length;
  if (htmlTagCount >= 8 && cleaned.length > 400) {
    return "The document content is available in the editor panel. Chat shows only summary updates.";
  }

  return cleaned;
}

export function ChatInterface({
  projectId,
  messages,
  onSendMessage,
  onQuickReply,
  quickReplies = [],
  onGenerateArtifact,
  sdlcMode = "modern",
  isLoading,
  documents = [],
  onDocumentUploaded,
  onDocumentDeleted,
  existingArtifactTypes = [],
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [showArtifactMenu, setShowArtifactMenu] = useState(false);
  const [showDocPanel, setShowDocPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const quickActions = sdlcMode === "traditional" ? TRADITIONAL_QUICK_ACTIONS : MODERN_QUICK_ACTIONS;
  const artifactMenuItems = sdlcMode === "traditional"
    ? TRADITIONAL_ARTIFACT_MENU
    : ARTIFACT_DEFINITIONS;

  const handleDocUpload = useCallback((doc: Document) => {
    onDocumentUploaded?.(doc);
  }, [onDocumentUploaded]);

  const handleDocDelete = useCallback((id: string) => {
    onDocumentDeleted?.(id);
  }, [onDocumentDeleted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    await onSendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Chat header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-edison-blue-500 to-edison-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              Edison SDLC Assistant
            </h3>
            <p className="text-xs text-gray-500">
              {sdlcMode === "traditional"
                ? "Traditional SDLC mode: BRD, AVD, SRS, SAD, SES"
                : "Generate and refine documentation artifacts"}
            </p>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              sdlcMode === "traditional"
                ? "bg-teal-50 text-teal-700 border-teal-200"
                : "bg-slate-50 text-slate-700 border-slate-200"
            }`}
          >
            {sdlcMode === "traditional" ? "Traditional SDLC" : "Modern SDLC"}
          </span>
        </div>

        {/* Document upload button */}
        <button
          onClick={() => setShowDocPanel(!showDocPanel)}
          title="Upload supporting documents"
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors mr-2 ${
            showDocPanel
              ? "bg-edison-50 border-edison-200 text-edison-700"
              : "bg-white border-gray-200 text-gray-600 hover:border-edison-300 hover:text-edison-600"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          Docs
          {documents.length > 0 && (
            <span className="ml-0.5 bg-edison-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {documents.length}
            </span>
          )}
        </button>

        {/* Generate artifact button */}
        <div className="relative">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowArtifactMenu(!showArtifactMenu)}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate Artifact
          </Button>

          {showArtifactMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
              {artifactMenuItems.map((def) => {
                const isGenerated = existingArtifactTypes.includes(def.type);
                return (
                  <button
                    key={def.type}
                    onClick={() => {
                      onGenerateArtifact(def.type);
                      setShowArtifactMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{def.label}</p>
                      {isGenerated && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Generated
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{def.description}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Document upload panel */}
      {showDocPanel && (
        <div className="border-b border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-800">Supporting Documents</p>
            <button
              onClick={() => setShowDocPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Upload meeting transcripts, emails, or briefs — the AI uses these to generate more accurate artifacts.
          </p>
          <DocumentUpload
            projectId={projectId}
            documents={documents}
            onUpload={handleDocUpload}
            onDelete={handleDocDelete}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 scroll-pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-edison-blue-500 to-edison-600 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Edison SDLC Assistant
            </h3>
            <p className="text-sm text-gray-500 max-w-md mb-6">
              I can help you generate product documentation artifacts, analyze
              requirements, identify risks, and plan deployments.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickActions.map((action) => (
                <button
                  key={action.type}
                  onClick={() => onGenerateArtifact(action.type)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-edison-300 hover:text-edison-600 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const metadata = msg.metadata ? JSON.parse(msg.metadata) : null;
          const safeContent = msg.role === "assistant"
            ? sanitizeAssistantForChat(msg.content)
            : msg.content;
          if (msg.role === "assistant" && !safeContent.trim()) return null;
          return (
            <MessageBubble
              key={msg.id}
              role={msg.role as "user" | "assistant"}
              content={safeContent}
              timestamp={msg.createdAt}
              isArtifact={metadata?.isArtifact}
              confidenceScore={metadata?.confidenceScore}
            />
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-edison-blue-500 to-edison-600 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-2 shrink-0" />
      </div>

      {/* Input */}
      <div
        className="px-4 pt-3 bg-white border-t border-gray-200"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {quickReplies.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {quickReplies.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={isLoading}
                onClick={() => {
                  if (onQuickReply) {
                    void onQuickReply(option.value);
                  } else {
                    void onSendMessage(option.value);
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-full border border-edison-200 text-edison-700 bg-edison-50 hover:bg-edison-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your project, ask questions, or request an artifact..."
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3.5 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-edison-500 focus:border-transparent max-h-32 overflow-y-auto"
              rows={2}
              style={{
                height: "auto",
                minHeight: "64px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 128) + "px";
              }}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!input.trim() || isLoading}
            className="shrink-0 self-end !rounded-xl h-[44px] w-[44px] !p-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h12" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 6l6 6-6 6" />
            </svg>
          </Button>
        </form>
      </div>
    </div>
  );
}
