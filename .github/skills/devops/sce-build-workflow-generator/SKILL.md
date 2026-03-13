---
name: sce-build-workflow-generator
description: Generates build.yml workflow for building artifacts and publishing to Nexus (or container registry). Supports .NET, Java (Maven/Gradle), Python, and Node.js builds. Adds SBOM and attestations when requested. Returns .github/workflows/build.yml.
metadata:
  organization: SCE
  domain: devops-workflows
  category: workflow-generator
  workflow_type: build
---

# SCE Build Workflow Generator

## Overview
Generates a reusable build workflow that compiles code, runs unit tests, and publishes artifacts to Nexus or a container registry. Selects the right template based on detected language and build tool.

## When to Use
- Build artifacts for release or deployment
- Standardize build across services
- Produce SBOMs/attestations for supply-chain controls

## What It Does
✅ Selects language-specific build template  
✅ Runs unit tests and code coverage  
✅ Builds artifacts or container images  
✅ Publishes to Nexus/registry  
✅ (Optional) SBOM + attestations

## What It Doesn't Do
❌ Deploy artifacts (see deploy/build-deploy-test generators)  
❌ Replace quality gates (see check generator)  
❌ Gather requirements (see requirements-gatherer)

## Generated Workflow (example: .NET)
```yaml
name: Build

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

permissions:
  contents: write
  checks: read
  actions: read
  attestations: write
  id-token: write

jobs:
  build:
    uses: EdisonInternational/actions/.github/workflows/build-dotnet.yml@v2
    with:
      PROJECT_PATH: src
      ARTIFACT_NAME: HelloWorld.WebApp
      DOTNET_VERSION: 8.0.x
      PUBLISH_ARTIFACT: true
      SBOM: true
      ATTEST: true
    secrets:
      NEXUS_USERNAME: ${{ secrets[vars.NEXUS_USERNAME] }}
      NEXUS_PASSWORD: ${{ secrets[vars.NEXUS_PASSWORD] }}
      GITHUB_TOKEN: ${{ secrets[vars.GITHUB_TOKEN] }}
```

## Language Selection
- **dotnet:** build-dotnet.yml
- **java + maven:** build-java-maven.yml
- **java + gradle:** build-java-gradle.yml (template to add)
- **python:** build-python.yml
- **node:** build-node.yml (template to add)

## Key Inputs (examples)
- `PROJECT_PATH`: source directory
- `ARTIFACT_NAME`: output artifact name
- `BUILD_TOOL`: dotnet | maven | gradle | pip | npm
- `DOCKER_IMAGE`: optional image name (if building container)
- `SBOM`: true/false
- `ATTEST`: true/false

## Usage
```powershell
.\scripts\generate-build-workflow.ps1 `
  -ProjectMetadata project_metadata.json `
  -Requirements requirements.json `
  -OutputPath .github/workflows/build.yml
```

## Generation Steps
1) Pick template via language/build tool  
2) Substitute placeholders (paths, artifact, versions)  
3) Enable SBOM/attest if requested  
4) Validate with sce-workflow-validator  
5) Write .github/workflows/build.yml

## Validation Coverage
- YAML syntax
- Version pinning (@v2)
- Required permissions (id-token for OIDC, attestations)  
- No hardcoded secrets (CREDENTIAL_SOURCE pattern)

## References
- [Templates](templates/) - language-specific build templates  
- [Build Inputs](references/build-inputs.md) - required/optional inputs

---
**Skill Type:** Workflow Generator (no agency)  
**Returns:** .github/workflows/build.yml  
**Used By:** 6 - Change & Release - DevOps Workflow Agent (workflow_type = "build")
