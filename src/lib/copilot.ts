/**
 * copilot.ts — GitHub Copilot SDK integration layer.
 *
 * Manages a single CopilotClient instance and exposes helpers that mirror the
 * interface expected by ai.ts (chat response, streaming, artifact generation).
 *
 * The client spawns the Copilot CLI process on first use and keeps it alive for
 * the lifetime of the Node process. Sessions are created per-request and
 * disconnected when the response is complete.
 */

// The SDK is ESM-only ("type": "module", exports only "import" condition).
// We use dynamic import() with the package name constructed at runtime so
// Turbopack can't statically resolve or transform its import.meta.resolve usage.
/* eslint-disable @typescript-eslint/no-explicit-any */
let _sdk: any = null;
let _sdkLoading: Promise<any> | null = null;
const _SDK_PKG = ["@github", "copilot-sdk"].join("/");

async function getSdk(): Promise<any> {
  if (_sdk) return _sdk;
  if (_sdkLoading) { _sdk = await _sdkLoading; return _sdk; }
  _sdkLoading = import(/* webpackIgnore: true */ _SDK_PKG);
  _sdk = await _sdkLoading;
  _sdkLoading = null;
  return _sdk;
}

// ── Singleton client ──────────────────────────────────────────────────────────

let _client: any = null;
let _clientStarting: Promise<void> | null = null;

function getGithubToken(): string | undefined {
  return process.env.GITHUB_COPILOT_TOKEN || process.env.GITHUB_TOKEN;
}

export function isCopilotSdkEnabled(): boolean {
  return process.env.USE_COPILOT_SDK === "true" && !!getGithubToken();
}

async function getClient(): Promise<any> {
  if (_client) return _client;
  if (_clientStarting) {
    await _clientStarting;
    return _client!;
  }

  const token = getGithubToken();
  if (!token) throw new Error("No GitHub token for Copilot SDK");

  const { CopilotClient } = await getSdk();
  _client = new CopilotClient({
    githubToken: token,
    useStdio: true,
    autoStart: true,
    autoRestart: true,
    logLevel: process.env.NODE_ENV === "development" ? "info" : "warning",
  });

  _clientStarting = _client.start().then(() => {
    _clientStarting = null;
  });
  await _clientStarting;
  return _client;
}

// ── Session helpers ───────────────────────────────────────────────────────────

const DEFAULT_MODEL = process.env.COPILOT_MODEL || "gpt-5.2";
const SESSION_TIMEOUT = 30_000; // 30 seconds — fast-fail so Azure fallback kicks in quickly

// Circuit breaker: after a timeout/failure, skip SDK for a cooldown period
// so subsequent calls in the same pipeline don't each waste 30 seconds.
let _circuitBroken = false;
let _circuitResetAt = 0;
const CIRCUIT_COOLDOWN = 2 * 60_000; // 2 minutes

function isCircuitOpen(): boolean {
  if (!_circuitBroken) return false;
  if (Date.now() >= _circuitResetAt) {
    _circuitBroken = false;
    console.log("[copilot] Circuit breaker reset — SDK calls re-enabled");
    return false;
  }
  return true;
}

function tripCircuit(reason: string): void {
  _circuitBroken = true;
  _circuitResetAt = Date.now() + CIRCUIT_COOLDOWN;
  console.warn(`[copilot] Circuit breaker tripped (${reason}) — skipping SDK for ${CIRCUIT_COOLDOWN / 1000}s`);
}

interface CreateSessionOpts {
  systemPrompt: string;
  model?: string;
  streaming?: boolean;
}

async function createSession(opts: CreateSessionOpts): Promise<any> {
  const client = await getClient();
  const { approveAll } = await getSdk();
  return client.createSession({
    model: opts.model || DEFAULT_MODEL,
    systemMessage: {
      mode: "replace" as const,
      content: opts.systemPrompt,
    },
    onPermissionRequest: approveAll,
    streaming: opts.streaming ?? false,
    infiniteSessions: { enabled: false },
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a prompt and return the full response text.
 * Used for non-streaming chat and artifact generation.
 */
export async function copilotSendAndWait(opts: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
}): Promise<string> {
  if (isCircuitOpen()) throw new Error("Copilot SDK circuit breaker is open");

  const session = await createSession({
    systemPrompt: opts.systemPrompt,
    model: opts.model,
    streaming: false,
  });

  try {
    const response: any = await session.sendAndWait(
      { prompt: opts.userPrompt },
      SESSION_TIMEOUT,
    );
    return response?.data?.content ?? "";
  } catch (err: any) {
    if (err?.message?.includes("Timeout")) tripCircuit("sendAndWait timeout");
    throw err;
  } finally {
    await session.disconnect().catch(() => {});
  }
}

/**
 * Send a prompt and return a ReadableStream of SSE-formatted text chunks.
 * Compatible with the streaming interface expected by the chat API routes.
 */
export async function copilotStream(opts: {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
}): Promise<ReadableStream<Uint8Array>> {
  if (isCircuitOpen()) throw new Error("Copilot SDK circuit breaker is open");

  const session = await createSession({
    systemPrompt: opts.systemPrompt,
    model: opts.model,
    streaming: true,
  });

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      // Stream delta events as SSE-formatted chunks (OpenAI compatible)
      session.on("assistant.message_delta", (event: any) => {
        const chunk = {
          choices: [
            {
              delta: { content: event.data.deltaContent },
              index: 0,
              finish_reason: null,
            },
          ],
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      });

      session.on("session.idle", () => {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        session.disconnect().catch(() => {});
      });

      session.on("session.error", () => {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        session.disconnect().catch(() => {});
      });

      // Fire the prompt
      session.send({ prompt: opts.userPrompt }).catch((err: any) => {
        controller.error(err);
        session.disconnect().catch(() => {});
      });
    },

    cancel() {
      session.disconnect().catch(() => {});
    },
  });
}

/**
 * List models available through the Copilot SDK.
 * Returns model id strings. Caches the result for the process lifetime.
 */
let _availableModels: string[] | null = null;

export async function listAvailableModels(): Promise<string[]> {
  if (_availableModels) return _availableModels;
  if (!isCopilotSdkEnabled()) return [];
  try {
    const client = await getClient();
    const models = await client.listModels();
    _availableModels = models.map((m: { id: string }) => m.id);
    return _availableModels!;
  } catch (err) {
    console.error("[copilot] listModels failed:", err);
    return [];
  }
}

/**
 * Gracefully shut down the Copilot CLI process (call on server shutdown).
 */
export async function shutdownCopilotClient(): Promise<void> {
  if (_client) {
    await _client.stop().catch(() => {});
    _client = null;
  }
}
