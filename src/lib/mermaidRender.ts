let initialized = false;

function normalizeMermaidCode(raw: string): string {
  let code = raw
    .replace(/\r\n?/g, "\n")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
    .replace(/[\u00A0\u202F]/g, " ") // non-breaking spaces
    .replace(/[\u2010-\u2015]/g, "-"); // unicode dashes

  // Recover common HTML-escaped Mermaid operators/tokens when they leak into text.
  code = code
    .replace(/&gt;/gi, ">")
    .replace(/&lt;/gi, "<")
    .replace(/&amp;/gi, "&")
    .replace(/&#45;/g, "-");

  // Accept accidental fenced blocks copied into <pre> or editor nodes
  code = code.replace(/^```\s*mermaid\s*\n?/i, "");
  code = code.replace(/^```\s*\n?/i, "");
  code = code.replace(/\n?```\s*$/i, "");

  // Accept editor marker and accidental standalone language hint
  code = code.replace(/^%%\s*mermaid\s*\n?/i, "");
  code = code.replace(/^\s*mermaid\s*\n/i, "");

  // Trim trailing spaces per line to avoid parser confusion
  code = code
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .trim();

  // If prose leaked into the block, start from the first known diagram header
  const lines = code.split("\n");
  const startIdx = lines.findIndex((line) =>
    /^\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|quadrantChart|xychart-beta|block-beta)\b/i.test(line)
  );
  if (startIdx > 0) {
    code = lines.slice(startIdx).join("\n").trim();
  }

  return code;
}

function applyMermaidCompatibilityFixes(code: string): string {
  let fixed = code;

  // Mermaid v11 can reject some Font Awesome shorthand inside node labels.
  // Convert patterns like [fa:fa-car Car] -> [Car], [fas:fa-user] -> [user].
  fixed = fixed.replace(/\[(?:fa|fas|far|fab):fa-[\w-]+\s+([^\]]+)\]/gi, "[$1]");
  fixed = fixed.replace(/\[(?:fa|fas|far|fab):fa-([\w-]+)\]/gi, "[$1]");

  // Normalize smart quotes that occasionally appear from AI output.
  fixed = fixed
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

  // Last-resort flowchart label normalization for Mermaid v11 parser edge cases.
  // Convert shape syntaxes into quoted labels so parser does not choke on mixed punctuation.
  fixed = fixed
    // DB[(Metrics Database)] -> DB["Metrics Database"]
    .replace(/\b([A-Za-z_][\w-]*)\s*\[\(([^\]]*?)\)\]/g, (_m, id, label) => `${id}["${label}"]`)
    // B(Go shopping) -> B["Go shopping"]
    .replace(/\b([A-Za-z_][\w-]*)\s*\(([^\)]*?)\)/g, (_m, id, label) => `${id}["${label}"]`)
    // C{Let me think} -> C["Let me think"]
    .replace(/\b([A-Za-z_][\w-]*)\s*\{([^\}]*?)\}/g, (_m, id, label) => `${id}["${label}"]`)
    // A[End User] -> A["End User"] (skip already-quoted labels)
    .replace(/\b([A-Za-z_][\w-]*)\s*\[(?!")(.*?)\]/g, (_m, id, label) => `${id}["${label}"]`);

  return fixed;
}

function isMermaidErrorSvg(svg: string): boolean {
  const raw = svg || "";
  const textOnly = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const combined = `${raw}\n${textOnly}`;
  return /syntax\s*error\s*in\s*text|mermaid\s*version\s*\d+|aria-roledescription\s*=\s*["']error["']|error-icon|parser\s*error/i.test(combined);
}

function decodeAttr(value: string, doc: Document): string {
  const area = doc.createElement("textarea");
  area.innerHTML = value;
  return area.value;
}

function scrubMermaidErrorsInDocument(doc: Document): void {
  const wrappers = Array.from(doc.querySelectorAll(".mermaid-svg"));
  for (const wrapper of wrappers) {
    const html = wrapper.innerHTML ?? "";
    const text = wrapper.textContent ?? "";
    if (!/Syntax error in text|mermaid version\s+\d+|error/i.test(`${html}\n${text}`)) {
      continue;
    }

    const encoded = wrapper.getAttribute("data-mermaid-code") ?? "";
    const decoded = encoded ? decodeAttr(encoded, doc) : "";
    if (!decoded.trim()) {
      wrapper.remove();
      continue;
    }
    const pre = doc.createElement("pre");
    pre.className = "mermaid";
    pre.textContent = decoded;
    wrapper.replaceWith(pre);
  }

  const svgs = Array.from(doc.querySelectorAll("svg"));
  for (const svg of svgs) {
    const svgText = `${svg.outerHTML}\n${svg.textContent ?? ""}`;
    if (!/Syntax error in text|mermaid version\s+\d+|aria-roledescription=["']error["']|error-icon/i.test(svgText)) {
      continue;
    }

    const parent = svg.closest(".mermaid-svg") ?? svg.parentElement;
    if (!parent || parent.tagName.toLowerCase() === "pre") continue;

    const encoded = parent.getAttribute("data-mermaid-code") ?? "";
    const decoded = encoded ? decodeAttr(encoded, doc) : "";
    if (!decoded.trim()) {
      parent.remove();
      continue;
    }
    const pre = doc.createElement("pre");
    pre.className = "mermaid";
    pre.textContent = decoded;
    parent.replaceWith(pre);
  }
}

async function getMermaid() {
  const mod = await import("mermaid");
  const mermaid = mod.default;
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "default",
    });
    initialized = true;
  }
  return mermaid;
}

export async function renderMermaidCodeToSvg(code: string, idPrefix = "mmd-inline"): Promise<string | null> {
  const mermaid = await getMermaid();
  const normalized = normalizeMermaidCode(code);
  try {
    const id = `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { svg } = await mermaid.render(id, normalized);
    if (!isMermaidErrorSvg(svg)) {
      return svg;
    }

    const fallbackId = `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fallbackCode = applyMermaidCompatibilityFixes(normalized);
    const retry = await mermaid.render(fallbackId, fallbackCode);
    return isMermaidErrorSvg(retry.svg) ? null : retry.svg;
  } catch {
    try {
      const id = `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const { svg } = await mermaid.render(id, applyMermaidCompatibilityFixes(normalized));
      if (isMermaidErrorSvg(svg)) return null;
      return svg;
    } catch {
      return null;
    }
  }
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function extractMermaidCodeFromPre(pre: Element): string | null {
  if (pre.classList.contains("mermaid")) {
    const code = normalizeMermaidCode(pre.textContent ?? "");
    return code || null;
  }

  const raw = normalizeMermaidCode(pre.querySelector("code")?.textContent ?? pre.textContent ?? "");
  if (!raw) return null;

  // Editor-friendly marker to explicitly identify Mermaid code blocks.
  if (/^%%\s*mermaid\b/i.test(raw)) {
    return normalizeMermaidCode(raw.replace(/^%%\s*mermaid\s*\n?/i, "").trim());
  }

  return null;
}

export function extractMermaidBlocksFromHtml(html: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks = Array.from(doc.querySelectorAll("pre"));
  const result: string[] = [];

  for (const pre of blocks) {
    const code = extractMermaidCodeFromPre(pre);
    if (code) result.push(code);
  }

  return result;
}

export async function renderMermaidInElement(root: HTMLElement): Promise<void> {
  scrubMermaidErrorsInDocument(root.ownerDocument);
}

export async function renderMermaidHtmlForExport(html: string): Promise<string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  scrubMermaidErrorsInDocument(doc);
  return doc.body.innerHTML;
}

export async function mermaidSvgToPngData(svgMarkup: string): Promise<Uint8Array | null> {
  try {
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    const loadPromise = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Image load failed"));
    });

    img.src = url;
    await loadPromise;
    URL.revokeObjectURL(url);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, img.width);
    canvas.height = Math.max(1, img.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!pngBlob) return null;

    const ab = await pngBlob.arrayBuffer();
    return new Uint8Array(ab);
  } catch {
    return null;
  }
}
