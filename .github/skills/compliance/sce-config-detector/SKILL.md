---
name: config-detector
description: 'Discover and inventory security-relevant configuration files including web servers, databases, cloud providers, container orchestration, and CI/CD configs. Identifies potential security misconfigurations and sensitive data exposure. Use when mapping infrastructure configuration before security review. Returns config inventory with flags.'
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
  - configuration
  - infrastructure
  - detection
  - misconfiguration
  tools: Bash Read Grep
  category: Security & Compliance
---

# Configuration Detector Skill

Discovers security-relevant configuration files and identifies potential misconfigurations.

## When to Use This Skill

- Mapping infrastructure configuration landscape
- Identifying exposed secrets in config files
- Detecting security-relevant configuration patterns
- Pre-security-review configuration inventory
- Understanding deployment architecture
- Finding cloud provider and CI/CD configurations

## Unitary Function

**ONE RESPONSIBILITY:** Discover and inventory security-relevant configuration files

**NOT RESPONSIBLE FOR:**
- Deep configuration security analysis (see security validation skills)
- Fixing misconfigurations (read-only skill)
- Source code analysis (see sce-codebase-analyzer)
- Dependency scanning (see sce-dependency-scanner)
- Runtime configuration (static analysis only)

## Input

```json
{
  "repository_path": "/path/to/codebase",
  "config_types": ["all"],
  "scan_depth": 3,
  "include_dotfiles": true,
  "check_secrets": true
}
```

**Parameters:**
- **repository_path** (required): Path to codebase root
- **config_types** (optional): `["all"]` or specific types like `["webserver", "database", "cloud"]`
- **scan_depth** (optional): Directory recursion depth (default: `3`)
- **include_dotfiles** (optional): Scan hidden files (default: `true`)
- **check_secrets** (optional): Flag potential secrets (default: `true`)

## Output

Configuration inventory with security flags (JSON format):

```json
{
  "scan_summary": {
    "timestamp": "2026-01-13T10:30:00Z",
    "configs_found": 27,
    "security_flags": 5,
    "critical_issues": 1,
    "scan_duration": "3s"
  },
  "configurations": [
    {
      "category": "webserver",
      "type": "nginx",
      "file": "nginx.conf",
      "path": "/etc/nginx/nginx.conf",
      "security_flags": [
        {
          "severity": "high",
          "issue": "SSL/TLS not enforced",
          "line": 45,
          "context": "listen 80 default_server;"
        }
      ],
      "recommendations": [
        "Enable HTTPS redirection",
        "Configure strong SSL ciphers",
        "Enable HSTS header"
      ]
    },
    {
      "category": "environment",
      "type": "env_file",
      "file": ".env",
      "path": ".env",
      "security_flags": [
        {
          "severity": "critical",
          "issue": "Hardcoded credentials detected",
          "line": 12,
          "context": "DATABASE_PASSWORD=admin123",
          "secret_type": "password"
        },
        {
          "severity": "high",
          "issue": "API key exposed",
          "line": 18,
          "context": "STRIPE_SECRET_KEY=sk_live_***",
          "secret_type": "api_key"
        }
      ],
      "recommendations": [
        "Use environment variables or secrets manager",
        "Add .env to .gitignore",
        "Rotate exposed credentials immediately"
      ]
    },
    {
      "category": "cloud",
      "type": "aws",
      "file": "terraform.tfvars",
      "path": "infrastructure/terraform.tfvars",
      "security_flags": [
        {
          "severity": "medium",
          "issue": "Public S3 bucket configuration",
          "line": 23,
          "context": "acl = \"public-read\""
        }
      ],
      "recommendations": [
        "Review public access requirements",
        "Enable S3 bucket encryption",
        "Configure bucket policies"
      ]
    }
  ],
  "categories": {
    "webserver": 4,
    "database": 3,
    "cloud": 8,
    "container": 5,
    "ci_cd": 4,
    "environment": 3
  },
  "secret_summary": {
    "potential_secrets_found": 7,
    "api_keys": 2,
    "passwords": 3,
    "tokens": 1,
    "certificates": 1
  }
}
```

## Configuration Types Detected

### Web Servers
- **nginx:** `nginx.conf`, `sites-available/*`, `sites-enabled/*`
- **Apache:** `httpd.conf`, `apache2.conf`, `.htaccess`
- **IIS:** `web.config`, `applicationHost.config`
- **Caddy:** `Caddyfile`

### Databases
- **PostgreSQL:** `postgresql.conf`, `pg_hba.conf`
- **MySQL:** `my.cnf`, `my.ini`
- **MongoDB:** `mongod.conf`
- **Redis:** `redis.conf`

### Cloud Providers
- **AWS:** `*.tf`, `*.tfvars`, `.aws/config`, `cloudformation.yml`
- **Azure:** `azuredeploy.json`, `*.bicep`
- **GCP:** `*.tf`, `gcloud config`
- **Kubernetes:** `*.yaml`, `*.yml` (in k8s/ or manifests/)

### Container Orchestration
- **Docker:** `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- **Kubernetes:** `deployment.yaml`, `service.yaml`, `ingress.yaml`
- **Helm:** `values.yaml`, `Chart.yaml`

### CI/CD Pipelines
- **GitHub Actions:** `.github/workflows/*.yml`
- **GitLab CI:** `.gitlab-ci.yml`
- **Jenkins:** `Jenkinsfile`
- **CircleCI:** `.circleci/config.yml`
- **Azure Pipelines:** `azure-pipelines.yml`

### Environment & Secrets
- **Environment files:** `.env`, `.env.local`, `.env.production`
- **Secret files:** `secrets.yml`, `credentials.json`
- **Certificate files:** `*.pem`, `*.key`, `*.crt`

### Application Configs
- **Spring Boot:** `application.properties`, `application.yml`
- **Django:** `settings.py`
- **Express:** `config/*.js`
- **Rails:** `config/*.rb`, `database.yml`

## Security Flags Detected

### Critical Severity
- Hardcoded credentials (passwords, API keys)
- Private keys in repository
- Production secrets in code
- Unencrypted sensitive data

### High Severity
- Weak SSL/TLS configurations
- Public access to sensitive resources
- Missing authentication requirements
- Insecure default configurations

### Medium Severity
- Debug mode enabled
- Verbose error messages
- Missing security headers
- Outdated protocol versions

### Low Severity
- Missing best practice configurations
- Non-optimized settings
- Documentation issues

## Secret Detection Patterns

**API Keys:**
```regex
(api[_-]?key|apikey|api[_-]?secret)[\\s]*[=:][\\s]*['\"]?([a-zA-Z0-9_\\-]{20,})['\"]?
```

**Passwords:**
```regex
(password|passwd|pwd)[\\s]*[=:][\\s]*['\"]?([^\\s'\"]+)['\"]?
```

**AWS Keys:**
```regex
(AKIA[0-9A-Z]{16})
```

**JWT Tokens:**
```regex
eyJ[a-zA-Z0-9_-]*\\.eyJ[a-zA-Z0-9_-]*\\.[a-zA-Z0-9_-]*
```

**Private Keys:**
```regex
-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----
```

## Usage Example

```bash
# Scan all configuration types
python scripts/config_detector.py \
  --path /path/to/repo \
  --output config_inventory.json

# Scan only cloud configs
python scripts/config_detector.py \
  --path /path/to/repo \
  --types cloud,container

# Deep scan with secret detection
python scripts/config_detector.py \
  --path /path/to/repo \
  --depth 5 \
  --check-secrets \
  --include-dotfiles
```

## Detection Process

### 1. File Discovery
- Recursive directory traversal
- Pattern matching on filenames
- Extension-based identification
- Hidden file scanning (if enabled)

### 2. Content Analysis
- Parse configuration syntax
- Extract security-relevant settings
- Identify configuration patterns
- Flag potential secrets

### 3. Security Assessment
- Compare against security baselines
- Check for common misconfigurations
- Validate encryption settings
- Assess access control configs

### 4. Recommendation Generation
- Provide specific remediation steps
- Link to security best practices
- Prioritize by severity
- Suggest secure alternatives

## Quality Checks

Before returning results:
- [ ] All config files successfully identified
- [ ] Security flags categorized by severity
- [ ] Recommendations provided for each flag
- [ ] Secret detection patterns applied
- [ ] False positives minimized (test files excluded)
- [ ] Context lines included for each finding

## False Positive Handling

**Common False Positives:**
- Example/template configurations
- Test fixture configurations
- Commented-out sensitive data
- Documentation snippets

**Filtering Rules:**
- Exclude files in `examples/`, `tests/`, `docs/`
- Ignore commented lines
- Check for placeholder values (`<API_KEY>`, `YOUR_SECRET`)
- Validate secret format (not just pattern match)

## Guardrails

1. **Read-only:** Never modifies configuration files
2. **Privacy:** Redacts actual secret values in reports
3. **Path safety:** Validates repository path
4. **Recursion limits:** Respects scan depth to prevent hangs
5. **File size limits:** Skips files > 10MB

## Performance Optimization

**Efficient Scanning:**
- Parallel file processing
- Pattern-based filtering (skip binaries)
- Incremental scans (skip unchanged files)
- Configurable depth limits

**Memory Management:**
- Stream large files
- Process one file at a time
- Release file handles promptly

## Authority Boundaries

**This Skill CAN:**
- Read configuration files
- Parse config syntax
- Detect potential secrets
- Flag security issues
- Recommend remediations

**This Skill CANNOT:**
- Modify configuration files
- Access actual secrets from vaults
- Execute configuration changes
- Make policy decisions about acceptable configs
- Decrypt encrypted values

## References

- CIS Benchmarks: https://www.cisecurity.org/cis-benchmarks/
- OWASP Configuration Guide: https://cheatsheetseries.owasp.org/
- Mozilla SSL Config Generator: https://ssl-config.mozilla.org/
- AWS Security Best Practices: https://aws.amazon.com/security/best-practices/
- TruffleHog (secret detection): https://github.com/trufflesecurity/trufflehog
