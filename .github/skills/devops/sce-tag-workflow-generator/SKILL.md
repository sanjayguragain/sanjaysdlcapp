---
name: sce-tag-workflow-generator
description: Generates tag.yml workflow for semantic versioning. Creates version tags on main/develop branch pushes with auto-incrementing patch numbers. Supports major/minor version configuration and optional GitHub release creation. Returns .github/workflows/tag.yml file.
metadata:
  organization: SCE
  domain: devops-workflows
  category: workflow-generator
  workflow_type: tag
---

# SCE Tag Workflow Generator

## Overview

Generates semantic versioning workflow that automatically creates version tags (v1.0.0, v1.0.1, etc.) when code is pushed to main or develop branches.

## When to Use

- **Semantic versioning needed** - Auto-increment versions on push
- **Release tracking** - Tag every merge to main
- **Version management** - Standardized version format

## What It Does

✅ Generates `tag.yml` workflow file  
✅ Configures triggers (push to main/develop)  
✅ Sets major/minor version numbers  
✅ Enables auto-increment patch versions  
✅ Optionally creates GitHub releases

## What It Doesn't Do

❌ Tag manually (workflow runs on push)  
❌ Manage major/minor bumps (manual configuration)  
❌ Generate release notes (that's release-notes-workflow-generator)

## Generated Workflow

### File: .github/workflows/tag.yml

```yaml
name: Tag

on:
  push:
    branches:
      - main
      - develop

permissions:
  contents: write
  actions: read

jobs:
  tag:
    uses: EdisonInternational/actions/.github/workflows/tag.yml@v2
    with:
      VERSION: ${{ github.ref_name }}
      MAJOR_VERSION: 1  # User-specified
      MINOR_VERSION: 0  # User-specified
    secrets:
      GITHUB_TOKEN: ${{ secrets[vars.GITHUB_TOKEN] }}
```

## Behavior

### On Push to Main
```
1. Workflow triggers on push to main
2. Fetches existing tags (v1.0.0, v1.0.1, ...)
3. Finds latest tag: v1.0.5
4. Auto-increments patch: v1.0.6
5. Creates new tag: v1.0.6
6. (Optional) Creates GitHub release v1.0.6
```

### Version Format
- **Major.Minor.Patch** (semantic versioning)
- Example: `v1.0.5`
  - Major: 1 (breaking changes)
  - Minor: 0 (new features)
  - Patch: 5 (auto-incremented bug fixes)

### Major/Minor Bumps
```
Manual configuration in workflow file:

Current: v1.0.5

To bump minor (new feature):
  MAJOR_VERSION: 1
  MINOR_VERSION: 1  # Changed from 0 to 1
  Result: v1.1.0 (patch resets to 0)

To bump major (breaking change):
  MAJOR_VERSION: 2  # Changed from 1 to 2
  MINOR_VERSION: 0  # Reset to 0
  Result: v2.0.0 (patch resets to 0)
```

## Configuration Options

### Basic Tagging
```yaml
with:
  VERSION: ${{ github.ref_name }}
  MAJOR_VERSION: 1
  MINOR_VERSION: 0
```

### With GitHub Release
```yaml
with:
  VERSION: ${{ github.ref_name }}
  MAJOR_VERSION: 1
  MINOR_VERSION: 0
  CREATE_RELEASE: true  # Creates GitHub release
  RELEASE_NAME: "Release ${{ github.ref_name }}"
```

### Branch-Specific Versioning
```yaml
on:
  push:
    branches:
      - main     # Production releases (v1.0.x)
      - develop  # Development releases (v1.0.x-dev)
```

## Usage Examples

### Example 1: Basic Tag Workflow

**Input Requirements:**
```json
{
  "workflow_type": "tag",
  "major_version": "1",
  "minor_version": "0",
  "create_release": false
}
```

**Generated Workflow:**
```yaml
name: Tag

on:
  push:
    branches: [main, develop]

permissions:
  contents: write
  actions: read

jobs:
  tag:
    uses: EdisonInternational/actions/.github/workflows/tag.yml@v2
    with:
      VERSION: ${{ github.ref_name }}
      MAJOR_VERSION: 1
      MINOR_VERSION: 0
    secrets:
      GITHUB_TOKEN: ${{ secrets[vars.GITHUB_TOKEN] }}
```

### Example 2: Tag + GitHub Release

**Input Requirements:**
```json
{
  "workflow_type": "tag",
  "major_version": "2",
  "minor_version": "1",
  "create_release": true,
  "release_name_template": "Release {{VERSION}}"
}
```

**Generated Workflow:**
```yaml
name: Tag

on:
  push:
    branches: [main]

permissions:
  contents: write
  actions: read

jobs:
  tag:
    uses: EdisonInternational/actions/.github/workflows/tag.yml@v2
    with:
      VERSION: ${{ github.ref_name }}
      MAJOR_VERSION: 2
      MINOR_VERSION: 1
      CREATE_RELEASE: true
      RELEASE_NAME: "Release ${{ github.ref_name }}"
    secrets:
      GITHUB_TOKEN: ${{ secrets[vars.GITHUB_TOKEN] }}
```

## Generation Process

1. **Get template** from sce-template-manager
2. **Substitute placeholders:**
   - `{{MAJOR_VERSION}}` → user-provided major version
   - `{{MINOR_VERSION}}` → user-provided minor version
   - `{{CREATE_RELEASE}}` → true/false based on requirements
3. **Validate** with sce-workflow-validator
4. **Write** `.github/workflows/tag.yml`

## Script

```powershell
.\scripts\generate-tag-workflow.ps1 `
  -ProjectMetadata project_metadata.json `
  -Requirements requirements.json `
  -OutputPath .github/workflows/tag.yml
```

## Validation

Generated workflow validated for:
- ✅ Valid YAML syntax
- ✅ Version pinning (@v2)
- ✅ CREDENTIAL_SOURCE pattern
- ✅ Required permissions
- ✅ No hardcoded secrets

## References

- [Tag Workflow Template](templates/tag.yml) - Base template
- [Semantic Versioning Spec](references/semantic-versioning.md) - Version format details

---

**Skill Type:** Workflow Generator (no agency)  
**Returns:** `.github/workflows/tag.yml`  
**Used By:** 6 - Change & Release - DevOps Workflow Agent (when workflow_type = "tag")
