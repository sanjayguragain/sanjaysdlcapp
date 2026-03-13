---
name: compliance-checker
description: 'Validate compliance with GDPR, PCI-DSS, HIPAA, SOC 2, and ISO 27001 standards. Maps security controls to compliance requirements and identifies gaps. Use when checking regulatory compliance or preparing for audits. Returns compliance gap analysis report.'
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
  - compliance
  - gdpr
  - pci-dss
  - hipaa
  - soc2
  tools: Bash Read Grep
  category: Security & Compliance
---

# Compliance Checker Skill

Validates compliance with regulatory standards and identifies control gaps.

## When to Use This Skill

- Checking GDPR compliance
- Validating PCI-DSS requirements
- Assessing HIPAA compliance
- Reviewing SOC 2 controls
- Checking ISO 27001 alignment
- Preparing for compliance audits
- Identifying compliance gaps

## Unitary Function

**ONE RESPONSIBILITY:** Map security controls to compliance requirements and identify gaps

**NOT RESPONSIBLE FOR:**
- Vulnerability scanning (see sce-vulnerability-scanner)
- Authentication review (see sce-auth-auditor)
- Data protection implementation (see sce-data-protection-reviewer)
- Legal sign-off (requires legal counsel)
- Fixing compliance issues (read-only skill)

## Input

- **codebase_path**: Path to source code and configurations
- **standards**: List of compliance standards (gdpr, pci-dss, hipaa, soc2, iso27001)
- **data_flow_notes**: Optional documentation of data flows and processing

## Output

Compliance report (JSON format):

```json
{
  "audit_id": "uuid",
  "timestamp": "ISO-8601",
  "standards_checked": ["GDPR", "PCI-DSS"],
  "overall_status": "Compliant|Partial|Non-Compliant",
  "findings": {
    "gdpr": {
      "status": "Partial",
      "controls_met": 12,
      "controls_missing": 3,
      "gaps": [
        {
          "requirement": "Article 17 - Right to Erasure",
          "status": "Missing",
          "evidence": "No data deletion endpoint found",
          "remediation": "Implement user data deletion functionality"
        }
      ]
    },
    "pci_dss": {
      "status": "Compliant",
      "controls_met": 10,
      "controls_missing": 0,
      "gaps": []
    }
  },
  "recommendations": []
}
```

## Compliance Standards Supported

### GDPR (General Data Protection Regulation)
- Lawful basis for processing
- Consent management
- Data minimization
- Right to access
- Right to erasure (right to be forgotten)
- Data portability
- Privacy by design
- Data breach notification

### PCI-DSS (Payment Card Industry Data Security Standard)
- Secure cardholder data storage
- Encrypted transmission
- Access control
- Network segmentation
- Vulnerability management
- Security testing
- Logging and monitoring

### HIPAA (Health Insurance Portability and Accountability Act)
- PHI encryption
- Access controls
- Audit logging
- Breach notification
- Business associate agreements
- Minimum necessary rule

### SOC 2
- Security (Common Criteria)
- Availability
- Processing integrity
- Confidentiality
- Privacy

### ISO 27001
- Information security management system (ISMS)
- Risk assessment
- Security controls (Annex A)
- Continuous improvement

## Usage Example

```bash
# Check GDPR compliance
python scripts/compliance_checker.py --path . --standards gdpr --output report.json

# Check multiple standards
python scripts/compliance_checker.py --path . --standards gdpr,pci-dss,hipaa --output report.json

# Comprehensive compliance audit
python scripts/compliance_checker.py --path . --standards all --data-flow docs/data-flow.md
```

## Helper Scripts

- `compliance_checker.py`: Main compliance auditor
- `gdpr_checker.py`: GDPR-specific validation
- `pci_checker.py`: PCI-DSS validation
- `hipaa_checker.py`: HIPAA validation
- `soc2_checker.py`: SOC 2 control validation

## Compliance Status Levels

- **Compliant**: All required controls implemented and validated
- **Partial**: Some controls met, gaps identified
- **Non-Compliant**: Critical controls missing, significant gaps

## Risk Scoring

- **Critical**: Core compliance requirements missing (e.g., no encryption for PCI)
- **High**: Important controls missing (e.g., no GDPR consent management)
- **Medium**: Documentation gaps, partial implementations
- **Low**: Minor improvements, best practice recommendations

## Safety Rules

1. **Read-only**: Never modifies code or configurations
2. **Not legal advice**: Reports technical controls, not legal compliance
3. **Requires context**: Works best with data flow and architecture documentation
4. **Scope focus**: Reports on technical controls, not business processes
