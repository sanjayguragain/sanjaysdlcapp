---
name: sce-threat-intel-osint
description: 'Threat intelligence gathering focused on IOCs, malware analysis, threat actor profiling, and campaign tracking. Use when investigating security incidents, analyzing threats, or tracking adversary infrastructure. Returns threat intelligence report with actionable IOCs.'
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
  - threat-intelligence
  - ioc
  - malware
  - threat-actors
  tools: Bash Read Grep
  category: Security & Intelligence
---

# Threat Intelligence OSINT Skill

Gathers threat intelligence from open sources for security operations.

## When to Use This Skill

- IOC (Indicator of Compromise) analysis
- Malware family identification
- Threat actor profiling and attribution
- Campaign tracking and monitoring
- Dark web intelligence gathering
- Vulnerability intelligence
- Threat hunting support
- Incident response support

## Unitary Function

**ONE RESPONSIBILITY:** Gather threat intelligence (IOCs, malware, threat actors, campaigns)

**NOT RESPONSIBLE FOR:**
- General domain/IP profiling (see sce-domain-osint, sce-ip-osint)
- Company research (see sce-company-osint)
- People background checks (see sce-people-osint)
- Malware execution or dynamic analysis
- Active threat response (read-only intelligence)

## Input

- **ioc**: Indicator of Compromise (domain, IP, hash, URL)
- **threat_type**: Optional (malware, apt, ransomware, phishing, c2)
- **include_attribution**: Optional boolean for threat actor attribution
- **depth**: Optional (basic, standard, comprehensive)

## Output

Threat intelligence report (JSON format):

```json
{
  "investigation_id": "OSINT-THREAT-uuid",
  "timestamp": "ISO-8601",
  "ioc": "malicious.example.com",
  "ioc_type": "domain",
  "risk_score": "Critical|High|Medium|Low",
  "findings": {
    "threat_classification": {
      "category": "Command and Control",
      "malware_families": ["TrickBot", "Emotet"],
      "threat_actors": ["TA505"],
      "campaigns": ["Emotet 2025-01"]
    },
    "ioc_analysis": {
      "first_seen": "2024-12-01",
      "last_seen": "2025-01-10",
      "status": "active",
      "confidence": "high",
      "threat_feeds": [
        {
          "source": "abuse.ch",
          "category": "C2",
          "first_reported": "2024-12-01"
        },
        {
          "source": "AlienVault OTX",
          "pulses": 5,
          "tags": ["malware", "trojan"]
        }
      ]
    },
    "malware_intel": {
      "family": "Emotet",
      "variant": "Epoch 5",
      "capabilities": ["banking trojan", "downloader", "spambot"],
      "ttps": ["T1566.001", "T1105", "T1059.003"]
    },
    "infrastructure": {
      "related_ips": ["1.2.3.4", "5.6.7.8"],
      "related_domains": ["backup.malicious.com"],
      "hosting": "bulletproof hosting",
      "asn": "AS12345"
    },
    "attribution": {
      "threat_actor": "TA505",
      "motivation": "Financial",
      "target_sectors": ["Finance", "Retail", "Healthcare"],
      "target_regions": ["North America", "Europe"]
    },
    "dark_web": {
      "mentions": 3,
      "forums": ["Forum1", "Forum2"],
      "marketplace_listings": []
    }
  },
  "recommendations": [
    "Block domain at firewall and DNS level",
    "Search logs for connections to IOC",
    "Check for Emotet indicators on endpoints"
  ]
}
```

## Intelligence Gathered

### IOC Analysis
- IOC type and value
- First/last seen dates
- Current status (active/inactive/sinkholed)
- Confidence level
- Threat feed sources
- Related IOCs

### Malware Intelligence
- Malware family identification
- Variant and version
- Capabilities and behavior
- MITRE ATT&CK TTPs
- Hash values (MD5, SHA1, SHA256)
- File characteristics

### Threat Actor Profiling
- Threat actor group identification
- Known aliases and names
- Motivation (financial, espionage, hacktivism)
- Target sectors and regions
- Tools and techniques
- Historical campaigns

### Campaign Tracking
- Campaign name and timeline
- Associated IOCs
- Target profile
- Infection vectors
- Infrastructure patterns

### Infrastructure Analysis
- C2 servers and domains
- Related infrastructure
- Hosting providers
- ASN information
- Network relationships

### Dark Web Intelligence
- Dark web forum mentions
- Marketplace listings
- Exploit and tool sales
- Threat actor communications
- Leak site mentions

### Vulnerability Intelligence
- CVE associations
- Exploit availability
- Patch status
- Attack techniques

## IOC Types Supported

- **Domains**: Malicious domains, C2 servers
- **IP Addresses**: C2 IPs, malicious hosts
- **File Hashes**: MD5, SHA1, SHA256
- **URLs**: Phishing URLs, malware download links
- **Email Addresses**: Phishing sender addresses
- **User Agents**: Malicious user agents
- **SSL Certificates**: Malicious certificate hashes

## Usage Example

```bash
# Analyze suspicious domain
python scripts/threat_intel_osint.py --ioc malicious.example.com --output report.json

# Analyze file hash with attribution
python scripts/threat_intel_osint.py --ioc 44d88612fea8a8f36de82e1278abb02f --threat-type malware --include-attribution

# Comprehensive threat analysis
python scripts/threat_intel_osint.py --ioc 1.2.3.4 --depth comprehensive
```

## Helper Scripts

- `threat_intel_osint.py`: Main threat intelligence gatherer
- `ioc_analyzer.py`: IOC enrichment and analysis
- `malware_identifier.py`: Malware family identification
- `threat_actor_profiler.py`: Attribution and actor profiling
- `dark_web_monitor.py`: Dark web intelligence

## Threat Intelligence Sources

- VirusTotal
- AlienVault OTX
- abuse.ch (URLhaus, MalwareBazaar)
- Shodan
- Censys
- Hybrid Analysis
- ANY.RUN
- MITRE ATT&CK
- Dark web forums (passive monitoring)
- Threat intelligence feeds

## Risk Scoring

- **Critical**: Active C2, recent campaign, widespread distribution
- **High**: Confirmed malware, associated with APT, active exploitation
- **Medium**: Historical IOC, limited activity, low confidence
- **Low**: Potential false positive, inactive, low threat

## Safety Rules

1. **Read-only**: Never executes malware or interacts with threats
2. **No active scanning**: Uses only passive intelligence sources
3. **Sandboxed analysis**: File analysis only in isolated environments
4. **Legal compliance**: Respects laws regarding malware handling
5. **Ethical boundaries**: Does not distribute malware or facilitate attacks
6. **Scope focus**: Reports only on threat intelligence, not general OSINT
