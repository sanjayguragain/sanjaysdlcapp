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

interface Project {
  id: string;
  name: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  content: string;
  createdAt: string;
}

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
  const [documents, setDocuments] = useState<Document[]>([]);
  // Guided Q&A state — tracks which artifact we're answering questions for
  const [qaMode, setQaMode] = useState<{ artifactId: string } | null>(null);
  const qaTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [projRes, chatRes, docsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/chat`),
          fetch(`/api/projects/${projectId}/documents`),
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
            setMessages((prev) => [
              ...prev,
              {
                id: "auto-gen-done",
                role: "assistant",
                content: `Your **${data.title}** has been generated based on your uploaded documents. Review it in the panel on the right and ask me to refine any section.`,
                createdAt: new Date().toISOString(),
                metadata: JSON.stringify({ isArtifact: true, artifactId: data.id }),
              },
            ]);
            // Ask clarifying questions without a user message visible in the chat
            fetch(`/api/projects/${projectId}/chat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clarifyArtifact: true, artifactId: data.id }),
            })
              .then(async (qRes) => {
                if (qRes.ok) {
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
                    // Enter Q&A mode and start 2-min idle timer if questions were asked
                    if (qData.assistantMessage.content.includes("**Q1.**")) {
                      setQaMode({ artifactId: data.id });
                      if (qaTimerRef.current) clearTimeout(qaTimerRef.current);
                      qaTimerRef.current = setTimeout(() => triggerRebuild(data.id), 2 * 60 * 1000);
                    }
                  }
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsLoading(false);
          setIsGeneratingArtifact(false);
        });
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, searchParams]);

  // ── Rebuild artifact with all collected answers ──────────────────────────
  const triggerRebuild = useCallback(async (artifactId: string) => {
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
      setActiveArtifact((prev) => prev ? { ...prev, content: newContent } : null);
      fetch(`/api/projects/${projectId}/artifacts?artifactId=${artifactId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      }).then((r) => r.ok ? r.json() : null).then((data) => {
        if (data) setActiveArtifact((prev) => prev ? { ...prev, content: data.content, version: data.version } : null);
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

      // Reset Q&A idle timer — user is still responding
      if (qaMode) {
        if (qaTimerRef.current) clearTimeout(qaTimerRef.current);
        qaTimerRef.current = setTimeout(() => triggerRebuild(qaMode.artifactId), 2 * 60 * 1000);
      }

      try {
        const body: Record<string, unknown> = { content };
        if (activeArtifact) body.artifactId = activeArtifact.id;

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
          setActiveArtifact((prev) => prev ? { ...prev, content: artifactContent } : null);
          fetch(`/api/projects/${projectId}/artifacts?artifactId=${activeArtifact.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: artifactContent }),
          }).then((r) => r.ok ? r.json() : null).then((data) => {
            if (data) setActiveArtifact((prev) => prev ? { ...prev, content: data.content, version: data.version } : null);
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
    [projectId, activeArtifact, qaMode, triggerRebuild]
  );

  const handleGenerateArtifact = useCallback(
    async (type: ArtifactType) => {
      setIsLoading(true);
      setIsGeneratingArtifact(true);
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
            setActiveArtifact({
              id: data.id,
              type: data.type,
              title: data.title,
              content: data.content,
              version: data.version ?? 1,
              status: data.status,
              confidenceScore: data.confidenceScore,
            });
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

            // For newly generated artifacts, kick off guided Q&A (ask first batch of questions)
            if (res.ok) {
              fetch(`/api/projects/${projectId}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clarifyArtifact: true, artifactId: data.id }),
              })
                .then(async (qRes) => {
                  if (qRes.ok) {
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
                      // Enter Q&A mode and start 2-min idle timer if questions were asked
                      if (qData.assistantMessage.content.includes("**Q1.**")) {
                        setQaMode({ artifactId: data.id });
                        if (qaTimerRef.current) clearTimeout(qaTimerRef.current);
                        qaTimerRef.current = setTimeout(() => triggerRebuild(data.id), 2 * 60 * 1000);
                      }
                    }
                  }
                })
                .catch(() => {});
            }
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
        setIsGeneratingArtifact(false);
      }
    },
    [projectId, triggerRebuild]
  );

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
            prev ? { ...prev, content: data.content, version: data.version } : null
          );
        }
      } catch {
        // ignore
      }
    },
    [projectId, activeArtifact]
  );

  const [isAutofilling, setIsAutofilling] = useState(false);

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
    const applyAutofillUpdate = (newContent: string) => {
      setActiveArtifact((prev) => prev ? { ...prev, content: newContent } : null);
      // PUT triggers scoreArtifactQuality on the server — confidence score updates automatically
      fetch(`/api/projects/${projectId}/artifacts?artifactId=${activeArtifact.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      }).then((r) => r.ok ? r.json() : null).then((data) => {
        if (data) setActiveArtifact((prev) => prev ? { ...prev, content: data.content, version: data.version, confidenceScore: data.confidenceScore } : null);
      }).catch(() => {});
    };

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autofillArtifact: true, artifactId: activeArtifact.id }),
      });
      if (!res.ok || !res.body) { setMessages((prev) => prev.filter((m) => m.id !== placeholderId)); return; }

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
                const raw = parsed.assistantMessage?.content ?? streamed;
                const { chat, artifactContent } = splitAutofill(raw);
                const finalMsg: Message = { id: parsed.assistantMessage?.id ?? placeholderId, role: "assistant", content: chat, createdAt: parsed.assistantMessage?.createdAt ?? new Date().toISOString() };
                setMessages((prev) => prev.map((m) => m.id === placeholderId ? finalMsg : m));
                if (artifactContent) applyAutofillUpdate(artifactContent);
              }
            } catch { /* ignore */ }
          }
        }
      } else {
        const data = await res.json();
        const { chat, artifactContent } = splitAutofill(data.assistantMessage?.content ?? "");
        setMessages((prev) => prev.map((m) => m.id === placeholderId ? { ...(data.assistantMessage ?? {}), id: placeholderId, role: "assistant", content: chat } : m));
        if (artifactContent) applyAutofillUpdate(artifactContent);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== placeholderId));
    } finally {
      setIsAutofilling(false);
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

  const showSidePanel = activeArtifact !== null || isGeneratingArtifact;

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
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
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
          <div className="flex-1 p-4 overflow-hidden">
            <ChatInterface
              projectId={projectId}
              messages={messages}
              onSendMessage={handleSendMessage}
              onGenerateArtifact={handleGenerateArtifact}
              isLoading={isLoading}
              documents={documents}
              onDocumentUploaded={(doc) => setDocuments((prev) => [...prev, doc])}
              onDocumentDeleted={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
            />
          </div>
        </div>

        {/* Right: Artifact Side Panel */}
        {showSidePanel && (
          <div className="w-3/5 min-w-[480px] overflow-hidden flex flex-col">
            <ArtifactSidePanel
              artifact={activeArtifact}
              projectId={projectId}
              isGenerating={isGeneratingArtifact}
              onClose={() => setActiveArtifact(null)}
              onSave={handleSaveArtifact}
              onImprove={handleImproveArtifact}
              onAutofill={handleAutofillArtifact}
              isAutofilling={isAutofilling}
              onSubmitForApproval={handleSubmitForApproval}
            />
          </div>
        )}
      </div>
    </div>
  );
}
