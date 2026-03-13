---
name: sce-octane-story-test-impact-analyzer
description: "Transforms Octane-extracted user stories (Excel export) into repo change-impact predictions against the current branch, regression-test impact, and additional test recommendations. Produces JSON-first output with an optional Markdown companion."
metadata:
  version: 1.0.0
  author: Agent Skills Team
  category: testing
  tags:
    - octane
    - impact-analysis
    - regression
    - test-strategy
  tools: ['Read', 'Search', 'Grep']
---

# SCE Octane Story Test Impact Analyzer

## Overview

Given an Octane Excel export (user stories) and a repository codebase, this skill produces a deterministic impact analysis:
- What parts of the repo are *likely* to change (predicted from story text/tags)
- Which existing tests are *likely* affected
- What regression scope to run
- What additional tests to add (unit/integration/e2e and relevant NFR tests)

This skill is read-only: it analyzes and recommends.

## When to Use

- Input is an Octane export in `.xlsx`.
- You need a story-driven test impact assessment before implementation.
- You want to generate a test strategy/regression plan seed for the Test Strategy Planner.

## Unitary Function

**ONE RESPONSIBILITY:** Convert Octane user stories into (predicted) repo change impact + regression impact + additional test recommendations.

**NOT RESPONSIBLE FOR:**
- Running tests (see Quality Assurance Agent)
- Writing implementation code
- Creating CI workflows (see DevOps Workflow Agent)
- Security scanning (see security skills)

## Inputs

JSON input contract (provided by the calling agent):

```json
{
  "octane": {
    "excel_path": "path/to/octane-export.xlsx",
    "sheet": "optional",
    "column_mapping": {
      "story_id": "story id",
      "title": "title",
      "description": "description",
      "acceptance_criteria": "acceptance criteria",
      "component_tags": "component tags",
      "priority": "priority",
      "status": "status"
    }
  },
  "repo": {
    "root": ".",
    "branch_assumption": "analyze current checked-out branch",
    "include_paths": [],
    "exclude_paths": [".git", "node_modules", "dist", "build", ".venv"]
  },
  "tests": {
    "autodiscover": true,
    "known_suites": {
      "smoke": [],
      "regression": []
    }
  },
  "output": {
    "json_required": true,
    "markdown_companion": true
  }
}
```

Notes:
- `column_mapping` is optional if the headers match; callers should autodetect and only ask questions if ambiguous.
- Acceptance criteria may be multi-line text; split into a list by newline/semicolon/bullets.

## Method (Deterministic Steps)

1. **Normalize stories**
   - Create canonical story objects:
     - `id`, `title`, `description`, `acceptance_criteria[]`, `component_tags[]`, `priority`, `status`
   - If any required field is missing → add to `needs_clarification`.

2. **Derive story keywords & signals**
   - Extract keywords from title/description/AC/component tags.
   - Detect risk drivers from content (examples):
     - AuthN/AuthZ, permissions, roles, JWT/SSO
     - Data model / schema / migration language
     - External integration terms (queues, APIs, SFTP, third parties)
     - Error handling, retry, idempotency
     - Performance/throughput/latency terms

3. **Repo impact mapping (predicted)**
   - Use search to map keywords/tags to likely impacted code areas:
     - candidate modules/paths
     - candidate API endpoints/routes
     - candidate data models/tables
     - candidate configs/secrets/env vars
   - Output an impact map with reasons (keyword evidence).

4. **Autodiscover tests**
   - Identify test directories and patterns:
     - Python: `tests/`, `test_*.py`
     - JS/TS: `__tests__/`, `*.spec.ts`, `*.test.ts`
     - E2E: `playwright/`, `cypress/`, `e2e/`
   - Create a test inventory with file-path hints and inferred layer.

5. **Regression impact assessment**
   - For each story, combine risk drivers + impact map to recommend:
     - smoke only
     - targeted regression (component-specific)
     - full regression
   - Highlight “must-run” areas when risk drivers include auth/data model/integrations.

6. **Additional test recommendations**
   - For each impacted area, recommend missing tests by layer:
     - Unit: pure logic, validation, edge cases
     - Integration: API contracts, DB interactions, integration points
     - E2E: critical user flows aligned to acceptance criteria
     - Non-functional: performance, security, resiliency (only when story signals demand it)

## Outputs

### Primary Output (JSON-first)

```json
{
  "analysis_id": "OCTANE-IMPACT-uuid",
  "timestamp": "ISO-8601",
  "inputs": {
    "octane_extract_type": "xlsx",
    "branch_assumption": "current checked-out branch",
    "assumptions": [],
    "open_questions": []
  },
  "stories": [
    {
      "id": "US-1234",
      "title": "string",
      "acceptance_criteria": ["..."],
      "component_tags": ["..."],
      "priority": "string",
      "status": "string",
      "risk_drivers": ["auth", "data", "integration"],
      "needs_clarification": []
    }
  ],
  "predicted_change_impact": {
    "likely_modules": [{"path_hint": "string", "reason": "keyword/tag match"}],
    "api_surfaces": ["..."],
    "data_models_or_tables": ["..."],
    "configs_or_secrets": ["..."],
    "external_integrations": ["..."]
  },
  "test_inventory": {
    "unit": ["..."],
    "integration": ["..."],
    "e2e": ["..."],
    "unknown": ["..."]
  },
  "regression_impact": {
    "recommended_scope": "smoke|targeted_regression|full_regression",
    "recommended_runs": ["unit", "integration", "e2e_smoke"],
    "existing_tests_likely_affected": [{"test_path_hint": "string", "reason": "..."}],
    "risk_summary": ["..."]
  },
  "additional_test_recommendations": {
    "unit": ["..."],
    "integration": ["..."],
    "e2e": ["..."],
    "nonfunctional": ["..."]
  },
  "handoff_context": {
    "functional_requirements": ["..."],
    "acceptance_criteria": ["..."],
    "architecture_summary": {
      "modules": [],
      "api_endpoints": [],
      "database_tables": []
    }
  },
  "confidence": {
    "method": "token_logprob",
    "logprobs_available": false,
    "status": "needs_review"
  }
}
```

### Markdown Companion (Optional)

If requested, emit a human-readable Markdown summary that mirrors the JSON sections.

## Safety Rules

- Never claim an actual code diff; this is predicted impact from story text/tags.
- Prefer asking a clarifying question over inventing missing story fields.
- Keep recommendations consistent with testing standards in `docs/standards/TECH_STACK_STANDARDS.md`.
