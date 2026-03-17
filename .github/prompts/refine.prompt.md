---
name: "refine"
description: "Run the reflexloop refine cycle: check thresholds, apply one refinement, report prompt size."
argument-hint: "Agent name to refine (e.g., 5-python-developer)"
agent: "Refiner Agent"
tools: [read, edit, search]
---

You are being invoked in **manual /refine mode**.

## Instructions

1. The user will provide an agent name as the argument: `{{input}}`
2. Read `context/agents/{{input}}/critiques.jsonl` to gather findings.
3. Run the threshold check logic:
   - Cluster `prompt_gap` findings by `suggested_prompt_addition` text (first 80 chars)
   - Use a threshold of 3 sessions and a window of the last 20 entries
   - If no cluster meets threshold, report "No findings above threshold" and stop.
4. Read `context/agents/{{input}}/system-prompt.md` — count lines and estimate tokens (~27 tokens/line).
5. **Manual /refine priority**: Prioritize consolidation and deletion of low-value or redundant rules over adding new constraints. Actively look for P2 (style) items to prune.
6. Apply the refinement following the refiner's system prompt (section-aware operations: UPDATE, MERGE, INSERT, EXTRACT, RESTRUCTURE, PRUNE).
7. Measure the prompt after the change.
8. Print a summary in this exact format:
   ```
   Applied 1 refinement to {{input}}.
   Prompt: <before_lines> → <after_lines> lines (~<after_tokens> tokens).
   Budget: <after_lines>/150 (hard: 200).
   Merged <M> rules, pruned <P> rules.
   ```
9. Output the git commit message as the last line.
