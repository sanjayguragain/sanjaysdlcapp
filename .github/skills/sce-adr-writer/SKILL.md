---
name: sce-adr-writer
description: 'Drafts standardized Architecture Decision Record work packages whenever a material architecture decision is made or formalized. Use when the user, agent, or workflow needs to document a technology selection, integration pattern, standards deviation, deployment model, security boundary, platform choice, architectural characteristic, or other architecture-level decision in a consistent ADR format with indexed IDs.'
argument-hint: 'Provide the decision title, ADR index number, decision context, options considered, chosen option, rationale, consequences, key risks, and links to related artifacts.'
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
  - adr
  - decision-record
  - governance
  - standards
  - traceability
---

# SCE ADR Writer

Create a consistent ADR work package every time a material architecture decision is made so that rationale, alternatives, consequences, governance state, and follow-up actions are preserved in one standard form.

## Required Assets

Always load and follow these files before drafting output:

- `templates/ADR/ADR-{adr-id}-{decision-name-kebab-case}.md`
- `templates/ADR/README.md`

Those files are the canonical formatting and naming contract for ADR work in this repo. If they are updated later, follow the updated template rather than inventing a new structure.

## When To Use

Use this skill whenever a workflow introduces, approves, formalizes, or significantly revises a material architecture decision, including:

- technology stack selections
- platform or hosting decisions
- integration pattern decisions
- security boundary or identity architecture decisions
- data architecture or persistence model decisions
- resiliency, deployment, or operations architecture decisions
- standards deviations or exception-based architecture approvals
- architecture constraints, guardrails, or architectural characteristics that materially shape implementation

Treat these terms as valid triggers for the same outcome:

- `Architecture Decision Record`
- `ADR`
- `decision record`
- `architecture decision`
- `design decision`
- `technical decision`
- `architecture exception`
- `standards deviation`

Do not use this skill when:

- the work is only brainstorming and no actual decision has been made or proposed
- the output should be a PRD, BRD, AVD, ARA, or implementation backlog item instead of a decision record
- the caller only needs a short summary table with no need for a durable decision package

## Required Outcome

Produce one standardized ADR package that includes:

1. An indexed ADR ID such as `ADR-012`
2. A file name that uses the same index number, such as `ADR-012-use-event-driven-integration.md`
3. The full ADR body using the canonical template
4. Alternatives considered, chosen option, rationale, consequences, risks, and approvals
5. Open questions and references to related artifacts

When the ADR is justifying a technology that is not part of the approved stack in `docs/standards/TECH_STACK_STANDARDS.md`, the related artifacts must include:

- the governing `ABB` for the abstract technology need
- the `SBB` for the proposed non-standard technology
- the `SBB` artifacts for serious alternatives considered, including approved standard alternatives that were not selected

If the prompt is missing critical information, write the strongest draft you can without inventing facts and carry the gaps into `Open Questions / Issues Log`.

## Workflow

### 1. Confirm this is a material architecture decision

Use this skill only when the decision materially affects architecture, such as system structure, technology selection, quality attributes, integration strategy, security posture, deployment model, or standards compliance.

If the input is merely an implementation preference with no architectural significance, say so and recommend a lighter-weight note or issue instead.

### 2. Extract the minimum decision inputs

Capture these inputs if available:

- decision title
- ADR index number or known naming convention
- decision owner and authors
- problem or opportunity being addressed
- in-scope and out-of-scope boundaries
- assumptions and dependencies
- options considered
- chosen option
- rationale and evidence
- risks, tradeoffs, and consequences
- related PRD, AVD, ARA, standards, diagrams, or tickets
- related `ABB` and `SBB` artifacts when the decision is a standards deviation for non-approved technology

### 3. Normalize weak inputs

- Rewrite vague decision statements into one explicit architectural decision
- Separate option descriptions from rationale and consequences
- Make tradeoffs explicit instead of implied
- Preserve uncertainty as `TBD` or `Open Questions` rather than inventing facts
- If the caller has not assigned an ADR index, require one from the caller or use a clearly marked placeholder such as `ADR-TBD`
- If the decision is a non-standard technology selection, require or request the supporting `ABB` plus candidate `SBB` package before finalizing the ADR

### 4. Enforce indexed naming

The file name and the ADR record inside the document must use the same index number.

Required pattern:

- File name: `ADR-{adr-id}-{decision-name-kebab-case}.md`
- Document field: `ADR ID: ADR-###`

Do not produce an unnumbered ADR.

### 5. Render using the canonical template

Follow the exact section order and headings from `templates/ADR/ADR-{adr-id}-{decision-name-kebab-case}.md`.

If a field in the template cannot be completed from the prompt, write `TBD` and carry the unresolved item into `Open Questions / Issues Log`.

### 6. Prepare the work package for downstream governance

Ensure the final ADR can be consumed by:

- architecture review boards
- solution and application architects
- implementation teams
- audit and compliance reviewers

If a standards deviation is involved, make sure that deviation, waiver, or approval path is explicit.

If the standards deviation is selecting a non-approved technology, make the ADR the authoritative place where the selection argument is made and explicitly reference the governing `ABB` and all candidate `SBB` profiles.

## Writing Rules

### ADR Identity

- Use `ADR-###` unless the caller provides a different approved convention
- Keep the file name index and document `ADR ID` aligned
- Do not reuse an ADR index for a different decision

### Decision Statement

- State the chosen option unambiguously
- Define what is in scope and what is explicitly excluded
- Prefer concrete architecture language over vague aspiration statements

### Options And Rationale

- Include at least the chosen option and at least one meaningful alternative when feasible
- Make tradeoffs explicit
- Ground rationale in drivers, constraints, evidence, or standards
- For non-standard technology selection, the options should map directly to the documented candidate `SBB` profiles

### Consequences And Risks

- Include both positive and negative consequences
- Document blast radius, technical debt, and rollback implications when relevant
- Record risks with mitigation and contingency, not just risk labels

## Quality Bar

Before finalizing, verify all of the following:

- The decision is material enough to justify an ADR
- The ADR ID is indexed and matches the file name
- Options considered are documented clearly
- The chosen option is explicit
- Rationale ties back to drivers, constraints, or evidence
- Consequences, risks, and approvals are visible
- Unknowns are labeled instead of invented
- The output follows the ADR template exactly
- Standards-deviation ADRs for non-approved technology reference the required `ABB` and candidate `SBB` artifacts

## Output Contract

Return only the completed ADR package in the structure defined by `templates/ADR/ADR-{adr-id}-{decision-name-kebab-case}.md`, unless the caller explicitly asks for commentary.

When used from decision-making agents, this skill should be invoked every time a material architecture decision is made, not only when someone explicitly asks for an ADR.

## Example Use Cases

- `Document the decision to use FastAPI instead of NestJS as ADR-014.`
- `Create an ADR for the standards deviation that allows Java for this legacy integration.`
- `Write the architectural decision record for adopting event-driven integration between OMS and GIS.`