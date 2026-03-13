---
name: sce-api-security-reviewer
description: 'Review API security including authentication, rate limiting, CORS, input sanitization, error handling, and versioning. Use when auditing REST, GraphQL, or gRPC APIs for security issues. Returns API security assessment report.'
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
  - api-security
  - rest
  - graphql
  - cors
  tools: Bash Read Grep
  category: Security & Compliance
---

# API Security Reviewer Skill

Reviews API security for REST, GraphQL, and gRPC implementations.

## When to Use This Skill

- Auditing REST API security
- Reviewing GraphQL security
- Checking gRPC security implementations
- Validating API authentication and authorization
- Reviewing rate limiting and throttling
- Checking CORS configuration
- Assessing API error handling
- Validating API versioning practices

## Unitary Function

**ONE RESPONSIBILITY:** Review API-specific security (auth, rate limiting, CORS, error handling)

**NOT RESPONSIBLE FOR:**
- General vulnerability scanning (see sce-vulnerability-scanner)
- Authentication mechanisms (see sce-auth-auditor)
- Mobile app security (see sce-mobile-security-auditor)
- Web infrastructure (see sce-web-infrastructure-auditor)
- Fixing API security issues (read-only skill)

## Input

- **api_spec**: Path to API specification (OpenAPI, GraphQL schema, proto files)
- **api_code**: Path to API implementation code
- **api_type**: Optional (rest, graphql, grpc)

## Output

API security report (JSON format):

```json
{
  "audit_id": "uuid",
  "timestamp": "ISO-8601",
  "api_type": "REST|GraphQL|gRPC",
  "risk_score": "Critical|High|Medium|Low",
  "findings": {
    "authentication": [
      {
        "severity": "Critical",
        "issue": "Endpoint missing authentication",
        "endpoint": "DELETE /api/users/:id",
        "remediation": "Add authentication middleware"
      }
    ],
    "authorization": [],
    "rate_limiting": [],
    "cors": [],
    "input_validation": [],
    "error_handling": [],
    "versioning": [],
    "documentation": []
  },
  "recommendations": []
}
```

## API Security Areas Reviewed

- **Authentication**: Token validation, API key management
- **Authorization**: Endpoint permissions, resource access control
- **Rate Limiting**: Throttling, DDoS protection, quota management
- **CORS**: Origin validation, credential handling
- **Input Validation**: Request validation, payload size limits
- **Error Handling**: Information disclosure, error messages
- **Versioning**: Deprecation, backward compatibility
- **Documentation**: Security requirements, auth flows

## Supported API Types

- **REST**: OpenAPI/Swagger specs, RESTful endpoints
- **GraphQL**: Schema, queries, mutations, introspection
- **gRPC**: Protocol buffers, service definitions

## Usage Example

```bash
# Review REST API
python scripts/api_security_reviewer.py --spec openapi.yml --code src/api --output report.json

# Review GraphQL API
python scripts/api_security_reviewer.py --spec schema.graphql --code src/graphql --type graphql

# Check specific security area
python scripts/api_security_reviewer.py --spec openapi.yml --focus rate-limiting
```

## Helper Scripts

- `api_security_reviewer.py`: Main API security auditor
- `rest_analyzer.py`: REST API security checks
- `graphql_analyzer.py`: GraphQL security checks
- `grpc_analyzer.py`: gRPC security checks

## Risk Scoring

- **Critical**: Missing authentication, broken authorization, CORS misconfiguration
- **High**: No rate limiting, excessive permissions, information disclosure
- **Medium**: Weak input validation, poor error handling, missing versioning
- **Low**: Documentation gaps, minor security improvements

## Safety Rules

1. **Read-only**: Never modifies API code or specifications
2. **No live testing**: Static analysis only, no API calls
3. **Scope focus**: Reports only on API security, not general code security
