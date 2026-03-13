# PRD Template (Template 4)

This folder contains the canonical Product Requirements Document (PRD) template used by **2 - Idea & Demand - Product PRD Builder**.

## What this is

- [PRD-{product-name-kebab-case}.md](PRD-%7Bproduct-name-kebab-case%7D.md) is **PRD Template 4**.
- It includes **section-by-section instructions** (clearly marked as "DO NOT OUTPUT") plus an output template.

## How it is used

- **2 - Idea & Demand - Product PRD Builder** reads this template to follow the required structure and conventions.
- When generating a PRD, the agent outputs **only the filled PRD content**.
  - It must not include any instructional blocks.

## Conventions enforced by the template

- Use `TBD` for unknowns; every `TBD` should be tracked in **Open Questions / Issues Log**.
- Use requirement IDs:
  - `FR-###` Functional Requirements
  - `NFR-###` Non-Functional Requirements
  - `SEC-###` Security/Compliance Requirements
  - `DG-###` Data Governance rules
- Include a **Traceability Matrix** mapping Objectives → Scenarios → Requirements.

## Outputs

Generated PRDs are stored in:

- `docs/PRD/PRD-{product-name-kebab-case}.md`
