---
name: sce-data-protection-reviewer
description: 'Assess data protection including encryption at rest and in transit, key management, secret storage, and PII handling. Use when reviewing cryptographic implementations, checking for unencrypted sensitive data, or validating secure data storage practices. Returns data protection security report.'
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
  - encryption
  - data-protection
  - key-management
  - pii
  tools: Bash Read Grep
  category: Security & Compliance
---

# Data Protection Reviewer Skill

Assesses encryption, key management, secret storage, and PII handling practices.

## When to Use This Skill

- Reviewing encryption implementations (at rest, in transit)
- Checking key management practices
- Validating secret storage mechanisms
- Assessing PII/sensitive data handling
- Verifying cryptographic algorithm usage
- Checking for hardcoded secrets

## Unitary Function

**ONE RESPONSIBILITY:** Assess data protection mechanisms (encryption, keys, secrets, PII)

**NOT RESPONSIBLE FOR:**
- Authentication review (see sce-auth-auditor)
- General vulnerability scanning (see sce-vulnerability-scanner)
- Compliance mapping (see sce-compliance-checker)
- Network security (see sce-web-infrastructure-auditor)
- Fixing data protection issues (read-only skill)

## Input

- **source_path**: Path to source code directory
- **config_path**: Optional path to configuration files
- **data_classification**: Optional (public, internal, confidential, restricted)

## Output

Data protection report (JSON format):

```json
{
  "audit_id": "uuid",
  "timestamp": "ISO-8601",
  "source_path": "string",
  "risk_score": "Critical|High|Medium|Low",
  "findings": {
    "encryption_at_rest": [
      {
        "severity": "Critical",
        "issue": "Database passwords stored in plaintext",
        "location": "config/database.yml:12",
        "remediation": "Use environment variables with encryption"
      }
    ],
    "encryption_in_transit": [
      {
        "severity": "High",
        "issue": "HTTP connection to payment API (should be HTTPS)",
        "location": "services/payment.py:67",
        "remediation": "Use HTTPS with certificate validation"
      }
    ],
    "key_management": [],
    "secret_storage": [],
    "pii_handling": [],
    "cryptographic_algorithms": []
  },
  "recommendations": []
}
```

## Protection Areas Reviewed

- **Encryption at Rest**: Database encryption, file encryption, disk encryption
- **Encryption in Transit**: TLS/SSL usage, certificate validation, protocol versions
- **Key Management**: Key generation, storage, rotation, access control
- **Secret Storage**: Credentials, API keys, tokens, certificates
- **PII Handling**: Data minimization, anonymization, pseudonymization
- **Cryptography**: Algorithm strength, deprecated algorithms, implementation

## Usage Example

```bash
# Full data protection audit
python scripts/data_protection_reviewer.py --path . --output report.json

# Check for hardcoded secrets
python scripts/data_protection_reviewer.py --path . --scan-secrets

# Review encryption implementations
python scripts/data_protection_reviewer.py --path . --focus encryption
```

## Helper Scripts

- `data_protection_reviewer.py`: Main data protection auditor
- `secret_scanner.py`: Hardcoded secret detection
- `crypto_analyzer.py`: Cryptographic implementation review
- `pii_detector.py`: PII detection and handling review

## Risk Scoring

- **Critical**: Hardcoded secrets, plaintext passwords, no encryption for sensitive data
- **High**: Weak encryption, improper key storage, TLS misconfiguration
- **Medium**: Deprecated algorithms, missing key rotation, poor secret management
- **Low**: Minor crypto improvements, documentation gaps

## Safety Rules

1. **Read-only**: Never modifies code or configurations
2. **Secret handling**: Redacts actual secrets in reports
3. **Scope focus**: Reports only on data protection, not general security
