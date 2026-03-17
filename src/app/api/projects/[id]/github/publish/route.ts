import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import TurndownService from "turndown";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

type PublishBody = {
  repoName?: string;
  description?: string;
  privateRepo?: boolean;
  includeAllArtifacts?: boolean;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "sdlc-project";
}

function safePathSegment(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";
}

function toBase64Utf8(content: string): string {
  return Buffer.from(content, "utf8").toString("base64");
}

function encodeGitHubPath(filePath: string): string {
  return filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function clipContent(content: string, maxChars = 500_000): string {
  if (content.length <= maxChars) return content;
  return `${content.slice(0, maxChars)}\n\n[Content truncated for repository export]`;
}

function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });
  return turndownService.turndown(html);
}

function readDirectory(
  dirPath: string,
  baseDir: string
): Array<{ path: string; content: string }> {
  const result: Array<{ path: string; content: string }> = [];

  try {
    const entries = readdirSync(dirPath);
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);
      const relativePath = fullPath.slice(baseDir.length + 1);

      if (stat.isDirectory()) {
        result.push(...readDirectory(fullPath, baseDir));
      } else {
        const content = readFileSync(fullPath, "utf8");
        result.push({
          path: `.github/${relativePath}`,
          content: clipContent(content),
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return result;
}

async function githubRequest<T>(
  token: string,
  endpoint: string,
  method: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jwt = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const githubToken =
    (jwt?.githubAccessToken as string | undefined) ?? process.env.GITHUB_TOKEN;

  if (!githubToken) {
    return NextResponse.json(
      {
        error:
          "No GitHub token available. Sign in again with GitHub or set GITHUB_TOKEN on the server.",
      },
      { status: 400 }
    );
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as PublishBody;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      artifacts: { orderBy: { createdAt: "asc" } },
      documents: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const prd = project.artifacts.find((a) => a.type === "prd");
  if (!prd) {
    return NextResponse.json(
      { error: "PRD artifact not found. Generate PRD first." },
      { status: 400 }
    );
  }

  const repoName = slugify(body.repoName?.trim() || project.name);
  const privateRepo = body.privateRepo ?? true;
  const includeAllArtifacts = body.includeAllArtifacts ?? true;

  // Get authenticated user info
  const userRes = await githubRequest<{ login?: string }>(
    githubToken,
    "/user",
    "GET"
  );
  if (!userRes.ok) {
    return NextResponse.json(
      { error: "Failed to get GitHub user info." },
      { status: userRes.status }
    );
  }
  const owner = userRes.data.login;
  if (!owner) {
    return NextResponse.json(
      { error: "GitHub response missing user login." },
      { status: 502 }
    );
  }

  // Try to get existing repo first
  let repoData = await githubRequest<{
    message?: string;
    full_name?: string;
    html_url?: string;
    default_branch?: string;
    owner?: { login?: string };
  }>(githubToken, `/repos/${owner}/${repoName}`, "GET");

  // If repo doesn't exist, create it
  if (repoData.status === 404) {
    const createRepo = await githubRequest<{
      message?: string;
      full_name?: string;
      html_url?: string;
      default_branch?: string;
      owner?: { login?: string };
    }>(githubToken, "/user/repos", "POST", {
      name: repoName,
      description:
        body.description?.trim() || `SDLC project export: ${project.name}`,
      private: privateRepo,
      auto_init: true,
    });

    if (!createRepo.ok) {
      const msg =
        createRepo.data?.message ||
        "Failed to create GitHub repository. Check token scope and repo name.";
      return NextResponse.json({ error: msg }, { status: createRepo.status });
    }

    repoData = createRepo;
  } else if (!repoData.ok) {
    const msg =
      repoData.data?.message || "Failed to access GitHub repository.";
    return NextResponse.json({ error: msg }, { status: repoData.status });
  }

  const defaultBranch = repoData.data.default_branch || "main";

  const files: Array<{ path: string; content: string }> = [];

  const projectSlug = slugify(project.name);
  files.push({
    path: "docs/README.md",
    content: `# ${project.name}\n\nExported from SDLC Platform on ${new Date().toISOString().slice(0, 10)}.\n\n- Project ID: ${project.id}\n- Phase: ${project.phase}\n- Mode: ${project.sdlcMode}\n- Artifacts exported: ${includeAllArtifacts ? project.artifacts.length : 1}\n`,
  });

  files.push({
    path: `docs/PRD/PRD-${projectSlug}.md`,
    content: clipContent(htmlToMarkdown(prd.content)),
  });

  files.push({
    path: "docs/project-metadata.md",
    content: `# Project Metadata\n\n- Name: ${project.name}\n- Description: ${project.description || "N/A"}\n- Status: ${project.status}\n- Current Phase: ${project.phase}\n`,
  });

  const artifactsToExport = includeAllArtifacts
    ? project.artifacts
    : [prd];

  for (const artifact of artifactsToExport) {
    files.push({
      path: `docs/artifacts/${safePathSegment(artifact.type)}.md`,
      content: clipContent(htmlToMarkdown(artifact.content)),
    });
  }

  for (const doc of project.documents) {
    files.push({
      path: `docs/source-documents/${safePathSegment(doc.name)}.txt`,
      content: clipContent(doc.content),
    });
  }

  // Include .github folder from the platform
  const githubDir = join(process.cwd(), ".github");
  const githubFiles = readDirectory(githubDir, githubDir);
  files.push(...githubFiles);

  const pushedPaths: string[] = [];
  for (const file of files) {
    const pushRes = await githubRequest<{ message?: string }>(
      githubToken,
      `/repos/${owner}/${repoName}/contents/${encodeGitHubPath(file.path)}`,
      "PUT",
      {
        message: `Add ${file.path}`,
        content: toBase64Utf8(file.content),
        branch: defaultBranch,
      }
    );

    if (!pushRes.ok) {
      console.error(
        `Failed to push ${file.path}:`,
        pushRes.data?.message || pushRes.status
      );
      // Continue pushing other files instead of failing completely
      continue;
    }

    pushedPaths.push(file.path);
  }

  return NextResponse.json({
    success: true,
    repository: {
      name: repoData.data.full_name,
      url: repoData.data.html_url,
      branch: defaultBranch,
    },
    pushedFileCount: pushedPaths.length,
    totalFiles: files.length,
    pushedPaths,
  });
}
