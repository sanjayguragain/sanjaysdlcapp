# Rule Elicitation Techniques

## Overview

Business rules are often implicit, embedded in processes, or scattered across documents. These techniques help systematically discover and extract rules from various sources.

## Interview-Based Techniques

### Rule Discovery Questions

```yaml
discovery_questions:
  constraints:
    - "What must always be true for this to be valid?"
    - "What conditions would make this invalid or rejected?"
    - "Are there any limits or boundaries that apply?"
    - "What must happen before X can occur?"
    - "What would prevent this from being approved?"

  calculations:
    - "How is [value] calculated?"
    - "What formula determines [result]?"
    - "What inputs are needed to compute [output]?"
    - "Does the calculation change based on conditions?"

  authorizations:
    - "Who has the authority to approve this?"
    - "What permissions are required?"
    - "Are there different approval levels?"
    - "Can this authority be delegated?"

  triggers:
    - "What causes this to happen?"
    - "What events initiate this process?"
    - "Are there time-based triggers?"
    - "What happens after [event]?"

  exceptions:
    - "Are there any special cases?"
    - "What happens if conditions aren't met?"
    - "Can this rule be overridden? By whom?"
    - "What are the edge cases?"
```

### The "What If" Technique

Explore boundaries by asking hypothetical questions:

```yaml
what_if_technique:
  purpose: "Discover implicit rules by testing boundaries"

  patterns:
    boundary_testing:
      - "What if the amount is exactly $1,000?"
      - "What if the date is on a weekend?"
      - "What if the customer is from a different country?"

    extreme_cases:
      - "What if they order 10,000 items?"
      - "What if they've been a customer for 20 years?"
      - "What if they have zero balance?"

    missing_data:
      - "What if we don't have their address?"
      - "What if the approval wasn't obtained?"
      - "What if the record doesn't exist?"

    timing:
      - "What if this happens after midnight?"
      - "What if it's submitted on a holiday?"
      - "What if the deadline has passed?"
```

### Rule Archaeology

Dig for rules embedded in existing processes:

```yaml
rule_archaeology:
  questions:
    - "Why do you do it that way?"
    - "Has it always been done this way?"
    - "What would happen if you didn't do that step?"
    - "Who decided this should work this way?"
    - "Is there documentation for this rule?"

  follow_ups:
    - "When was this rule established?"
    - "Has anyone tried to change it?"
    - "Are there workarounds people use?"
```

## Document-Based Techniques

### Document Analysis Markers

Look for these indicators in existing documents:

```yaml
document_markers:
  must_words:
    terms: ["must", "shall", "required", "mandatory", "always"]
    meaning: "Indicates constraint rules"

  prohibition_words:
    terms: ["must not", "cannot", "prohibited", "forbidden", "never"]
    meaning: "Indicates negative constraints"

  condition_words:
    terms: ["if", "when", "unless", "except", "provided that", "where"]
    meaning: "Indicates conditional rules"

  calculation_words:
    terms: ["equals", "calculated as", "derived from", "sum of", "percentage of"]
    meaning: "Indicates derivation rules"

  authorization_words:
    terms: ["approved by", "authorized", "permission", "role", "only"]
    meaning: "Indicates authorization rules"

  sequence_words:
    terms: ["before", "after", "then", "first", "subsequently"]
    meaning: "Indicates temporal constraints"
```

### Source Document Types

```yaml
document_sources:
  high_value:
    - type: "Policy manuals"
      content: "Explicit business policies"
      example: "Expense policy, HR handbook"

    - type: "Regulatory documents"
      content: "Compliance requirements"
      example: "GDPR guidelines, SOX requirements"

    - type: "Contracts and SLAs"
      content: "Binding obligations"
      example: "Customer contracts, vendor agreements"

    - type: "Process documentation"
      content: "Embedded workflow rules"
      example: "SOPs, workflow diagrams"

  medium_value:
    - type: "Exception logs"
      content: "Rules that were violated"
      example: "Support tickets, audit findings"

    - type: "Training materials"
      content: "Taught behaviors"
      example: "Onboarding docs, training slides"

    - type: "System documentation"
      content: "Implemented rules"
      example: "Business logic specs, validation rules"

  low_value_but_useful:
    - type: "Email archives"
      content: "Ad-hoc decisions"
      example: "Management approvals, clarifications"

    - type: "Meeting notes"
      content: "Undocumented decisions"
      example: "Steering committee minutes"
```

## Observation Techniques

### Process Shadowing

Observe work being performed to discover implicit rules:

```yaml
shadowing_technique:
  approach:
    1: "Watch the process being performed"
    2: "Note every decision point"
    3: "Ask 'why' at each decision"
    4: "Document the implicit rules discovered"

  focus_areas:
    - "Where do people pause to think?"
    - "What do they check before proceeding?"
    - "When do they escalate or ask for help?"
    - "What shortcuts do experienced workers take?"
    - "What mistakes do new workers make?"

  questions_during:
    - "How did you know to do that?"
    - "What if that condition wasn't true?"
    - "Is that always the case?"
```

### Exception Logging

```yaml
exception_analysis:
  purpose: "Rules are often discovered when they're broken"

  technique:
    1: "Review exception/error logs"
    2: "Identify patterns in failures"
    3: "Extract the rule that was violated"
    4: "Validate rule with stakeholders"

  example:
    observation: "15 orders rejected last month for 'insufficient approval'"
    discovery: "Orders over $10,000 require manager approval"
    follow_up: "Is this documented? Who can approve?"
```

## Collaborative Techniques

### Rule Brainstorming Session

```yaml
brainstorming_format:
  participants:
    - "Domain experts"
    - "Process owners"
    - "Front-line workers"
    - "Compliance/legal (optional)"

  structure:
    warm_up: "10 min - Review domain and scope"
    individual: "10 min - Silent brainstorming on sticky notes"
    sharing: "20 min - Share and group rules"
    discussion: "30 min - Clarify and refine"
    prioritization: "20 min - Rank by importance"

  prompts:
    - "What must always be true in our [domain]?"
    - "What are the most important rules new hires learn?"
    - "What rules cause the most confusion?"
    - "What rules are we most afraid of breaking?"
```

### Role-Based Elicitation

```yaml
role_based_approach:
  purpose: "Different roles know different rules"

  role_perspectives:
    operations:
      knows: "Day-to-day procedural rules"
      questions: "What rules do you enforce every day?"

    management:
      knows: "Approval and authorization rules"
      questions: "What needs your approval and why?"

    compliance:
      knows: "Regulatory and policy rules"
      questions: "What external rules must we follow?"

    finance:
      knows: "Calculation and financial rules"
      questions: "How are financial amounts determined?"

    it_systems:
      knows: "Implemented validation rules"
      questions: "What does the system enforce?"
```

## Validation Techniques

### Rule Confirmation

```yaml
confirmation_approaches:
  direct_validation:
    - "I understand the rule is [X]. Is that correct?"
    - "Can you give me an example where this rule applies?"
    - "Can you give me an example where it doesn't apply?"

  boundary_testing:
    - "Does this apply when [edge case]?"
    - "What's the exact threshold?"
    - "Is the boundary inclusive or exclusive?"

  authority_validation:
    - "Who decided this should be the rule?"
    - "Is this documented somewhere?"
    - "When was this rule last reviewed?"
```

### Rule Stress Testing

```yaml
stress_testing:
  technique: "Present extreme scenarios to validate rule completeness"

  scenarios:
    - "What if both conditions are true?"
    - "What if neither condition is true?"
    - "What if this happens twice in the same day?"
    - "What if the approver is unavailable?"
    - "What if the value is zero?"
    - "What if the system is down?"
```

## Documentation Techniques

### Structured Rule Capture

```yaml
rule_capture_template:
  session_info:
    date: "{date}"
    participants: ["{names}"]
    domain: "{area covered}"

  rules_discovered:
    - rule_id: "BR-{domain}-{number}"
      statement: "{clear rule statement}"
      source: "{person or document}"
      type: "constraint | derivation | inference | action"
      confidence: "high | medium | low"
      needs_validation: true | false
      notes: "{additional context}"
```

### Traceability Matrix

```yaml
traceability:
  rule_to_source:
    BR-001:
      primary: "Policy Manual v3.2, Section 4.1"
      stakeholder: "Jane Smith, Compliance Manager"
      validated: "2025-12-15"

    BR-002:
      primary: "Customer Contract Template, Clause 7"
      stakeholder: "Legal Team"
      validated: "2025-12-16"
```

---

**Last Updated:** 2025-12-26
