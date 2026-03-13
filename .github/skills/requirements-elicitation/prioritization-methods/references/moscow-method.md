# MoSCoW Method - Detailed Guide

## Overview

MoSCoW is a prioritization technique developed by Dai Clegg at Oracle. The name is an acronym for Must have, Should have, Could have, and Won't have.

## Category Definitions

### Must Have

Requirements that are essential for the solution to be viable.

**Criteria:**

- System will not work without it
- Unsafe without it (legal, regulatory, security)
- No workaround exists
- Delivery is not usable without it

**Examples:**

```yaml
must_examples:
  - "User authentication for banking app"
  - "GDPR compliance for EU customers"
  - "Payment processing for e-commerce"
  - "SSL encryption for data transmission"
```

### Should Have

Important requirements that are not critical for launch but should be included if possible.

**Criteria:**

- Painful to leave out (major workaround needed)
- Significant value to many users
- Expected by stakeholders
- Could differentiate from competitors

**Examples:**

```yaml
should_examples:
  - "Password reset via email"
  - "Search functionality"
  - "Mobile-responsive design"
  - "Export data to PDF"
```

### Could Have

Desirable requirements that provide nice-to-have enhancements.

**Criteria:**

- Small benefit
- Low cost/effort
- Easy to defer if time runs out
- Won't impact core functionality

**Examples:**

```yaml
could_examples:
  - "Dark mode theme"
  - "Keyboard shortcuts"
  - "Custom dashboard layouts"
  - "Social sharing buttons"
```

### Won't Have (This Time)

Requirements explicitly excluded from current scope but may be considered later.

**Criteria:**

- Agreed not in this release
- Too expensive for current budget
- Lower priority than current MUSTs
- May be revisited in future

**Examples:**

```yaml
wont_examples:
  - "Mobile native app (web-first approach)"
  - "Multi-language support (Phase 2)"
  - "Advanced analytics dashboard"
  - "Third-party integrations beyond core"
```

## Application Process

### Step 1: Requirement Collection

Gather all requirements from stakeholders without initial prioritization.

### Step 2: Must Selection (Strict)

Apply the "Must" test rigorously:

```yaml
must_test:
  questions:
    - "Will the solution fail without this?"
    - "Is there a legal/regulatory requirement?"
    - "Is there a business-critical reason?"
    - "Is there absolutely no workaround?"

  if_all_no: "This is NOT a Must"
  if_any_yes: "Consider for Must category"
```

**Common Mistake:** Making everything "Must" because stakeholders want it.

### Step 3: Won't Selection

Explicitly exclude items:

```yaml
wont_selection:
  benefits:
    - "Manages stakeholder expectations"
    - "Documents conscious decisions"
    - "Creates future backlog"
    - "Prevents scope creep"
```

### Step 4: Distribute Remaining

Split remaining items between Should and Could:

```yaml
distribution:
  should_indicators:
    - "Multiple stakeholders requesting"
    - "Competitive necessity"
    - "Significant user value"

  could_indicators:
    - "Single stakeholder request"
    - "Nice-to-have enhancement"
    - "Low effort bonus"
```

### Step 5: Capacity Validation

Verify MUSTs don't exceed capacity:

```yaml
capacity_check:
  target: "MUSTs = ~60% of capacity"
  action_if_exceeded:
    - "Re-evaluate MUST criteria"
    - "Increase capacity (if possible)"
    - "Split delivery into phases"
```

## Common Pitfalls

### 1. Must Inflation

**Problem:** Stakeholders mark everything as Must.

**Solution:**

```yaml
must_inflation_fixes:
  - "Apply strict Must criteria"
  - "Limit MUSTs to 60% of capacity"
  - "Ask: 'Would we cancel the project without this?'"
  - "Use timeboxing to force prioritization"
```

### 2. Empty Won't Category

**Problem:** No items in Won't suggests avoiding hard decisions.

**Solution:**

```yaml
empty_wont_fixes:
  - "Force at least 10% into Won't"
  - "Ask: 'What if we had half the time?'"
  - "Separate 'want' from 'need'"
```

### 3. Vague Categorization

**Problem:** Categories used inconsistently.

**Solution:**

```yaml
consistency_fixes:
  - "Define category criteria explicitly"
  - "Use same criteria for all requirements"
  - "Review categorizations as a group"
  - "Document rationale for each"
```

## MoSCoW Workshop Format

```yaml
workshop_agenda:
  duration: "2 hours"

  preparation:
    - "Distribute requirement list in advance"
    - "Ask stakeholders to pre-categorize"

  session:
    1_review: "15 min - Review requirements list"
    2_individual: "15 min - Individual categorization"
    3_compare: "30 min - Compare and discuss differences"
    4_consensus: "45 min - Build consensus on each item"
    5_validate: "15 min - Capacity check and adjustments"

  outputs:
    - "Categorized requirement list"
    - "Documented rationale for MUSTs"
    - "Explicit Won't list with future notes"
```

## Integration with Other Methods

MoSCoW pairs well with other techniques:

```yaml
combinations:
  moscow_then_wsjf:
    purpose: "Rank within categories"
    flow: "Categorize with MoSCoW → Rank SHOULDs with WSJF"

  moscow_with_kano:
    purpose: "Validate categorization"
    flow: "Initial MoSCoW → Kano survey → Adjust based on customer data"

  moscow_for_mvp:
    purpose: "Define minimum viable product"
    flow: "All MUSTs = MVP → SHOULDs = MVP+"
```

## Output Template

```yaml
moscow_output:
  project: "{project-name}"
  date: "{ISO-8601}"
  participants: ["...", "..."]

  summary:
    must: 8
    should: 12
    could: 15
    wont: 7
    total: 42

  capacity_analysis:
    must_effort: "120 story points"
    available_capacity: "180 story points"
    remaining_for_should: "60 story points"
    status: "✅ Within capacity"

  categorized_requirements:
    must:
      - id: "REQ-001"
        title: "User Authentication"
        rationale: "Security requirement, no workaround"
      # ...

    should:
      - id: "REQ-015"
        title: "Password Reset"
        rationale: "Expected feature, impacts user experience"
      # ...
```

---

**Last Updated:** 2025-12-26
