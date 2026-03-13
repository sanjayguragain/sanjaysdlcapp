---
name: sce-auth-auditor
description: 'Review authentication and authorization implementations including JWT, OAuth, session management, RBAC, password policies, and MFA. Use when auditing auth mechanisms, checking for broken access control, or validating identity management. Returns authentication/authorization security assessment report.'
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
  - authentication
  - authorization
  - jwt
  - oauth
  - rbac
  tools: Bash Read Grep
  category: Security & Compliance
---

# Authentication & Authorization Auditor Skill

Reviews authentication and authorization implementations for security weaknesses and best practice violations.

## When to Use This Skill

- Auditing authentication mechanisms (JWT, OAuth, SAML)
- Reviewing session management practices
- Validating password policies and storage
- Checking role-based access control (RBAC)
- Verifying multi-factor authentication (MFA) implementation
- Identifying broken access control issues

## Unitary Function

**ONE RESPONSIBILITY:** Review authentication and authorization implementation security

**NOT RESPONSIBLE FOR:**
- General vulnerability scanning (see sce-vulnerability-scanner)
- Data encryption review (see sce-data-protection-reviewer)
- API-specific security (see sce-api-security-reviewer)
- Compliance validation (see sce-compliance-checker)
- Fixing auth issues (read-only skill)

## Input

- **source_path**: Path to source code directory
- **config_files**: Optional paths to auth configuration files
- **auth_type**: Optional (jwt, oauth, saml, session, custom)

## Output

Authentication/Authorization security report (JSON format):

```json
{
  "audit_id": "uuid",
  "timestamp": "ISO-8601",
  "source_path": "string",
  "risk_score": "Critical|High|Medium|Low",
  "findings": {
    "authentication": [
      {
        "severity": "High",
        "category": "Password Storage",
        "issue": "Passwords stored with weak hashing algorithm (MD5)",
        "location": "auth/users.py:45",
        "remediation": "Use bcrypt, Argon2, or PBKDF2"
      }
    ],
    "authorization": [
      {
        "severity": "Critical",
        "category": "Broken Access Control",
        "issue": "Missing authorization check on admin endpoint",
        "location": "api/admin.py:12",
        "remediation": "Add role-based access control check"
      }
    ],
    "session_management": [],
    "token_handling": [],
    "mfa": []
  },
  "recommendations": []
}
```

## Auth Mechanisms Reviewed

- **JWT**: Token validation, signature verification, expiry, claims
- **OAuth 2.0**: Flow security, token storage, scope validation
- **SAML**: Assertion validation, signature verification
- **Session**: Cookie security, session fixation, timeout
- **Password**: Hashing, salt, complexity, reset flows
- **RBAC**: Role definitions, permission checks, privilege escalation
- **MFA**: Implementation, bypass risks, backup codes

## Usage Example

```bash
# Full auth audit
python scripts/auth_auditor.py --path . --output auth_report.json

# JWT-specific audit
python scripts/auth_auditor.py --path . --auth-type jwt

# Check specific auth config
python scripts/auth_auditor.py --path . --config config/auth.yml
```

## Helper Scripts

- `auth_auditor.py`: Main authentication audit engine
- `jwt_validator.py`: JWT security checks
- `oauth_validator.py`: OAuth flow security
- `rbac_checker.py`: Access control validation

## Risk Scoring

- **Critical**: Missing authorization, broken access control, weak crypto
- **High**: Weak password hashing, insecure session management
- **Medium**: Missing MFA, weak password policy, token issues
- **Low**: Documentation gaps, minor config improvements

## Safety Rules

1. **Read-only**: Never modifies authentication code or configurations
2. **Credential safety**: Never logs actual passwords or tokens
3. **Scope boundaries**: Reports only on auth/authz, not general vulnerabilities
