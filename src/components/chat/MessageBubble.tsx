"use client";

import React from "react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isArtifact?: boolean;
  confidenceScore?: number;
}

export function MessageBubble({ role, content, timestamp, isArtifact, confidenceScore }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3 animate-fade-in-up ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-edison-600 text-white"
            : "bg-gradient-to-br from-edison-blue-500 to-edison-600 text-white"
        }`}
      >
        {isUser ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        )}
      </div>

      {/* Message */}
      <div
        className={`max-w-[85%] ${
          isUser
            ? "bg-edison-600 text-white rounded-2xl rounded-tr-md px-4 py-3"
            : isArtifact
            ? "bg-white border border-edison-200 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm"
            : "bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm"
        }`}
      >
        {isArtifact && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-edison-100">
            <svg className="w-4 h-4 text-edison-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-medium text-edison-600">
              Generated Artifact
            </span>
            {confidenceScore !== undefined && (
              <span className="ml-auto flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-edison-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round(confidenceScore * 100)}%`,
                      backgroundColor: confidenceScore >= 0.8 ? "#22c55e" : confidenceScore >= 0.6 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium text-edison-500">
                  {Math.round(confidenceScore * 100)}%
                </span>
              </span>
            )}
          </div>
        )}
        <div
          className={`prose text-sm whitespace-pre-wrap ${
            isUser ? "text-white" : "text-gray-800"
          }`}
          dangerouslySetInnerHTML={{
            __html: formatMarkdown(content),
          }}
        />
        {timestamp && (
          <p
            className={`text-xs mt-2 ${
              isUser ? "text-edison-200" : "text-gray-400"
            }`}
          >
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}
