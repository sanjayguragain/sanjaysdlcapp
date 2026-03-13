---
name: sce-aws-service-recommender
description: Recommends optimal AWS services based on codebase analysis. Maps detected frameworks, databases, and app patterns to AWS services with concise rationale. Triggers when user asks for AWS architecture recommendations, service selection, or deployment planning. Returns service recommendation table with rationale.

compatibility:
  - 6 - Change & Release - AWS Deployment Agent
  - sce-aws-codebase-analyzer
  - sce-aws-cost-estimator
metadata:
  organization: SCE
  domain: aws-deployment
  category: recommender
  source: awslabs/agent-plugins
  version: 1.0.0
  author: Agent Skills Team
  tags: aws, architecture, service-selection, deployment, recommendation
  tools: read, search
---

# SCE AWS Service Recommender

## Overview

Recommends optimal AWS services based on codebase analysis output. Maps detected app patterns to AWS services following opinionated defaults. Provides concise rationale for each choice.

Inspired by the recommend step of the [awslabs/agent-plugins](https://github.com/awslabs/agent-plugins) deploy-on-aws plugin.

## When to Use

- After codebase analysis, to select AWS services
- When user asks "what AWS services should I use?"
- Planning AWS architecture for an application
- Comparing deployment options (Fargate vs Lambda, etc.)

## What It Does

- Maps app patterns to AWS compute services
- Selects database services based on detected dependencies
- Recommends storage, networking, and security services
- Provides 1-sentence rationale per service choice
- Handles environment sizing (dev vs production)
- Respects user overrides ("serverless", "simple RDS", etc.)

## What It Doesn't Do

- Analyze codebases (see sce-aws-codebase-analyzer)
- Estimate costs (see sce-aws-cost-estimator)
- Generate IaC code (see sce-aws-iac-generator)

## Inputs

Requires output from `sce-aws-codebase-analyzer`:
- `deployment_hints.app_pattern`: web-framework | spa | static-site | api-only | worker | scheduled
- `deployment_hints.needs_database`: true/false
- `databases[].type`: PostgreSQL | MySQL | MongoDB | Redis | DynamoDB
- `deployment_hints.needs_static_hosting`: true/false
- `existing_iac.type`: CDK | Terraform | CloudFormation | null
- User environment target: dev | staging | prod
- User overrides (optional): "serverless", "simple RDS", "S3+CloudFront", "terraform"

## Artifact Output (JSON-first)

```json
{
  "service_recommendations": {
    "environment": "dev",
    "services": [
      {
        "category": "compute",
        "service": "AWS Fargate",
        "purpose": "Run FastAPI application containers",
        "rationale": "Web frameworks expect long-running processes; Fargate provides natural fit without Lambda cold starts or WSGI adapters",
        "sizing": "0.5 vCPU, 1GB memory",
        "override_available": "Say 'serverless' for Lambda + API Gateway"
      },
      {
        "category": "load-balancer",
        "service": "Application Load Balancer",
        "purpose": "Route HTTPS traffic to Fargate tasks",
        "rationale": "ALB provides path-based routing, health checks, and TLS termination",
        "sizing": "Single AZ (dev)",
        "override_available": null
      },
      {
        "category": "database",
        "service": "Aurora Serverless v2 (PostgreSQL)",
        "purpose": "Managed PostgreSQL with auto-scaling",
        "rationale": "Scales to near-zero in dev (0.5 ACU minimum), automatic scaling for production",
        "sizing": "0.5-2 ACU",
        "override_available": "Say 'simple RDS' for standard RDS instance"
      }
    ],
    "security_services": [
      "Secrets Manager (database credentials)",
      "Parameter Store (application config)",
      "ACM (TLS certificates)"
    ],
    "networking": {
      "vpc": "Single-AZ VPC with public + private subnets (dev)",
      "nat_gateway": "Single NAT Gateway",
      "security_groups": "Deny-by-default, per-component rules"
    }
  }
}
```

Markdown companion table for user presentation:

```markdown
| Service | Purpose | Rationale |
|---|---|---|
| Fargate + ALB | Run web application | Framework expects long-running process |
| Aurora Serverless v2 | Managed PostgreSQL | Scales to near-zero in dev |
| S3 | Static assets | Low-cost object storage |
| Secrets Manager | Store credentials | Automatic rotation, audit logging |
```

## Service Selection Matrix

### Compute

| App Pattern | Default | Why | Override |
|---|---|---|---|
| Web framework (Django, Rails, Express, FastAPI) | Fargate + ALB | Long-running process, no cold starts | "serverless" → Lambda + API Gateway |
| Static site / SPA | Amplify Hosting | Auto CI/CD, HTTPS, CDN built-in | "S3" → S3 + CloudFront |
| Background workers | Fargate | Persistent process | Short tasks → Lambda |
| Scheduled jobs | EventBridge + Lambda | Cost-effective for periodic tasks | Long-running → EventBridge + Fargate |
| API-only (no web UI) | Fargate + ALB | Consistent with web pattern | "serverless" → API Gateway + Lambda |

### Database

| Data Pattern | Default (Dev) | Default (Prod) | Override |
|---|---|---|---|
| PostgreSQL | Aurora Serverless v2 | Aurora Serverless v2 | "simple RDS" → RDS |
| MySQL | Aurora Serverless v2 | Aurora Serverless v2 | "simple RDS" → RDS |
| NoSQL / Key-Value | DynamoDB | DynamoDB | - |
| Redis / Caching | ElastiCache Serverless | ElastiCache Serverless | - |

### Storage

| Pattern | Default |
|---|---|
| Static assets | S3 |
| User uploads | S3 |
| Secrets | Secrets Manager |
| Config values | Parameter Store |

### IaC Format

| Default | Override |
|---|---|
| CDK (TypeScript) | "terraform" → Terraform |
| | "cloudformation" → CloudFormation YAML |
| | "sam" → SAM |

If repo already has `terraform/` or `cdk.json`, match existing choice.

## Decision Principles

- Pick the **obvious** choice. Don't ask "Lambda or Fargate?" when framework type makes it clear
- Default to **dev sizing** (cost-conscious) unless user says "production"
- Concisely explain **why** each service was chosen (1 sentence max)
- If genuinely ambiguous, **then ask** the user
- Respect existing IaC tool choice if detected in codebase

## Confidence Standard

All recommendations MUST include evidence-based justification:
- `logprobs_available: false` → `status: needs_review`
- Each service choice tied to specific detection evidence

## Standards References

- `docs/standards/TECH_STACK_STANDARDS.md`
- `docs/standards/CONTEXT_PASSING_STANDARDS.md`
