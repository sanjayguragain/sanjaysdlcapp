---
name: sce-aws-cost-estimator
description: Estimates monthly AWS costs for recommended service architectures. Provides per-service breakdowns, monthly totals, and key assumptions. Triggers when user asks to estimate AWS costs, get pricing, or understand deployment expenses. MUST present costs before IaC generation. Returns cost estimate report.
compatibility:
  - 6 - Change & Release - AWS Deployment Agent
  - sce-aws-service-recommender
  - sce-aws-iac-generator
metadata:
  organization: SCE
  domain: aws-deployment
  category: cost-estimation
  source: awslabs/agent-plugins
  version: 1.0.0
  author: Agent Skills Team
  tags: aws, cost-estimation, pricing, deployment, budget
  tools: read, search, web
---

# SCE AWS Cost Estimator

## Overview

Estimates monthly AWS costs for a recommended service architecture. Provides per-service breakdowns, monthly totals, key assumptions, and cost optimization tips. MUST be called before IaC generation so users can adjust architecture before committing.

Inspired by the estimate step of the [awslabs/agent-plugins](https://github.com/awslabs/agent-plugins) deploy-on-aws plugin.

## When to Use

- After AWS services have been recommended
- When user asks "how much will this cost on AWS?"
- Before generating IaC code (MANDATORY step)
- When comparing cost of different architecture options
- Evaluating dev vs production cost differences

## What It Does

- Calculates per-service monthly estimates
- Shows total monthly cost with clear assumptions
- Provides dev vs production cost comparison
- Highlights cost optimization opportunities
- Presents estimated costs in table format
- Includes free tier eligibility notes

## What It Doesn't Do

- Query live AWS pricing APIs (uses reference pricing patterns)
- Guarantee exact costs (estimates only)
- Generate IaC code (see sce-aws-iac-generator)
- Recommend services (see sce-aws-service-recommender)
- Deploy anything

## Inputs

Requires output from `sce-aws-service-recommender`:
- List of recommended services with sizing
- Target environment (dev | staging | prod)
- AWS region (default: us-east-1)
- Usage assumptions (optional - hours/day, requests/month)

## Artifact Output (JSON-first)

```json
{
  "cost_estimate": {
    "region": "us-east-1",
    "environment": "dev",
    "currency": "USD",
    "monthly_total": "$85-110",
    "services": [
      {
        "service": "AWS Fargate",
        "sizing": "0.5 vCPU, 1GB, 24/7",
        "monthly_estimate": "$18",
        "calculation": "0.5 vCPU × $0.04048/hr × 730hrs + 1GB × $0.004445/hr × 730hrs",
        "free_tier": false
      },
      {
        "service": "Aurora Serverless v2 (PostgreSQL)",
        "sizing": "0.5-2 ACU",
        "monthly_estimate": "$45-90",
        "calculation": "0.5 ACU minimum × $0.12/ACU-hr × 730hrs = $43.80 base",
        "free_tier": false
      },
      {
        "service": "Application Load Balancer",
        "sizing": "Standard",
        "monthly_estimate": "$16-22",
        "calculation": "$0.0225/hr × 730hrs + LCU charges",
        "free_tier": "12 months, 750 hrs/month"
      },
      {
        "service": "S3",
        "sizing": "< 5GB",
        "monthly_estimate": "$0.12",
        "calculation": "$0.023/GB for first 50TB",
        "free_tier": "5GB, 12 months"
      },
      {
        "service": "Secrets Manager",
        "sizing": "2-3 secrets",
        "monthly_estimate": "$1.20",
        "calculation": "$0.40/secret/month",
        "free_tier": false
      },
      {
        "service": "NAT Gateway",
        "sizing": "Single AZ",
        "monthly_estimate": "$32",
        "calculation": "$0.045/hr × 730hrs + data processing",
        "free_tier": false
      }
    ],
    "assumptions": [
      "24/7 uptime for compute services",
      "us-east-1 pricing",
      "Dev sizing (minimal resources)",
      "Moderate data transfer (<10GB/month)"
    ],
    "optimization_tips": [
      "Use Fargate Spot for dev environments (up to 70% savings)",
      "Aurora Serverless v2 scales to near-zero during idle periods",
      "Consider NAT Gateway alternatives (VPC endpoints) for AWS-only traffic",
      "Free tier covers ALB for first 12 months"
    ],
    "production_comparison": {
      "monthly_total": "$250-450",
      "key_differences": [
        "Multi-AZ deployment (+$50-100)",
        "Larger Fargate tasks: 1 vCPU, 2GB (+$20)",
        "Aurora 2-8 ACU range (+$100-200)",
        "Additional monitoring and logging (+$20-50)"
      ]
    }
  }
}
```

Markdown companion for user presentation:

```markdown
## Monthly Cost Estimate (Dev - us-east-1)

| Service | Sizing | Monthly Est. | Notes |
|---|---|---|---|
| Fargate | 0.5 vCPU, 1GB | $18 | 24/7 uptime |
| Aurora Serverless v2 | 0.5-2 ACU | $45-90 | Scales with usage |
| ALB | Standard | $16-22 | Free tier eligible |
| NAT Gateway | Single AZ | $32 | Data processing extra |
| S3 | < 5GB | $0.12 | Free tier eligible |
| Secrets Manager | 3 secrets | $1.20 | |
| **TOTAL** | | **$85-110/month** | |

### Assumptions
- 24/7 uptime, us-east-1, dev sizing, <10GB data transfer

### Cost Optimization Tips
- Use Fargate Spot for dev (up to 70% savings)
- NAT Gateway is single biggest cost - consider VPC endpoints
```

## Quick Reference Estimates

**Small web app (Fargate + Aurora Serverless v2 + ALB):**
- Dev: ~$70-100/month
- Production: ~$200-400/month

**Static site / SPA (Amplify Hosting):**
- Low traffic: ~$0-5/month (free tier covers most small sites)
- High traffic: ~$15-40/month

**Static site (S3 + CloudFront):**
- Low traffic: ~$1-5/month
- High traffic: ~$20-50/month

**Serverless API (Lambda + API Gateway + DynamoDB):**
- Low traffic: ~$5-20/month
- High traffic: scales with requests

## AWS Service Pricing Codes

| Service | Code | Notes |
|---|---|---|
| Fargate | AmazonECS | Filter by usagetype containing "Fargate" |
| Aurora PostgreSQL | AmazonRDS | Filter: databaseEngine = "Aurora PostgreSQL" |
| ALB | AWSELB | Application Load Balancer |
| S3 | AmazonS3 | Storage and requests |
| CloudFront | AmazonCloudFront | CDN distribution |
| Amplify | AWSAmplify | Hosting, build minutes |
| Lambda | AWSLambda | Requests and duration |
| DynamoDB | AmazonDynamoDB | On-demand or provisioned |
| Secrets Manager | AWSSecretsManager | Per secret per month |

## Presenting Estimates

MUST always show:
1. Per-service breakdown with sizing
2. Monthly total range
3. Key assumptions (uptime, region, sizing tier)
4. Cost optimization tips if relevant
5. Production comparison if user may scale

## Confidence Standard

Cost estimates are approximations:
- `logprobs_available: false` → `status: needs_review`
- All estimates based on published AWS pricing as of knowledge cutoff
- Actual costs vary with usage patterns

## Standards References

- `docs/standards/CONTEXT_PASSING_STANDARDS.md`
- `docs/standards/TECH_STACK_STANDARDS.md`
