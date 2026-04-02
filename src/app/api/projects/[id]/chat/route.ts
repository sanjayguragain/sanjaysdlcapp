import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateChatResponse, streamChatResponse } from "@/lib/ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { evaluateArtifactQuality } from "@/lib/artifactChecks";
import { applyArtifactWatermark, buildChatSkillContext } from "@/lib/skillLoader";

/** Format stakeholders JSON into a context block for the AI prompt. */
function formatStakeholders(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    const list = JSON.parse(raw) as { name: string; role: string }[];
    if (!Array.isArray(list) || list.length === 0) return "";
    return "\n\nStakeholders:\n" + list.map((s) => `- ${s.name} (${s.role || "no role specified"})`).join("\n");
  } catch {
    return "";
  }
}

type ChatMsg = Awaited<ReturnType<typeof prisma.chatMessage.findFirst>>;
type Doc = Awaited<ReturnType<typeof prisma.document.findFirst>>;
type Art = Awaited<ReturnType<typeof prisma.artifact.findFirst>>;

const ARTIFACT_DELIM_START = "<<<ARTIFACT_UPDATE>>>";
const ARTIFACT_DELIM_END = "<<<END_ARTIFACT_UPDATE>>>";
const MAX_VERSIONS = 50;
const AUTOFILL_STREAM_TIMEOUT_MS = Number(process.env.AUTOFILL_STREAM_TIMEOUT_MS || "120000");
const AUTOFILL_STREAM_INIT_TIMEOUT_MS = Number(process.env.AUTOFILL_STREAM_INIT_TIMEOUT_MS || "60000");
const AUTOFILL_REPAIR_TIMEOUT_MS = Number(process.env.AUTOFILL_REPAIR_TIMEOUT_MS || "60000");
const AUTOFILL_TARGET_QUALITY_SCORE = Number(process.env.AUTOFILL_TARGET_QUALITY_SCORE || "90");
const AUTOFILL_RETRY_PROMPT_THRESHOLD = Number(process.env.AUTOFILL_RETRY_PROMPT_THRESHOLD || "80");
const AUTOFILL_MAX_QUALITY_PASSES = Number(process.env.AUTOFILL_MAX_QUALITY_PASSES || "2");
const PRD_MIN_REQUIREMENTS = Number(process.env.PRD_MIN_REQUIREMENTS || "8");

async function readWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | "__timeout__"> {
  return Promise.race([
    promise,
    new Promise<"__timeout__">((resolve) => setTimeout(() => resolve("__timeout__"), timeoutMs)),
  ]);
}

async function resolveWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | "__timeout__"> {
  return Promise.race([
    promise,
    new Promise<"__timeout__">((resolve) => setTimeout(() => resolve("__timeout__"), timeoutMs)),
  ]);
}

function deterministicBestPracticeFor(reason: string, projectName: string, projectDescription: string): string {
  const r = reason.toLowerCase();
  if (/uptime|availability|sla/.test(r)) return "99.9% monthly uptime SLA with active monitoring and incident response runbooks.";
  if (/latency|performance|response/.test(r)) return "p95 API latency under 200ms and p99 under 500ms for core user workflows.";
  if (/security|auth|authentication|authorization/.test(r)) return "OAuth 2.0/OIDC authentication, role-based access control, MFA for privileged users, and full audit logging.";
  if (/encryption|data protection|privacy|pii/.test(r)) return "TLS 1.2+ in transit, AES-256 at rest, least-privilege access, and policy-based data retention controls.";
  if (/scalability|scale|concurrent|throughput/.test(r)) return "Horizontal scaling design supporting at least 10,000 concurrent users with auto-scaling based on load.";
  if (/timeline|milestone|schedule/.test(r)) return "Phase 1 (4 weeks) foundation, Phase 2 (6 weeks) core capabilities, Phase 3 (4 weeks) hardening and launch readiness.";
  if (/stakeholder|owner|approver/.test(r)) return "Product Manager, Engineering Lead, Security/Compliance Lead, and Operations Lead are accountable stakeholders.";
  if (/persona|user|audience/.test(r)) return "Primary personas: Product Manager, Engineering Lead, and Delivery Team Member with role-specific goals and workflows.";
  if (/risk|mitigation/.test(r)) return "Key risks are tracked with impact/likelihood scoring and mitigation owners reviewed weekly.";
  return `${projectName} (${projectDescription || "enterprise initiative"}) follows industry-standard enterprise defaults with measurable acceptance criteria and governance controls.`;
}

function nearestSectionHeading(content: string, markerIndex: number): string {
  const before = content.slice(0, markerIndex);
  const htmlHeadings = Array.from(before.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi));
  if (htmlHeadings.length > 0) {
    const raw = htmlHeadings[htmlHeadings.length - 1]?.[1] || "";
    return raw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  }

  const mdHeadings = Array.from(before.matchAll(/^#{1,6}\s+(.+)$/gim));
  if (mdHeadings.length > 0) {
    return (mdHeadings[mdHeadings.length - 1]?.[1] || "").trim();
  }

  return "";
}

function deterministicSectionAwareBestPractice(
  reason: string,
  sectionHeading: string,
  projectName: string,
  projectDescription: string
): string {
  const r = reason.toLowerCase();
  const s = sectionHeading.toLowerCase();

  if (/acceptance criteria|success criteria|definition of done/.test(s)) {
    return "Acceptance criteria: 1) 100% of priority user flows are executable end-to-end, 2) p95 response time stays below 200ms for core actions, 3) UAT sign-off is completed by Product and Engineering leads.";
  }
  if (/non-functional|nfr|quality attributes/.test(s)) {
    return "NFR baseline: availability 99.9% monthly, p95 API latency <200ms, p99 <500ms, RPO <= 15 minutes, RTO <= 60 minutes, and 80%+ automated test coverage on critical paths.";
  }
  if (/security|compliance|privacy/.test(s)) {
    return "Security baseline: OAuth 2.0/OIDC + MFA, RBAC with least privilege, TLS 1.2+ in transit, AES-256 at rest, OWASP ASVS-aligned controls, and quarterly access reviews.";
  }
  if (/traceability/.test(s)) {
    return "Traceability coverage set to 100% for high-priority requirements with links from requirement IDs to design components, test cases, and release milestones.";
  }
  if (/risk|assumption|dependency/.test(s)) {
    return "Risks and assumptions are tracked weekly with owner, mitigation action, due date, and impact/likelihood scoring (Low/Medium/High).";
  }
  if (/timeline|roadmap|milestone|plan/.test(s)) {
    return "Delivery plan: Discovery (2 weeks), Build (6 weeks), Hardening/UAT (2 weeks), and Production readiness/go-live (1 week).";
  }

  if (/traceability|requirement id|coverage/.test(r)) {
    return "REQ coverage target is 100% for critical requirements, each linked to architecture element IDs and at least one validating test case.";
  }
  if (/acceptance|done|success/.test(r)) {
    return "Completion requires measurable outcomes: no Sev-1 defects open, all critical tests passing, and stakeholder sign-off from Product and Engineering.";
  }

  return deterministicBestPracticeFor(reason, projectName, projectDescription);
}

function buildDefaultTraceabilityTable(projectName: string): string {
  return [
    "<table>",
    "<thead><tr><th>Requirement ID</th><th>Requirement Summary</th><th>Design/Component Ref</th><th>Verification</th><th>Owner</th></tr></thead>",
    "<tbody>",
    `<tr><td>REQ-001</td><td>${projectName} authentication and access control</td><td>SEC-AUTH-01</td><td>Integration test + security test</td><td>Engineering Lead</td></tr>`,
    `<tr><td>REQ-002</td><td>${projectName} core workflow completion within SLA</td><td>APP-WF-02</td><td>Performance test (p95 < 200ms)</td><td>Product Manager</td></tr>`,
    `<tr><td>REQ-003</td><td>Auditability and operational monitoring</td><td>OPS-MON-03</td><td>Operational readiness checklist</td><td>Operations Lead</td></tr>`,
    `<tr><td>REQ-004</td><td>Data protection and compliance controls</td><td>SEC-DATA-04</td><td>Compliance review + encryption validation</td><td>Compliance Officer</td></tr>`,
    "</tbody>",
    "</table>",
  ].join("");
}

function cleanListItemText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractOpenQuestionItems(sectionBody: string): string[] {
  const items: string[] = [];

  const htmlItems = Array.from(sectionBody.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi));
  for (const match of htmlItems) {
    const text = cleanListItemText(match[1] || "");
    if (text && !items.includes(text)) items.push(text);
  }

  const lines = sectionBody.split("\n");
  for (const line of lines) {
    const md = line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)$/);
    if (!md) continue;
    const text = cleanListItemText(md[1] || "");
    if (text && !items.includes(text)) items.push(text);
  }

  return items.slice(0, 8);
}

function buildDecisionLogHtml(resolvedItems: string[], date: string): string {
  const rows = resolvedItems.length > 0
    ? resolvedItems.map((item, i) => `<tr><td>DEC-${String(i + 1).padStart(3, "0")}</td><td>${item}</td><td>Accepted</td><td>${date}</td></tr>`).join("")
    : `<tr><td>DEC-001</td><td>Applied deterministic best-practice defaults for previously open items.</td><td>Accepted</td><td>${date}</td></tr>`;
  return `<table><thead><tr><th>Decision ID</th><th>Decision</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function buildDecisionLogMarkdown(resolvedItems: string[], date: string): string {
  const rows = resolvedItems.length > 0
    ? resolvedItems.map((item, i) => `| DEC-${String(i + 1).padStart(3, "0")} | ${item.replace(/\|/g, "\\|")} | Accepted | ${date} |`).join("\n")
    : `| DEC-001 | Applied deterministic best-practice defaults for previously open items. | Accepted | ${date} |`;
  return `| Decision ID | Decision | Status | Date |\n|---|---|---|---|\n${rows}`;
}

function ensureDecisionLogSection(content: string, resolvedItems: string[], date: string): string {
  let updated = content;

  const decisionHtmlSection = /(<h2\b[^>]*>\s*Decision Log[^<]*<\/h2>)([\s\S]*?)(?=<h2\b|$)/i;
  if (decisionHtmlSection.test(updated)) {
    updated = updated.replace(decisionHtmlSection, (_m, heading: string, body: string) => {
      if (/<table\b/i.test(body)) {
        const hasAutofillRow = /Applied deterministic best-practice defaults|DEC-001/i.test(body);
        if (hasAutofillRow) return `${heading}${body}`;
      }
      return `${heading}\n${buildDecisionLogHtml(resolvedItems, date)}\n`;
    });
    return updated;
  }

  const decisionMdSection = /(^##\s*Decision Log\s*$)([\s\S]*?)(?=^##\s|$)/im;
  if (decisionMdSection.test(updated)) {
    updated = updated.replace(decisionMdSection, (_m, heading: string, _body: string) => `${heading}\n${buildDecisionLogMarkdown(resolvedItems, date)}\n`);
    return updated;
  }

  if (/<h[1-6]\b/i.test(updated)) {
    return `${updated}\n<h2>Decision Log</h2>\n${buildDecisionLogHtml(resolvedItems, date)}\n`;
  }

  return `${updated}\n\n## Decision Log\n${buildDecisionLogMarkdown(resolvedItems, date)}\n`;
}

function ensureRevisionHistoryAutofillEntry(content: string, date: string): string {
  let updated = content;
  const note = "Autofill best-practice completion for previously open items";

  const revisionHtmlSection = /(<h2\b[^>]*>\s*Revision History[^<]*<\/h2>)([\s\S]*?)(?=<h2\b|$)/i;
  if (revisionHtmlSection.test(updated)) {
    updated = updated.replace(revisionHtmlSection, (_m, heading: string, body: string) => {
      if (body.includes(note) && body.includes(date)) return `${heading}${body}`;
      if (/<table\b/i.test(body)) {
        const row = `<tr><td>${date}</td><td>Autofill</td><td>Product Manager</td><td>${note}</td></tr>`;
        if (/<tbody>/i.test(body)) {
          return `${heading}${body.replace(/<\/tbody>/i, `${row}</tbody>`)}`;
        }
        return `${heading}${body.replace(/<\/table>/i, `<tbody>${row}</tbody></table>`)}`;
      }
      return `${heading}\n<table><thead><tr><th>Date</th><th>Version</th><th>Author</th><th>Change Summary</th></tr></thead><tbody><tr><td>${date}</td><td>Autofill</td><td>Product Manager</td><td>${note}</td></tr></tbody></table>\n`;
    });
    return updated;
  }

  const revisionMdSection = /(^##\s*Revision History\s*$)([\s\S]*?)(?=^##\s|$)/im;
  if (revisionMdSection.test(updated)) {
    updated = updated.replace(revisionMdSection, (_m, heading: string, body: string) => {
      if (body.includes(note) && body.includes(date)) return `${heading}${body}`;
      const tableHeader = "| Date | Version | Author | Change Summary |\n|---|---|---|---|";
      const row = `| ${date} | Autofill | Product Manager | ${note} |`;
      if (/^\|\s*Date\s*\|/im.test(body)) {
        return `${heading}${body.trimEnd()}\n${row}\n`;
      }
      return `${heading}\n${tableHeader}\n${row}\n`;
    });
    return updated;
  }

  if (/<h[1-6]\b/i.test(updated)) {
    return `${updated}\n<h2>Revision History</h2>\n<table><thead><tr><th>Date</th><th>Version</th><th>Author</th><th>Change Summary</th></tr></thead><tbody><tr><td>${date}</td><td>Autofill</td><td>Product Manager</td><td>${note}</td></tr></tbody></table>\n`;
  }

  return `${updated}\n\n## Revision History\n| Date | Version | Author | Change Summary |\n|---|---|---|---|\n| ${date} | Autofill | Product Manager | ${note} |\n`;
}

function countRequirementItems(content: string): number {
  if (!content) return 0;

  const frIds = (content.match(/\bFR-\d{2,4}\b/gi) || []).length;
  const functionalHtmlSection = content.match(
    /<h2\b[^>]*>\s*(?:\d+\.\s*)?(?:Functional Requirements(?:\s*&\s*Features)?|Requirements(?:\s*&\s*Features)?)\s*<\/h2>([\s\S]*?)(?=<h2\b|$)/i
  );
  const htmlSectionListItems = functionalHtmlSection
    ? (functionalHtmlSection[1].match(/<li\b[^>]*>/gi) || []).length
    : 0;

  const functionalMdSection = content.match(
    /^##\s*(?:\d+\.\s*)?(?:Functional Requirements(?:\s*&\s*Features)?|Requirements(?:\s*&\s*Features)?)\s*$([\s\S]*?)(?=^##\s|$)/im
  );
  const mdSectionListItems = functionalMdSection
    ? (functionalMdSection[1].match(/^\s*(?:[-*]|\d+\.)\s+/gim) || []).length
    : 0;

  // Prefer explicit FR-* IDs; otherwise fall back to list depth in functional-requirements sections.
  return Math.max(frIds, htmlSectionListItems, mdSectionListItems);
}

function buildDefaultFunctionalRequirementsHtml(projectName: string): string {
  return [
    "<ul>",
    `<li><strong>FR-001:</strong> Support role-based authentication and authorization for ${projectName} users.</li>`,
    `<li><strong>FR-002:</strong> Provide end-to-end workflow execution for the primary ${projectName} business process.</li>`,
    "<li><strong>FR-003:</strong> Capture and persist all key transactional events with audit metadata.</li>",
    "<li><strong>FR-004:</strong> Provide configurable notifications for status changes and critical events.</li>",
    "<li><strong>FR-005:</strong> Expose searchable history and filtering across records and workflow states.</li>",
    "<li><strong>FR-006:</strong> Support exception handling and retry flows for failed operations.</li>",
    "<li><strong>FR-007:</strong> Provide dashboards for operational health, throughput, and SLA tracking.</li>",
    "<li><strong>FR-008:</strong> Export key reports and compliance evidence for stakeholder review.</li>",
    "</ul>",
  ].join("");
}

function buildDefaultFunctionalRequirementsMarkdown(projectName: string): string {
  return [
    `- **FR-001:** Support role-based authentication and authorization for ${projectName} users.`,
    `- **FR-002:** Provide end-to-end workflow execution for the primary ${projectName} business process.`,
    "- **FR-003:** Capture and persist all key transactional events with audit metadata.",
    "- **FR-004:** Provide configurable notifications for status changes and critical events.",
    "- **FR-005:** Expose searchable history and filtering across records and workflow states.",
    "- **FR-006:** Support exception handling and retry flows for failed operations.",
    "- **FR-007:** Provide dashboards for operational health, throughput, and SLA tracking.",
    "- **FR-008:** Export key reports and compliance evidence for stakeholder review.",
  ].join("\n");
}

function ensureMinimumFunctionalRequirements(content: string, projectName: string): string {
  let updated = content;

  const functionalHtmlSection = /(<h2\b[^>]*>\s*(?:\d+\.\s*)?(?:Functional Requirements(?:\s*&\s*Features)?|Requirements(?:\s*&\s*Features)?)\s*<\/h2>)([\s\S]*?)(?=<h2\b|$)/i;
  if (functionalHtmlSection.test(updated)) {
    updated = updated.replace(functionalHtmlSection, (_m, heading: string, body: string) => {
      const requirementCount = countRequirementItems(body);
      if (requirementCount >= PRD_MIN_REQUIREMENTS) return `${heading}${body}`;
      return `${heading}\n${buildDefaultFunctionalRequirementsHtml(projectName)}\n`;
    });
    return updated;
  }

  const functionalMdSection = /(^##\s*(?:\d+\.\s*)?(?:Functional Requirements(?:\s*&\s*Features)?|Requirements(?:\s*&\s*Features)?)\s*$)([\s\S]*?)(?=^##\s|$)/im;
  if (functionalMdSection.test(updated)) {
    updated = updated.replace(functionalMdSection, (_m, heading: string, body: string) => {
      const requirementCount = countRequirementItems(body);
      if (requirementCount >= PRD_MIN_REQUIREMENTS) return `${heading}${body}`;
      return `${heading}\n${buildDefaultFunctionalRequirementsMarkdown(projectName)}\n`;
    });
    return updated;
  }

  if (/<h[1-6]\b/i.test(updated)) {
    return `${updated}\n<h2>Functional Requirements & Features</h2>\n${buildDefaultFunctionalRequirementsHtml(projectName)}\n`;
  }

  return `${updated}\n\n## Functional Requirements & Features\n${buildDefaultFunctionalRequirementsMarkdown(projectName)}\n`;
}

function enrichPrdSectionsDeterministically(content: string, projectName: string, resolvedItems: string[] = []): string {
  let updated = content;
  const today = new Date().toISOString().slice(0, 10);

  // Ensure measurable acceptance criteria exists in PRD sections.
  const acceptanceHtmlSection = /(<h2\b[^>]*>\s*Acceptance Criteria[^<]*<\/h2>)([\s\S]*?)(?=<h2\b|$)/i;
  if (acceptanceHtmlSection.test(updated)) {
    updated = updated.replace(acceptanceHtmlSection, (_m, heading: string, body: string) => {
      const hasList = /<ul\b|<ol\b/i.test(body);
      if (hasList) return `${heading}${body}`;
      return `${heading}\n<ul><li>All priority user journeys execute successfully end-to-end in UAT.</li><li>p95 response time remains below 200ms for core interactions.</li><li>Zero open Sev-1 defects and all critical tests pass before release approval.</li></ul>\n`;
    });
  }

  const acceptanceMdSection = /(^##\s*Acceptance Criteria\s*$)([\s\S]*?)(?=^##\s|$)/im;
  if (acceptanceMdSection.test(updated)) {
    updated = updated.replace(acceptanceMdSection, (_m, heading: string, body: string) => {
      if (/^\s*[-*]\s+/m.test(body)) return `${heading}${body}`;
      return `${heading}\n- All priority user journeys execute successfully end-to-end in UAT.\n- p95 response time remains below 200ms for core interactions.\n- Zero open Sev-1 defects and all critical tests pass before release approval.\n`;
    });
  }

  // Ensure traceability matrix has concrete rows.
  const traceabilityHtmlSection = /(<h2\b[^>]*>\s*Traceability Matrix[^<]*<\/h2>)([\s\S]*?)(?=<h2\b|$)/i;
  if (traceabilityHtmlSection.test(updated)) {
    updated = updated.replace(traceabilityHtmlSection, (_m, heading: string, body: string) => {
      if (/<table\b/i.test(body)) {
        const rowCount = (body.match(/<tr\b/gi) || []).length;
        const hasReqIds = /REQ-\d{3}|REQ-\d+/i.test(body);
        if (rowCount >= 3 && hasReqIds) return `${heading}${body}`;
        return `${heading}\n${buildDefaultTraceabilityTable(projectName)}\n`;
      }
      return `${heading}\n${buildDefaultTraceabilityTable(projectName)}\n`;
    });
  }

  const traceabilityMdSection = /(^##\s*Traceability Matrix\s*$)([\s\S]*?)(?=^##\s|$)/im;
  if (traceabilityMdSection.test(updated)) {
    updated = updated.replace(traceabilityMdSection, (_m, heading: string, body: string) => {
      const mdRowCount = (body.match(/^\|/gm) || []).length;
      const hasReqIds = /REQ-\d{3}|REQ-\d+/i.test(body);
      if (mdRowCount >= 5 && hasReqIds) return `${heading}${body}`;
      return `${heading}\n| Requirement ID | Requirement Summary | Design/Component Ref | Verification | Owner |\n|---|---|---|---|---|\n| REQ-001 | ${projectName} authentication and access control | SEC-AUTH-01 | Integration test + security test | Engineering Lead |\n| REQ-002 | ${projectName} core workflow completion within SLA | APP-WF-02 | Performance test (p95 < 200ms) | Product Manager |\n| REQ-003 | Auditability and operational monitoring | OPS-MON-03 | Operational readiness checklist | Operations Lead |\n| REQ-004 | Data protection and compliance controls | SEC-DATA-04 | Compliance review + encryption validation | Compliance Officer |\n`;
    });
  }

  updated = ensureMinimumFunctionalRequirements(updated, projectName);

  updated = ensureDecisionLogSection(updated, resolvedItems, today);
  updated = ensureRevisionHistoryAutofillEntry(updated, today);

  return updated;
}

function applyDeterministicAutofill(
  originalContent: string,
  projectName: string,
  projectDescription: string,
  artifactType?: string
): string {
  let content = originalContent;
  let resolvedOpenItems: string[] = [];

  // Replace all explicit placeholders with concrete best-practice defaults.
  content = content.replace(/\[\s*To be confirmed\s*[-—:]?\s*([^\]]*)\]/gi, (m, reasonRaw: string, offset: number) => {
    const reason = String(reasonRaw || "details").trim();
    const section = nearestSectionHeading(originalContent, offset);
    const replacement = deterministicSectionAwareBestPractice(reason, section, projectName, projectDescription);
    return replacement || m;
  });

  // Resolve unresolved plain-text markers that are not wrapped in [To be confirmed ...].
  content = content.replace(/\b(TBD|To be confirmed)\b/gi, `${projectName} baseline aligned to enterprise best practices`);

  // Resolve Open Questions section when present.
  const openQuestionsSection = /(<h2\b[^>]*>\s*Open Questions[^<]*<\/h2>)([\s\S]*?)(?=<h2\b|$)/i;
  if (openQuestionsSection.test(content)) {
    content = content.replace(
      openQuestionsSection,
      (_m, heading: string, body: string) => {
        resolvedOpenItems = extractOpenQuestionItems(body);
        return `${heading}\n<p>All previously open questions have been resolved and incorporated into the document using project context and industry best practices.</p>\n<ul><li>Resolved with measurable non-functional targets.</li><li>Resolved with security and compliance defaults.</li><li>Resolved with delivery ownership and timeline assumptions.</li></ul>\n`;
      }
    );
  }

  // Markdown variant of Open Questions section.
  const markdownOpenQuestions = /(^##\s*Open Questions\s*$)([\s\S]*?)(?=^##\s|$)/im;
  if (markdownOpenQuestions.test(content)) {
    content = content.replace(
      markdownOpenQuestions,
      (_m, heading: string, body: string) => {
        if (resolvedOpenItems.length === 0) {
          resolvedOpenItems = extractOpenQuestionItems(body);
        }
        return `${heading}\nAll previously open questions have been resolved and incorporated into the document using project context and industry best practices.\n\n- Resolved with measurable non-functional targets.\n- Resolved with security and compliance defaults.\n- Resolved with delivery ownership and timeline assumptions.\n`;
      }
    );
  }

  if ((artifactType || "").toLowerCase() === "prd") {
    content = enrichPrdSectionsDeterministically(content, projectName, resolvedOpenItems);
  }

  return content;
}

function ensureGroundingAttributionSection(
  content: string,
  options: {
    resolutionSource: "ai_primary" | "ai_repair" | "deterministic";
    hasSkillReferences: boolean;
    hasDocuments: boolean;
    artifactType: string;
  }
): string {
  if (!content || content.trim().length === 0) return content;
  if (/Grounding (and|&) Sources|Source Attribution|Grounding References/i.test(content)) {
    return content;
  }

  const sourceLines: string[] = [];
  if (options.hasSkillReferences) sourceLines.push("Skills/Templates/Prompts");
  if (options.hasDocuments) sourceLines.push("Uploaded Project Documents");
  sourceLines.push("Project Metadata (name, description, stakeholders)");
  sourceLines.push(
    options.resolutionSource === "deterministic"
      ? "Deterministic Best-Practice Defaults (fallback)"
      : "LLM Grounded Synthesis"
  );

  const modeLine =
    options.resolutionSource === "ai_primary"
      ? "Mode: Primary LLM autofill"
      : options.resolutionSource === "ai_repair"
      ? "Mode: Repair LLM autofill"
      : "Mode: Deterministic fallback";

  const isHtml = /<h[1-6]\b|<p\b|<div\b|<ul\b|<table\b/i.test(content);
  if (isHtml) {
    const html =
      `\n<h2>Grounding and Sources</h2>\n` +
      `<p>${modeLine}. The following source groups were used to fill unresolved sections:</p>\n` +
      `<ul>${sourceLines.map((s) => `<li>${s}</li>`).join("")}</ul>\n`;
    return `${content}${html}`;
  }

  const md =
    `\n\n## Grounding and Sources\n` +
    `${modeLine}. The following source groups were used to fill unresolved sections:\n` +
    `${sourceLines.map((s) => `- ${s}`).join("\n")}\n`;
  return `${content}${md}`;
}

function countUnresolvedMarkers(content: string): number {
  const toBeConfirmed = (content.match(/\[\s*To be confirmed/gi) || []).length;
  const tbd = (content.match(/\bTBD\b/gi) || []).length;
  return toBeConfirmed + tbd;
}

/**
 * Intelligently merge LLM-generated updates with existing artifact content.
 * If the LLM returns what looks like a partial/incremental update (e.g., just a section),
 * merges it into the existing content preserving all other sections.
 * Otherwise returns the LLM content as-is (full replacement).
 */
function mergeArtifactUpdate(existingContent: string, llmGeneratedContent: string, artifactType: string): string {
  if (!llmGeneratedContent || llmGeneratedContent.trim().length < 100) {
    // Very short content is likely a fragment, not a full document; merge it
    return attemptMergeFragment(existingContent, llmGeneratedContent);
  }

  const isHtml = /<h[1-6]\b|<p\b|<div\b|<section\b|<table\b/i.test(existingContent);
  const llmIsHtml = /<h[1-6]\b|<p\b|<div\b|<section\b|<table\b/i.test(llmGeneratedContent);

  // If existing is HTML but LLM output is not HTML-like, treat as fragment
  if (isHtml && !llmIsHtml && llmGeneratedContent.trim().length < 500) {
    return attemptMergeFragment(existingContent, llmGeneratedContent);
  }

  // Check if LLM content looks like it's missing major sections from the original
  const existingSections = extractSections(existingContent);
  const llmSections = extractSections(llmGeneratedContent);

  // If LLM dropped critical sections that existed, do a merge
  const criticalSections = ["Acceptance Criteria", "Traceability", "Revision History", "Decision Log"];
  for (const critical of criticalSections) {
    const existingHasIt = existingSections.some((s) => s.name.toLowerCase().includes(critical.toLowerCase()));
    const llmHasIt = llmSections.some((s) => s.name.toLowerCase().includes(critical.toLowerCase()));
    if (existingHasIt && !llmHasIt) {
      // Critical section lost; merge instead of replace
      return mergeBySection(existingContent, llmGeneratedContent);
    }
  }

  // Otherwise treat as full replacement
  return llmGeneratedContent;
}

interface Section {
  name: string;
  startIndex: number;
  endIndex: number;
  content: string;
}

/**
 * Extract section headers and their ranges from HTML or Markdown content.
 */
function extractSections(content: string): Section[] {
  const sections: Section[] = [];

  // HTML sections
  const htmlRegex = /<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let match;
  while ((match = htmlRegex.exec(content)) !== null) {
    const name = match[1].replace(/<[^>]+>/g, "").trim();
    sections.push({
      name,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      content: match[0],
    });
  }

  // Markdown sections
  const mdRegex = /^(#{1,6})\s+(.+)$/gm;
  while ((match = mdRegex.exec(content)) !== null) {
    sections.push({
      name: match[2].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      content: match[0],
    });
  }

  return sections;
}

/**
 * Merge LLM fragment (partial content) into existing artifact by replacing
 * or appending the relevant section.
 */
function attemptMergeFragment(existing: string, fragment: string): string {
  const isHtml = /<h[1-6]\b|<p\b|<div\b|<table\b/i.test(existing);

  if (isHtml) {
    // Try to find a section header in the fragment
    const fragmentSectionMatch = fragment.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
    if (fragmentSectionMatch) {
      const fragmentSectionName = fragmentSectionMatch[1].replace(/<[^>]+>/g, "").trim();
      // Find and replace matching section in existing content
      const existingSectionRegex = new RegExp(
        `<h[1-6]\\b[^>]*>\\s*${fragmentSectionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*<\\/h[1-6]>([\\s\\S]*?)(?=<h[1-6]\\b|$)`,
        "i"
      );
      if (existingSectionRegex.test(existing)) {
        // Section exists: replace it
        return existing.replace(existingSectionRegex, fragment);
      }
    }
    // No matching section found; append fragment
    return existing.trimEnd() + "\n\n" + fragment;
  } else {
    // Markdown: try to find a section header in the fragment
    const fragmentSectionMatch = fragment.match(/^#+\s+(.+)$/m);
    if (fragmentSectionMatch) {
      const fragmentSectionName = fragmentSectionMatch[1].trim();
      // Find and replace matching section in existing content
      const existingSectionRegex = new RegExp(
        `^(#{1,6})\\s+${fragmentSectionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$([\\s\\S]*?)(?=^#{1,6}\\s+|$)`,
        "im"
      );
      if (existingSectionRegex.test(existing)) {
        // Section exists: replace it
        return existing.replace(existingSectionRegex, fragment);
      }
    }
    // No matching section found; append fragment
    return existing.trimEnd() + "\n\n" + fragment;
  }
}

/**
 * Merge LLM content with existing by comparing sections and updating only
 * sections that appear in both or appending new sections from LLM content.
 */
function mergeBySection(existing: string, llmGenerated: string): string {
  const existingSections = extractSections(existing);
  const llmSections = extractSections(llmGenerated);

  let result = existing;

  // Update/replace sections that exist in both
  for (const llmSec of llmSections) {
    const existingSec = existingSections.find((s) =>
      s.name.toLowerCase() === llmSec.name.toLowerCase()
    );
    if (existingSec) {
      // Replace this section
      result = result.substring(0, existingSec.startIndex) +
        llmSec.content +
        result.substring(existingSec.endIndex);
    }
  }

  // Append sections from LLM that don't exist in original
  for (const llmSec of llmSections) {
    if (!existingSections.some((s) => s.name.toLowerCase() === llmSec.name.toLowerCase())) {
      result = result.trimEnd() + "\n\n" + llmSec.content;
    }
  }

  return result;
}

function isAutofillImproved(original: string, candidate: string, artifactType: string): boolean {
  if (!candidate || candidate.trim().length < 50) return false;
  const unresolvedOriginal = countUnresolvedMarkers(original);
  const unresolvedCandidate = countUnresolvedMarkers(candidate);
  if (candidate !== original && unresolvedCandidate === 0) return true;
  if (unresolvedCandidate < unresolvedOriginal) return true;

  try {
    const before = evaluateArtifactQuality(artifactType as any, original);
    const after = evaluateArtifactQuality(artifactType as any, candidate);
    if (after.blockers.length < before.blockers.length) return true;
    if (after.overallScore > before.overallScore + 0.03) return true;
  } catch {
    // If scoring fails, rely on unresolved-marker checks only.
  }

  return false;
}

function sectionPresent(content: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const html = new RegExp(`<h[1-6]\\b[^>]*>\\s*${escaped}[^<]*<\\/h[1-6]>`, "i");
  const markdown = new RegExp(`^##\\s*${escaped}\\s*$`, "im");
  return html.test(content) || markdown.test(content);
}

function passesAutofillQualityGates(original: string, candidate: string, artifactType: string): boolean {
  if (!candidate || candidate.trim().length < 50) return false;
  if (countUnresolvedMarkers(candidate) > 0) return false;

  if ((artifactType || "").toLowerCase() !== "prd") return true;

  const mustPreserve = ["Acceptance Criteria", "Traceability Matrix", "Revision History", "Open Questions"];
  for (const section of mustPreserve) {
    if (sectionPresent(original, section) && !sectionPresent(candidate, section)) {
      return false;
    }
  }

  if (sectionPresent(original, "Traceability Matrix") && !/REQ-\d{3}|REQ-\d+/i.test(candidate)) {
    return false;
  }

  if (countRequirementItems(candidate) < PRD_MIN_REQUIREMENTS) {
    return false;
  }

  if (sectionPresent(original, "Open Questions")) {
    // If open questions existed, we require a decision log and revision entry after autofill.
    if (!sectionPresent(candidate, "Decision Log")) return false;
    if (!/Autofill best-practice completion for previously open items/i.test(candidate)) return false;
  }

  return true;
}

function scoreCandidate(artifactType: string, content: string): number {
  try {
    return evaluateArtifactQuality(artifactType as any, content).overallScore;
  } catch {
    return 0;
  }
}

async function improveCandidateToTargetQuality(params: {
  artifact: NonNullable<Art>;
  candidate: string;
  projectName: string;
  projectDescription: string;
  hasSkillReferences: boolean;
  hasDocuments: boolean;
  autofillContext: string;
  sourceTag: "ai_primary" | "ai_repair" | "deterministic";
}): Promise<{ content: string; score: number }> {
  const {
    artifact,
    candidate,
    projectName,
    projectDescription,
    hasSkillReferences,
    hasDocuments,
    autofillContext,
    sourceTag,
  } = params;

  let current = ensureGroundingAttributionSection(candidate, {
    resolutionSource: sourceTag,
    hasSkillReferences,
    hasDocuments,
    artifactType: artifact.type,
  });
  let currentScore = scoreCandidate(artifact.type, current);

  for (let pass = 0; pass < AUTOFILL_MAX_QUALITY_PASSES; pass++) {
    if (
      currentScore >= AUTOFILL_TARGET_QUALITY_SCORE &&
      passesAutofillQualityGates(artifact.content, current, artifact.type)
    ) {
      return { content: current, score: currentScore };
    }

    const evalResult = evaluateArtifactQuality(artifact.type as any, current);
    const repairPrompt =
      `Improve the artifact quality score to >= ${AUTOFILL_TARGET_QUALITY_SCORE}. Current score: ${evalResult.overallScore}. ` +
      `Current blockers: ${evalResult.blockers.join("; ") || "none"}. ` +
      `Top recommendations: ${evalResult.recommendations.slice(0, 8).join("; ") || "none"}. ` +
      `Strict requirements: keep document type/format, preserve valid resolved content, remove unresolved placeholders, ensure measurable acceptance criteria, ` +
      `ensure at least ${PRD_MIN_REQUIREMENTS} concrete functional requirements (FR-*), ensure traceability requirement IDs when traceability section exists, keep/add decision log and revision history updates for PRD with open questions, ` +
      `and include a Grounding and Sources section. Return one brief sentence then full artifact in ${ARTIFACT_DELIM_START}/${ARTIFACT_DELIM_END}.`;

    const optimizationMessages: { role: "user" | "assistant"; content: string }[] = [
      { role: "assistant", content: current.slice(0, 15000) },
      { role: "user", content: repairPrompt },
    ];

    const optimizedResponse = await resolveWithTimeout(
      generateChatResponse(optimizationMessages, autofillContext, artifact.type),
      AUTOFILL_REPAIR_TIMEOUT_MS
    );
    if (optimizedResponse === "__timeout__") break;

    const extracted = extractArtifactUpdate(optimizedResponse.content);
    if (!extracted.artifactContent) break;

    const enriched = ensureGroundingAttributionSection(extracted.artifactContent, {
      resolutionSource: sourceTag,
      hasSkillReferences,
      hasDocuments,
      artifactType: artifact.type,
    });

    const improved = isAutofillImproved(current, enriched, artifact.type);
    const nextScore = scoreCandidate(artifact.type, enriched);
    if (!improved && nextScore <= currentScore) {
      continue;
    }

    current = enriched;
    currentScore = nextScore;
  }

  return { content: current, score: currentScore };
}

async function resolveAutofillContent(params: {
  artifact: NonNullable<Art>;
  projectName: string;
  projectDescription: string;
  hasSkillReferences: boolean;
  hasDocuments: boolean;
  autofillMessages: { role: "user" | "assistant"; content: string }[];
  autofillContext: string;
  primaryRawContent: string;
  primaryExtracted: { chatContent: string; artifactContent: string | null };
  timeoutReached?: boolean;
}): Promise<{ nextArtifactContent: string; assistantContent: string; resolutionSource: "ai_primary" | "ai_repair" | "deterministic" }> {
  const {
    artifact,
    projectName,
    projectDescription,
    hasSkillReferences,
    hasDocuments,
    autofillMessages,
    autofillContext,
    primaryRawContent,
    primaryExtracted,
  } = params;

  type BestResult = {
    source: "ai_primary" | "ai_repair" | "deterministic";
    content: string;
    assistantContent: string;
    score: number;
    passes: boolean;
  };

  const improveCandidateParams = (candidate: string, sourceTag: "ai_primary" | "ai_repair") =>
    improveCandidateToTargetQuality({
      artifact,
      candidate,
      projectName,
      projectDescription,
      hasSkillReferences,
      hasDocuments,
      autofillContext,
      sourceTag,
    });

  let best: BestResult | null = null;

  // ── Step 1: Try primary candidate first ─────────────────────────────────────
  const primaryCandidate = primaryExtracted.artifactContent
    ? ensureGroundingAttributionSection(primaryExtracted.artifactContent, {
        resolutionSource: "ai_primary",
        hasSkillReferences,
        hasDocuments,
        artifactType: artifact.type,
      })
    : null;

  if (primaryCandidate && isAutofillImproved(artifact.content, primaryCandidate, artifact.type)) {
    const primaryAssistantContent =
      primaryExtracted.chatContent ||
      "I've autofilled all open questions using project skills, templates, and document context — review the updates in the editor.";

    const optimized = await improveCandidateParams(primaryCandidate, "ai_primary");
    const passes = passesAutofillQualityGates(artifact.content, optimized.content, artifact.type);

    best = { source: "ai_primary", content: optimized.content, assistantContent: primaryAssistantContent, score: optimized.score, passes };

    // Fast path: primary already meets the quality target — skip repair entirely.
    if (passes && optimized.score >= AUTOFILL_TARGET_QUALITY_SCORE) {
      return {
        nextArtifactContent: optimized.content,
        assistantContent: `${primaryAssistantContent} (quality score ${Math.round(optimized.score)}).`,
        resolutionSource: "ai_primary",
      };
    }
  }

  // ── Step 2: Run repair only if primary was insufficient ──────────────────────
  const repairInstruction =
    "Your previous output was incomplete or insufficiently grounded. Rebuild the full artifact now with strict grounding: " +
    "(1) cross-reference SKILL/AGENT/TEMPLATE/PROMPT blocks first, (2) use uploaded docs and project description second, " +
    "(3) replace every unresolved marker with concrete values, and (4) keep existing valid content unchanged. " +
    "Output one short confirmation sentence, then the full artifact wrapped in <<<ARTIFACT_UPDATE>>> and <<<END_ARTIFACT_UPDATE>>>.";

  const repairMessages: { role: "user" | "assistant"; content: string }[] = [
    ...autofillMessages,
    { role: "assistant", content: primaryRawContent.slice(0, 12000) },
    { role: "user", content: repairInstruction },
  ];

  const repairResponse = await resolveWithTimeout(
    generateChatResponse(repairMessages, autofillContext, artifact.type),
    AUTOFILL_REPAIR_TIMEOUT_MS
  );

  if (repairResponse !== "__timeout__") {
    const repairExtracted = extractArtifactUpdate(repairResponse.content);
    const repairCandidate = repairExtracted.artifactContent
      ? ensureGroundingAttributionSection(repairExtracted.artifactContent, {
          resolutionSource: "ai_repair",
          hasSkillReferences,
          hasDocuments,
          artifactType: artifact.type,
        })
      : null;

    if (repairCandidate && isAutofillImproved(artifact.content, repairCandidate, artifact.type)) {
      const repairAssistantContent =
        repairExtracted.chatContent ||
        "I've cross-referenced skills, templates, and project references to complete unresolved sections — review the updated artifact.";

      const repairOptimized = await improveCandidateParams(repairCandidate, "ai_repair");
      const repairPasses = passesAutofillQualityGates(artifact.content, repairOptimized.content, artifact.type);

      if (!best || repairOptimized.score > best.score) {
        best = { source: "ai_repair", content: repairOptimized.content, assistantContent: repairAssistantContent, score: repairOptimized.score, passes: repairPasses };
      }

      if (repairPasses && repairOptimized.score >= AUTOFILL_TARGET_QUALITY_SCORE) {
        return {
          nextArtifactContent: repairOptimized.content,
          assistantContent: `${repairAssistantContent} (quality score ${Math.round(repairOptimized.score)}).`,
          resolutionSource: "ai_repair",
        };
      }
    }
  }

  // ── Step 3: Return best result found ─────────────────────────────────────────
  if (best) {
    const { source, content, assistantContent, score, passes } = best;
    if (passes) {
      return {
        nextArtifactContent: content,
        assistantContent: score < AUTOFILL_RETRY_PROMPT_THRESHOLD
          ? `${assistantContent} (current quality score ${Math.round(score)}; target ${AUTOFILL_TARGET_QUALITY_SCORE}). I can likely improve this with one more pass using additional agent, skill, and document grounding. Would you like me to take another pass? Reply "yes" to continue.`
          : `${assistantContent} (best achievable quality score ${Math.round(score)} in bounded passes).`,
        resolutionSource: source,
      };
    }
    return {
      nextArtifactContent: content,
      assistantContent: score < AUTOFILL_RETRY_PROMPT_THRESHOLD
        ? `${assistantContent} (current quality score ${Math.round(score)}; target ${AUTOFILL_TARGET_QUALITY_SCORE}). This version is grounded in agent, skill, template, and document context, but I think I can improve it further. Would you like me to take another pass? Reply "yes" to continue.`
        : `${assistantContent} (best LLM-grounded quality score ${Math.round(score)}; some strict structural gates are still unmet).`,
      resolutionSource: source,
    };
  }

  const deterministic = applyDeterministicAutofill(
    artifact.content,
    projectName,
    projectDescription,
    artifact.type
  );
  const deterministicWithAttribution = ensureGroundingAttributionSection(deterministic, {
    resolutionSource: "deterministic",
    hasSkillReferences,
    hasDocuments,
    artifactType: artifact.type,
  });

  return {
    nextArtifactContent: deterministicWithAttribution,
    assistantContent: timeoutReached
      ? "The model timed out before producing a usable document, so I applied a deterministic fallback to avoid leaving the artifact unchanged."
      : "The model did not return a usable full-document update, so I applied a deterministic fallback to avoid leaving the artifact unchanged.",
    resolutionSource: "deterministic",
  };
}

async function saveVersionSnapshot(
  artifactId: string,
  content: string,
  version: number
) {
  await prisma.artifactVersion.create({
    data: { artifactId, content, version },
  });
  const count = await prisma.artifactVersion.count({ where: { artifactId } });
  if (count > MAX_VERSIONS) {
    const oldest = await prisma.artifactVersion.findFirst({
      where: { artifactId },
      orderBy: { savedAt: "asc" },
    });
    if (oldest) {
      await prisma.artifactVersion.delete({ where: { id: oldest.id } });
    }
  }
}

function extractArtifactUpdate(full: string): {
  chatContent: string;
  artifactContent: string | null;
} {
  const si = full.indexOf(ARTIFACT_DELIM_START);
  if (si !== -1) {
    const ei = full.indexOf(ARTIFACT_DELIM_END, si);
    const artifactContent = ei !== -1
      ? full.slice(si + ARTIFACT_DELIM_START.length, ei).trim()
      : full.slice(si + ARTIFACT_DELIM_START.length).trim();
    const pre = full.slice(0, si).replace(/\s*-{3,}\s*$/, "").trim();
    const post = ei !== -1
      ? full.slice(ei + ARTIFACT_DELIM_END.length).replace(/^\s*-{3,}\s*/, "").trim()
      : "";
    return {
      chatContent:
        [pre, post].filter(Boolean).join("\n\n") ||
        "The document has been updated with industry best practices.",
      artifactContent: artifactContent || null,
    };
  }

  // Try to find HTML content (for Traditional SDLC documents like BRD, AVD, etc.)
  const htmlStart = full.search(/<(h[1-6]|p|div|section|table|ul|ol|pre|blockquote|article|aside)\b/i);
  if (htmlStart >= 0) {
    const pre = htmlStart > 0 ? full.slice(0, htmlStart).trim() : "";
    const artifactContent = full.slice(htmlStart).trim();
    // Accept HTML content even if shorter than 300 chars (some updates are small)
    if (artifactContent.length >= 50) {
      return {
        chatContent: pre || "The document has been updated with industry best practices.",
        artifactContent,
      };
    }
  }

  // Try to find markdown content
  const markdownStart = full.search(/(^|\n)#+\s+/);
  if (markdownStart >= 0) {
    const pre = markdownStart > 0 ? full.slice(0, markdownStart).trim() : "";
    const artifactContent = full.slice(markdownStart < 1 ? 0 : markdownStart + 1).trim();
    if (artifactContent.length >= 50) {
      return {
        chatContent: pre || "The document has been updated with industry best practices.",
        artifactContent,
      };
    }
  }

  // Fallback: if the entire response looks like artifact content (mostly HTML tags), treat it as such
  const htmlTagCount = (full.match(/<[^>]+>/g) || []).length;
  if (htmlTagCount > 5 && full.length > 100) {
    return {
      chatContent: "The document has been updated with industry best practices.",
      artifactContent: full.trim(),
    };
  }

  return { chatContent: full.trim(), artifactContent: null };
}

async function persistUpdatedArtifact(
  artifactId: string,
  nextContent: string,
  options?: { merge?: boolean }
) {
  const artifact = await prisma.artifact.findUnique({ where: { id: artifactId } });
  if (!artifact || !nextContent) return null;

  // If merge is requested, intelligently merge new content with existing
  const mergedContent = options?.merge
    ? mergeArtifactUpdate(artifact.content, nextContent, artifact.type)
    : nextContent;

  const watermarkedContent = applyArtifactWatermark(artifact.type, mergedContent);

  // Allow updates even if content appears identical, in case formatting changed
  // (HTML formatting updates might be functionally identical but visually different)

  const before = evaluateArtifactQuality(artifact.type as any, artifact.content);
  const after = evaluateArtifactQuality(artifact.type as any, watermarkedContent);

  await saveVersionSnapshot(artifactId, artifact.content, artifact.version);

  const improvedBlockers = after.blockers.length < before.blockers.length;
  const improvedOverall = after.overallScore >= before.overallScore;
  const nextConfidenceScore = improvedBlockers && !improvedOverall
    ? Math.max(before.confidenceScore, after.confidenceScore)
    : after.confidenceScore;

  return prisma.artifact.update({
    where: { id: artifactId },
    data: {
      content: watermarkedContent,
      version: artifact.version + 1,
      confidenceScore: nextConfidenceScore,
      status: artifact.status,
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const messages = await prisma.chatMessage.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });

  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { content, artifactId, clarifyArtifact, rebuildArtifact, autofillArtifact, editArtifact, viewingArtifactId } = body;

  // ── Autofill-artifact mode ──────────────────────────────────────────────────
  // Called when the user clicks "Autofill with Best Practices" in the editor.
  // Answers every [To be confirmed — ...] TBD using industry best practices,
  // company-standard defaults, and contextual details from the project docs.
  // The confidence score is NOT recalculated here — that happens automatically
  // when the frontend PUTs the updated content to /api/artifacts (which calls
  // scoreArtifactQuality).
  if (autofillArtifact && artifactId) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { artifacts: true, documents: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const artifact = project.artifacts.find((a: NonNullable<Art>) => a.id === artifactId);
    if (!artifact) return NextResponse.json({ error: "Artifact not found" }, { status: 404 });

    const docsContext = project.documents.map((d: NonNullable<Doc>) => d.content).join("\n\n");

    // Load agent skills, templates, and prompts for this artifact type
    const skillRefContext = buildChatSkillContext(artifact.type);
    const hasSkillReferences = Boolean(skillRefContext && skillRefContext.trim().length > 0);
    const hasDocuments = project.documents.length > 0;

    const autofillContext =
      `Project: ${project.name}\nDescription: ${project.description || "N/A"}\n\n` +
      `Uploaded documents:\n${docsContext || "None"}\n\n` +
      (skillRefContext ? `${skillRefContext}\n\n` : "") +
      `--- ARTIFACT TO AUTOFILL ---\nType: ${artifact.type}\nTitle: ${artifact.title}\n\n` +
      `${artifact.content}\n--- END ARTIFACT ---\n\n` +
      `AUTOFILL INSTRUCTION:\n` +
      `CRITICAL: Execute this autofill immediately. Do NOT ask for confirmation, do NOT ask clarifying questions, do NOT explain your intent before acting. Proceed directly to updating the artifact.\n` +
      `You are a senior solution architect with deep knowledge of industry best practices, ` +
      `enterprise software standards (ISO 25010, IEEE 830, TOGAF, OWASP, SOC 2, GDPR), ` +
      `and common SaaS/enterprise product patterns.\n` +
      `Every placeholder in the artifact follows the pattern: [To be confirmed — <reason>]\n` +
      `Your task: replace EVERY such placeholder with a realistic, specific, industry-standard value ` +
      `appropriate for the project context described above and the artifact type (${artifact.type}).\n` +
      `Guidelines:\n` +
      `- PRIORITIZE the SKILL, AGENT, TEMPLATE, and PROMPT reference blocks above — they contain company-specific conventions, naming standards, architectural patterns, and quality gates. Use them as the primary source of truth for filling placeholders.\n` +
      `- Where skills or templates define specific values, formats, or standards for this artifact type, use those EXACT values rather than generic defaults.\n` +
      `- Use concrete values (e.g. "99.9% uptime SLA", "AES-256-GCM encryption", "OAuth 2.0 + PKCE with MFA") — never leave vague language.\n` +
      `- Align with the project name, description, and uploaded documents where possible.\n` +
      `- If a value cannot be inferred from skills, templates, documents, or project context, use the most common industry-standard default for this type of product.\n` +
      `- Keep all existing resolved content intact — only replace [To be confirmed — ...] markers.\n` +
      `- CRITICAL: Never invent or add fake personal names for authors, stakeholders, approvers, owners, or user personas.\n` +
      `- Preserve any existing real names exactly as-is if they already exist in the artifact.\n` +
      `- If a person's name is missing or unknown, use role-only labels (for example: "Product Manager", "Engineering Lead", "Compliance Officer", "Field Supervisor") instead of creating a name.\n` +
      `- Ignore example/sample names shown in template guidance (for example: "Jane Doe", "John Smith", "Bob Lee"). Do not copy them into the final artifact unless those exact names already exist in project context or the artifact input.\n` +
      `- Do NOT add unrelated sections or change the document type/format.\n` +
      `- If there is an Open Questions / Outstanding Items section, remove every item that has now been answered.\n` +
      `- If all open questions are now resolved, replace that section body with: "All previously open questions have been resolved and incorporated into the document."\n` +
      `- The final artifact should contain fewer blockers than the input artifact; never leave answered items behind in the Open Questions section.\n` +
      `Output format:\n` +
      `IMPORTANT: Do NOT ask for confirmation. Do NOT say "Do you want me to..." or "Please confirm...". Execute immediately.\n` +
      `First output exactly one sentence: "I've autofilled all open questions using industry best practices — review the updates in the editor."\n` +
      `Then immediately output the complete updated artifact wrapped in <<<ARTIFACT_UPDATE>>> and <<<END_ARTIFACT_UPDATE>>> delimiters.`;

    const autofillMessages: { role: "user" | "assistant"; content: string }[] = [
      { role: "user", content: "Please autofill all [To be confirmed] placeholders using industry best practices." },
    ];

    let autofillStream: ReadableStream<Uint8Array> | null = null;
    try {
      const streamResult = await resolveWithTimeout(
        streamChatResponse(autofillMessages, autofillContext, artifact.type),
        AUTOFILL_STREAM_INIT_TIMEOUT_MS
      );
      autofillStream = streamResult === "__timeout__" ? null : streamResult;
    } catch (e) {
      console.error("[chat] autofill stream threw:", e);
    }

    if (!autofillStream) {
      const aiResponse = await generateChatResponse(autofillMessages, autofillContext, artifact.type);
      const extracted = extractArtifactUpdate(aiResponse.content);
      const resolved = await resolveAutofillContent({
        artifact: artifact as NonNullable<Art>,
        projectName: project.name,
        projectDescription: project.description || "",
        hasSkillReferences,
        hasDocuments,
        autofillMessages,
        autofillContext,
        primaryRawContent: aiResponse.content,
        primaryExtracted: extracted,
      });
      const nextArtifactContent = resolved.nextArtifactContent;
      const updatedArtifact = nextArtifactContent
          ? await persistUpdatedArtifact(artifactId, nextArtifactContent, { merge: true })
        : null;
      const assistantMessage = await prisma.chatMessage.create({
        data: {
          projectId: id,
          role: "assistant",
          content: resolved.assistantContent,
        },
      });
        return NextResponse.json({ assistantMessage, updatedArtifact }, { status: 201 });
    }

    const encA = new TextEncoder();
    let autofillContent = "";
    const autofillStream2 = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const reader = autofillStream!.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          const streamStart = Date.now();
          let timeoutReached = false;
          while (true) {
            const elapsed = Date.now() - streamStart;
            const remaining = AUTOFILL_STREAM_TIMEOUT_MS - elapsed;
            if (remaining <= 0) {
              timeoutReached = true;
              break;
            }

            const readResult = await readWithTimeout(reader.read(), remaining);
            if (readResult === "__timeout__") {
              timeoutReached = true;
              try {
                await reader.cancel("autofill stream timeout");
              } catch {
                // ignore cancellation errors
              }
              break;
            }

            const { done, value } = readResult;
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n"); buf = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const parsed = JSON.parse(payload);
                const token: string = parsed.choices?.[0]?.delta?.content ?? "";
                if (token) {
                  autofillContent += token;
                  controller.enqueue(encA.encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
              } catch { /* ignore */ }
            }
          }
          const extracted = extractArtifactUpdate(autofillContent);
          const resolved = await resolveAutofillContent({
            artifact: artifact as NonNullable<Art>,
            projectName: project.name,
            projectDescription: project.description || "",
            hasSkillReferences,
            hasDocuments,
            autofillMessages,
            autofillContext,
            primaryRawContent: autofillContent,
            primaryExtracted: extracted,
            timeoutReached,
          });
          const nextArtifactContent = resolved.nextArtifactContent;
          const updatedArtifact = nextArtifactContent
              ? await persistUpdatedArtifact(artifactId, nextArtifactContent, { merge: true })
            : null;
          const assistantMessage = await prisma.chatMessage.create({
            data: {
              projectId: id,
              role: "assistant",
              content: resolved.assistantContent,
            },
          });
          controller.enqueue(encA.encode(`data: ${JSON.stringify({ done: true, assistantMessage, updatedArtifact })}\n\n`));
        } catch (e) {
          console.error("[chat] autofill stream error:", e);
          controller.enqueue(encA.encode(`data: ${JSON.stringify({ error: true })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });
    return new Response(autofillStream2, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  }
  // ────────────────────────────────────────────────────────────────────────────

  // ── Rebuild-artifact mode ───────────────────────────────────────────────────
  // Called by the frontend after all Q&A answers are collected (either user
  // answered all questions or the 2-min idle timer fired).
  // Replays the full conversation history so the AI can incorporate every
  // answer into one final pass of the artifact.
  if (rebuildArtifact && artifactId) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { artifacts: true, documents: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const artifact = project.artifacts.find((a: NonNullable<Art>) => a.id === artifactId);
    if (!artifact) return NextResponse.json({ error: "Artifact not found" }, { status: 404 });

    const allMessages = await prisma.chatMessage.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    // Build Q&A history — strip artifact HTML blocks and the QA-done marker
    const qaHistory = allMessages
      .map((m: NonNullable<ChatMsg>) => {
        let c = m.content;
        const delimIdx = c.indexOf("<<<ARTIFACT_UPDATE>>>");
        if (delimIdx !== -1) c = c.slice(0, delimIdx).trim();
        c = c.replace(/<<<ALL_QUESTIONS_ANSWERED>>>/g, "").trim();
        return c ? { role: m.role as "user" | "assistant", content: c } : null;
      })
      .filter(Boolean) as { role: "user" | "assistant"; content: string }[];

    // Resolve the logged-in author for metadata injection
    const rebuildSession = await getServerSession(authOptions);
    const rebuildSessionUser = rebuildSession?.user?.email
      ? await prisma.user.findUnique({ where: { email: rebuildSession.user.email }, select: { name: true } })
      : null;
    const rebuildAuthorName = rebuildSessionUser?.name ?? "Unknown";
    const rebuildToday = new Date().toISOString().slice(0, 10);

    const docsContext = project.documents.map((d: NonNullable<Doc>) => d.content).join("\n\n");

    // For PRD rebuilds, inject the correct author/date so the AI fills/updates Section 1 accurately
    const isPrd = artifact.type === "prd";
    const metaBlock = isPrd
      ? `\nDOCUMENT METADATA (apply these exact values to Section 1 — Document Information & Revision History):\n` +
        `- Author: ${rebuildAuthorName}\n` +
        `- Modified Date: ${rebuildToday}\n` +
        `- For Revision History: add a new row with Date = ${rebuildToday}, Author = ${rebuildAuthorName}, and a brief one-line summary of the changes made based on the Q&A answers above. Keep all previous rows intact.\n`
      : "";

    const projectContext =
      `Project: ${project.name}\nDescription: ${project.description || "N/A"}${formatStakeholders(project.stakeholders)}\n\nDocuments:\n${docsContext || "None"}\n\n` +
      `--- ARTIFACT TO REBUILD ---\nType: ${artifact.type}\nTitle: ${artifact.title}\n\n` +
      `Current content (may still contain [To be confirmed — ...] markers):\n${artifact.content}\n--- END ARTIFACT ---\n\n` +
      metaBlock +
      `REBUILD INSTRUCTION: The user has answered clarifying questions throughout this conversation. ` +
      `Using ALL answers they provided, produce the complete updated artifact. ` +
      `For every [To be confirmed — ...] marker, find the user's answer in the conversation and replace the marker with the resolved value. ` +
      `If an item was NOT answered, keep the [To be confirmed — ...] marker. ` +
      `Output format: one sentence ("I've updated the document — you can review it in the editor on the right.") ` +
      `followed immediately by the full artifact in <<<ARTIFACT_UPDATE>>> / <<<END_ARTIFACT_UPDATE>>> delimiters.`;

    const rebuildMessages: { role: "user" | "assistant"; content: string }[] = [
      ...qaHistory,
      { role: "user", content: "Please now build the complete updated document incorporating all my answers." },
    ];

    let rebuildStream: ReadableStream<Uint8Array> | null = null;
    try {
      rebuildStream = await streamChatResponse(rebuildMessages, projectContext, artifact.type);
    } catch (e) {
      console.error("[chat] rebuild stream threw:", e);
    }

    if (!rebuildStream) {
      const aiResponse = await generateChatResponse(rebuildMessages, projectContext, artifact.type);
      const assistantMessage = await prisma.chatMessage.create({
        data: { projectId: id, role: "assistant", content: aiResponse.content },
      });
      return NextResponse.json({ assistantMessage }, { status: 201 });
    }

    const enc2 = new TextEncoder();
    let rebuildContent = "";
    const rebuildStream2 = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const reader = rebuildStream!.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const parsed = JSON.parse(payload);
                const token: string = parsed.choices?.[0]?.delta?.content ?? "";
                if (token) {
                  rebuildContent += token;
                  controller.enqueue(enc2.encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
              } catch { /* ignore */ }
            }
          }
          const assistantMessage = await prisma.chatMessage.create({
            data: { projectId: id, role: "assistant", content: rebuildContent },
          });
          controller.enqueue(enc2.encode(`data: ${JSON.stringify({ done: true, assistantMessage })}\n\n`));
        } catch (e) {
          console.error("[chat] rebuild stream error:", e);
          controller.enqueue(enc2.encode(`data: ${JSON.stringify({ error: true })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });
    return new Response(rebuildStream2, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });
  }
  // ────────────────────────────────────────────────────────────────────────────

  // ── Clarify-artifact mode ──────────────────────────────────────────────────
  // Called automatically after artifact generation. Parses [To be confirmed — ...]
  // markers directly from the artifact HTML so the response is instant and
  // specific to the actual gaps — no second AI call needed.
  if (clarifyArtifact && artifactId) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { artifacts: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const artifact = project.artifacts.find((a: NonNullable<Art>) => a.id === artifactId);
    if (!artifact) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }

    // Extract every [To be confirmed — <reason>] item from the generated HTML.
    // The pattern handles em-dash (—), en-dash (–), and hyphen (-) separators.
    const missingItems: string[] = [];
    const pattern = /\[To be confirmed[^\]—–\-]*[—–\-]\s*([^\]<]+)/gi;
    let hit: RegExpExecArray | null;
    while ((hit = pattern.exec(artifact.content)) !== null) {
      const text = hit[1]
        .replace(/<[^>]+>/g, "")   // strip any inner HTML tags
        .replace(/\s+/g, " ")
        .trim();
      if (text && !missingItems.includes(text)) missingItems.push(text);
    }

    const GUIDED_BATCH_SIZE = 4;
    const firstBatch = missingItems.slice(0, GUIDED_BATCH_SIZE);
    const remaining = missingItems.length - firstBatch.length;

    let content: string;
    if (missingItems.length > 0) {
      content =
        `I've generated an initial draft of the **${artifact.title}**. I found **${missingItems.length} gap${missingItems.length === 1 ? "" : "s"}** that need your input — I'll ask **${GUIDED_BATCH_SIZE} at a time** so it's easy to answer.\n\n` +
        `**Questions 1–${firstBatch.length}** of ${missingItems.length}:\n\n` +
        firstBatch.map((item, i) => `**Q${i + 1}.** ${item}`).join("\n\n") +
        (remaining > 0
          ? `\n\n_${remaining} more question${remaining === 1 ? "" : "s"} will follow once you answer these._`
          : "") +
        `\n\nJust reply with your answers and I'll update the document right away.`;
    } else {
      content = `I've generated the **${artifact.title}**. The draft looks fairly complete based on your documents. Feel free to ask me to refine any section.`;
    }

    const assistantMessage = await prisma.chatMessage.create({
      data: { projectId: id, role: "assistant", content },
    });

    return NextResponse.json({ assistantMessage }, { status: 201 });
  }
  // ──────────────────────────────────────────────────────────────────────────

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json(
      { error: "Message content is required" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: { artifacts: true, documents: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Default User",
        email: "user@example.com",
        role: "product_manager",
      },
    });
  }

  // Save user message
  const userMessage = await prisma.chatMessage.create({
    data: {
      projectId: id,
      userId: user.id,
      role: "user",
      content: content.trim(),
    },
  });

  // Build conversation history
  const previousMessages = await prisma.chatMessage.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  const conversationHistory = previousMessages.map((m: NonNullable<ChatMsg>) => {
    let msgContent = m.content;
    // Strip artifact update blocks so they don't consume the token budget on subsequent turns
    const delimIdx = msgContent.indexOf("<<<ARTIFACT_UPDATE>>>");
    if (delimIdx !== -1) {
      msgContent = msgContent.slice(0, delimIdx).trim() || "I updated the document as requested.";
    }
    // For assistant messages, strip any replayed Q&A history the model may have prepended.
    // The model replays prior Q&A separated by "---" before the actual answer — take only
    // the LAST segment (the real answer to that turn's question).
    if (m.role === "assistant") {
      const segments = msgContent.split(/\n\s*---+\s*\n/);
      const lastSegment = segments[segments.length - 1].trim();
      msgContent = lastSegment || msgContent;
    }
    return { role: m.role as "user" | "assistant", content: msgContent };
  });

  // Build context
  const docsContext = project.documents.map((d: NonNullable<Doc>) => d.content).join("\n\n");
  // Include full content of every artifact so cross-artifact questions (e.g. "is Okta used?") work correctly.
  // Each artifact is clearly labelled so the AI can cite which document it found the answer in.
  const artifactsContext = project.artifacts
    .map((a: NonNullable<Art>) => `--- ${a.title} [type: ${a.type}, status: ${a.status}] ---\n${a.content}\n--- END ${a.type} ---`)
    .join("\n\n");

  // If editing a specific artifact, inject its full content as focused context
  // Only do this if editArtifact flag is explicitly set (normal conversation should work even with activeArtifact)
  let editContext = "";
  let chatArtifactType: string | undefined;

  // If the user is viewing an open artifact and asks a question, inject its full content as read context
  if (viewingArtifactId && typeof viewingArtifactId === "string" && !editArtifact) {
    const viewedArtifact = project.artifacts.find((a: NonNullable<Art>) => a.id === viewingArtifactId);
    if (viewedArtifact) {
      chatArtifactType = viewedArtifact.type;
      editContext = `\n\n--- CURRENTLY OPEN ARTIFACT ---\nType: ${viewedArtifact.type}\nTitle: ${viewedArtifact.title}\nStatus: ${viewedArtifact.status}\n\nFull content:\n${viewedArtifact.content}\n--- END ARTIFACT ---\n\nThe user is viewing this artifact. Answer their question in the context of this document. If they ask you to make changes, update the artifact and emit it in <<<ARTIFACT_UPDATE>>> / <<<END_ARTIFACT_UPDATE>>> delimiters.`;
    }
  }

  if (editArtifact && artifactId && typeof artifactId === "string") {
    const targetArtifact = project.artifacts.find((a: NonNullable<Art>) => a.id === artifactId);
    if (targetArtifact) chatArtifactType = targetArtifact.type;
    if (targetArtifact) {
      // Extract remaining [To be confirmed — ...] items so the AI knows what's left to ask
      const remainingTBDs: string[] = [];
      const tbdPattern = /\[To be confirmed[^\]\u2014\u2013\-]*[\u2014\u2013\-]\s*([^\]<]+)/gi;
      let tbdHit: RegExpExecArray | null;
      while ((tbdHit = tbdPattern.exec(targetArtifact.content)) !== null) {
        const text = tbdHit[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
        if (text && !remainingTBDs.includes(text)) remainingTBDs.push(text);
      }
      const tbdSection = remainingTBDs.length > 0
        ? `\n\nREMAINING UNRESOLVED ITEMS IN THIS ARTIFACT (${remainingTBDs.length} total — the user is answering these in batches of 4):\n${remainingTBDs.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
        : `\n\nAll [To be confirmed] items in this artifact have been resolved.`;

      editContext = `\n\n--- ARTIFACT BEING EDITED ---\nType: ${targetArtifact.type}\nTitle: ${targetArtifact.title}\nStatus: ${targetArtifact.status}\n\nCurrent content:\n${targetArtifact.content}\n--- END ARTIFACT ---${tbdSection}\n\nGUIDED Q&A MODE ACTIVE: The user is answering clarifying questions in batches of 4. When they provide answers: (1) incorporate ALL answers into the correct artifact sections, replacing the [To be confirmed — ...] markers with the resolved values, (2) emit the full updated artifact in <<<ARTIFACT_UPDATE>>> delimiters, (3) show progress and ask the NEXT batch of up to 4 remaining unresolved items. If all resolved, celebrate completion.`;
    }
  }

  const projectContext = `Project: ${project.name}\nDescription: ${project.description || "N/A"}\nPhase: ${project.phase}${formatStakeholders(project.stakeholders)}\n\nDocuments:\n${docsContext || "None"}\n\nProject Artifacts (full content — use these to answer any question about the project):\n${artifactsContext || "None yet"}${editContext}`;

  // Generate AI response — attempt streaming first, fall back to non-streaming
  let aiStream = null;
  try {
    aiStream = await streamChatResponse(conversationHistory, projectContext, chatArtifactType);
  } catch (e) {
    console.error("[chat] streamChatResponse threw:", e);
  }

  if (!aiStream) {
    console.warn("[chat] No stream returned — falling back to non-streaming. History length:", conversationHistory.length);
  }

  if (aiStream) {
    const encoder = new TextEncoder();
    let fullContent = "";

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const reader = aiStream.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const parsed = JSON.parse(payload);
                const token: string = parsed.choices?.[0]?.delta?.content ?? "";
                if (token) {
                  fullContent += token;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
                  );
                }
              } catch {
                // ignore unparseable SSE chunks
              }
            }
          }

          // Save assistant message and send done signal
          // If the stream produced no content, use the error message from generateChatResponse
          let finalContent = fullContent.trim();
          if (!finalContent) {
            console.warn("[chat] Empty stream content — using generateChatResponse fallback");
            const aiResponse = await generateChatResponse(conversationHistory, projectContext, chatArtifactType);
            finalContent = aiResponse.content;
          }

          const assistantMessage = await prisma.chatMessage.create({
            data: { projectId: id, role: "assistant", content: finalContent },
          });

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, userMessage, assistantMessage })}\n\n`
            )
          );
        } catch (e) {
          // On error, signal done so client doesn't hang
          console.error("[chat] stream processing error:", e);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

  // Non-streaming fallback (mock mode or if streaming failed)
  const aiResponse = await generateChatResponse(conversationHistory, projectContext, chatArtifactType);

  const assistantMessage = await prisma.chatMessage.create({
    data: {
      projectId: id,
      role: "assistant",
      content: aiResponse.content,
    },
  });

  return NextResponse.json(
    { userMessage, assistantMessage },
    { status: 201 }
  );
}
