---
name: sce-file-deep-analyzer
description: "Deep-analyzes a single source file: extracts classes, methods, imports, design patterns, logical flow, and change-readiness assessment. Language-agnostic with framework-specific detection via inline scripts. Returns structured JSON per file with Mermaid class and flow diagrams."
compatibility:
  - "3 - Analysis - Reverse Engineering Agent"
license: "Proprietary"
metadata:
  version: 1.0.0
  author: SDLC Analysis Team
  category: code-generation
  tags: [reverse-engineering, code-analysis, class-extraction, method-extraction, change-readiness]
  tools: ['read', 'search', 'execute']
---

# sce-file-deep-analyzer

## When to Use This Skill

- Reverse engineering an unknown codebase and need per-file structural analysis
- Documenting classes, methods, imports, and design patterns in a source file
- Assessing change readiness of a file (coupling, cohesion, risk, recommendations)
- Generating Mermaid class diagrams and logical flow diagrams from source code
- Building a file-level inventory for change impact analysis

## Unitary Function

**ONE responsibility:** Analyze a SINGLE source file and return a structured JSON report containing all classes, methods, imports, design patterns, change-readiness assessment, and Mermaid diagrams.

## NOT RESPONSIBLE FOR

- Analyzing multiple files at once (orchestrator handles batching)
- Cross-file dependency resolution (that is flow mapping)
- Data model / ER extraction (that is `sce-data-model-extractor`)
- Generating HTML reports (that is `sce-reverse-engineering-reporter`)
- Running tests or measuring coverage
- Modifying source code

## Input

```json
{
  "file_path": "/absolute/path/to/source/file.py",
  "file_id": "F001",
  "language": "python",
  "language_hint": "python",
  "framework_context": ["django", "django-rest-framework"],
  "scan_depth": "standard",
  "repo_root": "/absolute/path/to/repo"
}
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `file_path` | Yes | Absolute path to the source file to analyze |
| `file_id` | Yes | Unique file ID from the Master Checklist |
| `language` | Yes | Detected language (from Discovery phase) |
| `language_hint` | No | Override for language detection |
| `framework_context` | No | Known frameworks for pattern-aware analysis |
| `scan_depth` | No | `quick` (classes+imports only), `standard` (full), `deep` (+ complexity metrics) |
| `repo_root` | No | Repo root for computing relative import paths |

## Output

```json
{
  "generated_by": {
    "skill": "sce-file-deep-analyzer",
    "version": "1.0.0"
  },
  "file_id": "F001",
  "file_path": "src/auth/views.py",
  "summary": "Handles user authentication endpoints including login, logout, and registration",
  "language": "python",
  "framework_usage": ["django-rest-framework"],
  "loc": 120,
  "complexity_score": "moderate",
  "classes": [
    {
      "name": "LoginView",
      "type": "class",
      "base_classes": ["APIView"],
      "interfaces": [],
      "purpose": "Processes login requests and returns JWT tokens",
      "line_start": 15,
      "line_end": 58,
      "methods": [
        {
          "name": "post",
          "visibility": "public",
          "parameters": [{"name": "request", "type": "Request", "purpose": "HTTP request with credentials"}],
          "return_type": "Response",
          "purpose": "Authenticates credentials and returns JWT pair",
          "complexity": "moderate",
          "line_start": 22,
          "line_end": 55,
          "calls_to": ["UserService.authenticate", "TokenService.generate_pair"],
          "called_by": ["URL: POST /api/v1/auth/login"],
          "error_handling": ["InvalidCredentialsError → 401"],
          "business_logic_notes": "Rate-limited to 5 attempts/min per IP"
        }
      ],
      "dependencies_internal": ["services.user_service.UserService"],
      "dependencies_external": ["rest_framework.views.APIView"]
    }
  ],
  "standalone_functions": [],
  "imports": {
    "internal": [{"module": "services.user_service", "names": ["UserService"], "usage_count": 3}],
    "external": [{"module": "rest_framework.views", "names": ["APIView"], "usage_count": 1}]
  },
  "constants": [],
  "design_patterns": ["Service Layer", "Serializer/DTO"],
  "change_readiness": {
    "coupling": "moderate — depends on 2 services",
    "cohesion": "high — single responsibility",
    "test_coverage_indicator": "partial",
    "risk_areas": ["Rate limiting hardcoded (L28)", "Token expiry in code not config (L45)"],
    "recommended_changes": ["Extract rate limit to settings", "Add integration test for password reset"]
  },
  "class_diagram_mermaid": "classDiagram\n  class LoginView {\n    +post(request) Response\n  }\n  LoginView --|> APIView",
  "logical_flow_mermaid": "graph TD\n  A[POST /login] --> B{Valid?}\n  B -->|Yes| C[Authenticate]\n  B -->|No| D[400]"
}
```

## Analysis Process

### Step 1: Read and Parse File
1. Read the entire file content
2. Identify language-specific constructs (class, function, method keywords)
3. For unknown languages, use regex patterns for common constructs

### Step 2: Extract Structure
**Per language approach:**

| Language | Class Pattern | Method Pattern | Import Pattern |
|----------|--------------|----------------|----------------|
| Python | `class Name(Base):` | `def name(self, ...):` | `from x import y`, `import x` |
| Java | `class Name extends Base implements I` | `public Type name(...)` | `import pkg.Class;` |
| C# | `class Name : Base, IInterface` | `public Type Name(...)` | `using Namespace;` |
| TypeScript | `class Name extends Base` | `methodName(...): Type` | `import { x } from 'y'` |
| Go | `type Name struct` | `func (n *Name) Method(...)` | `import "pkg"` |
| Ruby | `class Name < Base` | `def method_name` | `require 'gem'` |
| PHP | `class Name extends Base` | `public function name(...)` | `use Namespace\Class;` |

**For unrecognized languages:** Use inline grep/regex to find:
- Lines containing `class `, `struct `, `interface `, `enum `
- Lines containing `function `, `func `, `def `, `fn `, `sub `
- Lines containing `import `, `require `, `include `, `using `

### Step 3: Analyze Relationships
1. For each class, identify what other classes/services it calls
2. For each method, trace calls to other methods (string matching on known class names)
3. Classify as internal (within repo) vs external (library) dependencies

### Step 4: Assess Change Readiness
1. **Coupling**: Count unique dependencies (internal + external)
   - Low: 0-2, Moderate: 3-5, High: 6+
2. **Cohesion**: Assess if all methods serve a single purpose
   - High: All methods relate to one domain concept
   - Medium: Mix of related concerns
   - Low: Multiple unrelated responsibilities
3. **Risk areas**: Flag hardcoded values, missing error handling, complex conditionals (3+ nesting levels)
4. **Recommendations**: Specific, actionable suggestions for improving the file

### Step 5: Generate Diagrams
1. **Class diagram (Mermaid)**: Show class hierarchy and key dependencies
2. **Logical flow (Mermaid)**: Show the main execution path of the primary method

## Quality Checks

- [ ] All classes in the file are extracted and documented
- [ ] All public methods have parameters and return types documented
- [ ] Import list distinguishes internal vs external
- [ ] Change readiness assessment has all 4 components (coupling, cohesion, risks, recommendations)
- [ ] Mermaid class diagram is valid syntax
- [ ] Mermaid flow diagram is valid syntax
- [ ] Summary accurately describes file purpose in 1-2 sentences

## Guardrails

- MUST NOT execute the source file or any code from it
- MUST NOT modify the source file
- MUST handle binary files gracefully (skip with reason)
- MUST handle files > 10,000 LOC by splitting analysis by class/function boundaries
  - **Chunking reassembly strategy:** Split the file at top-level class or function boundaries (never mid-method). Analyze each chunk independently, producing a partial JSON result per chunk. After all chunks are processed, merge partial results into a single output by concatenating the `classes`, `standalone_functions`, and `imports` arrays, de-duplicating by name. Recompute `loc`, `complexity_score`, and `change_readiness` from the merged data. The final `class_diagram_mermaid` and `logical_flow_mermaid` are regenerated from the merged class/function inventory, not concatenated from chunk diagrams.
- MUST NOT expose hardcoded secrets found in source — flag as `[SECRET_DETECTED]`
- MUST complete analysis within 60 seconds per file (standard depth)

## Authority Boundaries

**CAN:**
- Read the source file content
- Execute read-only shell commands (grep, wc, head) for structure detection
- Search the repository for cross-reference validation
- Generate Mermaid diagram syntax

**CANNOT:**
- Modify any file
- Execute code from the analyzed repository
- Access external APIs or resources
- Make cross-file dependency conclusions (that is flow mapping's job)
