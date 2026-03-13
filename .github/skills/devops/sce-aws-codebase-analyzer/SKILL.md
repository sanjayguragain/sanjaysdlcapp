---
name: sce-aws-codebase-analyzer
description: Scans application codebases to detect language, framework, database dependencies, static assets, and existing IaC. Returns structured project analysis for AWS deployment planning. Triggers when analyzing a project for AWS deployment, hosting, or architecture recommendations. Use before recommending AWS services.

compatibility:
  - 6 - Change & Release - AWS Deployment Agent
  - sce-aws-service-recommender
metadata:
  organization: SCE
  domain: aws-deployment
  category: analyzer
  source: awslabs/agent-plugins
  version: 1.0.0
  author: Agent Skills Team
  tags: aws, deployment, analysis, codebase, infrastructure
  tools: read, search, execute
---

# SCE AWS Codebase Analyzer

## Overview

Scans any application codebase to detect technology stack, framework, database dependencies, static assets, and existing infrastructure configuration. Produces a structured analysis report used by downstream AWS deployment skills.

Inspired by the analyze step of the [awslabs/agent-plugins](https://github.com/awslabs/agent-plugins) deploy-on-aws plugin.

## When to Use

- Before recommending AWS services for an application
- Analyzing a new project for AWS deployment readiness
- Detecting tech stack to determine optimal AWS architecture
- Checking if existing IaC (CDK, Terraform, CloudFormation) is present

## What It Does

- Detects primary language and version
- Identifies web framework (Django, Flask, FastAPI, Express, React, Angular, etc.)
- Discovers database dependencies (PostgreSQL, MySQL, MongoDB, Redis, etc.)
- Finds static assets and SPA configurations
- Detects existing IaC files (cdk.json, terraform/, template.yaml, etc.)
- Identifies container configuration (Dockerfile, docker-compose)
- Discovers test suites and CI/CD configurations
- Produces structured JSON analysis report

## What It Doesn't Do

- Recommend AWS services (see sce-aws-service-recommender)
- Estimate costs (see sce-aws-cost-estimator)
- Generate IaC code (see sce-aws-iac-generator)
- Modify or fix any code

## Artifact Output (JSON-first)

```json
{
  "project_analysis": {
    "language": {
      "primary": "python",
      "version": "3.11",
      "secondary": []
    },
    "framework": {
      "name": "FastAPI",
      "type": "web-framework",
      "pattern": "api-only"
    },
    "databases": [
      {
        "type": "PostgreSQL",
        "connection_pattern": "SQLAlchemy",
        "version_detected": null
      }
    ],
    "static_assets": {
      "present": false,
      "spa": false,
      "build_tool": null
    },
    "containerization": {
      "dockerfile": true,
      "docker_compose": true,
      "base_image": "python:3.11-slim"
    },
    "existing_iac": {
      "type": null,
      "files": []
    },
    "tests": {
      "framework": "pytest",
      "test_directory": "tests/",
      "coverage_configured": true
    },
    "ci_cd": {
      "platform": "github-actions",
      "workflows": [".github/workflows/build.yml"]
    },
    "deployment_hints": {
      "app_pattern": "web-framework",
      "needs_database": true,
      "needs_static_hosting": false,
      "long_running": true,
      "background_workers": false
    }
  }
}
```

## Detection Patterns

### Language Detection

| File/Pattern | Language |
|---|---|
| `requirements.txt`, `pyproject.toml`, `setup.py`, `Pipfile` | Python |
| `package.json` | Node.js / JavaScript / TypeScript |
| `*.csproj`, `*.sln`, `global.json` | .NET |
| `pom.xml`, `build.gradle`, `build.gradle.kts` | Java |
| `go.mod` | Go |
| `Gemfile` | Ruby |
| `Cargo.toml` | Rust |

### Framework Detection

| Pattern | Framework | App Type |
|---|---|---|
| `fastapi` in requirements | FastAPI | web-framework / api-only |
| `flask` in requirements | Flask | web-framework |
| `django` in requirements | Django | web-framework |
| `express` in package.json | Express.js | web-framework |
| `react` in package.json | React | SPA |
| `next` in package.json | Next.js | SSR / SPA |
| `angular` in package.json | Angular | SPA |
| `vue` in package.json | Vue.js | SPA |
| `rails` in Gemfile | Ruby on Rails | web-framework |
| Static HTML only | Static Site | static-site |

### Database Detection

| Pattern | Database |
|---|---|
| `psycopg2`, `asyncpg`, `sqlalchemy+postgresql` | PostgreSQL |
| `mysql-connector`, `pymysql`, `sqlalchemy+mysql` | MySQL |
| `pymongo`, `motor` | MongoDB |
| `redis`, `aioredis` | Redis |
| `boto3` + DynamoDB usage | DynamoDB |

### Existing IaC Detection

| File/Directory | IaC Type |
|---|---|
| `cdk.json`, `cdk/` | AWS CDK |
| `terraform/`, `*.tf` | Terraform |
| `template.yaml`, `template.json` | CloudFormation / SAM |
| `serverless.yml` | Serverless Framework |
| `amplify.yml` | AWS Amplify |

## Workflow Steps

1. Scan root directory for language-identifying files
2. Parse dependency files for framework and library detection
3. Check for database connection strings and ORM configurations
4. Scan for static assets directories (public/, static/, build/, dist/)
5. Check for existing IaC files
6. Detect containerization setup
7. Identify test configuration
8. Check CI/CD pipeline configuration
9. Compile deployment hints based on all findings
10. Return structured JSON report

## Confidence Standard

All detection results MUST include confidence based on available evidence:
- `logprobs_available: false` → `status: needs_review` (require verification)
- Detection is evidence-based: file existence and content matching

## Standards References

- `docs/standards/TECH_STACK_STANDARDS.md`
- `docs/standards/CONTEXT_PASSING_STANDARDS.md`
