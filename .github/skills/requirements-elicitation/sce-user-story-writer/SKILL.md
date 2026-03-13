---
name: sce-user-story-writer
description: 'Format user stories the same way every time. Use when the user wants to draft, normalize, or rewrite a user story from rough notes, requirements, backlog ideas, stakeholder requests, BRDs, or PRDs. Produces a consistently structured output with the user story statement, Gherkin acceptance criteria, and recommended verification and validation approaches by following the editable format asset.'
argument-hint: 'Provide the work idea, user goal, stakeholder or persona, desired outcome, and any known constraints, IDs, or source material.'
metadata:
  tools:
  - Read
  - Write
  - Edit
  - Grep
  version: 1.0.0
  author: GitHub Copilot
  category: requirements-elicitation
  tags:
  - user-story
  - gherkin
  - verification
  - validation
  - backlog
---

# SCE User Story Writer

Write user stories in a repeatable structure so the output is consistent, testable, and usable by product, engineering, QA, and validation stakeholders.

## Required Asset

Always load and follow [user-story-format.md](./assets/user-story-format.md) before drafting output.

That file is the canonical formatting contract for this skill. If the user customizes the format asset later, follow the updated asset rather than inventing a new structure.

Load `./references/story-quality-rubrics.md` when checking whether a story is small, valuable, clear, and testable.

## When To Use

Use this skill when the user wants to:

- Draft a new user story from a vague idea
- Rewrite an inconsistent story into a standard format
- Convert requirements, BRD notes, PRD notes, or stakeholder comments into a user story
- Produce user story text plus Gherkin, verification, and validation guidance in one pass

Do not use this skill when:

- The requested output is technology-centric rather than user-centric
- The user needs a full PRD, BRD, or architecture document
- The work should be captured as a bug report or GitHub issue instead of a story artifact

## Required Outcome

Produce one consistently formatted story package that includes:

1. The user story statement
2. One or more Gherkin acceptance criteria scenarios
3. Exactly one recommended verification approach by default
4. Exactly one recommended validation approach by default

If the prompt is missing key information, write the strongest story you can without inventing facts and place the unresolved gaps in `Open Questions`.

## Workflow

### 1. Confirm this is actually a user story

Use a user story only when the request is user-centric and the value can be expressed in terms of a persona, capability, and benefit.

If the request is primarily system-centric, engineering-centric, operational, or tool-centric, call out that it may be better represented as a requirement. If the user still wants a user story, continue and note the mismatch in `Open Questions`.

### 2. Extract the minimum inputs

Capture these inputs if available:

- Persona or stakeholder role
- User intent or action
- Business outcome or benefit
- Preconditions or context
- Constraints or measurable boundaries
- Source references or evidence
- Known IDs or naming conventions

### 3. Normalize weak inputs

- Rewrite vague outcomes into observable value
- Remove solution bias unless it is an explicit constraint
- Keep the story user-centric rather than implementation-centric
- Convert implied success conditions into explicit Gherkin scenarios
- Recommend exactly one verification and one validation approach by default, choosing the best fit for the risk and maturity of the story unless the user explicitly asks for multiple approaches

### 4. Render using the format asset

Follow the exact section order and headings from [user-story-format.md](./assets/user-story-format.md).

If a field in the asset cannot be completed from the prompt, write `TBD` or `None provided`, whichever is more appropriate, and record the uncertainty in `Open Questions`.

If the prompt does not provide a story ID convention and the user does not ask for IDs, omit the optional story ID section rather than forcing a placeholder.

## Writing Rules

### User Story Statement

- Default to the pattern `As a <role>, I want <capability>, so that <benefit>.`
- Keep the action and benefit concrete
- Make the benefit meaningful to the persona or business outcome
- Avoid implementation details unless they are unavoidable constraints

### Gherkin Acceptance Criteria

- Provide at least one scenario
- Use `Given`, `When`, `Then`, and optional `And` lines
- Keep scenarios observable and testable
- Split materially different behaviors into separate scenarios instead of overloading one scenario
- Add as many scenario blocks as needed for materially distinct behavior; do not emit empty placeholder scenarios

### Verification Approach

Recommend exactly one of these by default:

- `Inspection`
- `Demonstration`
- `Test`
- `Analysis`
- `Model-Based Verification`
- `Automated Verification`

Provide a one-sentence activity description answering: `Did we build the system right?`

Only recommend multiple verification approaches if the user explicitly asks for more than one.

### Validation Approach

Recommend exactly one of these by default:

- `Operational Testing`
- `Simulations and Emulation`
- `Prototyping`
- `Stakeholder Review / Walkthroughs`
- `Field Trials / Pilots`
- `Human-in-the-Loop Testing`

Provide a one-sentence activity description answering: `Did we build the right system?`

Only recommend multiple validation approaches if the user explicitly asks for more than one.

## Quality Bar

Before finalizing, verify all of the following:

- The story is user-centric
- The story states a clear benefit
- The story satisfies the core INVEST qualities as closely as the available input allows
- The story is small enough to implement and validate coherently
- The acceptance criteria are testable
- Exactly one verification approach is selected by default
- Exactly one validation approach is selected by default
- The verification approach checks build correctness
- The validation approach checks user or stakeholder fit
- The output follows the asset format exactly
- Missing facts are labeled instead of invented

Use `./references/story-quality-rubrics.md` when the story quality is questionable or when you need to tighten a vague story.

## Output Contract

Return only the completed story package in the structure defined by [user-story-format.md](./assets/user-story-format.md), unless the caller explicitly asks for commentary.

## Example Use Cases

- `Turn this rough backlog note into a user story with Gherkin and V&V guidance.`
- `Rewrite this story so it follows our standard format every time.`
- `Create a user story from this BRD paragraph and recommend verification and validation approaches.`