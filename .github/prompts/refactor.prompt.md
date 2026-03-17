---
name: "refactor"
description: "Compression-only refactoring of an agent prompt. No new behavior — only deduplication, merging, and simplification."
argument-hint: "Agent name to refactor (e.g., 5-python-developer)"
agent: "Refiner Agent"
tools: [read, edit, search, terminal]
---

You are being invoked in **compression-only /refactor mode**.

## Instructions

1. The user will provide an agent name as the argument: `{{input}}`
2. Read `context/agents/{{input}}/system-prompt.md`.
3. Count lines and estimate tokens (~27 tokens/line) — record as `before_lines`.
4. **Compression-only rules** — you may NOT add any new behavior. Permitted operations:
   - **MERGE**: Combine overlapping or redundant rules into one stronger statement
   - **PRUNE**: Remove rules fully covered by a broader existing rule
   - **RESTRUCTURE**: Reorganize bloated sections for clarity without adding content
   - **EXTRACT**: Move duplicated patterns to `context/shared/patterns.md`
5. Scan all sections for:
   - Duplicate or near-duplicate instructions
   - Verbose wording that can be tightened
   - Rules that are subsumed by broader rules
   - Sections exceeding 15 lines
6. Apply the compression changes.
7. Run `scripts/prompt-stats.ps1 {{input}}` (or `.sh` on Linux) to verify the result.
8. Measure after-lines. If after_lines >= before_lines, explain why compression failed.
9. Print a summary in this exact format:
   ```
   Refactored {{input}} prompt: <before_lines> → <after_lines> lines.
   Merged <M> overlapping rules.
   Commit: refactor({{input}}): compress — <summary>
   ```
10. Append to `context/agents/{{input}}/changelog.md`:
    ```
    ## Refactor — YYYY-MM-DD
    **Operation:** COMPRESS
    **Before:** <before_lines> lines (~<before_tokens> tokens)
    **After:** <after_lines> lines (~<after_tokens> tokens)
    **Changes:** <list of merges/prunes performed>
    ```
