# WSJF Scoring Worksheets

## Overview

Weighted Shortest Job First (WSJF) is a prioritization model from the SAFe (Scaled Agile Framework). It calculates priority based on Cost of Delay divided by Job Size.

## Formula

```yaml
wsjf:
  formula: "WSJF = Cost of Delay / Job Size"

  cost_of_delay:
    formula: "CoD = User Value + Time Criticality + Risk Reduction/Opportunity Enablement"
    components:
      user_value: "Relative value to users/customers"
      time_criticality: "How much value decreases with time"
      risk_reduction: "Risk mitigation or opportunity enabled"
```

## Scoring Scales

### Modified Fibonacci Scale

Use relative sizing, not absolute estimates:

```yaml
fibonacci_scale:
  values: [1, 2, 3, 5, 8, 13, 20]

  interpretation:
    1: "Minimal"
    2: "Very low"
    3: "Low"
    5: "Medium"
    8: "High"
    13: "Very high"
    20: "Extreme"

  guideline: "Compare items relatively, not absolutely"
```

### Component Scoring Guidelines

#### User/Business Value

```yaml
user_value:
  question: "What is the relative value to users or business?"

  scoring_guide:
    1-2: "Nice to have, minimal user impact"
    3-5: "Useful feature, moderate user benefit"
    8: "Important feature, significant user value"
    13: "Critical feature, major user/business value"
    20: "Essential, extreme value (rare)"

  considerations:
    - "Number of users affected"
    - "Revenue impact"
    - "Strategic importance"
    - "Customer satisfaction impact"
```

#### Time Criticality

```yaml
time_criticality:
  question: "How much does value decay with time?"

  scoring_guide:
    1-2: "No time pressure, value stable over time"
    3-5: "Some time sensitivity, value decays slowly"
    8: "Time-sensitive, competitive pressure"
    13: "Urgent deadline, significant value decay"
    20: "Critical deadline, value drops to zero (rare)"

  considerations:
    - "Market window closing"
    - "Competitor moves"
    - "Regulatory deadlines"
    - "Seasonal relevance"
```

#### Risk Reduction / Opportunity Enablement (RR/OE)

```yaml
risk_reduction:
  question: "What risk does this reduce or opportunity does it enable?"

  scoring_guide:
    1-2: "Minimal risk reduction"
    3-5: "Moderate risk mitigation"
    8: "Significant risk reduction or opportunity"
    13: "Major risk/opportunity"
    20: "Critical risk must be addressed (rare)"

  considerations:
    - "Technical debt reduction"
    - "Security/compliance risks"
    - "Platform for future features"
    - "Learning/knowledge gaps"
```

#### Job Size

```yaml
job_size:
  question: "What is the relative effort to implement?"

  scoring_guide:
    1: "Trivial, hours of work"
    2: "Small, 1-2 days"
    3: "Small-medium, few days"
    5: "Medium, about a sprint"
    8: "Large, 2-3 sprints"
    13: "Very large, multiple sprints"
    20: "Huge, needs splitting"

  note: "If size is 20, consider breaking into smaller items"
```

## Scoring Worksheet

### Individual Feature Template

```yaml
feature_worksheet:
  # Feature Information
  id: "FEAT-001"
  title: "Offline Mode"
  description: "Allow users to access and edit content without internet connection"

  # Cost of Delay Components
  user_value:
    score: 8
    rationale: "Highly requested by field workers (30% of users)"
    evidence: "42 support tickets, 3 enterprise customer requests"

  time_criticality:
    score: 5
    rationale: "Competitor launching similar feature in Q2"
    evidence: "Competitor roadmap leak, industry analyst report"

  risk_reduction:
    score: 3
    rationale: "Reduces support tickets for connectivity issues"
    evidence: "~50 tickets/month related to connectivity"

  # Total Cost of Delay
  cost_of_delay: 16  # 8 + 5 + 3

  # Job Size
  job_size:
    score: 5
    rationale: "Moderate complexity, requires local storage architecture"
    evidence: "Tech spike completed, estimate validated"

  # WSJF Calculation
  wsjf_score: 3.2  # 16 / 5

  # Comparison Notes
  relative_priority: "High - good value/effort ratio"
```

## Comparison Worksheet

### Multi-Feature Comparison Table

```yaml
comparison_worksheet:
  date: "2025-12-26"
  team: "Product Team Alpha"
  facilitator: "Product Owner"

  # Header row
  columns:
    - "Feature"
    - "User Value"
    - "Time Crit"
    - "RR/OE"
    - "CoD"
    - "Size"
    - "WSJF"
    - "Rank"

  # Data rows (sorted by WSJF descending)
  features:
    - feature: "Dark Mode"
      user_value: 5
      time_crit: 1
      risk_reduction: 1
      cod: 7
      size: 2
      wsjf: 3.5
      rank: 1

    - feature: "Offline Mode"
      user_value: 8
      time_crit: 5
      risk_reduction: 3
      cod: 16
      size: 5
      wsjf: 3.2
      rank: 2

    - feature: "Real-time Collab"
      user_value: 8
      time_crit: 3
      risk_reduction: 5
      cod: 16
      size: 8
      wsjf: 2.0
      rank: 3

    - feature: "Export PDF"
      user_value: 6
      time_crit: 3
      risk_reduction: 2
      cod: 11
      size: 8
      wsjf: 1.4
      rank: 4
```

## Facilitation Guide

### WSJF Session Format

```yaml
session_format:
  duration: "2-3 hours"
  participants:
    required:
      - "Product Owner (facilitator)"
      - "Development Lead (sizing)"
      - "UX Representative"
    optional:
      - "Customer Success"
      - "Sales/Marketing"

  agenda:
    preparation:
      - "Create feature list with descriptions"
      - "Distribute in advance"
      - "Ask participants to pre-score"

    session:
      1_intro: "10 min - Explain WSJF and scoring scales"
      2_calibrate: "15 min - Score 2-3 features together for calibration"
      3_score: "60-90 min - Score all features"
      4_review: "20 min - Review rankings, discuss surprises"
      5_decide: "15 min - Confirm priority order"

    outputs:
      - "Prioritized feature list"
      - "Documented rationale"
      - "Action items for top priorities"
```

### Calibration Exercise

```yaml
calibration:
  purpose: "Align team on scoring interpretation"

  process:
    1: "Select 2-3 diverse features"
    2: "Have each person score independently"
    3: "Reveal scores simultaneously"
    4: "Discuss differences > 2 points"
    5: "Align on interpretation"
    6: "Document calibration decisions"

  calibration_features:
    - "One obviously high priority"
    - "One obviously low priority"
    - "One controversial/uncertain"
```

## Edge Cases

### Handling Extreme Scores

```yaml
extreme_scores:
  all_high_cod:
    problem: "Everything scores 13+ on User Value"
    solution: "Force ranking - compare features to each other"
    technique: "Which has MORE value? Use that as 13, adjust others"

  zero_size:
    problem: "Someone wants to score size as 0 or 1"
    solution: "Minimum size is 1; if truly trivial, just do it"

  tied_wsjf:
    problem: "Multiple features have same WSJF"
    solution: "Use secondary criteria: strategic alignment, dependencies"
```

### Dependencies

```yaml
dependencies:
  handling:
    - "Score each feature independently"
    - "Note dependencies in rationale"
    - "After ranking, adjust for dependencies"

  example:
    feature_a: "Authentication (WSJF: 2.5)"
    feature_b: "User Profiles (WSJF: 3.0) - depends on Auth"
    decision: "Do Auth first despite lower WSJF"
```

## Output Template

### WSJF Analysis Report

```yaml
wsjf_report:
  metadata:
    date: "{ISO-8601}"
    team: "{team-name}"
    features_scored: 12

  summary:
    highest_wsjf: "Dark Mode (3.5)"
    lowest_wsjf: "Advanced Analytics (0.8)"
    average_wsjf: 2.1

  prioritized_backlog:
    - rank: 1
      feature: "Dark Mode"
      wsjf: 3.5
      rationale: "Low effort, immediate user satisfaction"
      recommendation: "Start immediately"

    - rank: 2
      feature: "Offline Mode"
      wsjf: 3.2
      rationale: "High value, competitive necessity"
      recommendation: "Start after Dark Mode"

    # ... continue for all features

  capacity_mapping:
    sprint_1: ["Dark Mode", "Quick Wins"]
    sprint_2: ["Offline Mode - Phase 1"]
    sprint_3: ["Offline Mode - Phase 2"]

  deferred_items:
    - feature: "Advanced Analytics"
      wsjf: 0.8
      reason: "Low WSJF - revisit in Q3"

  next_review: "2025-02-01"
```

## Tips for Success

```yaml
success_tips:
  - "Keep scoring sessions focused (2-3 hours max)"
  - "Use relative sizing, not absolute"
  - "Document rationale for future reference"
  - "Re-score periodically as context changes"
  - "Don't over-optimize - WSJF is a guide, not gospel"
  - "Consider dependencies after initial ranking"
  - "Split large items (size 13+) before scoring"
```

---

**Last Updated:** 2025-12-26
