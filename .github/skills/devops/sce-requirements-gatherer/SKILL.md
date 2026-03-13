---
name: sce-requirements-gatherer
description: Interactively gathers workflow requirements from user through guided questions. Asks about workflow types needed (tag, check, build, deploy, test, release-notes), deployment targets, authentication methods, and ITSM integration. Returns requirements JSON. Use after project analysis to understand user needs.
metadata:
  organization: SCE
  domain: devops-workflows
  category: utility
---

# SCE Requirements Gatherer

## Overview

Guides users through interactive questions to gather requirements for workflow generation. Returns structured requirements JSON used by workflow generators.

## When to Use

- **After project analysis** - Know tech stack, now ask what workflows needed
- **User unsure what they need** - Provide guided choices
- **Multi-workflow scenarios** - Help user select multiple workflows

## What It Does

✅ Asks which workflows user needs (tag, check, build, deploy, etc.)  
✅ Questions about deployment targets (Azure, GCP, K8s)  
✅ Authentication method preferences (OIDC, managed identity)  
✅ ITSM integration requirements  
✅ Environment configurations (dev, test, prod)  
✅ Returns structured requirements JSON

## What It Doesn't Do

❌ Generate workflows (that's workflow-generator skills)  
❌ Detect project structure (that's workflow-analyzer)  
❌ Validate answers (that's workflow-validator)

## Question Flow

### 1. Workflow Type Selection
```
Question: "Which workflows do you need?"

Options:
1. Tag (semantic versioning)
2. Check (quality gates - SonarQube, CodeQL)
3. Build (artifact building + Nexus upload)
4. Deploy (production deployment with ITSM)
5. Build-Deploy-Test (non-production pipeline)
6. Release Notes (automated release documentation)
7. All of the above

User Selection: [1, 3, 4]  # Tag + Build + Deploy

Result:
{
  "workflow_types": ["tag", "build", "deploy"]
}
```

### 2. Deployment Target (if deploy selected)
```
Question: "Where will you deploy?"

Options:
1. Azure App Service
2. Azure Container Apps
3. Azure Bicep (IaC)
4. GCP Cloud Run
5. Kubernetes
6. Other

User Selection: [1]  # Azure App Service

Result:
{
  "deployment_target": "azure-app-service"
}
```

### 3. Authentication Method
```
Question: "Preferred authentication method?"

Options:
1. OIDC (OpenID Connect) - Recommended, no secrets
2. Managed Identity (Azure only)
3. Service Principal with secrets
4. Key Vault reference

User Selection: [1]  # OIDC

Result:
{
  "auth_method": "oidc",
  "azure_client_id": "<prompted for client-id>"
}
```

### 4. ITSM Integration
```
Question: "Enable ITSM change management for production?"

Options:
1. Yes (required for production compliance)
2. No (non-production only)

User Selection: [1]  # Yes

Result:
{
  "itsm_enabled": true,
  "itsm_endpoint": "<prompted for endpoint>"
}
```

### 5. Nexus Repository (if build selected)
```
Question: "Nexus repository for artifacts?"

Default: https://nexus.sce.com/repository/maven-releases

User Input: <accepts default or provides custom>

Result:
{
  "nexus_repository": "https://nexus.sce.com/repository/maven-releases",
  "nexus_credentials_source": "CREDENTIAL_SOURCE"
}
```

### 6. Environments
```
Question: "Which environments?"

Options:
1. develop (dev/test)
2. staging (pre-production)
3. production
4. All

User Selection: [1, 3]  # develop + production

Result:
{
  "environments": ["develop", "production"]
}
```

## Complete Requirements Output

```json
{
  "workflow_types": ["tag", "check", "build", "deploy"],
  "deployment_target": "azure-app-service",
  "auth_method": "oidc",
  "azure_client_id": "12345678-1234-1234-1234-123456789abc",
  "itsm_enabled": true,
  "itsm_endpoint": "https://itsm.sce.com/api",
  "nexus_repository": "https://nexus.sce.com/repository/maven-releases",
  "nexus_credentials_source": "CREDENTIAL_SOURCE",
  "environments": ["develop", "production"],
  "notifications": {
    "slack_enabled": true,
    "slack_webhook": "CREDENTIAL_SOURCE"
  },
  "additional_settings": {
    "docker_enabled": true,
    "sbom_generation": true,
    "attestations": true
  }
}
```

## Workflow-Specific Questions

### Tag Workflow
- Major/minor version bump frequency
- Auto-increment patch on merge
- Release creation on tag

### Check Workflow
- SonarQube project key
- Quality gate strictness
- CodeQL languages
- Dependency scanning enabled

### Build Workflow
- Docker image required
- Multi-stage builds
- Artifact retention policy
- SBOM generation

### Deploy Workflow
- Deployment slots/stages
- Blue-green deployment
- Rollback strategy
- Health check endpoints

### Build-Deploy-Test Workflow
- Automated test suite
- Integration test requirements
- Smoke test endpoints

### Release Notes Workflow
- PR categorization (features, fixes, breaking)
- Changelog format
- Release notes template

## Smart Defaults

Based on project analysis, provide smart defaults:

```
IF project.language == "dotnet":
  - Default build tool: dotnet
  - Default deployment: Azure App Service
  - Default auth: OIDC

IF project.language == "java":
  - Default build tool: maven
  - Default Nexus repo: maven-releases
  - Default deployment: Azure Container Apps

IF project.components includes "bicep":
  - Suggest: deploy workflow with Bicep deployment
  - Default target: Azure Bicep IaC
```

## Validation During Gathering

- **Required fields:** Mark as required, don't proceed without
- **Dependent questions:** Only ask if previous answer requires it
- **Format validation:** Ensure URLs, UUIDs, names are valid format
- **Consistency checks:** Ensure combinations make sense

## Usage

```powershell
# Interactive mode
.\scripts\gather-requirements.ps1 -Interactive

# Batch mode with config
.\scripts\gather-requirements.ps1 -ConfigFile config.json

# Output
requirements.json
```

## References

- [Workflow Catalog](references/workflow-catalog.md) - All available workflow types
- [Credential Source Patterns](references/credential-source-patterns.md) - Authentication examples
- [Deployment Targets](references/deployment-targets.md) - Supported platforms

---

**Skill Type:** Utility (no agency)  
**Returns:** requirements.json  
**Used By:** 6 - Change & Release - DevOps Workflow Agent (requirements phase)
