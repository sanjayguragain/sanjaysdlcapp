---
name: sce-technical-requirement-writer
description: 'Format technology-centric requirements and standards the same way every time. Use when the user wants to draft, normalize, or rewrite engineering requirements, system requirements, integration requirements, operational requirements, platform standards, security constraints, or architecture standards from rough notes, requirements, BRDs, PRDs, or architecture documents. Produces a consistently structured output with the requirement statement, BRD traceability, quality-attribute classification, scenario reporting fields, applicable standards or constraints, and recommended verification and validation approaches by following the editable format asset.'
argument-hint: 'Provide the system or platform, required capability or constraint, measurable conditions, any relevant standards, and known IDs, dependencies, or source material.'
metadata:
  tools:
  - Read
  - Write
  - Edit
  - Grep
  version: 1.1.0
  author: GitHub Copilot
  category: requirements-elicitation
  tags:
  - requirement
  - standards
  - verification
  - validation
  - engineering
---

# SCE Technical Requirement Writer

Write technology-centric requirements and standards in a repeatable structure so the output is consistent, measurable, and usable by engineering, architecture, QA, and validation stakeholders.

## Required Asset

Always load and follow [technical-requirement-format.md](./assets/technical-requirement-format.md) before drafting output.

That file is the canonical formatting contract for this skill. If the user customizes the format asset later, follow the updated asset rather than inventing a new structure.

Load `./references/verification-validation-methods.md` when selecting or explaining verification and validation approaches.

## When To Use

Use this skill when the user wants to:

- Draft a new technical requirement from a vague engineering or architecture note
- Rewrite inconsistent requirements into a standard format
- Convert PRD, BRD, architecture, security, operations, or platform notes into formal requirements
- Capture standards, constraints, interfaces, controls, or non-functional expectations in a reusable structure
- Produce requirement text plus recommended verification and validation guidance in one pass

Do not use this skill when:

- The requested output is primarily user-centric and should be a user story
- The user needs a full PRD, BRD, or architecture document
- The work should be captured as a bug report or GitHub issue instead of a requirement artifact

## Required Outcome

Produce one consistently formatted requirement package that includes:

1. The requirement statement
2. BRD traceability to the governing business requirement when a BRD is in scope
3. Quality-attribute classification, category assignment, and labels
4. A scenario block using stimulus, environment, response, and response measure
5. Applicable standards, constraints, or governing references
6. Exactly one recommended verification approach by default
7. Exactly one recommended validation approach by default

If the prompt is missing key information, write the strongest requirement you can without inventing facts and place the unresolved gaps in `Open Questions`.

If the caller requires BRD traceability and no explicit governing BRD requirement is available, do not silently fabricate traceability. Surface the issue in `Open Questions` or a traceability gap note, depending on the output format requested by the caller.

## Workflow

### 1. Confirm this is actually a requirement

Use a requirement when the request is system-centric, engineering-centric, integration-centric, operational, security-centric, platform-centric, or standards-centric.

If the request is primarily about user value expressed from a persona perspective, call out that it may be better represented as a user story. If the user still wants a requirement, continue and note the mismatch in `Open Questions`.

### 2. Extract the minimum inputs

Capture these inputs if available:

- System, platform, service, or component name
- Required capability, behavior, or constraint
- Measurable condition, boundary, or success threshold
- Applicable policy, standard, or governing reference
- Interfaces, dependencies, or environmental assumptions
- Source references or evidence
- Known IDs or naming conventions
- Governing BRD requirement ID and text when working from a BRD
- Dominant quality attribute and category when the caller already determined them

### 3. Normalize weak inputs

- Rewrite vague statements into measurable expectations
- Remove stakeholder phrasing unless it belongs in a source note rather than the requirement itself
- Use `shall` only for requirements, `should` only for goals, and `will` only for facts or declarations of purpose
- Keep the statement focused on what must be true, not implementation trivia unless implementation is itself a constraint
- Recommend exactly one verification and one validation approach by default, choosing the best fit for the technical risk and operational context unless the user explicitly asks for multiple approaches
- When called from BRD-driven workflows, preserve the governing BRD requirement identifier and text
- When the caller does not supply quality classification, infer the dominant quality attribute, its category, and machine-readable labels from the requirement intent
- Create a measurable scenario block even for structural or delivery-oriented qualities

### 4. Render using the format asset

Follow the exact section order and headings from [technical-requirement-format.md](./assets/technical-requirement-format.md).

If a field in the asset cannot be completed from the prompt, write `TBD` or `None provided`, whichever is more appropriate, and record the uncertainty in `Open Questions`.

## Writing Rules

### Requirement Statement

- Default to the pattern `The <system> shall <capability or constraint> while <measurable condition or context>.`
- Use `shall` only for mandatory requirements
- Use `should` only for target-state goals or guidance
- Use `will` only for declarative facts or committed behavior
- Do not mix `shall`, `should`, and `will` within the same requirement statement
- Keep the statement system-centric rather than user-centric
- Make the condition or boundary measurable when possible
- Avoid mixing multiple unrelated obligations into one requirement

### Standards and Constraints

- List the governing standards, policies, architecture rules, or operational constraints that shape the requirement
- If no formal standard is provided, state `None provided`
- Do not fabricate regulatory or enterprise policy references

### BRD Traceability

- When the requirement is derived from a BRD workflow, include the governing `brd_requirement_id` and `brd_requirement_text`
- Use `trace_type: direct` when the technical requirement is a direct conversion of a BRD requirement
- Use `trace_type: derived_from` when the requirement is a necessary technical consequence of a BRD requirement
- Always include a short `trace_rationale`
- If no governing BRD requirement exists, call out the traceability gap rather than inventing one

### Quality Attribute Classification

- Assign one dominant `primary_attribute`
- Assign zero or more `secondary_attributes` only when the concern materially spans multiple qualities
- Assign one `quality_category`
- Include machine-readable labels using `qattr:<attribute>` and `qcat:<category>`
- Prefer the dominant architectural concern when a requirement could fit more than one bucket

Approved quality categories:

- `Operational Qualities`: Availability, Reliability, Performance, Security, Usability
- `Structural Qualities`: Modularity, Extensibility, Simplicity, Testability, Interoperability
- `Evolution Qualities`: Agility, Scalability, Adaptability, Elasticity, Deployability
- `Program / Delivery Qualities`: Feasibility

### Quality Scenario Block

Every requirement package should include:

- `Scenario`
- `Stimulus`
- `Environment`
- `Response`
- `Response Measure`

Default pattern:

- Scenario: `<quality attribute>`
- Stimulus: `<triggering event or change>`
- Environment: `<operating or delivery context>`
- Response: `<expected system or delivery behavior>`
- Response Measure: `<measurable timing, threshold, or success criterion>`

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

Use `./references/verification-validation-methods.md` when the best verification method is not obvious from the prompt.

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

Use `./references/verification-validation-methods.md` when the best validation method is not obvious from the prompt.

## Quality Bar

Before finalizing, verify all of the following:

- The requirement is system-centric or standards-centric
- The requirement statement is concrete and measurable where feasible
- The modal verb follows the strict `shall`/`should`/`will` rule
- BRD traceability is present when the caller requires it
- Quality attribute, category, and labels are present
- The scenario block is complete and measurable
- Governing standards or constraints are visible
- Exactly one verification approach is selected by default
- Exactly one validation approach is selected by default
- The verification approach checks build correctness
- The validation approach checks operational or stakeholder fit
- The output follows the asset format exactly
- Missing facts are labeled instead of invented

## Output Contract

Return only the completed requirement package in the structure defined by [technical-requirement-format.md](./assets/technical-requirement-format.md), unless the caller explicitly asks for commentary.

When invoked by `3 - Analysis - BRD Technical Requirement Generator`, treat BRD traceability, quality-attribute metadata, labels, and scenario fields as mandatory rather than optional embellishments.

## Example Use Cases

- `Turn this architecture note into a formal technical requirement with V&V guidance.`
- `Rewrite this platform standard so it follows our canonical requirement format.`
- `Create a system requirement from this BRD paragraph and recommend verification and validation approaches.`