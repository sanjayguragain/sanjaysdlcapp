# Architecture Decision Record (ADR)

## Document Information & Revision History

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Record the ADR's identity, ownership, status, and change history so everyone references the correct decision and understands what changed over time.

Instructions:

* Include:

  * **ADR Title**
  * **ADR ID** (required indexed identifier, e.g., ADR-012)
  * **Status** (Draft / Proposed / Accepted / Deprecated / Superseded)
  * **Decision Owner** (Domain Architect or accountable architect)
  * **Authors / Contributors**
  * **Date Created** and **Last Updated**
  * **Related documents** (PRD, architecture artifacts, epics, tickets, standards)
* The ADR file name and the ADR ID inside the document must use the same index number.
* Add a **Revision History** table: version, date, author, changes.
* If your org requires it, add **Approvals / Sign-offs** (or reference the Approvals section below).

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Title:** {Decision Title}
**ADR ID:** {ADR-###}
**Status:** {Draft | Proposed | Accepted | Deprecated | Superseded}
**Decision Owner:** {Name / Role}
**Author(s):** {Name(s)}
**Date Created:** {YYYY-MM-DD}
**Last Updated:** {YYYY-MM-DD}
**Related PRD:** {PRD name / link}
**Related Architecture Docs:** {architecture artifacts / diagrams / repo paths}

**Revision History**

| Version | Date       | Author | Summary of Changes                           |
| ------- | ---------- | ------ | -------------------------------------------- |
| v0.1    | YYYY-MM-DD | Name   | Initial draft                                |
| v0.2    | YYYY-MM-DD | Name   | Updated alternatives + added validation plan |
| v1.0    | YYYY-MM-DD | Name   | Accepted decision                            |

[END SECTION OUTPUT TEMPLATE]

---

## Executive Summary

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Provide an executive-friendly snapshot answering:

* What decision are we making?
* Why now?
* What options were considered?
* What did we choose and why?
* What are the key impacts / risks?
* How will we know early if the decision is working?

Instructions:
Include concise subsections (3-8 bullets each):

1. **Decision Statement (one sentence)**
2. **Problem / Opportunity**
3. **Affected Scope**
4. **Options Considered (short list)**
5. **Chosen Option + Rationale (top drivers)**
6. **Leading Indicators (early signals)**
7. **Success Metrics (outcomes)**
8. **Key Risks / Tradeoffs**
9. **Status + Next Steps**

Formatting guidance:

* Keep it skimmable.
* Avoid deep implementation detail here.
* If unknown, mark **TBD** and add to Open Questions.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Decision Statement**

* We will {chosen architectural approach} for {system/capability} to achieve {business/quality outcome}.

**Problem / Opportunity**

* {What is broken / constrained / needed}
* {Why it matters now}

**Affected Scope**

* In scope: {apps / domains / integrations / environments}
* Out of scope: {explicit exclusions}

**Options Considered**

* Option A: {name}
* Option B: {name}
* Option C (if applicable): {name}

**Chosen Option & Rationale**

* Chosen: {Option name}
* Primary reasons: {3-5 bullets tied to drivers/requirements}

**Leading Indicators (first 30-90 days)**

| Indicator                    | Baseline | Target | Window  | Data Source | Owner  |
| ---------------------------- | -------: | -----: | ------- | ----------- | ------ |
| {e.g., deployment lead time} |      TBD |    TBD | 30 days | {tool}      | {role} |

**Success Metrics (3-12 months)**

| Outcome KPI                   | Baseline | Target | Timeframe | Data Source | Owner  |
| ----------------------------- | -------: | -----: | --------- | ----------- | ------ |
| {e.g., reduced incident rate} |      TBD |    TBD | 6 months  | {tool}      | {role} |

**Key Risks / Tradeoffs**

* {Risk/tradeoff} -> {mitigation/decision guardrail}

**Status / Next Steps**

* Status: {Draft/Proposed/Accepted}
* Next steps: {design spike, pilot, sign-offs, implementation tickets}

[END SECTION OUTPUT TEMPLATE]

---

## Context & Background

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Explain the architectural context so readers understand what exists today, what constraints apply, and what forces make this decision necessary.

Instructions:

* Summarize:

  * Current state architecture relevant to the decision (components + flows)
  * Pain points / triggers (incidents, cost, compliance, scalability limits, timelines)
  * Constraints (enterprise standards, hosting rules, data residency, vendor lock-in rules)
  * Dependencies (upstream/downstream systems)
* Keep it short; link deeper detail elsewhere.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Current State Summary**

* {Current components / platforms involved}
* {Key data flows / integrations}

**Drivers / Triggers**

* {Business driver: time, cost, compliance, reliability}
* {Technical driver: scale, latency, maintainability, resiliency}

**Constraints**

* {Policy / regulatory / platform constraints}
* {Technology standards / allowed stacks / approved vendors}

**Dependencies**

* {External systems, teams, delivery timelines}

[END SECTION OUTPUT TEMPLATE]

---

## Objectives & Decision Success Criteria

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Translate why this decision exists into measurable success criteria, mirroring PRD's outcome-driven framing.

Instructions:

* Define 3-8 objectives as outcomes.
* For each, define success criteria:

  * baseline -> target -> by when
  * how measured and by whom
* Include non-negotiables (e.g., compliance must be met).

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Objectives**

1. {Objective: e.g., improve deployment reliability}
2. {Objective: e.g., reduce integration complexity}
3. {Objective: e.g., meet compliance requirement by date}

**Decision Success Criteria**

| Objective     | Metric / Evidence | Baseline | Target | Timeframe | Data Source | Owner  |
| ------------- | ----------------- | -------: | -----: | --------- | ----------- | ------ |
| {Objective 1} | {Metric}          |      TBD |    TBD | 90 days   | {tool}      | {role} |

**Non-Negotiables**

* {e.g., must meet NERC CIP logging requirements}
* {e.g., must remain within approved cloud/provider}

[END SECTION OUTPUT TEMPLATE]

---

## Scope of Decision

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Clarify what this decision covers and what it explicitly does not cover.

Instructions:

* Define:

  * In scope: systems, subject areas, integrations, environments
  * Out of scope: anything people might assume is included but is not
  * Anti-goals: directions explicitly not intended for this architecture
  * Revisit triggers: what would cause this ADR to be reopened

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**In Scope**

* {e.g., build/run pipeline for ML models}
* {e.g., inference endpoint hosting and scaling pattern}

**Out of Scope**

* {e.g., replacing the system of record}
* {e.g., redesigning upstream data capture}

**Anti-Goals**

* {e.g., "We are not building a general-purpose data lake here."}

**Revisit Triggers**

* {e.g., policy change, cost threshold breach, scale changes by X}

[END SECTION OUTPUT TEMPLATE]

---

## Assumptions & Dependencies

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Make explicit what must be true for the decision to succeed, and what external items could block it.

Instructions:

* Assumptions: conditions believed true but not guaranteed.
* Dependencies: other teams, platforms, vendor deliverables, environments.
* For high-risk assumptions, note contingency.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Assumptions**

* {Assumption} -> {impact if false} -> {contingency}

**Dependencies**

* {Dependency} -> {owner} -> {needed by} -> {risk if delayed}

[END SECTION OUTPUT TEMPLATE]

---

## Options Considered

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Document the options evaluated to show due diligence, tradeoffs, and decision rationale. This should include the standard approach and the deviation approach at minimum.

Instructions:

* Provide an options summary table first.
* Then provide a detailed subsection per option:

  * Description
  * Architecture view (diagram/link)
  * Pros / Cons
  * Impact assessment (security, ops, cost, delivery, maintainability)
  * Technical debt created (Y/N + notes)

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Options Summary**

| Option            | Summary     | Fit to Drivers | Key Pros | Key Cons / Risks | Cost / Complexity (H/M/L) | Tech Debt (Y/N) |
| ----------------- | ----------- | -------------- | -------- | ---------------- | ------------------------- | --------------- |
| Option 1 – {Name} | {1-2 lines} | {High/Med/Low} | {top 2}  | {top 2}          | {H/M/L}                   | {Y/N}           |
| Option 2 – {Name} | {1-2 lines} | {High/Med/Low} | {top 2}  | {top 2}          | {H/M/L}                   | {Y/N}           |
| Option 3 – {Name} | {1-2 lines} | {High/Med/Low} | {top 2}  | {top 2}          | {H/M/L}                   | {Y/N}           |

### Option 1 — {Name}

**Summary**

* {What it is + when it applies}

**Architecture View**

* {Insert diagram or link to diagram}

**Pros**

* {bullets}

**Cons**

* {bullets}

**Operational Considerations**

* Monitoring: {what changes}
* Support: {who supports / on-call implications}
* Runbooks: {new/updated runbooks}

**Security & Compliance Considerations**

* {authn/authz}
* {logging/audit}
* {data classification implications}

**Cost / Delivery Considerations**

* {licensing, runtime costs, delivery timeline}

**Technical Debt**

* Creates tech debt: {Y/N}
* Notes: {what debt and how/when it will be retired}

### Option 2 — {Name}

{Repeat same structure}

### Option 3 — {Name}

{Repeat same structure}

[END SECTION OUTPUT TEMPLATE]

---

## Decision

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
State the chosen option unambiguously and define what decision made means in concrete terms.

Instructions:

* Provide:

  * Decision statement
  * Decision scope boundaries
  * Key architectural rules introduced (guardrails)
  * What is now standard for this capability going forward
  * Effective date and status

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Chosen Option**

* {Option name}

**Decision Statement**

* We will {do X} using {chosen approach} for {scope}, and we will not {explicit exclusion}.

**Architectural Guardrails**

* {Guardrail 1}
* {Guardrail 2}
* {Guardrail 3}

**Effective Date**

* {YYYY-MM-DD}

**Status**

* {Accepted | Proposed | Deprecated | Superseded by ADR-###}

[END SECTION OUTPUT TEMPLATE]

---

## Rationale

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Explain why the chosen option won, grounded in objectives, constraints, and tradeoffs.

Instructions:

* Tie reasons directly to:

  * decision drivers / objectives
  * constraints
  * measured or observed evidence (POCs, benchmarks, prior incidents)
* Avoid vague statements; prefer explicit tradeoffs.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Reasons for Decision**

* {Reason 1 tied to objective/constraint}
* {Reason 2 tied to objective/constraint}
* {Reason 3 tied to objective/constraint}

**Evidence / Inputs**

* {POC results, benchmarks, stakeholder feedback, incident data, policy requirement}

**Tradeoffs Accepted**

* {What we are consciously giving up}
* {Why that tradeoff is acceptable}

[END SECTION OUTPUT TEMPLATE]

---

## Consequences

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Document the real outcomes of the decision: benefits, drawbacks, and what teams must change.

Instructions:

* Include:

  * Positive consequences
  * Negative consequences
  * Migration/transition consequences
  * Technical debt summary (if any)
  * If this fails, what breaks (blast radius)

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Positive Consequences**

* {benefits}

**Negative Consequences**

* {costs / complexity / limitations}

**Migration / Transition Impacts**

* {work required to move from current state}

**Technical Debt Summary**

* Debt created: {Y/N}
* Debt items: {list}
* Retirement plan: {how/when}

**Blast Radius**

* If this decision fails or is rolled back, impacts include: {systems/users/processes}

[END SECTION OUTPUT TEMPLATE]

---

## Release Plan / Phasing

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Define how the decision will be implemented over time to reduce risk (pilot-first, progressive rollout, feature flags, decision gates).

Instructions:

* Provide phases with:

  * Goal
  * Scope/users
  * Key activities
  * Exit criteria / evidence
  * Key risks
* Add explicit scope negotiation rules (what gets traded off).

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Release Approach**

* {pilot-first / phased rollout / feature flags / region-by-region}

| Phase             | Goal   | Scope / Rollout | Key Activities | Exit Criteria | Key Risks | Not Included |
| ----------------- | ------ | --------------- | -------------- | ------------- | --------- | ------------ |
| 0 – Discovery/POC | {goal} | {scope}         | {activities}   | {evidence}    | {risks}   | {deferred}   |
| 1 – Build         | {goal} | {scope}         | {activities}   | {evidence}    | {risks}   | {deferred}   |
| 2 – Pilot         | {goal} | {scope}         | {activities}   | {evidence}    | {risks}   | {deferred}   |
| 3 – GA            | {goal} | {scope}         | {activities}   | {evidence}    | {risks}   | {deferred}   |

**Scope Negotiation Rules**

* {rule(s)}

[END SECTION OUTPUT TEMPLATE]

---

## Risks & Mitigations

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Capture the major risks introduced by this decision and how they will be mitigated.

Instructions:

* Focus on high impact/high likelihood.
* Include security/compliance risks explicitly if applicable.
* Prefer a table format.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

| Risk   | Category            | Likelihood (H/M/L) | Impact (H/M/L) | Mitigation | Contingency | Owner  |
| ------ | ------------------- | ------------------ | -------------- | ---------- | ----------- | ------ |
| {risk} | {tech/ops/security} | H                  | H              | {plan}     | {fallback}  | {role} |

[END SECTION OUTPUT TEMPLATE]

---

## Approvals & Decision Participants

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Make decision governance explicit: who participated, who approved, and whether this decision is an approved deviation from standards.

Instructions:

* Provide:

  * Decision participants list (with roles)
  * Approval / signoff table including technical debt flag
  * If this is a deviation, name the standard being deviated from

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Decision Participants**

* **{Name} ({Role}) — Approved**
* {Name} ({Role})
* {Name} ({Role})

**Approvals / Signoff**

| Architectural Decision    | Approver / Signoff | Description | Date       | Creates Technical Debt (Y/N) |
| ------------------------- | ------------------ | ----------- | ---------- | ---------------------------- |
| {ADR-### / Decision name} | {Name – Role}      | {1-2 lines} | YYYY-MM-DD | {Y/N}                        |

**Standards / Reference Architecture Impact**

* Standard followed: {name/link}
* Deviation from standard: {name/link}
* Exception ticket / waiver reference (if applicable): {ID}

[END SECTION OUTPUT TEMPLATE]

---

## Open Questions / Issues Log

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Track unresolved questions and pending decisions tied to this ADR so nothing critical is missed.

Instructions:

* Provide ID, question, owner, needed-by date, status.
* Promote resolved items into the ADR sections (assumptions, risks, guardrails).

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

| ID   | Question / Issue | Owner       | Needed-by  | Status   |
| ---- | ---------------- | ----------- | ---------- | -------- |
| Q-01 | {question}       | {name/role} | YYYY-MM-DD | OPEN     |
| Q-02 | {question}       | {name/role} | YYYY-MM-DD | ANSWERED |
| Q-03 | {question}       | {name/role} | YYYY-MM-DD | PENDING  |

[END SECTION OUTPUT TEMPLATE]

---

## Supporting Materials

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Provide references, diagrams, and links that support the decision without bloating the main ADR.

Instructions:

* Include:

  * Links to architecture diagrams (C4, UML, sequence diagrams)
  * Benchmark/POC results
  * Policies/standards referenced
  * Related ADRs (supersedes/superseded-by)

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**References**

* {Doc / link}
* {Doc / link}

**Diagrams**

* {Diagram name / link / repo path}

**Related ADRs**

* Supersedes: {ADR-###}
* Superseded by: {ADR-###}

[END SECTION OUTPUT TEMPLATE]
