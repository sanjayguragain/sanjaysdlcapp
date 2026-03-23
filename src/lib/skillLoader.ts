/**
 * skillLoader.ts — Server-side only.
 *
 * Reads agent and skill specification files from .github/agents/ and
 * .github/skills/ at runtime, so artifact generation prompts are always
 * derived from the live skill definitions rather than static strings.
 *
 * Files are cached in memory after first read to avoid repeated disk I/O.
 */

import fs from "fs";
import path from "path";

// ── In-memory cache ───────────────────────────────────────────────────────────
type CachedFile = {
  content: string;
  mtimeMs: number;
};

const _cache = new Map<string, CachedFile>();

/** Absolute path to the .github directory in this repo. */
const GITHUB_DIR = path.join(process.cwd(), ".github");

// ── Low-level helpers ─────────────────────────────────────────────────────────

/** Read a file relative to .github/. Returns empty string on error. */
function readGithubFile(relativePath: string): string {
  const full = path.join(GITHUB_DIR, relativePath);
  try {
    const stat = fs.statSync(full);
    const cached = _cache.get(relativePath);
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      return cached.content;
    }

    const text = fs.readFileSync(full, "utf-8");
    _cache.set(relativePath, {
      content: text,
      mtimeMs: stat.mtimeMs,
    });
    return text;
  } catch {
    console.warn(`[skillLoader] Cannot read: ${full}`);
    return "";
  }
}

/** Strip YAML frontmatter (--- ... ---) from Markdown content. */
function stripFrontmatter(content: string): string {
  const t = content.trimStart();
  if (!t.startsWith("---")) return t;
  const end = t.indexOf("\n---", 3);
  return end !== -1 ? t.slice(end + 4).trimStart() : t;
}

/** Minimal YAML frontmatter key-value parser (no external dependency). */
function parseFrontmatter(content: string): Record<string, string> {
  const t = content.trimStart();
  if (!t.startsWith("---")) return {};
  const end = t.indexOf("\n---", 3);
  if (end === -1) return {};
  const yaml = t.slice(4, end);
  const result: Record<string, string> = {};
  for (const line of yaml.split("\n")) {
    const match = line.match(/^([\w-]+)\s*:\s*(.+)$/);
    if (match) result[match[1]] = match[2].replace(/^['"]|['"]$/g, "").trim();
  }
  return result;
}

// ── Public loaders ────────────────────────────────────────────────────────────

/** Load an agent spec from .github/agents/<filename>. */
export function loadAgent(filename: string): string {
  return stripFrontmatter(readGithubFile(`agents/${filename}`));
}

/** Load a skill spec from .github/skills/<relative-path>. */
export function loadSkill(skillRelPath: string): string {
  return stripFrontmatter(readGithubFile(`skills/${skillRelPath}`));
}

/** Load a reusable prompt from .github/prompts/<filename>. */
export function loadPrompt(filename: string): string {
  return stripFrontmatter(readGithubFile(`prompts/${filename}`));
}

/** Load an engineering standard from .github/standards/<filename>. */
export function loadStandard(filename: string): string {
  return stripFrontmatter(readGithubFile(`standards/${filename}`));
}

/** Load a canonical template from .github/templates/<relative-path>. */
export function loadTemplate(templateRelPath: string): string {
  return stripFrontmatter(readGithubFile(`templates/${templateRelPath}`));
}

// ── Skill map: artifact type → skill file paths ───────────────────────────────
// Each entry lists the skill files (relative to .github/skills/) that inform
// how a given artifact type should be generated.

const SKILL_MAP: Record<string, string[]> = {
  prd: [
    "code-generation/sce-prd-generator/SKILL.md",
    "devops/sce-requirements-gatherer/SKILL.md",
    "architecture/sce-diagram-creator/SKILL.md",
    "branding/brand-guidelines/SKILL.md",
    "branding/frontend-designer/SKILL.md",
  ],
  brd: [
    "requirements-elicitation/business-rules-analysis/SKILL.md",
    "requirements-elicitation/sce-technical-requirement-writer/SKILL.md",
    "devops/sce-requirements-gatherer/SKILL.md",
    "branding/brand-guidelines/SKILL.md",
    "branding/frontend-designer/SKILL.md",
  ],
  avd: [
    "architecture/sce-adr-writer/SKILL.md",
    "code-generation/sce-flow-mapper/SKILL.md",
    "architecture/sce-diagram-creator/SKILL.md",
    "branding/brand-guidelines/SKILL.md",
    "branding/frontend-designer/SKILL.md",
  ],
  srs: [
    "requirements-elicitation/sce-technical-requirement-writer/SKILL.md",
    "requirements-elicitation/use-case-2.0/SKILL.md",
    "devops/sce-requirements-gatherer/SKILL.md",
    "branding/brand-guidelines/SKILL.md",
    "branding/frontend-designer/SKILL.md",
  ],
  sad: [
    "architecture/sce-adr-writer/SKILL.md",
    "code-generation/sce-data-model-extractor/SKILL.md",
    "code-generation/sce-flow-mapper/SKILL.md",
    "architecture/sce-diagram-creator/SKILL.md",
    "branding/brand-guidelines/SKILL.md",
    "branding/frontend-designer/SKILL.md",
  ],
  ses: [
    "requirements-elicitation/sce-technical-requirement-writer/SKILL.md",
    "testing/sce-tdd-template-generator/SKILL.md",
    "compliance/sce-config-detector/SKILL.md",
    "architecture/sce-diagram-creator/SKILL.md",
    "branding/brand-guidelines/SKILL.md",
    "branding/frontend-designer/SKILL.md",
  ],
  prd_validation: [
    "requirements-elicitation/sce-6cs-quality-framework/SKILL.md",
    "requirements-elicitation/sce-technical-requirement-writer/SKILL.md",
    "requirements-elicitation/sce-requirements-cross-reference/SKILL.md",
  ],
  preliminary_estimation: [
    "requirements-elicitation/gap-analysis/SKILL.md",
    "devops/sce-dora-metrics-calculator/SKILL.md",
    "requirements-elicitation/sce-gap-analysis-report-generator/SKILL.md",
  ],
  cyber_risk_analysis: [
    "security/sce-vulnerability-scanner/SKILL.md",
    "security/sce-auth-auditor/SKILL.md",
    "security/sce-data-protection-reviewer/SKILL.md",
    "security/sce-security-report-generator/SKILL.md",
    "security/sce-api-security-reviewer/SKILL.md",
    "security/sce-input-validation-checker/SKILL.md",
  ],
  compliance_report: [
    "compliance/sce-compliance-checker/SKILL.md",
    "compliance/sce-tech-policy-resolver/SKILL.md",
    "compliance/sce-dependency-scanner/SKILL.md",
  ],
  revised_estimation: [
    "requirements-elicitation/gap-analysis/SKILL.md",
    "devops/sce-dora-metrics-calculator/SKILL.md",
    "requirements-elicitation/sce-gap-analysis-report-generator/SKILL.md",
  ],
  test_plan: [
    "testing/sce-tdd-template-generator/SKILL.md",
    "testing/sce-octane-story-test-impact-analyzer/SKILL.md",
  ],
  quality_review: [
    "requirements-elicitation/sce-6cs-quality-framework/SKILL.md",
    "testing/sce-octane-story-test-impact-analyzer/SKILL.md",
    "code-generation/sce-code-review-standards/SKILL.md",
  ],
  deployment_plan: [
    "devops/sce-build-deploy-test-workflow-generator/SKILL.md",
    "devops/sce-deploy-workflow-generator/SKILL.md",
    "devops/sce-workflow-documenter/SKILL.md",
    "architecture/sce-diagram-creator/SKILL.md",
  ],
};

// ── Model resolution ──────────────────────────────────────────────────────────
// Reads the `model` field from skill frontmatter for each artifact type's
// primary skill. Returns the first explicit model found, or undefined.

const _modelCache = new Map<string, string | undefined>();

/**
 * Return the preferred model for an artifact type by inspecting the frontmatter
 * of its mapped skills. Caches results. Returns undefined when no skill
 * specifies a model (caller should use a default).
 */
export function getArtifactModel(artifactType: string): string | undefined {
  if (_modelCache.has(artifactType)) return _modelCache.get(artifactType);

  const skillPaths = SKILL_MAP[artifactType] ?? [];
  for (const p of skillPaths) {
    const raw = readGithubFile(`skills/${p}`);
    if (!raw) continue;
    const fm = parseFrontmatter(raw);
    if (fm.model && fm.model.toLowerCase() !== "auto") {
      _modelCache.set(artifactType, fm.model);
      return fm.model;
    }
  }
  _modelCache.set(artifactType, undefined);
  return undefined;
}

// ── Prompt map: artifact type → prompt files ─────────────────────────────────
// Each entry lists prompt files (relative to .github/prompts/) that further
// guide generation for the given artifact type.

const PROMPT_MAP: Record<string, string[]> = {
  prd: [],
  brd: [
    "Business-Case-Builder.prompt.md",
  ],
  avd: [
    "Architecture-Vision-Document.prompt.md",
  ],
  srs: [
    "Architecture-for-Application-Architecture.prompt.md",
    "Architecture-for-Data.prompt.md",
  ],
  sad: [
    "Architecture-for-Application-Architecture.prompt.md",
    "Architecture-for-Technology.prompt.md",
  ],
  ses: [
    "Architecture-for-Operational-Services.prompt.md",
  ],
  prd_validation: [
    "refine-artifact.prompt.md",
  ],
  preliminary_estimation: [
    "run-full-pipeline.prompt.md",
  ],
  cyber_risk_analysis: [
    "BETA-Architecture-Risk-Assessment.prompt.md",
  ],
  compliance_report: [
    "run-full-pipeline.prompt.md",
  ],
  revised_estimation: [
    "run-full-pipeline.prompt.md",
  ],
  test_plan: [
    "run-full-pipeline.prompt.md",
  ],
  quality_review: [
    "refine-artifact.prompt.md",
  ],
  deployment_plan: [
    "run-full-pipeline.prompt.md",
  ],
};

// ── Template map: artifact type → canonical template files ──────────────────
// Template blocks are authoritative for section naming and ordering.

const TEMPLATE_MAP: Record<string, string[]> = {
  prd: [
    "PRD/PRD-{product-name-kebab-case}.md",
  ],
};

// ── Standards map: artifact type → standards files ──────────────────────────
// Standards provide cross-cutting governance and quality constraints that must
// be applied in addition to skills and prompts.

const STANDARD_MAP: Record<string, string[]> = {
  _default: [
    "CODING-BEST-PRACTICES.md",
    "CONTEXT_PASSING_STANDARDS.md",
    "AGENT-SKILLS-STANDARD-QUICK-REFERENCE.md",
  ],
  prd: [
    "PANCAKE-PROTOCOL-QUICK-REFERENCE.md",
  ],
  brd: [
    "PANCAKE-PROTOCOL-QUICK-REFERENCE.md",
  ],
  avd: [
    "PANCAKE-PROTOCOL-QUICK-REFERENCE.md",
    "TECH_STACK_STANDARDS.md",
  ],
  srs: [
    "PANCAKE-PROTOCOL-QUICK-REFERENCE.md",
    "TECH_STACK_STANDARDS.md",
  ],
  sad: [
    "PANCAKE-PROTOCOL-QUICK-REFERENCE.md",
    "TECH_STACK_STANDARDS.md",
  ],
  ses: [
    "PANCAKE-PROTOCOL-QUICK-REFERENCE.md",
    "TECH_STACK_STANDARDS.md",
  ],
  cyber_risk_analysis: [
    "CYBERSTANDARDS_V10.md",
    "tech-policy-matrix.yaml",
  ],
  compliance_report: [
    "CYBERSTANDARDS_V10.md",
    "tech-policy-matrix.yaml",
    "APPROVAL_REQUEST.md",
  ],
  deployment_plan: [
    "TECH_STACK_STANDARDS.md",
    "tech-policy-matrix.yaml",
    "APPROVAL_REQUEST.md",
  ],
};

const MAX_STANDARD_CHARS = 12000;

function compactStandard(content: string): string {
  if (content.length <= MAX_STANDARD_CHARS) return content;
  return `${content.slice(0, MAX_STANDARD_CHARS)}\n\n...[truncated standard content for prompt budget]...`;
}

// ── Per-type generation instructions ─────────────────────────────────────────
// These instruct the LLM what to produce; the skill specs above tell it *how*.

const TYPE_INSTRUCTIONS: Record<string, string> = {
  brd: `Generate a complete Business Requirements Document (BRD) in enterprise format.

Include:
- Executive Summary and business context
- Business goals/objectives and measurable outcomes
- Scope (in-scope / out-of-scope)
- Stakeholders and business process impacts
- Detailed business requirements with numbered IDs (BR-001, BR-002...)
- Assumptions, dependencies, risks, and constraints
- Success metrics and acceptance criteria`,

  avd: `Generate a complete Architecture Vision Document (AVD).

Include:
- Architecture vision and target-state summary
- Architectural principles and constraints
- Current-state vs target-state comparison
- High-level component/integration overview
- System Context Diagram: Include a dedicated section with a Mermaid system context diagram showing users, product boundary, external systems, and key data flows
- Integration/Deployment Diagram: Include at least one additional Mermaid diagram for integration topology or deployment view
- Technology and platform decisions with rationale
- Key architecture risks and trade-offs
- Governance and decision log

Diagram format requirement (use one of these exact formats so renderer/export can detect it):
<pre class="mermaid">graph TD
  User[Business User] --> App[Proposed Solution]
  App --> IdP[Identity Provider]
  App --> Core[(Core System)]
  App --> Ext[External Service]
</pre>

or

\`\`\`mermaid
graph TD
  User[Business User] --> App[Proposed Solution]
\`\`\``,

  srs: `Generate a complete System Requirements Specification (SRS).

Include:
- Functional requirements with numbered IDs (FR-001, FR-002...)
- Non-functional requirements (performance, scalability, security, availability)
- External interface requirements
- Data requirements and constraints
- Assumptions and dependencies
- Acceptance criteria and verification approach
- Traceability references`,

  sad: `Generate a complete Solution Architecture Definition (SAD).

Include:
- Architecture overview and design decisions
- Component/module decomposition
- Data flow and integration patterns
- Deployment topology and environment model
- Security architecture controls
- Scalability, resilience, and observability considerations
- Risks, assumptions, and implementation constraints`,

  ses: `Generate a complete System Engineering Specification (SES).

Include:
- Engineering specification scope and boundaries
- Component responsibilities and interface contracts
- Operational and runtime constraints
- Verification and validation criteria
- Testability and quality gates
- Release/readiness requirements
- Risks, assumptions, and dependency matrix`,

  prd: `Generate a complete Product Requirements Document (PRD) following Template 4 structure defined in the sce-prd-generator skill above.

MANDATORY requirement numbering:
- Functional requirements: FR-001, FR-002…
- Non-functional requirements: NFR-001, NFR-002…
- Security / compliance: SEC-001, SEC-002…
- Data governance rules: DG-001, DG-002…

COMPREHENSIVENESS REQUIREMENTS (CRITICAL):
- The PRD must be a thorough, enterprise-quality document. Sparse or skeletal output is unacceptable.
- Executive Summary: 2-3 paragraphs covering problem, solution, impact, and timeline.
- Problem Statement: Detailed business problem with quantified impact and stakeholder pain points.
- Goals and Objectives: At least 3-5 SMART objectives with measurable success criteria.
- Target Users / Personas: 2-4 detailed personas with role, goals, pain points, and usage frequency.
- Functional Requirements: **Minimum 15 numbered requirements** (FR-001 through FR-015+), each with a description and acceptance criteria. Group by feature area.
- Non-Functional Requirements: **Minimum 8 numbered requirements** (NFR-001 through NFR-008+) covering performance (with ms/% targets), security, scalability, availability, accessibility, and maintainability.
- User Stories / Scenarios: At least 5 user stories in "As a [role], I want to [action] so that [benefit]" format, with Gherkin acceptance criteria for the 3 most critical scenarios.
- Acceptance Criteria: Testable pass/fail criteria for key requirements.
- Dependencies and Assumptions: List all external dependencies, integration points, and key assumptions.
- Out of Scope: Explicitly list excluded items to prevent scope creep.
- Risks and Mitigations: At least 5 project risks with severity, likelihood, and mitigation actions.
- System Context Diagram: Include a dedicated section with a Mermaid system context diagram showing external actors/systems, the product boundary, and key integrations/data flows.
  Diagram format requirement (use exactly this pattern so renderer/export can detect it):
  <pre class="mermaid">graph TD
    User[End User] --> App[Product System]
    App --> IdP[Identity Provider]
    App --> DB[(Primary Database)]
    App --> Ext[External Service]
  </pre>
- Traceability Matrix: HTML table mapping Objectives → User Scenarios → Requirements → Acceptance Criteria.
- Timeline / Milestones: Phased delivery plan with dates or relative timeline.

Include ALL sections from the Template 4 skeleton in order. Append the watermark block exactly as defined in OUTPUT RULES at the very end of the document.`,

  prd_validation: `Generate a PRD Validation Report applying the 6Cs quality framework (Clear, Concise, Complete, Consistent, Correct, Confirmable) and INVEST principles as defined in the skill above.

Include:
- Per-requirement quality scores (1–5 scale) for EVERY requirement in the PRD (present as an HTML table with columns: Req ID, Requirement Summary, Clear, Complete, Consistent, Correct, Confirmable, Avg Score)
- Gap analysis: missing sections or requirements vs. Template 4 — list each gap with severity and recommendation
- Testability assessment for each requirement (Testable / Partially Testable / Not Testable with rationale)
- Ambiguity detection: flag every vague phrase (“should”, “as needed”, “usually”, etc.) with suggested rewording
- INVEST assessment for user stories (Independent, Negotiable, Valuable, Estimable, Small, Testable)
- Specific, actionable improvement recommendations grouped by priority (Critical / Important / Nice-to-have)
- Aggregate quality metrics: overall readiness score (0–100), per-section scores, requirements quality histogram
- Conclusion with Go/No-Go recommendation and conditions for approval`,

  preliminary_estimation: `Generate a Preliminary Effort and Timeline Estimation document following the gap-analysis and DORA metrics skill guidance above.

Include:
- Effort breakdown by feature area (story points or person-days) — present as an HTML table with columns: Feature Area, Complexity, Effort (person-days), Story Points, Notes
- Required team composition and roles with headcount per role
- Phased delivery timeline with milestones — at least 3-4 phases (Discovery, Build, Testing, Deployment) with dates or week ranges
- T-shirt sizing summary (S/M/L/XL) for each feature area with justification
- Key assumptions and dependencies — list at least 5-8 specific assumptions
- Risk factors affecting the estimates with probabilistic impact assessment
- Confidence level (Low / Medium / High) per estimate category with explanation
- Total effort summary: best case, expected case, worst case
- Velocity assumptions and basis (historical data or team calibration)`,

  cyber_risk_analysis: `Generate a Cyber Risk Analysis applying the vulnerability scanner, auth auditor, data-protection reviewer, and security report generator skills above.

Use STRIDE threat modelling. Include:
- Threat model summary: at least 6-10 threats categorized by STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) — present as an HTML table
- Attack surface and vulnerability assessment: enumerate all entry points (APIs, UI, data flows, third-party integrations)
- Authentication / authorization risk review: evaluate auth mechanisms, session management, privilege escalation vectors
- API security evaluation: input validation, rate limiting, OWASP API Top 10 mapping
- Data classification and sensitivity mapping: identify PII, PHI, financial data with handling requirements
- Third-party integration risks: each dependency scored by risk level
- Risk severity matrix: HTML table with Likelihood (1-5) × Impact (1-5) for each identified threat
- Prioritised mitigation strategies: for each risk, specify control type (preventive/detective/corrective), implementation effort, and owner
- Residual risk after mitigations: re-scored matrix showing risk reduction
- Compliance / regulatory implications: GDPR, SOC 2, PCI-DSS, HIPAA mapping where applicable
- Security architecture recommendations: concrete technical controls to implement`,

  compliance_report: `Generate a Compliance Assessment Report applying the compliance-checker and tech-policy-resolver skills above.

Identify applicable frameworks (GDPR, SOC 2, HIPAA, PCI-DSS, ISO 27001 as relevant). Include:
- Control gap analysis mapped to each framework
- Data privacy and data retention assessment
- Audit trail and access control requirements
- Remediation recommendations with ownership and priority
- Compliance monitoring and review plan`,

  revised_estimation: `Generate a Revised Estimation incorporating security, compliance, and risk findings from earlier SDLC phases.

Include:
- Updated effort breakdown showing added security/compliance tasks
- Risk contingency buffer (quantified)
- Revised phased timeline
- Side-by-side comparison with the preliminary estimate
- Change log: what changed and why`,

  test_plan: `Generate a comprehensive Test Plan following the TDD template generator skill structure above.

Cover:
- Test strategy overview (approach, tools, owner) with justification for chosen approach
- In-scope and out-of-scope items — explicit boundary table
- Test types: unit, integration, e2e, performance, security, UAT — for each type include: scope, tools, coverage target, estimated effort
- Test case matrix by feature area: HTML table with columns: Feature, Test Type, # Test Cases, Priority, Automation?, Owner
- Environment and test data requirements: list each environment (dev, QA, staging, prod-like) with specifications
- Acceptance criteria traceability: map each FR/NFR to specific test cases
- Automation strategy: what to automate vs. manual, tool selection rationale, ROI estimation
- Performance testing plan: load profiles, SLA targets, tools, scenarios
- Security testing plan: SAST/DAST/penetration testing scope and tools
- Defect management process: severity definitions, SLA for resolution, escalation path
- Regression strategy: scope, frequency, automation coverage
- Entry/exit criteria for each test phase
- Test schedule and milestones`,

  quality_review: `Generate a Quality Review and Release Readiness Report applying the 6Cs framework and test impact analysis skill above.

Include:
- Test execution summary (pass/fail counts, coverage %)
- Requirements coverage analysis: % tested / % passed
- Defect summary and trend (open, critical, resolved)
- Performance test results
- Security test results
- Code quality indicators (if available)
- Go / No-Go recommendation with clear rationale
- Outstanding items with mitigations and owners`,

  deployment_plan: `Generate a Deployment Plan following the build-deploy-test and deploy workflow generator skill patterns above.

Include:
- Deployment strategy: blue-green / canary / rolling (justify choice)
- Environment topology: dev → test → staging → prod
- Step-by-step sequential deployment procedure
- Pre-deployment checklist
- Rollback procedure and decision criteria
- Health check and smoke test criteria
- Monitoring and alerting setup
- Communication and change management plan`,
};

// ── Core export ───────────────────────────────────────────────────────────────

/**
 * Build a complete artifact-generation prompt by composing:
 *   1. Agent spec (PRD only) from .github/agents/PRD-Builder.agent.md
 *   2. Skill specifications from .github/skills/<type-specific paths>
 *   3. Type-specific generation instruction
 *   4. Universal HTML output rules
 *
 * If skill files cannot be read (e.g., running in a stripped environment),
 * only the generation instruction and output rules are returned.
 */
/**
 * Strip Phase 1 (clarifying questions) from the PRD-Builder agent spec.
 * Phase 1 applies only to the interactive chat flow; direct artifact generation
 * must always produce a complete document immediately — never a Q&A table.
 */
function stripPhase1FromAgent(agentContent: string): string {
  const phase1Start = agentContent.indexOf("## Phase 1");
  const phase2Start = agentContent.indexOf("## Phase 2");
  if (phase1Start === -1) return agentContent;
  if (phase2Start !== -1 && phase2Start > phase1Start) {
    return agentContent.slice(0, phase1Start) + agentContent.slice(phase2Start);
  }
  return agentContent.slice(0, phase1Start);
}

export interface ArtifactMeta {
  /** Full name of the logged-in user creating / updating the document. */
  authorName?: string;
  /** ISO date string (YYYY-MM-DD) of today, passed from the server. */
  createdDate?: string;
  /** True when regenerating an existing artifact (triggers update-mode instructions). */
  isUpdate?: boolean;
  /** One-line summary of what changed (for Revision History row on updates). */
  changeSummary?: string;
}

export interface ArtifactWatermarkMetadata {
  engine: string;
  agentsUsed: string[];
  skillsUsed: string[];
  referencesUsed: string[];
}

function uniquePreserveOrder(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

export function getArtifactWatermarkMetadata(type: string): ArtifactWatermarkMetadata {
  const agentsUsed = type === "prd"
    ? ["agents/PRD-Builder.agent.md"]
    : [];

  const skillsUsed = (SKILL_MAP[type] ?? []).map((skillPath) => `skills/${skillPath}`);
  const standardFiles = uniquePreserveOrder([
    ...(STANDARD_MAP._default ?? []),
    ...(STANDARD_MAP[type] ?? []),
  ]);
  const referencesUsed = [
    ...(TEMPLATE_MAP[type] ?? []).map((templatePath) => `templates/${templatePath}`),
    ...(PROMPT_MAP[type] ?? []).map((promptPath) => `prompts/${promptPath}`),
    ...standardFiles.map((standardPath) => `standards/${standardPath}`),
  ];

  return {
    engine: "SDLC Hub Artifact Engine",
    agentsUsed: uniquePreserveOrder(agentsUsed),
    skillsUsed: uniquePreserveOrder(skillsUsed),
    referencesUsed: uniquePreserveOrder(referencesUsed),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildWatermarkJson(metadata: ArtifactWatermarkMetadata): string {
  return JSON.stringify(
    {
      generated_by: {
        engine: metadata.engine,
      },
      agents_used: metadata.agentsUsed,
      skills_used: metadata.skillsUsed,
      references_used: metadata.referencesUsed,
    },
    null,
    2
  );
}

export function buildArtifactWatermarkSection(
  type: string,
  format: "html" | "markdown" = "html"
): string {
  const metadata = getArtifactWatermarkMetadata(type);
  const watermarkJson = buildWatermarkJson(metadata);

  if (format === "markdown") {
    return [
      "## Watermark",
      "",
      `Generated by: ${metadata.engine}`,
      "",
      "```json",
      watermarkJson,
      "```",
    ].join("\n");
  }

  return [
    "<h2>Watermark</h2>",
    `<p>Generated by: ${metadata.engine}</p>`,
    `<pre><code class="language-json">${escapeHtml(watermarkJson)}</code></pre>`,
  ].join("\n");
}

function stripExistingArtifactWatermark(content: string, format: "html" | "markdown"): string {
  let cleaned = content
    .replace(/\s*<!--\s*generated_by:[\s\S]*?-->\s*/gi, "\n")
    .replace(/\s*<!--\s*skills_used:[\s\S]*?-->\s*/gi, "\n")
    .replace(/\s*<!--\s*references_used:[\s\S]*?-->\s*/gi, "\n");

  if (format === "html") {
    cleaned = cleaned.replace(/\s*<h[1-6][^>]*>\s*Watermark\s*<\/h[1-6]>[\s\S]*$/i, "");
  } else {
    cleaned = cleaned.replace(/\n{0,2}##\s+Watermark\s*[\s\S]*$/i, "");
  }

  return cleaned.trim();
}

export function applyArtifactWatermark(type: string, content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return content;

  const format: "html" | "markdown" = /<[a-z][\s\S]*>/i.test(trimmed)
    ? "html"
    : "markdown";
  const withoutExisting = stripExistingArtifactWatermark(trimmed, format);
  const watermarkSection = buildArtifactWatermarkSection(type, format);

  return `${withoutExisting}\n\n${watermarkSection}`.trim();
}

export function buildArtifactPrompt(type: string, meta?: ArtifactMeta): string {
  // 1. Agent spec (PRD only) — Phase 1 stripped so AI never outputs Q&A instead of document
  const rawAgent = type === "prd" ? loadAgent("PRD-Builder.agent.md") : "";
  const agentContent = rawAgent ? stripPhase1FromAgent(rawAgent) : "";
  const agentBlock = agentContent
    ? `=============================================================\nAGENT SPECIFICATION — PRD-Builder.agent.md (generation rules only)\n=============================================================\n${agentContent}\n\n`
    : "";

  // 2. Skill specifications
  const skillPaths = SKILL_MAP[type] ?? [];
  const skillBlocks = skillPaths
    .map((p) => {
      const content = loadSkill(p);
      if (!content) return null;
      const skillName = p.split("/").slice(-2, -1)[0] ?? path.basename(p, ".md");
      return `=============================================================\nSKILL SPECIFICATION — ${skillName}\n=============================================================\n${content}`;
    })
    .filter(Boolean)
    .join("\n\n");

  // 3. Canonical template specifications
  const templateFiles = TEMPLATE_MAP[type] ?? [];
  const templateBlocks = templateFiles
    .map((f) => {
      const content = loadTemplate(f);
      if (!content) return null;
      return `=============================================================\nCANONICAL TEMPLATE — ${f}\n=============================================================\n${content}`;
    })
    .filter(Boolean)
    .join("\n\n");

  // 4. Reusable prompt specifications
  const promptFiles = PROMPT_MAP[type] ?? [];
  const promptBlocks = promptFiles
    .map((f) => {
      const content = loadPrompt(f);
      if (!content) return null;
      return `=============================================================\nPROMPT SPECIFICATION — ${f}\n=============================================================\n${content}`;
    })
    .filter(Boolean)
    .join("\n\n");

  // 5. Engineering standards
  const standardFiles = uniquePreserveOrder([
    ...(STANDARD_MAP._default ?? []),
    ...(STANDARD_MAP[type] ?? []),
  ]);
  const standardBlocks = standardFiles
    .map((f) => {
      const content = loadStandard(f);
      if (!content) return null;
      return `=============================================================\nENGINEERING STANDARD — ${f}\n=============================================================\n${compactStandard(content)}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const watermarkBlock = buildArtifactWatermarkSection(type, "html");

  // 5. Generation instruction — inject document metadata for PRD
  let baseInstruction = TYPE_INSTRUCTIONS[type]
    ?? `Generate a comprehensive ${type.replace(/_/g, " ")} document addressing all relevant aspects of the project.`;

  if (type === "prd") {
    const author   = meta?.authorName  ?? "Unknown";
    const date     = meta?.createdDate ?? new Date().toISOString().slice(0, 10);
    const version  = meta?.isUpdate ? "[increment from current version]" : "0.1";
    const status   = "Draft";
    const changeDesc = meta?.isUpdate
      ? (meta?.changeSummary ?? "Document updated")
      : "Initial document creation";
    const revHistoryNote = meta?.isUpdate
      ? `Add a NEW row to the Revision History table for this update: Version = ${version}, Date = ${date}, Author = ${author}, Summary = "${changeDesc}" — keep all previous rows intact.`
      : `The first (and only) Revision History row must be: Version = ${version}, Date = ${date}, Author = ${author}, Summary = "${changeDesc}".`;

    baseInstruction = `${baseInstruction}

DOCUMENT INFORMATION (use these exact values — do not invent alternatives):
- Product Name: derived from the Project Context below
- Doc Version: ${version}
- Status: ${status}
- Author: ${author}
- Created Date: ${date}
- Revision History: ${revHistoryNote}

These metadata values are already known. Do not ask the user for Author or Created Date.`;
  }

  const instruction = baseInstruction;

  // 6. Universal output rules
  const outputRules = `
=============================================================
OUTPUT RULES (mandatory — override any conflicting instruction above)
=============================================================
- DIRECT GENERATION MODE: produce the complete document NOW. Do NOT ask clarifying questions, do NOT output a Q&A table, do NOT describe what you are about to write. Start writing the document immediately.
- Follow the structure, sections, and conventions defined by the skill specification(s) above.
- Apply the ENGINEERING STANDARD blocks as mandatory governance constraints. Standards are authoritative unless a canonical template requires stricter structure.
- If a CANONICAL TEMPLATE block is present above, its section names and section order are mandatory and override any conflicting instructions from prompt files or generalized guidance.
- Do not rename, collapse, omit, or reorder canonical template sections.
- SKILL-DRIVEN COMPLETION (MANDATORY): For every section where loaded skills provide concrete guidance, you MUST populate that section with specific, actionable content from those skills instead of placeholders.
- UI/UX + BRANDING COMPLETION (MANDATORY): When branding/frontend skills are present in context, fill UI/UX-related portions (design specification, visual language, typography, colors, interaction behavior, responsive behavior, accessibility expectations) with concrete Edison-aligned values.
- Do NOT use [To be confirmed — ...] for fields that can be completed from loaded skill, template, and prompt context.
- Extract every specific fact from the Project Context provided — do NOT invent baselines, owners, system names, dates, or compliance claims.
- For any unknown or unconfirmed information: write [To be confirmed — <reason>] inline and add a matching entry to an "Open Questions / Issues Log" section at the end.
- Use proper semantic HTML: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <strong>, <em>.
- Output the HTML document body content ONLY — no triple-backtick fences, no markdown headings, no preamble text, no delimiters.
- DEPTH IS CRITICAL: Be thorough and comprehensive. Every section must contain substantive content — multiple paragraphs, specific requirements, measurable targets, and detailed rationale. A sparse document with mostly placeholders will fail quality review.
- Use your domain expertise to infer reasonable defaults, architecture patterns, and industry best practices where the project context allows — always marking assumptions clearly.
- NEVER claim the output is "too large", "exceeds token limits", or offer to split into parts. NEVER present the user with "Option A / Option B / Option C" choices about output size. You MUST produce the FULL document in a SINGLE response. Do NOT output meta-commentary about response length — just write the complete document.`;

  const watermarkRules = `
=============================================================
WATERMARK BLOCK (mandatory — append as final lines)
=============================================================
Append this exact watermark section at the very end of the document body:
${watermarkBlock}`;

  const directiveHeader =
`=============================================================
DIRECT ARTIFACT GENERATION — DO NOT ASK QUESTIONS
=============================================================
You are in direct artifact generation mode. Produce a complete, well-structured
HTML document body right now. Do NOT output a clarifying questions table.
Do NOT ask the user anything. Do NOT describe what you are about to write.
Just write the document.
=============================================================

`;

  const contextBlocks = [agentBlock, skillBlocks, templateBlocks, promptBlocks, standardBlocks]
    .filter((b) => !!b)
    .map((b) => `${b}\n\n`)
    .join("");

  return `${directiveHeader}${contextBlocks}=============================================================\nGENERATION INSTRUCTION\n=============================================================\n${instruction}\n${outputRules}\n${watermarkRules}`;
}

/**
 * Extract the "Global Rules" and "Rerun Rules" sections from
 * PRD-Builder.agent.md for inclusion in the chat system prompt.
 * Returns an empty string if the file cannot be read.
 */
export function getPrdAgentRulesForChat(): string {
  const agent = loadAgent("PRD-Builder.agent.md");
  if (!agent) return "";

  const globalIdx = agent.indexOf("## Global Rules");
  const rerunIdx = agent.indexOf("## Rerun Rules");
  const boundariesIdx = agent.indexOf("## Boundaries");

  if (globalIdx === -1) return "";

  // Capture from Global Rules to Boundaries (or end of file)
  const end = boundariesIdx !== -1 ? boundariesIdx : agent.length;
  return agent.slice(globalIdx, end).trim();
}

/**
 * Build a skill-context block for use in the CHAT system prompt.
 * Unlike buildArtifactPrompt(), this does NOT include generation instructions
 * or "direct generation" directives — it provides the agent spec, skills,
 * templates, and prompts as *reference material* so the chat AI has full
 * domain knowledge when discussing or updating artifacts.
 *
 * Returns an empty string when no skills are mapped for the given type.
 */
export function buildChatSkillContext(artifactType: string): string {
  // 1. Agent spec
  const rawAgent = artifactType === "prd" ? loadAgent("PRD-Builder.agent.md") : "";
  const agentBlock = rawAgent
    ? `=== AGENT REFERENCE — PRD-Builder ===\n${rawAgent}\n\n`
    : "";

  // 2. Skills
  const skillPaths = SKILL_MAP[artifactType] ?? [];
  const skillBlocks = skillPaths
    .map((p) => {
      const content = loadSkill(p);
      if (!content) return null;
      const skillName = p.split("/").slice(-2, -1)[0] ?? path.basename(p, ".md");
      return `=== SKILL — ${skillName} ===\n${content}`;
    })
    .filter(Boolean)
    .join("\n\n");

  // 3. Templates
  const templateFiles = TEMPLATE_MAP[artifactType] ?? [];
  const templateBlocks = templateFiles
    .map((f) => {
      const content = loadTemplate(f);
      if (!content) return null;
      return `=== TEMPLATE — ${f} ===\n${content}`;
    })
    .filter(Boolean)
    .join("\n\n");

  // 4. Prompts
  const promptFiles = PROMPT_MAP[artifactType] ?? [];
  const promptBlocks = promptFiles
    .map((f) => {
      const content = loadPrompt(f);
      if (!content) return null;
      return `=== PROMPT — ${f} ===\n${content}`;
    })
    .filter(Boolean)
    .join("\n\n");

  // 5. Standards
  const standardFiles = uniquePreserveOrder([
    ...(STANDARD_MAP._default ?? []),
    ...(STANDARD_MAP[artifactType] ?? []),
  ]);
  const standardBlocks = standardFiles
    .map((f) => {
      const content = loadStandard(f);
      if (!content) return null;
      return `=== STANDARD — ${f} ===\n${compactStandard(content)}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const blocks = [agentBlock, skillBlocks, templateBlocks, promptBlocks, standardBlocks]
    .filter(Boolean)
    .join("\n\n");

  if (!blocks.trim()) return "";

  return `\n\n=== SKILL & REFERENCE CONTEXT FOR ${artifactType.toUpperCase()} ===\nThe following agents, skills, templates, prompts, and standards define how ${artifactType.replace(/_/g, " ")} artifacts should be structured. Use them as authoritative reference when discussing, reviewing, or updating this artifact type.\n\n${blocks}`;
}
