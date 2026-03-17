name: "Architectural Decision Record"
description: "Legacy entry point retained for discoverability. Routes ADR requests into the supported ADR Builder workflow."
argument-hint: "Decision context, options considered, chosen option, rationale, consequences, ADR ID if known, and links to related artifacts."
agent: "4 - Design - ADR Builder"
tools: [read, search, agent, todo]

---

This prompt name is retained so existing users can still find the supported ADR path.

Use this entry point to route architecture decision work into the ADR Builder workflow.

## Important

- Do not inline or recreate the full ADR template from this prompt.
- Do not use the legacy template-heavy ADR behavior unless the user explicitly asks for it.
- Treat the request as ADR orchestration: clarify the decision, confirm the ADR ID and naming convention, gather alternatives and rationale, and produce a standardized ADR package using the canonical template.

## How To Respond

1. State briefly that this prompt now routes to the supported ADR Builder path.
2. Clarify the decision, scope, status, and whether the ADR already has an index such as `ADR-012`.
3. Use the ADR Builder workflow to gather alternatives, rationale, tradeoffs, risks, and governance context.
4. Return the ADR-ready package or draft using the canonical indexed naming convention.

If the user explicitly says they want the original template-heavy ADR behavior, direct them to `LEGACY-Architectural-Decision-Record.prompt.md`.

