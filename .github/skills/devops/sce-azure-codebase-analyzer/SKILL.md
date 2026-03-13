---
name: sce-azure-codebase-analyzer
description: Scans application codebases to detect runtime, framework, app pattern (static site, API, background worker, scheduled jobs), containerization, and existing IaC. Produces deployment hints tailored for Azure hosting choices (App Service, Container Apps, Functions, Static Web Apps). Use before Azure service recommendation.

compatibility:
  - 6 - Change & Release - Azure Deployment Agent
  - sce-azure-service-recommender
metadata:
  organization: SCE
  domain: azure-deployment
  category: analyzer
  source: internal
  tags: azure, deployment, analysis, codebase
---

# SCE Azure Codebase Analyzer

## Overview

Scans a repository to identify the application pattern and tech stack signals that drive Azure hosting choices.

This skill is intentionally **Azure-deployment focused** (it does not replace your broader tech inventory analyzers).

## When to Use

- Before recommending Azure services
- When user says “deploy/host this on Azure”
- When deciding between App Service vs Container Apps vs Functions vs Static Web Apps

## What It Does

- Detects language/runtime and major framework
- Infers app pattern:
  - Static site / SPA
  - Web app (long-running)
  - API-only
  - Background worker
  - Scheduled jobs
- Detects containerization (Dockerfile, compose)
- Detects existing IaC (Bicep/ARM/Terraform/Pulumi)
- Detects database dependencies and whether stateful services are required

## What It Doesn’t Do

- Recommend Azure services (see `sce-azure-service-recommender`)
- Estimate costs (see `sce-azure-cost-estimator`)
- Generate IaC (use Azure IaC Generator agent)

## Artifact Output (JSON-first)

```json
{
  "project_analysis": {
    "language": {"primary": "", "version": ""},
    "framework": {"name": "", "type": ""},
    "app_pattern": "static-site|spa|web-app|api-only|worker|scheduled",
    "containerization": {"dockerfile": false, "compose": false},
    "datastores": [{"type": "postgres|mysql|mongo|redis|cosmos|none", "evidence": []}],
    "existing_iac": {"type": "bicep|arm|terraform|pulumi|none", "files": []},
    "deployment_hints": {
      "prefers_serverless": false,
      "needs_private_network": false,
      "needs_background_jobs": false,
      "needs_websocket": false
    }
  }
}
```

## Detection Signals (Non-Exhaustive)

### Azure-Friendly App Pattern Heuristics

- **Static / SPA**: `package.json` contains `react|vue|angular|next|nuxt`, and build output like `dist/` or `build/`
- **Web app / API**: server entrypoints (FastAPI/Uvicorn, Flask/Gunicorn, Express, ASP.NET, Spring Boot)
- **Scheduled jobs**: cron-like libs, `celery beat`, `apscheduler`, `@nestjs/schedule`, or workflow schedulers
- **Worker**: queue libs (`celery`, `bullmq`, `sidekiq`), background processing patterns

### Existing IaC

- `*.bicep` → Bicep
- `azuredeploy.json` / ARM templates → ARM
- `*.tf` / `terraform/` → Terraform
- `Pulumi.yaml` / `Pulumi.<stack>.yaml` → Pulumi

## Output Usage

The analyzer output is the only allowed input to `sce-azure-service-recommender`.

## Standards References

- `docs/standards/TECH_STACK_STANDARDS.md`
- `docs/standards/CONTEXT_PASSING_STANDARDS.md`
