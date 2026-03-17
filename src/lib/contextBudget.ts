interface ContextArtifact {
  type: string;
  content: string;
}

interface BuildGenerationContextOptions {
  projectName: string;
  description: string;
  stakeholdersBlock?: string;
  documents: string[];
  artifacts: ContextArtifact[];
  artifactsHeading: string;
  maxApproxTokens?: number;
}

function estimateTokens(text: string): number {
  // Conservative approximation for mixed prose/HTML prompts.
  return Math.ceil(text.length / 4);
}

function compactBlock(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const head = Math.floor(maxChars * 0.7);
  const tail = maxChars - head;
  return `${text.slice(0, head)}\n\n[...content compacted for model context budget...]\n\n${text.slice(-tail)}`;
}

function buildContextBody(
  projectName: string,
  description: string,
  stakeholdersBlock: string,
  documents: string[],
  artifacts: ContextArtifact[],
  artifactsHeading: string,
  mode: "full" | "compact-artifacts" | "compact-all"
): string {
  const docs = documents
    .map((doc, idx) => {
      const value =
        mode === "compact-all" ? compactBlock(doc, 16000) : doc;
      return `--- Document ${idx + 1} ---\n${value}`;
    })
    .join("\n\n");

  const artifactsText = artifacts
    .map((artifact, idx) => {
      const value =
        mode === "full"
          ? artifact.content
          : mode === "compact-artifacts"
            ? compactBlock(artifact.content, 12000)
            : compactBlock(artifact.content, 8000);
      return `--- Artifact ${idx + 1} [${artifact.type}] ---\n${value}`;
    })
    .join("\n\n");

  return `Project: ${projectName}\nDescription: ${description}${stakeholdersBlock}\n\nExisting Documents:\n${docs || "None"}\n\n${artifactsHeading}:\n${artifactsText || "None"}`;
}

export function buildGenerationContext(
  options: BuildGenerationContextOptions
): string {
  const maxApproxTokens = options.maxApproxTokens ?? 60000;
  const stakeholdersBlock = options.stakeholdersBlock ?? "";

  const full = buildContextBody(
    options.projectName,
    options.description,
    stakeholdersBlock,
    options.documents,
    options.artifacts,
    options.artifactsHeading,
    "full"
  );
  if (estimateTokens(full) <= maxApproxTokens) return full;

  const compactArtifacts = buildContextBody(
    options.projectName,
    options.description,
    stakeholdersBlock,
    options.documents,
    options.artifacts,
    options.artifactsHeading,
    "compact-artifacts"
  );
  if (estimateTokens(compactArtifacts) <= maxApproxTokens) {
    return `${compactArtifacts}\n\n[Note: Prior artifact content was compacted to fit model context limits.]`;
  }

  const compactAll = buildContextBody(
    options.projectName,
    options.description,
    stakeholdersBlock,
    options.documents,
    options.artifacts,
    options.artifactsHeading,
    "compact-all"
  );

  return `${compactAll}\n\n[Note: Prior document and artifact content was compacted to fit model context limits.]`;
}
