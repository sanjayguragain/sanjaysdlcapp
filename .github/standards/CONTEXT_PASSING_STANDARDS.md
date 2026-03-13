# Context Passing Standards for Sub-Agent Communication

**Version:** 1.0  
**Date:** January 16, 2026  
**Purpose:** Standardized format for passing context between orchestrator and sub-agents

## Overview

All sub-agents receive and return context in standardized JSON format to ensure consistency, traceability, and audit compliance. This document defines the schema for context passing.

## Core Context Schema

Every sub-agent invocation receives this base context structure:

```json
{
  "task_id": "uuid-v4",
  "parent_agent": "agent-name",
  "invocation_timestamp": "ISO-8601 datetime",
  "project_context": { ... },
  "task_specific_context": { ... },
  "previous_decisions": [ ... ],
  "artifacts_available": [ ... ],
  "output_requirements": { ... }
}
```

---

## 1. Task Identification

```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_agent": "5 - Test & Build - Application Builder",
  "invocation_timestamp": "2026-01-16T14:32:00Z",
  "invoked_by_user": "john.doe@company.com",
  "session_id": "session-uuid"
}
```

**Fields:**

- `task_id`: Unique identifier for this task (UUID v4)
- `parent_agent`: Name of the agent invoking the sub-agent
- `invocation_timestamp`: When task was initiated (ISO-8601 format)
- `invoked_by_user`: Email/username of human who initiated workflow
- `session_id`: Chat session identifier for tracking conversation

---

## 2. Project Context (Shared by All Sub-Agents)

```json
{
  "project_context": {
    "project_name": "field-service-mobile-app",
    "project_id": "PRJ-2026-001",
    "prd_path": "/docs/PRD/PRD-field-service-mobile-app.md",
    "repository_path": "/",
    "created_date": "2026-01-15",
    "owner": "operations-team",
    "functional_requirements": [
      {"id": "FR-001", "description": "User authentication with JWT", "priority": "critical"},
      {"id": "FR-002", "description": "View assigned work orders", "priority": "high"}
    ],
    "non_functional_requirements": [
      {"id": "NFR-001", "description": "API response time <1s", "priority": "high"},
      {"id": "NFR-002", "description": "Support offline mode", "priority": "critical"}
    ],
    "security_requirements": [
      {"id": "SEC-001", "description": "RBAC authorization", "priority": "critical"},
      {"id": "SEC-002", "description": "Encrypt sensitive data at rest", "priority": "critical"}
    ],
    "user_personas": [
      {"name": "Field Technician", "role": "primary", "constraints": "offline access, gloves, sunlight"}
    ],
    "constraints": [
      "Must integrate with existing Work Management System (WMS)",
      "Must comply with CPUC reporting requirements",
      "Field workers have intermittent connectivity"
    ],
    "success_metrics": [
      {"metric": "Work order completion time", "baseline": "2 days", "target": "1 day", "timeframe": "6 months"}
    ]
  }
}
```

**Fields:**

- `project_name`: Kebab-case project identifier
- `project_id`: Formal project tracking ID
- `prd_path`: Relative path to PRD document
- `repository_path`: Root path of project repository
- `functional_requirements`: Array of functional requirements with ID, description, priority
- `non_functional_requirements`: Performance, scalability, availability requirements
- `security_requirements`: Security-specific requirements
- `user_personas`: Target users and their context
- `constraints`: Business, technical, and regulatory constraints
- `success_metrics`: How success will be measured

---

## 3. Task-Specific Context (Varies by Sub-Agent)

### 3.1 Application Architect Context

```json
{
  "task_specific_context": {
    "tech_stack": {
      "language": "Python",
      "version": "3.11",
      "backend_framework": "FastAPI",
      "frontend_framework": "React",
      "frontend_version": "18.2",
      "mobile_framework": "React Native",
      "database": "PostgreSQL",
      "database_version": "14",
      "cache": "Redis",
      "cache_version": "7.0",
      "auth_method": "JWT",
      "deployment_target": "Docker + Kubernetes"
    },
    "architecture_focus": [
      "Design API contracts",
      "Design database schema",
      "Design authentication flow",
      "Plan offline sync strategy"
    ]
  }
}
```

### 3.2 Test Strategy Planner Context

```json
{
  "task_specific_context": {
    "architecture_summary": {
      "modules": [
        {"name": "authentication", "path": "src/auth", "responsibility": "User login and JWT management"},
        {"name": "work_orders", "path": "src/work_orders", "responsibility": "Work order CRUD operations"}
      ],
      "api_endpoints": [
        {"method": "POST", "path": "/api/v1/auth/login", "description": "User login"},
        {"method": "GET", "path": "/api/v1/work-orders", "description": "List work orders"}
      ],
      "database_tables": ["users", "work_orders", "audit_logs"]
    },
    "test_frameworks": {
      "unit": "pytest",
      "integration": "pytest + httpx",
      "e2e": "playwright"
    },
    "coverage_targets": {
      "unit": 85,
      "integration": 70,
      "e2e": "all critical paths"
    }
  }
}
```

### 3.3 App Implementation Coordinator Context

```json
{
  "task_specific_context": {
    "architecture": {
      "directory_structure": {
        "/src": "Application source code",
        "/src/auth": "Authentication module",
        "/src/api": "API routes",
        "/src/models": "Data models",
        "/tests": "Test suite"
      },
      "modules": [
        {
          "name": "authentication",
          "path": "src/auth",
          "responsibility": "User authentication and token management",
          "dependencies": ["database", "crypto_utils"],
          "priority": 1
        }
      ]
    },
    "test_strategy": {
      "failing_tests_location": "/tests",
      "test_first": true,
      "coverage_required": 85
    },
    "implementation_sequence": [
      "Phase 1: Database and models",
      "Phase 2: Business logic",
      "Phase 3: API layer",
      "Phase 4: Integration points"
    ]
  }
}
```

### 3.4 Language-Specific Developer Context

```json
{
  "task_specific_context": {
    "module_to_implement": {
      "name": "user_authentication",
      "path": "src/auth/user_authentication.py",
      "responsibility": "Handle user login, token generation, session management",
      "dependencies": ["database", "crypto_utils"],
      "priority": "critical"
    },
    "failing_tests": ["tests/unit/test_user_authentication.py"],
    "architecture_excerpt": {
      "auth_method": "JWT with refresh tokens",
      "token_expiry": {"access": 15, "refresh": 10080},
      "session_storage": "Redis",
      "password_hashing": "bcrypt"
    },
    "coding_standards": {
      "style_guide": "PEP 8",
      "linter": "pylint + flake8",
      "formatter": "black",
      "type_checker": "mypy",
      "docstring_style": "Google"
    },
    "constraints": [
      "Token expiry: 15 minutes (access), 7 days (refresh)",
      "Password requirements: min 12 chars, uppercase, lowercase, number, symbol",
      "Must log all authentication attempts"
    ]
  }
}
```

### 3.5 Quality Assurance Context

```json
{
  "task_specific_context": {
    "source_directory": "/src",
    "test_directory": "/tests",
    "quality_standards": {
      "min_coverage": {"unit": 85, "integration": 70},
      "max_lint_errors": 0,
      "max_type_errors": 0,
      "max_security_critical": 0,
      "max_security_high": 0
    },
    "security_scans_required": [
      "dependency_vulnerabilities",
      "static_analysis",
      "secret_detection",
      "secure_coding_review"
    ],
    "tests_to_run": ["unit", "integration", "e2e"],
    "performance_tests": {
      "enabled": true,
      "targets": {
        "api_response_time_ms": 1000,
        "database_query_time_ms": 100
      }
    }
  }
}
```

---

## 4. Previous Decisions (Audit Trail)

```json
{
  "previous_decisions": [
    {
      "decision_id": "DEC-001",
      "phase": "Phase 2: Technology Stack Selection",
      "decision_type": "tech_stack",
      "timestamp": "2026-01-16T10:15:00Z",
      "decision_maker": "orchestrator",
      "decision": {
        "description": "Selected Python + FastAPI for backend",
        "options_considered": ["Python FastAPI", "TypeScript NestJS", "Java Spring Boot"],
        "chosen_option": "Python FastAPI",
        "justification": "Strong data processing ecosystem, team expertise, fast development"
      },
      "approval_status": "approved",
      "approved_by": "john.doe@company.com",
      "approval_timestamp": "2026-01-16T10:30:00Z"
    },
    {
      "decision_id": "DEC-002",
      "phase": "Phase 3: Architecture Design",
      "decision_type": "architecture",
      "timestamp": "2026-01-16T11:45:00Z",
      "decision_maker": "4 - Design - Application Architect",
      "decision": {
        "description": "Layered architecture with offline sync",
        "chosen_option": "3-tier architecture with event sourcing for sync",
        "justification": "Supports offline mode requirement, auditable sync events"
      },
      "approval_status": "approved",
      "approved_by": "jane.smith@company.com",
      "approval_timestamp": "2026-01-16T12:00:00Z"
    }
  ]
}
```

**Fields:**

- `decision_id`: Unique identifier for decision (DEC-001, DEC-002, ...)
- `phase`: Which phase of workflow the decision was made
- `decision_type`: Category (tech_stack, architecture, test_strategy, implementation, qa, devops)
- `timestamp`: When decision was made
- `decision_maker`: Agent or user who made decision
- `decision.description`: What was decided
- `decision.options_considered`: Alternatives evaluated
- `decision.chosen_option`: Selected approach
- `decision.justification`: Why this option was chosen
- `approval_status`: pending, approved, rejected
- `approved_by`: User who approved
- `approval_timestamp`: When approval occurred

---

## 5. Artifacts Available

```json
{
  "artifacts_available": [
    {
      "name": "PROJECT_CONTEXT.md",
      "path": "/docs/PROJECT_CONTEXT.md",
      "type": "markdown",
      "created_by": "5 - Test & Build - Application Builder",
      "created_at": "2026-01-16T09:00:00Z",
      "description": "Extracted requirements and context from PRD"
    },
    {
      "name": "TECH_STACK_DECISION.md",
      "path": "/docs/decisions/TECH_STACK_DECISION.md",
      "type": "markdown",
      "created_by": "5 - Test & Build - Application Builder",
      "created_at": "2026-01-16T10:30:00Z",
      "description": "Approved technology stack decisions"
    },
    {
      "name": "ARCHITECTURE_DESIGN.md",
      "path": "/docs/architecture/ARCHITECTURE_DESIGN.md",
      "type": "markdown",
      "created_by": "4 - Design - Application Architect",
      "created_at": "2026-01-16T12:00:00Z",
      "description": "Complete architecture design document"
    }
  ]
}
```

**Fields:**

- `name`: Artifact file name
- `path`: Relative path from project root
- `type`: File type (markdown, json, code, etc.)
- `created_by`: Agent that created the artifact
- `created_at`: Creation timestamp
- `description`: What the artifact contains

---

## 6. Output Requirements

```json
{
  "output_requirements": {
    "artifact_name": "ARCHITECTURE_DESIGN.md",
    "format": "markdown",
    "location": "/docs/architecture/ARCHITECTURE_DESIGN.md",
    "approval_required": true,
    "handoff_to": "5 - Test & Build - Test Strategy Planner",
    "delivery_method": "artifact_in_chat",
    "quality_checks": [
      "All requirements mapped to components",
      "Security requirements addressed",
      "Database schema normalized",
      "API contracts complete"
    ]
  }
}
```

**Fields:**

- `artifact_name`: Name of output artifact to create
- `format`: Output format (markdown, json, code)
- `location`: Where to save the artifact
- `approval_required`: Whether user approval needed before proceeding
- `handoff_to`: Next sub-agent in workflow (if applicable)
- `delivery_method`: How to present output (artifact_in_chat, file_only, both)
- `quality_checks`: Required checks before delivery

---

## 7. Sub-Agent Response Schema

Every sub-agent returns standardized response:

```json
{
  "task_id": "same-as-input-task-id",
  "sub_agent_name": "4 - Design - Application Architect",
  "status": "complete|in_progress|failed|blocked",
  "completion_timestamp": "2026-01-16T12:00:00Z",
  "artifacts_created": [
    {
      "name": "ARCHITECTURE_DESIGN.md",
      "path": "/docs/architecture/ARCHITECTURE_DESIGN.md",
      "type": "markdown",
      "description": "Complete architecture design document"
    }
  ],
  "quality_checks_passed": [
    {"check": "All requirements mapped", "status": "passed"},
    {"check": "Security requirements addressed", "status": "passed"}
  ],
  "quality_checks_failed": [],
  "decisions_made": [
    {
      "decision_type": "architecture_pattern",
      "description": "Selected layered architecture",
      "justification": "Supports modularity and testability"
    }
  ],
  "issues_found": [],
  "next_steps": [
    "User approval required for ARCHITECTURE_DESIGN.md",
    "After approval, proceed to test strategy planning"
  ],
  "handoff_ready": true,
  "handoff_target": "5 - Test & Build - Test Strategy Planner",
  "metadata": {
    "execution_time_seconds": 45,
    "model_used": "Claude Sonnet 4.5",
    "token_count": 5000
  }
}
```

**Fields:**

- `status`: Completion status
  - `complete`: Task finished successfully
  - `in_progress`: Multi-step task still running
  - `failed`: Task failed, cannot proceed
  - `blocked`: Waiting for user input or external dependency
- `artifacts_created`: List of files/documents created
- `quality_checks_passed/failed`: Results of self-checks
- `decisions_made`: Decisions made during task execution
- `issues_found`: Problems encountered (with severity)
- `next_steps`: Human-readable next actions
- `handoff_ready`: Whether ready to hand off to next agent
- `handoff_target`: Next agent in workflow
- `metadata`: Execution details for monitoring

---

## 8. Decision Log Format (Audit Trail)

All decisions are logged to `/docs/decisions/DECISION_LOG.jsonl` (JSON Lines format - one JSON object per line).

```json
{"decision_id":"DEC-001","project_name":"field-service-mobile-app","timestamp":"2026-01-16T10:15:00Z","phase":"Phase2:TechStackSelection","decision_type":"tech_stack","decision_maker":"orchestrator","decision":{"description":"Selected Python + FastAPI for backend","options_considered":["Python FastAPI","TypeScript NestJS","Java Spring Boot"],"chosen_option":"Python FastAPI","justification":"Strong data processing ecosystem, team expertise, fast development","override_reason":null},"approval_status":"approved","approved_by":"john.doe@company.com","approval_timestamp":"2026-01-16T10:30:00Z","context_for_next_phase":{"language":"Python","framework":"FastAPI","version":"3.11"}}
{"decision_id":"DEC-002","project_name":"field-service-mobile-app","timestamp":"2026-01-16T11:45:00Z","phase":"Phase3:ArchitectureDesign","decision_type":"architecture","decision_maker":"4 - Design - Application Architect","decision":{"description":"Layered architecture with offline sync","chosen_option":"3-tier architecture with event sourcing for sync","justification":"Supports offline mode requirement, auditable sync events"},"approval_status":"approved","approved_by":"jane.smith@company.com","approval_timestamp":"2026-01-16T12:00:00Z","context_for_next_phase":{"architecture_pattern":"layered","sync_strategy":"event_sourcing"}}
```

**Why JSON Lines?**

- Append-only audit log
- Each line is independent JSON (no parsing entire file)
- Easy to stream and process
- Standard format for log aggregation tools

---

## 9. Security & Privacy

### Sensitive Data Handling

- **PII (Personally Identifiable Information)**: Never log actual PII values
- **Credentials**: Never pass credentials in context (use references to secrets manager)
- **Business-sensitive data**: Mark with `"sensitive": true` flag

```json
{
  "user_data": {
    "user_id": "12345",
    "email": "[REDACTED]",
    "sensitive": true
  }
}
```

### Audit Compliance

- All context passing is logged for audit purposes
- Decision log maintained for 7 years (regulatory requirement)
- User approvals captured with timestamp and identity

---

## 10. Error Handling

When sub-agent encounters error:

```json
{
  "task_id": "uuid",
  "sub_agent_name": "5 - Test & Build - Python Developer",
  "status": "failed",
  "error": {
    "code": "TEST_FAILURE",
    "message": "Unit tests failed after 3 attempts",
    "details": {
      "failed_tests": ["test_authentication.py::test_invalid_token"],
      "error_output": "AssertionError: Expected 401, got 500"
    },
    "severity": "high",
    "recoverable": false,
    "recommended_action": "Manual review required - authentication logic may be incorrect"
  },
  "artifacts_created": [
    {"name": "test_failure_report.md", "path": "/docs/errors/test_failure_report.md"}
  ]
}
```

---

## 11. Versioning

**Context Schema Version:** 1.0

Future versions will be backward-compatible where possible. Breaking changes will increment major version.

---

## Examples

### Complete Context for Application Architect

See: [Example: Application Architect Invocation](./examples/context-architecture-designer.json)

### Complete Context for Python Developer

See: [Example: Python Developer Invocation](./examples/context-python-developer.json)

---

## References

- [Agent Skills Standard](https://agentskills.io/specification)
- [The Pancake Protocol - Standard Work](https://tedt.org/The-Pancake-Protocol/)
- [JSON Lines Format](https://jsonlines.org/)
