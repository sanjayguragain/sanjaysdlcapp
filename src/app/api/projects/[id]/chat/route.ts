import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateChatResponse, streamChatResponse } from "@/lib/ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { evaluateArtifactQuality } from "@/lib/artifactChecks";
import { buildChatSkillContext } from "@/lib/skillLoader";

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
  nextContent: string
) {
  const artifact = await prisma.artifact.findUnique({ where: { id: artifactId } });
  if (!artifact || !nextContent) return null;

  // Allow updates even if content appears identical, in case formatting changed
  // (HTML formatting updates might be functionally identical but visually different)

  const before = evaluateArtifactQuality(artifact.type as any, artifact.content);
  const after = evaluateArtifactQuality(artifact.type as any, nextContent);

  await saveVersionSnapshot(artifactId, artifact.content, artifact.version);

  const improvedBlockers = after.blockers.length < before.blockers.length;
  const improvedOverall = after.overallScore >= before.overallScore;
  const nextConfidenceScore = improvedBlockers && !improvedOverall
    ? Math.max(before.confidenceScore, after.confidenceScore)
    : after.confidenceScore;

  return prisma.artifact.update({
    where: { id: artifactId },
    data: {
      content: nextContent,
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
  const { content, artifactId, clarifyArtifact, rebuildArtifact, autofillArtifact } = body;

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

    const autofillContext =
      `Project: ${project.name}\nDescription: ${project.description || "N/A"}\n\n` +
      `Uploaded documents:\n${docsContext || "None"}\n\n` +
      (skillRefContext ? `${skillRefContext}\n\n` : "") +
      `--- ARTIFACT TO AUTOFILL ---\nType: ${artifact.type}\nTitle: ${artifact.title}\n\n` +
      `${artifact.content}\n--- END ARTIFACT ---\n\n` +
      `AUTOFILL INSTRUCTION:\n` +
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
      `- Do NOT add unrelated sections or change the document type/format.\n` +
      `- If there is an Open Questions / Outstanding Items section, remove every item that has now been answered.\n` +
      `- If all open questions are now resolved, replace that section body with: "All previously open questions have been resolved and incorporated into the document."\n` +
      `- The final artifact should contain fewer blockers than the input artifact; never leave answered items behind in the Open Questions section.\n` +
      `Output format:\n` +
      `First output exactly one sentence: "I've autofilled all open questions using industry best practices — review the updates in the editor."\n` +
      `Then immediately output the complete updated artifact wrapped in <<<ARTIFACT_UPDATE>>> and <<<END_ARTIFACT_UPDATE>>> delimiters.`;

    const autofillMessages: { role: "user" | "assistant"; content: string }[] = [
      { role: "user", content: "Please autofill all [To be confirmed] placeholders using industry best practices." },
    ];

    let autofillStream: ReadableStream<Uint8Array> | null = null;
    try {
      autofillStream = await streamChatResponse(autofillMessages, autofillContext, artifact.type);
    } catch (e) {
      console.error("[chat] autofill stream threw:", e);
    }

    if (!autofillStream) {
      const aiResponse = await generateChatResponse(autofillMessages, autofillContext, artifact.type);
      const extracted = extractArtifactUpdate(aiResponse.content);
      const updatedArtifact = extracted.artifactContent
        ? await persistUpdatedArtifact(artifactId, extracted.artifactContent)
        : null;
      const assistantMessage = await prisma.chatMessage.create({
        data: { projectId: id, role: "assistant", content: extracted.chatContent || aiResponse.content },
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
          while (true) {
            const { done, value } = await reader.read();
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
          const updatedArtifact = extracted.artifactContent
            ? await persistUpdatedArtifact(artifactId, extracted.artifactContent)
            : null;
          const assistantMessage = await prisma.chatMessage.create({
            data: {
              projectId: id,
              role: "assistant",
              content: extracted.chatContent || autofillContent,
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
    let content = m.content;
    // Strip artifact update blocks so they don't consume the token budget on subsequent turns
    const delimIdx = content.indexOf("<<<ARTIFACT_UPDATE>>>");
    if (delimIdx !== -1) {
      content = content.slice(0, delimIdx).trim() || "I updated the document as requested.";
    }
    return { role: m.role as "user" | "assistant", content };
  });

  // Build context
  const docsContext = project.documents.map((d: NonNullable<Doc>) => d.content).join("\n\n");
  const artifactsContext = project.artifacts
    .map((a: NonNullable<Art>) => `[${a.type} - ${a.status}]: ${a.content.substring(0, 300)}`)
    .join("\n");

  // If editing a specific artifact, inject its full content as focused context
  let editContext = "";
  let chatArtifactType: string | undefined;
  if (artifactId && typeof artifactId === "string") {
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

  const projectContext = `Project: ${project.name}\nDescription: ${project.description || "N/A"}\nPhase: ${project.phase}${formatStakeholders(project.stakeholders)}\n\nDocuments:\n${docsContext || "None"}\n\nArtifacts:\n${artifactsContext || "None yet"}${editContext}`;

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
          const assistantMessage = await prisma.chatMessage.create({
            data: { projectId: id, role: "assistant", content: fullContent },
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
