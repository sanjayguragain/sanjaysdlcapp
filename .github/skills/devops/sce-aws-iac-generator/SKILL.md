---
name: sce-aws-iac-generator
description: Generates Infrastructure as Code for AWS deployments. Supports CDK (TypeScript), CloudFormation, Terraform, and SAM. Applies security defaults automatically including encryption, private subnets, least-privilege IAM, and secret management. Triggers when user asks to generate infrastructure code, CDK, CloudFormation, or Terraform for AWS. Returns IaC files with security checks.

compatibility:
  - 6 - Change & Release - AWS Deployment Agent
  - sce-aws-service-recommender
  - sce-aws-cost-estimator
metadata:
  organization: SCE
  domain: aws-deployment
  category: iac-generator
  source: awslabs/agent-plugins
  version: 1.0.0
  author: Agent Skills Team
  tags: aws, iac, cdk, cloudformation, terraform, infrastructure, deployment
  tools: read, search, edit, execute
---

# SCE AWS IaC Generator

## Overview

Generates Infrastructure as Code for AWS deployments based on approved service recommendations and cost estimates. Supports multiple IaC formats with security defaults applied automatically. Runs pre-deployment security scanning on generated templates.

Inspired by the generate step of the [awslabs/agent-plugins](https://github.com/awslabs/agent-plugins) deploy-on-aws plugin.

## When to Use

- After service recommendations and cost estimate are approved
- When user asks to generate CDK, CloudFormation, Terraform, or SAM code
- Creating AWS infrastructure definitions for an application
- Standardizing IaC patterns across projects

## What It Does

- Generates IaC in preferred format (default: CDK TypeScript)
- Applies security defaults automatically (encryption, private subnets, IAM)
- Creates VPC, compute, database, and supporting infrastructure
- Generates Dockerfiles if containerization needed
- Runs IaC security scanning (checkov, cfn-nag, cdk-nag)
- Creates deployment scripts with safety checks

## What It Doesn't Do

- Analyze codebases (see sce-aws-codebase-analyzer)
- Recommend services (see sce-aws-service-recommender)
- Estimate costs (see sce-aws-cost-estimator)
- Execute deployments (agent handles this step)
- Skip security defaults without explicit override

## Inputs

Requires:
- Service recommendations from `sce-aws-service-recommender`
- Cost estimate acknowledgment
- IaC format preference: CDK (default) | CloudFormation | Terraform | SAM
- Target environment: dev | staging | prod
- AWS region (default: us-east-1)
- Application name / project name

## Artifact Output (JSON-first)

```json
{
  "iac_output": {
    "format": "CDK TypeScript",
    "files_generated": [
      {
        "path": "infra/lib/app-stack.ts",
        "purpose": "Main application stack (VPC, Fargate, ALB, Aurora)"
      },
      {
        "path": "infra/bin/app.ts",
        "purpose": "CDK app entry point"
      },
      {
        "path": "infra/cdk.json",
        "purpose": "CDK configuration"
      },
      {
        "path": "infra/package.json",
        "purpose": "Node.js dependencies for CDK"
      },
      {
        "path": "infra/tsconfig.json",
        "purpose": "TypeScript configuration"
      },
      {
        "path": "Dockerfile",
        "purpose": "Application container definition"
      },
      {
        "path": "deploy.sh",
        "purpose": "Deployment script with safety checks"
      }
    ],
    "security_checks": {
      "tool": "cdk-nag",
      "passed": true,
      "findings": [],
      "suppressions": []
    },
    "deployment_commands": {
      "install": "cd infra && npm install",
      "synth": "cd infra && npx cdk synth",
      "deploy": "cd infra && npx cdk deploy --require-approval broadening",
      "destroy": "cd infra && npx cdk destroy"
    }
  }
}
```

## IaC Format Selection

| Default | Override Trigger |
|---|---|
| CDK TypeScript | "terraform" → Generate .tf files |
| | "cloudformation" → Generate YAML templates |
| | "sam" → Generate SAM template |
| | "cdk python" → Generate Python CDK |

**Why CDK TypeScript:** Most expressive, best IDE support, generates CloudFormation. TypeScript provides type safety without requiring Python/Java knowledge.

If repo already has `terraform/` or `cdk.json`, match existing choice.

## Security Defaults (Applied Automatically)

### Encryption

| Component | Dev | Prod |
|---|---|---|
| S3 buckets | SSE-S3 (AES-256) | SSE-KMS (customer-managed) |
| RDS/Aurora | Encrypted (AWS-managed key) | Encrypted (CMK) |
| EBS volumes | Encrypted | Encrypted |
| ALB | TLS 1.2+ only | TLS 1.2+ only |
| Secrets Manager | AWS-managed key | CMK |

### S3 Security

| Setting | Default |
|---|---|
| Block Public Access | Enabled (all 4 settings) |
| Bucket Policy | Deny by default |
| Object Ownership | Bucket owner enforced |
| Versioning | Enabled for production |

### VPC Placement

| Component | Dev | Prod |
|---|---|---|
| Fargate tasks | Private subnet + NAT Gateway | Private subnet + NAT Gateway |
| ALB | Public subnet | Public subnet |
| RDS/Aurora | Private subnet (no public IP) | Private subnet (no public IP) |
| Lambda | VPC-attached if DB access needed | VPC-attached if DB access needed |

### IAM

| Pattern | Default |
|---|---|
| Task/function roles | Least privilege (only resources explicitly used) |
| Service-linked roles | Use AWS-managed where available |
| Cross-service access | Via IAM roles, never access keys |
| Resource permissions | Enumerate specific ARNs, no wildcards |

### Security Groups

| Component | Inbound | Outbound |
|---|---|---|
| ALB | 443 from 0.0.0.0/0 | Fargate SG only |
| Fargate | ALB SG only (app port) | 443 (HTTPS), DB SG |
| RDS/Aurora | Fargate SG only (DB port) | None |
| Lambda (VPC) | None | 443, DB SG |

### Secrets Management

| Secret Type | Storage | Access Pattern |
|---|---|---|
| Database credentials | Secrets Manager | IAM role + GetSecretValue |
| API keys | Secrets Manager | IAM role + GetSecretValue |
| Config values (non-secret) | Parameter Store | IAM role + GetParameter |

**Never bake secrets into container images.**

## Generation Steps

1. Validate all inputs and approved architecture
2. Select IaC format (CDK TypeScript default or user override)
3. Generate VPC and networking resources
4. Generate compute resources (Fargate/Lambda/Amplify)
5. Generate database resources if needed
6. Generate storage resources (S3, Secrets Manager)
7. Generate load balancer and DNS configuration
8. Apply all security defaults
9. Generate Dockerfile if containerization needed
10. Generate deployment scripts with safety checks
11. Run IaC security scan (cdk-nag, checkov, cfn-nag)
12. Report any security findings
13. Return generated files list with deployment commands

## Pre-Deployment Security Scanning

### Secret Detection

Before deployment, scan for:
- Hardcoded credentials, API keys, tokens
- Connection strings with plain-text passwords
- Fail deployment if secrets detected in codebase

### IaC Security Scanning

| Tool | Purpose |
|---|---|
| cdk-nag | CDK-specific security checks via Aspects |
| cfn-nag | CloudFormation security linting |
| checkov | Multi-framework IaC scanner (CDK, CloudFormation, Terraform) |
| tfsec | Terraform security scanner |

MUST run `checkov` or `cfn-nag` on generated templates before deployment.

### Quality Gates

Before deployment, run:
1. Unit tests (if test suite exists)
2. Static code analysis (linters, type checkers)
3. IaC security scan
4. Secret detection scan

## Production Hardening

When user requests "production" or "prod", additionally enable:
- Multi-AZ for all stateful services
- VPC Flow Logs
- ALB Access Logs
- S3 Access Logs
- RDS Performance Insights
- AWS WAF on ALB (if public-facing web app)
- GuardDuty (recommend, don't auto-enable)
- Run checkov or cfn-nag before deployment

## Error Handling

### Unsupported Framework
- List detected framework
- State: "No AWS deployment pattern for [framework]"
- Suggest manual configuration or alternative approach

### Missing Dependencies
- Identify missing prerequisites (AWS CLI, CDK CLI, etc.)
- Provide installation instructions
- DO NOT continue without resolving dependencies

## Confidence Standard

Generated IaC is based on AWS best practices:
- `logprobs_available: false` → `status: needs_review`
- All generated code MUST pass security scanning before deployment
- User MUST review generated code before deployment

## Standards References

- `docs/standards/TECH_STACK_STANDARDS.md`
- `docs/standards/CONTEXT_PASSING_STANDARDS.md`
- `docs/standards/APPROVAL_REQUEST.md`
