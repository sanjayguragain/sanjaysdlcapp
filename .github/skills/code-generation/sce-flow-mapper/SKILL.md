---
name: sce-flow-mapper
description: "Maps user-facing execution flows through a codebase by tracing paths from entry points (routes, controllers, handlers) through service layers to data access and external integrations. Generates Mermaid sequence diagrams per user action grouped by persona. Documents external integration points."
compatibility:
  - "3 - Analysis - Reverse Engineering Agent"
license: "Proprietary"
metadata:
  version: 1.0.0
  author: SDLC Analysis Team
  category: code-generation
  tags: [reverse-engineering, flow-mapping, sequence-diagram, user-flows, integration-mapping]
  tools: ['read', 'search', 'execute']
---

# sce-flow-mapper

## When to Use This Skill

- Tracing execution paths from HTTP endpoints through service and data layers
- Generating sequence diagrams for user-facing actions
- Documenting external integration points (APIs, queues, file I/O)
- Building persona-based flow inventories for documentation
- Identifying error paths and exception handling chains

## Unitary Function

**ONE responsibility:** Trace execution paths from entry points through the codebase and produce structured JSON flow descriptions with Mermaid sequence diagrams per user action.

## NOT RESPONSIBLE FOR

- Per-file class/method extraction (that is `sce-file-deep-analyzer`)
- Data model / ER extraction (that is `sce-data-model-extractor`)
- Architecture diagram generation (orchestrator handles that from aggregated data)
- Business logic naming (orchestrator handles that)
- HTML report generation (that is `sce-reverse-engineering-reporter`)

## Input

```json
{
  "entry_points": [
    {
      "file_id": "F001",
      "path": "src/auth/views.py",
      "class": "LoginView",
      "method": "post",
      "route": "POST /api/v1/auth/login",
      "type": "http_endpoint"
    }
  ],
  "file_analysis_results": [],
  "data_model_results": {},
  "language": "python",
  "framework": "django",
  "repo_root": "/absolute/path/to/repo"
}
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `entry_points` | Yes | List of identified entry points with route info |
| `file_analysis_results` | Yes | Phase 2 per-file analysis output (classes, methods, calls_to) |
| `data_model_results` | No | Phase 3 data model output for DB operation annotation |
| `language` | Yes | Primary language |
| `framework` | No | Primary framework for routing convention awareness |
| `repo_root` | Yes | Repository root path |

## Output

```json
{
  "generated_by": {
    "skill": "sce-flow-mapper",
    "version": "1.0.0"
  },
  "total_flows_mapped": 24,
  "total_entry_points": 30,
  "unmapped_entry_points": 6,
  "personas": [
    {"name": "anonymous", "description": "Unauthenticated users", "flow_count": 4},
    {"name": "authenticated_user", "description": "Logged-in regular users", "flow_count": 14},
    {"name": "admin", "description": "Administrative users", "flow_count": 4},
    {"name": "system", "description": "Background/scheduled tasks", "flow_count": 2}
  ],
  "flows": [
    {
      "id": "FLOW-001",
      "name": "User Login",
      "persona": "anonymous",
      "http_method": "POST",
      "route": "/api/v1/auth/login",
      "entry_point": {
        "file": "src/auth/views.py",
        "class": "LoginView",
        "method": "post"
      },
      "call_chain": [
        {
          "step": 1,
          "caller": "LoginView.post",
          "callee": "LoginSerializer.validate",
          "file": "src/auth/serializers.py",
          "type": "validation",
          "description": "Validates request payload structure"
        },
        {
          "step": 2,
          "caller": "LoginView.post",
          "callee": "UserService.authenticate",
          "file": "src/services/user_service.py",
          "type": "business_logic",
          "description": "Verifies credentials against stored hash"
        },
        {
          "step": 3,
          "caller": "UserService.authenticate",
          "callee": "User.objects.get",
          "file": "src/models/user.py",
          "type": "database_read",
          "description": "SELECT user WHERE email = ?",
          "entity": "User"
        },
        {
          "step": 4,
          "caller": "LoginView.post",
          "callee": "TokenService.generate_pair",
          "file": "src/services/token_service.py",
          "type": "business_logic",
          "description": "Creates JWT access + refresh token pair"
        }
      ],
      "database_operations": [
        {"type": "SELECT", "entity": "User", "filter": "email = ?", "step": 3},
        {"type": "UPDATE", "entity": "User", "fields": ["last_login"], "step": 4}
      ],
      "external_calls": [],
      "error_paths": [
        {
          "condition": "Invalid email/password",
          "exception": "InvalidCredentialsError",
          "response_code": 401,
          "response_body": "{\"error\": \"Invalid credentials\"}",
          "source_step": 2
        },
        {
          "condition": "Account locked (10+ failed attempts)",
          "exception": "AccountLockedError",
          "response_code": 403,
          "response_body": "{\"error\": \"Account locked\"}",
          "source_step": 2
        }
      ],
      "middleware_chain": ["CORSMiddleware", "AuthenticationMiddleware", "RateLimitMiddleware"],
      "sequence_diagram_mermaid": "sequenceDiagram\n    participant C as Client\n    participant MW as Middleware\n    participant V as LoginView\n    participant SER as LoginSerializer\n    participant US as UserService\n    participant DB as Database\n    participant TS as TokenService\n    C->>MW: POST /api/v1/auth/login\n    MW->>V: route to LoginView.post\n    V->>SER: validate(request.data)\n    SER-->>V: validated_data\n    V->>US: authenticate(email, password)\n    US->>DB: SELECT user WHERE email=?\n    DB-->>US: User record\n    US->>US: verify_password(hash)\n    US-->>V: authenticated User\n    V->>TS: generate_pair(user)\n    TS-->>V: {access_token, refresh_token}\n    V-->>C: 200 {tokens}"
    }
  ],
  "external_integrations": [
    {
      "name": "Stripe Payment API",
      "type": "REST API",
      "base_url_pattern": "https://api.stripe.com/v1/",
      "auth_method": "Bearer token (API key)",
      "used_by_files": ["services/payment_service.py"],
      "endpoints_called": [
        {"method": "POST", "path": "/v1/charges", "purpose": "Create payment charge"},
        {"method": "POST", "path": "/v1/refunds", "purpose": "Process refund"},
        {"method": "GET", "path": "/v1/charges/{id}", "purpose": "Check charge status"}
      ],
      "error_handling": "Retries 3x with exponential backoff; raises PaymentError on failure"
    },
    {
      "name": "Redis Cache",
      "type": "cache",
      "used_by_files": ["services/cache_service.py", "middleware/rate_limiter.py"],
      "operations": ["GET", "SET", "INCR", "EXPIRE"],
      "purpose": "Session storage, rate limiting counters, cached query results"
    }
  ],
  "unmapped_reasons": [
    {"entry_point": "POST /api/v1/webhooks/stripe", "reason": "Complex dynamic dispatch; manual review recommended"}
  ]
}
```

## Entry Point Detection Patterns

| Framework | Route Detection | Entry Point Pattern |
|-----------|----------------|-------------------|
| Django | `urls.py`: `path()`, `re_path()` | `views.py` classes/functions referenced in urls |
| Flask | `@app.route()`, `Blueprint` routes | Decorated functions |
| FastAPI | `@router.get/post/put/delete()` | Decorated async functions |
| Spring Boot | `@RequestMapping`, `@GetMapping`, `@PostMapping` | Annotated controller methods |
| ASP.NET Core | `[Route]`, `[HttpGet]`, `[ApiController]` | Controller action methods |
| Express | `app.get/post()`, `router.get/post()` | Callback functions |
| NestJS | `@Controller`, `@Get()`, `@Post()` | Decorated class methods |
| Rails | `config/routes.rb`: `resources`, `get`, `post` | Controller actions |
| Gin (Go) | `router.GET/POST()` | Handler functions |

**Background task patterns:**
| Pattern | Detection |
|---------|-----------|
| Django Celery | `@shared_task`, `@app.task` |
| Spring `@Scheduled` | `@Scheduled(cron=...)` |
| .NET `BackgroundService` | `class X : BackgroundService` |
| Node cron | `node-cron`, `agenda` imports |
| Sidekiq (Ruby) | `include Sidekiq::Worker` |

## Tracing Process

### Step 1: Identify All Entry Points
1. Parse routing configuration files for the framework
2. Match routes to handler classes/functions
3. Identify background tasks, CLI commands, WebSocket handlers
4. Classify by persona based on auth middleware/decorators

### Step 2: Trace Each Entry Point
1. Start at the entry method
2. Follow `calls_to` from Phase 2 file analysis
3. For each called method, resolve to its file and repeat
4. Stop tracing at:
   - Database operations (ORM calls, raw SQL)
   - External API calls (HTTP client usage)
   - Queue publish operations
   - File I/O operations
   - Return statements
5. Record the type of each step: `validation`, `business_logic`, `database_read`, `database_write`, `external_api`, `cache`, `queue_publish`, `file_io`

### Step 3: Map Error Paths
1. Identify try/catch blocks in the call chain
2. Match exceptions to response codes
3. Document error response bodies when defined

### Step 4: Identify External Integrations
1. Find HTTP client usage (requests, HttpClient, axios, fetch, RestTemplate)
2. Extract base URLs and endpoint patterns
3. Find queue client usage (Celery, RabbitMQ, Kafka, SQS producers)
4. Find file system operations
5. Document auth methods and error handling

### Step 5: Generate Sequence Diagrams
1. Create Mermaid sequence diagram per flow
2. Participants: Client, Middleware (if applicable), Controller, Service(s), Database, External APIs
3. Show request/response arrows with method names
4. Include alt blocks for error paths when significant

## Persona Classification Rules

| Signal | Persona |
|--------|---------|
| No auth middleware/decorator, public route | `anonymous` |
| Auth required, no admin check | `authenticated_user` |
| Admin auth check, `/admin/` URL prefix | `admin` |
| `@scheduled`, cron, background task | `system` |
| WebSocket handler | `realtime_user` |
| CLI command | `operator` |

## Quality Checks

- [ ] All entry points in the checklist have been traced or marked as unmapped with reason
- [ ] Every flow has a complete call chain from entry to data/external boundary
- [ ] Sequence diagrams are valid Mermaid syntax
- [ ] External integrations list all third-party API calls with auth methods
- [ ] Error paths document at least the primary failure scenarios
- [ ] Flows are grouped by persona
- [ ] Database operations reference entities from the data model

## Guardrails

- MUST NOT execute any code to trace flows (static analysis only)
- MUST NOT follow traces into external library source code (stop at library boundary)
- MUST handle dynamic dispatch gracefully (flag as "manual review recommended")
- MUST NOT expose API keys, secrets, or credentials found in integration configs
- If a call chain exceeds 15 steps, summarize intermediate steps and flag for review

## Authority Boundaries

**CAN:**
- Read source files to trace call chains
- Search repository for routing configurations
- Execute read-only grep commands for pattern matching
- Generate Mermaid sequence diagram syntax

**CANNOT:**
- Execute application code to observe runtime behavior
- Make HTTP calls to discovered external APIs
- Modify any source file
- Assume runtime behavior without code evidence
