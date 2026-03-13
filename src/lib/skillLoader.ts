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
const _cache = new Map<string, string>();

/** Absolute path to the .github directory in this repo. */
const GITHUB_DIR = path.join(process.cwd(), ".github");

// ── Low-level helpers ─────────────────────────────────────────────────────────

/** Read a file relative to .github/. Returns empty string on error. */
function readGithubFile(relativePath: string): string {
  if (_cache.has(relativePath)) return _cache.get(relativePath)!;
  const full = path.join(GITHUB_DIR, relativePath);
  try {
    const text = fs.readFileSync(full, "utf-8");
    _cache.set(relativePath, text);
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

// ── Public loaders ────────────────────────────────────────────────────────────

/** Load an agent spec from .github/agents/<filename>. */
export function loadAgent(filename: string): string {
  return stripFrontmatter(readGithubFile(`agents/${filename}`));
}

/** Load a skill spec from .github/skills/<relative-path>. */
export function loadSkill(skillRelPath: string): string {
  return stripFrontmatter(readGithubFile(`skills/${skillRelPath}`));
}

// ── Skill map: artifact type → skill file paths ───────────────────────────────
// Each entry lists the skill files (relative to .github/skills/) that inform
// how a given artifact type should be generated.

const SKILL_MAP: Record<string, string[]> = {
  prd: [
    "code-generation/sce-prd-generator/SKILL.md",
    "code-generation/sce-prd-generator/resources/prd_template_4_skeleton.md",
  ],
  prd_validation: [
    "requirements-elicitation/sce-6cs-quality-framework/SKILL.md",
    "requirements-elicitation/sce-technical-requirement-writer/SKILL.md",
  ],
  preliminary_estimation: [
    "requirements-elicitation/gap-analysis/SKILL.md",
    "devops/sce-dora-metrics-calculator/SKILL.md",
  ],
  cyber_risk_analysis: [
    "security/sce-vulnerability-scanner/SKILL.md",
    "security/sce-auth-auditor/SKILL.md",
    "security/sce-data-protection-reviewer/SKILL.md",
    "security/sce-security-report-generator/SKILL.md",
  ],
  compliance_report: [
    "compliance/sce-compliance-checker/SKILL.md",
    "compliance/sce-tech-policy-resolver/SKILL.md",
  ],
  revised_estimation: [
    "requirements-elicitation/gap-analysis/SKILL.md",
    "devops/sce-dora-metrics-calculator/SKILL.md",
  ],
  test_plan: [
    "testing/sce-tdd-template-generator/SKILL.md",
  ],
  quality_review: [
    "requirements-elicitation/sce-6cs-quality-framework/SKILL.md",
    "testing/sce-octane-story-test-impact-analyzer/SKILL.md",
  ],
  deployment_plan: [
    "devops/sce-build-deploy-test-workflow-generator/SKILL.md",
    "devops/sce-deploy-workflow-generator/SKILL.md",
  ],
};

// ── Per-type generation instructions ─────────────────────────────────────────
// These instruct the LLM what to produce; the skill specs above tell it *how*.

const TYPE_INSTRUCTIONS: Record<string, string> = {
  prd: `Generate a complete Product Requirements Document (PRD) following Template 4 structure defined in the sce-prd-generator skill above.

MANDATORY requirement numbering:
- Functional requirements: FR-001, FR-002…
- Non-functional requirements: NFR-001, NFR-002…
- Security / compliance: SEC-001, SEC-002…
- Data governance rules: DG-001, DG-002…

Include ALL sections from the Template 4 skeleton in order. Append this watermark at the very end of the document:
<!-- generated_by: PRD-Builder Agent v1.0.0 / sce-prd-generator Skill v1.0.0 -->`,

  prd_validation: `Generate a PRD Validation Report applying the 6Cs quality framework (Clear, Concise, Complete, Consistent, Correct, Confirmable) and INVEST principles as defined in the skill above.

Include:
- Per-requirement quality scores (1–5 scale)
- Gap analysis: missing sections or requirements
- Testability assessment for each requirement
- Ambiguity detection (vague or unclear language)
- Specific, actionable improvement recommendations
- Aggregate quality metrics and overall readiness score`,

  preliminary_estimation: `Generate a Preliminary Effort and Timeline Estimation document following the gap-analysis and DORA metrics skill guidance above.

Include:
- Effort breakdown by feature area (story points or person-days)
- Required team composition and roles
- Phased delivery timeline with milestones
- Key assumptions and dependencies
- Risk factors affecting the estimates
- Confidence level (Low / Medium / High) per estimate category`,

  cyber_risk_analysis: `Generate a Cyber Risk Analysis applying the vulnerability scanner, auth auditor, data-protection reviewer, and security report generator skills above.

Use STRIDE threat modelling. Include:
- Attack surface and vulnerability assessment
- Authentication / authorization risk review
- API security evaluation
- Data classification and sensitivity mapping
- Third-party integration risks
- Risk severity matrix (Likelihood × Impact)
- Prioritised mitigation strategies
- Residual risk after mitigations
- Compliance / regulatory implications`,

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
- Test strategy overview (approach, tools, owner)
- In-scope and out-of-scope items
- Test types: unit, integration, e2e, performance, security, UAT
- Environment and test data requirements
- Test case matrix by feature area (high-level)
- Acceptance criteria traceability
- Automation strategy (what to automate vs. manual)
- Defect management process
- Regression strategy`,

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

  // 3. Generation instruction — inject document metadata for PRD
  let baseInstruction = TYPE_INSTRUCTIONS[type]
    ?? `Generate a comprehensive ${type.replace(/_/g, " ")} document addressing all relevant aspects of the project.`;

  if (type === "prd" && meta) {
    const author   = meta.authorName  ?? "[To be confirmed — author name]";
    const date     = meta.createdDate ?? new Date().toISOString().slice(0, 10);
    const version  = meta.isUpdate ? "[increment from current version]" : "0.1";
    const status   = "Draft";
    const changeDesc = meta.isUpdate
      ? (meta.changeSummary ?? "Document updated")
      : "Initial document creation";
    const revHistoryNote = meta.isUpdate
      ? `Add a NEW row to the Revision History table for this update: Version = ${version}, Date = ${date}, Author = ${author}, Summary = "${changeDesc}" — keep all previous rows intact.`
      : `The first (and only) Revision History row must be: Version = ${version}, Date = ${date}, Author = ${author}, Summary = "${changeDesc}".`;

    baseInstruction = `${baseInstruction}

DOCUMENT INFORMATION (use these exact values — do not invent alternatives):
- Product Name: derived from the Project Context below
- Doc Version: ${version}
- Status: ${status}
- Author: ${author}
- Created Date: ${date}
- Revision History: ${revHistoryNote}`;
  }

  const instruction = baseInstruction;

  // 4. Universal output rules
  const outputRules = `
=============================================================
OUTPUT RULES (mandatory — override any conflicting instruction above)
=============================================================
- DIRECT GENERATION MODE: produce the complete document NOW. Do NOT ask clarifying questions, do NOT output a Q&A table, do NOT describe what you are about to write. Start writing the document immediately.
- Follow the structure, sections, and conventions defined by the skill specification(s) above.
- Extract every specific fact from the Project Context provided — do NOT invent baselines, owners, system names, dates, or compliance claims.
- For any unknown or unconfirmed information: write [To be confirmed — <reason>] inline and add a matching entry to an "Open Questions / Issues Log" section at the end.
- Use proper semantic HTML: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <strong>, <em>.
- Output the HTML document body content ONLY — no triple-backtick fences, no markdown headings, no preamble text, no delimiters.
- Be thorough; a complete, detailed document reduces the number of [To be confirmed] gaps and raises the quality score.`;

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

  return `${directiveHeader}${agentBlock}${skillBlocks ? `${skillBlocks}\n\n` : ""}=============================================================\nGENERATION INSTRUCTION\n=============================================================\n${instruction}\n${outputRules}`;
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
