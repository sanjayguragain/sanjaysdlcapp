import { ArtifactType } from "@/types";
import { buildArtifactPrompt, getPrdAgentRulesForChat } from "./skillLoader";

// Loaded once at module initialisation — cached by skillLoader, so disk I/O is a one-time cost.
const _PRD_AGENT_RULES = getPrdAgentRulesForChat();

const SYSTEM_PROMPT = `You are an expert AI product documentation assistant for enterprise software teams. You help generate structured SDLC artifacts including Product Requirements Documents, risk analyses, compliance reports, test plans, and deployment plans.

Your role:
- Generate comprehensive, well-structured documentation artifacts
- Ask clarifying questions when information is missing
- Identify gaps, risks, and dependencies
- Provide confidence scores for generated content
- Maintain traceability between artifacts

When generating artifacts, use clear headings, structured sections, and professional enterprise language. Be thorough but concise.

IMPORTANT — Artifact updates:
When the user asks you to modify, update, add to, or change an artifact that is currently open, you MUST:
1. Reply with exactly one short sentence: "I'm updating the document — you can view the changes in the editor on the right." Do NOT describe what you changed, do NOT summarise the content, do NOT say anything else before or after the delimiters.
2. Then immediately output the COMPLETE updated artifact content wrapped in these exact delimiters on their own lines:
<<<ARTIFACT_UPDATE>>>
[full updated artifact content here — complete document, not just the changed section]
<<<END_ARTIFACT_UPDATE>>>

Always output the FULL artifact content between the delimiters, not just the changed portion. Use HTML format (with <h1>, <h2>, <p>, <ul>, <table> tags) since the editor renders HTML.

CRITICAL — Handling Open Questions with provided answers:
When the user provides answers to open questions and asks you to update or recreate the PRD (or any artifact), you MUST follow these rules:
1. Each answered question must be integrated into the RELEVANT section of the document — NOT left in the Open Questions section.
   - If the answer resolves a requirement → update or add to the Functional/Non-Functional Requirements section.
   - If the answer defines a timeline → update the Timeline section.
   - If the answer clarifies scope → update Goals, Out of Scope, or Assumptions as appropriate.
   - If the answer specifies a user/persona → update the Target Users section.
   - If the answer addresses compliance → update the Compliance or NFR section.
   - Apply this logic for every single answer provided.
2. Remove each answered question from the Open Questions section entirely. Only questions that remain UNANSWERED should stay in Open Questions.
3. If all open questions have been answered, the Open Questions section should either be removed or replaced with a note stating "All previously open questions have been resolved and incorporated into the document."
4. Never duplicate information — do not put the same answer both in a section AND in Open Questions.

PRD-Builder Agent Rules (loaded from .github/agents/PRD-Builder.agent.md):

PHASE 1 — Clarifying Questions (when generating a PRD fresh from the chat):
Before generating the full PRD, ask a SINGLE prioritized batch of up to 20 clarifying questions in this exact HTML table format:
<table><thead><tr><th>ID</th><th>Priority</th><th>PRD Section</th><th>Question</th><th>Why it matters</th><th>Who can answer</th><th>What a good answer looks like</th></tr></thead><tbody>…rows…</tbody></table>
Priority values: Blocking (must answer) / Important (improves accuracy) / Optional (nice-to-have).
After asking, wait for the user's answers before generating the full PRD.
If the artifact is being generated directly (not via chat Q&A), skip Phase 1 and generate immediately using [To be confirmed — reason] markers for unknowns.

Agent Conventions (authoritative — from .github/agents/PRD-Builder.agent.md):
${_PRD_AGENT_RULES}

GUIDED Q&A MODE — Filling artifact gaps through conversation (CRITICAL):
This mode activates whenever the user is answering clarifying questions about an open artifact (artifactId is set in context).

When the user provides answers to clarifying questions about an artifact:
1. Do NOT rebuild the artifact yet. Do NOT emit <<<ARTIFACT_UPDATE>>> delimiters. The document will be rebuilt once in a single pass at the end.
2. Acknowledge their answers in ONE brief sentence (e.g. "Got it — thanks for those answers.").
3. Read the REMAINING UNRESOLVED ITEMS list from the context and cross-reference the entire conversation history to identify which items have already been answered (by any previous user message). Only ask about items that are STILL unanswered.
4. Show progress on one line: **(X of Y answered — Z remaining)**
5. If unresolved items remain, ask the NEXT batch of up to 4 as simple direct questions:
   **Q1.** What is [topic]?
   **Q2.** …
   - NEVER repeat a question already asked or answered earlier in this conversation.
   - NEVER ask more than 4 questions at once.
   - Ask blocking/important items before optional ones.
6. If ALL items are now answered (0 remaining), output ONLY this exact token on its own line with nothing before or after it:
<<<ALL_QUESTIONS_ANSWERED>>>
   Do not explain, do not say anything else. The system will immediately trigger the document rebuild.`;


// ARTIFACT_PROMPTS removed — prompts are now loaded dynamically from
// .github/agents/ and .github/skills/ via skillLoader.buildArtifactPrompt().

// Compile-time guard: ensures every ArtifactType has a skill mapping defined in skillLoader.
// buildArtifactPrompt() handles unknown types gracefully, but this prevents silent gaps.
const _ARTIFACT_TYPE_CHECK: Record<ArtifactType, true> = {
  prd: true,
  prd_validation: true,
  preliminary_estimation: true,
  cyber_risk_analysis: true,
  compliance_report: true,
  revised_estimation: true,
  test_plan: true,
  quality_review: true,
  deployment_plan: true,
};
void _ARTIFACT_TYPE_CHECK; // suppress unused-variable warning

export interface ChatResponse {
  content: string;
  metadata?: {
    artifactType?: ArtifactType;
    confidenceScore?: number;
    isArtifact?: boolean;
  };
}

/** Returns a streaming Response body from the AI provider (raw SSE from OpenAI format). */
export async function streamChatResponse(
  messages: { role: string; content: string }[],
  projectContext?: string
): Promise<ReadableStream<Uint8Array> | null> {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";
  const openaiKey = process.env.OPENAI_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;
  const githubModel = process.env.GITHUB_MODEL || "gpt-5.2";

  const useAzure = !!(azureEndpoint && azureKey && azureDeployment);
  const useGitHub = !useAzure && !!githubToken;
  const useOpenAI = !useAzure && !useGitHub && !!openaiKey;

  if (!useAzure && !useGitHub && !useOpenAI) return null;

  const systemMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(projectContext
      ? [{ role: "system", content: `Project Context:\n${projectContext}` }]
      : []),
  ];

  let url: string;
  let authHeaders: Record<string, string>;
  let model: string | undefined;

  if (useAzure) {
    const base = azureEndpoint!.replace(/\/$/, "");
    url = `${base}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`;
    authHeaders = { "api-key": azureKey! };
    model = undefined;
  } else if (useGitHub) {
    url = "https://models.inference.ai.azure.com/chat/completions";
    authHeaders = { Authorization: `Bearer ${githubToken}` };
    model = githubModel;
  } else {
    url = "https://api.openai.com/v1/chat/completions";
    authHeaders = { Authorization: `Bearer ${openaiKey}` };
    model = "gpt-4o";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({
      ...(model ? { model } : {}),
      messages: [...systemMessages, ...messages],
      // Azure reasoning models use max_completion_tokens and don't support temperature
      ...(useAzure
        ? { max_completion_tokens: 16000 }
        : { temperature: 0.7, max_tokens: 4000 }
      ),
      stream: true,
    }),
  });

  if (!response.ok || !response.body) return null;
  return response.body;
}

export async function generateChatResponse(
  messages: { role: string; content: string }[],
  projectContext?: string
): Promise<ChatResponse> {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";
  const openaiKey = process.env.OPENAI_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;
  const githubModel = process.env.GITHUB_MODEL || "gpt-4o";

  const useAzure = !!(azureEndpoint && azureKey && azureDeployment);
  const useGitHub = !useAzure && !!githubToken;
  const useOpenAI = !useAzure && !useGitHub && !!openaiKey;

  if (!useAzure && !useGitHub && !useOpenAI) {
    return generateMockResponse(messages);
  }

  const systemMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(projectContext
      ? [{ role: "system", content: `Project Context:\n${projectContext}` }]
      : []),
  ];

  let url: string;
  let authHeaders: Record<string, string>;
  let model: string | undefined;

  if (useAzure) {
    // Azure OpenAI — deployment name is in the URL, not the body
    const base = azureEndpoint!.replace(/\/$/, "");
    url = `${base}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`;
    authHeaders = { "api-key": azureKey! };
    model = undefined;
  } else if (useGitHub) {
    // GitHub Models — OpenAI-compatible, auth via GitHub PAT
    // https://docs.github.com/en/github-models
    url = "https://models.inference.ai.azure.com/chat/completions";
    authHeaders = { Authorization: `Bearer ${githubToken}` };
    model = githubModel;
  } else {
    // Standard OpenAI
    url = "https://api.openai.com/v1/chat/completions";
    authHeaders = { Authorization: `Bearer ${openaiKey}` };
    model = "gpt-4o";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      ...(model ? { model } : {}),
      messages: [...systemMessages, ...messages],
      // Azure reasoning models use max_completion_tokens and don't support temperature
      ...(useAzure
        ? { max_completion_tokens: 16000 }
        : { temperature: 0.7, max_tokens: 4000 }
      ),
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    console.error(`[ai] API error ${response.status}: ${errText} — falling back to mock`);
    return generateMockResponse(messages);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
  };
}

/**
 * Direct AI call for artifact generation — does NOT use the chat SYSTEM_PROMPT.
 * The chat SYSTEM_PROMPT instructs the model to ask clarifying questions, which
 * must never happen here. This function always produces a complete HTML document.
 */
async function callArtifactDirectly(userPrompt: string): Promise<string> {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";
  const openaiKey = process.env.OPENAI_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;
  const githubModel = process.env.GITHUB_MODEL || "gpt-4o";

  const useAzure = !!(azureEndpoint && azureKey && azureDeployment);
  const useGitHub = !useAzure && !!githubToken;

  const artifactSystemPrompt = `You are an expert SDLC documentation specialist producing enterprise-grade HTML documents.

STRICT RULES — follow these without exception:
1. Always output a COMPLETE document draft — never refuse, never ask questions.
2. Use proper HTML tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <strong>, <em>.
3. Where project-specific information is unavailable, write a clearly marked inline placeholder: <em class="missing">[To be confirmed — <short explanation of what is needed>]</em>
4. Output ONLY the HTML document body content — no markdown, no preamble, no code fences, no delimiters.
5. The more unknowns you fill with [To be confirmed] placeholders, the lower the reader's confidence in the document, so be explicit about gaps.
6. If there are 3 or more significant unknowns, append a final <h2>Open Questions</h2> section listing each outstanding item as a numbered <ol><li> — this makes gaps visible at a glance and is required for the document to be approved.`;

  let url: string;
  let authHeaders: Record<string, string>;
  let model: string | undefined;

  if (useAzure) {
    const base = azureEndpoint!.replace(/\/$/, "");
    url = `${base}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`;
    authHeaders = { "api-key": azureKey! };
    model = undefined;
  } else if (useGitHub) {
    url = "https://models.inference.ai.azure.com/chat/completions";
    authHeaders = { Authorization: `Bearer ${githubToken!}` };
    model = githubModel;
  } else {
    url = "https://api.openai.com/v1/chat/completions";
    authHeaders = { Authorization: `Bearer ${openaiKey}` };
    model = "gpt-4o";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({
      ...(model ? { model } : {}),
      messages: [
        { role: "system", content: artifactSystemPrompt },
        { role: "user", content: userPrompt },
      ],
      ...(useAzure
        ? { max_completion_tokens: 16000 }
        : { temperature: 0.3, max_tokens: 4000 }),
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`AI API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return (data.choices[0].message.content as string) ?? "";
}

/**
 * Score the quality of a generated artifact against industry-standard benchmarks.
 * Evaluates the OUTPUT HTML content — not the input context word count.
 *
 * Scoring model (0–100 pts → stored as 0–1):
 *   • Section completeness  50 pts  — IEEE 830 / BABOK required sections present
 *   • Placeholder gap penalty 30 pts — deducted 3 pts per [To be confirmed] marker
 *   • Specificity signals    20 pts  — dates, measurable metrics, numbered requirements, length
 *
 * Returns a 0–1 float. Clamped to [0.05, 0.98] to avoid misleading 0% or 100%.
 */
export function scoreArtifactQuality(type: ArtifactType, htmlContent: string): number {
  // Strip HTML tags and decode entities to plain text for analysis
  const text = htmlContent
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

  // ── 1. Section completeness (50 pts) ──────────────────────────────────────
  // Each artifact type has a required set of sections drawn from industry standards.
  const sectionSets: Record<ArtifactType, RegExp[]> = {
    prd: [
      /executive\s*summary/,         // IEEE 830 §3.1
      /problem\s*statement/,          // BABOK stakeholder context
      /goal|objective/,
      /target\s*user|persona/,        // user-centred design
      /functional\s*requirement/,     // IEEE 830 §3.4 FR
      /non[-\s]?functional|nfr/,      // IEEE 830 §3.4 NFR
      /user\s*stor|use\s*case/,       // agile / use-case model
      /acceptance\s*criter/,          // testability (IEEE 830 §4.3)
      /dependenc|assumption/,
      /out\s*of\s*scope/,
      /success\s*metric|kpi/,
      /timeline|milestone/,
    ],
    prd_validation: [
      /clarity|readability/,
      /completeness/,
      /consistency/,
      /testability/,
      /ambiguit/,
      /recommendation/,
    ],
    preliminary_estimation: [
      /effort|story.{0,5}point/,
      /timeline|schedule/,
      /resource|team\s*size/,
      /assumption/,
      /risk/,
      /complexity/,
    ],
    cyber_risk_analysis: [
      /threat|stride/,
      /attack\s*surface|vulnerability/,
      /authentication|authoriz/,
      /risk\s*matrix|severity|likelihood/,
      /mitigation|control/,
      /compliance|regulatory/,
    ],
    compliance_report: [
      /gdpr|soc\s*2|hipaa|pci[-\s]dss|iso\s*27001/,
      /data\s*privacy|data\s*protection/,
      /audit/,
      /access\s*control/,
      /gap\s*analysis|finding/,
      /recommendation/,
    ],
    revised_estimation: [
      /effort/,
      /security\s*overhead|compliance\s*overhead/,
      /timeline/,
      /risk\s*contingency|buffer/,
      /revised|updated\s*estimate/,
    ],
    test_plan: [
      /test\s*strateg/,
      /test\s*scope|in\s*scope/,
      /unit\s*test|integration\s*test|e2e|system\s*test/,
      /acceptance\s*test|uat/,
      /automation|manual/,
      /test\s*environment/,
    ],
    quality_review: [
      /test\s*execut|test\s*result/,
      /defect|bug|issue/,
      /coverage/,
      /performance|load\s*test/,
      /go[-\s]no[-\s]go|recommendation|sign[-\s]off/,
    ],
    deployment_plan: [
      /deployment\s*strateg|blue[-\s]green|canary|rolling/,
      /environment|staging|production/,
      /rollback/,
      /checklist|steps/,
      /health\s*check|smoke\s*test/,
      /monitoring|alerting/,
    ],
  };

  const required = sectionSets[type] ?? sectionSets.prd;
  const presentCount = required.filter((re) => re.test(text)).length;
  const sectionScore = (presentCount / required.length) * 50;

  // ── 2. Placeholder gap penalty (30 pts) ───────────────────────────────────
  // Every "[To be confirmed" marker means a section hasn't been filled in yet.
  // 0 gaps → 30 pts; 10+ gaps → 0 pts.
  const gapCount = (text.match(/\[?to be confirmed/g) || []).length;
  const gapScore = Math.max(0, 30 - gapCount * 3);

  // ── 3. Specificity signals (20 pts) ───────────────────────────────────────
  // Concrete details indicate a well-developed document versus a generic template.
  let specScore = 0;
  // Dates or quarter notation  (evidence of timeline thinking)
  if (/\d{4}-\d{2}-\d{2}|q[1-4]\s*20\d{2}|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/.test(text)) specScore += 5;
  // Measurable metrics with units (performance, scale, volume targets)
  if (/\b\d+\s*(%|ms\b|mb\b|gb\b|users\b|requests\b|seconds\b|hours\b|days\b|concurrent\b)/.test(text)) specScore += 5;
  // IEEE 830-style numbered requirements (FR-1, NFR-2, REQ-3 …)
  if (/fr-\d+|nfr-\d+|req-\d+|tc-\d+|br-\d+|ur-\d+|uar-\d+/.test(text)) specScore += 5;
  // Substantive document length — indicates real content rather than a stub
  if (text.length > 3000) specScore += 5;

  const total = sectionScore + gapScore + specScore;
  // Clamp to [0.05, 0.98] — never show a jarring 0% or a misleading 100%
  return Math.min(0.98, Math.max(0.05, total / 100));
}

export async function generateArtifact(
  type: ArtifactType,
  projectContext: string,
  additionalContext?: string,
  meta?: import("./skillLoader").ArtifactMeta
): Promise<ChatResponse> {
  // Prompt is built dynamically from .github/agents/ and .github/skills/ files.
  const prompt = buildArtifactPrompt(type, meta);

  const hasProvider =
    !!(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY) ||
    !!process.env.GITHUB_TOKEN ||
    !!process.env.OPENAI_API_KEY;

      if (!hasProvider) {
        console.log('[generateArtifact] No AI provider configured, using mock response'); 
        return generateMockArtifact(type, projectContext);
  
  }

  const userPrompt = `${prompt}\n\nProject Context:\n${projectContext}${
    additionalContext ? `\n\nAdditional Context:\n${additionalContext}` : ""
  }`;

  try {
    const content = await callArtifactDirectly(userPrompt);
    return {
      content,
      metadata: {
        artifactType: type,
        confidenceScore: scoreArtifactQuality(type, content),
        isArtifact: true,
      },
    };
  } catch (err) {
    console.error("[generateArtifact] AI call failed, using mock:", err);
    return generateMockArtifact(type, projectContext);
  }
}

function generateMockResponse(
  messages: { role: string; content: string }[]
): ChatResponse {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";

  if (lastMessage.includes("generate") || lastMessage.includes("create")) {
    return {
      content: `I'd be happy to help generate that artifact. To create the best possible document, I have a few clarifying questions:

1. **Target Audience**: Who is the primary audience for this document?
2. **Scope**: Are there any specific areas you'd like me to focus on or exclude?
3. **Constraints**: Are there known technical constraints or regulatory requirements?
4. **Timeline**: What's the expected timeline for this project?

Please provide any additional context, and I'll generate a comprehensive artifact for you.`,
    };
  }

  return {
    content: `Thank you for that information. I've noted the details and can incorporate them into the documentation.

Here's what I understand so far. Let me know if I should adjust anything:

- I'll use the context you've provided to ensure accuracy
- The artifact will follow enterprise documentation standards
- I'll flag any gaps or areas needing clarification

Would you like me to proceed with generating the artifact, or do you have additional context to share?`,
  };
}

function generateMockArtifact(
  type: ArtifactType,
  projectContext: string
): ChatResponse {
  const projectName =
    projectContext.match(/Project:\s*(.+)/)?.[1]?.trim() || "This Project";

  const prdHtml = `<h1>Product Requirements Document</h1>
<p><em>Draft — answer the clarifying questions in the chat to improve this document. Sections marked <em>[To be confirmed]</em> require stakeholder input before the document can be finalised.</em></p>

<h2>1. Executive Summary</h2>
<p>This document captures the product requirements for <strong>${projectName}</strong>. It is an initial draft generated from the project title and any uploaded documents. Sections marked <em>[To be confirmed]</em> require input from stakeholders before the document can be finalised.</p>

<h2>2. Problem Statement</h2>
<p><em>[To be confirmed — describe the core business problem or user pain point this project solves]</em></p>

<h2>3. Goals and Objectives</h2>
<ul>
  <li><em>[To be confirmed — primary goal with measurable outcome]</em></li>
  <li><em>[To be confirmed — secondary goal]</em></li>
  <li><em>[To be confirmed — success metric / KPI]</em></li>
</ul>

<h2>4. Target Users / Personas</h2>
<p><em>[To be confirmed — list the primary user roles and their key needs]</em></p>

<h2>5. Functional Requirements</h2>
<h3>FR-1: Core Features</h3>
<ul>
  <li>FR-1.1: <em>[To be confirmed — first key capability]</em></li>
  <li>FR-1.2: <em>[To be confirmed — second key capability]</em></li>
  <li>FR-1.3: <em>[To be confirmed — third key capability]</em></li>
</ul>

<h3>FR-2: Supporting Features</h3>
<ul>
  <li>FR-2.1: <em>[To be confirmed]</em></li>
  <li>FR-2.2: <em>[To be confirmed]</em></li>
</ul>

<h2>6. Non-Functional Requirements</h2>
<ul>
  <li><strong>Performance:</strong> <em>[To be confirmed — latency / throughput targets]</em></li>
  <li><strong>Security:</strong> <em>[To be confirmed — auth model, data sensitivity]</em></li>
  <li><strong>Scalability:</strong> <em>[To be confirmed — expected user / data volume]</em></li>
  <li><strong>Availability:</strong> <em>[To be confirmed — SLA target]</em></li>
</ul>

<h2>7. User Stories</h2>
<ul>
  <li><em>[To be confirmed — "As a [role], I want to [action] so that [benefit]"]</em></li>
  <li><em>[To be confirmed]</em></li>
  <li><em>[To be confirmed]</em></li>
</ul>

<h2>8. Acceptance Criteria</h2>
<p><em>[To be confirmed — testable pass/fail criteria for each requirement]</em></p>

<h2>9. Dependencies and Assumptions</h2>
<p><em>[To be confirmed — external teams, systems, or services this project depends on]</em></p>

<h2>10. Out of Scope</h2>
<p><em>[To be confirmed — explicitly list what will NOT be delivered]</em></p>

<h2>11. Success Metrics</h2>
<p><em>[To be confirmed — measurable outcomes that define success]</em></p>

<h2>12. Timeline Considerations</h2>
<p><em>[To be confirmed — key milestones and target dates]</em></p>

<h2>Open Questions</h2>
<ol>
  <li>What is the core business problem or user pain point this project solves?</li>
  <li>Who are the primary user personas and what are their key needs?</li>
  <li>What are the measurable success metrics / KPIs?</li>
  <li>What are the non-functional requirements (performance, security, scalability, availability)?</li>
  <li>What are the key dependencies and external systems?</li>
  <li>What are the target milestones and delivery dates?</li>
</ol>`;

  const genericHtml = `<h1>${type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</h1>
<p><em>Draft — sections marked [To be confirmed] require stakeholder input.</em></p>

<h2>Overview</h2>
<p>This is an initial draft for <strong>${projectName}</strong>. <em>[To be confirmed — provide more context to improve this document]</em></p>

<h2>Key Findings</h2>
<ul>
  <li><em>[To be confirmed]</em></li>
  <li><em>[To be confirmed]</em></li>
</ul>

<h2>Recommendations</h2>
<p><em>[To be confirmed]</em></p>`;

  const html = type === "prd" ? prdHtml : genericHtml;
  return {
    content: html,
    metadata: {
      artifactType: type,
      confidenceScore: scoreArtifactQuality(type, html),
      isArtifact: true,
    },
  };
}
