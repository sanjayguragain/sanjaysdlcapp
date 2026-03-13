"use client";

import React, { useEffect, useState, useCallback } from "react";
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

  useEffect(() => {
    async function load() {
      try {
        const [projRes, chatRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/chat`),
        ]);
        if (projRes.ok) {
          const data = await projRes.json();
          setProject(data);
        }
        if (chatRes.ok) {
          const data = await chatRes.json();
          setMessages(data.messages || []);
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
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === tempAiId ? { ...m, content: streamedContent } : m
                    )
                  );
                }
                if (parsed.done) {
                  setMessages((prev) => {
                    const filtered = prev.filter(
                      (m) => m.id !== tempUserId && m.id !== tempAiId
                    );
                    return [...filtered, parsed.userMessage, parsed.assistantMessage];
                  });
                }
              } catch {
                // ignore malformed SSE line
              }
            }
          }
        } else {
          // Non-streaming fallback (mock mode)
          const data = await res.json();
          setMessages((prev) => {
            const filtered = prev.filter(
              (m) => m.id !== tempUserId && m.id !== tempAiId
            );
            return [...filtered, data.userMessage, data.assistantMessage];
          });
        }
      } catch {
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempUserId && m.id !== tempAiId)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, activeArtifact]
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
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
        setIsGeneratingArtifact(false);
      }
    },
    [projectId]
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
            />
          </div>
        </div>

        {/* Right: Artifact Side Panel */}
        {showSidePanel && (
          <div className="w-3/5 min-w-[480px] overflow-hidden flex flex-col">
            <ArtifactSidePanel
              artifact={activeArtifact}
              isGenerating={isGeneratingArtifact}
              onClose={() => setActiveArtifact(null)}
              onSave={handleSaveArtifact}
              onImprove={handleImproveArtifact}
            />
          </div>
        )}
      </div>
    </div>
  );
}
