---
name: sce-prd-generator
description: Generates a full Product Requirements Document (PRD) in Markdown following PRD Template 4 conventions. This skill has no agency; it takes structured inputs and produces PRD content with TBDs where information is missing.
compatibility:
- all
metadata:
  version: 1.0.0
  author: Agent Skills Team
  tags:
  - product-management
  - requirements-engineering
  - documentation
  - prd
  tools:
  - Read
  - Write
  - Edit
---

# Skill: SCE PRD Generator

## Overview

Generates PRD content in Markdown aligned to PRD Template 4 (section headings, requirement numbering, traceability matrix, and open questions discipline). This skill does not ask questions; it expects inputs to already be gathered.

## When to Use

- After an agent (or human) has gathered product context and requirements inputs
- When you want deterministic PRD structure and numbering
- When updating an existing PRD by filling previously TBD fields

## Unitary Function

**ONE RESPONSIBILITY:** Produce PRD Markdown content that conforms to Template 4 formatting and conventions.

**NOT RESPONSIBLE FOR:**

- Asking clarifying questions (agent responsibility)
- Approving requirements or making product decisions
- Validating feasibility, cost, or delivery dates

## Inputs

```json
{
  "product_name": "string (required)",
  "author": "string (optional)",
  "doc_version": "string (optional; default: 0.1)",
  "doc_status": "string (optional; e.g., Draft)",
  "source_references": ["string (optional; e.g., DocName – heading/page)"] ,
  "answers": {
    "any": "object (recommended; structured answers to the clarifying questions)"
  },
  "existing_prd_markdown": "string (optional; used for iterative updates)",
  "tbd_policy": "string (optional; default: write TBD and log open question)"
}
```

## Outputs

```json
{
  "prd_markdown": "string",
  "open_questions": [
    {
      "id": "Q-01",
      "question": "string",
      "owner": "string or TBD",
      "needed_by": "string or TBD",
      "status": "OPEN | ANSWERED | PENDING"
    }
  ],
  "tbd_locations": ["string"]
}
```

## Decision Logic

- If a required fact is missing: write `TBD` and emit a corresponding Open Questions item.
- Do not invent baselines, targets, owners, systems of record, dates, or compliance claims.
- Include a Traceability Matrix that maps Objectives → Scenarios → Requirements (use TBD where necessary).
- Use Gherkin acceptance criteria only for the most critical scenarios.

## Resources

- Canonical PRD Template 4 (with section instructions): `templates/PRD/PRD-{product-name-kebab-case}.md`
- Optional lightweight skeleton (headings only): `.github/skills/sce-prd-generator/resources/prd_template_4_skeleton.md`
- Scaffold script (optional): `.github/skills/sce-prd-generator/scripts/prd_scaffold.py`

## Usage Example

```bash
python .github/skills/sce-prd-generator/scripts/prd_scaffold.py \
  --product-name "Field Service Mobile App" \
  --author "Jane Doe" \
  --status "Draft"
```

## Safety Rules

1. Do not fabricate facts.
2. Mark unknowns as `TBD`.
3. Every `TBD` must have an Open Questions entry.
4. Keep tone executive-appropriate and concise.
