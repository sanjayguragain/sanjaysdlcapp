---
name: sce-code-review-standards
description: "Enforces code-level implementation standards derived from recurring Copilot PR review findings. Covers 11 anti-pattern categories: authentication/authorization, input validation, state management, async correctness, code hygiene, API contract consistency, cross-platform compatibility, accessibility, error handling, CI/CD hygiene, and runtime artifacts. Developer agents MUST reference these standards during code generation to minimize review rework."
compatibility:
  - 5 - Test & Build - Python Developer
  - 5 - Test & Build - TypeScript Developer
  - 5 - Test & Build - App Implementation Coordinator
  - 5 - Test & Build - Quality Assurance Agent
  - 5 - Test & Build - Application Builder
  - 5 - Test & Build - Swift Developer
  - 5 - Test & Build - DotNet Developer
  - 5 - Test & Build - Java Developer
license: 'Proprietary'
metadata:
  version: 1.0.0
  author: Agent Skills Team
  category: code-generation
  tags:
    - coding-standards
    - code-review
    - anti-patterns
    - security
    - quality
    - copilot-review
  tools: ['Read', 'Search']
---

# SCE Code Review Standards

## Overview

This skill defines **code-level implementation standards** derived from systematic analysis of 106+ Copilot PR review comments across multiple repositories. These are generic patterns that apply to any application development, regardless of tech stack.

Developer agents MUST apply these standards during code generation. QA agents MUST verify compliance during review.

**Important:** These standards complement (do not replace) the enterprise-level standards in `tech-policy-matrix.yaml` and `TECH_STACK_STANDARDS.md`. Those documents cover infrastructure, framework selection, and security baselines. This skill covers HOW to write code correctly at the implementation level.

## When to Use

- During ANY code generation by developer agents
- When reviewing code for pull request quality
- When scaffolding new features, endpoints, or components
- When refactoring existing code

## When NOT to Use

- For infrastructure/architecture decisions (use `tech-policy-matrix.yaml`)
- For framework/language selection (use `TECH_STACK_STANDARDS.md`)
- For requirements quality assessment (use `sce-6cs-quality-framework`)
- For injection scanning of existing code (use `sce-input-validation-checker`)

## Unitary Function

**ONE RESPONSIBILITY:** Provide actionable code-level implementation standards that prevent recurring PR review findings.

**NOT RESPONSIBLE FOR:**

- Infrastructure standards (see `tech-policy-matrix.yaml`)
- Technology selection (see `TECH_STACK_STANDARDS.md`)
- Injection flaw scanning (see `sce-input-validation-checker`)
- Test template generation (see `sce-tdd-template-generator`)

---

## Standards Categories

### 1. Authentication & Authorization

**Recurring finding:** Endpoints trusting client-supplied identity headers, missing ownership checks, insecure identity defaults.

**Rules:**

1. **NEVER trust client-supplied identity headers** (e.g., `X-User-Id`, `X-User-Email`) for authorization decisions. Identity MUST be derived from server-validated tokens (JWT, session cookies, or trusted proxy headers).
2. **Every data-access endpoint MUST enforce ownership checks.** Before returning or modifying a resource, verify the authenticated user owns or has permission to access it. Missing ownership checks create IDOR (Insecure Direct Object Reference) vulnerabilities.
3. **Dev-mode identity fallbacks MUST be disabled in non-dev environments.** If using default/hardcoded identities for local development (e.g., `local@localhost`), gate them behind an explicit debug flag and reject them in production.
4. **Use cryptographically secure randomness for security contexts.** Use `crypto.getRandomValues()` / `crypto.randomUUID()` (browser) or `secrets` module (Python) instead of `Math.random()` or `random` module. Always provide fallbacks for environments where secure APIs may not be available.

**Example (Python/FastAPI):**

```python
# BAD: Trusting client header
def get_user_id(x_user_email: str = Header("local@localhost")):
    return db.get_or_create_user(x_user_email)

# GOOD: Derive from validated token
def get_user_id(token: str = Depends(oauth2_scheme)):
    payload = verify_jwt(token)
    return payload["sub"]
```

**Example (TypeScript):**

```typescript
// BAD: Insecure randomness
const id = Math.random().toString(36).slice(2);

// GOOD: Cryptographically secure
const id = crypto.randomUUID();
```

---

### 2. Input Validation & Schema Strictness

**Recurring finding:** Loose types in request/response models bypass validation and allow malformed data.

**Rules:**

1. **Use concrete types, not generic containers.** Avoid `list`, `dict`, `any`, `object` in API schemas. Use typed models/interfaces with explicit field definitions.
2. **Constrain string fields with enums/Literals where values are known.** For fields like `role`, `status`, `type` — use `Literal["user", "assistant"]` (Python) or union types (TypeScript), not bare `str`/`string`.
3. **Set max-length limits on persisted text fields.** Content fields, message bodies, and user-supplied text MUST have reasonable `max_length` constraints to prevent unbounded storage.
4. **Validate user input at system boundaries.** All input from users, external APIs, and headers MUST be validated before use. This includes path parameters, query strings, and request bodies.

**Example (Python/Pydantic):**

```python
# BAD: Loose types
class SessionSave(BaseModel):
    messages: list
    role: str
    extra: dict

# GOOD: Concrete, constrained types
class SessionSave(BaseModel):
    messages: list[ChatMessage]
    role: Literal["user", "assistant"]
    extra: dict[str, str] = Field(default_factory=dict)
    content: str = Field(max_length=50000)
```

---

### 3. State Management

**Recurring finding:** Reset/initialization functions not covering all fields, causing state leaks between sessions or projects.

**Rules:**

1. **Reset functions MUST reset ALL stateful fields.** When a `resetToDefaults()` or re-initialization function exists, it MUST cover every field that has a non-default initial value. Audit store definitions to ensure no field is missed.
2. **Save operations MUST update UI state indicators.** When triggering persistence (auto-save, manual save), set state to `saving` before the request and `saved`/`error` on completion. Do not leave UI indicators showing stale status.
3. **Hydration MUST apply all persisted values.** When loading state from server/storage, apply ALL persisted fields — including empty arrays and zero-value fields. Do not skip fields based on truthiness checks that would ignore valid empty/falsy values.

**Example (TypeScript/Zustand):**

```typescript
// BAD: Misses fields
resetToDefaults: () => set({
  messages: [],
  phase: 'ideation',
  // Missing: useAgent, saveState, allowProceedWithoutQuality
});

// GOOD: Reset every stateful field
resetToDefaults: () => set({
  messages: [],
  phase: 'ideation',
  useAgent: true,
  saveState: 'idle',
  allowProceedWithoutQuality: false,
});
```

---

### 4. Async & Concurrency Correctness

**Recurring finding:** Async handlers calling sync I/O, blocking event loops; mismatched timeouts; race conditions in concurrent saves.

**Rules:**

1. **Async handlers MUST NOT call synchronous blocking I/O directly.** In async frameworks (FastAPI, NestJS), either make the handler synchronous `def` (so the framework offloads to a threadpool) OR wrap sync DB/I/O calls with `run_in_threadpool` / equivalent. Never mix `async def` with synchronous database calls.
2. **Backend and frontend timeouts MUST be aligned.** If a frontend sets a 45s timeout for an operation, the backend operation timeout MUST be shorter (e.g., 30s) so the backend completes before the frontend aborts. Document timeout alignment in API contracts.
3. **Debounced/concurrent operations MUST handle ordering.** When using debounced auto-saves or concurrent API calls that write full snapshots, implement a mechanism to prevent stale writes (e.g., monotonically increasing version numbers, abort in-flight requests, or optimistic locking).
4. **Truncate unbounded inputs before expensive operations.** Before sending data to LLMs, external APIs, or performing heavy computation, limit the input size (max messages, max characters) to prevent context overflow, timeouts, and excessive costs.
5. **Check AbortSignal state before starting requests.** When propagating `AbortSignal` from callers, check `signal.aborted` upfront before initiating the network call. Otherwise, already-cancelled requests will still be sent.

**Example (Python/FastAPI):**

```python
# BAD: Async handler with sync DB
@router.get("/projects")
async def list_projects():
    return db.list_projects()  # Blocks event loop

# GOOD option A: Sync handler (FastAPI runs in threadpool)
@router.get("/projects")
def list_projects():
    return db.list_projects()

# GOOD option B: Explicit threadpool
@router.get("/projects")
async def list_projects():
    return await run_in_threadpool(db.list_projects)
```

---

### 5. Code Hygiene

**Recurring finding:** Unused imports, unused props/parameters, dead code, ignored return values.

**Rules:**

1. **Remove unused imports.** Every imported symbol MUST be referenced in the module. Unused imports trigger linter warnings and add confusion.
2. **Remove unused function parameters and interface properties.** If a prop is declared in a component's type/interface but never destructured or used, remove it from the type definition and all call sites.
3. **Do not ignore return values of called functions.** If a function is called but its return value is discarded (e.g., `fetchTemplates(phase)` with no assignment), either use the result or remove the call. Ignored return values indicate dead code or a logic error.
4. **Expose only consumed state/errors.** If a hook/function returns error state that no consumer reads, either wire it into the UI or remove the exported value. Dead exported state is misleading.

---

### 6. API Contract Consistency

**Recurring finding:** Frontend types and backend schemas use different field names, missing fields in API responses, documentation contradicting implementation.

**Rules:**

1. **Frontend and backend type definitions MUST match.** Field names, nesting structure, and types in frontend interfaces MUST mirror the backend schema. If the backend returns `sessionId`, the frontend type MUST include `sessionId`.
2. **API responses MUST include all fields declared in the response model.** Do not return `None`/`null` for fields that the database populates (e.g., timestamps). Query after insert if needed to return actual values.
3. **Documentation/comments MUST match implementation.** If a docstring says "uses X-User-Id for identity" but the code actually uses `X-User-Email`, update docstring OR code — never leave them contradicting.
4. **Upstream/downstream data format MUST be consistent.** If a skill/service outputs `full_match`, `partial_match`, `no_match`, downstream consumers MUST accept those exact field names — not alternate names like `full`, `partial`, `no_coverage`. Document and enforce the transformation if different naming is required.

---

### 7. Cross-Platform & Environment Compatibility

**Recurring finding:** Python indentation in inline scripts, missing file encoding, case-sensitivity mismatches on Windows.

**Rules:**

1. **Specify UTF-8 encoding explicitly when reading/writing files.** Do not rely on platform-default encoding. Use `encoding='utf-8'` (Python) or equivalent for files that may contain non-ASCII characters.
2. **Use case-insensitive matching for file paths.** On case-insensitive filesystems (Windows, macOS), path pattern matching MUST use case-insensitive comparison or normalize paths before comparison.
3. **Never pass indented code to `python -c`.** Inline Python passed via `python -c "..."` must start at column 0. Use heredocs (`python - <<'PY' ... PY`) or write to a temp file to avoid `IndentationError`.
4. **Provide fallbacks for optional browser/runtime APIs.** If using APIs like `crypto.randomUUID()` that may not exist in all contexts (non-secure origins, older runtimes), wrap with try/catch and provide a fallback implementation.
5. **Set `e.returnValue` for `beforeunload` handlers.** Most browsers require `e.returnValue = ''` in addition to `e.preventDefault()` to trigger the "Leave site?" prompt. Omitting it causes the handler to silently do nothing.

**Example (Shell):**

```bash
# BAD: Indented python -c
RESULT=$(python -c "
  import json
  data = json.load(open('file.json'))
  print(data['key'])
")

# GOOD: Column 0 python code via heredoc
RESULT=$(python - <<'PY'
import json
data = json.load(open('file.json'))
print(data['key'])
PY
)
```

---

### 8. Accessibility

**Recurring finding:** Icon-only buttons without accessible names.

**Rules:**

1. **Interactive elements MUST have accessible names.** Icon-only buttons MUST include `aria-label` (and/or visually-hidden text). The `title` attribute alone is insufficient for screen readers.
2. **Form controls MUST have associated labels.** Every input, select, and textarea MUST have an associated `<label>` element or `aria-label`/`aria-labelledby` attribute.

**Example (React/TSX):**

```tsx
// BAD: Icon-only button with no accessible name
<button onClick={onEdit} title="Edit">
  <PencilIcon />
</button>

// GOOD: With aria-label
<button onClick={onEdit} title="Edit" aria-label="Edit section">
  <PencilIcon />
</button>
```

---

### 9. Error Handling & Retry Logic

**Recurring finding:** Retry actions duplicating user operations, section matching by text instead of stable identifiers.

**Rules:**

1. **Retry MUST NOT duplicate user actions.** A "Retry" button should re-send the last API request without re-appending the user's message to the conversation/transcript. Implement a dedicated `retryLast()` path that replays only the network call.
2. **Use stable identifiers for matching, not display text.** When targeting content sections (headings, items) for edit/replacement, use generated slugs, IDs, or index-based keys — not raw text comparison. Text matching breaks when content contains formatting, duplicates, or inline markup.

---

### 10. CI/CD & Dependency Pinning

**Recurring finding:** Ambiguous version pinning, moving tags for workflow actions.

**Rules:**

1. **Define what "pinned version" means.** Pinned MUST mean a full commit SHA or full semantic version tag (e.g., `v2.3.1`). Moving tags like `v2`, `main`, `latest` are NOT pinned.
2. **GitHub Actions MUST use immutable references.** Reference actions and reusable workflows by full SHA or exact version tag. Do not use major-only tags (e.g., `@v2`) in production workflows.
3. **Document version range strategy for dependencies.** Whether using caret (`^`), tilde (`~`), or exact pins, document the rationale and make it consistent across the project.

---

### 11. Runtime Artifacts & Repository Hygiene

**Recurring finding:** Generated runtime files (audit logs, session artifacts) committed to version control.

**Rules:**

1. **Never commit generated runtime files.** Audit logs, session data, cache files, and machine-specific artifacts MUST NOT be committed to version control. Add them to `.gitignore`.
2. **Write runtime logs to non-versioned locations.** Use OS temp directories, cache directories, or dedicated output paths outside the repository tree for runtime artifacts.
3. **Validate that runtime output paths exist but do not version-track their contents.** Use `.gitkeep` for required directory structures, but `.gitignore` the actual output files.

---

### 12. Shell Script Security

**Recurring finding:** String interpolation of untrusted input into inline scripts, enabling command/code injection.

**Rules:**

1. **Never interpolate user input into shell command strings or inline Python.** Pass values via environment variables, command-line arguments with proper quoting, or temp files — not string interpolation into source code (`$VAR` inside `python -c "..."` or shell commands).
2. **Validate user-supplied arguments against safe patterns.** User-provided identifiers (agent names, file names) MUST be validated against a safe regex (e.g., `^[a-zA-Z0-9_-]+$`) before use in path construction or command building.
3. **Use `git commit -F <file>` instead of `-m "$MSG"`.** When commit messages come from untrusted sources, write to a temp file and use `-F` to avoid shell injection through message content.

**Example (Bash):**

```bash
# BAD: Interpolating into python -c
python -c "data = open('$UNTRUSTED_PATH').read()"

# GOOD: Pass via environment
export DATA_PATH="$VALIDATED_PATH"
python -c "import os; data = open(os.environ['DATA_PATH']).read()"
```

---

## Integration Guide for Developer Agents

Developer agents MUST reference this skill during code generation by applying the following checklist:

### Pre-Generation Checklist

1. **Auth endpoints** → Apply Category 1 (Authentication & Authorization)
2. **API request/response models** → Apply Category 2 (Input Validation) + Category 6 (Contract Consistency)
3. **State stores (Zustand, Redux, etc.)** → Apply Category 3 (State Management)
4. **Async handlers** → Apply Category 4 (Async Correctness)
5. **All generated code** → Apply Category 5 (Code Hygiene)
6. **Cross-platform code** → Apply Category 7 (Environment Compatibility)
7. **UI components** → Apply Category 8 (Accessibility)
8. **Error/retry flows** → Apply Category 9 (Error Handling)
9. **CI/CD config** → Apply Category 10 (CI/CD Hygiene)
10. **Shell scripts** → Apply Category 12 (Shell Script Security)

### Post-Generation Verification

After generating code, verify:

- [ ] No unused imports
- [ ] No unused props/parameters
- [ ] No generic types where constrained types are possible
- [ ] No `Math.random()` in security contexts
- [ ] No client-trusted identity headers without server validation
- [ ] All data endpoints enforce ownership checks
- [ ] All reset functions cover every stateful field
- [ ] Async handlers do not call sync I/O directly
- [ ] All interactive elements have accessible names
- [ ] No string interpolation of untrusted input into commands/scripts

---

## Output

This skill does not produce a standalone output artifact. It is a **reference standard** that developer agents internalize during code generation. When invoked explicitly, it returns:

```json
{
  "generated_by": {
    "agent": "sce-code-review-standards",
    "version": "1.0.0"
  },
  "standards_version": "1.0.0",
  "categories_count": 12,
  "source": "Derived from 106+ Copilot PR review comments across EdisonInternational repositories",
  "coverage": {
    "security": ["authentication", "authorization", "input-validation", "shell-injection", "insecure-randomness"],
    "correctness": ["state-management", "async-concurrency", "error-handling", "contract-consistency"],
    "quality": ["code-hygiene", "accessibility", "cross-platform-compatibility"],
    "operations": ["cicd-pinning", "runtime-artifacts"]
  }
}
```

## Provenance

Standards derived from Copilot PR review analysis:

| Source | PR Count | Comment Count | Key Patterns |
|---|---|---|---|
| EdisonInternational/EAIdeationCreator PR #28 | 1 | 49 | Auth, IDOR, state management, async, schema strictness |
| EdisonInternational/HelloWorld-AgentSkills PR #10 | 1 | 30 | Shell injection, python -c indentation, path traversal |
| EdisonInternational/HelloWorld-AgentSkills PR #12 | 1 | 23 | Contract consistency, documentation mismatch, TDD markers |
| EdisonInternational/HelloWorld-AgentSkills PR #13 | 1 | 3 | Version pinning, markdown formatting |
| EdisonInternational/EAIdeationCreator PR #17 | 1 | 1 | CI version ranges |
