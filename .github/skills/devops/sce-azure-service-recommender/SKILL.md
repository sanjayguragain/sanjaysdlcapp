---
name: sce-azure-service-recommender
description: Recommends an Azure service architecture based on codebase analysis. Selects hosting (App Service, Container Apps, Functions, Static Web Apps), data (PostgreSQL Flexible Server, Cosmos DB), networking, identity, secrets, and observability defaults. Returns a concise recommendation table with rationale and explicit defaults/overrides.

compatibility:
  - 6 - Change & Release - Azure Deployment Agent
  - sce-azure-codebase-analyzer
  - sce-azure-cost-estimator
metadata:
  organization: SCE
  domain: azure-deployment
  category: recommender
  source: internal
  tags: azure, architecture, recommendation
---

# SCE Azure Service Recommender

## Overview

Maps analyzed app patterns to an Azure architecture with explicit defaults and override triggers.

## Defaults vs Overrides (Explicit)

Default environment: **dev** sizing unless user says “production”, “prod”, or “production-ready”.

## Service Selection Matrix

### Hosting / Compute

| App Pattern | Default | Override Trigger |
|---|---|---|
| Static site / SPA | Azure Static Web Apps | “needs advanced edge routing” → Front Door + Storage Static Website |
| Web app (long-running) | Azure Container Apps | “no containers / simplest PaaS” → App Service |
| API-only | Azure Container Apps | “serverless” → Functions (HTTP triggers) |
| Scheduled jobs | Azure Functions (Timer Trigger) | “long-running” → Container Apps Jobs |
| Background workers | Container Apps Jobs | “simple queue + low volume” → Functions + Queue trigger |

### Data

| Need | Default | Override Trigger |
|---|---|---|
| Relational (PostgreSQL) | Azure Database for PostgreSQL Flexible Server | “managed instance required” → SQL Managed Instance |
| Relational (MySQL) | Azure Database for MySQL Flexible Server | - |
| NoSQL document / multi-model | Cosmos DB | “strict relational” → PostgreSQL |
| Cache | Azure Cache for Redis | - |

### Identity / Secrets

| Concern | Default |
|---|---|
| App-to-Azure auth | Managed Identity |
| Secrets | Key Vault (reference from app configuration) |

### Observability

| Concern | Default |
|---|---|
| Logs/Metrics/APM | Application Insights + Log Analytics |

## Recommendation Output (JSON-first)

```json
{
  "azure_architecture": {
    "environment": "dev",
    "recommendations": [
      {
        "service": "Azure Container Apps",
        "purpose": "Host API container",
        "rationale": "Good default for containerized web apps without managing Kubernetes",
        "defaults": ["dev sizing", "managed ingress", "HTTPS"],
        "override": "Say 'App Service' to use App Service"
      }
    ],
    "cross_cutting": {
      "identity": "Managed Identity",
      "secrets": "Key Vault",
      "observability": "Application Insights",
      "networking": "Private networking only if required"
    }
  }
}
```

## Presentation Format (for user)

MUST present a table:

| Service | Purpose | Rationale |
|---|---|---|
| Static Web Apps | Host SPA | Built-in CI/CD + auth + global edge |

## Guardrails

- Do NOT recommend AKS by default. Only if user explicitly requests Kubernetes or needs advanced cluster features.
- Prefer Managed Identity + Key Vault over secrets in config.
- Prefer private endpoints only when required (cost/complexity tradeoff); clearly call it out.

## MCP / “More Info” Guidance

When decisions are uncertain, the orchestrator SHOULD use the Azure extension agents to gather data:
- Use **Azure IaC Exporter** when user has existing Azure resources to align with.
- Use **AzqrCostOptimizeAgent** to spot existing-cost quick wins (orphaned resources, advisor).
- Use **Azure IaC Generator** to validate that the recommended services have correct IaC patterns (Bicep schema, Terraform best practices).

## Standards References

- `docs/standards/TECH_STACK_STANDARDS.md`
- `docs/standards/CONTEXT_PASSING_STANDARDS.md`
