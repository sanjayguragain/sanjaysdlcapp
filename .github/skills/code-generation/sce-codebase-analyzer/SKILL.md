---
name: sce-codebase-analyzer
description: 'Detect project structure, programming languages, frameworks, and project type from codebase analysis. Identifies tech stack by scanning package managers, config files, and source code patterns. Use when understanding project composition before security validation. Returns project profile with technology inventory.'
compatibility:
- claude-code
- codex
- amp
- opencode
- "3 - Analysis - Reverse Engineering Agent"
metadata:
  version: 1.0.0
  author: SDLC Security Team
  tags:
  - security
  - analysis
  - tech-stack
  - detection
  - project-structure
  tools: Bash Read Grep
  category: Security & Compliance
---

# Codebase Analyzer Skill

Detects project structure, languages, frameworks, and technology stack from codebase analysis.

## When to Use This Skill

- Understanding project composition before security scans
- Detecting programming languages and frameworks
- Identifying project type (web, mobile, API, desktop)
- Discovering entry points and main modules
- Building technology inventory for security assessment
- Preparing context for intelligent check selection

## Unitary Function

**ONE RESPONSIBILITY:** Analyze codebase structure and detect technology stack

**NOT RESPONSIBLE FOR:**
- Security vulnerability scanning (see sce-vulnerability-scanner)
- Dependency vulnerability checking (see sce-dependency-scanner)
- Configuration security review (see sce-config-detector)
- Running security checks (see security validation skills)
- Fixing code issues (read-only skill)

## Input

```json
{
  "repository_path": "/path/to/codebase",
  "scan_depth": "standard",
  "include_tests": false,
  "excluded_paths": ["node_modules", "vendor", ".git"]
}
```

**Parameters:**
- **repository_path** (required): Path to codebase root
- **scan_depth** (optional): `quick` | `standard` | `deep` (default: `standard`)
- **include_tests** (optional): Include test directories in analysis (default: `false`)
- **excluded_paths** (optional): Directories to skip (default: common ignore patterns)

## Output

Project profile with technology inventory (JSON format):

```json
{
  "project_name": "my-web-app",
  "project_type": "web_api",
  "structure": {
    "root_path": "/path/to/codebase",
    "total_files": 342,
    "code_files": 187,
    "config_files": 23,
    "test_files": 89,
    "documentation_files": 43
  },
  "languages": {
    "primary": ["Python", "JavaScript"],
    "secondary": ["HTML", "CSS"],
    "detected": {
      "Python": {"files": 87, "lines": 12453, "percentage": 68.2},
      "JavaScript": {"files": 45, "lines": 5821, "percentage": 31.8}
    }
  },
  "frameworks": [
    {
      "name": "Flask",
      "type": "web_framework",
      "version": "2.3.0",
      "confidence": "high",
      "evidence": ["requirements.txt", "app.py imports"]
    },
    {
      "name": "React",
      "type": "frontend_framework",
      "version": "18.2.0",
      "confidence": "high",
      "evidence": ["package.json", "jsx files"]
    }
  ],
  "package_managers": {
    "python": {
      "type": "pip",
      "files": ["requirements.txt", "setup.py"],
      "dependencies_count": 45
    },
    "javascript": {
      "type": "npm",
      "files": ["package.json", "package-lock.json"],
      "dependencies_count": 312
    }
  },
  "entry_points": [
    "app.py",
    "src/index.js",
    "manage.py"
  ],
  "project_patterns": {
    "has_api": true,
    "has_database": true,
    "has_authentication": true,
    "has_frontend": true,
    "has_docker": true,
    "has_tests": true,
    "has_ci_cd": true
  },
  "confidence_score": 0.92
}
```

## Detection Methods

### Language Detection
- **File extensions:** `.py`, `.js`, `.java`, `.cs`, `.go`, `.rb`, `.php`, etc.
- **Shebang analysis:** `#!/usr/bin/env python3`
- **Code patterns:** Language-specific syntax and keywords
- **Lines of code:** Count per language for primary/secondary classification

### Framework Detection
- **Package managers:** Parse `package.json`, `requirements.txt`, `pom.xml`, etc.
- **Import analysis:** Scan for framework-specific imports
- **Config files:** Detect framework config patterns
- **Directory structure:** Recognize framework conventions (MVC, Django, Rails)

### Project Type Classification
- **Web API:** REST endpoints, GraphQL schemas, API routes
- **Web App:** HTML templates, frontend frameworks, server rendering
- **Mobile:** Android manifests, iOS projects, React Native, Flutter
- **Desktop:** Electron, Qt, Tkinter patterns
- **Library:** No main entry point, package setup files
- **CLI Tool:** Argument parsing, command definitions

### Pattern Recognition
- **Database:** ORM imports, migration folders, SQL files
- **Authentication:** Auth middleware, JWT libraries, OAuth configs
- **Docker:** Dockerfile, docker-compose.yml
- **CI/CD:** `.github/workflows`, `.gitlab-ci.yml`, Jenkinsfile
- **Testing:** Test frameworks, test directories

## Usage Example

```bash
# Analyze codebase with standard depth
python scripts/codebase_analyzer.py \
  --path /path/to/repo \
  --depth standard \
  --output project_profile.json

# Quick scan (fast, less detailed)
python scripts/codebase_analyzer.py \
  --path /path/to/repo \
  --depth quick

# Deep scan (comprehensive analysis)
python scripts/codebase_analyzer.py \
  --path /path/to/repo \
  --depth deep \
  --include-tests
```

## Analysis Algorithms

### Scan Depth Levels

**Quick (< 10 seconds):**
- File extensions only
- Package manager files
- Top-level config files
- Basic pattern matching

**Standard (10-30 seconds):**
- + Import statement analysis
- + Framework version detection
- + Directory structure analysis
- + Entry point identification

**Deep (30-60 seconds):**
- + Full code pattern analysis
- + Dependency graph construction
- + Architecture pattern detection
- + Code quality metrics

## Quality Checks

Before returning results:
- [ ] At least one language detected
- [ ] Project type classified with confidence > 0.7
- [ ] Primary language represents > 50% of code
- [ ] Framework versions extracted when available
- [ ] Entry points identified (at least one)
- [ ] No false positives from test files (if excluded)

## Confidence Scoring

**High Confidence (0.8-1.0):**
- Clear package manager files
- Framework-specific directory structure
- Consistent coding patterns

**Medium Confidence (0.5-0.79):**
- Mixed patterns
- Ambiguous project structure
- Multiple possible frameworks

**Low Confidence (< 0.5):**
- Minimal code files
- No clear patterns
- Conflicting indicators

## Guardrails

1. **Read-only:** Never modifies any files
2. **Resource limits:** Respects scan depth timeouts
3. **Path safety:** Validates repository path exists
4. **Exclusion respect:** Honors `.gitignore` and exclude patterns
5. **Error tolerance:** Continues on individual file read errors

## Implementation Notes

**Detection Logic:**
```python
# Language detection
language_map = {
    ".py": "Python",
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".java": "Java",
    ".cs": "C#",
    ".go": "Go",
    ".rb": "Ruby",
    ".php": "PHP"
}

# Framework signatures
framework_signatures = {
    "Flask": ["from flask import", "requirements.txt: flask"],
    "Django": ["django.conf", "manage.py"],
    "Express": ["express": "*", "app.use(express"],
    "React": ["react": "*", "import React"],
    "Spring": ["org.springframework", "pom.xml: spring-boot"]
}
```

## Authority Boundaries

**This Skill CAN:**
- Read source code files
- Parse package manager files
- Analyze directory structure
- Detect languages and frameworks
- Classify project type

**This Skill CANNOT:**
- Execute code or compile projects
- Install dependencies
- Modify any files
- Access external APIs
- Make security assessments (only gather context)

## References

- GitHub Linguist: https://github.com/github/linguist
- SPDX License List: https://spdx.org/licenses/
- Framework Detection Patterns: Community contributed
