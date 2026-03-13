# Technology Stack Standards

**Version:** 2.0  
**Last Updated:** March 11, 2026  
**Owner:** Enterprise Architecture Team  
**Status:** Active

## Purpose

This document defines the approved technology stack standards for application development. It provides guidance on programming languages, frameworks, databases, and integration patterns to ensure consistency, maintainability, and security across all applications.

## Override Policy

These standards represent recommended defaults based on enterprise requirements. **Overrides are permitted with documented justification.**

**Override Request Requirements:**

1. Clear business or technical justification
2. Security team approval (for security-sensitive changes)
3. Architecture review (for major platform changes)
4. Documented in project's `TECH_STACK_DECISION.md`

## Application Type Classification

Before selecting technology stack, classify your application:

| Application Type        | Description                         | Common Characteristics                              |
|-------------------------|-------------------------------------|-----------------------------------------------------|
| **Web Application**     | Browser-based UI with backend API   | User-facing, responsive design, RESTful API         |
| **Mobile Application**  | Native or cross-platform mobile app | iOS/Android, offline capability, push notifications |
| **Backend API**         | API-only service (no UI)            | Microservice, RESTful/GraphQL, high throughput      |
| **Data Processing**     | Batch or stream data processing     | ETL, analytics, scheduled jobs                      |
| **Desktop Application** | Native desktop software             | Windows/Mac/Linux, local resources                  |
| **Real-time System**    | WebSocket/SSE-based system          | Chat, notifications, live updates                   |

---

## Programming Languages

### **Primary Languages** (Recommended for New Projects)

#### **Python** (3.11+)

**Use When:**

- Backend APIs and web applications
- Data processing and analytics
- Machine learning / AI integration
- Rapid prototyping
- Internal tools and automation

**Frameworks:**

- **FastAPI** (Recommended): Modern, async, auto-documentation
- **Django**: Full-featured, batteries-included, admin interface
- **Flask**: Lightweight, flexible, microservices

**Why:**

- Strong ecosystem for data/ML workloads
- Excellent for utility/energy industry analytics
- High developer productivity
- Extensive library support

**Constraints:**

- Not for high-concurrency real-time systems
- Not for embedded systems

---

#### **TypeScript** (5.0+)

**Use When:**

- Web frontend applications
- Node.js backend APIs
- Cross-platform mobile apps (React Native)
- Full-stack applications

**Frontend Frameworks:**

- **React** (18+): Recommended for most web UIs
- **Vue 3**: Alternative for simpler applications

**Backend Frameworks:**

- **NestJS**: Enterprise-grade Node.js backend
- **Express**: Lightweight, flexible APIs

**Mobile Frameworks:**

- **React Native**: Cross-platform iOS/Android
- **Expo**: React Native with managed workflow

**Why:**

- Type safety reduces runtime errors
- Unified language for full-stack development
- Strong ecosystem and tooling
- Modern JavaScript features

**Constraints:**

- Requires build step (not suitable for simple scripts)

---

### **Secondary Languages** (Use with Justification)

#### **Java** (17+ LTS)

**Use When:**

- Existing Java ecosystem integration
- High-performance, high-concurrency systems
- Enterprise integration requirements

**Frameworks:**

- **Spring Boot**: Enterprise Java applications
- **Quarkus**: Cloud-native, microservices

**Requires:** Architecture approval for new projects

---

#### **C#** (.NET 8+)

**Use When:**

- Windows-first applications
- Azure-native deployments
- Existing .NET ecosystem

**Frameworks:**

- **ASP.NET Core**: Web APIs and applications

**Requires:** Architecture approval for new projects

---

#### **Go** (1.21+)

**Use When:**

- Ultra-high performance requirements
- System-level tools
- Containerized microservices

**Requires:** Architecture approval and team expertise validation

---

## Databases

### **Relational Databases**

#### **PostgreSQL** (14+) - **Primary RDBMS**

**Use When:**

- Structured relational data
- Complex queries and joins
- ACID transactions required
- JSON/document hybrid needs (JSONB support)

**Why Preferred:**

- Open source, no licensing costs
- Excellent performance
- Advanced features (full-text search, geospatial, JSONB)
- Strong community support
- Works well with utility industry regulatory data

**Configuration Standards:**

- Connection pooling (PgBouncer or built-in)
- SSL/TLS encryption in transit
- Automated backups (daily minimum)
- Read replicas for scaling

---

#### **MySQL** (8.0+)

**Use When:**

- Existing MySQL infrastructure
- Simple relational needs
- Read-heavy workloads

**Note:** Prefer PostgreSQL for new projects unless specific MySQL requirement exists

---

### **NoSQL Databases**

#### **Redis** (7.0+) - **Caching & Session Storage**

**Use When:**

- Caching layer for performance
- Session storage
- Real-time leaderboards/counters
- Pub/sub messaging
- Rate limiting

**Configuration Standards:**

- Persistent storage enabled for critical data
- TLS encryption
- Password authentication
- Regular backups

---

#### **MongoDB** (6.0+) - **Document Storage**

**Use When:**

- Unstructured/semi-structured data
- Flexible schema requirements
- Rapid iteration on data model
- Catalog/product data

**Requires:** Architecture review to ensure not misusing (don't use just to avoid SQL)

**Configuration Standards:**

- Authentication enabled
- Role-based access control
- Encrypted connections
- Replica sets for availability

---

### **Time-Series Databases**

#### **TimescaleDB** (PostgreSQL Extension)

**Use When:**

- Sensor data (SCADA, IoT)
- Metrics and monitoring data
- Energy consumption data
- Time-series analytics

**Why:** Extends PostgreSQL, familiar SQL interface

---

## Authentication & Authorization

### **Approved Methods**

#### **JWT (JSON Web Tokens)** - **Primary Method**

**Use When:**

- Stateless API authentication
- Microservices architecture
- Mobile applications

**Standards:**

- **Access Token Expiry:** 15 minutes (maximum)
- **Refresh Token Expiry:** 7 days (maximum)
- **Algorithm:** HS256 or RS256 (prefer RS256 for multi-service)
- **Signing Key:** Stored in secrets manager, rotated quarterly
- **Token Payload:** Include user_id, roles, issued_at, expires_at

**Libraries:**

- Python: `PyJWT`
- TypeScript: `jsonwebtoken`

---

#### **OAuth 2.0 + OpenID Connect**

**Use When:**

- Single Sign-On (SSO) required
- Third-party authentication (Google, Microsoft)
- Enterprise identity federation

**Identity Provider:**

- **Microsoft Entra ID (Azure AD)**: Primary for enterprise SSO
- **Okta**: Alternative for multi-cloud

---

#### **Session-Based Authentication**

**Use When:**

- Traditional web applications
- High-security requirements (banking, critical infrastructure)

**Session Storage:**

- Redis (recommended)
- PostgreSQL (acceptable)
- **Never:** In-memory (not scalable)

---

### **Password Requirements**

**Minimum Standards:**

- Length: 12 characters minimum
- Complexity: Uppercase, lowercase, number, symbol
- Hashing: **bcrypt** (cost factor 12) or **Argon2**
- Storage: Hashed only, never plaintext
- Transmission: HTTPS only

**Libraries:**

- Python: `bcrypt` or `argon2-cffi`
- TypeScript: `bcryptjs` or `argon2`

---

## API Design

### **REST API Standards**

#### **Versioning**

- **URL Versioning:** `/api/v1/resource`
- Version in URL path, not headers
- Maintain v1 for 12 months after v2 release

#### **Naming Conventions**

- **Resources:** Plural nouns (`/api/v1/users`, not `/api/v1/user`)
- **Actions:** HTTP verbs (GET, POST, PUT, DELETE, PATCH)
- **Nested Resources:** `/api/v1/users/{id}/orders`

#### **HTTP Status Codes**

- **200 OK**: Successful GET, PUT, PATCH
- **201 Created**: Successful POST
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Invalid input
- **401 Unauthorized**: Missing/invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Server-side error

#### **Response Format**

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  },
  "errors": []
}
```

#### **Error Format**

```json
{
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Email address is required",
      "field": "email"
    }
  ]
}
```

---

### **GraphQL** (Alternative)

**Use When:**

- Complex, nested data requirements
- Mobile apps needing flexible queries
- Client-driven query needs

**Framework:**

- Python: `Strawberry` or `Graphene`
- TypeScript: `Apollo Server`

**Requires:** Architecture review for new projects

---

## Integration Patterns

### **Synchronous Integration**

#### **RESTful HTTP APIs**

**Use When:**

- Request/response pattern
- Real-time response needed
- <5 second timeout acceptable

**Standards:**

- HTTPS only (TLS 1.2+)
- Authentication required (API keys, OAuth, JWT)
- Rate limiting implemented
- Circuit breaker pattern for resilience

---

### **Asynchronous Integration**

#### **Message Queues**

**RabbitMQ** (3.12+) - **Primary Message Broker**
**Use When:**

- Event-driven architecture
- Decoupling services
- Work queue processing
- Guaranteed delivery needed

**Alternatives:**

- **Apache Kafka**: For high-throughput event streams (requires justification)
- **AWS SQS**: For AWS-native deployments

**Message Format:** JSON (default) or Protocol Buffers (high performance)

---

### **File-Based Integration**

**SFTP** - **For Legacy System Integration**
**Use When:**

- Legacy systems require file-based integration
- Batch data exchange

**Standards:**

- SSH key authentication (no passwords)
- Encrypted files for sensitive data
- Automated monitoring and retry logic

---

## Mobile Development

### **Cross-Platform** (Recommended)

#### **React Native** + **Expo**

**Use When:**

- iOS and Android required
- Shared codebase preferred
- Familiar web technologies (React)

**Why:**

- Single codebase for both platforms
- Fast development cycle
- Large ecosystem
- Over-the-air updates (Expo)

**Requirements:**

- TypeScript (required)
- Offline-first architecture (for field workers)
- Native modules only when necessary

---

### **Native Development** (Special Cases)

#### **Swift** (iOS) / **Kotlin** (Android)

**Use When:**

- Performance-critical mobile apps
- Heavy native API usage
- Platform-specific features essential

**Requires:** Executive approval and dedicated mobile team

---

## Cloud & Infrastructure

### **Containerization**

#### **Docker** - **Required for All Services**

**Use When:** Always (all deployable services must be containerized)

**Standards:**

- Multi-stage builds to minimize image size
- Non-root user
- Minimal base images (Alpine, Distroless)
- Tag images with version and git commit SHA

---

#### **Kubernetes** (1.28+)

**Use When:**

- Orchestration needed for multiple containers
- Auto-scaling requirements
- High availability critical

**Alternatives:**

- **Docker Compose**: For local development and simple deployments
- **AWS ECS/Fargate**: For AWS-native deployments

---

### **Cloud Providers**

#### **Priority Order:**

1. **On-Premises** (for regulated/critical infrastructure data)
2. **Azure** (primary cloud provider)
3. **AWS** (secondary cloud provider)
4. **Google Cloud** (requires special justification)

---

## Security Standards

### **HTTPS/TLS**

- **Required:** All HTTP traffic (internal and external)
- **TLS Version:** 1.2 minimum, 1.3 recommended
- **Certificate Authority:** Enterprise CA or Let's Encrypt

### **Secrets Management**

- **Azure Key Vault** (primary)
- **Environment variables** (for container orchestration)
- **Never:** Hardcoded secrets, committed to Git

### **Dependency Scanning**

- **Required:** Automated scanning in CI/CD
- **Tools:** Dependabot, Snyk, or equivalent
- **Policy:** Block deployment for critical vulnerabilities

### **Static Application Security Testing (SAST)**

- **Required:** On every pull request
- **Tools:** SonarQube, Bandit (Python), ESLint security plugins

---

## CI/CD Pipeline Standards

### **Pipeline Architecture**

All repositories must implement a standardized CI/CD pipeline using the shared reusable workflow library (`EdisonInternational/actions@v2`).

#### **Required Pipeline Stages**

| Stage | Trigger | Purpose |
|---|---|---|
| **check.yml** | Pull request | SonarQube scan, lint, tests |
| **build.yml** | Release publish / manual | Security gate → build → Nexus upload |
| **build-deploy-test.yml** | Manual / push to main | Build → deploy to non-prod → test |
| **deploy-release.yml** | Manual (production) | Nexus download → preflight → deploy → notify |
| **tag.yml** | Push to main | Auto-bump patch version (SemVer) |
| **release-notes.yml** | Release publish | Auto-generate PR table in release notes |
| **clean.yml** | Weekly cron (Monday 2am) | Clean old workflow runs |

#### **Security Gate (build.yml)**

All build pipelines must include a security check gate as the **first** stage:

```yaml
security-check:
  uses: EdisonInternational/actions/.github/workflows/check-security.yml@v2
  with:
    STRICT: true  # Fail on critical/high vulnerabilities
```

All subsequent build jobs must depend on `security-check` passing.

#### **Workflow Permissions**

- **Default:** `permissions: read-all` at the workflow level
- **Per-job:** Grant only the specific permissions required
- **Never:** Use `permissions: write-all` at the workflow level

### **SonarQube Quality Gate**

| Language | Scanner Workflow |
|---|---|
| Python | `check-sonar-python.yml@v2` |
| Node.js / TypeScript | `check-sonar-nodejs.yml@v2` |
| .NET | `check-sonar-dotnet-framework.yml@v2` |
| Java (Maven) | `check-sonar-maven.yml@v2` |
| IaC / Other | `check-sonar-generic.yml@v2` |

**Configuration:**

- `QUALITY_GATE_CHECK: true` (required — blocks merge if quality gate fails)
- Test coverage reports (LCOV, JaCoCo, coverage.xml) must be passed to the scanner
- Quality gate runs on every pull request

---

## Artifact Repository Standards

### **Nexus Repository Manager**

All build artifacts and package dependencies must route through the approved Nexus instance (`nexus.devops.sce.com`).

#### **Artifact Publishing**

- Build artifacts uploaded on release publish via `nexus-artifact-upload.yml@v2`
- Artifacts downloaded for deployment via `nexus-artifact-download.yml@v2`
- Asset naming convention: `assets-{language/component}.zip`

#### **Dependency Proxying**

| Ecosystem | Nexus Proxy URL |
|---|---|
| Python (pip) | `https://nexus.devops.sce.com/repository/pypi-proxy/simple` |
| Node.js (npm) | Configured via `nexus-setup@v2` action |
| Java (Maven) | Configured in `settings.xml` |
| .NET (NuGet) | Configured via `nexus-setup@v2` action |

**Policy:** Direct downloads from public registries (pypi.org, npmjs.com, etc.) in CI/CD pipelines are prohibited. All package resolution must route through Nexus proxy.

---

## Change Management Standards

### **ITSM Integration**

All production deployments require an approved change request.

#### **Required Workflow**

1. **CRQ Number** provided as deployment input (`itsm_change_id`)
2. **deploy-setup** validates CRQ status before proceeding
3. **deploy-complete** reports deployment result to ITSM
4. ITSM status tracked and included in deployment notifications

#### **Deployment Scheduling**

Production deployments must support scheduling to approved change windows:

| Schedule Option | Description |
|---|---|
| `NOW` | Deploy immediately |
| `NOW +2` | Deploy in 2 hours |
| `TODAY 10:00` | Business hours window |
| `TODAY 21:00` | Maintenance window |
| `TOMORROW 06:00` | Early morning window |

---

## Release Management Standards

### **Semantic Versioning**

All repositories must use [SemVer](https://semver.org/) (`MAJOR.MINOR.PATCH`):

- **PATCH** auto-bumped on push to `main` (via `tag.yml`)
- **MINOR/MAJOR** set via manual `workflow_dispatch` with custom tag input
- Tags must follow `x.y.z` format (no `v` prefix unless repository convention dictates)

### **Release Notes**

- Auto-generated on release publish via `release-notes.yml`
- Includes a table of all pull requests merged since the last release
- All 12 reference implementation repos share the identical release-notes workflow

### **Default Branch**

- All repositories must use `main` as the default branch
- The `master` branch name is deprecated

---

## Deployment Pipeline Standards

### **Production Deployment Stages**

```
nexus-download → preflight-checks → deploy-setup → deploy → deploy-complete → notify
```

#### **Pre-flight Checks**

- Validate connectivity to target production endpoints
- Run via `deploy-preflight-checks.yml@v2`
- Must pass before deployment proceeds

#### **Deployment Targets**

| Target | Workflow | Use Case |
|---|---|---|
| Azure Container Registry | `deploy-azure-acr.yml@v2` | Container images |
| Azure Web App | `deploy-azure-webapp.yml@v2` | Static/dynamic web apps |
| Azure Bicep | `deploy-azure-bicep.yml@v2` | Infrastructure (Bicep) |
| Azure Terraform | `deploy-azure-terraform.yml@v2` | Infrastructure (Terraform) |
| Google Artifact Registry | `deploy-gcloud-gar.yml@v2` | Multi-cloud container images |
| Google Cloud Run | `deploy-gcloud-run.yml@v2` | Multi-cloud serverless |

#### **Deployment Notifications**

All production deployments must notify stakeholders via `deploy-notification.yml@v2`:

- **GitHub Issues:** Auto-create issue on failure, assigned to deploying engineer
- **Email:** Configurable recipients and subject prefix
- **Webhook:** Optional integration for external notification systems
- Notification includes: deployment status, ITSM status, test status, release tag

---

## Repository Governance Standards

### **Required Repository Files**

Every repository must include:

| File | Location | Purpose |
|---|---|---|
| `CODEOWNERS` | `.github/CODEOWNERS` | Define team ownership for PR review routing |
| `pull_request_template.md` | `.github/pull_request_template.md` | Standardize PR descriptions |
| `bug_report.md` | `.github/ISSUE_TEMPLATE/bug_report.md` | Structured bug reporting |
| `feature_request.md` | `.github/ISSUE_TEMPLATE/feature_request.md` | Structured feature requests |
| `dependabot.yml` | `.github/dependabot.yml` | Automated dependency updates |
| `copilot-instructions.md` | `.github/copilot-instructions.md` | AI assistant project guidance |

### **CODEOWNERS**

```
# Default owners for everything in the repo
*       @EdisonInternational/your-team-name
```

### **Dependabot Configuration**

Configure for **all** package ecosystems used in the repository:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"       # or pip, maven, nuget, docker, github-actions, terraform
    directory: "/"
    schedule:
      interval: "weekly"
```

### **Branch Protection**

The `main` branch must have branch protection enabled:

- Require pull request reviews before merging
- Require status checks to pass (check.yml)
- Require branches to be up to date before merging
- Do not allow bypassing the above settings

---

## Build Attestation Standards

### **SLSA Provenance**

All builds must generate [SLSA](https://slsa.dev/) build provenance attestations to ensure supply chain integrity.

**Requirements:**

- Build workflows must request `attestations: write` and `id-token: write` permissions
- Attestation records must link artifacts to source commit, workflow, and builder identity
- Artifacts must be signed and verifiable via `gh attestation verify`

This implements the requirements of STD-SUPPLY-001 at the CI/CD level.

---

## Infrastructure-as-Code Security Standards

### **Terraform Security Scanning**

All Terraform repositories must include AquaSec/Trivy scanning:

```yaml
check-terraform:
  uses: EdisonInternational/actions/.github/workflows/check-terraform-aquasec.yml@v2
  with:
    SEVERITY: CRITICAL,HIGH
```

- Runs on every pull request
- `CRITICAL` and `HIGH` findings block merge
- Results reported as PR check status

### **Bicep/ARM Security Scanning**

- Bicep and ARM templates must undergo equivalent static analysis
- Use `check-security.yml@v2` for general security scanning

### **YAML Linting**

Configuration files in IaC repositories must pass linting:

- Use `.yamllint` configuration file for project-specific rules
- Default: 120-char line length, 2-space indentation
- Run via `check-yaml.yml@v2` on pull requests

---

## API Contract Testing Standards

### **Postman/Newman Testing**

API services must include contract tests:

- **Tool:** Postman collections executed via Newman (`test-postman.yml@v2`)
- **Trigger:** Pull requests to API-related branches + manual dispatch
- **Reporters:** JSON, JUnit, HTML (htmlextra)
- **Timeout:** 30 seconds per request (configurable)
- **Authentication:** Subscription keys passed via repository secrets

### **Test Reporting**

- Test status summary written to `$GITHUB_STEP_SUMMARY`
- Failed tests must cause the workflow to exit non-zero
- Test artifacts (reports) uploaded for review

---

## Continuous Testing Standards

### **Scheduled E2E Testing**

Beyond PR-triggered tests, critical paths must be validated on a recurring schedule:

- **Frequency:** Minimum weekly (recommended: `cron: '0 1 * * 0'` — Sunday 1am UTC)
- **Framework:** Playwright (web), Detox (mobile)
- **Target:** Deployed non-prod environments (not local builds)
- **Failure handling:** Test failures on scheduled runs must generate notifications or issues

### **Environment-Based Testing**

- Non-production deployments should trigger automated test suites (`build-deploy-test.yml`)
- Production deployments may include smoke tests post-deploy

---

## AI-Assisted Development Standards

### **Copilot Instructions**

All repositories should include `.github/copilot-instructions.md` with:

1. **Bootstrap & Build:** Commands with expected timing (e.g., `mvn clean package` ~25s)
2. **Project Structure:** Key directories and file locations
3. **Validation Sequence:** Steps to verify changes before committing
4. **Testing:** How to run tests, coverage reports, and quality tools
5. **Known Issues:** Workarounds for common problems
6. **Deployment:** Target environments and URLs

### **AI Code Quality**

- AI-generated code must pass the same quality gates as human-written code
- AI-generated code must be reviewed by a human before merge
- AI coding assistants must not bypass branch protection or CI checks

---

## Testing Standards

### **Test Coverage Minimums**

- **Unit Tests:** 85% coverage
- **Integration Tests:** 70% coverage
- **Critical Paths:** 100% E2E coverage

### **Test Frameworks**

- **Python:** `pytest` (required)
- **TypeScript/JavaScript:** `Jest` or `Vitest`
- **E2E:** `Playwright` (web), `Detox` (mobile)

---

## Monitoring & Observability

### **Logging**

- **Format:** Structured JSON logs
- **Tool:** ELK Stack (Elasticsearch, Logstash, Kibana) or Azure Monitor
- **Required Fields:** timestamp, level, message, user_id, trace_id

### **Metrics**

- **Tool:** Prometheus + Grafana or Azure Monitor
- **Required Metrics:** Request rate, error rate, latency (RED metrics)

### **Tracing**

- **Tool:** Jaeger or Azure Application Insights
- **Required:** For distributed systems

---

## Decision Matrix

Use this matrix to guide technology selection:

| Requirement                         | Recommended Stack                                    |
|-------------------------------------|------------------------------------------------------|
| Web application with user-facing UI | TypeScript (React) + Python (FastAPI) + PostgreSQL   |
| Mobile app (iOS + Android)          | React Native (TypeScript) + Python (FastAPI)         |
| Backend API only                    | Python (FastAPI) or TypeScript (NestJS) + PostgreSQL |
| Real-time features (WebSocket)      | TypeScript (NestJS) + Redis + PostgreSQL             |
| Data processing / ETL               | Python (FastAPI) + PostgreSQL + Redis                |
| Microservices architecture          | Docker + Kubernetes + Python/TypeScript + RabbitMQ   |
| Legacy system integration           | Python + SFTP + Database                             |

---

## Non-Functional Requirements Standards

### **Performance**

- **API Response Time:** <1 second (95th percentile)
- **Page Load Time:** <3 seconds (initial), <1 second (subsequent)
- **Database Query Time:** <100ms for OLTP queries

### **Scalability**

- **Horizontal Scaling:** Preferred over vertical
- **Stateless Services:** Required (enables load balancing)
- **Database Connection Pooling:** Required

### **Availability**

- **Target Uptime:** 99.9% (for critical systems)
- **Health Checks:** Required for all services
- **Graceful Degradation:** Preferred over hard failures

### **Disaster Recovery**

- **Backups:** Daily minimum, 30-day retention
- **RPO (Recovery Point Objective):** 24 hours
- **RTO (Recovery Time Objective):** 4 hours

---

## Deprecation & Technology Sunset

### **Technologies Marked for Deprecation:**

- **Python 2.x**: Fully deprecated (use 3.11+)
- **Node.js <18**: Upgrade to LTS version
- **PostgreSQL <12**: Upgrade to 14+

### **Technologies Requiring Migration Plan:**

- **.NET Framework** → .NET 8+
- **Angular.js** → Angular 17+ or React
- **MySQL 5.x** → MySQL 8+ or PostgreSQL

---

## Approval & Governance

### **Standard Stack (No Approval Needed)**

- Python 3.11+ with FastAPI/Django/Flask
- TypeScript with React/Vue/NestJS
- PostgreSQL 14+
- Redis 7+
- Docker + Kubernetes

### **Requires Architecture Review**

- New programming languages
- NoSQL databases beyond Redis
- Kafka or other message brokers
- Cloud services not in approved list

### **Requires Executive Approval**

- Native mobile development (Swift/Kotlin)
- Non-standard cloud providers
- Proprietary/licensed software

---

## Document Maintenance

**Review Cycle:** Quarterly  
**Next Review:** April 2026  
**Change Requests:** Submit to Enterprise Architecture team

**Revision History:**

| Version | Date       | Author  | Changes         |
|---------|------------|---------|-----------------|| 2.0     | 2026-03-11 | EA Team | Added CI/CD pipeline, artifact management, change management, release management, deployment pipeline, repository governance, build attestation, IaC security, API contract testing, continuous testing, and AI-assisted development standards. Derived from HelloWorld reference implementation audit. || 1.0     | 2026-01-16 | EA Team | Initial version |

---

## Contact

**Questions or Override Requests:**

- Email: ted.tschopp@sce.com
