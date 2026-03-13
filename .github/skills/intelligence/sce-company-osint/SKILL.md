---
name: sce-company-osint
description: 'Company and corporate intelligence gathering including business records, employee discovery, technology stack, partnerships, and digital footprint. Use when researching companies for due diligence, threat intelligence, or competitive analysis. Returns comprehensive company intelligence report (CORPINT).'
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
  - corpint
  - company-research
  - business-intelligence
  - tech-stack
  tools: Bash Read Grep
  category: Security & Intelligence
---

# Company OSINT Skill

Gathers corporate intelligence (CORPINT) about companies and organizations.

## When to Use This Skill

- Company background research
- Due diligence investigations
- Competitive intelligence gathering
- Technology stack identification
- Employee discovery and profiling
- Partnership and supplier mapping
- Digital asset inventory
- Merger and acquisition research

## Unitary Function

**ONE RESPONSIBILITY:** Gather company intelligence (business info, employees, tech, relationships)

**NOT RESPONSIBLE FOR:**
- Personal background checks (see sce-people-osint)
- Domain/infrastructure only (see sce-domain-osint)
- Social media content (see sce-social-media-osint)
- Threat intelligence (see sce-threat-intel-osint)
- Financial advice or legal opinions

## Input

- **company**: Company name or domain
- **include_employees**: Optional boolean to discover employees
- **include_tech**: Optional boolean to identify technology stack
- **depth**: Optional (basic, standard, comprehensive)

## Output

Company intelligence report (JSON format):

```json
{
  "investigation_id": "OSINT-COMPANY-uuid",
  "timestamp": "ISO-8601",
  "target_company": "Example Corporation",
  "risk_score": "Low|Medium|High|Critical",
  "findings": {
    "basic_info": {
      "legal_name": "Example Corporation Inc.",
      "dba": "Example Corp",
      "founded": "2010",
      "headquarters": "San Francisco, CA",
      "industry": "Technology / SaaS",
      "company_size": "51-200 employees",
      "revenue_range": "$10M-$50M (estimated)"
    },
    "digital_presence": {
      "primary_domain": "example.com",
      "additional_domains": ["examplecorp.com", "example.io"],
      "social_media": {
        "linkedin": "https://linkedin.com/company/example",
        "twitter": "https://twitter.com/examplecorp",
        "facebook": "https://facebook.com/examplecorp"
      },
      "app_store": ["iOS App", "Android App"]
    },
    "employees": {
      "total_found": 150,
      "key_personnel": [
        {
          "name": "John Doe",
          "title": "CEO & Founder",
          "linkedin": "https://linkedin.com/in/johndoe",
          "location": "San Francisco"
        }
      ],
      "departments": {
        "engineering": 60,
        "sales": 30,
        "marketing": 20,
        "operations": 40
      }
    },
    "technology_stack": {
      "frontend": ["React", "TypeScript"],
      "backend": ["Node.js", "Python", "PostgreSQL"],
      "infrastructure": ["AWS", "Docker", "Kubernetes"],
      "tools": ["GitHub", "Jira", "Slack"]
    },
    "partnerships": [
      {
        "partner": "Partner Company",
        "type": "Technology Partner",
        "announced": "2024-06-01"
      }
    ],
    "news_mentions": [
      {
        "date": "2024-12-15",
        "source": "TechCrunch",
        "title": "Example Corp raises $10M Series A",
        "url": "https://..."
      }
    ]
  },
  "recommendations": []
}
```

## Intelligence Gathered

### Business Information
- Legal entity name and structure
- Registration details
- Business address and locations
- Industry classification
- Company size and revenue estimates
- Founding date and history

### Digital Assets
- Primary and secondary domains
- Social media profiles
- Mobile applications
- Cloud services
- GitHub organizations
- Email domains

### Employee Intelligence
- Employee count and distribution
- Key personnel and leadership
- Department structure
- LinkedIn profiles
- Contact information
- Hiring trends (from job postings)

### Technology Stack
- Frontend frameworks and libraries
- Backend technologies and databases
- Infrastructure and cloud providers
- Development tools and platforms
- Third-party services and APIs
- Open source projects

### Business Relationships
- Partners and alliances
- Suppliers and vendors
- Customers (if publicly available)
- Investors and funding
- Subsidiaries and acquisitions

### Public Records
- News articles and press releases
- Financial filings (if public company)
- Patents and trademarks
- Legal proceedings
- Regulatory filings

## Usage Example

```bash
# Basic company research
python scripts/company_osint.py --company "Example Corporation" --output report.json

# Comprehensive research with employees and tech
python scripts/company_osint.py --domain example.com --depth comprehensive --include-employees --include-tech

# Technology stack focus
python scripts/company_osint.py --domain example.com --include-tech
```

## Helper Scripts

- `company_osint.py`: Main company intelligence gatherer
- `employee_finder.py`: Employee discovery via LinkedIn, GitHub
- `tech_detector.py`: Technology stack identification
- `business_records.py`: Public records search
- `partnership_mapper.py`: Relationship mapping

## Risk Scoring

- **Critical**: Active security incidents, major legal issues, bankruptcy
- **High**: Data breaches, significant financial troubles, regulatory violations
- **Medium**: Employee turnover, technology risks, minor legal issues
- **Low**: Normal business operations, stable company profile

## Safety Rules

1. **Read-only**: Never contacts company or employees
2. **Public data only**: Uses only publicly available information
3. **Legal compliance**: Respects data protection and business intelligence laws
4. **No trade secrets**: Does not attempt to access confidential information
5. **Ethical boundaries**: Does not engage in corporate espionage
6. **Scope focus**: Reports only on company intelligence, not personal data
