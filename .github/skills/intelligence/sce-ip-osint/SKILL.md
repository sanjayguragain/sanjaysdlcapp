---
name: sce-ip-osint
description: 'IP address intelligence gathering including geolocation, ASN, hosting provider, open ports, and services. Use when investigating IP addresses for threat intelligence, security research, or infrastructure mapping. Returns IP intelligence report.'
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
  - ip-intelligence
  - geolocation
  - asn
  - port-scanning
  tools: Bash Read Grep
  category: Security & Intelligence
---

# IP OSINT Skill

Gathers intelligence about IP addresses from public sources.

## When to Use This Skill

- IP address geolocation
- ASN and hosting provider identification
- Open port and service discovery
- IP reputation checking
- Infrastructure mapping
- Threat intelligence on IPs
- Network reconnaissance

## Unitary Function

**ONE RESPONSIBILITY:** Gather IP address intelligence (geolocation, ASN, ports, services)

**NOT RESPONSIBLE FOR:**
- Domain WHOIS/DNS (see sce-domain-osint)
- Threat actor profiling (see sce-threat-intel-osint)
- Company research (see sce-company-osint)
- Social media intelligence (see sce-social-media-osint)
- Active exploitation (read-only reconnaissance)

## Input

- **ip_address**: Target IP address (IPv4 or IPv6)
- **include_ports**: Optional boolean for port scanning
- **depth**: Optional (basic, standard, comprehensive)

## Output

IP intelligence report (JSON format):

```json
{
  "investigation_id": "OSINT-IP-uuid",
  "timestamp": "ISO-8601",
  "target_ip": "1.2.3.4",
  "risk_score": "Low|Medium|High|Critical",
  "findings": {
    "geolocation": {
      "country": "United States",
      "region": "California",
      "city": "San Francisco",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "timezone": "America/Los_Angeles"
    },
    "asn": {
      "number": "AS12345",
      "name": "Example Hosting Provider",
      "organization": "Example Corp"
    },
    "hosting": {
      "provider": "Example Cloud Services",
      "datacenter": "US-WEST-1",
      "cloud_platform": "AWS"
    },
    "open_ports": [
      {"port": 80, "service": "HTTP", "banner": "nginx/1.18.0"},
      {"port": 443, "service": "HTTPS", "banner": "nginx/1.18.0"}
    ],
    "reputation": {
      "blacklisted": false,
      "spam_score": 0,
      "malware_reports": 0,
      "threat_feeds": []
    },
    "reverse_dns": "server.example.com"
  },
  "recommendations": []
}
```

## Intelligence Gathered

### Geolocation
- Country, region, city
- Latitude and longitude coordinates
- Timezone
- ISP information

### ASN (Autonomous System Number)
- ASN number
- Organization name
- Network range
- Peer relationships

### Hosting Information
- Cloud provider detection (AWS, Azure, GCP, etc.)
- Hosting company
- Datacenter location
- IP range ownership

### Open Ports & Services
- Common port scanning (21, 22, 23, 25, 80, 443, etc.)
- Service identification
- Banner grabbing
- Version detection

### IP Reputation
- Blacklist checking
- Spam database lookup
- Malware C2 indicators
- Threat intelligence feeds

### Reverse DNS
- PTR record lookup
- Hostname resolution

## Usage Example

```bash
# Basic IP lookup
python scripts/ip_osint.py --ip 1.2.3.4 --output report.json

# Comprehensive investigation with port scan
python scripts/ip_osint.py --ip 1.2.3.4 --depth comprehensive --include-ports

# Quick geolocation check
python scripts/ip_osint.py --ip 1.2.3.4 --depth basic
```

## Helper Scripts

- `ip_osint.py`: Main IP intelligence gatherer
- `geoip_lookup.py`: Geolocation data extraction
- `asn_lookup.py`: ASN information retrieval
- `port_scanner.py`: Open port discovery
- `ip_reputation.py`: Reputation checking

## Risk Scoring

- **Critical**: Known C2 server, active malware distribution, botnet member
- **High**: Blacklisted, multiple threat reports, suspicious activity
- **Medium**: Open unusual ports, proxy/VPN exit node, residential proxy
- **Low**: Clean reputation, legitimate hosting, normal services

## Safety Rules

1. **Read-only**: Never performs attacks or exploits
2. **Passive first**: Prioritizes passive reconnaissance
3. **Legal compliance**: Respects network policies and rate limits
4. **Scope focus**: Reports only on IP intelligence, not domain/people data
