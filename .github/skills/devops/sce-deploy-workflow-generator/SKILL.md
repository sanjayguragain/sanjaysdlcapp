---
name: sce-deploy-workflow-generator
description: Generates deploy.yml for production deployments with ITSM integration. Supports Azure App Service, Azure Container Apps, Azure Bicep IaC, and GCP Cloud Run. Includes change management, preflight checks, blue/green or slot strategies, and notifications. Returns .github/workflows/deploy.yml.
metadata:
  organization: SCE
  domain: devops-workflows
  category: workflow-generator
  workflow_type: deploy
---

# SCE Deploy Workflow Generator

## Overview
Creates production-ready deployment workflows with compliance controls (ITSM), preflight checks, and rollout strategies. Chooses the right deployment template based on target platform.

## When to Use
- Production deployments with change control
- Platform-specific deployments (App Service, Container Apps, Bicep, Cloud Run)
- Need for rollback/slot or blue/green strategies

## What It Does
✅ Generates `deploy.yml`  
✅ Selects platform-specific template  
✅ Adds ITSM change request + close  
✅ Runs preflight checks (health, approvals)  
✅ Supports slot/blue-green rollouts  
✅ Sends notifications

## What It Doesn't Do
❌ Build artifacts (see build generator)  
❌ Run integration tests (see build-deploy-test)  
❌ Choose targets itself (agent + requirements decide)

## Generated Workflow (example: Azure App Service)
```yaml
name: Deploy

on:
  workflow_dispatch:
  push:
    branches: [main]

permissions:
  contents: read
  actions: read
  id-token: write

jobs:
  nexus-download:
    uses: EdisonInternational/actions/.github/workflows/nexus-download.yml@v2

  deploy-preflight:
    uses: EdisonInternational/actions/.github/workflows/deploy-preflight.yml@v2
    with:
      ITSM_ENABLED: true
      ITSM_ENDPOINT: https://itsm.sce.com/api
      ENVIRONMENT: production

  deploy:
    uses: EdisonInternational/actions/.github/workflows/deploy-azure-app-service.yml@v2
    with:
      RESOURCE_GROUP: rg-hello-prod
      APP_SERVICE_NAME: hello-prod
      SLOT_NAME: blue
      PACKAGE_PATH: app.zip
    secrets:
      AZURE_CLIENT_ID: ${{ secrets[vars.AZURE_CLIENT_ID] }}
      AZURE_TENANT_ID: ${{ secrets[vars.AZURE_TENANT_ID] }}
      AZURE_SUBSCRIPTION_ID: ${{ secrets[vars.AZURE_SUBSCRIPTION_ID] }}

  deploy-complete:
    uses: EdisonInternational/actions/.github/workflows/deploy-complete.yml@v2
    with:
      ITSM_ENABLED: true
      ITSM_ENDPOINT: https://itsm.sce.com/api
      ENVIRONMENT: production
```

## Target Selection
- `azure-app-service` → deploy-azure-app-service.yml
- `azure-container-apps` → deploy-azure-container-apps.yml
- `azure-bicep` → deploy-azure-bicep.yml
- `gcp-cloud-run` → deploy-gcp-cloud-run.yml

## Rollout Strategies
- **Slot-based (App Service):** blue/green with slot swap
- **Blue/Green (Container Apps/Cloud Run):** traffic splitting
- **IaC (Bicep):** parameterized deployments

## Key Inputs
- `DEPLOYMENT_TARGET`: azure-app-service | azure-container-apps | azure-bicep | gcp-cloud-run
- `ENVIRONMENT`: production (default)  
- `ITSM_ENABLED`: true/false  
- `ITSM_ENDPOINT`: URL  
- Platform-specific: resource group, app name, slot, image/tag, bicep file, parameters

## Usage
```powershell
.\scripts\generate-deploy-workflow.ps1 `
  -ProjectMetadata project_metadata.json `
  -Requirements requirements.json `
  -OutputPath .github/workflows/deploy.yml
```

## Generation Steps
1) Pick deployment template via target  
2) Substitute placeholders (RG, app name, image/tag, ITSM)  
3) Include rollout strategy (slot or blue/green)  
4) Validate with sce-workflow-validator  
5) Write .github/workflows/deploy.yml

## Validation Coverage
- YAML syntax  
- Version pinning (@v2)  
- Permissions (id-token for OIDC)  
- ITSM steps present when enabled  
- No hardcoded secrets (CREDENTIAL_SOURCE pattern)

## References
- [Templates](templates/) - deployment templates  
- [Deployment Targets](references/deployment-targets.md) - supported target options

---
**Skill Type:** Workflow Generator (no agency)  
**Returns:** .github/workflows/deploy.yml  
**Used By:** 6 - Change & Release - DevOps Workflow Agent (workflow_type = "deploy")
