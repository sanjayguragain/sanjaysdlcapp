---
name: sce-release-notes-workflow-generator
description: Generates release-notes.yml to automate changelog creation and publication. Categorizes PRs, formats release notes, and can create GitHub releases. Returns .github/workflows/release-notes.yml.
metadata:
  organization: SCE
  domain: devops-workflows
  category: workflow-generator
  workflow_type: release-notes
---

# SCE Release Notes Workflow Generator

## Overview
Automates release note generation by aggregating merged PRs, categorizing changes (features, fixes, breaking), and optionally publishing GitHub releases.

## When to Use
- Need automated changelog per release/tag
- Want consistent release note format
- Combine with tag/build/deploy workflows

## What It Does
✅ Generates `release-notes.yml`  
✅ Groups PRs by labels (feature, fix, breaking)  
✅ Uses templates for release body  
✅ Can publish GitHub release  
✅ Posts notes to destinations (repo releases, optional wiki/share)

## What It Doesn't Do
❌ Create semantic version tags (see tag generator)  
❌ Build artifacts (see build generator)  
❌ Deploy artifacts (see deploy generator)

## Generated Workflow
```yaml
name: Release Notes

on:
  workflow_dispatch:
  push:
    tags:
      - "v*"

permissions:
  contents: write
  actions: read

jobs:
  release-notes:
    uses: EdisonInternational/actions/.github/workflows/release-notes.yml@v2
    with:
      CATEGORIES: |
        - title: Features
          labels: [feature, enhancement]
        - title: Fixes
          labels: [fix, bug]
        - title: Breaking Changes
          labels: [breaking]
      INCLUDE_AUTHOR: true
      INCLUDE_PR_LINK: true
      PUBLISH_GITHUB_RELEASE: true
      RELEASE_NAME_TEMPLATE: "Release {{TAG}}"
    secrets:
      GITHUB_TOKEN: ${{ secrets[vars.GITHUB_TOKEN] }}
```

## Configuration Options
- `CATEGORIES`: label → section mapping  
- `PUBLISH_GITHUB_RELEASE`: true/false  
- `RELEASE_NAME_TEMPLATE`: string with `{{TAG}}`  
- `INCLUDE_AUTHOR`: true/false  
- `INCLUDE_PR_LINK`: true/false

## Usage
```powershell
.\scripts\generate-release-notes-workflow.ps1 `
  -ProjectMetadata project_metadata.json `
  -Requirements requirements.json `
  -OutputPath .github/workflows/release-notes.yml
```

## Generation Steps
1) Fetch template from sce-template-manager  
2) Map labels → categories from requirements  
3) Set publish/release flags  
4) Validate via sce-workflow-validator  
5) Write .github/workflows/release-notes.yml

## Validation Coverage
- YAML syntax  
- Version pinning (@v2)  
- Required permissions (contents: write)  
- No hardcoded secrets

## References
- [Template](templates/release-notes.yml)  
- [Category Mapping](references/category-mapping.md)

---
**Skill Type:** Workflow Generator (no agency)  
**Returns:** .github/workflows/release-notes.yml  
**Used By:** 6 - Change & Release - DevOps Workflow Agent (workflow_type = "release-notes")
