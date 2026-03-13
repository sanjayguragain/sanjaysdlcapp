# Verification and Validation Methods

Use this file when choosing the most appropriate verification and validation approaches for a technical requirement.

## Default selection rule

- Select exactly one verification approach by default.
- Select exactly one validation approach by default.
- Recommend multiple approaches only if the user explicitly asks for multiple methods or if the output format is intentionally multi-method.

## Verification

Verification confirms that the system meets specified requirements. It answers the question: `Did we build the system right?`

1. Inspection
   - Manual review of documents, code, models, drawings, or hardware.
   - Good for conformance checks against standards or documented requirements.
   - Example: Peer review of system design documents.
2. Demonstration
   - Functional operation under specified conditions.
   - Good when observable behavior matters more than detailed quantitative evidence.
   - Example: Demonstrate that a health check endpoint returns a successful status.
3. Test
   - Quantitative, measurable validation under controlled conditions.
   - Good for performance, reliability, interface, or regression verification.
   - Example: Run load tests to confirm a throughput threshold is met.
4. Analysis
   - Mathematical models, simulations, or structured reasoning used to verify performance.
   - Good when physical testing is impractical or incomplete.
   - Example: Analyze capacity limits against forecast demand.
5. Model-Based Verification
   - Formal modeling and simulation using architecture or systems models.
   - Good for complex interfaces, state behavior, and early lifecycle validation.
   - Example: Validate interface behavior using SysML or MBSE tooling.
6. Automated Verification
   - Scripted or tool-driven checks executed repeatedly.
   - Good for software-intensive systems and standards that benefit from continuous enforcement.
   - Example: Static analysis, policy-as-code checks, or automated compliance tests.

## Validation

Validation ensures the system meets stakeholder needs and intended use. It answers the question: `Did we build the right system?`

1. Operational Testing
   - Realistic end-to-end use in the intended environment.
   - Good when usability, readiness, and real-world fitness matter.
   - Example: Run outage operations against a staging environment with realistic workflows.
2. Simulations and Emulation
   - High-fidelity models or emulators that approximate real-world conditions.
   - Good when production-like validation is needed before full deployment.
   - Example: Simulate grid events to validate control logic behavior.
3. Prototyping
   - Early or partial solutions used to validate concepts or fit.
   - Good when the requirement is still shaping the solution space.
   - Example: Prototype an operator console workflow before full buildout.
4. Stakeholder Review / Walkthroughs
   - Structured reviews with the people accountable for business fit, safety, compliance, or operations.
   - Good when alignment and intent confirmation are the main goal.
   - Example: Walk through an architecture control requirement with platform, security, and operations owners.
5. Field Trials / Pilots
   - Limited deployment in a real operational setting.
   - Good when production-readiness must be tested under controlled risk.
   - Example: Pilot a new monitoring standard in one service domain.
6. Human-in-the-Loop Testing
   - Validation that explicitly includes human judgment, workflow compatibility, or decision support.
   - Good when operator interaction is part of system success.
   - Example: Validate alert-handling requirements with real support engineers in scenario drills.

## Selection Heuristics

- Prefer `Inspection` when the requirement is documentation-, configuration-, or standards-heavy.
- Prefer `Test` or `Automated Verification` when the requirement includes measurable thresholds.
- Prefer `Analysis` when the requirement depends on forecasts, models, or constraints that are hard to test directly.
- Prefer `Stakeholder Review / Walkthroughs` when validation depends on policy, business acceptance, or operational legitimacy.
- Prefer `Operational Testing` or `Field Trials / Pilots` when the requirement must prove fitness in real workflows.
