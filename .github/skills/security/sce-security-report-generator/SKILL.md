---
name: sce-security-report-generator
description: 'Generate security assessment reports in multiple formats (HTML, Allure JSON). Transforms consolidated security findings into user-friendly HTML dashboards and Allure-compatible JSON for CI/CD integration. Use after aggregating security check results to produce formatted output.'
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
  - reporting
  - html
  - allure
  - visualization
  tools: Write Read
  category: Security & Compliance
---

# Security Report Generator Skill

Transforms security findings into HTML dashboards and Allure JSON reports.

## When to Use This Skill

- Generating user-friendly HTML security reports
- Creating Allure-compatible reports for CI/CD
- Formatting security findings for stakeholders
- Producing visual dashboards from security scans
- Exporting results for integration with test frameworks

## Unitary Function

**ONE RESPONSIBILITY:** Format security findings into predefined report formats (HTML, Allure JSON)

**NOT RESPONSIBLE FOR:**
- Running security checks (see security validation skills)
- Aggregating findings (see sce-security-check-agent)
- Fixing vulnerabilities (reporting only)
- Deploying or hosting reports (write to filesystem only)
- Opening reports in browser (file generation only)

## Input

Aggregated security findings in JSON format:

```json
{
  "summary": {
    "project_name": "My API",
    "project_type": "web_api",
    "scan_date": "2026-01-13T10:30:00Z",
    "repository_path": "/path/to/repo",
    "languages": ["Python", "JavaScript"],
    "frameworks": ["Flask", "React"],
    "total_issues": 15,
    "critical": 2,
    "high": 5,
    "medium": 6,
    "low": 2,
    "checks_executed": 7,
    "scan_duration": "2m 34s"
  },
  "findings": [
    {
      "id": "VULN-001",
      "severity": "critical",
      "category": "SQL Injection",
      "source": "sce-input-validation-checker",
      "location": "app/routes.py:45",
      "description": "Unsanitized user input in SQL query",
      "remediation": "Use parameterized queries or ORM",
      "cwe": "CWE-89",
      "owasp": "A03:2021",
      "code_snippet": "query = f\"SELECT * FROM users WHERE id={user_id}\""
    }
  ],
  "executed_checks": [
    {"skill": "sce-vulnerability-scanner", "status": "completed", "issues": 8, "duration": "45s"},
    {"skill": "sce-api-security-reviewer", "status": "completed", "issues": 3, "duration": "12s"}
  ],
  "skipped_checks": [
    {"skill": "sce-mobile-security-auditor", "reason": "No mobile code detected"}
  ],
  "remediation_plan": {
    "priority_1": ["Fix SQL injection in routes.py", "Remove hardcoded API keys"],
    "priority_2": ["Add rate limiting", "Implement CORS headers"],
    "estimated_effort": "8-12 hours"
  }
}
```

**Configuration Options:**
```json
{
  "input_file": "aggregated_findings.json",
  "output_dir": "security-reports/",
  "formats": ["html", "allure"],
  "options": {
    "html_title": "Security Assessment Report",
    "html_theme": "default",
    "include_passed_checks": true,
    "allure_suite_name": "Security Validation",
    "allure_environment": {
      "Language": "Python 3.11",
      "Framework": "Flask 2.3.0"
    }
  }
}
```

## Output

Generates two report formats:

### 1. HTML Report (`security-report.html`)

Interactive dashboard with:
- **Executive Summary:** Overview with severity breakdown
- **Visual Charts:** Pie charts, bar graphs for severity distribution
- **Findings Table:** Sortable, filterable vulnerability list
- **Remediation Plan:** Prioritized action items
- **Technology Stack:** Languages and frameworks detected
- **Check Execution:** Summary of executed and skipped checks
- **Detailed View:** Expandable sections for each finding with code snippets

**HTML Features:**
- Responsive design (mobile-friendly)
- Works offline (no external dependencies)
- Print-friendly styling
- Dark/light mode toggle
- Search and filter functionality
- Export to PDF capability (browser print)

### 2. Allure JSON Report (`allure-results/*.json`)

Allure Framework 2.x compatible format:
- **Container JSON:** Test suite wrapper
- **Result JSON:** Each finding as individual test result
- **Categories JSON:** Vulnerability type grouping
- **Environment JSON:** Technology stack info

**File Structure:**
```
security-reports/
├── security-report.html
├── allure-results/
│   ├── container-<uuid>.json
│   ├── result-VULN-001-<uuid>.json
│   ├── result-VULN-002-<uuid>.json
│   ├── ...
│   ├── categories.json
│   └── environment.properties
```

## Allure JSON Format

### Test Result Format

Each security finding becomes an Allure test result:

```json
{
  "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "historyId": "VULN-001",
  "name": "SQL Injection in app/routes.py:45",
  "status": "failed",
  "statusDetails": {
    "message": "Critical: Unsanitized user input in SQL query",
    "trace": "Source: sce-input-validation-checker\nCWE-89 | OWASP A03:2021"
  },
  "stage": "finished",
  "description": "Use parameterized queries or ORM to prevent SQL injection attacks.",
  "start": 1736762400000,
  "stop": 1736762405000,
  "steps": [
    {
      "name": "Detection by sce-input-validation-checker",
      "status": "finished",
      "stage": "finished",
      "start": 1736762400000,
      "stop": 1736762405000
    }
  ],
  "attachments": [
    {
      "name": "Code Snippet",
      "type": "text/plain",
      "source": "code-snippet-vuln-001.txt"
    }
  ],
  "labels": [
    {"name": "severity", "value": "blocker"},
    {"name": "tag", "value": "SQL Injection"},
    {"name": "tag", "value": "CWE-89"},
    {"name": "tag", "value": "OWASP A03:2021"},
    {"name": "feature", "value": "Input Validation"},
    {"name": "suite", "value": "Security Validation"}
  ],
  "links": [
    {
      "name": "CWE-89: SQL Injection",
      "url": "https://cwe.mitre.org/data/definitions/89.html",
      "type": "issue"
    },
    {
      "name": "OWASP A03:2021",
      "url": "https://owasp.org/Top10/A03_2021-Injection/",
      "type": "issue"
    }
  ]
}
```

### Severity Mapping

Security severity → Allure severity:
- `critical` → `blocker`
- `high` → `critical`
- `medium` → `normal`
- `low` → `minor`
- `info` → `trivial`

### Categories JSON

Groups findings by vulnerability type:

```json
[
  {
    "name": "SQL Injection Vulnerabilities",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*SQL.*Injection.*"
  },
  {
    "name": "Cross-Site Scripting (XSS)",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*XSS.*|.*Cross-Site Scripting.*"
  },
  {
    "name": "Authentication Issues",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*Authentication.*|.*Authorization.*"
  },
  {
    "name": "Cryptographic Failures",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*Encryption.*|.*Crypto.*|.*Hash.*"
  }
]
```

### Environment Properties

Captures scan context:

```properties
Language=Python, JavaScript
Framework=Flask, React
Project.Type=web_api
Scan.Date=2026-01-13T10:30:00Z
Total.Issues=15
Critical.Issues=2
High.Issues=5
Scan.Duration=2m 34s
```

## Usage Example

```bash
# Generate both HTML and Allure reports
python scripts/security_report_generator.py \
  --input aggregated_findings.json \
  --output security-reports/ \
  --formats html,allure

# Generate only HTML report
python scripts/security_report_generator.py \
  --input findings.json \
  --output reports/ \
  --format html \
  --title "Q1 Security Assessment"

# Generate Allure report with custom environment
python scripts/security_report_generator.py \
  --input findings.json \
  --format allure \
  --suite "Production Security Scan" \
  --env "env=production,version=2.5.1"
```

## HTML Template Structure

Uses modular Jinja2 templates:

```
templates/
├── base.html              # Layout, navigation, header/footer
├── components/
│   ├── summary.html       # Executive summary section
│   ├── charts.html        # Chart visualizations
│   ├── findings.html      # Vulnerability table
│   ├── remediation.html   # Action plan section
│   └── tech-stack.html    # Technology overview
└── assets/
    ├── styles.css         # Report styling
    ├── charts.js          # Chart.js configurations
    └── filters.js         # Search/filter logic
```

## Report Generation Process

### 1. Input Validation
- Validate JSON schema
- Check required fields
- Verify severity values
- Ensure output directory writable

### 2. Data Transformation
- Map severity to display labels
- Group findings by category
- Calculate statistics
- Generate UUIDs for Allure

### 3. HTML Generation
- Render Jinja2 templates
- Embed chart data
- Apply styling
- Inject JavaScript for interactivity

### 4. Allure JSON Generation
- Create container JSON (suite)
- Generate result JSON per finding
- Build categories JSON
- Write environment properties
- Create code snippet attachments

### 5. File Output
- Write HTML to output directory
- Create `allure-results/` folder
- Write all Allure JSON files
- Save code snippet attachments

## Quality Checks

Before completing generation:
- [ ] Input JSON schema validated
- [ ] All findings included in reports
- [ ] Severity levels correctly mapped
- [ ] UUIDs generated for Allure compatibility
- [ ] Output files successfully written
- [ ] HTML validates (no broken links/images)
- [ ] Allure JSON passes schema validation

## Guardrails

1. **Read-only on input:** Never modifies source findings
2. **File safety:** Creates output directory if missing, never overwrites without confirmation
3. **Validation:** Checks JSON schema before generation
4. **Error handling:** Continues if one format fails (generates the other)
5. **Sanitization:** Escapes HTML in user-provided strings
6. **Size limits:** Warns if report exceeds 10MB

## Viewing Generated Reports

### HTML Report
```bash
# Open in default browser
open security-reports/security-report.html

# Or serve locally
python -m http.server 8000 -d security-reports/
# Visit http://localhost:8000/security-report.html
```

### Allure Report
```bash
# Generate and open Allure report
allure serve security-reports/allure-results/

# Or generate static HTML
allure generate security-reports/allure-results/ -o allure-report/
allure open allure-report/
```

## Dependencies

**Required:**
- `jinja2` - HTML template rendering
- `json` - JSON parsing and generation
- `uuid` - Unique identifier generation
- `datetime` - Timestamp formatting

**Optional (for enhanced features):**
- `matplotlib` or `plotly` - Chart image generation
- `weasyprint` - Direct PDF export
- `allure-commandline` - Allure report viewing

## Authority Boundaries

**This Skill CAN:**
- Read aggregated findings JSON
- Generate HTML reports
- Generate Allure JSON files
- Create output directories
- Write report files to disk
- Create code snippet attachments

**This Skill CANNOT:**
- Modify input findings data
- Execute Allure CLI commands
- Open reports in browser (user responsibility)
- Upload reports to external services
- Make security decisions
- Filter or suppress findings

## References

- Allure Framework: https://github.com/allure-framework/allure2
- Allure Report Docs: https://allurereport.org/docs/
- Allure JSON Schema: https://github.com/allure-framework/allure2/tree/master/allure-model
- OWASP Severity Ratings: https://owasp.org/www-community/OWASP_Risk_Rating_Methodology
- Chart.js: https://www.chartjs.org/
- Jinja2 Templates: https://jinja.palletsprojects.com/
