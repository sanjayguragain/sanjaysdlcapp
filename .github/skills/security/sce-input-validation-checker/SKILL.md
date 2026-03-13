---
name: sce-input-validation-checker
description: 'Identify injection vulnerabilities including SQL injection, XSS, command injection, LDAP injection, and check input sanitization and output encoding. Use when scanning for injection flaws or validating input/output handling. Returns input validation security report with injection risks.'
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
  - injection
  - sql-injection
  - xss
  - input-validation
  tools: Bash Read Grep
  category: Security & Compliance
---

# Input Validation Checker Skill

Identifies injection vulnerabilities and validates input sanitization and output encoding practices.

## When to Use This Skill

- Scanning for SQL injection vulnerabilities
- Detecting XSS (Cross-Site Scripting) risks
- Identifying command injection vulnerabilities
- Checking for LDAP, XML, NoSQL injection
- Validating input sanitization
- Reviewing output encoding practices

## Unitary Function

**ONE RESPONSIBILITY:** Detect injection vulnerabilities and validate input/output handling

**NOT RESPONSIBLE FOR:**
- Authentication review (see sce-auth-auditor)
- Encryption review (see sce-data-protection-reviewer)
- API-specific security (see sce-api-security-reviewer)
- General vulnerability scanning (see sce-vulnerability-scanner)
- Fixing injection flaws (read-only skill)

## Input

- **source_path**: Path to source code directory
- **injection_types**: Optional list (sql, xss, command, ldap, xml, nosql)
- **severity_threshold**: Optional minimum severity

## Output

Input validation report (JSON format):

```json
{
  "audit_id": "uuid",
  "timestamp": "ISO-8601",
  "source_path": "string",
  "risk_score": "Critical|High|Medium|Low",
  "findings": {
    "sql_injection": [
      {
        "severity": "Critical",
        "issue": "Unsanitized user input in SQL query",
        "location": "api/users.py:34",
        "code": "query = f\"SELECT * FROM users WHERE id={user_id}\"",
        "remediation": "Use parameterized queries or ORM"
      }
    ],
    "xss": [],
    "command_injection": [],
    "ldap_injection": [],
    "xml_injection": [],
    "nosql_injection": [],
    "input_sanitization": [],
    "output_encoding": []
  },
  "recommendations": []
}
```

## Injection Types Detected

- **SQL Injection**: String concatenation, dynamic queries, ORM misuse
- **XSS**: Reflected, stored, DOM-based XSS
- **Command Injection**: Shell execution with user input
- **LDAP Injection**: Unsanitized LDAP queries
- **XML Injection**: XXE, XML bomb vulnerabilities
- **NoSQL Injection**: MongoDB, CouchDB query injection
- **Path Traversal**: Directory traversal attacks
- **Template Injection**: Server-side template injection

## Usage Example

```bash
# Check all injection types
python scripts/input_validation_checker.py --path . --output report.json

# Check SQL injection only
python scripts/input_validation_checker.py --path . --types sql

# Check with high severity threshold
python scripts/input_validation_checker.py --path . --severity high
```

## Helper Scripts

- `input_validation_checker.py`: Main injection detector
- `sql_injection_scanner.py`: SQL injection patterns
- `xss_scanner.py`: XSS vulnerability detection
- `command_injection_scanner.py`: Command injection patterns

## Risk Scoring

- **Critical**: SQL injection, command injection with user input
- **High**: Stored XSS, LDAP injection, XXE vulnerabilities
- **Medium**: Reflected XSS, NoSQL injection, path traversal
- **Low**: Missing input validation on low-risk fields

## Safety Rules

1. **Read-only**: Never modifies source code
2. **No code execution**: Static analysis only, no dynamic testing
3. **Scope focus**: Reports only on injection/validation, not general security
