import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateChatResponse, streamChatResponse } from "@/lib/ai";

type ChatMsg = Awaited<ReturnType<typeof prisma.chatMessage.findFirst>>;
type Doc = Awaited<ReturnType<typeof prisma.document.findFirst>>;
type Art = Awaited<ReturnType<typeof prisma.artifact.findFirst>>;

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
  const { content, artifactId } = body;

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

  const conversationHistory = previousMessages.map((m: NonNullable<ChatMsg>) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Build context
  const docsContext = project.documents.map((d: NonNullable<Doc>) => d.content).join("\n\n");
  const artifactsContext = project.artifacts
    .map((a: NonNullable<Art>) => `[${a.type} - ${a.status}]: ${a.content.substring(0, 300)}`)
    .join("\n");

  // If editing a specific artifact, inject its full content as focused context
  let editContext = "";
  if (artifactId && typeof artifactId === "string") {
    const targetArtifact = project.artifacts.find((a: NonNullable<Art>) => a.id === artifactId);
    if (targetArtifact) {
      editContext = `\n\n--- ARTIFACT BEING EDITED ---\nType: ${targetArtifact.type}\nTitle: ${targetArtifact.title}\nStatus: ${targetArtifact.status}\n\nCurrent content:\n${targetArtifact.content}\n--- END ARTIFACT ---\n\nThe user is editing this artifact. When they ask for changes, provide a revised version of the full artifact content using the same markdown format. You may also answer questions or give advice about the artifact directly.`;
    }
  }

  const projectContext = `Project: ${project.name}\nDescription: ${project.description || "N/A"}\nPhase: ${project.phase}\n\nDocuments:\n${docsContext || "None"}\n\nArtifacts:\n${artifactsContext || "None yet"}${editContext}`;

  // Generate AI response — attempt streaming first, fall back to non-streaming
  const aiStream = await streamChatResponse(conversationHistory, projectContext);

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
        } catch {
          // On error, signal done so client doesn't hang
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
  const aiResponse = await generateChatResponse(conversationHistory, projectContext);

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
