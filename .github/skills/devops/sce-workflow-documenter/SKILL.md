---
name: sce-workflow-documenter
description: Generates documentation for generated workflows. Produces README.md (and optional CHANGELOG.md) describing triggers, jobs, permissions, secrets, and customization points. Returns docs for the workflows produced.
metadata:
  organization: SCE
  domain: devops-workflows
  category: utility
---

# SCE Workflow Documenter

## Overview
Creates human-readable documentation for generated workflows. Summarizes triggers, jobs, inputs, secrets, permissions, and how to customize.

## When to Use
- After generating workflows to explain how they work
- When handing off workflows to teams
- For compliance/audit artifacts

## What It Does
✅ Generates README.md per workflow  
✅ Documents triggers, jobs, required secrets, permissions  
✅ Lists customization points and parameters  
✅ Can generate CHANGELOG.md for workflow revisions

## What It Doesn't Do
❌ Generate workflows (uses outputs from generators)  
❌ Validate YAML (see validator)  
❌ Gather requirements

## Output (example README excerpt)
```markdown
# Build Workflow

- **Triggers:** push/pr on main, develop
- **Jobs:** build → nexus-upload
- **Permissions:** contents: write, actions: read, id-token: write
- **Secrets:** NEXUS_USERNAME (CREDENTIAL_SOURCE), NEXUS_PASSWORD
- **Inputs:** PROJECT_PATH, ARTIFACT_NAME, SBOM=true, ATTEST=true
- **Customization:** adjust DOTNET_VERSION, add test matrix
```

## Usage
```powershell
.\scripts\document-workflows.ps1 `
  -WorkflowFiles @('.github/workflows/build.yml', '.github/workflows/deploy.yml') `
  -OutputDir docs/workflows
```

## Generation Steps
1) Parse workflow YAML  
2) Extract triggers, jobs, permissions, secrets, with/inputs  
3) Render README.md via template  
4) Optional CHANGELOG.md for workflow versions

## Templates
- `workflow-readme.md.hbs` - main README template  
- `workflow-changelog.md.hbs` - optional changelog

## Validation
- Ensures required sections present  
- Warns if secrets are missing descriptions  
- Warns if permissions are broad (e.g., contents: write on PRs)

## References
- [Documentation Templates](templates/)  
- [Doc Fields](references/doc-fields.md)

---
**Skill Type:** Utility (no agency)  
**Returns:** README.md / CHANGELOG.md files  
**Used By:** 6 - Change & Release - DevOps Workflow Agent (final documentation step)
