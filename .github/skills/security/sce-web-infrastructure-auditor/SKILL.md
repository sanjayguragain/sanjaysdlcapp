---
name: sce-web-infrastructure-auditor
description: 'Analyze web infrastructure security including SSL/TLS, DNS, HTTP headers, redirects, WAF, and technology stack. Use when auditing domain security posture, checking server configurations, or validating web security headers. Returns web infrastructure security assessment report.'
compatibility:
- claude-code
- codex
- amp
- opencode
metadata:
  version: 1.0.0
  author: SDLC Security Team
  tags:
  - security
  - web-infrastructure
  - ssl-tls
  - dns
  - http-headers
  tools: Bash Read Grep
  category: Security & Compliance
---

# Web Infrastructure Auditor Skill

Analyzes web infrastructure security for domains, servers, and network configurations.

## When to Use This Skill

- Auditing SSL/TLS configuration
- Checking DNS security (DNSSEC, SPF, DKIM, DMARC)
- Reviewing HTTP security headers
- Validating HTTPS enforcement
- Detecting WAF presence
- Identifying technology stack
- Checking server configuration
- Reviewing security policy files

## Unitary Function

**ONE RESPONSIBILITY:** Analyze web infrastructure security (SSL/TLS, DNS, headers, tech stack)

**NOT RESPONSIBLE FOR:**
- Source code review (see sce-vulnerability-scanner)
- API security (see sce-api-security-reviewer)
- Mobile app security (see sce-mobile-security-auditor)
- Compliance validation (see sce-compliance-checker)
- Fixing infrastructure issues (read-only skill)

## Input

- **target**: Domain name or IP address
- **checks**: Optional list (ssl, dns, headers, waf, tech-stack)
- **depth**: Optional (basic, standard, comprehensive)

## Output

Web infrastructure report (JSON format):

```json
{
  "audit_id": "uuid",
  "timestamp": "ISO-8601",
  "target": "example.com",
  "risk_score": "Critical|High|Medium|Low",
  "findings": {
    "ssl_tls": [
      {
        "severity": "High",
        "issue": "Weak TLS cipher suites enabled",
        "details": "TLS_RSA_WITH_3DES_EDE_CBC_SHA supported",
        "remediation": "Disable weak ciphers, use TLS 1.2+, strong cipher suites"
      }
    ],
    "dns": [],
    "http_headers": [],
    "redirects": [],
    "waf": [],
    "tech_stack": [],
    "security_policies": []
  },
  "recommendations": []
}
```

## Infrastructure Areas Reviewed

### SSL/TLS Security
- Certificate validity and chain
- Protocol versions (TLS 1.2, 1.3)
- Cipher suite strength
- Certificate transparency
- OCSP stapling
- HSTS enforcement

### DNS Security
- DNSSEC validation
- SPF records (email)
- DKIM records (email)
- DMARC policy (email)
- CAA records (certificate authority)
- DNS over HTTPS/TLS

### HTTP Security Headers
- HSTS (Strict-Transport-Security)
- CSP (Content-Security-Policy)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

### Redirect Security
- HTTP to HTTPS enforcement
- Redirect chain validation
- Redirect loop detection
- Open redirect vulnerabilities

### Web Application Firewall
- WAF detection
- WAF bypass indicators
- Rate limiting presence

### Technology Stack
- Server software and versions
- Framework detection
- Known CVEs in detected technologies
- Information disclosure

### Security Policies
- security.txt
- robots.txt
- .well-known configurations

## Usage Example

```bash
# Full infrastructure audit
python scripts/web_infrastructure_auditor.py --target example.com --output report.json

# SSL/TLS check only
python scripts/web_infrastructure_auditor.py --target example.com --checks ssl

# Comprehensive audit
python scripts/web_infrastructure_auditor.py --target example.com --depth comprehensive
```

## Helper Scripts

- `web_infrastructure_auditor.py`: Main infrastructure auditor
- `ssl_analyzer.py`: SSL/TLS security checks
- `dns_analyzer.py`: DNS security validation
- `header_analyzer.py`: HTTP header review
- `tech_detector.py`: Technology stack detection

## Risk Scoring

- **Critical**: Expired SSL certificate, no HTTPS, severe misconfiguration
- **High**: Weak TLS ciphers, missing HSTS, no DNSSEC
- **Medium**: Missing security headers, weak CSP, outdated software
- **Low**: Minor header improvements, information disclosure

## Safety Rules

1. **Read-only**: Never modifies server configurations or DNS records
2. **Non-intrusive**: Uses passive reconnaissance techniques
3. **Scope focus**: Reports on infrastructure, not application code
