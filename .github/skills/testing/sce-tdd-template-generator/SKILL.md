---
name: sce-tdd-template-generator
description: "Generates failing test templates from requirements, user stories, or feature descriptions following Test-Driven Development (TDD) methodology. Produces language-specific test scaffolds (Python/pytest, TypeScript/Vitest, etc.) with proper naming conventions, Arrange-Act-Assert structure, and placeholder implementations. Supports unit, integration, and E2E/BDD test types with configurable test pyramid ratios."
metadata:
  version: 1.0.0
  author: Agent Skills Team
  category: testing
  tags:
    - tdd
    - test-templates
    - failing-tests
    - red-green-refactor
    - test-scaffolding
  tools: ['Read', 'Search', 'Write']
---

# SCE TDD Template Generator

## Overview

Given requirements, user stories, or feature descriptions, this skill generates **failing test templates** that follow TDD's Red-Green-Refactor cycle. Templates are language-specific, follow established naming conventions, and include structured placeholders for implementation.

This skill is generative: it interprets requirement semantics to produce test scaffolds. All generated tests are intentionally failing (Red phase) — implementation agents complete the Green phase.

## When to Use

- Before implementing any feature (TDD: tests first)
- When a Test Strategy Planner needs to generate concrete test files
- When language-specific developers receive requirements and need test scaffolds
- When an implementation coordinator needs to seed test infrastructure for a project

## When NOT to Use

- Tests already exist and need modification (use the agent directly)
- Exploratory or ad-hoc testing (no structured requirements to drive from)
- Test execution or validation (this skill generates templates only)

## Inputs

```json
{
  "requirements": [
    {
      "id": "FR-001",
      "text": "Requirement or user story text",
      "type": "functional|non-functional|security|constraint",
      "priority": "critical|high|medium|low",
      "acceptance_criteria": ["AC1", "AC2"]
    }
  ],
  "language": "python|typescript",
  "test_types": ["unit", "integration", "e2e"],
  "framework_config": {
    "test_framework": "pytest|vitest|jest",
    "ui_framework": "react|vue|angular|none",
    "api_framework": "fastapi|flask|django|express|nestjs|none"
  },
  "pyramid_ratios": {
    "unit": 70,
    "integration": 20,
    "e2e": 10
  },
  "output_path": "tests/"
}
```

### Input Defaults

| Field | Default | Notes |
|-------|---------|-------|
| `language` | Inferred from project | Scan for `pyproject.toml`, `package.json`, etc. |
| `framework_config.test_framework` | `pytest` (Python), `vitest` (TypeScript) | Based on language. Must be compatible: Python supports `pytest`; TypeScript supports `vitest` or `jest`. Invalid combinations (e.g., `python` + `jest`) will return an error. |
| `pyramid_ratios` | `{unit: 70, integration: 20, e2e: 10}` | Standard test pyramid |
| `test_types` | `["unit", "integration"]` | E2E only when explicitly requested |

## Method

### Step 1: Requirement Analysis

For each requirement, decompose into testable scenarios:

1. **Happy path** — Primary success scenario
2. **Invalid input** — Malformed or missing data
3. **Edge cases** — Boundary values, empty collections, max limits
4. **Error handling** — Expected failure modes
5. **Security** (if applicable) — Authorization, injection, validation

Map each scenario to a test type based on pyramid ratios:
- Pure logic, transformations, calculations → **Unit**
- API endpoints, database operations, service interactions → **Integration**
- User flows, critical business paths → **E2E**

### Step 2: Test Naming Convention

Apply consistent naming:

**Python (pytest):**
```
test_{feature}_{scenario}_{expected_result}
```
Examples:
- `test_user_authentication_valid_credentials_returns_token`
- `test_user_authentication_invalid_password_raises_401`
- `test_order_creation_empty_cart_raises_validation_error`

**TypeScript (Vitest/Jest):**
```
describe('{Feature}', () => {
  it('should {expected_result} when {scenario}', () => { ... })
})
```
Examples:
- `it('should return a token when credentials are valid')`
- `it('should throw 401 when password is invalid')`

### Step 3: Template Generation

Generate failing test templates per language:

**Python Unit Test Template:**
```python
# test_{module_name}.py (FAILING - Implementation Needed)
import pytest

class Test{Feature}:
    """Tests for {feature_description}"""

    def test_{feature}_happy_path(self):
        """
        Requirement: {req_id}
        Scenario: {scenario_description}
        """
        # Arrange
        # TODO: Set up test data

        # Act
        # TODO: Call the function/method under test

        # Assert
        assert False, "IMPLEMENT: Verify expected outcome"

    def test_{feature}_invalid_input(self):
        """
        Requirement: {req_id}
        Scenario: {invalid_scenario}
        """
        # Arrange
        # TODO: Set up invalid input data

        # Act & Assert
        with pytest.raises(ValueError):
            pass  # IMPLEMENT: Call with invalid input
```

**Python Integration Test Template:**
```python
# test_{module_name}_integration.py (FAILING - Implementation Needed)
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
class Test{Feature}API:
    """Integration tests for {feature_description}"""

    async def test_create_{resource}_success(self, client: AsyncClient):
        """
        Requirement: {req_id}
        Scenario: Successful creation via API
        """
        # Arrange
        payload = {}  # TODO: Define valid payload

        # Act
        response = await client.post("/{resource}", json=payload)

        # Assert
        assert response.status_code == 201
        assert False, "IMPLEMENT: Verify response body"

    async def test_create_{resource}_unauthorized(self, client: AsyncClient):
        """
        Requirement: {req_id}
        Scenario: Unauthorized access attempt
        """
        # Act (no auth header)
        response = await client.post("/{resource}", json={})

        # Assert
        assert response.status_code == 401
```

**TypeScript Unit Test Template:**
```typescript
// {module_name}.test.ts (FAILING - Implementation Needed)
import { describe, it, expect } from 'vitest';

describe('{Feature}', () => {
  describe('happy path', () => {
    it('should {expected_result} when {scenario}', () => {
      // Arrange
      // TODO: Set up test data

      // Act
      // TODO: Call the function under test

      // Assert
      expect(true).toBe(false); // IMPLEMENT: Replace with real assertion
    });
  });

  describe('error handling', () => {
    it('should throw when {error_scenario}', () => {
      // Arrange
      // TODO: Set up error conditions

      // Act & Assert
      expect(() => {
        // TODO: Call with invalid input
      }).toThrow();
    });
  });
});
```

**TypeScript React Component Test Template:**
```typescript
// {Component}.test.tsx (FAILING - Implementation Needed)
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('{Component}', () => {
  it('should render {expected_element}', () => {
    // Arrange
    render(<{Component} />);

    // Assert
    expect(screen.getByRole('{role}')).toBeInTheDocument();
  });

  it('should {action_result} when user {user_action}', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<{Component} />);

    // Act
    await user.click(screen.getByRole('button', { name: '{button_name}' }));

    // Assert
    expect(true).toBe(false); // IMPLEMENT: Replace with real assertion
  });
});
```

**BDD E2E Test Template:**
```
Feature: {feature_name}
  As a {role}
  I want to {action}
  So that {benefit}

  Scenario: {scenario_name}
    Given {precondition}
    When {action}
    Then {expected_result}
```

### Step 4: Test Infrastructure Setup

Generate required configuration files if not present:

**Python:**
```toml
# pyproject.toml (test section)
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
```

**TypeScript:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom', // or 'node' for API tests
  },
});
```

### Step 5: Coverage Target Mapping

Map pyramid ratios to coverage targets:

| Test Type | Ratio | Coverage Target | Max Execution |
|-----------|-------|-----------------|---------------|
| Unit | 70% | 85% line coverage | < 5 min |
| Integration | 20% | 70% endpoint coverage | < 15 min |
| E2E | 10% | All critical paths | < 30 min |

## Output

```json
{
  "generated_by": {
    "skill": "sce-tdd-template-generator",
    "version": "1.0.0"
  },
  "summary": {
    "total_requirements": 0,
    "total_tests_generated": 0,
    "by_type": {
      "unit": 0,
      "integration": 0,
      "e2e": 0
    },
    "by_priority": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0
    }
  },
  "test_files": [
    {
      "path": "tests/test_{module}.py",
      "test_type": "unit",
      "language": "python",
      "tests": [
        {
          "name": "test_{feature}_{scenario}_{expected}",
          "requirement_id": "FR-001",
          "scenario": "Description",
          "status": "failing"
        }
      ]
    }
  ],
  "infrastructure": {
    "config_files_generated": [],
    "dependencies_required": []
  },
  "traceability": [
    {
      "requirement_id": "FR-001",
      "test_names": ["test_name_1", "test_name_2"],
      "coverage_type": ["unit", "integration"]
    }
  ]
}
```

## Quality Safeguards

1. **Every requirement MUST produce at least one test** — If a requirement has no testable aspect, flag it as `needs_review`
2. **All generated tests MUST fail** — Templates use explicit failing assertions or failure calls (Python) and `expect(true).toBe(false)` (TypeScript) as explicit failure markers
3. **Naming consistency** — All test names follow the language-specific convention defined in Step 2
4. **Requirement traceability** — Every test docstring/comment references its source requirement ID
5. **No implementation logic** — The skill generates scaffolds only; actual implementation is the consuming agent's responsibility

## Error Handling

- **No requirements provided** → Return error: "No requirements to generate tests from. Provide at least one requirement."
- **Unsupported language** → Return error with list of supported languages. Do not attempt generation.
- **Requirements without acceptance criteria** → Generate tests from requirement text; flag as `needs_review` with note "No acceptance criteria — tests derived from requirement text only"
- **Conflicting pyramid ratios** → Normalize to percentages summing to 100%. Warn if original ratios were inconsistent.

## Standards Compliance

### Artifact Output Standard
All deliverable outputs MUST have a canonical JSON representation. Test files are code artifacts referenced by path in the JSON output.

### Confidence Standard
Do NOT output heuristic confidence labels. If logprobs are unavailable, set `logprobs_available: false` and mark result as `needs_review`.

### Standards References
- `docs/standards/CONTEXT_PASSING_STANDARDS.md`
- `docs/standards/TECH_STACK_STANDARDS.md`
- `docs/standards/tech-policy-matrix.yaml`
- `docs/standards/APPROVAL_REQUEST.md`
