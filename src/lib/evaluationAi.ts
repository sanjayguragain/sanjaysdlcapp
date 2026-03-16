/**
 * evaluationAi.ts — LLM integration for document quality evaluation.
 *
 * Calls Azure OpenAI (primary), GitHub Models (fallback), or OpenAI
 * to evaluate engineering quality dimensions that require semantic understanding.
 */

import { DocumentType, DOCUMENT_TYPE_LABELS } from "@/types";

const EVALUATION_SYSTEM_PROMPT = `You are an enterprise architecture reviewer.

Evaluate the following document based on this rubric.

Dimensions to evaluate (score each from 1 to 5):

1. Clarity — Statements are precise and unambiguous
2. Completeness — Required design information is present
3. Architecture Completeness — System context, components, data flows, integration points
4. Security Architecture — Security controls and threat considerations
5. Operational Readiness — Monitoring, deployment, reliability design
6. Requirement Quality — Requirements are atomic and testable
7. Consistency — No conflicting statements

For each dimension:
- Score from 1 (Poor) to 5 (Excellent)
- Explain reasoning briefly

Also list concrete improvement recommendations.

Return results in this exact JSON format (no markdown fences, just raw JSON):
{
  "scores": {
    "architecture_completeness": <1-5>,
    "security": <1-5>,
    "operational_readiness": <1-5>,
    "clarity": <1-5>,
    "completeness": <1-5>,
    "requirement_quality": <1-5>,
    "consistency": <1-5>
  },
  "reasoning": {
    "architecture_completeness": "<brief reasoning>",
    "security": "<brief reasoning>",
    "operational_readiness": "<brief reasoning>",
    "clarity": "<brief reasoning>",
    "completeness": "<brief reasoning>",
    "requirement_quality": "<brief reasoning>",
    "consistency": "<brief reasoning>"
  },
  "recommendations": [
    "<concrete improvement action 1>",
    "<concrete improvement action 2>"
  ]
}`;

export interface LLMEvaluationResult {
  architecture_completeness: number; // 0-100
  security: number; // 0-100
  operational_readiness: number; // 0-100
  llmRecommendations: string[];
  rawScores?: Record<string, number>;
  reasoning?: Record<string, string>;
}

/** Convert 1-5 scale to 0-100 scale. */
function scaleToHundred(score: number): number {
  return Math.round(Math.max(0, Math.min(100, ((score - 1) / 4) * 100)));
}

/** Call the LLM to evaluate engineering quality dimensions. */
export async function evaluateWithLLM(
  documentContent: string,
  documentType: DocumentType
): Promise<LLMEvaluationResult> {
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
    console.log("[evaluationAi] No AI provider configured — using mock evaluation");
    return generateMockEvaluation(documentContent);
  }

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

  const typeLabel = DOCUMENT_TYPE_LABELS[documentType] || documentType;

  // Truncate very long documents to stay within token limits
  const maxChars = 30000;
  const truncatedContent = documentContent.length > maxChars
    ? documentContent.slice(0, maxChars) + "\n\n[Document truncated for evaluation — " + documentContent.length + " total characters]"
    : documentContent;

  const userMessage = `Document Type: ${typeLabel}\n\n---\n\n${truncatedContent}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        ...(model ? { model } : {}),
        messages: [
          { role: "system", content: EVALUATION_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        ...(useAzure
          ? { max_completion_tokens: 4000 }
          : { temperature: 0.3, max_tokens: 2000 }),
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      console.error(`[evaluationAi] API error ${response.status}: ${errText}`);
      return generateMockEvaluation(documentContent);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response (handle potential markdown fences)
    const jsonStr = content.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    const scores = parsed.scores || {};

    return {
      architecture_completeness: scaleToHundred(scores.architecture_completeness ?? 3),
      security: scaleToHundred(scores.security ?? 3),
      operational_readiness: scaleToHundred(scores.operational_readiness ?? 3),
      llmRecommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      rawScores: scores,
      reasoning: parsed.reasoning,
    };
  } catch (err) {
    console.error("[evaluationAi] LLM evaluation failed:", err);
    return generateMockEvaluation(documentContent);
  }
}

/** Fallback mock evaluation when no LLM is available. */
function generateMockEvaluation(content: string): LLMEvaluationResult {
  const length = content.length;
  const base = length > 5000 ? 65 : length > 2000 ? 50 : 35;

  return {
    architecture_completeness: Math.min(100, base + Math.floor(Math.random() * 15)),
    security: Math.min(100, base - 5 + Math.floor(Math.random() * 15)),
    operational_readiness: Math.min(100, base - 10 + Math.floor(Math.random() * 15)),
    llmRecommendations: [
      "Add system context diagram",
      "Define monitoring and observability architecture",
      "Document security threat model and mitigations",
      "Include deployment architecture details",
    ],
  };
}
