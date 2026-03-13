---
name: sce-social-media-osint
description: 'Social media intelligence gathering including profile discovery, post analysis, connection mapping, and sentiment analysis. Use when investigating social media presence for security research, threat intelligence, or background checks. Returns social media intelligence report (SOCMINT).'
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
  - socmint
  - social-media
  - profile-analysis
  - sentiment-analysis
  tools: Bash Read Grep
  category: Security & Intelligence
---

# Social Media OSINT Skill

Gathers social media intelligence (SOCMINT) from public profiles and posts.

## When to Use This Skill

- Social media profile discovery
- Public post and content analysis
- Connection and network mapping
- Timeline and activity pattern analysis
- Sentiment analysis
- Threat actor profiling
- Brand monitoring
- Influence and reach assessment

## Unitary Function

**ONE RESPONSIBILITY:** Gather social media intelligence (profiles, posts, connections, sentiment)

**NOT RESPONSIBLE FOR:**
- Username enumeration (see sce-username-osint)
- Email breach checking (see sce-email-osint)
- Company research (see sce-company-osint)
- People background checks (see sce-people-osint)
- Private data access (only public information)

## Input

- **username**: Target username or handle
- **platforms**: List of platforms to investigate
- **include_posts**: Optional boolean to analyze public posts
- **include_network**: Optional boolean to map connections
- **depth**: Optional (basic, standard, comprehensive)

## Output

Social media intelligence report (JSON format):

```json
{
  "investigation_id": "OSINT-SOCMINT-uuid",
  "timestamp": "ISO-8601",
  "target_username": "exampleuser",
  "risk_score": "Low|Medium|High|Critical",
  "findings": {
    "profiles": [
      {
        "platform": "Twitter",
        "username": "exampleuser",
        "display_name": "Example User",
        "bio": "Software developer and security researcher",
        "location": "San Francisco, CA",
        "profile_url": "https://twitter.com/exampleuser",
        "verified": false,
        "followers": 1500,
        "following": 300,
        "post_count": 2400,
        "joined_date": "2018-03-15",
        "profile_image_url": "https://..."
      }
    ],
    "posts": {
      "total_analyzed": 100,
      "date_range": "2024-01-01 to 2025-01-12",
      "topics": ["security", "programming", "travel"],
      "sentiment": {
        "positive": 60,
        "neutral": 30,
        "negative": 10
      },
      "languages": ["English"],
      "peak_activity_times": ["18:00-22:00 UTC"]
    },
    "connections": {
      "mutual_followers": ["user1", "user2"],
      "common_connections": 25,
      "network_clusters": ["tech", "security", "opensource"]
    },
    "media": {
      "photos": 150,
      "videos": 20,
      "locations_tagged": ["San Francisco", "New York"]
    }
  },
  "recommendations": []
}
```

## Intelligence Gathered

### Profile Information
- Display name and bio
- Location information
- Profile creation date
- Verification status
- Follower/following counts
- Profile and banner images

### Content Analysis
- Public posts and tweets
- Post frequency and timing
- Content topics and keywords
- Hashtag usage
- Mentions and interactions
- Shared links and media

### Network Mapping
- Follower/following relationships
- Mutual connections
- Interaction patterns
- Network clusters and communities
- Influential connections

### Activity Patterns
- Peak posting times
- Activity frequency
- Engagement rates
- Platform preferences
- Content types (text, images, videos)

### Sentiment Analysis
- Overall sentiment (positive/neutral/negative)
- Topic-specific sentiment
- Emotion detection
- Language and tone analysis

### Media Analysis
- Image metadata (EXIF data)
- Geotagged locations
- Face detection (public images)
- Visual content themes

## Supported Platforms

- Twitter/X
- LinkedIn
- Facebook (public profiles)
- Instagram (public profiles)
- Reddit
- TikTok (public profiles)
- YouTube
- Medium
- GitHub (as social platform)

## Usage Example

```bash
# Basic profile investigation
python scripts/social_media_osint.py --username exampleuser --platforms twitter,linkedin --output report.json

# Comprehensive investigation with posts
python scripts/social_media_osint.py --username exampleuser --platforms all --include-posts --include-network --depth comprehensive

# Sentiment analysis focus
python scripts/social_media_osint.py --username exampleuser --platforms twitter --include-posts --depth standard
```

## Helper Scripts

- `social_media_osint.py`: Main SOCMINT gatherer
- `profile_scraper.py`: Profile information extraction
- `post_analyzer.py`: Post content analysis
- `network_mapper.py`: Connection mapping
- `sentiment_analyzer.py`: Sentiment analysis engine

## Risk Scoring

- **Critical**: Direct threats, extremist content, criminal activity indicators
- **High**: Sensitive information disclosure, OPSEC violations, suspicious patterns
- **Medium**: Moderate information exposure, personal details shared
- **Low**: Normal social media usage, privacy-conscious posting

## Safety Rules

1. **Read-only**: Never posts, likes, or interacts with accounts
2. **Public data only**: Only accesses publicly available information
3. **Ethical boundaries**: Never harasses or stalks targets
4. **Legal compliance**: Respects platform ToS and data protection laws
5. **Privacy respect**: Does not attempt to access private accounts
6. **Scope focus**: Reports only on public social media intelligence
