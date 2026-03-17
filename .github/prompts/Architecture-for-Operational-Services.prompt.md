---
name: "Architecture for Operational Services"
description: Build an Operational Services Considerations document by analyzing this repository, asking clarifying questions, and then completing the provided template.
argument-hint: "Operational context, support model, tooling, handoffs, runbooks, monitoring, access, and links to related artifacts."
agent: agent
model: GPT-5.4
tools: [vscode, execute, read, agent, edit, search, web, todo]
---

Be an Enterprise Architect who is documenting Operational Services Considerations using an Operational Services Considerations Document (OSCD).  Use the OSCD Document Template below to build out the Operational Services Considerations.  Please take the context of what's in this repo and read and understand it.  Then read over the template and then ask me questions until you get enough information and then start filling out the template. 
<Operational Services Considerations DocumentTemplate>



## Operational Readiness & Support Model

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Define the **operational accountability model** for the solution, owned by the **Lead Quality Advisors (LQAs)** assigned from each operational area. This section ensures the solution’s architecture and delivery include everything needed for the solution to be **supportable, maintainable, and operationally ready** in production.

This section is used to:

* ensure **nothing operational is missed** (support model, tooling, handoffs, runbooks, monitoring, access, etc.)
* document operational **use cases** (service processes) that must work end-to-end
* document the **operational model** (how work flows across teams/tools throughout the operational lifecycle)
* clarify LQA accountability and required cross-team engagement (Self-Help, Help Desk, ADM, EUC, Infrastructure)

Instructions:

1. **Define LQA accountability and coverage**

* This section is the accountability of the **Lead Quality Advisors assigned to the solution** from each relevant area.
* For each coverage area, identify the LQA and the required partner organizations they must engage:

  * Business partners for the **Self-Help** experience (knowledge articles, self-service flows)
  * **Help Desk / Service Desk** support teams (Tier 1 intake, triage, routing)
  * **ADM tower leads** (Tier 2/3 application support + engineering escalation)
  * **End User Computing (EUC)** teams (device management, client app distribution, desktop tooling)
  * **Infrastructure/platform teams** (network, identity, hosting, middleware, compute/storage, backup/DR)

2. **Document Operational Use Cases (required)**

* Operational use cases represent the repeatable operational “services” needed to support the solution (e.g., incident response, service requests, access provisioning, change/release, monitoring/alerting, knowledge publishing).
* For each use case, document:

  * **Description** (problem, outcomes, in-scope operational steps)
  * **Architectural Artifacts in Scope** (e.g., APIM configuration, policies, diagnostics, logs, deployment artifacts, identity objects)
  * **Key Steps** (end-to-end process from intake to resolution and operational ownership)
  * **Roles and Responsibilities** (who does what; include handoffs)
  * **Tools and Technologies** (ITSM, monitoring, automation, knowledge platforms, CI/CD)

3. **Document the Operational Model (required)**

* Provide a logical operational model as a **mermaid flowchart** showing how the solution will be supported and maintained in production.
* The operational model must:

  * include **all operational use cases defined above**
  * show **handoff points** between project team and operations teams (e.g., ORR/PRR, KT/runbook acceptance, go-live)
  * show how roles interact across the lifecycle (monitor → incident → problem → change → release → knowledge → optimization)
  * identify major operational tools and components (ITSM, monitoring/observability, CI/CD, knowledge base, on-call/escalation)

Prerequisites:

* Identified **Lead Quality Advisors** for each operational area (or a plan to assign them).
* Named contacts/owners for Help Desk, ADM tower(s), EUC, infrastructure/platform, and business self-help partners.
* Known or proposed operational tooling (ITSM, observability stack, CI/CD, knowledge management tooling).
* A stable-enough architecture baseline to enumerate operational artifacts (APIs, gateways, logging, hosting, identity, etc.).

Standards and Best Practices:

* **ITIL 4** (Incident, Problem, Change Enablement, Service Request, Knowledge Management, Service Transition)
* **SRE practices** (SLIs/SLOs, alerting, incident response, post-incident review)
* **DevOps / Service Transition** (production readiness reviews, runbooks, automated deployments, observability-by-design)
* **Operational Readiness Reviews (ORR/PRR)** and explicit handoff/acceptance criteria to prevent “throw over the wall” go-lives
  [END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]

### Accountability and Coverage

This section is owned by the **Lead Quality Advisors (LQAs)** assigned to the solution across the operational areas below. LQAs are accountable for engaging the required partner teams (Self-Help business partners, Help Desk, ADM tower leads, EUC, and infrastructure teams) to ensure the design includes all capabilities required for production operations.

**Section Owner:** {Name / Role}
**Operational Readiness Objective:** {One or two sentences describing operational readiness intent for this solution.}
**Operational Readiness Review Gate:** {ORR/PRR name(s), if applicable}

**LQA Coverage Matrix**

| Operational Area          | Lead Quality Advisor (LQA) | Self-Help Business Partner(s) | Help Desk Contact(s) | ADM Tower Lead(s) | EUC Contact(s) | Infrastructure / Platform Contact(s) | Notes |
| ------------------------- | -------------------------- | ----------------------------- | -------------------- | ----------------- | -------------- | ------------------------------------ | ----- |
| Self-Help / Knowledge     | {Name}                     | {Name / Team}                 | {Name / Team}        | {Name / Team}     | {Name / Team}  | {Name / Team}                        | {TBD} |
| Help Desk / Service Desk  | {Name}                     | {Name / Team}                 | {Name / Team}        | {Name / Team}     | {Name / Team}  | {Name / Team}                        | {TBD} |
| ADM Tower                 | {Name}                     | {Name / Team}                 | {Name / Team}        | {Name / Team}     | {Name / Team}  | {Name / Team}                        | {TBD} |
| End User Computing (EUC)  | {Name}                     | {Name / Team}                 | {Name / Team}        | {Name / Team}     | {Name / Team}  | {Name / Team}                        | {TBD} |
| Infrastructure / Platform | {Name}                     | {Name / Team}                 | {Name / Team}        | {Name / Team}     | {Name / Team}  | {Name / Team}                        | {TBD} |

---

## Use Cases

### Use Case Catalog

| ID    | Use Case Name   | Primary Operational Owner | LQA Owner | Trigger         | Expected Outcomes |
| ----- | --------------- | ------------------------- | --------- | --------------- | ----------------- |
| UC-01 | {Use Case Name} | {Team / Role}             | {Name}    | {Trigger event} | {Outcomes}        |
| UC-02 | {Use Case Name} | {Team / Role}             | {Name}    | {Trigger event} | {Outcomes}        |
| UC-03 | {Use Case Name} | {Team / Role}             | {Name}    | {Trigger event} | {Outcomes}        |

---

### UC-01 — {Use Case Name}

* **Description:** {A brief description of the Operational Service / Use Case, including the business problem it addresses and the expected outcomes. This should also include the steps in the operational process that are in scope for this use case.}
* **Architectural Artifacts in Scope:**

  * {Artifact 1 (e.g., APIM instance, API, policy, product/subscription)}
  * {Artifact 2 (e.g., backend service, config, deployment artifact)}
  * {Artifact 3 (e.g., diagnostics settings, log destinations, dashboards)}
* **Key Steps:**

  1. {Intake / Trigger}
  2. {Triage / Validation}
  3. {Routing / Escalation}
  4. {Resolution / Fulfillment}
  5. {Verification / Closure}
  6. {Knowledge update / Follow-up actions (if applicable)}
* **Roles and Responsibilities:**

  | Role                              | Responsibilities   |
  | --------------------------------- | ------------------ |
  | Solution Architect                | {Responsibilities} |
  | Lead Quality Advisor              | {Responsibilities} |
  | Help Desk                         | {Responsibilities} |
  | ADM Tower Lead(s)                 | {Responsibilities} |
  | End User Computing (EUC)          | {Responsibilities} |
  | Infrastructure / Platform Team(s) | {Responsibilities} |
* **Tools and Technologies:**

  * {ITSM / ticketing tool}
  * {Monitoring / observability tools}
  * {Automation / scripting tools}
  * {Knowledge base / self-help platform}
  * {CI/CD toolchain (if applicable)}

---

### UC-02 — {Use Case Name}

* **Description:** {…}
* **Architectural Artifacts in Scope:**

  * {…}
* **Key Steps:**

  1. {…}
* **Roles and Responsibilities:**

  | Role   | Responsibilities   |
  | ------ | ------------------ |
  | {Role} | {Responsibilities} |
* **Tools and Technologies:**

  * {…}

---

### UC-03 — {Use Case Name}

* **Description:** {…}
* **Architectural Artifacts in Scope:**

  * {…}
* **Key Steps:**

  1. {…}
* **Roles and Responsibilities:**

  | Role   | Responsibilities   |
  | ------ | ------------------ |
  | {Role} | {Responsibilities} |
* **Tools and Technologies:**

  * {…}

---

## Operational Model

```mermaid
flowchart TD

  %% -------------------------
  %% Project → Operations Handoff (Readiness Gate)
  %% -------------------------
  PJ[Project Team] --> ORR{Operational Readiness Review (ORR/PRR)}
  ORR -->|Pass| OPS[Operations Teams Assume Ownership]
  ORR -->|Gaps Identified| PJ

  %% -------------------------
  %% Operational Use Case Entry Points
  %% -------------------------
  MON[Monitoring / Observability Tool] -->|Alert| UC01_INTAKE
  USER[End User / Business Partner] -->|Request| UC02_INTAKE
  ENG[Engineering / Product] -->|Planned Change| UC03_INTAKE

  %% -------------------------
  %% UC-01 (Incident / Break-Fix)
  %% -------------------------
  subgraph UC01["UC-01 — {Use Case Name}"]
    UC01_INTAKE[Help Desk / NOC Intake] --> ITSM1[ITSM Ticket Created/Updated]
    ITSM1 --> TRIAGE1[Triage + Validation]
    TRIAGE1 -->|App Issue| ADM1[ADM Tower Lead / Tier 2-3 Support]
    TRIAGE1 -->|Infra Issue| INF1[Infrastructure / Platform Team]
    ADM1 --> FIX1[Implement Fix / Restore Service]
    INF1 --> FIX1
    FIX1 --> VERIFY1[Validate + Close Ticket]
    VERIFY1 --> KB1[Update Self-Help / Knowledge (if applicable)]
    KB1 --> PIR1[Post-Incident Review / Problem Follow-up]
  end

  %% -------------------------
  %% UC-02 (Service Request / Provisioning / EUC)
  %% -------------------------
  subgraph UC02["UC-02 — {Use Case Name}"]
    UC02_INTAKE[ITSM Service Request Intake] --> VALID2[LQA Validation + Requirements Check]
    VALID2 --> ROUTE2[Route to Correct Fulfillment Team]
    ROUTE2 --> EUC2[End User Computing Fulfillment]
    ROUTE2 --> INF2[Infrastructure / Platform Provisioning]
    ROUTE2 --> ADM2[ADM Config / Enablement]
    EUC2 --> COMPLETE2[Request Completed + User Confirmed]
    INF2 --> COMPLETE2
    ADM2 --> COMPLETE2
    COMPLETE2 --> KB2[Update Self-Help / Knowledge (if applicable)]
  end

  %% -------------------------
  %% UC-03 (Change / Release Management)
  %% -------------------------
  subgraph UC03["UC-03 — {Use Case Name}"]
    UC03_INTAKE[Change Initiation] --> CRQ[Change Record Created in ITSM]
    CRQ --> APPROVAL{CAB / Approval}
    APPROVAL -->|Approved| CICD[CI/CD Deploy or Release Execution]
    CICD --> VERIFY3[Post-Deploy Validation + Monitoring Checks]
    VERIFY3 --> CLOSE3[Close Change]
    APPROVAL -->|Rejected/Deferred| BACKLOG[Return to Backlog / Re-plan]
  end

  %% -------------------------
  %% Cross-Use Case Interactions
  %% -------------------------
  PIR1 --> CRQ
  CLOSE3 --> MON
  KB1 --> USER
  KB2 --> USER
```

**Operational Handoff Points**

* **Project → Operations Acceptance:** {Define acceptance criteria and required artifacts (runbooks, monitoring, support routing, KT completion, etc.).}
* **Help Desk → Tier 2/3 Escalation:** {Define escalation criteria and routing rules.}
* **ADM / Infra → Closure:** {Define validation requirements and closure responsibilities.}
* **Change Approval Gate:** {Define who approves and what evidence is required.}

[END SECTION OUTPUT TEMPLATE]
