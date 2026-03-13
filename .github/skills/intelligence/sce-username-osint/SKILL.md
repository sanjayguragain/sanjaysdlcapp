---
name: username-osint
description: 'Username enumeration and footprint discovery across online platforms. Use when investigating usernames for security research, threat intelligence, or user profiling. Returns username enumeration report with platform presence.'
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
  - username-enumeration
  - reconnaissance
  - platform-discovery
  - user-profiling
  tools: Bash Read Grep
  category: Security & Intelligence
---

# Username OSINT Skill

Enumerates username presence across online platforms and confirms digital footprint.

## When to Use This Skill

- Username enumeration across platforms
- Digital footprint discovery
- User profiling and correlation
- Threat actor identification
- Account takeover investigation
- Security awareness assessment
- Cross-platform username tracking

## Unitary Function

**ONE RESPONSIBILITY:** Enumerate username presence across platforms

**NOT RESPONSIBLE FOR:**
- Social media content scraping (see sce-social-media-osint)
- Email intelligence (see sce-email-osint)
- People background checks (see sce-people-osint)
- Company research (see sce-company-osint)
- Profile content analysis (only confirms presence)

## Input

- **username**: Target username
- **platforms**: Optional list of specific platforms (default: all common platforms)
- **depth**: Optional (basic, standard, comprehensive)

## Output

Username enumeration report (JSON format):

```json
{
  "investigation_id": "OSINT-USERNAME-uuid",
  "timestamp": "ISO-8601",
  "target_username": "exampleuser",
  "risk_score": "Low|Medium|High|Critical",
  "findings": {
    "platforms_found": [
      {
        "platform": "GitHub",
        "username": "exampleuser",
        "profile_url": "https://github.com/exampleuser",
        "confirmed": true,
        "last_activity": "2025-01-10",
        "public_info": {
          "name": "Example User",
          "bio": "Software Developer",
          "location": "San Francisco"
        }
      },
      {
        "platform": "Twitter",
        "username": "exampleuser",
        "profile_url": "https://twitter.com/exampleuser",
        "confirmed": true,
        "last_activity": "2025-01-11"
      }
    ],
    "platforms_not_found": ["Instagram", "Reddit"],
    "total_platforms_checked": 50,
    "total_found": 15,
    "username_variations": [
      "example_user",
      "exampleuser123"
    ]
  },
  "recommendations": []
}
```

## Platforms Enumerated

### Social Media
- Twitter/X
- Facebook
- Instagram
- LinkedIn
- TikTok
- Snapchat
- Pinterest
- Reddit

### Developer Platforms
- GitHub
- GitLab
- Bitbucket
- Stack Overflow
- HackerRank
- CodePen

### Professional Networks
- LinkedIn
- AngelList
- Behance
- Dribbble

### Forums & Communities
- Reddit
- HackerNews
- Medium
- Dev.to
- Quora

### Gaming Platforms
- Steam
- Xbox Live
- PlayStation Network
- Discord
- Twitch

### Other Platforms
- YouTube
- Vimeo
- SoundCloud
- Spotify
- Patreon

## Intelligence Gathered

### Username Presence
- Platform confirmation
- Profile URL
- Account creation date (if available)
- Last activity timestamp

### Public Profile Info
- Display name
- Bio/description
- Location
- Profile picture availability
- Follower/following counts

### Username Variations
- Common variations discovered
- Similar usernames
- Typosquatting detection

## Usage Example

```bash
# Enumerate username across all platforms
python scripts/username_osint.py --username exampleuser --output report.json

# Check specific platforms
python scripts/username_osint.py --username exampleuser --platforms github,twitter,linkedin

# Comprehensive search including variations
python scripts/username_osint.py --username exampleuser --depth comprehensive
```

## Helper Scripts

- `username_osint.py`: Main username enumerator
- `platform_checkers.py`: Platform-specific presence verification
- `username_variations.py`: Username variation generator
- `profile_extractor.py`: Basic public info extraction

## Risk Scoring

- **Critical**: Username associated with known threat actors or malicious activity
- **High**: Extensive digital footprint, potential OPSEC violations
- **Medium**: Moderate platform presence, some personal info exposed
- **Low**: Minimal digital footprint, privacy-conscious usage

## Safety Rules

1. **Read-only**: Never creates accounts or interacts with platforms
2. **Passive reconnaissance**: Only checks public information
3. **Rate limiting**: Respects platform rate limits and ToS
4. **No harassment**: Never contacts or stalks users
5. **Scope focus**: Reports only on username presence, not content
