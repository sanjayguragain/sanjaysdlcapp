---
name: sce-workflow-analyzer
description: Detects project type and technology stack (.NET, Java, Python, Node.js, etc.) by analyzing project files. Returns project metadata JSON with language, framework, build tools, and component structure. Use when starting workflow generation to understand the codebase structure.
metadata:
  organization: SCE
  domain: devops-workflows
  category: utility
---

# SCE Workflow Analyzer

## Overview

Analyzes project directory structure to detect technology stack, build tools, and project components. Returns structured metadata used by workflow generators to create appropriate workflows.

## When to Use

- **Starting workflow generation** - First step to understand project
- **Multi-component projects** - Detects webapp + bicep + terraform
- **Unknown tech stack** - Automatically identifies language and framework

## What It Does

✅ Scans project directory for key files  
✅ Detects language (.NET, Java, Python, Node.js)  
✅ Identifies build tools (Maven, Gradle, npm, pip)  
✅ Finds multiple components (webapp, infrastructure)  
✅ Returns structured JSON metadata

## What It Doesn't Do

❌ Generate workflows (that's workflow-generator skills)  
❌ Validate project structure (that's workflow-validator)  
❌ Ask user questions (that's requirements-gatherer)

## Detection Logic

### .NET Projects
```
Detects:
- *.csproj, *.sln files
- appsettings.json
- Program.cs, Startup.cs

Returns:
{
  "language": "dotnet",
  "version": "8.0",
  "project_type": "webapp",
  "build_tool": "dotnet",
  "entry_point": "MyApp.dll"
}
```

### Java Projects
```
Detects:
- pom.xml (Maven)
- build.gradle (Gradle)
- src/main/java/

Returns:
{
  "language": "java",
  "version": "17",
  "project_type": "webapp",
  "build_tool": "maven" | "gradle",
  "artifact_name": "myapp-1.0.0.jar"
}
```

### Python Projects
```
Detects:
- requirements.txt
- setup.py, pyproject.toml
- *.py files

Returns:
{
  "language": "python",
  "version": "3.11",
  "project_type": "webapp",
  "build_tool": "pip",
  "entry_point": "app.py"
}
```

### Node.js Projects
```
Detects:
- package.json
- node_modules/
- *.js, *.ts files

Returns:
{
  "language": "node",
  "version": "20",
  "project_type": "webapp",
  "build_tool": "npm" | "yarn",
  "entry_point": "index.js"
}
```

## Multi-Component Detection

```
Project Structure:
/
├── src/
│   ├── webapp/ (.NET project)
│   └── bicep/ (Azure IaC)
└── terraform/ (Terraform IaC)

Returns:
{
  "components": [
    {
      "name": "webapp",
      "type": "application",
      "language": "dotnet",
      "path": "src/webapp"
    },
    {
      "name": "bicep",
      "type": "infrastructure",
      "language": "bicep",
      "path": "src/bicep"
    },
    {
      "name": "terraform",
      "type": "infrastructure",
      "language": "terraform",
      "path": "terraform"
    }
  ]
}
```

## Usage

### Basic Analysis
```powershell
# Run analyzer
.\scripts\detect-project.ps1 -ProjectPath "C:\MyProject"

# Returns: project_metadata.json
```

### Detailed Output
```json
{
  "project_name": "HelloWorld-WebApp",
  "language": "dotnet",
  "version": "8.0",
  "framework": "aspnetcore",
  "build_tool": "dotnet",
  "project_type": "webapp",
  "components": [
    {
      "name": "webapp",
      "type": "application",
      "language": "dotnet",
      "path": "src",
      "entry_point": "HelloWorld.WebApp.dll",
      "dockerfile": true
    },
    {
      "name": "bicep",
      "type": "infrastructure",
      "language": "bicep",
      "path": "src/bicep",
      "main_file": "main.bicep"
    }
  ],
  "detected_files": {
    "dotnet": ["HelloWorld.WebApp.csproj", "Program.cs"],
    "bicep": ["main.bicep", "webapp.bicep"],
    "docker": ["Dockerfile"]
  }
}
```

## Scripts

### Main Script
- **[detect-project.ps1](scripts/detect-project.ps1)** - Entry point, orchestrates detection

### Language-Specific Scripts
- **[detect-dotnet.ps1](scripts/detect-dotnet.ps1)** - .NET-specific analysis
- **[detect-java.ps1](scripts/detect-java.ps1)** - Java-specific analysis
- **[detect-python.ps1](scripts/detect-python.ps1)** - Python-specific analysis
- **[detect-node.ps1](scripts/detect-node.ps1)** - Node.js-specific analysis

## Output Format

### project_metadata.json Structure
```json
{
  "project_name": "string",
  "language": "dotnet|java|python|node|other",
  "version": "string",
  "framework": "string",
  "build_tool": "string",
  "project_type": "webapp|api|console|library",
  "components": [
    {
      "name": "string",
      "type": "application|infrastructure|library",
      "language": "string",
      "path": "string",
      "entry_point": "string",
      "dockerfile": boolean
    }
  ],
  "detected_files": {
    "language": ["file1", "file2"],
    "docker": ["Dockerfile"],
    "config": ["appsettings.json"]
  }
}
```

## Error Handling

**No Project Files Found:**
```json
{
  "error": "No recognizable project files found",
  "suggestion": "Ensure you're in a project directory with source code",
  "detected_files": []
}
```

**Multiple Languages Detected:**
```json
{
  "warning": "Multiple languages detected",
  "primary_language": "dotnet",
  "components": [
    {"language": "dotnet", "confidence": "high"},
    {"language": "python", "confidence": "low"}
  ]
}
```

## References

- [Detection Patterns](references/detection-patterns.md) - File patterns for each language
- [Multi-Component Examples](references/multi-component-examples.md) - Complex project structures

---

**Skill Type:** Utility (no agency)  
**Returns:** project_metadata.json  
**Used By:** 6 - Change & Release - DevOps Workflow Agent (analysis phase)
