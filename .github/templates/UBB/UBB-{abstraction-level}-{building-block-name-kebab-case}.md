# Universal Building Block Profile

## Document Information

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Record the identity, classification, ownership, and references for the building block so readers know what is being described and how to place it in the enterprise architecture landscape.

Instructions:

- Include:
  - **UBB Name**
  - **Abstraction Level** (`ABB` or `SBB`)
  - **Category** (`Business`, `Data`, `Application`, `Technology`, or a valid combination)
  - **Status** (`Draft`, `Proposed`, `Approved`, `Deprecated`, `Superseded`)
  - **Owner**
  - **Authors / Contributors**
  - **Date Created** and **Last Updated**
  - **Related standards / references / architecture artifacts**
- Keep this section compact.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**UBB Name:** {Building block name}
**Abstraction Level:** {ABB | SBB}
**Category:** {Business | Data | Application | Technology | combination}
**Status:** {Draft | Proposed | Approved | Deprecated | Superseded}
**Owner:** {Name / Role}
**Author(s):** {Name(s)}
**Date Created:** {YYYY-MM-DD}
**Last Updated:** {YYYY-MM-DD}
**Related References:** {standards, ADRs, diagrams, artifacts, links}

[END SECTION OUTPUT TEMPLATE]

---

## Name & Definition

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Define the building block in one clear, enterprise-usable statement.

Instructions:

- Provide a concise definition.
- If this is an SBB, identify the specific product, platform, or implementation choice.
- If this is an ABB, describe the reusable capability or architecture pattern.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Definition**

- {Clear definition of the building block}

[END SECTION OUTPUT TEMPLATE]

---

## Purpose & Typical Use Cases

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Explain why this building block exists and where it delivers value.

Instructions:

- List the primary purpose.
- Provide 3 to 6 typical use cases.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Purpose**

- {Primary purpose}

**Typical Use Cases**

- {Use case 1}
- {Use case 2}
- {Use case 3}

[END SECTION OUTPUT TEMPLATE]

---

## Scope & Boundaries

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Clarify what is in scope and out of scope so the profile does not imply more than it actually covers.

Instructions:

- Provide explicit in-scope and out-of-scope statements.
- If relevant, add anti-goals or misuse patterns.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**In Scope**

- {In-scope capability, component, or concern}

**Out of Scope**

- {Explicit exclusion}

**Anti-Goals**

- {What this building block should not be used for}

[END SECTION OUTPUT TEMPLATE]

---

## Inputs & Outputs

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Show what the building block consumes and what it produces.

Instructions:

- Keep the list practical and implementation-aware.
- Include interfaces, data, artifacts, or control signals where relevant.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Inputs**

- {Input 1}
- {Input 2}

**Outputs**

- {Output 1}
- {Output 2}

[END SECTION OUTPUT TEMPLATE]

---

## Relationships & Dependencies

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Position the building block within the wider architecture and dependency chain.

Instructions:

- Note major dependencies.
- Note systems, domains, or capabilities this block supports.
- Include upstream/downstream relationships where helpful.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Depends On**

- {Dependency}

**Supports**

- {Capability, system, or team enabled}

**Integrates With**

- {Related platform, standard, or interface}

[END SECTION OUTPUT TEMPLATE]

---

## Examples & Variants

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Ground the building block in concrete examples without confusing those examples for the whole concept.

Instructions:

- Include known variants, example products, or enterprise examples.
- If this is an ABB, list representative SBB implementations where relevant.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Examples**

- {Example 1}
- {Example 2}

**Variants / Alternatives**

- {Variant or alternative 1}
- {Variant or alternative 2}

[END SECTION OUTPUT TEMPLATE]

---

## Selection Guidance

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Help architects and delivery teams decide when to use the building block and when not to.

Instructions:

- Include when to use, when to avoid, and key tradeoffs.
- Keep the guidance decision-oriented.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Use When**

- {Recommended condition}

**Avoid When**

- {Condition where this is a poor fit}

**Key Tradeoffs**

- {Tradeoff 1}
- {Tradeoff 2}

[END SECTION OUTPUT TEMPLATE]

---

## Compliance & Standards

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Connect the building block to enterprise standards, external standards, and regulatory concerns.

Instructions:

- Include standards, protocols, policies, and compliance implications where relevant.
- If none are known, write `TBD` rather than omitting the section.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Standards & Protocols**

- {Standard, protocol, or policy}

**Compliance Considerations**

- {Compliance or governance implication}

[END SECTION OUTPUT TEMPLATE]

---

## Slide Layout Recommendation

[SECTION INSTRUCTIONS — DO NOT OUTPUT]
Purpose:
Provide a practical one-slide layout recommendation for executive or architecture-review presentations.

Instructions:

- Keep the advice short.
- Use top, middle, and bottom layout guidance when helpful.

[END SECTION INSTRUCTIONS]

[SECTION OUTPUT TEMPLATE]
**Slide Layout Recommendation**

- **Top:** {title, classification, visual anchor}
- **Middle:** {purpose, scope, and relationships}
- **Bottom:** {selection guidance, examples, standards, or decision checklist}

[END SECTION OUTPUT TEMPLATE]
