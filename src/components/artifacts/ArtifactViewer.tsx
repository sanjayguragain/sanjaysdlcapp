"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ArtifactType, ArtifactStatus, ARTIFACT_DEFINITIONS, STATUS_COLORS, STATUS_LABELS, EvaluationCategory, CATEGORY_LABELS, SCORING_WEIGHTS } from "@/types";
import { renderMermaidInElement } from "@/lib/mermaidRender";

interface Approval {
  id: string;
  status: string;
  comment: string | null;
  createdAt: string;
  user: { name: string; role: string };
}

interface ArtifactViewerProps {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  status: ArtifactStatus;
  confidenceScore: number | null;
  version: number;
  projectId?: string;
  approvals?: Approval[];
  onApprove?: (comment: string) => Promise<void>;
  onReject?: (comment: string) => Promise<void>;
  onSubmitForApproval?: (content: string) => Promise<{
    ok: boolean;
    error?: string;
    openQuestions?: string[];
    qualityPct?: number;
  }>;
  onEdit?: () => void;
}

function isHtml(text: string): boolean {
  return /^\s*</.test(text.trim());
}

function formatMarkdown(text: string): string {
  text = text.replace(/```\s*mermaid\s*\r?\n([\s\S]*?)```/gi, (_m, code) => {
    return `<pre class="mermaid">${code.trim()}</pre>`;
  });

  const lines = text.split("\n");
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let paraBuffer: string[] = [];

  function flushPara() {
    if (paraBuffer.length === 0) return;
    const joined = paraBuffer.join(" ").trim();
    if (joined) out.push(`<p>${joined}</p>`);
    paraBuffer = [];
  }

  function closeList() {
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }
  }

  function inlineFormat(s: string): string {
    return s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();

    const h3 = line.match(/^### (.+)$/);
    const h2 = line.match(/^## (.+)$/);
    const h1 = line.match(/^# (.+)$/);
    if (h1 || h2 || h3) {
      flushPara(); closeList();
      if (h3) out.push(`<h3>${inlineFormat(h3[1])}</h3>`);
      else if (h2) out.push(`<h2>${inlineFormat(h2[1])}</h2>`);
      else out.push(`<h1>${inlineFormat(h1![1])}</h1>`);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushPara(); closeList();
      out.push("<hr />");
      continue;
    }

    const bq = line.match(/^> (.+)$/);
    if (bq) {
      flushPara(); closeList();
      out.push(`<blockquote>${inlineFormat(bq[1])}</blockquote>`);
      continue;
    }

    const ul = line.match(/^[-*] (.+)$/);
    if (ul) {
      flushPara();
      if (inOl) { out.push("</ol>"); inOl = false; }
      if (!inUl) { out.push("<ul>"); inUl = true; }
      out.push(`<li>${inlineFormat(ul[1])}</li>`);
      continue;
    }

    const ol = line.match(/^(\d+)\. (.+)$/);
    if (ol) {
      flushPara();
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (!inOl) { out.push("<ol>"); inOl = true; }
      out.push(`<li>${inlineFormat(ol[2])}</li>`);
      continue;
    }

    if (line.trim() === "") {
      flushPara(); closeList();
      continue;
    }

    closeList();
    paraBuffer.push(inlineFormat(line));
  }

  flushPara();
  closeList();

  return out.join("\n");
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ArtifactViewer({
  id,
  type,
  title,
  content,
  status,
  confidenceScore,
  version,
  projectId,
  approvals = [],
  onApprove,
  onReject,
  onSubmitForApproval,
  onEdit,
}: ArtifactViewerProps) {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingForApproval, setIsSubmittingForApproval] = useState(false);
  const [openQuestionsWarning, setOpenQuestionsWarning] = useState<string[]>([]);
  const [showQualityPanel, setShowQualityPanel] = useState(false);
  const [qualityData, setQualityData] = useState<{
    overallScore: number;
    interpretation: string;
    categoryScores: Record<EvaluationCategory, number>;
    recommendations: string[];
    structuralAnalysis: {
      presentSections: string[];
      missingSections: string[];
      sectionOrderCorrect: boolean;
    };
    aiRiskIndicators: string[];
  } | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [renderedContentHtml, setRenderedContentHtml] = useState<string>(" ");

  const fetchQuality = useCallback(async () => {
    if (!projectId) return;
    setQualityLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/artifacts/${id}/quality`);
      if (res.ok) {
        setQualityData(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setQualityLoading(false);
    }
  }, [projectId, id]);

  useEffect(() => {
    if (showQualityPanel && !qualityData && !qualityLoading) {
      fetchQuality();
    }
  }, [showQualityPanel, qualityData, qualityLoading, fetchQuality]);

  useEffect(() => {
    const html = isHtml(content) ? content : formatMarkdown(content);
    let cancelled = false;

    (async () => {
      const container = document.createElement("div");
      container.innerHTML = html;
      await renderMermaidInElement(container);
      if (!cancelled) setRenderedContentHtml(container.innerHTML);
    })();

    return () => {
      cancelled = true;
    };
  }, [content]);

  const def = ARTIFACT_DEFINITIONS.find((d) => d.type === type);
  const statusColor = STATUS_COLORS[status] || "bg-gray-100 text-gray-700";
  const statusLabel = STATUS_LABELS[status] || status;
  const canApprove = status === "awaiting_approval";
  const canSubmitForApproval = status !== "approved" && status !== "awaiting_approval" && status !== "blocked";
  // Confidence stored as decimal 0-1, display as percentage
  const confidencePct = confidenceScore != null
    ? (confidenceScore > 1 ? Math.round(confidenceScore) : Math.round(confidenceScore * 100))
    : null;

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsSubmitting(true);
    await onApprove(comment);
    setIsSubmitting(false);
    setShowApproveModal(false);
    setComment("");
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsSubmitting(true);
    await onReject(comment);
    setIsSubmitting(false);
    setShowRejectModal(false);
    setComment("");
  };

  const handleSubmitForApproval = async () => {
    if (!onSubmitForApproval) return;
    setIsSubmittingForApproval(true);
    try {
      const result = await onSubmitForApproval(content);
      if (!result?.ok) {
        setOpenQuestionsWarning(result.openQuestions ?? (result.error ? [result.error] : []));
        return;
      }
      setOpenQuestionsWarning([]);
    } finally {
      setIsSubmittingForApproval(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <Badge className={statusColor}>{statusLabel}</Badge>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  v{version}
                </span>
              </div>
              {def && (
                <p className="text-sm text-gray-500">
                  {def.description} · Owner: <span className="font-medium">{def.owner}</span> · Approver: <span className="font-medium">{def.approver}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {confidencePct !== null && (
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-sm text-gray-500">Quality</span>
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        confidencePct >= 80 ? "from-emerald-500 to-green-500" :
                        confidencePct >= 60 ? "from-amber-400 to-yellow-500" :
                        "from-red-400 to-red-600"
                      }`}
                      style={{ width: `${confidencePct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {confidencePct}%
                  </span>
                </div>
              )}

              {projectId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQualityPanel((v) => !v)}
                  className="!text-edison-600 hover:!bg-edison-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {showQualityPanel ? "Hide Analysis" : "Quality Analysis"}
                </Button>
              )}

              {onEdit && (
                <Button variant="secondary" size="sm" onClick={onEdit}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit in Chat
                </Button>
              )}

              {canSubmitForApproval && onSubmitForApproval && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSubmitForApproval}
                  disabled={isSubmittingForApproval}
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isSubmittingForApproval ? "Submitting..." : "Submit for Approval"}
                </Button>
              )}

              {canApprove && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRejectModal(true)}
                    className="!text-red-600 hover:!bg-red-50"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowApproveModal(true)}
                  >
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
          <div
            className="prose max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: renderedContentHtml || (isHtml(content) ? content : formatMarkdown(content)) }}
          />
        </div>
      </div>

      {/* Quality Analysis Panel */}
      {showQualityPanel && (
        <div className="bg-white rounded-xl border border-edison-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-edison-100 bg-edison-50/50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-edison-900 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Quality Analysis
              </h3>
              {qualityData && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  qualityData.overallScore >= 90 ? "bg-emerald-100 text-emerald-700" :
                  qualityData.overallScore >= 75 ? "bg-blue-100 text-blue-700" :
                  qualityData.overallScore >= 60 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {qualityData.interpretation}
                </span>
              )}
            </div>
          </div>
          <div className="px-6 py-4">
            {qualityLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing artifact quality...
              </div>
            ) : qualityData ? (
              <div className="space-y-4">
                {/* Category scores */}
                <div className="space-y-3">
                  {(Object.keys(CATEGORY_LABELS) as EvaluationCategory[]).map((cat) => {
                    const score = qualityData.categoryScores[cat] ?? 0;
                    const weight = SCORING_WEIGHTS[cat];
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-700">{CATEGORY_LABELS[cat]}</span>
                            <span className="text-[10px] text-gray-400">{Math.round(weight * 100)}%</span>
                          </div>
                          <span className={`text-xs font-bold ${
                            score >= 90 ? "text-emerald-700" : score >= 75 ? "text-blue-700" : score >= 60 ? "text-amber-700" : "text-red-700"
                          }`}>{Math.round(score)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              score >= 90 ? "bg-emerald-500" : score >= 75 ? "bg-blue-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${Math.max(2, score)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Missing sections */}
                {qualityData.structuralAnalysis.missingSections.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Missing Sections</p>
                    <div className="flex flex-wrap gap-1">
                      {qualityData.structuralAnalysis.missingSections.map((s, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 bg-red-50 text-red-600 rounded-md border border-red-100">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI risk indicators */}
                {qualityData.aiRiskIndicators.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">AI Risk Indicators</p>
                    <ul className="space-y-1">
                      {qualityData.aiRiskIndicators.map((r, i) => (
                        <li key={i} className="text-[11px] text-amber-700 flex items-start gap-1.5">
                          <span className="text-amber-400 shrink-0 mt-0.5">!</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Top recommendations */}
                {qualityData.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Recommendations</p>
                    <ul className="space-y-1">
                      {qualityData.recommendations.slice(0, 5).map((r, i) => (
                        <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                          <span className="text-edison-400 shrink-0 mt-0.5">&#10095;</span>
                          <span>{r}</span>
                        </li>
                      ))}
                      {qualityData.recommendations.length > 5 && (
                        <li className="text-[11px] text-gray-400 ml-4">
                          +{qualityData.recommendations.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Unable to load quality data.</p>
            )}
          </div>
        </div>
      )}

      {/* Open questions blocking banner */}
      {openQuestionsWarning.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
          <div className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-amber-800">
                    {openQuestionsWarning.length} open question{openQuestionsWarning.length !== 1 ? "s" : ""} must be resolved before submitting for approval
                  </p>
                </div>
                <ul className="space-y-1.5 mb-3 ml-7">
                  {openQuestionsWarning.map((q, i) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="text-amber-400 shrink-0">•</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-amber-600 ml-7">
                  Click <strong>Edit in Chat</strong> to fill in these sections, then submit again.
                </p>
              </div>
              <button
                onClick={() => setOpenQuestionsWarning([])}
                className="text-amber-400 hover:text-amber-600 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval History */}
      {approvals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Approval History</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {approvals.map((approval) => (
              <div key={approval.id} className="flex items-start gap-3 px-6 py-4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  approval.status === "approved" ? "bg-green-100" : "bg-red-100"
                }`}>
                  {approval.status === "approved" ? (
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{approval.user.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      approval.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {approval.status}
                    </span>
                    <span className="text-xs text-gray-400">{formatRelativeTime(approval.createdAt)}</span>
                  </div>
                  {approval.comment && (
                    <p className="text-sm text-gray-600 mt-1">{approval.comment}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{approval.user.role.replace(/_/g, " ")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Artifact"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You are about to approve <strong>{title}</strong>. This will mark the
            artifact as finalized.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-edison-500"
              placeholder="Add any notes about this approval..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowApproveModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? "Approving..." : "Confirm Approval"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Artifact"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please provide a reason for rejecting <strong>{title}</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for rejection
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-edison-500"
              placeholder="Describe what needs to be changed..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReject}
              disabled={isSubmitting || !comment.trim()}
            >
              {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
