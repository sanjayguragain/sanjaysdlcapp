---
name: sce-azure-cost-estimator
description: Produces an Azure monthly cost estimate range for a proposed architecture (before IaC generation). Breaks costs down by service, highlights top cost drivers, and documents assumptions (region, hours, sizing). Use after Azure service recommendation and before generating Bicep/Terraform.

compatibility:
  - 6 - Change & Release - Azure Deployment Agent
  - sce-azure-service-recommender
metadata:
  organization: SCE
  domain: azure-deployment
  category: cost-estimation
  source: internal
  tags: azure, cost, estimation, finops
---

# SCE Azure Cost Estimator

## Overview

Generates an **estimate range** (not an exact bill) for a proposed Azure architecture. This is the required “cost gate” before IaC generation.

## When to Use

- After `sce-azure-service-recommender`
- Before handing off to Azure IaC Generator
- When user asks “how much will this cost on Azure?”

## What It Does

- Produces a per-service cost table (range)
- Identifies top cost drivers (compute tier, database tier, logs ingestion)
- States assumptions clearly (region, uptime, requests, storage)
- Provides cost reduction options (dev vs prod)

## What It Doesn’t Do

- Replace the AZQR subscription scan (use **AzqrCostOptimizeAgent** for existing subscription savings)
- Provide guaranteed pricing

## Inputs

- Architecture recommendations (services + sizing)
- Target environment: dev|staging|prod
- Region (default: user’s region or the repo standard)
- Basic usage assumptions:
  - Uptime (24/7 vs business hours)
  - Request volume / egress (rough)
  - Log ingestion level

## Output (JSON-first)

```json
{
  "cost_estimate": {
    "currency": "USD",
    "region": "",
    "environment": "dev",
    "monthly_total_range": "$X - $Y",
    "services": [
      {
        "service": "Azure Container Apps",
        "assumption": "0.5 vCPU, 1GiB, always-on",
        "monthly_range": "$X - $Y",
        "drivers": ["vCPU-seconds", "GiB-seconds", "requests"],
        "notes": "If scaled to zero, dev cost drops significantly"
      }
    ],
    "assumptions": [
      "Pricing varies by region",
      "Dev sizing unless user requests production",
      "Log Analytics ingestion can dominate costs"
    ],
    "top_cost_drivers": [
      "Database tier (vCores + storage)",
      "Always-on compute vs scale-to-zero",
      "Log Analytics ingestion + retention",
      "Egress bandwidth"
    ],
    "optimization_options": [
      "Use scale-to-zero where feasible",
      "Right-size database tier; start small for dev",
      "Set Log Analytics retention appropriately",
      "Avoid unnecessary NAT/Private Endpoints in dev"
    ]
  }
}
```

## Estimation Method (Deterministic)

1. List all services in the proposed architecture
2. For each service, identify the unit drivers (compute hours, vCores, GB-months, ingestion GB/day)
3. Produce a range using conservative and optimistic assumptions
4. Present the range and ask user to confirm before IaC

## Recommended Data Sources (If Available)

- Azure Pricing Calculator (manual input)
- Azure Retail Prices API (if user provides numbers / you have access)
- Existing subscription reality check via **AzqrCostOptimizeAgent** (orphaned resources, advisor)

## Presentation Format (for user)

MUST present:
- Per-service breakdown table
- Monthly total range
- 3–6 assumptions
- Top 3 cost drivers

## Standards References

- `docs/standards/CONTEXT_PASSING_STANDARDS.md`
- `docs/standards/TECH_STACK_STANDARDS.md`
