/**
 * Shared utility for detecting blocking issues in artifact content.
 * Used by:
 *  - ArtifactSidePanel (client) — pre-submission gate
 *  - ArtifactViewer (client)    — pre-submission gate
 *  - PUT /artifacts/:id route   — server-side guard
 */

/**
 * Decode dash HTML entities so regex matching works regardless of whether the
 * AI / serialiser emitted the Unicode character or an HTML entity.
 * We intentionally do NOT decode < > & because we still need the HTML structure.
 */
function decodeDashEntities(html: string): string {
  return html
    .replace(/&mdash;/gi, "\u2014")   // —
    .replace(/&#x2014;/gi, "\u2014")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&ndash;/gi, "\u2013")   // –
    .replace(/&#x2013;/gi, "\u2013")
    .replace(/&#8211;/g, "\u2013");
}

/**
 * Scan the artifact HTML content and return every blocking item that must be
 * resolved before the artifact can be submitted for approval.
 *
 * Detects:
 *  1. Inline `[To be confirmed — <label>]` placeholders (labelled)
 *  2. Bare `[To be confirmed]` placeholders (unlabelled)
 *  3. Any list item or paragraph inside a heading section whose text contains
 *     an "open questions" variant (e.g. "Open Questions", "Questions for
 *     Stakeholders", "Pending Questions", "Outstanding Items").
 *
 * Returns a deduplicated, human-readable list of blocking items.
 */
export function extractBlockers(rawHtml: string): string[] {
  const html = decodeDashEntities(rawHtml);
  const blockers: string[] = [];

  const shouldIgnoreOpenQuestionsText = (text: string): boolean => {
    const normalized = text.replace(/\s+/g, " ").trim().toLowerCase();
    if (!normalized) return true;
    // Common non-blocking sentinel phrases that indicate there are no remaining questions.
    if (normalized === "none" || normalized === "n/a" || normalized === "na") return true;
    if (normalized.includes("no open questions")) return true;
    if (normalized.includes("no outstanding")) return true;
    if (normalized.includes("all open questions have been resolved")) return true;
    if (normalized.includes("all previously open questions have been resolved")) return true;
    if (normalized.includes("have been resolved and incorporated")) return true;
    return false;
  };

  const add = (text: string) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean && !blockers.includes(clean)) blockers.push(clean);
  };

  // ── 1. Labelled [To be confirmed — <label>] markers ─────────────────────
  const labeledRe = /\[To be confirmed\s*[\u2014\u2013\-]\s*([^\]<]{2,})\]/gi;
  let m: RegExpExecArray | null;
  while ((m = labeledRe.exec(html)) !== null) {
    add(m[1]);
  }

  // ── 2. Bare [To be confirmed] markers not already accounted for ──────────
  const totalMarkers = (html.match(/\[To be confirmed/gi) || []).length;
  for (let i = blockers.length; i < totalMarkers; i++) {
    add("Unspecified section (no label provided)");
  }

  // ── 3. Open Questions section items ─────────────────────────────────────
  // Match any heading whose visible text contains an "open questions" variant.
  // Heading tag + number is captured so we can find the matching close tag.
  const oqHeadingRe =
    /<h([1-6])[^>]*>([\s\S]*?(?:open\s+questions?|questions?\s+for\s+stakeholders?|pending\s+questions?|unanswered\s+questions?|outstanding\s+(?:items?|questions?))[^<]*)<\/h\1>/gi;

  while ((m = oqHeadingRe.exec(html)) !== null) {
    const level = parseInt(m[1], 10);
    const sectionStart = m.index + m[0].length;

    // Section ends at the next heading of same or higher level (h1..hLevel),
    // or at the end of the document.
    const nextHeadingRe = new RegExp(`<h[1-${level}][\\s>]`, "i");
    const rest = html.slice(sectionStart);
    const nextMatch = nextHeadingRe.exec(rest);
    const sectionHtml = nextMatch ? rest.slice(0, nextMatch.index) : rest;

    // Extract <li> items
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let li: RegExpExecArray | null;
    while ((li = liRe.exec(sectionHtml)) !== null) {
      const text = li[1].replace(/<[^>]+>/g, "");
      if (!shouldIgnoreOpenQuestionsText(text)) add(text);
    }

    // Extract non-empty <p> paragraphs (for when items are not in a list)
    const pRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let p: RegExpExecArray | null;
    while ((p = pRe.exec(sectionHtml)) !== null) {
      const text = p[1].replace(/<[^>]+>/g, "");
      if (!shouldIgnoreOpenQuestionsText(text)) add(text);
    }
  }

  return blockers;
}
