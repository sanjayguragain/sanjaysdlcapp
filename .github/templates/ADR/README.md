# ADR Template

This folder contains the canonical Architecture Decision Record template derived from the original ADR prompt and now used by the ADR skill and ADR Builder workflow.

## What this is

- [ADR-{adr-id}-{decision-name-kebab-case}.md](ADR-%7Badr-id%7D-%7Bdecision-name-kebab-case%7D.md) is the reusable ADR template.
- It includes section-by-section instructions marked as `DO NOT OUTPUT` plus an output template for each section.

## How it is used

- The default Architectural Decision Record prompt is now a thin router into the ADR Builder workflow.
- The legacy template-heavy behavior is preserved in `.github/prompts/LEGACY-Architectural-Decision-Record.prompt.md`.
- When generating an ADR, the consuming prompt, skill, or future agent should output only the filled ADR content.
- Instruction blocks should not appear in the final generated ADR.

## Conventions enforced by the template

- Use `ADR-###` IDs unless the caller or organization provides a different naming convention.
- Keep the ADR index number in both places: the file name and the `ADR ID` field inside the document.
- The file naming convention is `ADR-{adr-id}-{decision-name-kebab-case}.md` so individual decisions can be referenced directly by index number.
- Track unknowns as `TBD` and carry unresolved items into `Open Questions / Issues Log`.
- Record status explicitly as `Draft`, `Proposed`, `Accepted`, `Deprecated`, or `Superseded`.
- Include revision history, decision rationale, consequences, risks, approvals, and supporting references.
- Tie the decision to measurable leading indicators and success metrics where feasible.
- When the ADR justifies a non-approved technology, reference the governing `ABB` and the candidate `SBB` set, including approved but non-selected alternatives.

## Output location

This repo does not currently define one standard ADR output folder.

Generated ADRs should be written to the architecture-document location selected by the user or by a future ADR agent workflow. Until that is standardized, treat this template as the canonical ADR structure, not as a mandate for one storage path.
