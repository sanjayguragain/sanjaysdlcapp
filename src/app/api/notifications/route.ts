import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SLA_HOURS = 48;

/** Post an Adaptive Card to the Teams webhook when artifacts are overdue. */
async function sendTeamsEscalation(
  overdueItems: {
    artifactTitle: string;
    projectName: string;
    artifactType: string;
    hoursElapsed: number;
  }[]
) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  if (!webhookUrl || overdueItems.length === 0) return;

  const facts = overdueItems.slice(0, 5).map((item) => ({
    title: item.artifactTitle,
    value: `${item.projectName} · ${item.artifactType.replace(/_/g, " ")} · ${item.hoursElapsed}h elapsed`,
  }));

  const card = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: `⚠️ ${overdueItems.length} artifact${overdueItems.length !== 1 ? "s" : ""} overdue for approval`,
              weight: "Bolder",
              size: "Medium",
              color: "Attention",
            },
            {
              type: "TextBlock",
              text: `The following artifacts have exceeded the ${SLA_HOURS}-hour approval SLA:`,
              wrap: true,
            },
            {
              type: "FactSet",
              facts,
            },
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: "View Pending Approvals",
              url: `${process.env.APP_URL ?? "http://localhost:3001"}/projects`,
            },
          ],
        },
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });
  } catch {
    // Swallow network errors — escalation is best-effort
  }
}

export async function GET(_req: NextRequest) {
  const awaiting = await prisma.artifact.findMany({
    where: { status: "awaiting_approval" },
    include: { project: true },
    orderBy: { updatedAt: "asc" },
  });

  const now = Date.now();

  const notifications = awaiting.map((a) => {
    const hoursElapsed = (now - a.updatedAt.getTime()) / (1000 * 60 * 60);
    const isOverdue = hoursElapsed > SLA_HOURS;
    const hoursRemaining = Math.max(0, SLA_HOURS - hoursElapsed);
    return {
      id: a.id,
      artifactId: a.id,
      projectId: a.projectId,
      projectName: a.project.name,
      artifactTitle: a.title,
      artifactType: a.type,
      submittedAt: a.updatedAt.toISOString(),
      hoursElapsed: Math.round(hoursElapsed),
      hoursRemaining: Math.round(hoursRemaining),
      isOverdue,
    };
  });

  // Dispatch Teams escalation for overdue items (best-effort, non-blocking)
  const overdueItems = notifications.filter((n) => n.isOverdue);
  void sendTeamsEscalation(overdueItems);

  return NextResponse.json({
    count: notifications.length,
    overdueCount: overdueItems.length,
    notifications,
  });
}
