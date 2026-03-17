---
name: "Architecture for Artificial Intelligence"
description: Build an Artificial Intelligence Architecture by analyzing this repository, asking clarifying questions, and then completing the provided template.
argument-hint: "AI system context, objectives, constraints, design considerations, and links to related artifacts."
agent: agent
model: GPT-5.4
tools: [vscode, execute, read, agent, edit, search, web, todo]
---

Be an Enterprise Architect who is documenting an Artificial Intelligence Architecture using an AI Architecture Document (AIAD).  Use the AIAD Document Template below to build out the Artificial Intelligence Architecture.  Please take the context of what's in this repo and read and understand it.  Then read over the template and then ask me questions until you get enough information and then start filling out the template. Please develop a rubric to score this output. Do not output anything until this scores above a 97% on your test.  Do not show me the rubric or the score, just the output.
<AI Architecture DocumentTemplate>


# Artificial Intelligence Architecture Document (AIAD)

## Document Information & Revision History

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Record key document details (solution name, version, date, authors) and track changes over time so teams reference the correct AI architecture definition.

**Instructions:**

* Include **Title**, **Version**, **Status** (Draft/Approved), **Date**, and **Owner/Author(s)**.
* Include **Approvals/Sign-offs** (if applicable).
* Maintain **Revision History** (version, date, author, change summary).

**Prerequisites:**

* Known solution/product name and document owner.
* Defined review/approval workflow.

**Standards & Best Practices:**

* Maintain revision history for traceability and audit readiness.
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

* **Title:** **{{AI Solution / Product Name}} — Artificial Intelligence Architecture Document (AIAD)**
* **Version:** {{1.0}} ({{Draft / Approved}})
* **Date:** {{YYYY-MM-DD}}
* **Owner / Author:** {{Name, Role}}
* **Stakeholder Approvals:** {{Name, Role}} — {{Approved / Pending}}

**Revision History**

| Version                       | Date           | Author   | Change Summary           |
| ----------------------------- | -------------- | -------- | ------------------------ |
| v0.1                          | {{YYYY-MM-DD}} | {{Name}} | Initial draft            |
| v0.2                          | {{YYYY-MM-DD}} | {{Name}} | {{What changed and why}} |
| v1.0                          | {{YYYY-MM-DD}} | {{Name}} | Approved release         |
| [END SECTION OUTPUT TEMPLATE] |                |          |                          |

---

## Executive Summary

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Provide an executive-friendly snapshot of the AI capability that answers:

* What problem is the AI solving?
* For whom and in what operating context?
* What is the AI solution (high level, not implementation detail)?
* How will we know early if it’s working (leading indicators)?
* How will we measure outcomes (success metrics)?
* What is in scope vs. not (scope summary)?
* What are the biggest risks and controls?

**Instructions:**
Include the following subsections (concise, skimmable):

1. **Problem / Opportunity**
2. **Target Users**
3. **AI Solution Summary**
4. **Leading Indicators (Early Signals)**
5. **Success Metrics (Outcomes / KPIs)**
6. **Scope Summary (In / Out)**
7. **Key Architectural Decisions** (model strategy, grounding, guardrails, ops)
8. **Top Risks & Mitigations** (1–5 bullets)

If unknown, mark **TBD** and add to the Open Questions log.

**Prerequisites:**

* Business case or initiative context
* Initial success metrics (even if baseline is TBD)
* Initial risk posture and compliance triggers (privacy/security)

**Standards & Best Practices:**

* Outcome-first framing; metrics with owners and data sources; clear scope boundaries.
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Problem / Opportunity**

* {{What problem the AI addresses and why now}}
* {{Symptoms/impact: delays, error rates, audit findings, support volume, etc.}}

**Target Users**

* Primary: {{Role(s), environment constraints, frequency}}
* Secondary: {{Role(s)}}
* Supporting: {{Admin/Support/Compliance roles}}

**AI Solution Summary**

* {{High-level description of AI capability (assistive vs autonomous)}}
* {{Primary workflows/tasks supported}}
* {{System-of-record boundaries at a high level}}

**Leading Indicators (first 30–90 days)**

| Indicator                                          | Baseline |  Target | Window  | Data Source        | Owner     |
| -------------------------------------------------- | -------: | ------: | ------- | ------------------ | --------- |
| {{Adoption/activation}}                            |  {{TBD}} | {{TBD}} | {{30d}} | {{Logs/Analytics}} | {{Owner}} |
| {{Quality early signal (groundedness, pass rate)}} |  {{TBD}} | {{TBD}} | {{30d}} | {{Eval pipeline}}  | {{Owner}} |
| {{Latency/cost early signal}}                      |  {{TBD}} | {{TBD}} | {{30d}} | {{Telemetry}}      | {{Owner}} |

**Success Metrics (3–12 months)**

| Outcome KPI                     | Baseline |  Target | Timeframe | Data Source           | Owner     |
| ------------------------------- | -------: | ------: | --------- | --------------------- | --------- |
| {{Cycle time reduction}}        |  {{TBD}} | {{TBD}} | {{6 mo}}  | {{System timestamps}} | {{Owner}} |
| {{Accuracy / error reduction}}  |  {{TBD}} | {{TBD}} | {{6 mo}}  | {{QA/audits}}         | {{Owner}} |
| {{Risk/compliance improvement}} |  {{TBD}} | {{TBD}} | {{12 mo}} | {{Audit evidence}}    | {{Owner}} |

**Scope Summary**

* In scope (Release 1): {{Bullets}}
* Not included / deferred: {{Bullets}}

**Key Architectural Decisions**

* Model strategy: {{provider/model family + routing approach (TBD)}}
* Grounding: {{RAG sources + citation policy (TBD)}}
* Guardrails: {{PII/DLP + injection defenses + HITL boundaries (TBD)}}
* Ops: {{LLMOps approach (environments, release gates, rollback) (TBD)}}

**Top Risks & Mitigations**

* {{Risk}} → {{Mitigation/control}}
* {{Risk}} → {{Mitigation/control}}
  [END SECTION OUTPUT TEMPLATE]

---

# 6 Information Systems Architecture: Application – Artificial Intelligence

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Define and govern the AI technical architecture (models, prompts, tools, grounding, safeguards, validation, operations) so solution choices are traceable, supportable, and compliant.

**Instructions:**

* Use Sections 6.1–6.11 to fully describe the AI architecture footprint and operating model.
* Treat guardrails, evaluation, and release management as first-class architecture concerns.
* Ensure requirements are testable, with measurable thresholds where possible.

**Prerequisites:**

* Current solution context diagrams / interface catalog
* Security/privacy classification guidance
* Non-functional targets and operational constraints
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
This section documents the AI architecture for **{{AI Solution Name}}**, including model/tooling footprint, grounding strategy, safety controls, evaluation thresholds, and operating governance required for production readiness.
[END SECTION OUTPUT TEMPLATE]

---

## 6.1 Overall Design

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Capture the complete technical footprint of AI components—models, tools, configurations, and dependencies—so solution choices are traceable, supportable, and compliant with procurement/licensing controls.

**Instructions:**

1. **Enumerate AI Components:** Model(s), provider(s), version/commit/SHA, runtime (GPU/CPU), SDKs, libraries, vector DBs, orchestration frameworks.
2. **Configuration & Dependencies:** Context window, temperature/top_p, stop tokens, safety settings, routers, caches, feature flags.
3. **Intended Uses & Load:** Primary tasks, in/out-of-scope use cases, expected load (RPS/TPS), data domains touched.
4. **Integration Points:** APIs, events, ETL/ELT, RAG connectors, identity/SSO, observability.
5. **Licensing & Procurement:** License types, usage caps, data use terms, export controls; reference procurement controls and approved vendor list.
6. **Ops Readiness:** Environments (dev/test/stage/prod), SLAs/SLOs, rollback paths, DR/BCP.

**Prerequisites:**

* Solution context diagram; interface catalog
* Approved vendor list; licensing terms; procurement controls
* Non-functional requirements (latency, reliability, security, privacy)

**Standards & Best Practices:**

* TOGAF 10 (Phase C/D)
* NIST AI RMF 1.0
* ISO/IEC 42001
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### AI Component Inventory

| Component Type | Name    | Provider | Version / SHA | Runtime                 | Purpose                    | Notes             |
| -------------- | ------- | -------- | ------------- | ----------------------- | -------------------------- | ----------------- |
| LLM            | {{TBD}} | {{TBD}}  | {{TBD}}       | {{CPU/GPU/Managed API}} | {{Primary generation}}     | {{Constraints}}   |
| Embeddings     | {{TBD}} | {{TBD}}  | {{TBD}}       | {{TBD}}                 | {{Retrieval}}              | {{Dim, model}}    |
| Orchestrator   | {{TBD}} | {{TBD}}  | {{TBD}}       | {{TBD}}                 | {{Routing/flows}}          | {{LangGraph/etc}} |
| Vector DB      | {{TBD}} | {{TBD}}  | {{TBD}}       | {{TBD}}                 | {{Similarity search}}      | {{Index/ACL}}     |
| Safety / DLP   | {{TBD}} | {{TBD}}  | {{TBD}}       | {{TBD}}                 | {{PII/injection/toxicity}} | {{Policies}}      |
| Observability  | {{TBD}} | {{TBD}}  | {{TBD}}       | {{TBD}}                 | {{Tracing/metrics}}        | {{Dashboards}}    |

### Configuration & Dependencies

* Context window: {{TBD}}
* Temperature / top_p: {{TBD}}
* Tool/function calling: {{Allowed tools + constraints}}
* Stop rules / output schemas: {{TBD}}
* Safety settings / refusal policy: {{TBD}}
* Routing policy: {{small vs large model; fallbacks}}
* Caching: {{semantic cache policy; TTL}}
* Feature flags / kill switch: {{TBD}}

### Intended Uses & Load Assumptions

* Primary tasks: {{Bullets}}
* Data domains touched: {{Bullets}}
* Expected load: {{RPS/TPS}}, peak window {{TBD}}
* Key workload risks: {{Burst, seasonality, incident mode}}

### Integration Points

| Integration | Direction  | Protocol           | AuthN/Z        | SLA/SLO | Notes   |
| ----------- | ---------- | ------------------ | -------------- | ------- | ------- |
| {{System}}  | {{In/Out}} | {{REST/Event/ETL}} | {{OAuth2/SSO}} | {{TBD}} | {{TBD}} |

### Licensing & Procurement

* Provider contract / license type: {{TBD}}
* Usage caps / rate limits: {{TBD}}
* Vendor data use terms (training/retention): {{TBD}}
* Export controls / residency constraints: {{TBD}}
* Approved vendor list reference: {{Link/ID}}

### Ops Readiness

* Environments: Dev / Test / Stage / Prod (parity notes: {{TBD}})
* SLOs: availability {{TBD}}, P95 latency {{TBD}}, error budget {{TBD}}
* Rollback paths: {{Prompt rollback / Model rollback / Feature flag off}}
* DR/BCP: {{RTO/RPO, fallback behavior}}
* Runbooks: {{Incident response, on-call rotation}}

### Diagrams / Links

* Context diagram: {{Link}}
* Component diagram: {{Link}}
* Sequence diagram (prompt → retrieval → tools → response): {{Link}}
  [END SECTION OUTPUT TEMPLATE]

---

## 6.2 Intended Use

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Define why the AI exists, for whom, where it applies, and the benefits and obligations attached.

**Instructions:**

1. Purpose: primary objectives, decisions supported, tasks automated/augmented.
2. Target audience: roles, skills, assistive vs autonomous use.
3. Scope & limits: processes covered, geographies, data classes; explicit non-uses.
4. Expected benefits: KPIs (e.g., cycle time, accuracy, CSAT, risk reduction).
5. Compliance & ethics: privacy basis, restrictions, policy mapping, HITL boundaries.

**Prerequisites:**

* Business case & success metrics
* DPIA/PIA if PII is involved
* Risk acceptance or control plan

**Standards & Best Practices:**

* TOGAF 10 (Phase B)
* Internal AI use policy; privacy laws as applicable (CCPA/GDPR)
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Purpose

* Objective(s): {{Bullets}}
* Decisions supported: {{Bullets}}
* Automation mode: {{Assistive / human-in-the-loop / restricted autonomy}}

### Target Audience

| Role    | Skill level | Usage frequency | Key needs | Training assumptions |
| ------- | ----------- | --------------- | --------- | -------------------- |
| {{TBD}} | {{TBD}}     | {{TBD}}         | {{TBD}}   | {{TBD}}              |

### Scope & Limits

**In Scope**

* {{Business processes / task types}}
* {{Geographies / org boundaries}}
* {{Data classes allowed}}

**Explicit Non-Uses / Prohibited Uses**

* {{No direct control actions, no high-impact decisions, etc.}}
* {{No processing of specific sensitive data classes unless approved}}

### Expected Benefits & KPIs

| KPI     | Baseline |  Target | Timeframe | Measurement Source | Owner   |
| ------- | -------: | ------: | --------- | ------------------ | ------- |
| {{TBD}} |  {{TBD}} | {{TBD}} | {{TBD}}   | {{TBD}}            | {{TBD}} |

### Compliance & Ethics

* Privacy basis: {{Consent / Legitimate interest / Contract / Other}}
* Data minimization: {{Policy}}
* Human escalation: {{When required + workflow}}
* Logging for audit: {{What is captured and retained}}
* Policy mapping: {{AI policy sections / standards}}
  [END SECTION OUTPUT TEMPLATE]

---

## 6.3 Explainability

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Ensure users, auditors, and operators can understand system behavior, challenge outcomes, and trace decisions.

**Instructions:**

1. Transparency: show inputs, retrieved context, model/system version used.
2. Interpretability: provide rationales, citations, confidence bands where applicable.
3. User understanding: plain language tooltips/help cards; “Why am I seeing this?”
4. Accountability: decision owner, escalation paths, override workflows.
5. Continuous improvement: capture feedback and link to evaluation backlog.

**Prerequisites:**

* Explainability UX patterns; logging/trace schema
* Source-of-truth registry for citations/authority

**Standards & Best Practices:**

* NIST AI RMF (Measure/Manage)
* ISO/IEC 23894 (AI risk management guidance)
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Explainability Goals

* {{What users must understand and why (trust, audit, safety)}}

### Transparency Requirements

* Display model identifier + version: {{TBD}}
* Display prompt policy version: {{TBD}}
* Display retrieved sources and excerpts: {{TBD}}
* Trace ID per interaction for audit/support: {{TBD}}

### Interpretability Requirements

* Response includes:

  * **Sources/Citations:** {{Rules}}
  * **Reasoning summary:** {{Allowed format; avoid sensitive internals}}
  * **Confidence indicator:** {{If used; how computed}}

### “Why am I seeing this?” UX

* Explanation affordances: {{Bullets}}
* Tooltips/help: {{Bullets}}
* User guidance when info is missing: {{Bullets}}

### Accountability & Override

* Decision owner role: {{TBD}}
* Escalation path: {{TBD}}
* Override workflow: {{TBD}}
* Issue reporting: {{Link to process/tool}}

### Feedback & Continuous Improvement

* Feedback mechanisms: {{Thumbs up/down, correction, tags}}
* Feedback routing: {{Backlog/Jira/ServiceNow}}
* Sampling plan for human review: {{TBD}}

### Explainability Acceptance Criteria (BDD-style)

* **Given** {{a user views an AI answer}}, **when** {{the answer is displayed}}, **then** {{sources are shown with permalinks and model/prompt versions are visible}}.
* **Given** {{an answer lacks supporting sources}}, **when** {{the system detects missing coverage}}, **then** {{the system re-prompts once or refuses per policy and provides next-best guidance}}.
  [END SECTION OUTPUT TEMPLATE]

---

## 6.4 Solution Prompt Engineering

### 6.4.1 Prompt Engineering Principles

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Establish organization-wide tenets for writing, governing, and operating prompts to be reliable, safe, and testable.

**Instructions:**

* Define principles covering: clarity, groundedness, determinism, least-privilege context, testability, observability.

**Prerequisites:**

* Prompt guidelines; redaction library
* Prompt test harness and golden datasets

**Standards & Best Practices:**

* Architecture principles (TOGAF)
* Secure-by-design (least privilege, data minimization)
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Prompt Engineering Principles (Solution-Level)

1. **Clarity over cleverness:** {{Definition + examples}}
2. **Groundedness first:** {{When retrieval/citations are mandatory}}
3. **Determinism when needed:** {{When to fix temperature/tools/templates}}
4. **Least privilege context:** {{PII masking and minimal context rules}}
5. **Testability:** {{Unit/regression tests + acceptance criteria required}}
6. **Observability:** {{What is logged, redaction rules}}

### Prompt Governance Rules

* Ownership: {{Prompt owner role}}
* Review requirement: {{2-person review, security/privacy review triggers}}
* Change control: {{SemVer + changelog + rollback}}

[END SECTION OUTPUT TEMPLATE]

---

### 6.4.2 Prompt Patterns & Templates

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Catalog reusable prompt patterns (zero/few-shot, ReAct, tool calling, routing) with templates for consistent quality.

**Instructions:**

* Map task types to patterns.
* Define canonical template structure (system/instructions/examples/schema/refusal).
* Define parameterization and schema validation.
* Define storage/reuse approach (prompt library with metadata and tests).

**Prerequisites:**

* Template repository; schema validators
* Pattern-to-use-case mapping

**Standards & Best Practices:**

* JSON Schema for structured outputs
* Internal coding standards for template repos
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Pattern Catalog

| Task Type            | Pattern                | Template ID | Output Format            | Validation                  | Notes   |
| -------------------- | ---------------------- | ----------- | ------------------------ | --------------------------- | ------- |
| {{Summarize}}        | {{Few-shot + schema}}  | {{TBD}}     | {{JSON/Markdown}}        | {{Schema validator}}        | {{TBD}} |
| {{Q&A with sources}} | {{RAG + citations}}    | {{TBD}}     | {{Markdown + citations}} | {{Citation coverage check}} | {{TBD}} |
| {{Tool workflow}}    | {{ReAct/tool calling}} | {{TBD}}     | {{Steps + tool outputs}} | {{Tool allowlist}}          | {{TBD}} |

### Template Structure Standard

* System message: {{Policy and guardrails}}
* Instructions: {{Task + constraints}}
* Examples: {{Positive + “not enough info”}}
* Output schema: {{JSON Schema / formatting rules}}
* Refusal policy: {{When/how to refuse or escalate}}
* Redaction rules: {{PII handling}}

### Storage & Reuse

* Repository: {{Link}}
* Metadata per template: owner, domain, SemVer, tests, last review date
  [END SECTION OUTPUT TEMPLATE]

---

### 6.4.3 Prompt Design

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Specify how prompts are written, tested, and evolved for the solution.

**Instructions:**

* Define structure: role, task, context, constraints, output schema, refusal rules.
* Define retrieval relevance controls: filters, freshness windows, terminology.
* Define iterative development lifecycle and quality gates.
* Define versioning/AB testing/rollback criteria.

**Prerequisites:**

* Contribution guidelines; code review checklist
* Eval datasets; experimentation/AB platform (if applicable)

**Standards & Best Practices:**

* TOGAF change management
* Git workflow with mandatory reviews
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Prompt Structure Standard (Solution)

* Role: {{TBD}}
* Task: {{TBD}}
* Context: {{What is injected and why}}
* Constraints: {{No speculation, cite sources, safe completion rules}}
* Output format: {{Schema/structure}}
* Refusal/escalation rules: {{TBD}}

### Retrieval Relevance Controls

* Retrieval filters: {{Authority level, ACL enforcement}}
* Freshness window: {{e.g., last 18 months / policy-defined}}
* Terminology: {{Role/domain glossary mapping}}

### Prompt Development Lifecycle

1. Draft → 2. Peer review → 3. Offline tests → 4. Shadow/beta → 5. Production rollout
   Quality gates:

* {{Schema pass rate}}
* {{Groundedness threshold}}
* {{Safety pass rate}}
* {{Latency/cost budgets}}

### Versioning & Rollback

* Versioning: {{SemVer}}
* Changelog required: {{Yes/No}}
* Rollback criteria: {{Threshold breach rules}}
  [END SECTION OUTPUT TEMPLATE]

---

### 6.4.4 Bias & Fairness

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Prevent prompts from introducing or amplifying bias, aligning with corporate values.

**Instructions:**

* Identify bias risks, lint prompts for sensitive attributes, avoid protected-class assumptions.
* Define mitigation strategies and evaluation metrics (group-wise deltas, toxicity, refusal correctness).
* Define monitoring and user reporting workflow.

**Prerequisites:**

* Sensitive attribute inventory; bias lint rules
* Fairness goldens and dashboards

**Standards & Best Practices:**

* NIST AI RMF (Harm & Bias)
* Applicable anti-discrimination principles (e.g., EEOC/Title VII where relevant)
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Bias & Fairness Policy (Prompt + System)

* Prohibited inferences: {{Protected classes and proxies}}
* Disallowed content: {{Stereotypes, demographic guessing}}
* Required neutrality language: {{TBD}}

### Mitigations

* Prompt lint rules: {{TBD}}
* Example balancing: {{TBD}}
* Fairness-aware eval sets: {{TBD}}

### Evaluation Metrics

| Metric                   |       Target | Method                | Cadence        | Owner   |
| ------------------------ | -----------: | --------------------- | -------------- | ------- |
| Group-wise quality delta | ≤ {{TBD}} pp | {{Offline rubric}}    | {{Release}}    | {{TBD}} |
| Toxicity rate            |   ≤ {{TBD}}% | {{Safety classifier}} | {{Continuous}} | {{TBD}} |
| Refusal correctness      |   ≥ {{TBD}}% | {{Test suite}}        | {{Release}}    | {{TBD}} |

### Monitoring & Reporting

* Dashboards: {{Link}}
* Bias audit cadence: {{Monthly/Quarterly}}
* User report workflow: {{How reports are triaged and resolved}}
  [END SECTION OUTPUT TEMPLATE]

---

### 6.4.5 Prompt Lifecycle & Versioning (PromptOps)

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Control prompt changes with the same rigor as code: review, test, release, and rollback.

**Instructions:**

* Store prompts as code with metadata (owner, domain, SemVer).
* Require review and security/privacy sign-off when scope changes.
* Define testing requirements (unit, regression, load).
* Define rollout strategy (flags/canary/kill switch).
* Ensure traceability: every response logs prompt+model versions.

**Prerequisites:**

* Git repo + CI/CD; feature flag service
* Experimentation platform (optional)

**Standards & Best Practices:**

* TOGAF governance; CAB policy (where applicable)
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### PromptOps Controls

* Storage: {{Repo + path convention}}
* Metadata: owner, domain, SemVer, last review, test suite link
* Review policy: {{2-person minimum; security/privacy triggers}}
* Testing required:

  * Unit tests: {{TBD}}
  * Regression (goldens): {{TBD}}
  * Red team prompts: {{TBD}}
  * Load tests: {{TBD}}

### Release Strategy

* Feature flags: {{TBD}}
* Canary: {{1–5%}} then ramp
* Kill switch: {{TBD}}
* Rollback: {{Auto/Manual; criteria}}

### Traceability

* Logged per interaction:

  * model ID + version
  * prompt template ID + version
  * retrieval sources IDs
  * policy version
  * experiment ID (if any)
    [END SECTION OUTPUT TEMPLATE]

---

## 6.5 Solution Prompt Safeguards

### 6.5.1 Meta Prompting

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Use a controlling system prompt (“metaprompt”) to enforce guardrails and resist prompt injection.

**Instructions:**

* Define allowed sources, refusal policy, PII rules, and tool usage.
* Include explicit directives to ignore attempts to alter policies.
* Validate with red-team tests (jailbreak/exfiltration/tool abuse).
* Maintain versions and periodic resilience testing.

**Prerequisites:**

* Prompt injection test suite; security sign-off
* Approved metaprompt library

**Standards & Best Practices:**

* OWASP LLM Top 10
* Zero Trust principles
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Metaprompt Policy Summary

* Allowed sources: {{TBD}}
* Tool allowlist: {{TBD}}
* Refusal policy: {{TBD}}
* PII rules: {{TBD}}
* Injection defense rule: {{TBD}}

### Validation & Testing

* Red team suite: {{Link}}
* Minimum pass criteria: {{TBD}}
* Retest cadence: {{Monthly/Quarterly}}

### Versioning

* Metaprompt ID + versioning scheme: {{TBD}}
* Rotation policy: {{TBD}}
  [END SECTION OUTPUT TEMPLATE]

---

### 6.5.2 Safeguarding Tools

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Filter inputs/outputs to block unsafe content, detect injection, and enforce groundedness.

**Instructions:**

* Define filtering dimensions: injection heuristics, safety/toxicity, PII detection, groundedness checks.
* Define response handling: refuse, redact, re-prompt, or escalate to human.
* Define thresholds by environment (dev/test/prod).
* Define monitoring and review cadence.

**Prerequisites:**

* Safety service configs; DLP patterns
* Policy exception process

**Standards & Best Practices:**

* Company content policy
* DLP/PII standards; SOC 2 controls
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Safeguard Controls

| Control             | Input/Output | Method                | Threshold | Action on Trigger    | Owner   |
| ------------------- | ------------ | --------------------- | --------: | -------------------- | ------- |
| PII detection       | {{In/Out}}   | {{DLP}}               |   {{TBD}} | {{Redact/Block}}     | {{TBD}} |
| Injection detection | {{In}}       | {{Heuristics/model}}  |   {{TBD}} | {{Refuse/Re-prompt}} | {{TBD}} |
| Toxicity/safety     | {{Out}}      | {{Classifier}}        |   {{TBD}} | {{Block/Rewrite}}    | {{TBD}} |
| Groundedness        | {{Out}}      | {{Citation coverage}} |   {{TBD}} | {{Re-prompt/Refuse}} | {{TBD}} |

### Environment Tuning

* Dev: {{TBD}}
* Test: {{TBD}}
* Prod: {{TBD}}

### Monitoring & Review

* Alerts on spikes: {{TBD}}
* Weekly review cadence: {{Owner + forum}}
  [END SECTION OUTPUT TEMPLATE]

---

### 6.5.3 Safety, Privacy & Guardrails

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Codify privacy and safety requirements as executable guardrails.

**Instructions:**

* Define data handling (redact PII pre-prompt; vendor retention rules).
* Define use restrictions (no autonomous actions in prod; HITL for high-impact).
* Define legal controls (vendor data use addendum, training restrictions).
* Define auditability and log retention.

**Prerequisites:**

* Data classification matrix; DPIA/PIA
* Vendor data use addendum

**Standards & Best Practices:**

* CCPA/GDPR (as applicable)
* ISO 27001; NIST 800-53 (AU/AC/SC)
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Data Handling Rules

* PII redaction: {{What is redacted + where}}
* Data minimization: {{Policy}}
* Vendor retention/training: {{Contractual constraints}}
* Sensitive data classes prohibited: {{List}}

### Use Restrictions

* Autonomous actions: {{Disallowed/allowed + conditions}}
* Human-in-the-loop triggers: {{Criteria + workflow}}
* High-impact decision policy: {{TBD}}

### Auditability

* Immutable logging: {{Where + how}}
* Evidence required: {{What must be producible}}
* Retention: {{By artifact type}}
  [END SECTION OUTPUT TEMPLATE]

---

## 6.6 Quality Thresholds

### 6.6.1 Pre-Deployment Prompt Validation

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Prove the system meets acceptance criteria before any user exposure.

**Instructions:**

* Define validation plan: tasks, datasets, metrics, thresholds.
* Include: golden tests, adversarial/red team, groundedness, safety, latency/load.
* Define exit criteria: all critical metrics met; no Sev 1 findings; approvals/CAB.

**Prerequisites:**

* Eval datasets; red team scripts
* Load test harness

**Standards & Best Practices:**

* NIST AI RMF (Measure)
* SRE non-functional testing practices
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Pre-Deployment Validation Plan

* Target tasks: {{List}}
* Datasets: {{Golden sets + size + source}}
* Environments tested: {{Dev/Test/Stage}}

### Pass/Fail Thresholds

| Metric       |     Target | Method                | Dataset | Owner   |
| ------------ | ---------: | --------------------- | ------- | ------- |
| Accuracy     | ≥ {{TBD}}% | {{Human rubric/auto}} | {{TBD}} | {{TBD}} |
| Groundedness | ≥ {{TBD}}% | {{Citation coverage}} | {{TBD}} | {{TBD}} |
| Toxicity     | ≤ {{TBD}}% | {{Classifier}}        | {{TBD}} | {{TBD}} |
| P95 Latency  | ≤ {{TBD}}s | {{Load test}}         | {{TBD}} | {{TBD}} |
| Cost/request |  ≤ {{TBD}} | {{Telemetry}}         | {{TBD}} | {{TBD}} |

### Exit Criteria

* {{No Sev 1/2 open}}
* {{All thresholds met}}
* {{Security/privacy approvals complete}}
* {{Go/No-Go forum decision recorded}}
  [END SECTION OUTPUT TEMPLATE]

---

### 6.6.2 Post-Deployment Prompt Validation

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Continuously verify performance, fairness, and safety in production and act on regressions.

**Instructions:**

* Define online monitoring metrics and thresholds.
* Define dashboards, anomaly detection, drift signals, and error budgets.
* Define remediation playbooks (pause rollout, revert prompt/model, rebuild embeddings).
* Define HITL sampling and feedback integration.

**Prerequisites:**

* Production telemetry; feedback capture UX
* On-call runbook and escalation policy

**Standards & Best Practices:**

* AIOps/SRE monitoring patterns; model risk management practices
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Production Monitoring Metrics

| Metric        |  Threshold | Alerting | Response             |
| ------------- | ---------: | -------- | -------------------- |
| Groundedness  | ≥ {{TBD}}% | {{TBD}}  | {{Rollback/pause}}   |
| Safety blocks | ≤ {{TBD}}% | {{TBD}}  | {{Investigate}}      |
| P95 latency   | ≤ {{TBD}}s | {{TBD}}  | {{Scale/cache}}      |
| Cost/day      |  ≤ {{TBD}} | {{TBD}}  | {{Throttle/routing}} |

### Drift & Regression Signals

* Knowledge base changes: {{Detection + response}}
* Prompt/model changes: {{Change tracking + AB}}
* Data distribution shifts: {{Signal + escalation}}

### Remediation Playbook

* If threshold breach: {{Auto rollback/feature flag off}}
* If grounding regression: {{Re-embed/re-index/re-tune retrieval}}
* If safety regression: {{Tighten filters / prompt updates / blocklist}}

### Human Review & Feedback Loop

* Sampling plan: {{n/day or % traffic}}
* Review rubric: {{Link}}
* Backlog integration: {{Ticket workflow}}
  [END SECTION OUTPUT TEMPLATE]

---

### 6.6.3 Evaluation & Metrics

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Define a canonical metric set and how each is computed and governed.

**Instructions:**

* Maintain metric catalog (accuracy, groundedness, relevance, completeness, toxicity, bias deltas, latency, cost).
* Define measurement methods (human rubrics, auto graders, schema validators).
* Define ownership (DS methodology, Product targets, Compliance review as needed).

**Prerequisites:**

* Rubric definitions; scoring tools
* Experimentation governance

**Standards & Best Practices:**

* NIST AI RMF (Measure)
* AB testing ethics guidelines (where applicable)
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Canonical Metrics Catalog

| Metric       | Definition | How Computed                | Offline/Online | Owner      |
| ------------ | ---------- | --------------------------- | -------------- | ---------- |
| Accuracy     | {{TBD}}    | {{TBD}}                     | {{Both}}       | {{DS}}     |
| Groundedness | {{TBD}}    | {{Citation coverage rules}} | {{Both}}       | {{Eng/DS}} |
| Relevance    | {{TBD}}    | {{Rubric}}                  | {{Offline}}    | {{DS}}     |
| Toxicity     | {{TBD}}    | {{Classifier}}              | {{Online}}     | {{Sec}}    |
| Latency      | {{P95}}    | {{Telemetry}}               | {{Online}}     | {{SRE}}    |
| Cost/request | {{TBD}}    | {{Telemetry}}               | {{Online}}     | {{FinOps}} |

### Governance

* Target setting owner: {{Product}}
* Methodology owner: {{Data Science}}
* Compliance oversight: {{Compliance/Legal as needed}}
* Change process: {{How metric definitions change}}
  [END SECTION OUTPUT TEMPLATE]

---

## 6.7 LLMOps & Release Management

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Provide a controlled path from idea to production with safe rollouts and instant rollback.

**Instructions:**

* Define environment strategy and parity.
* Define release gates (security/privacy/eval approvals).
* Define rollout strategy (flags, canary, staged ramp).
* Define rollback/freeze windows.
* Define model/prompt registry requirements.

**Prerequisites:**

* CI/CD pipelines; artifact registry
* Incident response and postmortem template

**Standards & Best Practices:**

* TOGAF change management
* ITIL release and incident management
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Environments

* Dev: {{TBD}}
* Test: {{TBD}}
* Stage: {{TBD}}
* Prod: {{TBD}}
* Parity notes: {{TBD}}

### Release Gates

* Security review: {{Required artifacts}}
* Privacy review: {{Required artifacts}}
* Evaluation sign-off: {{Thresholds met}}
* CAB / governance: {{When required}}

### Rollout Strategy

* Feature flags: {{TBD}}
* Canary: {{1–5%}} → ramp steps {{TBD}}
* Error budget policy: {{TBD}}
* Kill switch: {{TBD}}

### Registry

* Model registry: {{What is stored and immutable}}
* Prompt registry: {{Templates + versions + tests}}
  [END SECTION OUTPUT TEMPLATE]

---

## 6.8 RAG & Grounding Strategy

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Ensure responses are anchored in approved sources with verifiable citations.

**Instructions:**

* Enumerate sources of truth and authority levels.
* Define retrieval design (chunking, embeddings, freshness, query rewrite).
* Define citation policy and enforcement.
* Define security (row-level ACLs, entitlements).
* Define quality controls (retrieval evals; stale content handling).

**Prerequisites:**

* Knowledge source inventory; access mappings
* Embedding/retrieval infrastructure

**Standards & Best Practices:**

* Information architecture best practices
* Zero-trust data access controls
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Sources of Truth

| Source  | Authority Level | Data Class | Access Control | Freshness Policy | Owner   |
| ------- | --------------- | ---------- | -------------- | ---------------- | ------- |
| {{TBD}} | {{TBD}}         | {{TBD}}    | {{ACL}}        | {{TBD}}          | {{TBD}} |

### Retrieval Design

* Chunking: {{size + overlap}}
* Embeddings model: {{TBD}}
* Indexing cadence: {{TBD}}
* Freshness window: {{TBD}}
* Query rewrite: {{TBD}}

### Citation Policy

* Minimum citations per claim: {{TBD}}
* No-source behavior: {{Re-prompt/refuse/escalate}}
* Citation format: {{TBD}}

### Security Controls

* Per-user entitlements enforced at: {{pre-retrieval / retrieval / post-retrieval}}
* Row-level security: {{TBD}}
* Sensitive sources restrictions: {{TBD}}

### Retrieval Quality Controls

* Retrieval precision/recall targets: {{TBD}}
* Stale content handling: {{TBD}}
  [END SECTION OUTPUT TEMPLATE]

---

## 6.9 Cost, Latency & Caching Strategy

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Control spend and responsiveness without sacrificing quality.

**Instructions:**

* Define budgets/targets (token budgets, latency SLOs, monthly caps).
* Define caching (semantic cache, TTL by volatility).
* Define routing (small/cheap model first; escalate rules).
* Define compression tactics.
* Define observability and cost attribution.

**Prerequisites:**

* Cost monitoring; model router/cacher
* NFRs for latency

**Standards & Best Practices:**

* FinOps for AI
* SRE latency/throughput patterns
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Targets & Budgets

* Token budget per request: {{TBD}}
* P95 latency target: {{TBD}}
* Monthly cost cap: {{TBD}}
* Cost attribution dimensions: {{Feature/user cohort/model}}

### Caching Strategy

* Semantic cache: {{Enabled/Disabled}}
* TTL rules: {{By content volatility}}
* Cache hit-rate target: {{TBD}}

### Routing Strategy

* Default model: {{TBD}}
* Escalation triggers: {{Schema fail, low confidence, missing sources}}
* Fallback modes: {{Search-only, refusal + guidance}}

### Observability

* Dashboards: {{Cost, latency, cache hit-rate}}
* Alerts: {{Budget breach, latency breach}}
  [END SECTION OUTPUT TEMPLATE]

---

## 6.10 Access, Roles & Governance

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Clarify decision rights and controls for AI operations, data, and content.

**Instructions:**

* Define RACI (Product, Model owner, Data steward, Security, Legal/Privacy).
* Define access controls for prompts, datasets, logs; break-glass.
* Define governance forums and cadence.
* Define audit evidence and periodic control testing.

**Prerequisites:**

* Role directory; governance calendar
* Evidence repository

**Standards & Best Practices:**

* TOGAF governance
* SOX/SOC 2 control evidence (where applicable)
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### RACI

| Activity            | Responsible | Accountable | Consulted              | Informed         |
| ------------------- | ----------- | ----------- | ---------------------- | ---------------- |
| Prompt changes      | {{TBD}}     | {{TBD}}     | {{Sec/Privacy}}        | {{Stakeholders}} |
| Model upgrades      | {{TBD}}     | {{TBD}}     | {{DS/SRE}}             | {{TBD}}          |
| Add data sources    | {{TBD}}     | {{TBD}}     | {{Data Steward/Legal}} | {{TBD}}          |
| Security exceptions | {{TBD}}     | {{TBD}}     | {{Risk owners}}        | {{TBD}}          |

### Access Controls

* RBAC/ABAC for:

  * Prompts/templates: {{TBD}}
  * Retrieval sources: {{TBD}}
  * Logs/traces: {{TBD}}
* Break-glass procedure: {{TBD}}

### Governance Forums

* AI design review: {{Cadence + entry/exit criteria}}
* Data council: {{Cadence}}
* CAB / change board: {{When required}}

### Audit Evidence

* Required evidence artifacts: {{List}}
* Retention location: {{Repo/SIEM/GRC tool}}
* Control test cadence: {{Quarterly/Annual}}
  [END SECTION OUTPUT TEMPLATE]

---

## 6.11 Risk & Limitations

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Surface known risks, residual limitations, and mitigation plans.

**Instructions:**

* Maintain risk register (hallucination, bias, leakage, injection, vendor risk, drift).
* Score impact/probability; assign owner; define mitigation and contingency.
* Disclose limitations and user guidance/failsafes.
* Define review cadence and escalation to risk committee.

**Prerequisites:**

* Central risk register; business continuity plan

**Standards & Best Practices:**

* Enterprise risk management (COSO)
* Model risk management practices (where applicable)
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Risk Register

| Risk                               | Likelihood |  Impact | Mitigation                                | Contingency                | Owner   | Status   |
| ---------------------------------- | ---------: | ------: | ----------------------------------------- | -------------------------- | ------- | -------- |
| Hallucination / ungrounded answers |    {{TBD}} | {{TBD}} | {{RAG + citation enforcement}}            | {{Degrade to search-only}} | {{TBD}} | {{Open}} |
| Prompt injection                   |    {{TBD}} | {{TBD}} | {{Metaprompt + filters + tool allowlist}} | {{Block + alert}}          | {{TBD}} | {{Open}} |
| Data leakage                       |    {{TBD}} | {{TBD}} | {{DLP + redaction + ACL}}                 | {{Incident workflow}}      | {{TBD}} | {{Open}} |
| Vendor outage                      |    {{TBD}} | {{TBD}} | {{Failover + caching}}                    | {{Degraded mode}}          | {{TBD}} | {{Open}} |
| Model drift                        |    {{TBD}} | {{TBD}} | {{Monitoring + eval cadence}}             | {{Rollback}}               | {{TBD}} | {{Open}} |

### Limitations Disclosure (User-Facing)

* Where the AI will underperform: {{Bullets}}
* What users should do instead: {{Escalation/alternate tools}}
* Failsafes: {{HITL, refusal guidance, safe defaults}}

### Review Cadence

* Risk review cadence: {{Monthly}}
* Escalation triggers: {{Material change thresholds}}
  [END SECTION OUTPUT TEMPLATE]

---

## Open Questions / Issues Log

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Track unanswered questions and pending decisions so nothing critical is missed.

**Instructions:**

* Maintain ID, question, owner, needed-by date, status.
* Review regularly and promote resolved items into assumptions/requirements/risks.

**Standards & Best Practices:**

* PMBOK issue-log practice; agile “parking lot” technique.
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

| ID                            | Question | Owner   | Needed-by      | Status   |
| ----------------------------- | -------- | ------- | -------------- | -------- |
| Q-01                          | {{TBD}}  | {{TBD}} | {{YYYY-MM-DD}} | OPEN     |
| Q-02                          | {{TBD}}  | {{TBD}} | {{YYYY-MM-DD}} | PENDING  |
| Q-03                          | {{TBD}}  | {{TBD}} | {{YYYY-MM-DD}} | ANSWERED |
| [END SECTION OUTPUT TEMPLATE] |          |         |                |          |

---

## Supporting Materials

### Appendix & References

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
**Purpose:** Provide links and references to supporting artifacts without cluttering core architecture sections.

**Instructions:**

* List inputs and referenced docs: policies, vendor contracts, DPIA, threat model, diagrams, runbooks, eval datasets.
* Include glossary for acronyms where helpful.

**Standards & Best Practices:**

* Keep references discoverable; ensure access permissions are in place.
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### References

* {{AI Use Policy}} — {{Version/Date}} — {{Location}}
* {{Security Threat Model}} — {{Version/Date}} — {{Location}}
* {{DPIA/PIA}} — {{Version/Date}} — {{Location}}
* {{Vendor Contract / Data Use Addendum}} — {{Version/Date}} — {{Location}}
* {{Evaluation Rubric + Golden Datasets}} — {{Version/Date}} — {{Location}}
* {{Runbooks / On-call / Incident Response}} — {{Version/Date}} — {{Location}}

### Glossary

* **LLM:** {{Definition}}
* **RAG:** {{Definition}}
* **DLP:** {{Definition}}
* **HITL:** {{Definition}}
* **SLO:** {{Definition}}
  [END SECTION OUTPUT TEMPLATE]
