---
name: sce-template-manager
description: Manages 13 reusable workflow templates organized by category (tag, check, build, deploy, test, release-notes). Provides template retrieval, parameterization, and customization. Returns template content with placeholder substitution. Use to access base templates before customization.
metadata:
  organization: SCE
  domain: devops-workflows
  category: utility
---

# SCE Template Manager

## Overview

Central repository for 13 workflow templates. Provides template retrieval with placeholder substitution based on project metadata and requirements.

## When to Use

- **Starting generation** - Workflow generators need base templates
- **Custom workflows** - User wants to see/modify templates
- **Template listing** - Show available templates

## What It Does

✅ Stores 13 workflow templates (tag, check, build, deploy, etc.)  
✅ Provides template retrieval by name  
✅ Substitutes placeholders with actual values  
✅ Returns customized template content

## What It Doesn't Do

❌ Generate complete workflows (that's workflow-generator skills)  
❌ Validate templates (that's workflow-validator)  
❌ Decide which template to use (that's the agent)

## Template Catalog

### Tag Workflows (2 templates)
1. **tag.yml** - Semantic versioning with auto-increment
2. **tag-with-release.yml** - Tag + GitHub Release creation

### Check Workflows (2 templates)
1. **check-sonarqube.yml** - SonarQube quality gates
2. **check-codeql.yml** - GitHub CodeQL security scanning

### Build Workflows (3 templates)
1. **build-dotnet.yml** - .NET build + Nexus upload
2. **build-java-maven.yml** - Maven build + Nexus upload
3. **build-python.yml** - Python build + Nexus upload

### Deploy Workflows (4 templates)
1. **deploy-azure-app-service.yml** - Azure App Service deployment
2. **deploy-azure-container-apps.yml** - Azure Container Apps deployment
3. **deploy-azure-bicep.yml** - Azure Bicep IaC deployment
4. **deploy-gcp-cloud-run.yml** - GCP Cloud Run deployment

### Build-Deploy-Test Workflow (1 template)
1. **build-deploy-test.yml** - Non-production pipeline

### Release Notes Workflow (1 template)
1. **release-notes.yml** - Automated release note generation

## Template Structure

Each template includes:
- YAML workflow definition
- Placeholders: `{{VARIABLE_NAME}}`
- Comments explaining customization points
- Reusable workflow calls
- CREDENTIAL_SOURCE pattern

### Example Template (tag.yml)

```yaml
name: Tag

on:
  push:
    branches:
      - main
      - develop

permissions:
  contents: write
  actions: read

jobs:
  tag:
    uses: EdisonInternational/actions/.github/workflows/tag.yml@v2
    with:
      VERSION: ${{ github.ref_name }}
      MAJOR_VERSION: {{MAJOR_VERSION}}  # Placeholder: 1, 2, 3
      MINOR_VERSION: {{MINOR_VERSION}}  # Placeholder: 0, 1, 2
    secrets:
      GITHUB_TOKEN: ${{ secrets[vars.GITHUB_TOKEN] }}
```

## Placeholder Substitution

### Input: Project Metadata
```json
{
  "project_name": "HelloWorld-WebApp",
  "language": "dotnet",
  "version": "8.0"
}
```

### Input: Requirements
```json
{
  "workflow_types": ["tag"],
  "major_version": "1",
  "minor_version": "0"
}
```

### Template Retrieval
```powershell
.\scripts\get-template.ps1 -TemplateName "tag.yml" `
  -ProjectMetadata project_metadata.json `
  -Requirements requirements.json
```

### Output: Customized Template
```yaml
name: Tag

on:
  push:
    branches:
      - main
      - develop

permissions:
  contents: write
  actions: read

jobs:
  tag:
    uses: EdisonInternational/actions/.github/workflows/tag.yml@v2
    with:
      VERSION: ${{ github.ref_name }}
      MAJOR_VERSION: 1  # Substituted
      MINOR_VERSION: 0  # Substituted
    secrets:
      GITHUB_TOKEN: ${{ secrets[vars.GITHUB_TOKEN] }}
```

## Template Selection Logic

Based on requirements, template-manager selects appropriate template:

```
IF workflow_type == "tag":
  IF release_creation == true:
    RETURN "tag-with-release.yml"
  ELSE:
    RETURN "tag.yml"

IF workflow_type == "check":
  IF tool == "sonarqube":
    RETURN "check-sonarqube.yml"
  ELIF tool == "codeql":
    RETURN "check-codeql.yml"

IF workflow_type == "build":
  IF language == "dotnet":
    RETURN "build-dotnet.yml"
  ELIF language == "java":
    IF build_tool == "maven":
      RETURN "build-java-maven.yml"
    ELIF build_tool == "gradle":
      RETURN "build-java-gradle.yml"
  ELIF language == "python":
    RETURN "build-python.yml"

IF workflow_type == "deploy":
  IF deployment_target == "azure-app-service":
    RETURN "deploy-azure-app-service.yml"
  ELIF deployment_target == "azure-container-apps":
    RETURN "deploy-azure-container-apps.yml"
  ELIF deployment_target == "azure-bicep":
    RETURN "deploy-azure-bicep.yml"
  ELIF deployment_target == "gcp-cloud-run":
    RETURN "deploy-gcp-cloud-run.yml"
```

## Placeholder Mapping

### Common Placeholders

| Placeholder | Source | Example Value |
|-------------|--------|---------------|
| `{{PROJECT_NAME}}` | project_metadata.project_name | HelloWorld-WebApp |
| `{{LANGUAGE}}` | project_metadata.language | dotnet |
| `{{VERSION}}` | project_metadata.version | 8.0 |
| `{{BUILD_TOOL}}` | project_metadata.build_tool | dotnet |
| `{{ENTRY_POINT}}` | project_metadata.entry_point | HelloWorld.WebApp.dll |
| `{{DEPLOYMENT_TARGET}}` | requirements.deployment_target | azure-app-service |
| `{{AUTH_METHOD}}` | requirements.auth_method | oidc |
| `{{AZURE_CLIENT_ID}}` | requirements.azure_client_id | 12345678-1234... |
| `{{NEXUS_REPOSITORY}}` | requirements.nexus_repository | https://nexus.sce.com |
| `{{ITSM_ENDPOINT}}` | requirements.itsm_endpoint | https://itsm.sce.com/api |

### Workflow-Specific Placeholders

**Tag Workflow:**
- `{{MAJOR_VERSION}}` - Major version number
- `{{MINOR_VERSION}}` - Minor version number

**Check Workflow:**
- `{{SONARQUBE_PROJECT_KEY}}` - SonarQube project key
- `{{CODEQL_LANGUAGES}}` - Languages to scan

**Build Workflow:**
- `{{ARTIFACT_NAME}}` - Build artifact name
- `{{DOCKER_IMAGE}}` - Docker image name

**Deploy Workflow:**
- `{{APP_SERVICE_NAME}}` - Azure App Service name
- `{{RESOURCE_GROUP}}` - Azure Resource Group
- `{{SLOT_NAME}}` - Deployment slot

## Template Listing

```powershell
.\scripts\list-templates.ps1

Output:
======================
Available Templates
======================

Tag Workflows:
1. tag.yml (basic semantic versioning)
2. tag-with-release.yml (tag + GitHub release)

Check Workflows:
3. check-sonarqube.yml (SonarQube quality gates)
4. check-codeql.yml (CodeQL security scanning)

Build Workflows:
5. build-dotnet.yml (.NET build + Nexus)
6. build-java-maven.yml (Maven build + Nexus)
7. build-python.yml (Python build + Nexus)

Deploy Workflows:
8. deploy-azure-app-service.yml (Azure App Service)
9. deploy-azure-container-apps.yml (Azure Container Apps)
10. deploy-azure-bicep.yml (Azure Bicep IaC)
11. deploy-gcp-cloud-run.yml (GCP Cloud Run)

Build-Deploy-Test:
12. build-deploy-test.yml (non-production pipeline)

Release Notes:
13. release-notes.yml (automated release notes)
```

## Scripts

- **[list-templates.ps1](scripts/list-templates.ps1)** - List all available templates
- **[get-template.ps1](scripts/get-template.ps1)** - Retrieve template with placeholder substitution
- **[validate-template.ps1](scripts/validate-template.ps1)** - Validate template structure

## References

- [Template Catalog](references/template-catalog.md) - All 13 templates with descriptions
- [Placeholder Reference](references/placeholder-reference.md) - All available placeholders

---

**Skill Type:** Utility (no agency)  
**Returns:** Customized template content  
**Used By:** All workflow-generator skills
