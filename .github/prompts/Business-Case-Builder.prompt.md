---
name: "Business Case Builder"
description: "Legacy entry point retained for discoverability. Routes rough product, business, and engineering demand into the supported backlog-shaping workflow."
argument-hint: "Rough idea, initiative, stakeholder request, problem statement, architecture note, or mixed backlog input that needs to be shaped into stories, requirements, spikes, or release slices."
agent: "3 - Analysis - Backlog Shaping Orchestrator"
tools: [read, search, agent, todo]
---

This prompt name is retained so existing users can still find the supported path.

Use this entry point to route rough demand into the backlog-shaping workflow.

## Important

- Do not generate a formal BRD1 or business case from this prompt.
- Do not reuse the legacy business-case template unless the user explicitly asks for the legacy behavior.
- Treat the request as backlog shaping: clarify intent, classify work as stories, requirements, or spikes, choose an appropriate slicing strategy, and produce a backlog-ready package.

## How To Respond

1. State briefly that this prompt now routes to the supported backlog-shaping path.
2. Clarify the initiative, user or system outcome, and main uncertainties.
3. Shape the work using the Backlog Shaping Orchestrator workflow.
4. Return normalized backlog items, slice recommendations, open questions, and recommended next steps.

If the user explicitly says they want the original business-case behavior, direct them to `LEGACY-Business-Case-Builder.prompt.md`.