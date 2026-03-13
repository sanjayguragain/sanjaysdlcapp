---
name: sce-story-slicing-strategist
description: 'Selects and applies the right slicing strategy for oversized epics, vague backlog ideas, mixed user journeys, and risk-heavy initiatives. Use when work is too large, too ambiguous, or too tangled to hand directly to story or requirement writers.'
metadata:
  tools:
  - Read
  - Write
  - Glob
  - Grep
  - Task
  version: 1.0.0
  author: GitHub Copilot
  category: requirements-elicitation
  tags:
  - backlog
  - slicing
  - decomposition
  - story-mapping
  - requirements
---

# SCE Story Slicing Strategist

Choose the smallest coherent slices of work that preserve user value, expose risk early, and keep the backlog demonstrable.

## When To Use

Use this skill when:

- A feature, epic, or requirement is too large to estimate confidently
- User journeys contain multiple materially different paths
- Product and engineering concerns are tangled together in one request
- You need to decide whether to slice by value, persona, path, risk, data, rules, or release
- A rough backlog item would otherwise become an incoherent mega-story

Do not use this skill when:

- The work is already small, testable, and backlog-ready
- The user only needs a final formatted story or requirement
- The need is prioritization rather than slicing

## Related Skills

- `sce-user-story-writer` for rendering user-centric slices into final story artifacts
- `sce-technical-requirement-writer` for rendering system-centric slices into final requirement artifacts
- `user-story-mapping` for organizing sliced work into walking skeleton and release increments
- `prioritization-methods` for ranking slices after they are defined
- `jtbd-analysis` when the team needs stronger outcome framing before slicing

## Inputs

Accept any of the following:

- Epic, feature, or initiative description
- Rough story or requirement that feels too large
- Meeting notes or discovery notes
- Architecture or compliance notes that need decomposition
- Known personas, paths, systems, constraints, and risks

## Required Outcome

Produce a slice plan that includes:

1. Recommended slicing axis or combination of axes
2. 3-7 candidate slices when possible
3. Rationale for why this slicing approach fits the work
4. Risks, assumptions, and deferred concerns
5. Recommendation for which slices should become stories, requirements, or spikes

## Slicing Decision Framework

### Start With Value

Ask first:

- What is the smallest demonstrable outcome?
- What can a stakeholder see, evaluate, or approve?
- What end-to-end slice provides real evidence of progress?

Default to a thin vertical slice when a real user outcome can be demonstrated early.

### Choose The Best Axis

Use these common slicing axes:

- `vertical-slice` for end-to-end MVP behavior
- `persona-slice` when roles have materially different goals or UX
- `path-slice` when users reach the same outcome through different interaction paths
- `risk-first` when uncertainty or technical feasibility dominates
- `rules-slice` when complex policy or validation logic is the main constraint
- `data-slice` when scope is driven by data complexity, migration, or edge cases
- `interface-slice` when delivery channels differ materially
- `release-slice` when planning increments across a journey
- `spike` when the team lacks enough information to slice responsibly

Combine axes only when one axis alone would produce misleading or oversized slices.

## Workflow

### 1. Diagnose The Work Shape

Identify:

- The primary user or system outcome
- Whether the work is user-centric or system-centric
- Where complexity actually lives: path, persona, rules, data, architecture, or uncertainty
- Which cross-cutting concerns must be preserved explicitly

### 2. Propose The Slicing Strategy

State the recommended axis and why it fits.

If multiple valid strategies exist, present the top 2 and explain the tradeoff between them.

### 3. Generate Candidate Slices

Produce 3-7 slices when feasible.

For each slice, include:

- `slice_name`
- `slice_type` -> story, requirement, or spike
- `why_it_exists`
- `what_is_included`
- `what_is_deferred`
- `key_risk_or_dependency`

### 4. Check For Failure Modes

Reject or revise the slice plan if it produces:

- horizontal layer-only work with no demonstrable value
- micro-stories too small to matter
- hidden cross-cutting concerns
- duplicate implementation across personas or paths
- spikes with no decision or follow-up outcome

### 5. Prepare For Handoff

Recommend which follow-on skill should draft each slice:

- `sce-user-story-writer`
- `sce-technical-requirement-writer`
- `user-story-mapping`
- `prioritization-methods`

## Output Contract

Return a concise slice plan in this structure unless the caller asks for another format:

```yaml
slice_plan:
  primary_axis: vertical-slice|persona-slice|path-slice|risk-first|rules-slice|data-slice|interface-slice|release-slice|spike
  secondary_axis: none|persona-slice|path-slice|risk-first|rules-slice|data-slice|interface-slice|release-slice
  rationale: "Why this approach fits the work"
  candidate_slices:
    - slice_name: "string"
      slice_type: story|requirement|spike
      why_it_exists: "string"
      included: ["item"]
      deferred: ["item"]
      key_risk_or_dependency: "string"
  cross_cutting_concerns:
    - "security"
    - "performance"
  anti_patterns_avoided:
    - "story bloat"
  recommended_next_step:
    - "Draft user-centric slices with sce-user-story-writer"
```

## Quality Bar

Before finalizing, verify:

- The slices preserve meaningful value or learning
- The plan exposes uncertainty rather than hiding it
- The slices are small enough to estimate and discuss coherently
- The selected axis matches where the real complexity lives
- Deferred work is recorded rather than silently dropped

## Example Use Cases

- `Split this feature request into backlog-ready slices.`
- `Choose the right slicing strategy for this mixed workflow.`
- `This epic is too large. Recommend stories, requirements, and spikes.`