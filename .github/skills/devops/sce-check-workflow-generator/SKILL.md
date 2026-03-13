---
name: sce-check-workflow-generator
description: Generates check.yml workflow for code quality and security scanning. Supports SonarQube quality gates and GitHub CodeQL scanning. Runs on pull requests and pushes. Returns .github/workflows/check.yml file with security prerequisites.
metadata:
  organization: SCE
  domain: devops-workflows
  category: workflow-generator
  workflow_type: check
---

# SCE Check Workflow Generator

## Overview

Generates quality gates and security scanning workflow. Ensures code meets quality standards before merging and building.

## When to Use

- **Quality gates** - SonarQube code quality checks
- **Security scanning** - CodeQL vulnerability detection
- **PR validation** - Run checks on every pull request

## What It Does

✅ Generates `check.yml` workflow file  
✅ Configures SonarQube quality gates  
✅ Sets up CodeQL security scanning  
✅ Defines PR triggers  
✅ Configures quality gate thresholds

## What It Doesn't Do

❌ Build code (that's build-workflow-generator)  
❌ Deploy code (that's deploy-workflow-generator)  
❌ Fix quality issues (reports them only)

## Generated Workflow

### File: .github/workflows/check.yml

```yaml
name: Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

permissions:
  contents: read
  security-events: write
  actions: read

jobs:
  sonarqube:
    uses: EdisonInternational/actions/.github/workflows/sonarqube.yml@v2
    with:
      PROJECT_KEY: HelloWorld-WebApp  # From project metadata
      QUALITY_GATE: true
      COVERAGE_THRESHOLD: 80
    secrets:
      SONAR_TOKEN: ${{ secrets[vars.SONAR_TOKEN] }}
      SONAR_HOST_URL: ${{ secrets[vars.SONAR_HOST_URL] }}

  codeql:
    uses: EdisonInternational/actions/.github/workflows/codeql.yml@v2
    with:
      LANGUAGES: csharp,javascript  # From project metadata
      QUERIES: security-extended
    secrets:
      GITHUB_TOKEN: ${{ secrets[vars.GITHUB_TOKEN] }}
```

## Configuration Options

### SonarQube Options

```yaml
with:
  PROJECT_KEY: <project-name>  # Auto-generated from project metadata
  QUALITY_GATE: true           # Fail build on quality gate failure
  COVERAGE_THRESHOLD: 80       # Minimum code coverage (%)
  DUPLICATIONS_THRESHOLD: 3    # Maximum code duplication (%)
  BUGS_THRESHOLD: 0            # Maximum bugs
  VULNERABILITIES_THRESHOLD: 0 # Maximum vulnerabilities
```

### CodeQL Options

```yaml
with:
  LANGUAGES: csharp,javascript  # Detected from project
  QUERIES: security-extended    # security-extended | security-and-quality
  BUILD_MODE: autobuild         # autobuild | manual
```

## Language Detection

Based on project metadata:

```json
{
  "language": "dotnet",
  "additional_languages": ["javascript"]
}
```

Generates:
```yaml
LANGUAGES: csharp,javascript
```

### Supported Languages
- **csharp** (.NET, C#)
- **java** (Java)
- **javascript** (JavaScript, TypeScript, Node.js)
- **python** (Python)
- **go** (Go)
- **cpp** (C, C++)

## Usage Examples

### Example 1: SonarQube Only

**Input Requirements:**
```json
{
  "workflow_type": "check",
  "check_tools": ["sonarqube"],
  "sonarqube_project_key": "HelloWorld-WebApp",
  "quality_gate_enabled": true,
  "coverage_threshold": 80
}
```

**Generated Workflow:**
```yaml
name: Check

on:
  pull_request:
    branches: [main, develop]

permissions:
  contents: read
  actions: read

jobs:
  sonarqube:
    uses: EdisonInternational/actions/.github/workflows/sonarqube.yml@v2
    with:
      PROJECT_KEY: HelloWorld-WebApp
      QUALITY_GATE: true
      COVERAGE_THRESHOLD: 80
    secrets:
      SONAR_TOKEN: ${{ secrets[vars.SONAR_TOKEN] }}
      SONAR_HOST_URL: ${{ secrets[vars.SONAR_HOST_URL] }}
```

### Example 2: CodeQL Only

**Input Requirements:**
```json
{
  "workflow_type": "check",
  "check_tools": ["codeql"],
  "codeql_languages": ["csharp", "javascript"],
  "codeql_queries": "security-extended"
}
```

**Generated Workflow:**
```yaml
name: Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

permissions:
  contents: read
  security-events: write
  actions: read

jobs:
  codeql:
    uses: EdisonInternational/actions/.github/workflows/codeql.yml@v2
    with:
      LANGUAGES: csharp,javascript
      QUERIES: security-extended
    secrets:
      GITHUB_TOKEN: ${{ secrets[vars.GITHUB_TOKEN] }}
```

### Example 3: Both SonarQube + CodeQL

**Input Requirements:**
```json
{
  "workflow_type": "check",
  "check_tools": ["sonarqube", "codeql"]
}
```

**Generated Workflow:**
```yaml
name: Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

permissions:
  contents: read
  security-events: write
  actions: read

jobs:
  sonarqube:
    uses: EdisonInternational/actions/.github/workflows/sonarqube.yml@v2
    # ... SonarQube config ...

  codeql:
    uses: EdisonInternational/actions/.github/workflows/codeql.yml@v2
    # ... CodeQL config ...
```

## Generation Process

1. **Get template** from sce-template-manager
2. **Determine check tools** (SonarQube, CodeQL, or both)
3. **Detect languages** from project metadata
4. **Substitute placeholders:**
   - `{{PROJECT_KEY}}` → project name
   - `{{LANGUAGES}}` → detected languages
   - `{{QUALITY_GATE}}` → true/false
   - `{{COVERAGE_THRESHOLD}}` → percentage
5. **Validate** with sce-workflow-validator
6. **Write** `.github/workflows/check.yml`

## Script

```powershell
.\scripts\generate-check-workflow.ps1 `
  -ProjectMetadata project_metadata.json `
  -Requirements requirements.json `
  -OutputPath .github/workflows/check.yml
```

## Validation

Generated workflow validated for:
- ✅ Valid YAML syntax
- ✅ Version pinning (@v2)
- ✅ CREDENTIAL_SOURCE pattern
- ✅ Required permissions (security-events: write for CodeQL)
- ✅ No hardcoded secrets

## References

- [Check Workflow Templates](templates/) - SonarQube and CodeQL templates
- [Quality Gates](references/quality-gates.md) - Threshold configuration
- [CodeQL Queries](references/codeql-queries.md) - Security vs quality queries

---

**Skill Type:** Workflow Generator (no agency)  
**Returns:** `.github/workflows/check.yml`  
**Used By:** 6 - Change & Release - DevOps Workflow Agent (when workflow_type = "check")
