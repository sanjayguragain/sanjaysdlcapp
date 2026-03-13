---
name: sce-build-deploy-test-workflow-generator
description: Generates build-deploy-test.yml for non-production pipelines. Builds artifacts, deploys to a test environment, and runs integration/smoke tests. Supports app + infra (Bicep/Terraform) deploys. Returns .github/workflows/build-deploy-test.yml.
metadata:
  organization: SCE
  domain: devops-workflows
  category: workflow-generator
  workflow_type: build-deploy-test
---

# SCE Build-Deploy-Test Workflow Generator

## Overview
Creates an end-to-end pipeline for non-production: build → deploy to test env → run integration and smoke tests. Useful for PR validation or nightly builds.

## When to Use
- Validate deployments in test/staging before production
- Run integration tests against deployed artifacts
- Exercise infra + app together (app + Bicep/Terraform)

## What It Does
✅ Builds artifact/container  
✅ Deploys to test environment  
✅ Runs integration + smoke tests  
✅ Publishes test reports  
✅ Uses reusable workflows for build/deploy/test

## What It Doesn't Do
❌ Replace production deploy (see deploy generator)  
❌ Handle ITSM (typically not required for non-prod)  
❌ Replace unit tests (those run in build step)

## Generated Workflow (example)
```yaml
name: Build-Deploy-Test

on:
  workflow_dispatch:
  push:
    branches: [develop]

permissions:
  contents: write
  checks: read
  actions: read
  id-token: write

jobs:
  build:
    uses: EdisonInternational/actions/.github/workflows/build-dotnet.yml@v2
    with:
      PROJECT_PATH: src
      ARTIFACT_NAME: HelloWorld.WebApp
    secrets:
      NEXUS_USERNAME: ${{ secrets[vars.NEXUS_USERNAME] }}
      NEXUS_PASSWORD: ${{ secrets[vars.NEXUS_PASSWORD] }}

  deploy-test:
    uses: EdisonInternational/actions/.github/workflows/deploy-azure-app-service.yml@v2
    needs: build
    with:
      RESOURCE_GROUP: rg-hello-test
      APP_SERVICE_NAME: hello-test
      SLOT_NAME: staging
      PACKAGE_PATH: app.zip
    secrets:
      AZURE_CLIENT_ID: ${{ secrets[vars.AZURE_CLIENT_ID] }}
      AZURE_TENANT_ID: ${{ secrets[vars.AZURE_TENANT_ID] }}
      AZURE_SUBSCRIPTION_ID: ${{ secrets[vars.AZURE_SUBSCRIPTION_ID] }}

  integration-tests:
    uses: EdisonInternational/actions/.github/workflows/run-integration-tests.yml@v2
    needs: deploy-test
    with:
      TEST_ENDPOINT: https://hello-test.azurewebsites.net/health
      TEST_SUITE: regression
    secrets:
      GITHUB_TOKEN: ${{ secrets[vars.GITHUB_TOKEN] }}
```

## Key Inputs
- `TEST_ENV`: develop | staging  
- `DEPLOYMENT_TARGET`: aligns with deploy templates  
- `TEST_SUITE`: regression | smoke | custom  
- `TEST_ENDPOINT`: URL for health/smoke tests  
- Infra: Bicep/Terraform file + parameters (optional)

## Usage
```powershell
.\scripts\generate-build-deploy-test-workflow.ps1 `
  -ProjectMetadata project_metadata.json `
  -Requirements requirements.json `
  -OutputPath .github/workflows/build-deploy-test.yml
```

## Generation Steps
1) Select build template (language)  
2) Select deploy template (target, non-prod)  
3) Add integration test step/template  
4) Substitute endpoints, test suites, env names  
5) Validate with sce-workflow-validator  
6) Write .github/workflows/build-deploy-test.yml

## Validation Coverage
- YAML syntax  
- Version pinning (@v2)  
- Permissions (id-token for OIDC)  
- No hardcoded secrets (CREDENTIAL_SOURCE)  
- Required jobs: build, deploy-test, integration-tests

## References
- [Templates](templates/) - build/deploy/test templates  
- [Test Suites](references/test-suites.md) - recommended smoke/regression sets

---
**Skill Type:** Workflow Generator (no agency)  
**Returns:** .github/workflows/build-deploy-test.yml  
**Used By:** 6 - Change & Release - DevOps Workflow Agent (workflow_type = "build-deploy-test")
