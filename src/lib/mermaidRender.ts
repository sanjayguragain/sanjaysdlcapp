let initialized = false;

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
  try {
    const id = `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { svg } = await mermaid.render(id, code);
    return svg;
  } catch {
    return null;
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
    const code = pre.textContent?.trim();
    return code || null;
  }

  const raw = (pre.querySelector("code")?.textContent ?? pre.textContent ?? "").trim();
  if (!raw) return null;

  // Editor-friendly marker to explicitly identify Mermaid code blocks.
  if (/^%%\s*mermaid\b/i.test(raw)) {
    return raw.replace(/^%%\s*mermaid\s*\n?/i, "").trim();
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
  const mermaid = await getMermaid();
  const blocks = Array.from(root.querySelectorAll("pre"));
  let idx = 0;

  for (const pre of blocks) {
    const code = extractMermaidCodeFromPre(pre);
    if (!code) continue;
    try {
      const id = `mmd-view-${Date.now()}-${idx++}`;
      const { svg } = await mermaid.render(id, code);
      const wrapper = document.createElement("div");
      wrapper.className = "mermaid-svg";
      wrapper.setAttribute("data-mermaid-code", code);
      wrapper.innerHTML = svg;
      pre.replaceWith(wrapper);
    } catch {
      // If Mermaid parse fails, keep source visible.
    }
  }
}

export async function renderMermaidHtmlForExport(html: string): Promise<string> {
  const mermaid = await getMermaid();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks = Array.from(doc.querySelectorAll("pre"));
  let idx = 0;

  for (const pre of blocks) {
    const code = extractMermaidCodeFromPre(pre);
    if (!code) continue;
    try {
      const id = `mmd-export-${Date.now()}-${idx++}`;
      const { svg } = await mermaid.render(id, code);
      const wrapper = doc.createElement("div");
      wrapper.className = "mermaid-svg";
      wrapper.setAttribute("data-mermaid-code", escapeAttr(code));
      wrapper.innerHTML = svg;
      pre.replaceWith(wrapper);
    } catch {
      // Keep source if render fails
    }
  }

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
