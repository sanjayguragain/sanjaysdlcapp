# Rule Conflict Resolution

## Overview

Business rules can conflict when they address the same situation with different outcomes. This guide covers detecting, classifying, and resolving rule conflicts.

## Types of Conflicts

### 1. Direct Contradiction

Rules that produce mutually exclusive outcomes:

```yaml
direct_contradiction:
  definition: "Two rules with overlapping conditions but opposite actions"

  example:
    rule_a: "Orders over $1,000 require manager approval"
    rule_b: "VIP customer orders are auto-approved"
    conflict: "VIP customer order over $1,000 - approve or require approval?"

  indicators:
    - "Both rules can fire simultaneously"
    - "Actions cannot both be taken"
    - "No explicit priority between rules"
```

### 2. Subsumption Conflict

One rule is a special case of another:

```yaml
subsumption:
  definition: "A specific rule overlaps with a general rule"

  example:
    general: "All orders ship within 5 business days"
    specific: "Express orders ship within 1 business day"
    issue: "Is express within 5 days sufficient, or must it be 1 day?"

  indicators:
    - "One rule's conditions are a subset of another's"
    - "Different specificity levels"
    - "Unclear which takes precedence"
```

### 3. Redundancy

Multiple rules produce the same outcome:

```yaml
redundancy:
  definition: "Rules that fire together but have same action"

  example:
    rule_a: "New customers get 10% discount"
    rule_b: "First-time orders get 10% discount"
    issue: "Duplicate logic, maintenance burden"

  indicators:
    - "Same action from different rules"
    - "Overlapping condition sets"
    - "Possible maintenance divergence"
```

### 4. Circular Dependency

Rules that reference each other:

```yaml
circular_dependency:
  definition: "Rule A depends on Rule B which depends on Rule A"

  example:
    rule_a: "Premium status requires 10 orders"
    rule_b: "Premium customers get 10% discount"
    rule_c: "10% discount applies after Premium status confirmed"
    issue: "When exactly does Premium status begin?"

  indicators:
    - "Rules reference each other's outcomes"
    - "Temporal ambiguity"
    - "Order of evaluation matters"
```

### 5. Gap (Missing Rule)

No rule covers a valid scenario:

```yaml
gap:
  definition: "A valid condition combination has no rule"

  example:
    rules:
      - "VIP customers get 20% discount"
      - "New customers get 10% discount"
    gap: "What discount do returning non-VIP customers get?"

  indicators:
    - "Scenario not covered"
    - "System fails or uses unexpected default"
    - "Stakeholders surprised by behavior"
```

## Detection Techniques

### Decision Table Analysis

```yaml
decision_table_detection:
  technique: "Convert rules to decision table, look for issues"

  conflict_indicators:
    same_conditions_different_actions: "Direct contradiction"
    overlapping_conditions: "Potential subsumption"
    missing_rule_column: "Gap"
    duplicate_rule_columns: "Redundancy"

  example_table:
    analysis: |
      ┌──────────────┬───────┬───────┬───────┐
      │ CONDITIONS   │  R1   │  R2   │  ???  │
      ├──────────────┼───────┼───────┼───────┤
      │ VIP?         │   Y   │   N   │   N   │
      │ Order>$1000? │   Y   │   Y   │   N   │
      ├──────────────┼───────┼───────┼───────┤
      │ ACTIONS      │       │       │       │
      ├──────────────┼───────┼───────┼───────┤
      │ Auto-approve │   X   │       │   ?   │ ← Gap!
      │ Mgr approval │       │   X   │       │
      └──────────────┴───────┴───────┴───────┘
```

### Pairwise Comparison

```yaml
pairwise_comparison:
  technique: "Compare each rule pair for conflicts"

  process:
    1: "List all rules"
    2: "For each pair (A, B):"
    3: "  - Can conditions overlap?"
    4: "  - If yes, do actions conflict?"
    5: "  - If yes, is priority clear?"
    6: "Document conflicts found"

  matrix_format:
    rows: "Rule IDs"
    columns: "Rule IDs"
    cells: "C (conflict) / S (subsumes) / R (redundant) / - (no issue)"
```

### Scenario Testing

```yaml
scenario_testing:
  technique: "Create test scenarios, check for conflicts"

  process:
    1: "Generate representative scenarios"
    2: "Identify which rules fire for each scenario"
    3: "Check for multiple rules with conflicting actions"
    4: "Document ambiguous scenarios"

  scenario_template:
    scenario_id: "SC-001"
    description: "VIP customer, $5,000 order, first purchase"
    applicable_rules: ["BR-001", "BR-005", "BR-012"]
    expected_action: "???"
    conflict_detected: true
```

## Resolution Strategies

### 1. Priority/Precedence

Establish explicit rule ordering:

```yaml
priority_resolution:
  technique: "Assign priority levels to rules"

  approaches:
    numeric_priority:
      BR_001: { priority: 1, rule: "Security rules" }
      BR_002: { priority: 2, rule: "VIP rules" }
      BR_003: { priority: 3, rule: "Standard rules" }

    category_priority:
      order: ["Regulatory", "Security", "Business", "Convenience"]
      interpretation: "First matching category wins"

    specificity_priority:
      principle: "More specific rule wins over general"
      example: "VIP+$5000 rule beats VIP rule beats default"

  documentation:
    - "Document priority scheme"
    - "Explain rationale"
    - "Train stakeholders"
```

### 2. Rule Refinement

Make conditions more specific to eliminate overlap:

```yaml
refinement_resolution:
  technique: "Add conditions to separate conflicting rules"

  before:
    rule_a: "VIP orders auto-approved"
    rule_b: "Orders over $5,000 need approval"
    conflict: "VIP order over $5,000"

  after:
    rule_a: "VIP orders under $5,000 auto-approved"
    rule_b: "VIP orders over $5,000 need director approval"
    rule_c: "Non-VIP orders over $5,000 need manager approval"
    result: "No overlap, all cases covered"
```

### 3. Rule Consolidation

Merge redundant or related rules:

```yaml
consolidation_resolution:
  technique: "Combine overlapping rules into one comprehensive rule"

  before:
    rule_a: "New customers get 10% discount"
    rule_b: "First orders get 10% discount"
    rule_c: "Welcome promotion gives 10% discount"
    issue: "Three rules, same effect, maintenance burden"

  after:
    unified_rule: |
      New customer orders receive 10% welcome discount
      (applies to first order from any new account)
    result: "Single rule, clear scope"
```

### 4. Exception Handling

Define explicit exception hierarchy:

```yaml
exception_resolution:
  technique: "Create exception rules that override base rules"

  structure:
    base_rule: "All orders ship in 5 days"
    exception_1: "EXCEPT express orders ship in 1 day"
    exception_2: "EXCEPT hazmat orders ship in 10 days"
    exception_3: "EXCEPT international orders follow country SLAs"

  priority: "Exceptions evaluated first, then base rule"

  documentation:
    - "Base rule clearly stated"
    - "Exceptions explicitly listed"
    - "Priority of exceptions if they overlap"
```

### 5. Temporal Separation

Resolve by time or sequence:

```yaml
temporal_resolution:
  technique: "Separate rules by when they apply"

  example:
    conflict:
      rule_a: "Monthly subscribers get premium features"
      rule_b: "New users get trial features"
      issue: "New monthly subscriber - which features?"

    resolution:
      phase_1: "Days 1-14: Trial features apply"
      phase_2: "Day 15+: Premium features apply"
      clarity: "Time-based transition eliminates conflict"
```

## Resolution Process

### Step-by-Step Workflow

```yaml
resolution_workflow:
  step_1_identify:
    action: "Document the conflict"
    output:
      - "Rules involved"
      - "Conditions that overlap"
      - "Actions that conflict"
      - "Business impact"

  step_2_analyze:
    action: "Understand business intent"
    questions:
      - "What did the business intend?"
      - "Which rule is more important?"
      - "What's the real-world expectation?"
      - "What are the consequences of each outcome?"

  step_3_stakeholder:
    action: "Consult rule owners"
    participants:
      - "Original rule authors"
      - "Business process owners"
      - "Affected departments"
    goal: "Agree on correct behavior"

  step_4_resolve:
    action: "Apply resolution strategy"
    options:
      - "Priority/precedence"
      - "Rule refinement"
      - "Consolidation"
      - "Exception handling"
      - "Temporal separation"

  step_5_document:
    action: "Record the resolution"
    include:
      - "Original conflict"
      - "Resolution chosen"
      - "Rationale"
      - "Stakeholder approval"
      - "Date and participants"

  step_6_verify:
    action: "Test the resolution"
    methods:
      - "Review updated decision table"
      - "Test with conflict scenarios"
      - "Confirm no new conflicts introduced"
```

### Escalation Path

```yaml
escalation_path:
  level_1:
    resolver: "Business Analyst"
    scope: "Clear conflicts with obvious resolution"
    authority: "Apply standard resolution patterns"

  level_2:
    resolver: "Process Owner"
    scope: "Conflicts requiring business decision"
    authority: "Decide business intent"

  level_3:
    resolver: "Steering Committee"
    scope: "Cross-department conflicts"
    authority: "Arbitrate between departments"

  level_4:
    resolver: "Executive Sponsor"
    scope: "Strategic or high-impact conflicts"
    authority: "Final decision"
```

## Documentation Template

### Conflict Resolution Record

```yaml
conflict_resolution_record:
  conflict_id: "CFL-{number}"
  date_identified: "{ISO-8601}"
  date_resolved: "{ISO-8601}"

  conflict_description:
    rules_involved: ["BR-001", "BR-015"]
    overlap_condition: "VIP customer placing order > $5,000"
    conflicting_actions:
      - "BR-001: Auto-approve"
      - "BR-015: Require manager approval"

  business_impact:
    severity: "high | medium | low"
    affected_process: "{process name}"
    frequency: "How often this scenario occurs"

  resolution:
    strategy: "Priority | Refinement | Consolidation | Exception | Temporal"
    changes_made:
      - "Updated BR-001 to exclude orders > $5,000"
      - "Created BR-016 for VIP orders > $5,000"
    rationale: "VIP customers still need oversight for large orders"

  approval:
    stakeholders: ["Jane Smith", "John Doe"]
    date: "{ISO-8601}"

  verification:
    test_scenarios: ["SC-101", "SC-102"]
    result: "Passed - no conflicts remain"
```

## Prevention Best Practices

```yaml
prevention:
  at_creation:
    - "Check new rules against existing rules"
    - "Use decision tables to visualize coverage"
    - "Define clear scope and boundaries"
    - "Assign owner to each rule"

  ongoing_maintenance:
    - "Regular conflict detection reviews"
    - "Version control for rule changes"
    - "Impact analysis before rule modifications"
    - "Cross-reference related rules"

  governance:
    - "Establish rule ownership"
    - "Define escalation paths"
    - "Maintain conflict resolution log"
    - "Train teams on conflict patterns"
```

---

**Last Updated:** 2025-12-26
