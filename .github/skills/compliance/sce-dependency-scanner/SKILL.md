---
name: dependency-scanner
description: 'Scan dependencies for known vulnerabilities using package manager files. Checks npm, pip, Maven, NuGet, RubyGems, and Go modules against CVE databases. Use when identifying vulnerable third-party libraries before deployment. Returns vulnerability report with CVE details and remediation guidance.'
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
  - dependencies
  - vulnerabilities
  - cve
  - supply-chain
  tools: Bash Read Grep
  category: Security & Compliance
---

# Dependency Scanner Skill

Scans project dependencies for known vulnerabilities across multiple package managers.

## When to Use This Skill

- Scanning for vulnerable dependencies before deployment
- Supply chain security assessment
- Identifying outdated packages with security issues
- Pre-commit dependency validation
- CI/CD security gate for dependency checks
- Audit preparation for third-party components

## Unitary Function

**ONE RESPONSIBILITY:** Scan dependencies for known CVE vulnerabilities

**NOT RESPONSIBLE FOR:**
- Source code vulnerability scanning (see sce-vulnerability-scanner)
- Codebase structure analysis (see sce-codebase-analyzer)
- License compliance checking (separate concern)
- Dependency updates or fixes (reporting only)
- Runtime dependency analysis (static analysis only)

## Input

```json
{
  "repository_path": "/path/to/codebase",
  "package_managers": ["npm", "pip", "maven"],
  "severity_threshold": "medium",
  "include_dev_dependencies": false,
  "use_cache": true
}
```

**Parameters:**
- **repository_path** (required): Path to codebase root
- **package_managers** (optional): Auto-detected if not provided
- **severity_threshold** (optional): `critical` | `high` | `medium` | `low` (default: `medium`)
- **include_dev_dependencies** (optional): Scan dev/test deps (default: `false`)
- **use_cache** (optional): Use local CVE cache for speed (default: `true`)

## Output

Dependency vulnerability report (JSON format):

```json
{
  "scan_summary": {
    "timestamp": "2026-01-13T10:30:00Z",
    "total_dependencies": 357,
    "vulnerable_dependencies": 8,
    "critical": 1,
    "high": 3,
    "medium": 3,
    "low": 1,
    "scan_duration": "12s"
  },
  "package_managers": [
    {
      "type": "npm",
      "file": "package.json",
      "total_dependencies": 312,
      "vulnerable": 5
    },
    {
      "type": "pip",
      "file": "requirements.txt",
      "total_dependencies": 45,
      "vulnerable": 3
    }
  ],
  "vulnerabilities": [
    {
      "id": "CVE-2024-12345",
      "package": "express",
      "installed_version": "4.16.0",
      "patched_version": "4.19.2",
      "severity": "critical",
      "cvss_score": 9.8,
      "description": "Remote code execution via prototype pollution",
      "cwe": "CWE-1321",
      "published_date": "2024-11-15",
      "references": [
        "https://nvd.nist.gov/vuln/detail/CVE-2024-12345",
        "https://github.com/advisories/GHSA-xxxx-yyyy-zzzz"
      ],
      "remediation": "Upgrade to express@4.19.2 or later",
      "exploit_available": true,
      "epss_score": 0.89
    }
  ],
  "dependency_tree": {
    "direct_dependencies": 45,
    "transitive_dependencies": 312,
    "vulnerable_direct": 2,
    "vulnerable_transitive": 6
  }
}
```

## Supported Package Managers

### JavaScript/Node.js
- **npm:** `package.json`, `package-lock.json`
- **yarn:** `yarn.lock`
- **pnpm:** `pnpm-lock.yaml`
- **Tool:** `npm audit`, `yarn audit`, or OSV API

### Python
- **pip:** `requirements.txt`, `Pipfile`, `Pipfile.lock`, `pyproject.toml`
- **Tool:** `pip-audit`, `safety`, or OSV API

### Java
- **Maven:** `pom.xml`
- **Gradle:** `build.gradle`, `build.gradle.kts`
- **Tool:** OWASP Dependency-Check, Snyk API

### .NET
- **NuGet:** `*.csproj`, `packages.config`, `packages.lock.json`
- **Tool:** `dotnet list package --vulnerable`

### Ruby
- **RubyGems:** `Gemfile`, `Gemfile.lock`
- **Tool:** `bundle audit`

### Go
- **Go Modules:** `go.mod`, `go.sum`
- **Tool:** `go list -json -m all | nancy`

### PHP
- **Composer:** `composer.json`, `composer.lock`
- **Tool:** `composer audit`

### Rust
- **Cargo:** `Cargo.toml`, `Cargo.lock`
- **Tool:** `cargo audit`

## Vulnerability Databases

**Primary Sources:**
- **NVD (National Vulnerability Database):** https://nvd.nist.gov/
- **OSV (Open Source Vulnerabilities):** https://osv.dev/
- **GitHub Advisory Database:** https://github.com/advisories
- **Snyk Vulnerability DB:** https://security.snyk.io/

**Scoring Systems:**
- **CVSS (Common Vulnerability Scoring System):** 0.0-10.0 scale
- **EPSS (Exploit Prediction Scoring System):** 0.0-1.0 probability
- **Priority:** Combines CVSS + EPSS + exploit availability

## Usage Example

```bash
# Scan all package managers
python scripts/dependency_scanner.py \
  --path /path/to/repo \
  --threshold medium \
  --output vulnerabilities.json

# Scan only npm dependencies
python scripts/dependency_scanner.py \
  --path /path/to/repo \
  --package-manager npm \
  --include-dev

# Use OSV API for fresh data
python scripts/dependency_scanner.py \
  --path /path/to/repo \
  --no-cache \
  --api osv
```

## Scan Process

### 1. Detection Phase
- Locate package manager files
- Parse dependency declarations
- Build dependency tree (direct + transitive)

### 2. Query Phase
- Query CVE databases for each dependency
- Check version ranges against known vulnerabilities
- Retrieve CVSS scores and metadata

### 3. Analysis Phase
- Filter by severity threshold
- Identify exploitable vulnerabilities
- Calculate remediation priority
- Check for available patches

### 4. Reporting Phase
- Generate structured vulnerability report
- Include remediation guidance
- Provide upgrade paths
- Flag breaking changes

## Severity Classification

**Critical (CVSS 9.0-10.0):**
- Remote code execution
- Authentication bypass
- Data exfiltration

**High (CVSS 7.0-8.9):**
- SQL injection
- XSS with data access
- Privilege escalation

**Medium (CVSS 4.0-6.9):**
- Information disclosure
- Denial of service
- CSRF

**Low (CVSS 0.1-3.9):**
- Minor information leaks
- Low-impact DoS
- Edge case vulnerabilities

## Remediation Guidance

**Automated Suggestions:**
```json
{
  "package": "lodash",
  "vulnerability": "CVE-2023-12345",
  "current_version": "4.17.10",
  "remediation_options": [
    {
      "type": "upgrade",
      "target_version": "4.17.21",
      "breaking_changes": false,
      "command": "npm install lodash@4.17.21"
    },
    {
      "type": "replace",
      "alternative_package": "lodash-es",
      "reason": "More secure, tree-shakeable",
      "effort": "medium"
    },
    {
      "type": "remove",
      "reason": "Functionality not used",
      "effort": "low"
    }
  ]
}
```

## Quality Checks

Before returning results:
- [ ] All package manager files successfully parsed
- [ ] CVE database queries completed (or graceful degradation)
- [ ] CVSS scores validated (0.0-10.0 range)
- [ ] Remediation advice provided for each vulnerability
- [ ] Dependency tree built (direct vs transitive)
- [ ] False positives filtered (e.g., dev-only issues)

## False Positive Handling

**Common False Positives:**
- Dev dependencies in production scan
- Vulnerabilities in unused code paths
- Platform-specific issues (Windows vuln on Linux)
- Mitigated vulnerabilities (compensating controls)

**Filtering Rules:**
- Respect `--include-dev-dependencies` flag
- Check if vulnerable code path is reachable
- Consider deployment platform
- Allow manual suppression with justification

## Guardrails

1. **Read-only:** Never modifies package files
2. **API rate limits:** Respects CVE database quotas
3. **Timeout handling:** Falls back to cache on API failures
4. **Privacy:** No upload of proprietary code
5. **Offline mode:** Can run with cached CVE data

## Performance Optimization

**Caching Strategy:**
- Cache CVE database locally (24-hour TTL)
- Store package vulnerability mappings
- Incremental scans (only new/changed deps)

**Speed Improvements:**
- Parallel CVE lookups
- Batch API requests
- Skip unchanged lock files

## Authority Boundaries

**This Skill CAN:**
- Read package manager files
- Query public CVE databases
- Parse dependency trees
- Calculate CVSS scores
- Recommend upgrades

**This Skill CANNOT:**
- Install or update dependencies
- Execute package manager commands
- Modify lock files
- Access private vulnerability feeds (without auth)
- Make security exceptions or policy decisions

## References

- NVD: https://nvd.nist.gov/
- OSV: https://osv.dev/
- CVSS Calculator: https://www.first.org/cvss/calculator/3.1
- OWASP Dependency-Check: https://owasp.org/www-project-dependency-check/
- Snyk: https://snyk.io/
