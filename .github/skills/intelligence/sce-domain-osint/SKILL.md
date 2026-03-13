---
name: sce-domain-osint
description: 'Domain-centric OSINT gathering including WHOIS, DNS records, SSL/TLS certificates, subdomain discovery, and historical records. Use when investigating domains for security research, threat intelligence, or due diligence. Returns comprehensive domain intelligence report.'
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
  - domain-intelligence
  - whois
  - dns
  - reconnaissance
  tools: Bash Read Grep
  category: Security & Intelligence
---

# Domain OSINT Skill

Gathers comprehensive intelligence about domains from public sources.

## When to Use This Skill

- Domain ownership and registration research
- DNS enumeration and analysis
- SSL/TLS certificate investigation
- Subdomain discovery
- Historical domain records research
- Domain reputation checking
- Attack surface mapping

## Unitary Function

**ONE RESPONSIBILITY:** Gather domain-centric intelligence (WHOIS, DNS, SSL, subdomains, history)

**NOT RESPONSIBLE FOR:**
- IP address intelligence (see sce-ip-osint)
- People/company research (see sce-company-osint, sce-people-osint)
- Social media investigation (see sce-social-media-osint)
- Threat intelligence (see sce-threat-intel-osint)
- Taking action on findings (read-only skill)

## Input

- **domain**: Target domain name (e.g., example.com)
- **depth**: Optional (basic, standard, comprehensive)
- **include_historical**: Optional boolean to include historical records

## Output

Domain intelligence report (JSON format):

```json
{
  "investigation_id": "OSINT-DOMAIN-uuid",
  "timestamp": "ISO-8601",
  "target_domain": "example.com",
  "risk_score": "Low|Medium|High|Critical",
  "findings": {
    "whois": {
      "registrar": "Example Registrar",
      "registrant": "Company Name",
      "registration_date": "2020-01-01",
      "expiry_date": "2025-01-01",
      "name_servers": ["ns1.example.com", "ns2.example.com"],
      "status": ["clientTransferProhibited"]
    },
    "dns": {
      "a_records": ["1.2.3.4"],
      "mx_records": ["mail.example.com"],
      "txt_records": ["v=spf1 include:_spf.example.com ~all"],
      "ns_records": ["ns1.example.com"],
      "cname_records": {},
      "dnssec": true
    },
    "ssl_tls": {
      "valid": true,
      "issuer": "Let's Encrypt",
      "valid_from": "2025-01-01",
      "valid_until": "2025-04-01",
      "subject_alt_names": ["example.com", "www.example.com"],
      "certificate_transparency": true
    },
    "subdomains": [
      "www.example.com",
      "api.example.com",
      "mail.example.com"
    ],
    "historical": {
      "previous_owners": [],
      "ip_history": [],
      "wayback_snapshots": 150
    }
  },
  "recommendations": []
}
```

## Intelligence Gathered

### WHOIS Information
- Registrar details
- Registrant information
- Registration and expiry dates
- Name servers
- Domain status
- Contact information (if available)

### DNS Records
- A records (IPv4)
- AAAA records (IPv6)
- MX records (mail)
- TXT records (SPF, DKIM, DMARC)
- NS records (name servers)
- CNAME records
- DNSSEC validation

### SSL/TLS Certificates
- Certificate validity
- Issuer information
- Subject alternative names (SANs)
- Certificate chain
- Certificate transparency logs

### Subdomains
- Active subdomain discovery
- Passive subdomain enumeration
- Certificate transparency subdomain extraction
- DNS zone transfers (if misconfigured)

### Historical Records
- Previous WHOIS records
- IP address history
- Wayback Machine snapshots
- Historical DNS records

## Usage Example

```bash
# Basic domain investigation
python scripts/domain_osint.py --domain example.com --output report.json

# Comprehensive investigation with history
python scripts/domain_osint.py --domain example.com --depth comprehensive --historical

# Quick DNS check
python scripts/domain_osint.py --domain example.com --depth basic
```

## Helper Scripts

- `domain_osint.py`: Main domain intelligence gatherer
- `whois_lookup.py`: WHOIS data extraction
- `dns_enum.py`: DNS record enumeration
- `ssl_analyzer.py`: SSL/TLS certificate analysis
- `subdomain_enum.py`: Subdomain discovery

## Risk Scoring

- **Critical**: Active malicious activity, C2 indicators, known phishing domain
- **High**: Suspicious registration patterns, privacy-protected WHOIS, short TTL
- **Medium**: Recently registered, no DNSSEC, expired SSL
- **Low**: Standard domain, normal patterns, good security posture

## Safety Rules

1. **Read-only**: Never performs actions against target domains
2. **Passive reconnaissance**: Uses only public data sources
3. **Legal compliance**: Respects robots.txt and rate limits
4. **Scope focus**: Reports only on domain intelligence, not related entities
