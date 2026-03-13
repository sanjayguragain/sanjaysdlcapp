---
name: sce-tech-policy-resolver
description: "Reads, parses, and resolves technology decisions from docs/standards/tech-policy-matrix.yaml. Given a surface type, requirements, or technology choice, returns the approved stack, version constraints, applicable global standards, and compliance status. Provides a common interface for technology policy lookups used by standards analysis and architecture agents."
metadata:
  version: 1.0.0
  author: Agent Skills Team
  category: compliance
  tags:
    - tech-policy
    - standards
    - technology-selection
    - compliance
    - stack-resolution
  tools: ['Read', 'Search']
---

# SCE Tech Policy Resolver

## Overview

This skill provides a structured interface for resolving technology decisions against the `docs/standards/tech-policy-matrix.yaml`. It parses the YAML structure and answers three types of queries:

1. **Stack Resolution** — Given a surface type, return the recommended stack with preferences
2. **Compliance Check** — Given a technology choice, validate against the matrix
3. **Standards Lookup** — Given a stack/surface combination, return all applicable standards

This skill is **read-only** and does not modify the YAML. It is a resolution engine that agents invoke to get consistent, authoritative technology policy answers.

## When to Use

- Architecture decisions need tech stack recommendations (Solution Architect)
- Standards gap analysis needs to compare extracted decisions against the matrix (Standards Gap Analyzer)
- Any agent needs to validate a technology choice against SCE policy
- Technology selection justification needs matrix-backed evidence

## When NOT to Use

- Updating the tech-policy-matrix.yaml (the Standards Gap Analyzer handles updates)
- Non-SCE technology decisions (the matrix is organization-specific)
- The matrix YAML file doesn't exist or is malformed (report error)

## Inputs

```json
{
  "query_type": "stack_resolution|compliance_check|standards_lookup",
  "stack_resolution": {
    "surface": "spa|webapp|mobile|windows_app|ai_voice",
    "requirements": {
      "nfr_priorities": ["performance", "scalability", "security"],
      "team_skills": ["typescript", "python", "dotnet"],
      "compliance_needs": []
    }
  },
  "compliance_check": {
    "technology": "Technology name",
    "version": "Version string",
    "stack": "react_node_ts_js|python|dotnet|swift",
    "surface": "Surface type"
  },
  "standards_lookup": {
    "stack": "react_node_ts_js|python|dotnet|swift",
    "surface": "spa|webapp|mobile|windows_app|ai_voice",
    "standard_category": "all|security|quality|api|auth|nfr|container|data"
  }
}
```

### Input Normalization

The input values above use **unprefixed short names** (e.g., `"spa"`, `"react_node_ts_js"`). These map to the namespaced keys in `tech-policy-matrix.yaml` as follows:

| Input Value | YAML Key |
|---|---|
| `spa`, `webapp`, `mobile`, `windows_app`, `ai_voice` | `policy.glossary.surfaces.{value}` |
| `react_node_ts_js`, `python`, `dotnet`, `swift` | `policy.glossary.stacks.{value}` |

Callers should pass the short name only. The skill handles the namespace prefix resolution internally.

## Method

### Step 1: Parse Tech-Policy-Matrix

Read and parse `docs/standards/tech-policy-matrix.yaml`:

```yaml
Sections to parse:
  policy.meta          → Version, last_updated, status
  policy.preferences   → Stack preference order
  policy.glossary      → Stack and surface definitions with version constraints
  policy.global_standards → STD-* entries (security, quality, API, auth, NFR, etc.)
  policy.matrix        → CELL-{SURFACE}-{STACK} entries with approved technologies
  policy.decision_rules → RULE-* entries for technology selection guidance
  policy.deprecations  → Sunset technologies with timelines
```

### Step 2: Execute Query

#### Stack Resolution Query

1. Look up the surface in `policy.glossary.surfaces`
2. Retrieve the stack preference order from `policy.preferences.stack_preference_order`
3. For each stack (in preference order), check if a matrix cell exists for the surface
4. Return the highest-preference stack with its approved technologies and version constraints
5. If team skills are provided, factor in skill alignment (prefer stacks matching team skills)
6. Return applicable global standards and cell-specific standards

**Output:**
```json
{
  "recommended_stack": "react_node_ts_js",
  "preference_rank": 1,
  "rationale": "Highest preference stack with SPA surface support",
  "approved_technologies": {
    "language": "TypeScript 5.0+",
    "runtime": "Node.js 18+",
    "framework": "React 18+"
  },
  "alternative_stacks": [
    {
      "stack": "python",
      "preference_rank": 2,
      "notes": "Alternative if team has Python skills"
    }
  ],
  "applicable_standards": ["STD-SEC-001", "STD-QA-001", "STD-API-001"],
  "cell_id": "CELL-SPA-REACT-001"
}
```

#### Compliance Check Query

1. Look up the technology in the matrix cell for the given stack/surface
2. Determine support level: `preferred`, `allowed`, `exception`, `not_supported`
3. Check version constraints
4. Check for deprecation status
5. List violations if any

**Output:**
```json
{
  "technology": "React",
  "version": "18.2",
  "support_level": "preferred|allowed|exception|not_supported",
  "version_compliant": true,
  "deprecated": false,
  "deprecation_date": null,
  "violations": [],
  "cell_id": "CELL-SPA-REACT-001",
  "notes": "Fully compliant with current standards"
}
```

#### Standards Lookup Query

1. Retrieve all global standards from `policy.global_standards`
2. If stack/surface specified, also retrieve cell-specific standards
3. Filter by category if specified
4. Return standard details (ID, title, requirements, scope)

**Output:**
```json
{
  "global_standards": [
    {
      "id": "STD-SEC-001",
      "title": "Security baseline",
      "requirements": ["HTTPS/TLS", "secrets management", "SAST"],
      "scope": "All applications"
    }
  ],
  "cell_standards": [],
  "decision_rules": []
}
```

### Step 3: Validate and Return

- Verify all referenced IDs exist in the YAML
- Flag any missing or malformed entries
- Return structured result with the YAML version for traceability

## Output

```json
{
  "generated_by": {
    "skill": "sce-tech-policy-resolver",
    "version": "1.0.0"
  },
  "matrix_version": "<read from policy.meta.version>",
  "matrix_last_updated": "<read from policy.meta.last_updated>",
  "query_type": "stack_resolution|compliance_check|standards_lookup",
  "result": {},
  "warnings": []
}
```

## Error Handling

- **Matrix file not found** → Return error: "tech-policy-matrix.yaml not found at docs/standards/tech-policy-matrix.yaml"
- **Malformed YAML** → Return error with parse failure details
- **Unknown surface/stack** → Return error with list of valid surfaces/stacks from glossary
- **No matrix cell for combination** → Return warning: "No matrix cell defined for {surface} + {stack}. Check if this combination is approved."
- **Deprecated technology** → Return result with `deprecated: true` and sunset date

## Standards Compliance

### Artifact Output Standard
All deliverable outputs MUST have a canonical JSON representation.

### Confidence Standard
Results are direct lookups from the authoritative YAML — no heuristic confidence needed.

### Standards References
- `docs/standards/tech-policy-matrix.yaml` (primary data source)
- `docs/standards/CONTEXT_PASSING_STANDARDS.md`
- `docs/standards/TECH_STACK_STANDARDS.md`
- `docs/standards/APPROVAL_REQUEST.md`
