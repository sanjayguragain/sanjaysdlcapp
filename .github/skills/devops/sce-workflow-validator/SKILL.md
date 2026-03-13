---
name: sce-workflow-validator
description: Validates project metadata, user requirements, and generated workflow YAML files. Checks for syntax errors, hardcoded secrets, version pinning compliance, reusable workflow calls, and enterprise standards. Returns validation report with errors and warnings. Use before generation (inputs) and after generation (outputs).
metadata:
  organization: SCE
  domain: devops-workflows
  category: utility
---

# SCE Workflow Validator

## Overview

Comprehensive validation of inputs, outputs, and compliance with enterprise standards. Ensures workflows meet security, operational, and quality requirements.

## When to Use

- **Before generation** - Validate project metadata and requirements
- **After generation** - Validate generated workflow YAML files
- **On-demand** - Validate existing workflows

## What It Does

✅ Validates project metadata structure  
✅ Checks requirements completeness  
✅ Parses YAML syntax  
✅ Detects hardcoded secrets (regex patterns)  
✅ Enforces version pinning (@v2, not @main)  
✅ Verifies reusable workflow calls  
✅ Checks required jobs present  
✅ Validates permissions declarations  
✅ Returns detailed validation report

## What It Doesn't Do

❌ Fix errors automatically (reports them only)  
❌ Generate workflows (that's workflow-generator skills)  
❌ Gather requirements (that's requirements-gatherer)

## Validation Types

### 1. Project Metadata Validation

```powershell
.\scripts\validate-project-metadata.ps1 -MetadataFile project_metadata.json
```

**Checks:**
- Required fields present (language, version, build_tool)
- Valid enum values (language in [dotnet, java, python, node])
- Path references exist
- Component structure valid

**Example Error:**
```json
{
  "valid": false,
  "errors": [
    "Missing required field: language",
    "Invalid language value: 'golang' (must be dotnet, java, python, or node)"
  ]
}
```

### 2. Requirements Validation

```powershell
.\scripts\validate-requirements.ps1 -RequirementsFile requirements.json
```

**Checks:**
- All required fields collected
- Workflow types are valid
- Deployment target specified if deploy workflow requested
- Auth method specified
- URLs are valid format
- UUIDs are valid format
- Consistent selections (e.g., OIDC requires client-id)

**Example Warning:**
```json
{
  "valid": true,
  "warnings": [
    "deploy workflow selected but no ITSM integration - recommended for production"
  ]
}
```

### 3. Workflow YAML Validation

```powershell
.\scripts\validate-workflow.ps1 -WorkflowFile build.yml
```

**Checks:**
- ✅ Valid YAML syntax
- ✅ No hardcoded secrets
- ✅ Version pinning (@v2)
- ✅ Reusable workflow calls
- ✅ Required jobs present
- ✅ Proper permissions
- ✅ CREDENTIAL_SOURCE pattern

## Security Validation

### Hardcoded Secret Detection

**Regex Patterns:**
```
- AZURE_PASSWORD=.{8,}
- AWS_SECRET_KEY=.{20,}
- password:\s*['"]\w+['"]
- api_key:\s*['"]\w+['"]
- token:\s*['"]\w+['"]
```

**Example Error:**
```yaml
# Bad (FAILS validation)
secrets:
  AZURE_PASSWORD: "MySecretPassword123"

# Good (PASSES validation)
secrets:
  AZURE_PASSWORD: ${{ secrets[vars.AZURE_PASSWORD] }}
```

### CREDENTIAL_SOURCE Pattern

**Required Pattern:**
```yaml
secrets:
  AZURE_USERNAME: ${{ secrets[vars.AZURE_USERNAME] }}
  AZURE_PASSWORD: ${{ secrets[vars.AZURE_PASSWORD] }}
```

**Validation:**
- Must use `secrets[vars.VARIABLE_NAME]` pattern
- Variable names must be uppercase with underscores
- No direct `secrets.VARIABLE` references

## Enterprise Standards Validation

### Version Pinning

**Rule:** All reusable workflows MUST use `@v2` (or specific version), NOT `@main` or `@latest`

```yaml
# Bad (FAILS validation)
uses: EdisonInternational/actions/.github/workflows/build-dotnet.yml@main

# Good (PASSES validation)
uses: EdisonInternational/actions/.github/workflows/build-dotnet.yml@v2
```

### Reusable Workflow Calls

**Rule:** Must use reusable workflow calls, NOT inline implementations

```yaml
# Bad (FAILS validation)
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: dotnet build

# Good (PASSES validation)
jobs:
  build:
    uses: EdisonInternational/actions/.github/workflows/build-dotnet.yml@v2
    with:
      VERSION: ${{ github.ref_name }}
```

### Required Jobs

**Build Workflows Must Have:**
1. `security-check` (prerequisite)
2. `build` (main job)
3. `nexus-upload` (artifact storage)

**Deploy Workflows Must Have:**
1. `nexus-download` (get artifacts)
2. `preflight` (validation checks)
3. `deploy-setup` (ITSM change request)
4. `deploy` (actual deployment)
5. `deploy-complete` (close change request)
6. `notify` (notifications)

**Validation Example:**
```json
{
  "valid": false,
  "errors": [
    "Missing required job: security-check (prerequisite for build)",
    "Missing required job: deploy-preflight (required for production)"
  ]
}
```

### Permissions Validation

**Rule:** Each job must declare minimum required permissions

```yaml
# Good (PASSES validation)
jobs:
  build:
    permissions:
      contents: write      # Required for artifact upload
      checks: read         # Required for test results
      actions: read        # Required for reusable workflows
      attestations: write  # Required for SBOM
      id-token: write      # Required for OIDC
```

**Validation Error:**
```json
{
  "valid": false,
  "errors": [
    "Job 'build' missing required permission: contents: write",
    "Job 'build' missing required permission: id-token: write (OIDC)"
  ]
}
```

## Validation Output

### Success Report
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    "Consider adding deploy-notification job for monitoring"
  ],
  "info": [
    "Version pinning: ✓ All workflows use @v2",
    "Reusable workflows: ✓ All jobs use reusable calls",
    "Security: ✓ No hardcoded secrets detected",
    "ITSM: ✓ Change management integrated"
  ]
}
```

### Failure Report
```json
{
  "valid": false,
  "errors": [
    "Line 42: Hardcoded secret detected: AZURE_PASSWORD=MyPassword",
    "Line 105: Using @main instead of @v2 (version pinning required)",
    "Line 150: Missing required job: deploy-preflight-checks",
    "Line 200: Direct secrets.VARIABLE reference (must use CREDENTIAL_SOURCE)"
  ],
  "warnings": [
    "No notification job configured (recommended)",
    "SBOM generation not enabled (recommended for compliance)"
  ]
}
```

## Validation Levels

### Strict Mode (Fail on Warnings)
```powershell
.\scripts\validate-workflow.ps1 -WorkflowFile build.yml -Strict
```
- Errors = fail
- Warnings = fail
- Info = pass

### Standard Mode (Default)
```powershell
.\scripts\validate-workflow.ps1 -WorkflowFile build.yml
```
- Errors = fail
- Warnings = pass (report only)
- Info = pass

### Lax Mode (Report Only)
```powershell
.\scripts\validate-workflow.ps1 -WorkflowFile build.yml -Lax
```
- Errors = pass (report only)
- Warnings = pass
- Info = pass

## Scripts

- **[validate-project-metadata.ps1](scripts/validate-project-metadata.ps1)** - Metadata validation
- **[validate-requirements.ps1](scripts/validate-requirements.ps1)** - Requirements validation
- **[validate-workflow.ps1](scripts/validate-workflow.ps1)** - YAML + compliance validation (most complex)

## References

- [Security Patterns](references/security-patterns.md) - Secret detection regex, approved patterns
- [Enterprise Standards](references/enterprise-standards.md) - Complete compliance checklist

---

**Skill Type:** Utility (no agency)  
**Returns:** validation_report.json  
**Used By:** 6 - Change & Release - DevOps Workflow Agent (validation phases)
