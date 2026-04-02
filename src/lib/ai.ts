import { ArtifactType } from "@/types";
import { applyArtifactWatermark, buildArtifactPrompt, buildChatSkillContext, getArtifactModel, getPrdAgentRulesForChat, loadTemplate } from "./skillLoader";
import { isCopilotSdkEnabled, copilotSendAndWait, copilotStream } from "./copilot";

// Loaded once at module initialisation — cached by skillLoader, so disk I/O is a one-time cost.
const _PRD_AGENT_RULES = getPrdAgentRulesForChat();
const _PRD_CANONICAL_TEMPLATE = loadTemplate("PRD/PRD-{product-name-kebab-case}.md");

export class TemplateValidationError extends Error {
  missingHeadings: string[];

  constructor(message: string, missingHeadings: string[]) {
    super(message);
    this.name = "TemplateValidationError";
    this.missingHeadings = missingHeadings;
  }
}

function normalizeHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractCanonicalPrdHeadings(template: string): string[] {
  return template
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^##\s+/.test(line))
    .map((line) => line.replace(/^##\s+/, "").trim())
    .filter(Boolean);
}

function extractHtmlHeadings(html: string): string[] {
  const matches = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)];
  return matches
    .map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function validatePrdTemplateCompliance(html: string): {
  ok: boolean;
  missingHeadings: string[];
} {
  const expected = extractCanonicalPrdHeadings(loadTemplate("PRD/PRD-{product-name-kebab-case}.md"));
  const actualNormalized = new Set(extractHtmlHeadings(html).map(normalizeHeading));
  const missingHeadings = expected.filter((heading) => !actualNormalized.has(normalizeHeading(heading)));
  return { ok: missingHeadings.length === 0, missingHeadings };
}

function validatePrdRequiredFields(html: string): {
  ok: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  if (!/(?:<strong>\s*)?Date\s*:(?:\s*<\/strong>)?/i.test(html)) {
    missingFields.push("Date in Document Information & Revision History");
  }
  if (!/(?:<strong>\s*)?Author\s*:(?:\s*<\/strong>)?/i.test(html)) {
    missingFields.push("Author in Document Information & Revision History");
  }
  if (!/Traceability Matrix/i.test(html)) {
    missingFields.push("Traceability Matrix section/table");
  }
  return { ok: missingFields.length === 0, missingFields };
}

function ensurePrdDateAndAuthor(html: string, authorName: string, createdDate: string): string {
  // Match heading with literal `&`, HTML entity `&amp;`, or the word `and`
  const headingRegex = /<h2\b[^>]*>\s*Document Information\s*(?:&amp;|&|and)\s*Revision History\s*<\/h2>/i;

  const dateLine = `<p><strong>Date:</strong> ${createdDate}</p>`;
  const authorLine = `<p><strong>Author:</strong> ${authorName}</p>`;

  const headingMatch = headingRegex.exec(html);
  if (!headingMatch) {
    // Heading not found — prepend a Document Information section so author/date are never silently dropped.
    const infoSection =
      `<h2>Document Information &amp; Revision History</h2>\n${dateLine}\n${authorLine}\n`;
    const firstHeading = /<h[1-6]\b/i.exec(html);
    if (firstHeading) {
      return html.slice(0, firstHeading.index) + infoSection + html.slice(firstHeading.index);
    }
    return infoSection + html;
  }

  const nextH2Regex = /<h2\b[^>]*>/gi;
  const sectionStart = headingMatch.index + headingMatch[0].length;
  nextH2Regex.lastIndex = sectionStart;
  const nextHeading = nextH2Regex.exec(html);
  const sectionEnd = nextHeading ? nextHeading.index : html.length;

  let section = html.slice(sectionStart, sectionEnd);

  if (/(?:<strong>\s*)?Date\s*:(?:\s*<\/strong>)?/i.test(section)) {
    section = section.replace(/<p[^>]*>[\s\S]*?(?:<strong>\s*)?Date\s*:(?:\s*<\/strong>)?[\s\S]*?<\/p>/i, dateLine);
  } else {
    section += `\n${dateLine}`;
  }

  if (/(?:<strong>\s*)?Author\s*:(?:\s*<\/strong>)?/i.test(section)) {
    section = section.replace(/<p[^>]*>[\s\S]*?(?:<strong>\s*)?Author\s*:(?:\s*<\/strong>)?[\s\S]*?<\/p>/i, authorLine);
  } else {
    section += `\n${authorLine}`;
  }

  return `${html.slice(0, sectionStart)}${section}${html.slice(sectionEnd)}`;
}

/** Detect Azure reasoning models (o-series) that don't support temperature. */
function isReasoningModel(deploymentName: string | undefined): boolean {
  if (!deploymentName) return false;
  const d = deploymentName.toLowerCase();
  // gpt-5 deployments on Azure currently require max_completion_tokens
  return /^o[1-9]|^o3|reasoning|^gpt-5/.test(d);
}

/** Build Azure or standard model parameters. */
function buildModelParams(opts: {
  useAzure: boolean;
  azureDeployment?: string;
  temperature: number;
  maxTokens: number;
}) {
  if (opts.useAzure) {
    if (isReasoningModel(opts.azureDeployment)) {
      // Reasoning models: no temperature, use max_completion_tokens
      return { max_completion_tokens: opts.maxTokens };
    }
    // Chat models on Azure: temperature + max_tokens
    return { temperature: opts.temperature, max_tokens: opts.maxTokens };
  }
  return { temperature: opts.temperature, max_tokens: opts.maxTokens };
}

type ProviderKind = "copilot" | "azure" | "github" | "openai";

interface ProviderConfig {
  kind: ProviderKind;
  url: string;
  headers: Record<string, string>;
  model?: string;
  useAzure: boolean;
  azureDeployment?: string;
}

function getProviderConfigs(defaultGithubModel: string): ProviderConfig[] {
  const copilotToken = process.env.GITHUB_COPILOT_TOKEN;
  const copilotModel = process.env.COPILOT_MODEL || "gpt-5.2";
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-08-01-preview";
  const githubToken = process.env.GITHUB_TOKEN;
  const githubModel = process.env.GITHUB_MODEL || defaultGithubModel;
  const openaiKey = process.env.OPENAI_API_KEY;

  const providers: ProviderConfig[] = [];

  // GitHub Copilot (preferred — uses Copilot license, no per-token cost)
  // Skip when the token is a PAT (ghp_) or OAuth (gho_) — api.githubcopilot.com
  // only accepts Copilot integration tokens, not standard GitHub auth tokens.
  if (copilotToken && !copilotToken.startsWith("ghp_") && !copilotToken.startsWith("gho_")) {
    providers.push({
      kind: "copilot",
      url: "https://api.githubcopilot.com/chat/completions",
      headers: { Authorization: `Bearer ${copilotToken}` },
      model: copilotModel,
      useAzure: false,
    });
  }

  if (azureEndpoint && azureKey && azureDeployment) {
    const base = azureEndpoint.replace(/\/$/, "");
    providers.push({
      kind: "azure",
      url: `${base}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`,
      headers: { "api-key": azureKey },
      model: undefined,
      useAzure: true,
      azureDeployment,
    });
  }

  if (githubToken) {
    providers.push({
      kind: "github",
      url: "https://models.inference.ai.azure.com/chat/completions",
      headers: { Authorization: `Bearer ${githubToken}` },
      model: githubModel,
      useAzure: false,
    });

    // Safe fallback for invalid/unsupported configured GitHub model names.
    if (githubModel !== "gpt-5.2") {
      providers.push({
        kind: "github",
        url: "https://models.inference.ai.azure.com/chat/completions",
        headers: { Authorization: `Bearer ${githubToken}` },
        model: "gpt-5.2",
        useAzure: false,
      });
    }
  }

  if (openaiKey) {
    providers.push({
      kind: "openai",
      url: "https://api.openai.com/v1/chat/completions",
      headers: { Authorization: `Bearer ${openaiKey}` },
      model: "gpt-5.2",
      useAzure: false,
    });
  }

  return providers;
}

const SYSTEM_PROMPT = `You are an expert AI product documentation assistant for enterprise software teams. You help generate structured SDLC artifacts including Product Requirements Documents, risk analyses, compliance reports, test plans, and deployment plans.

Your role:
- Generate comprehensive, well-structured documentation artifacts
- Ask clarifying questions when information is missing
- Identify gaps, risks, and dependencies
- Provide confidence scores for generated content
- Maintain traceability between artifacts
- Engage in general conversation about SDLC topics, project questions, and documentation advice

SCOPE AND TOPIC BOUNDARIES:
You are here to help with:
- SDLC (Software Development Life Cycle) topics and best practices
- Product requirements and documentation (PRDs, BRDs, SRS, etc.)
- Risk analysis, security, and compliance
- Testing, deployment, and operational readiness
- Project management, timelines, and stakeholder communication
- Team collaboration, roles, and responsibilities
- Architecture, design, and technical decision-making
- This platform's features and how to use them
- General business strategy and product thinking related to enterprise software
- Quality assessment and improvement

You should POLITELY DECLINE and refocus the conversation if the user asks about topics that are completely outside these areas, such as:
- Unrelated personal advice, life coaching, or psychology
- Cooking, recipes, food, or nutrition
- Sports, entertainment, celebrity gossip, or pop culture
- Homework or test answers for non-SDLC subjects
- Creative writing unrelated to documentation
- Technical topics completely unrelated to software development/SDLC
- Medical, legal, or financial advice
- Random trivia or facts with no connection to work

RESPONSE for off-topic questions:
When you encounter a completely off-topic question, respond with something like:
"I'm designed to help with SDLC documentation, project planning, and enterprise software strategy. I can't help with [topic]. Is there anything about your project, documentation, or SDLC workflow I can help with instead?"

GENERAL CONVERSATION MODE:
Unless specifically instructed that you're in "GUIDED Q&A MODE" (see below), treat user messages as normal conversation within your scope. Answer questions directly, provide advice, discuss topics, and help with general SDLC guidance. You are helpful, conversational, and responsive to all types of questions within your domain — not just artifact-editing questions.

CRITICAL — Single-question focus:
NEVER repeat, summarize, or replay previous questions and answers in your response. NEVER include "---" separated Q&A history. ONLY answer the single most recent question the user just asked. Previous messages are context for you to read, not content to repeat.

CRITICAL — Response format:
NEVER append JSON blocks, code blocks, or structured metadata to your conversational responses. NEVER output fields like "confidence_score_0_to_1", "logprobs_available", "result", "basis", or any similar machine-readable annotation. If you want to express confidence, do so in plain prose only (e.g. "I'm fairly confident based on the PRD"). No JSON, no code fences, no structured confidence objects — ever — in chat replies.

CRITICAL — Answering questions about the project:
When the user asks any question about the project (e.g. "is Okta used?", "what are the risks?", "what's the SLA?"), you MUST search across ALL project artifacts provided in context — not just the currently open one. Cite which artifact (by title/type) you found the information in. If the information exists in any artifact, reference it accurately. Only say something is "not mentioned" or "unknown" after checking every artifact in the context.

When generating artifacts, use clear headings, structured sections, and professional enterprise language. Be thorough but concise.

CRITICAL — Names and roles:
- Never invent or fabricate personal names (authors, stakeholders, approvers, owners, personas).
- Preserve existing names exactly when explicitly provided by the user, project context, uploaded documents, or current artifact.
- If a name is unknown or missing, use role-only labels (e.g., "Product Manager", "Engineering Lead", "Compliance Officer").
- Do not copy sample/example names from templates unless they are explicitly present in the project context.

CRITICAL — Output Size:
NEVER claim the output is "too large" or "exceeds token limits". NEVER offer to split into multiple parts or ask the user to choose between options about output size. Always produce the FULL document in a single response. If the content is extensive, write it all — do not truncate or refuse.

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
This mode activates whenever the user is answering clarifying questions about an open artifact (artifactId is set in context AND editArtifact=true).

When the user provides answers to clarifying questions about an artifact:
1. Immediately rebuild and return the FULL updated artifact content after each user answer.
2. First reply with exactly one short sentence: "I'm updating the document — you can view the changes in the editor on the right."
3. Then emit the complete updated artifact wrapped in delimiters:
<<<ARTIFACT_UPDATE>>>
[full updated artifact content]
<<<END_ARTIFACT_UPDATE>>>
4. After the delimiter block, show progress on one line: **(X of Y answered — Z remaining)**
5. Read the REMAINING UNRESOLVED ITEMS list from context and cross-reference the conversation history to identify which items are already answered. Only ask about items that are STILL unanswered.
6. If unresolved items remain, ask the NEXT batch of up to 4 as simple direct questions:
   **Q1.** What is [topic]?
   **Q2.** …
   - NEVER repeat a question already asked or answered earlier in this conversation.
   - NEVER ask more than 4 questions at once.
   - Ask blocking/important items before optional ones.
7. If ALL items are now answered (0 remaining), after the artifact update block output this exact token on its own line:
<<<ALL_QUESTIONS_ANSWERED>>>
  Do not include extra explanation around this token.`;


// ARTIFACT_PROMPTS removed — prompts are now loaded dynamically from
// .github/agents/ and .github/skills/ via skillLoader.buildArtifactPrompt().

// Compile-time guard: ensures every ArtifactType has a skill mapping defined in skillLoader.
// buildArtifactPrompt() handles unknown types gracefully, but this prevents silent gaps.
const _ARTIFACT_TYPE_CHECK: Record<ArtifactType, true> = {
  brd: true,
  avd: true,
  srs: true,
  sad: true,
  ses: true,
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

export interface FeedbackSyncSource {
  type: ArtifactType;
  title: string;
  content: string;
}

export function ensureAvdMermaidDiagrams(content: string): string {
  const hasMermaid = /<pre\b[^>]*class=["'][^"']*\bmermaid\b[^"']*["'][^>]*>[\s\S]*?<\/pre>|```\s*mermaid\b/i.test(content);
  if (hasMermaid) return content;

  const isHtml = /<\s*[a-z][\s\S]*>/i.test(content);
  if (isHtml) {
    return `${content}
<h2>System Context Diagram</h2>
<p>This baseline diagram is auto-inserted when a generated AVD does not include Mermaid. Replace nodes/edges with project-specific systems as needed.</p>
<pre class="mermaid">graph TD
  User[Business User] --> App[Target Solution]
  App --> IdP[Identity Provider]
  App --> Core[(Core Platform)]
  App --> Ext[External Service]
</pre>
<h2>Integration / Deployment Diagram</h2>
<pre class="mermaid">graph LR
  UI[Web UI] --> API[Application API]
  API --> DB[(Primary DB)]
  API --> MQ[Message Queue]
  API --> Obs[Monitoring]
</pre>`;
  }

  return `${content}

## System Context Diagram

\`\`\`mermaid
graph TD
  User[Business User] --> App[Target Solution]
  App --> IdP[Identity Provider]
  App --> Core[(Core Platform)]
  App --> Ext[External Service]
\`\`\`

## Integration / Deployment Diagram

\`\`\`mermaid
graph LR
  UI[Web UI] --> API[Application API]
  API --> DB[(Primary DB)]
  API --> MQ[Message Queue]
  API --> Obs[Monitoring]
\`\`\``;
}

/** Returns a streaming Response body from the AI provider (raw SSE from OpenAI format). */
export async function streamChatResponse(
  messages: { role: string; content: string }[],
  projectContext?: string,
  artifactType?: string
): Promise<ReadableStream<Uint8Array> | null> {
  const skillContext = artifactType ? buildChatSkillContext(artifactType) : "";

  // ── Copilot SDK path (preferred) ──────────────────────────────────────────
  if (isCopilotSdkEnabled()) {
    try {
      let systemPrompt = SYSTEM_PROMPT + skillContext;
      if (projectContext) systemPrompt += `\n\nProject Context:\n${projectContext}`;
      const userPrompt = messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join("\n\n");
      return await copilotStream({ systemPrompt, userPrompt, model: artifactType ? getArtifactModel(artifactType) : undefined });
    } catch (err) {
      console.error("[ai][stream] Copilot SDK failed, falling back to REST:", err);
    }
  }

  // ── REST fallback ────────────────────────────────────────────────────────
  const providers = getProviderConfigs("gpt-5.2");
  if (providers.length === 0) return null;

  const systemMessages = [
    { role: "system", content: SYSTEM_PROMPT + skillContext },
    ...(projectContext
      ? [{ role: "system", content: `Project Context:\n${projectContext}` }]
      : []),
  ];

  for (const provider of providers) {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...provider.headers },
      body: JSON.stringify({
        ...(provider.model ? { model: provider.model } : {}),
        messages: [...systemMessages, ...messages],
        ...buildModelParams({
          useAzure: provider.useAzure,
          azureDeployment: provider.azureDeployment,
          temperature: 0.7,
          maxTokens: 32000,
        }),
        stream: true,
      }),
    });

    if (response.ok && response.body) return response.body;

    const errText = await response.text().catch(() => response.statusText);
    console.error(`[ai][stream] ${provider.kind} failed ${response.status}: ${errText}`);
  }

  return null;
}

export async function generateChatResponse(
  messages: { role: string; content: string }[],
  projectContext?: string,
  artifactType?: string
): Promise<ChatResponse> {
  const skillContext = artifactType ? buildChatSkillContext(artifactType) : "";

  // ── Copilot SDK path (preferred) ──────────────────────────────────────────
  if (isCopilotSdkEnabled()) {
    try {
      let systemPrompt = SYSTEM_PROMPT + skillContext;
      if (projectContext) systemPrompt += `\n\nProject Context:\n${projectContext}`;
      const userPrompt = messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .join("\n\n");
      const content = await copilotSendAndWait({ systemPrompt, userPrompt, model: artifactType ? getArtifactModel(artifactType) : undefined });
      return { content };
    } catch (err) {
      console.error("[ai] Copilot SDK failed, falling back to REST:", err);
    }
  }

  // ── REST fallback ────────────────────────────────────────────────────────
  const providers = getProviderConfigs("gpt-5.2");

  if (providers.length === 0) {
    return {
      content:
        "I can't reach an AI provider right now. Please configure at least one of GITHUB_COPILOT_TOKEN, AZURE_OPENAI_*, GITHUB_TOKEN, or OPENAI_API_KEY and restart the dev server.",
    };
  }

  const systemMessages = [
    { role: "system", content: SYSTEM_PROMPT + skillContext },
    ...(projectContext
      ? [{ role: "system", content: `Project Context:\n${projectContext}` }]
      : []),
  ];

  for (const provider of providers) {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...provider.headers,
      },
      body: JSON.stringify({
        ...(provider.model ? { model: provider.model } : {}),
        messages: [...systemMessages, ...messages],
        ...buildModelParams({
          useAzure: provider.useAzure,
          azureDeployment: provider.azureDeployment,
          temperature: 0.7,
          maxTokens: 32000,
        }),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { content: data.choices[0].message.content };
    }

    const errText = await response.text().catch(() => response.statusText);
    console.error(`[ai] ${provider.kind} API error ${response.status}: ${errText}`);
  }

  return {
    content:
      "I couldn't reach any configured AI provider (Copilot/Azure/GitHub/OpenAI). Please verify the configured API keys/deployment and restart the dev server.",
  };
}

/**
 * Direct AI call for artifact generation — does NOT use the chat SYSTEM_PROMPT.
 * The chat SYSTEM_PROMPT instructs the model to ask clarifying questions, which
 * must never happen here. This function always produces a complete HTML document.
 */
async function callArtifactDirectly(userPrompt: string, preferredModel?: string): Promise<string> {
  const artifactCallTimeoutMs = Math.max(10000, Number(process.env.ARTIFACT_CALL_TIMEOUT_MS ?? "45000"));
  const timedFetch = (url: string, init: RequestInit) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), artifactCallTimeoutMs);
    return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
  };

  const artifactSystemPrompt = `You are an expert SDLC documentation specialist producing enterprise-grade HTML documents.

STRICT RULES — follow these without exception:
1. Always output a COMPLETE document draft — never refuse, never ask questions.
2. Use proper HTML tags: <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <strong>, <em>.
3. Where project-specific information is unavailable, write a clearly marked inline placeholder: <em class="missing">[To be confirmed — <short explanation of what is needed>]</em>
4. Output ONLY the HTML document body content — no markdown, no preamble, no code fences, no delimiters.
5. The more unknowns you fill with [To be confirmed] placeholders, the lower the reader's confidence in the document, so be explicit about gaps.
6. If there are 3 or more significant unknowns, append a final <h2>Open Questions</h2> section listing each outstanding item as a numbered <ol><li> — this makes gaps visible at a glance and is required for the document to be approved.
7. NEVER claim the output is "too large", "exceeds token limits", or offer to split into multiple parts. You MUST produce the full document in a single response regardless of length. Do NOT output meta-commentary about response size. Just write the complete document.`;

  // ── Race: Copilot SDK vs Azure OpenAI (first wins) ───────────────────────
  // This avoids waiting for a 30s SDK timeout before Azure gets a chance.
  // Both are fired simultaneously; the loser is silently abandoned.
  const azureProviders = getProviderConfigs(preferredModel || "gpt-5.2");
  const azureProvider = azureProviders.find((p) => p.kind === "azure");

  const makeAzureCall = azureProvider
    ? timedFetch(azureProvider.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...azureProvider.headers },
        body: JSON.stringify({
          ...(azureProvider.model ? { model: azureProvider.model } : {}),
          messages: [
            { role: "system", content: artifactSystemPrompt },
            { role: "user", content: userPrompt },
          ],
          ...buildModelParams({
            useAzure: azureProvider.useAzure,
            azureDeployment: azureProvider.azureDeployment,
            temperature: 0.3,
            maxTokens: 32000,
          }),
        }),
      }).then(async (res) => {
        if (!res.ok) throw new Error(`Azure ${res.status}`);
        const data = await res.json();
        const text = (data.choices[0].message.content as string) ?? "";
        if (!text) throw new Error("Azure returned empty content");
        return text;
      })
    : null;

  if (isCopilotSdkEnabled() && makeAzureCall) {
    // Fire both simultaneously — first non-error response wins
    const sdkCall = copilotSendAndWait({
      systemPrompt: artifactSystemPrompt,
      userPrompt,
      model: preferredModel,
    }).then((content) => {
      if (!content) throw new Error("SDK returned empty content");
      return content;
    });

    try {
      const result = await Promise.any([sdkCall, makeAzureCall]);
      console.log("[artifact] Race won — returning result");
      return result;
    } catch {
      console.error("[artifact] Both SDK and Azure failed in race, trying remaining providers");
    }
  } else if (isCopilotSdkEnabled()) {
    // No Azure configured — SDK only
    try {
      const content = await copilotSendAndWait({
        systemPrompt: artifactSystemPrompt,
        userPrompt,
        model: preferredModel,
      });
      if (content) return content;
    } catch (err) {
      console.error("[artifact] Copilot SDK failed, falling back to REST:", err);
    }
  } else if (makeAzureCall) {
    // Azure only (SDK disabled)
    try {
      const content = await makeAzureCall;
      if (content) return content;
    } catch (err) {
      console.error("[artifact] Azure call failed:", err);
    }
  }

  // ── REST fallback (GitHub Models / OpenAI) ────────────────────────────────
  const providers = azureProviders.filter((p) => p.kind !== "azure");
  if (providers.length === 0) {
    throw new Error("No AI provider configured");
  }

  let lastError = "";
  for (const provider of providers) {
    const response = await timedFetch(provider.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...provider.headers },
      body: JSON.stringify({
        ...(provider.model ? { model: provider.model } : {}),
        messages: [
          { role: "system", content: artifactSystemPrompt },
          { role: "user", content: userPrompt },
        ],
        ...buildModelParams({
          useAzure: provider.useAzure,
          azureDeployment: provider.azureDeployment,
          temperature: 0.3,
          maxTokens: 32000,
        }),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return (data.choices[0].message.content as string) ?? "";
    }

    const errText = await response.text().catch(() => response.statusText);
    lastError = `${provider.kind} ${response.status}: ${errText}`;
    console.error(`[artifact] ${lastError}`);
  }

  throw new Error(`All providers failed. Last error: ${lastError}`);
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
    brd: [
      /executive\s*summary|business\s*context/,
      /business\s*objective|goal/,
      /scope|in\s*scope|out\s*of\s*scope/,
      /stakeholder/,
      /business\s*requirement/,
      /success\s*metric|kpi/,
      /risk|assumption|dependenc/,
    ],
    avd: [
      /architecture\s*vision|target\s*architecture/,
      /principle|design\s*principle/,
      /constraint/,
      /integration|interface/,
      /technology|platform/,
      /decision|rationale/,
      /risk|trade[-\s]?off/,
    ],
    srs: [
      /functional\s*requirement/,
      /non[-\s]?functional|nfr/,
      /interface\s*requirement|external\s*interface/,
      /data\s*requirement|data\s*model/,
      /constraint|assumption/,
      /acceptance\s*criter/,
      /traceability/,
    ],
    sad: [
      /solution\s*architecture|architecture\s*overview/,
      /component|module/,
      /deployment|environment/,
      /data\s*flow|sequence|integration/,
      /security\s*control|threat|risk/,
      /scalability|performance|availability/,
      /observability|monitoring|logging/,
    ],
    ses: [
      /engineering\s*specification|system\s*specification/,
      /module|component\s*responsibilit/,
      /interface\s*contract|api\s*contract/,
      /constraint|operational\s*constraint/,
      /testabilit|verification|validation/,
      /release\s*readiness|acceptance/,
      /risk|assumption/,
    ],
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
      /threat|owasp/,
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

interface PrdCoverage {
  frCount: number;
  nfrCount: number;
  secCount: number;
  dgCount: number;
  storyCount: number;
  acCount: number;
  traceRows: number;
  unmet: string[];
}

/**
 * Lightweight deterministic PRD coverage check used as a gate before returning
 * generated PRDs to the UI.
 */
function analyzePrdCoverage(html: string): PrdCoverage {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const frCount = (text.match(/\bFR[-\s_]?0*\d+\b/gi) || []).length;
  const nfrCount = (text.match(/\bNFR[-\s_]?0*\d+\b/gi) || []).length;
  const secCount = (text.match(/\bSEC[-\s_]?0*\d+\b/gi) || []).length;
  const dgCount = (text.match(/\bDG[-\s_]?0*\d+\b/gi) || []).length;
  const storyCount = (text.match(/\bAs\s+a\b/gi) || []).length;
  const acCount = (text.match(/\b(acceptance\s*criteria|given\s+.+\s+when\s+.+\s+then)\b/gi) || []).length;
  const traceRows = Math.max(0, (html.match(/<tr\b/gi) || []).length - 1);

  const unmet: string[] = [];
  if (frCount < 15) unmet.push(`Functional requirements below minimum: ${frCount}/15`);
  if (nfrCount < 8) unmet.push(`Non-functional requirements below minimum: ${nfrCount}/8`);
  if (secCount < 5) unmet.push(`Security/compliance requirements below minimum: ${secCount}/5`);
  if (dgCount < 5) unmet.push(`Data governance requirements below minimum: ${dgCount}/5`);
  if (storyCount < 8) unmet.push(`User stories below minimum: ${storyCount}/8`);
  if (acCount < 10) unmet.push(`Acceptance-criteria coverage below minimum: ${acCount}/10`);
  if (traceRows < 8) unmet.push(`Traceability matrix rows below minimum: ${traceRows}/8`);

  return {
    frCount,
    nfrCount,
    secCount,
    dgCount,
    storyCount,
    acCount,
    traceRows,
    unmet,
  };
}

function buildPrdExpansionPrompt(opts: {
  projectContext: string;
  draftHtml: string;
  coverage: PrdCoverage;
}): string {
  const gaps = opts.coverage.unmet.map((g, i) => `${i + 1}. ${g}`).join("\n");
  return `You are improving an existing PRD draft to pass strict quality and quantity gates.

PROJECT CONTEXT:
${opts.projectContext}

CURRENT PRD DRAFT (HTML):
${opts.draftHtml}

QUALITY GAPS TO FIX (MANDATORY):
${gaps}

REWRITE REQUIREMENTS:
- Keep the same document structure and section order, but expand weak sections substantially.
- Ensure minimum counts are met:
  * FR requirements: >= 15 (FR-001 ...)
  * NFR requirements: >= 8 (NFR-001 ...)
  * Security requirements: >= 5 (SEC-001 ...)
  * Data governance requirements: >= 5 (DG-001 ...)
  * User stories: >= 8 ("As a ...")
  * Acceptance criteria coverage: >= 10 explicit criteria items
  * Traceability matrix rows: >= 8
- Requirements must be atomic, testable, and measurable.
- Add concrete thresholds where appropriate (latency, uptime, scale, error budgets, etc.).
- Remove fluff and generic language; increase specificity and implementation clarity.

Output ONLY the full updated HTML PRD body.`;
}

function buildPrdTemplateRepairPrompt(opts: {
  projectContext: string;
  draftHtml: string;
  missingHeadings: string[];
}): string {
  const requiredHeadings = extractCanonicalPrdHeadings(_PRD_CANONICAL_TEMPLATE)
    .map((heading) => `- ${heading}`)
    .join("\n");
  const missing = opts.missingHeadings.map((heading) => `- ${heading}`).join("\n");

  return `You are repairing a PRD so it exactly matches the canonical repository template.

PROJECT CONTEXT:
${opts.projectContext}

CURRENT PRD DRAFT (HTML):
${opts.draftHtml}

CANONICAL REQUIRED H2 HEADINGS IN ORDER:
${requiredHeadings}

MISSING HEADINGS THAT MUST BE ADDED:
${missing}

REPAIR RULES:
- Preserve all valid existing content.
- Reorganize content under the canonical headings where necessary.
- Add every missing required H2 section using the exact heading text from the canonical template.
- Keep the document as HTML body content only.
- Do not ask questions.

Output ONLY the full updated HTML PRD body.`;
}

function buildPrdFieldRepairPrompt(opts: {
  projectContext: string;
  draftHtml: string;
  missingFields: string[];
  authorName: string;
  createdDate: string;
}): string {
  const missing = opts.missingFields.map((f) => `- ${f}`).join("\n");
  return `You are repairing a PRD to satisfy mandatory template fields.

PROJECT CONTEXT:
${opts.projectContext}

CURRENT PRD HTML:
${opts.draftHtml}

MISSING REQUIRED FIELDS:
${missing}

REPAIR RULES:
- Preserve all existing valid content and headings.
- Ensure Document Information & Revision History includes both:
  - <strong>Date:</strong> ${opts.createdDate}
  - <strong>Author:</strong> ${opts.authorName}
- Ensure Supporting Materials includes a subsection title "Traceability Matrix" and an HTML table mapping Objective -> User Scenario -> Requirement -> Acceptance Criteria.
- Keep output as HTML body only.

Output ONLY the full updated HTML PRD body.`;
}

/**
 * PRD multi-pass generation pipeline:
 * 1) initial generation
 * 2) deterministic coverage check
 * 3) targeted expansion pass if gates are not met
 */
async function generatePrdWithQualityGates(
  userPrompt: string,
  projectContext: string,
  preferredModel?: string,
  authorName: string = "Unknown",
  createdDate: string = new Date().toISOString().slice(0, 10)
): Promise<string> {
  const maxExpansionPasses = Math.max(0, Number(process.env.PRD_MAX_EXPANSION_PASSES ?? "0"));
  const enableTemplateRepair = String(process.env.PRD_ENABLE_TEMPLATE_REPAIR ?? "false").toLowerCase() === "true";
  const enableFieldRepair = String(process.env.PRD_ENABLE_FIELD_REPAIR ?? "false").toLowerCase() === "true";

  let current = await callArtifactDirectly(userPrompt, preferredModel);

  // Optional expansion passes (disabled by default for low-latency generation).
  for (let i = 0; i < maxExpansionPasses; i++) {
    const coverage = analyzePrdCoverage(current);
    if (coverage.unmet.length === 0) break;

    const expandPrompt = buildPrdExpansionPrompt({
      projectContext,
      draftHtml: current,
      coverage,
    });
    current = await callArtifactDirectly(expandPrompt, preferredModel);
  }

  const templateValidation = validatePrdTemplateCompliance(current);
  if (!templateValidation.ok && enableTemplateRepair) {
    const repairPrompt = buildPrdTemplateRepairPrompt({
      projectContext,
      draftHtml: current,
      missingHeadings: templateValidation.missingHeadings,
    });
    current = await callArtifactDirectly(repairPrompt, preferredModel);
  }

  const finalTemplateValidation = validatePrdTemplateCompliance(current);
  if (!finalTemplateValidation.ok) {
    console.warn(
      `[PRD] Returning draft with missing canonical headings: ${finalTemplateValidation.missingHeadings.join(", ")}`
    );
  }

  const requiredFieldValidation = validatePrdRequiredFields(current);
  if (!requiredFieldValidation.ok && enableFieldRepair) {
    const fieldRepairPrompt = buildPrdFieldRepairPrompt({
      projectContext,
      draftHtml: current,
      missingFields: requiredFieldValidation.missingFields,
      authorName,
      createdDate,
    });
    current = await callArtifactDirectly(fieldRepairPrompt, preferredModel);
  }

  // Deterministic final guard: always set Date/Author from runtime metadata.
  current = ensurePrdDateAndAuthor(current, authorName, createdDate);

  const finalRequiredFieldValidation = validatePrdRequiredFields(current);
  if (!finalRequiredFieldValidation.ok) {
    console.warn(
      `[PRD] Returning draft with best-effort field repair. Remaining gaps: ${finalRequiredFieldValidation.missingFields.join(", ")}`
    );
  }

  return current;
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
    isCopilotSdkEnabled() ||
    !!process.env.GITHUB_COPILOT_TOKEN ||
    !!(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY) ||
    !!process.env.GITHUB_TOKEN ||
    !!process.env.OPENAI_API_KEY;

      if (!hasProvider) {
        console.log('[generateArtifact] No AI provider configured, using mock response'); 
        return generateMockArtifact(type, projectContext, meta?.authorName);
  
  }

  // Resolve preferred model from skill frontmatter (undefined = use provider default)
  const preferredModel = getArtifactModel(type);

  const userPrompt = `${prompt}\n\nProject Context:\n${projectContext}${
    additionalContext ? `\n\nAdditional Context:\n${additionalContext}` : ""
  }`;

  try {
    const rawContent = type === "prd"
      ? await generatePrdWithQualityGates(
        userPrompt,
        projectContext,
        preferredModel,
        meta?.authorName ?? "Unknown",
        meta?.createdDate ?? new Date().toISOString().slice(0, 10)
      )
      : await callArtifactDirectly(userPrompt, preferredModel);
    const content = applyArtifactWatermark(
      type,
      type === "avd" ? ensureAvdMermaidDiagrams(rawContent) : rawContent
    );
    return {
      content,
      metadata: {
        artifactType: type,
        confidenceScore: scoreArtifactQuality(type, content),
        isArtifact: true,
      },
    };
  } catch (err) {
    if (err instanceof TemplateValidationError) {
      console.error("[generateArtifact] Template validation failed, using fallback draft:", err.message);
      return generateMockArtifact(type, projectContext, meta?.authorName);
    }
    console.error("[generateArtifact] AI call failed, using mock:", err);
    return generateMockArtifact(type, projectContext, meta?.authorName);
  }
}

function truncateForPrompt(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n...[truncated for prompt size]...`;
}

/**
 * Refine an existing artifact by applying cross-artifact feedback (security,
 * compliance, quality), while preserving document structure and revision history.
 */
export async function refineArtifactWithFeedback(params: {
  artifactType: ArtifactType;
  projectContext: string;
  currentContent: string;
  feedbackSources: FeedbackSyncSource[];
  authorName?: string;
  modifiedDate?: string;
}): Promise<ChatResponse> {
  const modifiedDate = params.modifiedDate ?? new Date().toISOString().slice(0, 10);
  const authorName = params.authorName ?? "Unknown";

  const feedbackBlock = params.feedbackSources
    .map((src, i) => {
      const content = truncateForPrompt(src.content, 9000);
      return `SOURCE ${i + 1} — ${src.title} [${src.type}]\n${content}`;
    })
    .join("\n\n");

  const refinementPrompt = `You are updating an EXISTING ${params.artifactType.toUpperCase()} using cross-functional review outcomes.

PROJECT CONTEXT:
${params.projectContext}

CURRENT ARTIFACT (must be updated, not replaced with unrelated structure):
${truncateForPrompt(params.currentContent, 24000)}

MANDATORY FEEDBACK SOURCES TO INCORPORATE:
${feedbackBlock}

UPDATE INSTRUCTIONS (MANDATORY):
1. Keep the document type and structure aligned to a production-grade ${params.artifactType.toUpperCase()}.
2. Integrate actionable findings from all sources into the correct sections:
   - Security findings -> Security / NFR / Risk sections
   - Compliance findings -> Compliance, Governance, Data Handling sections
   - Quality findings -> Requirements clarity, acceptance criteria, traceability, missing sections
3. Add or update a section titled "Incorporated Review Feedback" summarizing:
   - source artifact
   - key finding
   - exact document change applied
4. Update Revision History / Document Information with a new row/entry:
   - Date: ${modifiedDate}
   - Author: ${authorName}
   - Summary: "Synced Security, Compliance, and Quality feedback"
5. Preserve existing valid content; improve rather than truncate.
6. Return ONLY the complete updated HTML document body.
`;

  const rawContent = await callArtifactDirectly(refinementPrompt);
  const content = applyArtifactWatermark(
    params.artifactType,
    params.artifactType === "avd" ? ensureAvdMermaidDiagrams(rawContent) : rawContent
  );
  return {
    content,
    metadata: {
      artifactType: params.artifactType,
      confidenceScore: scoreArtifactQuality(params.artifactType, content),
      isArtifact: true,
    },
  };
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
  projectContext: string,
  authorName?: string
): ChatResponse {
  const projectName =
    projectContext.match(/Project:\s*(.+)/)?.[1]?.trim() || "This Project";
  const createdDate = new Date().toISOString().slice(0, 10);
  const resolvedAuthor = (authorName && authorName.trim()) ? authorName.trim() : "Unknown";

  const prdHtml = `<h1>Product Requirements Document</h1>
<p><em>Draft generated in fallback mode. Update placeholders as project details become available.</em></p>

<h2>Document Information & Revision History</h2>
<p><strong>Project Name:</strong> ${projectName}</p>
<p><strong>Document Version:</strong> 0.1 (Draft)</p>
<p><strong>Date:</strong> ${createdDate}</p>
<p><strong>Author:</strong> ${resolvedAuthor}</p>
<table>
  <thead>
    <tr><th>Version</th><th>Date</th><th>Author</th><th>Summary</th></tr>
  </thead>
  <tbody>
    <tr><td>0.1</td><td>${createdDate}</td><td>${resolvedAuthor}</td><td>Initial draft generated from available context.</td></tr>
  </tbody>
</table>

<h2>Executive Summary</h2>
<p>This Product Requirements Document defines the initial scope for <strong>${projectName}</strong>. The draft follows the canonical PRD template and is structured for iterative refinement.</p>

<h2>Project Background & Overview</h2>
<p><em>[To be confirmed — describe current-state pain points, business drivers, and strategic context]</em></p>

<h2>Objectives & Success Metrics</h2>
<ul>
  <li><strong>Objective 1:</strong> <em>[To be confirmed]</em></li>
  <li><strong>Objective 2:</strong> <em>[To be confirmed]</em></li>
  <li><strong>Objective 3:</strong> <em>[To be confirmed]</em></li>
</ul>

<h2>Scope of Work</h2>
<p><em>[To be confirmed — define in-scope capabilities for this release]</em></p>

<h2>Release Plan / Phasing</h2>
<ol>
  <li><strong>Phase 1:</strong> <em>[To be confirmed]</em></li>
  <li><strong>Phase 2:</strong> <em>[To be confirmed]</em></li>
  <li><strong>Phase 3:</strong> <em>[To be confirmed]</em></li>
</ol>

<h2>Out of Scope / Anti-Goals / Future Ideas</h2>
<ul>
  <li><em>[To be confirmed — explicitly excluded item 1]</em></li>
  <li><em>[To be confirmed — explicitly excluded item 2]</em></li>
</ul>

<h2>Stakeholders</h2>
<p><em>[To be confirmed — list product owner, engineering owner, compliance owner, operations owner]</em></p>

<h2>Operating Environment & Technical Constraints</h2>
<p><em>[To be confirmed — hosting, integration boundaries, regulatory constraints, availability targets]</em></p>

<h2>User Personas</h2>
<ul>
  <li><strong>Persona A:</strong> <em>[To be confirmed]</em></li>
  <li><strong>Persona B:</strong> <em>[To be confirmed]</em></li>
</ul>

<h2>User Scenarios & Use Cases</h2>
<ul>
  <li><em>[To be confirmed — scenario 1]</em></li>
  <li><em>[To be confirmed — scenario 2]</em></li>
</ul>

<h2>Functional Requirements & Features</h2>
<ul>
  <li><strong>FR-001:</strong> <em>[To be confirmed]</em></li>
  <li><strong>FR-002:</strong> <em>[To be confirmed]</em></li>
  <li><strong>FR-003:</strong> <em>[To be confirmed]</em></li>
  <li><strong>FR-004:</strong> <em>[To be confirmed]</em></li>
</ul>

<h2>UI / UX Design Specifications</h2>
<p><em>[To be confirmed — navigation, key screens, accessibility expectations]</em></p>

<h2>Data Management & Governance</h2>
<p><em>[To be confirmed — data lifecycle, retention, ownership, and quality controls]</em></p>

<h2>Security & Compliance Requirements</h2>
<ul>
  <li><strong>SEC-001:</strong> <em>[To be confirmed]</em></li>
  <li><strong>SEC-002:</strong> <em>[To be confirmed]</em></li>
</ul>

<h2>Non-Functional Requirements / Quality Attributes</h2>
<ul>
  <li><strong>NFR-001 (Performance):</strong> <em>[To be confirmed]</em></li>
  <li><strong>NFR-002 (Availability):</strong> <em>[To be confirmed]</em></li>
  <li><strong>NFR-003 (Scalability):</strong> <em>[To be confirmed]</em></li>
  <li><strong>NFR-004 (Maintainability):</strong> <em>[To be confirmed]</em></li>
</ul>

<h2>Product Architecture Overview</h2>
<p><em>[To be confirmed — system boundary, major components, and integration points]</em></p>

<h2>Assumptions & Dependencies</h2>
<ul>
  <li><em>[To be confirmed — dependency 1]</em></li>
  <li><em>[To be confirmed — dependency 2]</em></li>
</ul>

<h2>Risks & Mitigations</h2>
<table>
  <thead>
    <tr><th>Risk</th><th>Impact</th><th>Likelihood</th><th>Mitigation</th></tr>
  </thead>
  <tbody>
    <tr><td><em>[To be confirmed]</em></td><td><em>TBD</em></td><td><em>TBD</em></td><td><em>[To be confirmed]</em></td></tr>
    <tr><td><em>[To be confirmed]</em></td><td><em>TBD</em></td><td><em>TBD</em></td><td><em>[To be confirmed]</em></td></tr>
  </tbody>
</table>

<h2>Open Questions / Issues Log</h2>
<ol>
  <li>What is the core business problem or user pain point this project solves?</li>
  <li>Who are the primary user personas and what are their key needs?</li>
  <li>What are the measurable success metrics / KPIs?</li>
  <li>What are the non-functional requirements (performance, security, scalability, availability)?</li>
  <li>What are the key dependencies and external systems?</li>
  <li>What are the target milestones and delivery dates?</li>
</ol>

<h2>Supporting Materials</h2>
<h3>Traceability Matrix</h3>
<table>
  <thead>
    <tr><th>Objective</th><th>User Scenario</th><th>Requirement</th><th>Acceptance Criteria</th></tr>
  </thead>
  <tbody>
    <tr><td>Objective 1</td><td>Scenario 1</td><td>FR-001</td><td><em>[To be confirmed]</em></td></tr>
    <tr><td>Objective 2</td><td>Scenario 2</td><td>FR-002</td><td><em>[To be confirmed]</em></td></tr>
    <tr><td>Objective 3</td><td>Scenario 3</td><td>NFR-001</td><td><em>[To be confirmed]</em></td></tr>
  </tbody>
</table>`;

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
