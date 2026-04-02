"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ChatInterface } from "@/components/chat/ChatInterface";
import {
  ArtifactSidePanel,
  SidePanelArtifact,
} from "@/components/artifacts/ArtifactSidePanel";
import { ArtifactType } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  metadata?: string | null;
}

function extractHeadingNames(content: string): string[] {
  if (!content) return [];
  const headings: string[] = [];

  const htmlHeadings = Array.from(content.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi));
  for (const m of htmlHeadings) {
    const name = (m[1] || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (name) headings.push(name);
  }

  const mdHeadings = Array.from(content.matchAll(/^#{1,6}\s+(.+)$/gim));
  for (const m of mdHeadings) {
    const name = (m[1] || "").replace(/\s+/g, " ").trim();
    if (name) headings.push(name);
  }

  return headings;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceSectionByHeading(existing: string, incoming: string, heading: string): string {
  const escaped = escapeRegExp(heading);
  const htmlSection = new RegExp(
    `<h[1-6]\\b[^>]*>\\s*${escaped}\\s*<\\/h[1-6]>([\\s\\S]*?)(?=<h[1-6]\\b|$)`,
    "i"
  );
  if (htmlSection.test(existing)) {
    return existing.replace(htmlSection, incoming);
  }

  const mdSection = new RegExp(
    `^#{1,6}\\s+${escaped}\\s*$([\\s\\S]*?)(?=^#{1,6}\\s+|$)`,
    "im"
  );
  if (mdSection.test(existing)) {
    return existing.replace(mdSection, incoming);
  }

  return `${existing.trimEnd()}\n\n${incoming.trim()}`;
}

function mergeArtifactContent(existing: string, incoming: string): string {
  if (!existing) return incoming;
  if (!incoming) return existing;

  const existingTrim = existing.trim();
  const incomingTrim = incoming.trim();
  if (!incomingTrim) return existing;

  const existingHeadings = extractHeadingNames(existingTrim);
  const incomingHeadings = extractHeadingNames(incomingTrim);

  const clearlyPartial =
    incomingTrim.length < Math.max(500, Math.floor(existingTrim.length * 0.8)) ||
    (existingHeadings.length >= 3 && incomingHeadings.length > 0 && incomingHeadings.length < existingHeadings.length);

  if (!clearlyPartial) return incomingTrim;

  if (incomingHeadings.length === 0) {
    return `${existingTrim}\n\n${incomingTrim}`;
  }

  let merged = existingTrim;
  let changed = false;
  for (const heading of incomingHeadings) {
    const sectionRegex = new RegExp(
      `<h[1-6]\\b[^>]*>\\s*${escapeRegExp(heading)}\\s*<\\/h[1-6]>([\\s\\S]*?)(?=<h[1-6]\\b|$)`,
      "i"
    );
    const sectionMatch = incomingTrim.match(sectionRegex);
    const incomingSection = sectionMatch ? sectionMatch[0].trim() : incomingTrim;
    const next = replaceSectionByHeading(merged, incomingSection, heading);
    if (next !== merged) changed = true;
    merged = next;
  }

  return changed ? merged : `${existingTrim}\n\n${incomingTrim}`;
}

interface Project {
  id: string;
  name: string;
  sdlcMode?: "modern" | "traditional" | null;
}

interface Document {
  id: string;
  name: string;
  type: string;
  content: string;
  createdAt: string;
}

interface FeedbackSyncSummary {
  syncedAt: string;
  sourceArtifacts: Array<{ id: string; type: string; title: string }>;
  before: { overallScore: number; recommendations: number; blockers: number };
  after: { overallScore: number; recommendations: number; blockers: number };
  delta: { overallScore: number; recommendations: number; blockers: number };
}

type CompletionChoiceState = {
  artifactId: string;
  artifactTitle: string;
};

const TRADITIONAL_DOC_PROMPTS: Record<string, { label: string; prompt: string }> = {
  brd: {
    label: "BRD",
    prompt: "Create a detailed Business Requirements Document (BRD) for this project. Include business goals, scope, stakeholders, current-state pain points, proposed business capabilities, assumptions, dependencies, risks, and measurable success criteria.",
  },
  avd: {
    label: "AVD",
    prompt: "Create an Architecture Vision Document (AVD) for this project. Include architectural principles, high-level target architecture, constraints, key integration points, technology choices, and architecture decisions with rationale. Include a dedicated System Context Diagram section and at least one Integration or Deployment diagram using Mermaid. Use renderable Mermaid format exactly as either <pre class=\"mermaid\">graph TD ...</pre> or fenced code block with ```mermaid.",
  },
  srs: {
    label: "SRS",
    prompt: "Create a System Requirements Specification (SRS) for this project. Include functional requirements, non-functional requirements, external interfaces, data requirements, constraints, assumptions, and acceptance criteria.",
  },
  sad: {
    label: "SAD",
    prompt: "Create a Solution Architecture Definition (SAD) for this project. Include component architecture, deployment view, data flow, integration patterns, security controls, observability considerations, and scalability strategy.",
  },
  ses: {
    label: "SES",
    prompt: "Create a System Engineering Specification (SES) for this project. Include engineering-level specifications, module responsibilities, interface contracts, operational constraints, testability requirements, and release readiness criteria.",
  },
};

export default function ProjectChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeArtifact, setActiveArtifact] =
    useState<SidePanelArtifact | null>(null);
  const [isGeneratingArtifact, setIsGeneratingArtifact] = useState(false);
  const [generatingArtifactType, setGeneratingArtifactType] = useState<ArtifactType | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [lastRequestedArtifactType, setLastRequestedArtifactType] = useState<ArtifactType | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [generatedArtifactTypes, setGeneratedArtifactTypes] = useState<ArtifactType[]>([]);
  const [pendingCompletionChoice, setPendingCompletionChoice] = useState<CompletionChoiceState | null>(null);
  // Guided Q&A state — tracks which artifact we're answering questions for
  // and whether the user has replied in this Q&A round.
  const [qaMode, setQaMode] = useState<{ artifactId: string; hasUserResponse: boolean } | null>(null);
  const qaModeRef = useRef<{ artifactId: string; hasUserResponse: boolean } | null>(null);
  const qaTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autofillTriggerRef = useRef<(() => Promise<void>) | null>(null);
  const traditionalSeedTriggeredRef = useRef(false);
  const sdlcMode: "modern" | "traditional" =
    searchParams.get("sdlcMode") === "traditional"
      ? "traditional"
      : project?.sdlcMode === "traditional"
      ? "traditional"
      : "modern";

  const artifactNeedsClarification = (content: string) =>
    /\[To be confirmed/i.test(content);

  const promptForCompletionChoice = useCallback((artifactId: string, artifactTitle: string) => {
    setPendingCompletionChoice({ artifactId, artifactTitle });
    setMessages((prev) => [
      ...prev,
      {
        id: "completion-choice-" + Date.now(),
        role: "assistant",
        content:
          `Would you like to complete **${artifactTitle}** using industry best practices automatically, or answer clarifying questions?\n\n` +
          `Reply with:\n` +
          `1) Autofill with industry best practices\n` +
          `2) Answer clarifying questions`,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const startClarifyingQuestions = useCallback(async (artifactId: string) => {
    setIsLoading(true);
    try {
      const qRes = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clarifyArtifact: true, artifactId }),
      });

      if (!qRes.ok) return;
      const qData = await qRes.json();
      if (qData.assistantMessage) {
        setMessages((prev) => [
          ...prev,
          {
            id: qData.assistantMessage.id,
            role: "assistant",
            content: qData.assistantMessage.content,
            createdAt: qData.assistantMessage.createdAt,
          },
        ]);

        if (qData.assistantMessage.content.includes("**Q1.**")) {
          setQaMode({ artifactId, hasUserResponse: false });
          if (qaTimerRef.current) {
            clearTimeout(qaTimerRef.current);
            qaTimerRef.current = null;
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    async function load() {
      try {
        const [projRes, chatRes, docsRes, artifactsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/chat`),
          fetch(`/api/projects/${projectId}/documents`),
          fetch(`/api/projects/${projectId}/artifacts`),
        ]);
        if (projRes.ok) {
          const data = await projRes.json();
          setProject(data);
        }
        if (chatRes.ok) {
          const data = await chatRes.json();
          setMessages(data.messages || []);
        }
        if (docsRes.ok) {
          const data = await docsRes.json();
          setDocuments(data.documents || []);
        }
        if (artifactsRes.ok) {
          const data = await artifactsRes.json();
          setGeneratedArtifactTypes(
            (data.artifacts || []).map((a: { type: ArtifactType }) => a.type)
          );
        }
      } catch {
        // ignore
      }
    }
    load();
  }, [projectId]);

  // If arriving from artifact detail page with ?artifact=<id>, open it in side panel
  useEffect(() => {
    const artifactId = searchParams.get("artifact");
    if (!artifactId) return;
    async function openArtifact() {
      try {
        const res = await fetch(`/api/projects/${projectId}/artifacts/${artifactId}`);
        if (res.ok) {
          const data = await res.json();
          setActiveArtifact({
            id: data.id,
            type: data.type,
            title: data.title,
            content: data.content,
            version: data.version ?? 1,
            status: data.status,
            confidenceScore: data.confidenceScore,
          });
          const greeting: Message = {
            id: "edit-hint-" + data.id,
            role: "assistant",
            content: `I've opened the **${data.title}** artifact for editing. You can edit it directly in the panel on the right, or describe what changes you'd like and I'll help you revise it.`,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => {
            // avoid duplicate greeting if message already exists
            if (prev.some((m) => m.id === greeting.id)) return prev;
            return [...prev, greeting];
          });
        }
      } catch {
        // ignore
      }
    }
    openArtifact();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, searchParams]);

  // Clear Q&A timer on unmount
  useEffect(() => () => { if (qaTimerRef.current) clearTimeout(qaTimerRef.current); }, []);

  // Keep latest Q&A mode available to delayed callbacks (idle timer, async rebuild triggers)
  useEffect(() => {
    qaModeRef.current = qaMode;
  }, [qaMode]);

  // Auto-generate an artifact when arriving with ?autoGenerate=<type> (e.g. from new project wizard)
  const autoGenerateTriggeredRef = React.useRef(false);
  useEffect(() => {
    const autoType = searchParams.get("autoGenerate") as ArtifactType | null;
    if (!autoType || autoGenerateTriggeredRef.current) return;
    autoGenerateTriggeredRef.current = true;

    // Show an immediate greeting so the user knows what's happening
    setMessages([{
      id: "auto-gen-hint",
      role: "assistant",
      content: "I'm reading your uploaded documents and generating a PRD now. This may take a moment — you'll see the document appear in the editor on the right when it's ready.",
      createdAt: new Date().toISOString(),
    }]);

    // Small delay to let the page fully mount before triggering generation
    const timer = setTimeout(() => {
      // handleGenerateArtifact is defined below; trigger via the artifacts API directly
      setIsLoading(true);
      setIsGeneratingArtifact(true);
      setGeneratingArtifactType(autoType);
      fetch(`/api/projects/${projectId}/artifacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: autoType }),
      })
        .then(async (res) => {
          let data;
          if (res.ok) {
            data = await res.json();
          } else if (res.status === 409) {
            const listRes = await fetch(`/api/projects/${projectId}/artifacts`);
            if (listRes.ok) {
              const listData = await listRes.json();
              data = listData.artifacts?.find((a: { type: string }) => a.type === autoType);
            }
          }
          if (data) {
            setActiveArtifact({
              id: data.id,
              type: data.type,
              title: data.title,
              content: data.content,
              version: data.version ?? 1,
              status: data.status,
              confidenceScore: data.confidenceScore,
            });
            const needsClarification = artifactNeedsClarification(data.content);
            setMessages((prev) => [
              ...prev,
              {
                id: "auto-gen-done",
                role: "assistant",
                content: needsClarification
                  ? `Your **${data.title}** has been generated based on your uploaded documents. Review it in the panel on the right and choose how you'd like to complete it.`
                  : `Your **${data.title}** has been generated. Review it in the panel on the right.`,
                createdAt: new Date().toISOString(),
                metadata: JSON.stringify({ isArtifact: true, artifactId: data.id }),
              },
            ]);
            if (needsClarification) {
              promptForCompletionChoice(data.id, data.title);
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsLoading(false);
          setIsGeneratingArtifact(false);
          setGeneratingArtifactType(null);
        });
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, searchParams, promptForCompletionChoice]);

  // ── Rebuild artifact with all collected answers ──────────────────────────
  const triggerRebuild = useCallback(async (artifactId: string) => {
    const currentQaMode = qaModeRef.current;
    if (!currentQaMode || currentQaMode.artifactId !== artifactId || !currentQaMode.hasUserResponse) {
      return;
    }
    if (qaTimerRef.current) { clearTimeout(qaTimerRef.current); qaTimerRef.current = null; }
    setQaMode(null);
    setIsLoading(true);
    const buildingId = "rebuild-" + Date.now();
    setMessages((prev) => [
      ...prev,
      { id: buildingId, role: "assistant", content: "Got all your answers — building the updated document now...", createdAt: new Date().toISOString() },
    ]);

    const DELIM_START = "<<<ARTIFACT_UPDATE>>>";
    const DELIM_END = "<<<END_ARTIFACT_UPDATE>>>";
    const splitRebuild = (full: string): { chat: string; artifactContent: string | null } => {
      const si = full.indexOf(DELIM_START);
      if (si === -1) return { chat: full, artifactContent: null };
      const ei = full.indexOf(DELIM_END, si);
      const artifactContent = ei !== -1 ? full.slice(si + DELIM_START.length, ei).trim() : full.slice(si + DELIM_START.length).trim();
      const pre = full.slice(0, si).replace(/\s*-{3,}\s*$/, "").trim();
      const post = ei !== -1 ? full.slice(ei + DELIM_END.length).replace(/^\s*-{3,}\s*/, "").trim() : "";
      return { chat: [pre, post].filter(Boolean).join("\n\n") || "The document has been updated.", artifactContent: artifactContent || null };
    };
    const toDisplayRebuild = (acc: string): string => {
      const si = acc.indexOf(DELIM_START);
      if (si === -1) return acc;
      const pre = acc.slice(0, si).replace(/\s*-{3,}\s*$/, "").trim();
      const ei = acc.indexOf(DELIM_END, si);
      if (ei === -1) return pre || "Updating the document\u2026";
      const post = acc.slice(ei + DELIM_END.length).replace(/^\s*-{3,}\s*/, "").trim();
      return [pre, post].filter(Boolean).join("\n\n") || "The document has been updated.";
    };
    const applyRebuildUpdate = (newContent: string) => {
      const mergedContent = newContent;
      setActiveArtifact((prev) => prev ? { ...prev, content: mergedContent } : null);
      fetch(`/api/projects/${projectId}/artifacts?artifactId=${artifactId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: mergedContent }),
      }).then((r) => r.ok ? r.json() : null).then((data) => {
        if (data) {
          setActiveArtifact((prev) =>
            prev
              ? {
                  ...prev,
                  content: data.content,
                  version: data.version,
                  confidenceScore: data.confidenceScore ?? prev.confidenceScore,
                }
              : null
          );
        }
      }).catch(() => {});
    };

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rebuildArtifact: true, artifactId }),
      });
      if (!res.ok || !res.body) { setMessages((prev) => prev.filter((m) => m.id !== buildingId)); return; }

      const ct = res.headers.get("Content-Type") ?? "";
      if (ct.includes("text/event-stream")) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "", streamed = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim(); if (!payload) continue;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.token) {
                streamed += parsed.token;
                setMessages((prev) => prev.map((m) => m.id === buildingId ? { ...m, content: toDisplayRebuild(streamed) } : m));
              }
              if (parsed.done) {
                const raw = parsed.assistantMessage?.content ?? streamed;
                const { chat, artifactContent } = splitRebuild(raw);
                const finalMsg: Message = { id: parsed.assistantMessage?.id ?? buildingId, role: "assistant", content: chat, createdAt: parsed.assistantMessage?.createdAt ?? new Date().toISOString() };
                setMessages((prev) => prev.map((m) => m.id === buildingId ? finalMsg : m));
                if (artifactContent) applyRebuildUpdate(artifactContent);
              }
            } catch { /* ignore */ }
          }
        }
      } else {
        const data = await res.json();
        const { chat, artifactContent } = splitRebuild(data.assistantMessage?.content ?? "");
        setMessages((prev) => prev.map((m) => m.id === buildingId ? { ...(data.assistantMessage ?? {}), id: buildingId, role: "assistant", content: chat } : m));
        if (artifactContent) applyRebuildUpdate(artifactContent);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== buildingId));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);
  // ────────────────────────────────────────────────────────────────────────────

  const handleSendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();

      // First-time artifact completion choice flow.
      if (pendingCompletionChoice && activeArtifact && pendingCompletionChoice.artifactId === activeArtifact.id) {
        const userMsg: Message = {
          id: "choice-user-" + Date.now(),
          role: "user",
          content,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);

        const normalized = trimmed.toLowerCase();
        const choseAutofill =
          normalized === "1" ||
          /autofill|best\s*practice|industry\s*best\s*practice|auto\s*fill/.test(normalized);
        const choseQuestions =
          normalized === "2" ||
          /question|clarify|q&a|qa|answer/.test(normalized);

        if (choseAutofill) {
          setPendingCompletionChoice(null);
          if (autofillTriggerRef.current) {
            await autofillTriggerRef.current();
          }
          return;
        }

        if (choseQuestions) {
          setPendingCompletionChoice(null);
          await startClarifyingQuestions(activeArtifact.id);
          return;
        }

        // Unrecognised input — dismiss the choice dialog and fall through to normal chat
        setPendingCompletionChoice(null);
      }

      const tempUserId = "temp-user-" + Date.now();
      const tempMsg: Message = {
        id: tempUserId,
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempMsg]);
      setIsLoading(true);

      // Add a streaming placeholder for the assistant reply
      const tempAiId = "temp-ai-" + Date.now();
      const streamingMsg: Message = {
        id: tempAiId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, streamingMsg]);

      // Start/reset Q&A idle timer only after a real user response.
      if (qaMode) {
        setQaMode((prev) => prev ? { ...prev, hasUserResponse: true } : prev);
        if (qaTimerRef.current) clearTimeout(qaTimerRef.current);
        qaTimerRef.current = setTimeout(() => triggerRebuild(qaMode.artifactId), 2 * 60 * 1000);
      }

      try {
        const body: Record<string, unknown> = { content };
        if (qaMode && activeArtifact) {
          // Q&A mode: answering clarifying questions about the artifact
          body.artifactId = activeArtifact.id;
          body.editArtifact = false;
        } else if (activeArtifact) {
          // Artifact is open but user is asking a general question — inject full artifact as read context
          body.viewingArtifactId = activeArtifact.id;
        }

        const res = await fetch(`/api/projects/${projectId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok || !res.body) {
          setMessages((prev) =>
            prev.filter((m) => m.id !== tempUserId && m.id !== tempAiId)
          );
          return;
        }

        const contentType = res.headers.get("Content-Type") ?? "";

        // Strip the artifact block and QA-done marker from a message
        const DELIM_START = "<<<ARTIFACT_UPDATE>>>";
        const DELIM_END = "<<<END_ARTIFACT_UPDATE>>>";
        const QA_DONE = "<<<ALL_QUESTIONS_ANSWERED>>>";
        const stripQaDone = (s: string) => s.replace(/<<<ALL_QUESTIONS_ANSWERED>>>/g, "").trim();

        const splitArtifact = (fullContent: string): { chat: string; artifactContent: string | null; qaComplete: boolean } => {
          const qaComplete = fullContent.includes(QA_DONE);
          const cleaned = stripQaDone(fullContent);
          const startIdx = cleaned.indexOf(DELIM_START);
          if (startIdx === -1) return { chat: cleaned, artifactContent: null, qaComplete };
          const endIdx = cleaned.indexOf(DELIM_END, startIdx);
          const artifactContent = endIdx !== -1
            ? cleaned.slice(startIdx + DELIM_START.length, endIdx).trim()
            : cleaned.slice(startIdx + DELIM_START.length).trim();
          const pre = cleaned.slice(0, startIdx).replace(/\s*-{3,}\s*$/, "").trim();
          const post = endIdx !== -1
            ? cleaned.slice(endIdx + DELIM_END.length).replace(/^\s*-{3,}\s*/, "").trim()
            : "";
          const chat = [pre, post].filter(Boolean).join("\n\n") || "The document has been updated.";
          return { chat, artifactContent: artifactContent || null, qaComplete };
        };

        // During streaming: hide HTML inside the artifact block; surface post-delimiter text 
        // (next questions). Also hide the QA_DONE marker entirely.
        const toDisplayContent = (accumulated: string): string => {
          const cleaned = stripQaDone(accumulated);
          const startIdx = cleaned.indexOf(DELIM_START);
          if (startIdx === -1) return cleaned;
          const pre = cleaned.slice(0, startIdx).replace(/\s*-{3,}\s*$/, "").trim();
          const endIdx = cleaned.indexOf(DELIM_END, startIdx);
          if (endIdx === -1) return pre || "Updating the document\u2026";
          const post = cleaned.slice(endIdx + DELIM_END.length).replace(/^\s*-{3,}\s*/, "").trim();
          return [pre, post].filter(Boolean).join("\n\n") || "The document has been updated.";
        };

        // Apply extracted artifact content to the side panel and save
        const applyArtifactUpdate = (artifactContent: string) => {
          if (!activeArtifact) return;
          const mergedContent = artifactContent;
          setActiveArtifact((prev) => prev ? { ...prev, content: mergedContent } : null);
          fetch(`/api/projects/${projectId}/artifacts?artifactId=${activeArtifact.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: mergedContent }),
          }).then((r) => r.ok ? r.json() : null).then((data) => {
            if (data) {
              setActiveArtifact((prev) =>
                prev
                  ? {
                      ...prev,
                      content: data.content,
                      version: data.version,
                      confidenceScore: data.confidenceScore ?? prev.confidenceScore,
                    }
                  : null
              );
            }
          }).catch(() => {});
        };

        if (contentType.includes("text/event-stream")) {
          // Streaming mode: consume SSE tokens
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let streamedContent = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (!payload) continue;
              try {
                const parsed = JSON.parse(payload);
                if (parsed.token) {
                  streamedContent += parsed.token;
                  // Only show the pre-delimiter portion while streaming
                  const display = toDisplayContent(streamedContent);
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === tempAiId ? { ...m, content: display } : m
                    )
                  );
                }
                if (parsed.done) {
                  const raw = parsed.assistantMessage?.content ?? streamedContent;
                  const { chat, artifactContent, qaComplete } = splitArtifact(raw);
                  const cleanMsg = { ...parsed.assistantMessage, content: chat };
                  setMessages((prev) => {
                    const filtered = prev.filter(
                      (m) => m.id !== tempUserId && m.id !== tempAiId
                    );
                    return [...filtered, parsed.userMessage, cleanMsg];
                  });
                  if (artifactContent) applyArtifactUpdate(artifactContent);
                  // AI signalled all questions answered — rebuild immediately
                  if (qaComplete && activeArtifact) {
                    setTimeout(() => triggerRebuild(activeArtifact.id), 200);
                  }
                }
              } catch {
                // ignore malformed SSE line
              }
            }
          }
        } else {
          // Non-streaming fallback (mock mode)
          const data = await res.json();
          const raw = data.assistantMessage?.content ?? "";
          const { chat, artifactContent, qaComplete } = splitArtifact(raw);
          const cleanMsg = { ...data.assistantMessage, content: chat };
          setMessages((prev) => {
            const filtered = prev.filter(
              (m) => m.id !== tempUserId && m.id !== tempAiId
            );
            return [...filtered, data.userMessage, cleanMsg];
          });
          if (artifactContent) applyArtifactUpdate(artifactContent);
          if (qaComplete && activeArtifact) {
            setTimeout(() => triggerRebuild(activeArtifact.id), 200);
          }
        }
      } catch {
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempUserId && m.id !== tempAiId)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, activeArtifact, qaMode, triggerRebuild, pendingCompletionChoice, startClarifyingQuestions]
  );

  const handleGenerateArtifact = useCallback(
    async (type: ArtifactType) => {
      setLastRequestedArtifactType(type);
      setGenerationError(null);
      setIsLoading(true);
      setIsGeneratingArtifact(true);
      setGeneratingArtifactType(type);
      try {
        const res = await fetch(`/api/projects/${projectId}/artifacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });

        if (res.ok || res.status === 409) {
          let data;
          if (res.ok) {
            data = await res.json();
          } else {
            // Artifact already exists — fetch and open it
            const listRes = await fetch(`/api/projects/${projectId}/artifacts`);
            if (listRes.ok) {
              const listData = await listRes.json();
              data = (listData.artifacts as Array<{
                id: string; type: string; title: string; content: string;
                version: number; status: string; confidenceScore?: number | null;
              }>).find((a) => a.type === type);
            }
          }

          if (data) {
            setGenerationError(null);
            setActiveArtifact({
              id: data.id,
              type: data.type,
              title: data.title,
              content: data.content,
              version: data.version ?? 1,
              status: data.status,
              confidenceScore: data.confidenceScore,
            });
            setGeneratedArtifactTypes((prev) =>
              prev.includes(data.type as ArtifactType) ? prev : [...prev, data.type as ArtifactType]
            );
            const notifMsg: Message = {
              id: "notif-" + Date.now(),
              role: "assistant",
              content: res.ok
                ? `I've generated the **${data.title}** artifact. You can view and edit it in the panel on the right.`
                : `The **${data.title}** artifact already exists. Opening it in the panel on the right.`,
              createdAt: new Date().toISOString(),
              metadata: JSON.stringify({ isArtifact: true, artifactId: data.id }),
            };
            setMessages((prev) => [...prev, notifMsg]);

            // Only prompt if the artifact has unresolved placeholders.
            if (res.ok && artifactNeedsClarification(data.content)) {
              promptForCompletionChoice(data.id, data.title);
            }
          } else {
            setGenerationError(`Could not load the ${type.toUpperCase()} artifact after generation. Please retry.`);
          }
        } else {
          let errorMessage = `Failed to generate ${type.toUpperCase()} (HTTP ${res.status}).`;
          try {
            const payload = await res.json();
            if (payload?.error) errorMessage = payload.error;
          } catch {
            // Keep fallback error message.
          }
          setGenerationError(errorMessage);
          setMessages((prev) => [
            ...prev,
            {
              id: `gen-error-${Date.now()}`,
              role: "assistant",
              content: `I couldn't generate **${type.toUpperCase()}** right now. ${errorMessage}`,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } catch {
        setGenerationError(`Failed to generate ${type.toUpperCase()} due to a network or server error.`);
        setMessages((prev) => [
          ...prev,
          {
            id: `gen-error-${Date.now()}`,
            role: "assistant",
            content: `I couldn't generate **${type.toUpperCase()}** due to a network or server error. Please retry.`,
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
        setIsGeneratingArtifact(false);
        setGeneratingArtifactType(null);
      }
    },
    [projectId, triggerRebuild, promptForCompletionChoice]
  );

  // Seed traditional drafting prompt when coming from the Traditional SDLC chooser.
  useEffect(() => {
    const starterDoc = searchParams.get("starterDoc");
    const sdlcMode = searchParams.get("sdlcMode");
    if (traditionalSeedTriggeredRef.current) return;
    if (sdlcMode !== "traditional" || !starterDoc) return;

    const starter = TRADITIONAL_DOC_PROMPTS[starterDoc.toLowerCase()];
    if (!starter) return;
    traditionalSeedTriggeredRef.current = true;

    const kickOffTraditionalDraft = async () => {
      setIsLoading(true);

      const tempUserId = "seed-user-" + Date.now();
      const tempAiId = "seed-ai-" + Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: tempUserId,
          role: "user",
          content: starter.prompt,
          createdAt: new Date().toISOString(),
        },
        {
          id: tempAiId,
          role: "assistant",
          content: `Starting ${starter.label} draft...`,
          createdAt: new Date().toISOString(),
        },
      ]);

      try {
        const res = await fetch(`/api/projects/${projectId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: starter.prompt }),
        });

        if (res.ok) {
          const data = await res.json();
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== tempUserId && m.id !== tempAiId);
            return [...filtered, data.userMessage, data.assistantMessage];
          });
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== tempUserId && m.id !== tempAiId));
        }
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== tempUserId && m.id !== tempAiId));
      } finally {
        setIsLoading(false);
      }
    };

    void kickOffTraditionalDraft();
  }, [projectId, searchParams]);

  const handleSaveArtifact = useCallback(
    async (content: string) => {
      if (!activeArtifact) return;
      try {
        const res = await fetch(
          `/api/projects/${projectId}/artifacts?artifactId=${activeArtifact.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          setActiveArtifact((prev) =>
            prev
              ? {
                  ...prev,
                  content: data.content,
                  version: data.version,
                  confidenceScore: data.confidenceScore ?? prev.confidenceScore,
                }
              : null
          );
        }
      } catch {
        // ignore
      }
    },
    [projectId, activeArtifact]
  );

  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isSyncingFeedback, setIsSyncingFeedback] = useState(false);
  const [syncFeedbackSummary, setSyncFeedbackSummary] = useState<FeedbackSyncSummary | null>(null);

  const handleAutofillArtifact = useCallback(async () => {
    if (!activeArtifact) return;
    setIsAutofilling(true);
    const placeholderId = "autofill-" + Date.now();
    setMessages((prev) => [
      ...prev,
      { id: placeholderId, role: "assistant", content: "Filling in all open questions using industry best practices — this may take a moment…", createdAt: new Date().toISOString() },
    ]);

    const DELIM_START = "<<<ARTIFACT_UPDATE>>>";
    const DELIM_END = "<<<END_ARTIFACT_UPDATE>>>";
    const splitAutofill = (full: string): { chat: string; artifactContent: string | null } => {
      const si = full.indexOf(DELIM_START);
      if (si === -1) return { chat: full, artifactContent: null };
      const ei = full.indexOf(DELIM_END, si);
      const artifactContent = ei !== -1 ? full.slice(si + DELIM_START.length, ei).trim() : full.slice(si + DELIM_START.length).trim();
      const pre = full.slice(0, si).replace(/\s*-{3,}\s*$/, "").trim();
      const post = ei !== -1 ? full.slice(ei + DELIM_END.length).replace(/^\s*-{3,}\s*/, "").trim() : "";
      return { chat: [pre, post].filter(Boolean).join("\n\n") || "The document has been updated with best-practice defaults.", artifactContent: artifactContent || null };
    };
    const toDisplayAutofill = (acc: string): string => {
      const si = acc.indexOf(DELIM_START);
      if (si === -1) return acc;
      const pre = acc.slice(0, si).replace(/\s*-{3,}\s*$/, "").trim();
      const ei = acc.indexOf(DELIM_END, si);
      if (ei === -1) return pre || "Filling in best-practice defaults…";
      const post = acc.slice(ei + DELIM_END.length).replace(/^\s*-{3,}\s*/, "").trim();
      return [pre, post].filter(Boolean).join("\n\n") || "The document has been updated.";
    };
    const applyAutofillUpdate = async (newContent: string) => {
      setActiveArtifact((prev) => prev ? { ...prev, content: newContent } : null);
      await handleSaveArtifact(newContent);
    };

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autofillArtifact: true, artifactId: activeArtifact.id }),
      });
      if (!res.ok) {
        let errMsg = "Autofill failed. Please try again.";
        try {
          const data = await res.json();
          if (data?.error) errMsg = String(data.error);
        } catch {
          // ignore parse errors
        }
        setMessages((prev) => prev.map((m) =>
          m.id === placeholderId
            ? { ...m, content: `Autofill could not be completed: ${errMsg}` }
            : m
        ));
        return;
      }

      if (!res.body) {
        setMessages((prev) => prev.map((m) =>
          m.id === placeholderId
            ? { ...m, content: "Autofill did not return a response stream. Please retry." }
            : m
        ));
        return;
      }

      const ct = res.headers.get("Content-Type") ?? "";
      if (ct.includes("text/event-stream")) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "", streamed = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim(); if (!payload) continue;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.token) {
                streamed += parsed.token;
                setMessages((prev) => prev.map((m) => m.id === placeholderId ? { ...m, content: toDisplayAutofill(streamed) } : m));
              }
              if (parsed.done) {
                const raw = streamed || parsed.assistantMessage?.content || "";
                const { chat, artifactContent } = splitAutofill(raw);
                const finalMsg: Message = {
                  id: parsed.assistantMessage?.id ?? placeholderId,
                  role: "assistant",
                  content: chat,
                  createdAt: parsed.assistantMessage?.createdAt ?? new Date().toISOString(),
                };
                setMessages((prev) => prev.map((m) => m.id === placeholderId ? finalMsg : m));
                if (parsed.updatedArtifact) {
                  setActiveArtifact((prev) =>
                    prev
                      ? {
                          ...prev,
                          content: parsed.updatedArtifact.content,
                          version: parsed.updatedArtifact.version,
                          confidenceScore: parsed.updatedArtifact.confidenceScore ?? prev.confidenceScore,
                          status: parsed.updatedArtifact.status ?? prev.status,
                        }
                      : null
                  );
                } else if (artifactContent) {
                  void applyAutofillUpdate(artifactContent);
                } else {
                  setMessages((prev) => prev.map((m) =>
                    m.id === placeholderId
                      ? {
                          ...m,
                          content: "Autofill completed but no document updates were returned. This usually means the AI provider is not configured or returned non-updatable output.",
                        }
                      : m
                  ));
                }
              }
              if (parsed.error) {
                setMessages((prev) => prev.map((m) =>
                  m.id === placeholderId
                    ? { ...m, content: "Autofill failed while streaming. Please retry." }
                    : m
                ));
              }
            } catch { /* ignore */ }
          }
        }
      } else {
        const data = await res.json();
        const { chat, artifactContent } = splitAutofill(data.assistantMessage?.content ?? "");
        setMessages((prev) => prev.map((m) => m.id === placeholderId ? { ...(data.assistantMessage ?? {}), id: placeholderId, role: "assistant", content: chat } : m));
        if (data.updatedArtifact) {
          setActiveArtifact((prev) =>
            prev
              ? {
                  ...prev,
                  content: data.updatedArtifact.content,
                  version: data.updatedArtifact.version,
                  confidenceScore: data.updatedArtifact.confidenceScore ?? prev.confidenceScore,
                  status: data.updatedArtifact.status ?? prev.status,
                }
              : null
          );
        } else if (artifactContent) {
          void applyAutofillUpdate(artifactContent);
        } else {
          setMessages((prev) => prev.map((m) =>
            m.id === placeholderId
              ? {
                  ...m,
                  content: "Autofill completed but did not return updated artifact content. Please verify AI provider configuration and retry.",
                }
              : m
          ));
        }
      }
    } catch {
      setMessages((prev) => prev.map((m) =>
        m.id === placeholderId
          ? { ...m, content: "Autofill request failed due to a network/server error. Please retry." }
          : m
      ));
    } finally {
      setIsAutofilling(false);
    }
  }, [projectId, activeArtifact, handleSaveArtifact]);

  useEffect(() => {
    autofillTriggerRef.current = handleAutofillArtifact;
  }, [handleAutofillArtifact]);

  const handleSyncFeedback = useCallback(async () => {
    if (!activeArtifact || activeArtifact.type !== "prd") return;
    setIsSyncingFeedback(true);
    const infoId = "sync-feedback-" + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: infoId,
        role: "assistant",
        content: "Syncing PRD with Cyber Risk Analysis, Compliance Report, and Quality Review now...",
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch(`/api/projects/${projectId}/artifacts/${activeArtifact.id}/sync-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => prev.map((m) =>
          m.id === infoId
            ? {
                ...m,
                content: data?.error || "Feedback sync failed. Please ensure Security/Compliance/Quality artifacts exist.",
              }
            : m
        ));
        return;
      }

      const updated = data.artifact;
      const summary = data.syncSummary as FeedbackSyncSummary;
      setSyncFeedbackSummary(summary);

      setActiveArtifact((prev) =>
        prev
          ? {
              ...prev,
              content: updated.content,
              version: updated.version,
              confidenceScore: updated.confidenceScore ?? prev.confidenceScore,
              status: updated.status,
            }
          : null
      );

      const deltaText = `${summary.delta.overallScore >= 0 ? "+" : ""}${summary.delta.overallScore}`;
      const sourcesText = summary.sourceArtifacts
        .map((s) => `${s.title} (${s.type.replace(/_/g, " ")})`)
        .join(", ");
      const msg = `PRD feedback import completed. Sources: ${sourcesText}. Overall quality ${summary.before.overallScore} -> ${summary.after.overallScore} (${deltaText}). Recommendations ${summary.before.recommendations} -> ${summary.after.recommendations}, blockers ${summary.before.blockers} -> ${summary.after.blockers}.`;
      setMessages((prev) => prev.map((m) => (m.id === infoId ? { ...m, content: msg } : m)));
    } catch {
      setMessages((prev) => prev.map((m) =>
        m.id === infoId
          ? { ...m, content: "Feedback sync failed due to a network or server error." }
          : m
      ));
    } finally {
      setIsSyncingFeedback(false);
    }
  }, [projectId, activeArtifact]);

  const handleImproveArtifact = useCallback(async () => {
    if (!activeArtifact) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `Please improve and enhance the ${activeArtifact.title} artifact. Make it more comprehensive and detailed.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.userMessage, data.assistantMessage]);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [projectId, activeArtifact]);

  const handleSubmitForApproval = useCallback(async (content: string) => {
    if (!activeArtifact) return { ok: false, error: "No active artifact selected." };
    const res = await fetch(
      `/api/projects/${projectId}/artifacts/${activeArtifact.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "awaiting_approval", content }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      setActiveArtifact((prev) =>
        prev
          ? {
              ...prev,
              status: data.status,
              // Server may re-score quality and/or persist content/version.
              confidenceScore: data.confidenceScore ?? prev.confidenceScore,
              content: data.content ?? prev.content,
              version: data.version ?? prev.version,
            }
          : null
      );
      setMessages((prev) => [
        ...prev,
        {
          id: "submit-approval-" + Date.now(),
          role: "assistant" as const,
          content: `**${activeArtifact.title}** has been submitted for approval. A reviewer will be notified to review and approve this document.`,
          createdAt: new Date().toISOString(),
        },
      ]);
      return { ok: true };
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
    };
  }, [projectId, activeArtifact]);

  const completionChoiceQuickReplies =
    pendingCompletionChoice && activeArtifact && pendingCompletionChoice.artifactId === activeArtifact.id
      ? [
          { label: "Autofill Best Practices", value: "1" },
          { label: "Answer Clarifying Questions", value: "2" },
        ]
      : [];

  const showSidePanel = activeArtifact !== null || isGeneratingArtifact || generationError !== null;

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Top bar */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}`}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h2 className="text-sm font-semibold text-gray-900">
            {project?.name || "Loading..."}
          </h2>
        </div>
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-edison-600 hover:text-edison-700 font-medium"
        >
          View Project →
        </Link>
      </div>

      {/* Split Pane: Chat + Artifact */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Chat */}
        <div
          className={`flex flex-col overflow-hidden transition-all duration-300 ${
            showSidePanel ? "w-2/5 min-w-[360px]" : "w-full"
          }`}
        >
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              projectId={projectId}
              messages={messages}
              onSendMessage={handleSendMessage}
              onQuickReply={handleSendMessage}
              quickReplies={completionChoiceQuickReplies}
              onGenerateArtifact={handleGenerateArtifact}
              sdlcMode={sdlcMode}
              isLoading={isLoading}
              documents={documents}
              onDocumentUploaded={(doc) => setDocuments((prev) => [...prev, doc])}
              onDocumentDeleted={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
              existingArtifactTypes={generatedArtifactTypes}
            />
          </div>
        </div>

        {/* Right: Artifact Side Panel */}
        {showSidePanel && (
          <div className="w-3/5 min-w-[480px] overflow-hidden flex flex-col">
            {generationError && !activeArtifact && !isGeneratingArtifact ? (
              <div className="flex-1 flex items-center justify-center p-8 bg-white border-l border-gray-200">
                <div className="max-w-md w-full rounded-xl border border-red-200 bg-red-50 p-5">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">Artifact Generation Failed</h3>
                  <p className="text-sm text-red-700 mb-4">{generationError}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (lastRequestedArtifactType) {
                          void handleGenerateArtifact(lastRequestedArtifactType);
                        }
                      }}
                      disabled={!lastRequestedArtifactType}
                      className="px-3 py-1.5 text-xs font-medium rounded bg-edison-600 text-white hover:bg-edison-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Retry {lastRequestedArtifactType?.toUpperCase() ?? "Generation"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenerationError(null)}
                      className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <ArtifactSidePanel
                artifact={activeArtifact}
                projectId={projectId}
                isGenerating={isGeneratingArtifact}
                generatingArtifactType={generatingArtifactType}
                onClose={() => {
                  setActiveArtifact(null);
                  setGenerationError(null);
                }}
                onSave={handleSaveArtifact}
                onImprove={handleImproveArtifact}
                onAutofill={handleAutofillArtifact}
                onSyncFeedback={handleSyncFeedback}
                isAutofilling={isAutofilling}
                isSyncingFeedback={isSyncingFeedback}
                syncFeedbackSummary={syncFeedbackSummary}
                onSubmitForApproval={handleSubmitForApproval}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
