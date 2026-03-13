---
name: sce-people-osint
description: 'People search and background intelligence including public records, social profiles, contact information, employment history, and education. Use when researching individuals for due diligence, security investigations, or background checks. Returns people search intelligence report (HUMINT sources).'
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
  - people-search
  - background-check
  - public-records
  - humint
  tools: Bash Read Grep
  category: Security & Intelligence
---

# People OSINT Skill

Gathers intelligence about individuals from public sources (HUMINT).

## When to Use This Skill

- Background research on individuals
- Due diligence investigations
- Security clearance support
- Threat actor identification
- Missing person research
- Contact information discovery
- Professional history verification
- Education verification

## Unitary Function

**ONE RESPONSIBILITY:** Gather people intelligence (public records, profiles, contact info, history)

**NOT RESPONSIBLE FOR:**
- Company research (see sce-company-osint)
- Social media content analysis (see sce-social-media-osint)
- Email breach checking (see sce-email-osint)
- Username enumeration (see sce-username-osint)
- Legal background checks (requires proper authorization)

## Input

- **name**: Person's full name
- **identifiers**: Optional additional identifiers (email, phone, location, username)
- **include_contacts**: Optional boolean to find contact information
- **depth**: Optional (basic, standard, comprehensive)

## Output

People intelligence report (JSON format):

```json
{
  "investigation_id": "OSINT-PEOPLE-uuid",
  "timestamp": "ISO-8601",
  "target_name": "John Doe",
  "risk_score": "Low|Medium|High|Critical",
  "findings": {
    "basic_info": {
      "full_name": "John Michael Doe",
      "age_range": "35-40",
      "current_location": "San Francisco, CA",
      "previous_locations": ["New York, NY", "Boston, MA"]
    },
    "contact_information": {
      "email_addresses": ["john.doe@example.com"],
      "phone_numbers": ["+1-555-0123"],
      "social_media_handles": ["@johndoe"]
    },
    "professional": {
      "current_employer": "Example Corporation",
      "current_title": "Senior Software Engineer",
      "linkedin": "https://linkedin.com/in/johndoe",
      "employment_history": [
        {
          "company": "Previous Corp",
          "title": "Software Engineer",
          "duration": "2015-2020",
          "location": "New York, NY"
        }
      ],
      "skills": ["Python", "JavaScript", "Cloud Architecture"]
    },
    "education": [
      {
        "institution": "University of Example",
        "degree": "Bachelor of Science in Computer Science",
        "graduation_year": "2010",
        "location": "Boston, MA"
      }
    ],
    "social_profiles": [
      {
        "platform": "LinkedIn",
        "url": "https://linkedin.com/in/johndoe"
      },
      {
        "platform": "GitHub",
        "url": "https://github.com/johndoe"
      }
    ],
    "public_records": {
      "business_registrations": [],
      "property_records": [],
      "professional_licenses": []
    },
    "digital_footprint": {
      "websites": ["johndoe.com"],
      "blog_posts": 15,
      "publications": [],
      "speaking_engagements": []
    }
  },
  "recommendations": []
}
```

## Intelligence Gathered

### Basic Information
- Full legal name and aliases
- Age or age range
- Current and previous locations
- Nationality (if publicly available)

### Contact Information
- Email addresses
- Phone numbers
- Physical addresses (if publicly available)
- Social media handles

### Professional History
- Current employment
- Employment history
- Job titles and roles
- LinkedIn profile
- Professional skills and certifications
- Salary ranges (from public sources)

### Education Background
- Educational institutions
- Degrees and certifications
- Graduation dates
- Academic achievements
- Professional training

### Social Media Presence
- LinkedIn profile
- Professional networks
- GitHub and technical profiles
- Public social media accounts
- Online portfolios

### Public Records
- Business registrations
- Property records
- Professional licenses
- Court records (public filings)
- Voter registration (where public)

### Digital Footprint
- Personal websites and blogs
- Published articles and papers
- Speaking engagements
- Conference presentations
- Open source contributions
- Patents and inventions

### Family and Associates
- Known associates (from public sources)
- Family members (from public records)
- Professional networks

## Usage Example

```bash
# Basic people search
python scripts/people_osint.py --name "John Doe" --location "San Francisco" --output report.json

# Comprehensive search with identifiers
python scripts/people_osint.py --name "John Doe" --email john.doe@example.com --include-contacts --depth comprehensive

# Professional history focus
python scripts/people_osint.py --name "John Doe" --linkedin-url https://linkedin.com/in/johndoe
```

## Helper Scripts

- `people_osint.py`: Main people intelligence gatherer
- `public_records_search.py`: Public records lookup
- `contact_finder.py`: Contact information discovery
- `professional_verifier.py`: Employment and education verification
- `social_profile_aggregator.py`: Social profile collection

## Risk Scoring

- **Critical**: Criminal activity indicators, national security concerns
- **High**: Significant legal issues, financial fraud indicators
- **Medium**: Minor legal issues, employment gaps, conflicting information
- **Low**: Clean public record, verifiable information, normal profile

## Safety Rules

1. **Read-only**: Never contacts individuals or associates
2. **Public data only**: Uses only publicly available information
3. **Legal compliance**: Respects data protection and privacy laws (GDPR, FCRA)
4. **Ethical boundaries**: Does not engage in stalking or harassment
5. **Authorization required**: Background checks require proper legal authorization
6. **Privacy respect**: Does not attempt to access private information
7. **Scope focus**: Reports only on publicly available people intelligence
8. **No discrimination**: Does not use protected characteristics for discriminatory purposes
