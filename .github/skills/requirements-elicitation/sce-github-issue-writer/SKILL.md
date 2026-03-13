---
name: sce-github-issue-writer
description: 'Draft properly formatted GitHub issues for planned work. Use when the user wants to create an issue, ticket, backlog item, implementation story, engineering requirement, or a work item from notes, docs, PRDs, architecture decisions, bugs, or rough ideas. Produces a title plus a clean markdown issue body with scope, value, dependencies, risks, and testable acceptance criteria.'
argument-hint: 'Describe the work to be done, the desired outcome, and any known constraints, dependencies, or source documents.'
metadata:
  tools:
  - Read
  - Write
  - Edit
  - Grep
  - 'github/*'
  version: 1.0.0
  author: GitHub Copilot
  category: requirements-elicitation
  tags:
  - github
  - issue
  - backlog
  - requirements
  - acceptance-criteria
---

# SCE GitHub Issue Writer

Create GitHub issues that are ready to hand to engineering without forcing the assignee to reverse-engineer intent.

## When To Use

Use this skill when the user wants to:

- Turn rough work into a GitHub issue
- Convert requirements, PRDs, BRDs, architecture notes, or meeting notes into an implementation ticket
- Create a story or engineering requirement with explicit acceptance criteria
- Tighten an underspecified issue before it is filed

Do not use this skill for:

- Pull request descriptions
- Incident tickets or postmortems
- Full PRDs or architecture documents

## Required Outcome

Produce these two outputs:

1. A concise GitHub issue title
2. A markdown issue body using the template in [github-issue-template.md](./assets/github-issue-template.md)

If the input is missing critical information, produce the best issue you can without inventing facts and add the gaps to `Open Questions`.

## Decision Logic

### 1. Choose the issue framing

- Use **User Story** framing when the work is user-centric and the value is best expressed as "As a..., I want..., so that..."
- Use **Requirement** framing when the work is system-centric, platform-centric, integration-centric, operational, security, or infrastructure-focused
- Use **Bug Fix** framing only if the user clearly describes broken current behavior
- If the framing is ambiguous, default to **Requirement** and state the ambiguity in `Open Questions`

### 2. Extract the minimum issue inputs

Capture, in this order:

- The problem or opportunity
- The desired outcome or value
- The scope of work
- Constraints, assumptions, or non-goals
- Dependencies and impacted systems
- Evidence or source references
- Acceptance criteria that can be verified

### 3. Normalize weak inputs

- Rewrite vague requests into specific implementation intent
- Split business value from implementation notes
- Convert implicit success conditions into explicit acceptance criteria
- Move speculative items into `Open Questions` or `Risks / Constraints`
- Keep the issue self-contained enough that an engineer can start work without reopening discovery from scratch

## Title Rules

Write the title as a short action-oriented statement.

- Prefer verb-first phrasing
- Keep it under 80 characters when practical
- Avoid filler such as "Need to", "Work on", or "Investigate" unless the work is genuinely exploratory
- Do not include markdown headings or ticket IDs in the title

Examples:

- `Add health check endpoint for outage reporter service`
- `Harden prompt logging to avoid sensitive customer data exposure`
- `Fix duplicate event emission during outage status updates`

## Body Construction Rules

Always use the exact section order from [github-issue-template.md](./assets/github-issue-template.md).

### Summary

- Explain the work in 2-4 sentences
- State the business or operational reason the work matters

### Work Type

- Set one of: `User Story`, `Requirement`, `Bug Fix`, `chore`, `Spike`

### Problem / Opportunity

- State the current pain, gap, risk, or missed capability
- Avoid generic statements like "we should improve"

### Desired Outcome

- Describe the observable result once the issue is complete
- Focus on outcome, not just activity

### In Scope

- List the concrete work included in this issue
- Keep the scope small enough to be tractable

### Out of Scope

- Explicitly name adjacent work that is not included
- Use this to control backlog creep

### Background / Evidence

- Cite the source material the issue came from if available
- Include relevant file paths, docs, or observed behavior
- If no source exists, say `Not provided`

### Dependencies

- List upstream decisions, systems, teams, or artifacts needed
- If there are no known dependencies, say `None known`

### Risks / Constraints

- State technical, operational, compliance, or sequencing constraints
- If none are known, say `None known`

### Acceptance Criteria

- Write a short flat list of testable criteria
- Prefer observable behavior over implementation trivia
- Use Gherkin-style statements when the scenario benefits from it
- Include non-functional expectations only when they materially affect done

### Definition of Done

- Include the execution checks needed to close the issue, such as tests, docs, rollout notes, or validation artifacts
- Keep this short and concrete

### Open Questions

- Only include unresolved points that materially affect implementation or acceptance
- If there are none, say `None`

## Quality Bar

Before finalizing, verify the issue meets all of these checks:

- The title states a concrete action
- The problem and desired outcome are both explicit
- Scope and non-scope are both present
- Acceptance criteria are testable
- Dependencies and constraints are visible
- Missing facts are labeled instead of invented
- The issue can stand alone without requiring the reader to inspect the entire chat history

## Output Format

Return the result in this format:

```markdown
Title: <issue title>

<issue body markdown>
```

Do not add commentary before the title unless the caller explicitly asks for rationale.

## Example Transformations

### Example 1

Input:

```text
We need a GitHub issue for adding a health endpoint to the Dash demo so uptime checks can work.
```

Output title:

```text
Add health endpoint for Dash demo uptime checks
```

### Example 2

Input:

```text
Turn the PRD requirement about prompt logging and sensitive data into an engineering issue.
```

Output title:

```text
Prevent sensitive data from being stored in prompt logs
```