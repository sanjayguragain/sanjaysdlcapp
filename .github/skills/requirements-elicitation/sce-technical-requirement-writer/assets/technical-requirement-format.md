# Technical Requirement Format

Use this file as the canonical output structure for the skill.

Update this format file when you want to change the layout, headings, naming pattern, or level of detail. The skill should follow this file rather than improvising its own structure.

This file is the render template only. Keep method catalogs, authoring notes, and long-form guidance in reference files rather than in this output contract.

## Requirement ID

`<PRODUCT>-REQ-<PARENT>-<SEQUENCE>`

If no ID convention is provided in the prompt, write `TBD`.

## Requirement Statement

The `<system, platform, component, or service>` `<shall | should | will>` `<required capability, behavior, or constraint>` while `<operating context, measurable condition, or boundary>`.

Use modal verbs with this rule only:

- `shall` for mandatory requirements
- `should` for goals or target-state guidance
- `will` for facts, declarations of purpose, or committed future behavior

Do not mix `shall`, `should`, and `will` within the same requirement statement.

## BRD Traceability

- BRD Requirement ID: `<governing BRD requirement identifier or TBD>`
- BRD Requirement Text: `<governing BRD requirement statement or TBD>`
- Trace Type: `<direct | derived_from | not_provided>`
- Trace Rationale: `<why this technical requirement is justified by the BRD requirement or why the trace is missing>`

If the caller requires BRD traceability and no governing BRD requirement is available, do not invent one. Record the gap explicitly.

## Requirement Context

- System / Scope: `<system or boundary>`
- Source / Reference: `<document, note, conversation, or file>`
- Dependencies: `<known dependencies or None provided>`

## Quality Classification

- Primary Attribute: `<Availability | Reliability | Performance | Security | Usability | Modularity | Extensibility | Simplicity | Testability | Interoperability | Agility | Scalability | Adaptability | Elasticity | Deployability | Feasibility>`
- Secondary Attributes: `<comma-separated list or None>`
- Quality Category: `<Operational Qualities | Structural Qualities | Evolution Qualities | Program / Delivery Qualities>`
- Labels: `<qattr:attribute, qcat:category, source:brd|source:other, type:direct|type:derived>`

## Measure and Boundary

- Measure / Threshold: `<measurable target, service level, limit, or TBD>`
- Operating Boundary: `<environment, trigger condition, scale assumption, or None provided>`

## Quality Scenario

- Scenario: `<quality attribute name>`
- Stimulus: `<triggering event, change, failure, or workload condition>`
- Environment: `<normal, degraded, peak, deployment, recovery, or other context>`
- Response: `<expected system or delivery behavior>`
- Response Measure: `<measurable success threshold, timing, accuracy, or capacity target>`

## Applicable Standards and Constraints

- Standards / Policies: `<governing standard, policy, architecture rule, or None provided>`
- Constraints: `<known constraints or None provided>`

## Recommended Verification Approach

- `<one verification type from the approved list>` - `<one-sentence activity that confirms we built the system right>`

Select exactly one verification approach unless the user explicitly asks for more than one.

## Recommended Validation Approach

- `<one validation type from the approved list>` - `<one-sentence activity that confirms we built the right system>`

Select exactly one validation approach unless the user explicitly asks for more than one.

## Open Questions

- `<missing fact, ambiguity, or dependency>`
