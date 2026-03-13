---
name: sce-email-osint
description: 'Email intelligence gathering including validation, breach exposure checking, linked account discovery, and reputation analysis. Use when investigating email addresses for security research, due diligence, or threat intelligence. Returns email intelligence report.'
compatibility:
- claude-code
- codex
- amp
- opencode
metadata:
  version: 1.0.0
  author: SDLC Security Team
  tags:
  - osint
  - email-intelligence
  - breach-data
  - validation
  - reputation
  tools: Bash Read Grep
  category: Security & Intelligence
---

# Email OSINT Skill

Gathers intelligence about email addresses from public sources and breach databases.

## When to Use This Skill

- Email address validation
- Breach exposure checking
- Linked account discovery
- Email reputation analysis
- Phishing investigation
- User profiling
- Security awareness assessments

## Unitary Function

**ONE RESPONSIBILITY:** Gather email intelligence (validation, breaches, linked accounts)

**NOT RESPONSIBLE FOR:**
- Social media content scraping (see sce-social-media-osint)
- Company research (see sce-company-osint)
- Domain intelligence (see sce-domain-osint)
- People background checks (see sce-people-osint)
- Sending emails or phishing (ethical boundaries)

## Input

- **email**: Target email address
- **check_breaches**: Optional boolean to check breach databases
- **find_accounts**: Optional boolean to find linked accounts
- **depth**: Optional (basic, standard, comprehensive)

## Output

Email intelligence report (JSON format):

```json
{
  "investigation_id": "OSINT-EMAIL-uuid",
  "timestamp": "ISO-8601",
  "target_email": "user@example.com",
  "risk_score": "Low|Medium|High|Critical",
  "findings": {
    "validation": {
      "valid": true,
      "syntax_valid": true,
      "domain_valid": true,
      "mx_records_exist": true,
      "disposable": false,
      "role_account": false
    },
    "breaches": [
      {
        "breach_name": "Example Breach 2023",
        "breach_date": "2023-06-15",
        "exposed_data": ["emails", "passwords", "names"],
        "password_exposed": true,
        "records": 50000000
      }
    ],
    "linked_accounts": [
      {
        "platform": "GitHub",
        "username": "exampleuser",
        "profile_url": "https://github.com/exampleuser"
      },
      {
        "platform": "Twitter",
        "username": "exampleuser",
        "profile_url": "https://twitter.com/exampleuser"
      }
    ],
    "reputation": {
      "spam_score": 0,
      "disposable_email": false,
      "free_provider": true,
      "catch_all": false
    },
    "domain_info": {
      "domain": "example.com",
      "company": "Example Corporation",
      "corporate_email": true
    }
  },
  "recommendations": []
}
```

## Intelligence Gathered

### Email Validation
- Syntax validation (RFC compliance)
- Domain existence check
- MX record verification
- Disposable email detection
- Role account identification (info@, admin@, etc.)
- Catch-all detection

### Breach Exposure
- Have I Been Pwned (HIBP) lookup
- Breach databases (public sources)
- Exposed data types
- Breach dates and severity
- Password compromise status

### Linked Accounts
- Social media platforms
- Professional networks (LinkedIn, GitHub)
- Forum registrations
- Public profile discovery
- Username correlation

### Email Reputation
- Spam database checking
- Email deliverability score
- Blacklist status
- Historical spam activity

### Domain Analysis
- Email provider identification
- Corporate vs personal email
- Company affiliation
- Domain reputation

## Usage Example

```bash
# Basic email validation
python scripts/email_osint.py --email user@example.com --output report.json

# Comprehensive investigation
python scripts/email_osint.py --email user@example.com --depth comprehensive --check-breaches --find-accounts

# Breach check only
python scripts/email_osint.py --email user@example.com --check-breaches
```

## Helper Scripts

- `email_osint.py`: Main email intelligence gatherer
- `email_validator.py`: Email validation and verification
- `breach_checker.py`: Breach database lookup
- `account_finder.py`: Linked account discovery
- `email_reputation.py`: Reputation checking

## Risk Scoring

- **Critical**: Multiple recent breach exposures, known compromised credentials
- **High**: Exposed in major breach, password compromised
- **Medium**: Exposed in old breach, partial data exposure
- **Low**: No breach exposure, clean reputation

## Safety Rules

1. **Read-only**: Never sends emails or contacts targets
2. **Ethical boundaries**: Never uses findings for phishing or harassment
3. **Privacy respect**: Reports only publicly available data
4. **Legal compliance**: Respects data protection regulations
5. **Scope focus**: Reports only on email intelligence, not social content
