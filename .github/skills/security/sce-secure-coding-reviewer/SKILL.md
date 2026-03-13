---
name: sce-secure-coding-reviewer
description: 'Check language-specific secure coding practices and detect unsafe patterns. Supports Python, JavaScript, TypeScript, Java, C#, Go, Ruby, PHP, and more. Use when reviewing code for language-specific security best practices. Returns secure coding assessment report.'
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
  - secure-coding
  - best-practices
  - code-quality
  - language-specific
  tools: Bash Read Grep
  category: Security & Compliance
---

# Secure Coding Reviewer Skill

Reviews code for language-specific secure coding practices and unsafe patterns.

## When to Use This Skill

- Reviewing secure coding practices
- Detecting unsafe function usage
- Checking language-specific security patterns
- Validating secure defaults
- Identifying dangerous constructs
- Code review for security best practices

## Unitary Function

**ONE RESPONSIBILITY:** Check language-specific secure coding patterns and unsafe function usage

**NOT RESPONSIBLE FOR:**
- Authentication review (see sce-auth-auditor)
- Data protection (see sce-data-protection-reviewer)
- Injection detection (see sce-input-validation-checker)
- Compliance validation (see sce-compliance-checker)
- Fixing code issues (read-only skill)

## Input

- **source_path**: Path to source code directory
- **languages**: Optional list of languages to review
- **focus**: Optional (unsafe-functions, dangerous-patterns, best-practices)

## Output

Secure coding report (JSON format):

```json
{
  "audit_id": "uuid",
  "timestamp": "ISO-8601",
  "source_path": "string",
  "languages_reviewed": ["Python", "JavaScript"],
  "risk_score": "Critical|High|Medium|Low",
  "findings": {
    "python": [
      {
        "severity": "High",
        "category": "Unsafe Function",
        "issue": "Use of eval() with user input",
        "location": "api/handler.py:23",
        "code": "eval(request.data['expression'])",
        "remediation": "Use ast.literal_eval() or avoid dynamic evaluation"
      }
    ],
    "javascript": [],
    "java": []
  },
  "recommendations": []
}
```

## Supported Languages

### Python
- Unsafe functions: eval(), exec(), compile(), __import__()
- Deserialization: pickle, yaml.load()
- File operations: open() without context manager
- Subprocess: shell=True usage
- Random: insecure random number generation

### JavaScript/TypeScript
- Unsafe functions: eval(), Function(), setTimeout() with strings
- DOM manipulation: innerHTML, document.write()
- Deserialization: JSON.parse() with user input
- Prototype pollution
- Regular expression DoS (ReDoS)

### Java
- Deserialization: ObjectInputStream
- File operations: File() with user input
- Reflection: Class.forName(), Method.invoke()
- XML parsing: XXE vulnerabilities
- Random: java.util.Random vs SecureRandom

### C#
- Deserialization: BinaryFormatter
- SQL: String concatenation in queries
- XML: XmlReader settings
- Cryptography: Weak algorithms
- File operations: Path.Combine() misuse

### Go
- Command execution: exec.Command() with shell
- SQL: String concatenation
- Crypto: Weak random, deprecated algorithms
- File operations: Unsafe path handling

### Ruby
- Unsafe functions: eval(), instance_eval()
- Command execution: system(), exec(), backticks
- Deserialization: Marshal.load()
- SQL: String interpolation

### PHP
- Unsafe functions: eval(), exec(), system()
- Deserialization: unserialize()
- File operations: include(), require() with user input
- SQL: String concatenation

## Usage Example

```bash
# Review all languages
python scripts/secure_coding_reviewer.py --path . --output report.json

# Review specific language
python scripts/secure_coding_reviewer.py --path . --languages python,javascript

# Focus on unsafe functions
python scripts/secure_coding_reviewer.py --path . --focus unsafe-functions
```

## Helper Scripts

- `secure_coding_reviewer.py`: Main secure coding auditor
- `python_patterns.py`: Python-specific checks
- `javascript_patterns.py`: JavaScript/TypeScript checks
- `java_patterns.py`: Java-specific checks
- `csharp_patterns.py`: C#-specific checks

## Risk Scoring

- **Critical**: eval() with user input, unsafe deserialization, shell injection
- **High**: Weak cryptography, insecure random, file path traversal
- **Medium**: Deprecated functions, missing error handling, code quality
- **Low**: Minor improvements, non-critical best practices

## Safety Rules

1. **Read-only**: Never modifies source code
2. **Language coverage**: Reports only on supported languages
3. **Scope focus**: Reports on coding practices, not design flaws
