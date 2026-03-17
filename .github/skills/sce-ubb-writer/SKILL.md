---
name: sce-ubb-writer
description: 'Drafts standardized Universal Building Block profiles for standards-deviation analysis whenever a proposed technology is not part of the approved stack in TECH_STACK_STANDARDS.md. Use when the user, agent, or workflow needs an ABB plus one or more candidate SBB profiles with clear classification, scope, dependencies, examples, selection guidance, and standards context.'
argument-hint: 'Provide the building block name, category, abstraction level, purpose, use cases, scope, inputs and outputs, dependencies, examples or variants, selection guidance, and compliance or standards context.'
metadata:
  tools:
  - Read
  - Write
  - Edit
  - Grep
  version: 1.0.0
  author: GitHub Copilot
  category: architecture
  tags:
  - architecture
  - ubb
  - abb
  - sbb
  - togaf
  - taxonomy
  - governance
---

# SCE UBB Writer

Create a consistent Universal Building Block profile every time a non-standard technology proposal needs to be normalized into an ABB plus candidate SBB set for enterprise review.

## Required Assets

Always load and follow these files before drafting output:

- `templates/UBB/UBB-{abstraction-level}-{building-block-name-kebab-case}.md`
- `templates/UBB/README.md`

Those files are the canonical formatting, naming, and output-location contract for UBB work in this repo. If they are updated later, follow the updated template rather than inventing a new structure.

## When To Use

Use this skill whenever a workflow identifies a proposed technology that is not explicitly approved in `docs/standards/TECH_STACK_STANDARDS.md` and needs to create the building-block package required for architecture review, including:

- one abstract architecture building block (`ABB`) for the underlying capability or technology class
- one `SBB` for the proposed non-standard technology
- one `SBB` for each serious alternative considered, including approved standard alternatives that were not selected
- reusable technology or application building blocks needed to support a standards-deviation ADR

Treat these terms as valid triggers for the same outcome:

- `Universal Building Block`
- `UBB`
- `Architecture Building Block`
- `ABB`
- `Solution Building Block`
- `SBB`
- `building block profile`
- `TOGAF building block`

Do not use this skill when:

- the technology is already fully covered by the approved standards and no deviation case is being made
- the output should be a full architecture document such as AVD, ARA, SAD, or TAD
- the user needs one architecture decision captured as an ADR instead of a reusable building block profile
- the request is only asking for an implementation backlog item or a vendor gap analysis

## Required Outcome

Produce one standardized UBB profile that includes:

1. The building block name and definition
2. Explicit `ABB` or `SBB` classification
3. One or more valid categories: `Business`, `Data`, `Application`, `Technology`
4. Purpose, use cases, scope, inputs and outputs, relationships, examples, selection guidance, and standards context
5. A file name that follows the canonical pattern and a recommended output location under `docs/UBB/ABB/` or `docs/UBB/SBB/`

When supporting a standards-deviation package, this skill should be called multiple times to create:

- the `ABB` for the abstract capability
- the `SBB` for the proposed non-standard technology
- one `SBB` for each candidate alternative that materially informed the decision

If the prompt is missing critical information, write the strongest draft you can without inventing facts and preserve the gaps as `TBD`.

## Workflow

### 1. Confirm the building block intent

Use this skill only when the work is actually describing a reusable building block, platform component, capability, pattern, or concrete solution component that belongs in enterprise architecture taxonomy and is part of a non-standard technology review package.

If the user is actually asking for an ADR, requirements package, or architecture design document, say so and recommend the correct workflow instead.

### 2. Extract the minimum building block inputs

Capture these inputs if available:

- building block name
- whether the technology is proposed, selected, or rejected
- whether it is part of a standards-deviation package
- category or categories
- abstraction level (`ABB` or `SBB`)
- definition
- primary purpose
- typical use cases
- in-scope and out-of-scope boundaries
- inputs and outputs
- dependencies and relationships
- examples and variants
- selection guidance and tradeoffs
- standards, policies, or compliance implications
- related ABB or SBB artifacts in the same comparison set

### 3. Normalize weak inputs

- If the input is only a product or technology name, infer that the classification is incomplete and ask for or recommend the missing category and abstraction level.
- If the caller does not specify `ABB` or `SBB`, recommend the best fit and explain why.
- If the caller is documenting a non-standard technology selection, require the broader package context: the governing ABB plus the candidate SBB set.
- If multiple categories apply, preserve that multi-category classification rather than forcing a false single-category label.
- Separate definition, use cases, dependencies, and tradeoffs rather than blending them together.
- Preserve uncertainty as `TBD` rather than inventing facts.

### 4. Enforce naming and output location

Required pattern:

- File name: `UBB-{abstraction-level}-{building-block-name-kebab-case}.md`

Default output locations:

- `docs/UBB/ABB/` for `ABB`
- `docs/UBB/SBB/` for `SBB`

If the caller supplies a different approved location, use it. Otherwise recommend the default path that matches the abstraction level.

### 5. Render using the canonical template

Follow the exact section order and headings from `templates/UBB/UBB-{abstraction-level}-{building-block-name-kebab-case}.md`.

If a field in the template cannot be completed from the prompt, write `TBD` instead of omitting it.

### 6. Prepare the profile for downstream architecture use

Ensure the final UBB can be consumed by:

- enterprise architects
- solution architects
- application architects
- standards and governance reviewers
- delivery teams choosing between reusable patterns or platforms

## Writing Rules

### Classification

- Always declare `ABB` or `SBB`
- Always declare one or more valid categories
- Do not leave the building block unclassified

### Definition And Scope

- Define the building block clearly in one crisp statement
- Make the scope and out-of-scope boundaries explicit
- Avoid describing an entire architecture when the work is only one building block profile

### Selection Guidance

- Include when to use and when to avoid the building block
- Make tradeoffs explicit
- If this is an `SBB`, identify whether it is one possible implementation of a broader `ABB`
- For standards-deviation packages, make clear whether this `SBB` is the proposed non-standard selection, an approved standard alternative, or another rejected candidate

### Standards And Compliance

- Include relevant standards, protocols, and governance considerations
- If no concrete standards are known, mark the section `TBD`

## Quality Bar

Before finalizing, verify all of the following:

- The profile clearly represents a reusable building block rather than a general document
- The abstraction level is explicit
- The category classification is explicit
- Purpose and use cases are visible
- Scope and boundaries are visible
- Inputs, outputs, and dependencies are visible
- Selection guidance includes tradeoffs
- Standards or compliance implications are included or marked `TBD`
- The output follows the UBB template exactly

## Output Contract

Return only the completed UBB profile in the structure defined by `templates/UBB/UBB-{abstraction-level}-{building-block-name-kebab-case}.md`, unless the caller explicitly asks for commentary.

When used from a design-oriented workflow, this skill should be invoked only when a non-approved technology needs a durable ABB plus SBB comparison package before ADR justification.

## Example Use Cases

- `Document the abstract web frontend framework capability as an ABB because a non-standard frontend technology is being proposed.`
- `Create an SBB profile for SvelteKit as the proposed non-standard frontend technology.`
- `Create SBB profiles for React 18 and Vue 3 as approved alternatives considered in the same standards-deviation package.`