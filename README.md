# SDLC Platform

This project generates SDLC artifacts (especially PRDs) using template, skill, agent, prompt, and standards context from the repository.

## Quick Start

1. Install dependencies:
	- `npm install`
2. Start the app:
	- `npm run dev`
3. Open the project in the UI and create or open an artifact.

## PRD Template Source of Truth

PRD generation uses this canonical template:

- `.github/templates/PRD/PRD-{product-name-kebab-case}.md`

The system loads template content dynamically, so updates to this template are picked up for future generation and validation.

## Using Autofill Best Practices

In the artifact side panel, click **Autofill with Best Practices** to replace unresolved placeholders like:

- `[To be confirmed — ...]`

Autofill behavior:

- Preserves existing resolved content.
- Uses project context + uploaded docs + mapped skills/templates/prompts/standards.
- Fills missing values with concrete defaults only when project context does not provide them.
- Removes answered items from Open Questions when possible.

### Name Handling Rules (Important)

Autofill and generation must follow strict naming rules:

- Never invent fake personal names.
- Never copy sample names from template examples unless explicitly provided in project context.
- Preserve existing real names as-is if already present.
- If a name is unknown, use role-only labels (for example: Product Manager, Engineering Lead, Compliance Officer).

## Watermark Format

Every artifact ends with a **Watermark** section.

The watermark now includes metadata in a single JSON code block containing:

- `generated_by`
- `agents_used`
- `skills_used`
- `references_used`

This supports traceability for how each artifact was produced.

## Notes

- Existing artifacts can be backfilled to the latest watermark format.
- New and updated artifacts automatically use the current watermark renderer.