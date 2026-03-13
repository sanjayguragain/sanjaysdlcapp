# Decision Table Patterns

## Overview

Decision tables provide a structured way to represent complex business logic with multiple conditions and actions. This guide covers common patterns, table types, and best practices.

## Basic Decision Table Structure

```yaml
decision_table_anatomy:
  components:
    condition_stub: "List of conditions (left column)"
    condition_entry: "Values for each condition per rule (columns)"
    action_stub: "List of possible actions (left column)"
    action_entry: "Actions to take per rule (columns)"
    rule_columns: "Each column represents one rule"

  notation:
    "Y": "Condition must be true"
    "N": "Condition must be false"
    "-": "Condition doesn't matter (don't care)"
    "X": "Execute this action"
    " ": "Don't execute this action"
```

### Standard Format

```text
┌─────────────────────────────────────────────────────────────┐
│ Decision Table: {Table Name}                                │
├─────────────────┬───────┬───────┬───────┬───────┬───────────┤
│ CONDITIONS      │  R1   │  R2   │  R3   │  R4   │  Default  │
├─────────────────┼───────┼───────┼───────┼───────┼───────────┤
│ Condition 1     │   Y   │   Y   │   N   │   N   │     -     │
│ Condition 2     │   Y   │   N   │   Y   │   N   │     -     │
├─────────────────┼───────┼───────┼───────┼───────┼───────────┤
│ ACTIONS         │       │       │       │       │           │
├─────────────────┼───────┼───────┼───────┼───────┼───────────┤
│ Action 1        │   X   │       │   X   │       │           │
│ Action 2        │       │   X   │   X   │       │     X     │
└─────────────────┴───────┴───────┴───────┴───────┴───────────┘
```

## Decision Table Types

### Limited Entry Tables

Conditions are boolean (Y/N only):

```yaml
limited_entry_example:
  name: "Order Approval"
  conditions:
    C1: "Order amount > $5,000?"
    C2: "Customer is VIP?"

  actions:
    A1: "Require manager approval"
    A2: "Auto-approve"

  rules:
    R1: { C1: "Y", C2: "Y", A1: " ", A2: "X" }
    R2: { C1: "Y", C2: "N", A1: "X", A2: " " }
    R3: { C1: "N", C2: "-", A1: " ", A2: "X" }
```

### Extended Entry Tables

Conditions can have multiple values:

```yaml
extended_entry_example:
  name: "Shipping Method Selection"
  conditions:
    C1:
      description: "Order weight"
      values: ["<1kg", "1-10kg", ">10kg"]
    C2:
      description: "Destination"
      values: ["Domestic", "International"]

  actions:
    A1: "Shipping method to use"

  rules:
    R1: { C1: "<1kg", C2: "Domestic", A1: "Standard Mail" }
    R2: { C1: "<1kg", C2: "International", A1: "Airmail" }
    R3: { C1: "1-10kg", C2: "Domestic", A1: "Ground" }
    R4: { C1: "1-10kg", C2: "International", A1: "Air Freight" }
    R5: { C1: ">10kg", C2: "-", A1: "Freight" }
```

### Mixed Entry Tables

Combination of limited and extended entries:

```yaml
mixed_entry_example:
  name: "Loan Approval"
  conditions:
    C1: "Credit score range"  # Extended: Good/Fair/Poor
    C2: "Existing customer?"   # Limited: Y/N

  actions:
    A1: "Decision"

  rules:
    R1: { C1: "Good", C2: "-", A1: "Auto-approve" }
    R2: { C1: "Fair", C2: "Y", A1: "Manual review" }
    R3: { C1: "Fair", C2: "N", A1: "Decline" }
    R4: { C1: "Poor", C2: "-", A1: "Decline" }
```

## Common Patterns

### Pattern 1: Discount Calculation

```yaml
discount_table:
  name: "Customer Discount Rules"

  conditions:
    C1: "Customer tier"
    C2: "Order amount"
    C3: "Payment method"

  actions:
    A1: "Discount percentage"
    A2: "Free shipping"

  rules:
    R1:
      C1: "Platinum"
      C2: ">$500"
      C3: "-"
      A1: "20%"
      A2: "Yes"

    R2:
      C1: "Platinum"
      C2: "<=$500"
      C3: "-"
      A1: "15%"
      A2: "Yes"

    R3:
      C1: "Gold"
      C2: ">$500"
      C3: "-"
      A1: "15%"
      A2: "Yes"

    R4:
      C1: "Gold"
      C2: "<=$500"
      C3: "-"
      A1: "10%"
      A2: "No"

    R5:
      C1: "Standard"
      C2: ">$100"
      C3: "Credit Card"
      A1: "5%"
      A2: "No"

    R6:
      C1: "Standard"
      C2: "-"
      C3: "-"
      A1: "0%"
      A2: "No"
```

### Pattern 2: Workflow Routing

```yaml
routing_table:
  name: "Support Ticket Routing"

  conditions:
    C1: "Ticket priority"
    C2: "Customer tier"
    C3: "Issue type"

  actions:
    A1: "Route to team"
    A2: "SLA hours"
    A3: "Notify manager"

  rules:
    R1:
      C1: "Critical"
      C2: "-"
      C3: "-"
      A1: "Senior Engineers"
      A2: "1"
      A3: "Yes"

    R2:
      C1: "High"
      C2: "Enterprise"
      C3: "-"
      A1: "Senior Engineers"
      A2: "4"
      A3: "Yes"

    R3:
      C1: "High"
      C2: "Standard"
      C3: "-"
      A1: "Tier 2 Support"
      A2: "8"
      A3: "No"

    R4:
      C1: "Medium/Low"
      C2: "-"
      C3: "Billing"
      A1: "Billing Team"
      A2: "24"
      A3: "No"

    R5:
      C1: "Medium/Low"
      C2: "-"
      C3: "Technical"
      A1: "Tier 1 Support"
      A2: "24"
      A3: "No"
```

### Pattern 3: Validation Rules

```yaml
validation_table:
  name: "Order Validation"

  conditions:
    C1: "Has valid address?"
    C2: "Payment verified?"
    C3: "Items in stock?"
    C4: "Customer active?"

  actions:
    A1: "Accept order"
    A2: "Error message"
    A3: "Block customer"

  rules:
    R1:
      C1: "N"
      C2: "-"
      C3: "-"
      C4: "-"
      A1: " "
      A2: "Invalid shipping address"
      A3: " "

    R2:
      C1: "Y"
      C2: "N"
      C3: "-"
      C4: "-"
      A1: " "
      A2: "Payment verification failed"
      A3: " "

    R3:
      C1: "Y"
      C2: "Y"
      C3: "N"
      C4: "-"
      A1: " "
      A2: "Some items out of stock"
      A3: " "

    R4:
      C1: "Y"
      C2: "Y"
      C3: "Y"
      C4: "N"
      A1: " "
      A2: "Account suspended"
      A3: "X"

    R5:
      C1: "Y"
      C2: "Y"
      C3: "Y"
      C4: "Y"
      A1: "X"
      A2: " "
      A3: " "
```

### Pattern 4: Authorization Matrix

```yaml
authorization_table:
  name: "Expense Approval Authority"

  conditions:
    C1: "Expense amount"
    C2: "Expense category"
    C3: "Budget available?"

  actions:
    A1: "Required approver"
    A2: "Secondary approval"

  rules:
    R1:
      C1: "<$100"
      C2: "-"
      C3: "Y"
      A1: "Self-approve"
      A2: " "

    R2:
      C1: "$100-$1000"
      C2: "-"
      C3: "Y"
      A1: "Direct Manager"
      A2: " "

    R3:
      C1: "$1000-$5000"
      C2: "-"
      C3: "Y"
      A1: "Department Head"
      A2: " "

    R4:
      C1: ">$5000"
      C2: "-"
      C3: "Y"
      A1: "Department Head"
      A2: "Finance Director"

    R5:
      C1: "-"
      C2: "Travel"
      C3: "-"
      A1: "HR Manager"
      A2: " "

    R6:
      C1: "-"
      C2: "-"
      C3: "N"
      A1: "CFO"
      A2: " "
```

## Table Optimization

### Consolidation with Don't Care

```yaml
consolidation_example:
  before:
    R1: { C1: "Y", C2: "Y", A1: "X" }
    R2: { C1: "Y", C2: "N", A1: "X" }

  after:
    R1: { C1: "Y", C2: "-", A1: "X" }  # C2 doesn't affect outcome

  benefit: "Reduces rules, easier to understand"
```

### Else/Default Rule

```yaml
default_rule:
  purpose: "Catch any cases not explicitly covered"

  placement: "Always last column"

  example:
    conditions: ["-", "-", "-"]  # All don't-care
    actions: ["Log error", "Escalate to support"]

  best_practice: "Every table should have a default rule"
```

### Rule Ordering

```yaml
ordering_strategies:
  by_frequency:
    description: "Most common rules first"
    benefit: "Faster processing in implementations"

  by_specificity:
    description: "Most specific rules first"
    benefit: "Prevents masking by general rules"

  by_priority:
    description: "Highest priority outcomes first"
    benefit: "Critical cases processed first"
```

## Completeness Checking

### Rule Count Formula

```yaml
completeness:
  formula: "For n conditions with 2 values each: 2^n rules"

  examples:
    2_conditions: "2^2 = 4 rules"
    3_conditions: "2^3 = 8 rules"
    4_conditions: "2^4 = 16 rules"

  note: "Don't-care (-) entries reduce actual rules needed"
```

### Verification Checklist

```yaml
verification:
  completeness:
    - "Are all condition combinations covered?"
    - "Is there a default/else rule?"
    - "Are edge cases explicitly addressed?"

  consistency:
    - "Do any rules conflict (same conditions, different actions)?"
    - "Are actions mutually exclusive where needed?"
    - "Is rule priority clear when overlaps exist?"

  clarity:
    - "Are conditions unambiguous?"
    - "Are action names descriptive?"
    - "Is the table readable by non-technical stakeholders?"
```

## Visualization Tips

### Color Coding

```yaml
color_coding:
  conditions:
    "Y": "green background"
    "N": "red background"
    "-": "gray background"

  actions:
    "X": "blue background"
    " ": "no fill"

  purpose: "Quick visual scanning of rule patterns"
```

### Grouping Related Rules

```yaml
grouping:
  technique: "Add visual separators between rule groups"

  example: |
    ├─────────────────┼───────┼───────┼───────┼───────┤
    │ VIP Customer Rules                              │
    ├─────────────────┼───────┼───────┼───────┼───────┤
    │ ...             │       │       │       │       │
    ├─────────────────┼───────┼───────┼───────┼───────┤
    │ Standard Customer Rules                         │
    ├─────────────────┼───────┼───────┼───────┼───────┤
```

---

**Last Updated:** 2025-12-26
