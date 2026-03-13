# Cybersecurity Administrative Standard (v10) — Reference

**Purpose:** A condensed, implementer-friendly reference derived from the provided *Cybersecurity Administrative Standard v10* text. This is not a replacement for the controlled standard; it highlights common “must” requirements and the evidence/artifacts teams typically need.

## Document metadata (from source)

- **Version:** 10
- **Effective date:** Not set
- **Supersedes:** v9 Cybersecurity Administrative Standard (effective: January 30, 2026)
- **Key contact:** CybersecurityPolicy@sce.com
- **Scope note:** “Printed copies are uncontrolled; the controlled version on the Company portal prevails.”

## Applicability (who/what is in scope)

- Applies to **Company Information Systems** used to conduct Company business and **not included in Grid and Control Systems**.
- Applies to systems **owned/operated/leased by the Company** and to those **hosted/managed/operated by third parties**.
- New/existing systems in **Planning/Analysis/Design** must be built to comply; procurement artifacts (**RFP/RFI, SOW, contracts**) must include requirements; in-production systems must be assessed and **gaps reported** to Cybersecurity.

## “What you need to have” (typical artifacts/evidence)

- **Business Impact Analysis (BIA)** covering criticality, critical services, dependencies, and RTOs.
- **Risk Management Strategy** + procedures for tracking and making risk decisions.
- **Risk Register** and (where used) a **Threat Register**.
- **Vulnerability Management Plan** (scanning procedures, timing, remediation tracking).
- **Incident Response Plan (IRP)**, **Incident Recovery Plan**, **BCP/DRP**, and evidence of annual reviews/tests.
- **RACI** (e.g., for monitoring/vulnerability detection, lifecycle management).
- **Baseline configuration standards** and change/configuration control records.

---

# 3. GOVERN — risk governance & supply chain

## Organizational context

- Maintain understanding of mission/stakeholders and **legal/regulatory/contractual** requirements.
- Communicate priorities and business justification for mitigations.

## Risk management strategy

- Document **risk appetite/tolerance**, decision process, stakeholder engagement, and tracking.
- Use standardized **risk calculation** methods/templates and criteria for prioritization.
- Establish communication lines for cybersecurity risk reporting across departments.

## Roles, responsibilities, and policy

- Define roles/authorities (including line of succession); review/update periodically.
- Maintain a policy that is approved by senior management, communicated, and acknowledged (on hire, annually, and upon updates).

## Cybersecurity supply chain risk management (SCRM)

- Maintain a **Supply Chain Cybersecurity Risk Management Plan** describing engagement, tracking, decision-making, and roles.
- Integrate supply chain risk management into **procurements/projects**.
- Require vendors/providers to maintain appropriate plans/policies (e.g., security plan, data protection policy) and include cybersecurity terms in contracts.
- Include suppliers in incident planning/testing where relevant; ensure offboarding/termination of supplier access is timely.

---

# 4. IDENTIFY — assets, risk, vulnerabilities

## Asset management & inventories

- Maintain comprehensive **hardware** and **software/service/system/license** inventories in a CMDB (and keep updated through lifecycle; at least annually).
- Maintain system **architecture and data flow** documentation; review/approve internal/external interconnections at least annually.
- Maintain inventories and criticality ratings for external systems/providers; implement tagging strategy for virtual resources.
- Maintain a **data inventory** for designated data types (classification tags/labels; provenance/owner/geolocation).

## Risk assessment & vulnerability management

- Implement a process to identify/assess/remediate/track vulnerabilities across in-scope assets.
- Perform vulnerability assessments **before production** and **at least annually**, and when applicable Critical/High vulnerabilities are identified.
- Track remediation to closure and incorporate scan/pen test results into risk management.
- Maintain subscriptions/intel sources for vulnerability notifications and document investigations/actions.

## Improvement

- Run lessons-learned, metrics, and testing/exercise programs; review IR strategy annually (or after incidents).
- Maintain and annually test response/recovery plans; document results and feed improvements back.

---

# 5. PROTECT — identity, data security, platform security

## Identity management / authentication / access control

- Maintain documented identity access procedures (provision/modify/terminate, approvals, training validation, audits, annual revalidation).
- Ensure unique identification of users/services/devices; require sponsor authorization to register accounts.
- **Remote access requires MFA**; avoid insecure MFA methods such as **SMS**.
- Enforce lockout/mitigations for consecutive failed logons; display standard system-use banner before access.
- External connectivity authentication must occur only after establishing a secure session through **approved VPN or VDI** (no direct internet exposure paths).

### Authorization / account hygiene highlights

- Accounts must be automatically disabled within **24 hours** if they have no owner, are unused within **90 days**, or belong to terminated users.
- Temporary accounts must have an expiration date and be disabled immediately upon expiration.
- Accounts must be locked out after **five (5)** failed log-in attempts within a **24-hour** period; locked accounts remain locked until identity is re-verified.
- Multiple concurrent sessions for users are not allowed.
- SaaS applications that connect to Company Information Systems or store Confidential Company Information must use the Company’s approved **SSO** solution (e.g., Okta or Microsoft Entra ID); if not feasible, a formal risk review and approved compensating measures are required until SSO is implemented.

### Password and authentication highlights

- Prefer long passphrases; enforce password rules.
- **Minimum 15-character passwords** (or maximum technically feasible length/complexity).
- Require password changes at least **annually**.
- Complexity: at least **uppercase + lowercase + special character** (and other requirements when passphrases are not feasible).
- Prevent username/first/last name inclusion; prohibit reuse of last **24** passwords.
- Use cryptographically protected password transmission (where feasible) and approved hash+salt storage (where feasible) or compensating controls.

### Privileged access highlights

- Privileged accounts must have a Company employee owner, documented business purpose, and be reviewed at least annually.
- Use MFA for privileged actions; restrict privileged accounts to approved devices/job roles.
- Prefer dedicated/admin devices on isolated segments for privileged tasks.
- Shared privileged passwords must change immediately upon membership changes.
- Privileged credentials must be created/stored/rotated/retrieved via approved enterprise credential management; break-glass credentials stored there and **tested quarterly**.
- Where feasible, broker privileged access through vault proxy services (e.g., SSH/RDP proxies) for auditing/session monitoring.

## Data security

- Document and implement controls for:
  - **Data at rest:** encryption and key management; removable media control/scanning/sanitization; integrity verification.
  - **Data in transit:** encryption across less trusted zones; certificate lifecycle management.
  - **Data in use:** prevent/monitor Sensitive Data exposure; unauthorized exfiltration monitoring; DLP where appropriate.
- **Sensitive Data input into online data fields (including generative AI fields) is prohibited.**

## Backups

- Implement backup/restore procedures, restrict access, test recoverability, and use equivalent controls at alternate storage sites.

## Platform security

- Maintain baseline configurations and an approval/review/update process (at least annually or when changes occur).
- Remove/disable unnecessary capabilities, ports, protocols, and services.
- Keep software/OS/firmware up to date via a documented schedule.
- Implement logging configuration/review procedures; aggregate logs; protect audit logs; use a reliable time source.
- Prevent unauthorized software execution and restrict installation to approved sources.

## Resilience / network security

- Implement segmented environments (dev/stage/UAT/prod) and strong controls between them.
- Avoid using production data in testing; separate testing databases from production.
- Deny-by-default network traffic; allow by exception and review allowed communications at least quarterly.
- Strong encryption for wireless integrity; document and govern remote access types/config.

---

# 6. DETECT — monitoring & analysis

- Monitor networks, remote access, endpoints/antivirus, and unauthorized device additions.
- Maintain procedures for detecting/resolving/reporting security/network/operational events.
- Correlate physical and cyber events where applicable.
- Review audit records at least **weekly** for indicators of compromise.
- Maintain incident alert thresholds and criteria for incident declaration.

---

# 7. RESPOND — incident management, analysis, comms

- Maintain procedures for initiating IRP and updating it for new threats/vulnerabilities.
- Triage/investigate suspected events; include inbound/outbound firewall event analysis procedures.
- Categorize and prioritize incidents, integrate severity with recovery time objectives.
- Preserve forensic data; require responders to record actions and keep records immutable.
- Define internal/external notification and information sharing processes, including sanctions for improper sharing.

---

# 8. RECOVER — restoration & communications

- Maintain recovery plans and procedures; validate integrity of backups/restoration assets before use.
- Restore essential services in appropriate order (based on BIA/system categorization) and monitor performance.
- Prepare after-action reports and formally declare end of recovery based on defined criteria.
- Maintain communications plans for stakeholders; define processes for public updates/notifications when required.

---

## Notes / open items in source text

- The source includes inline comments/questions (e.g., [LB1], [LB2]) indicating areas where more prescriptive guidance might be needed.

## Key contacts

- Cybersecurity Policy Team: CybersecurityPolicy@sce.com
