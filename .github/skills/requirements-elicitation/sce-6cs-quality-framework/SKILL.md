---
name: sce-6cs-quality-framework
description: "Evaluates requirements against the 6Cs quality criteria (Clear, Concise, Complete, Consistent, Correct, Confirmable) and INVEST principles. Produces per-requirement quality scores (1-5 scale), improvement recommendations, and aggregate quality metrics. Used for quality assessment, synthesis validation, and gap detection quality checks."
metadata:
  version: 1.0.0
  author: Agent Skills Team
  category: requirements-elicitation
  tags:
    - quality
    - 6cs
    - invest
    - requirements-quality
    - scoring
  tools: ['Read', 'Search']
---

# SCE 6Cs Quality Framework

## Overview

Given a set of requirements, this skill evaluates each requirement against the 6Cs quality criteria and INVEST principles, producing quality scores with specific improvement recommendations. The skill is a **quality assessment engine** — it scores and recommends but does not modify requirements.

## When to Use

- After requirements extraction to assess quality before specification
- During requirements synthesis to validate merged requirements
- As part of gap detection to identify quality-related gaps
- Before implementation to ensure requirements are implementation-ready

## When NOT to Use

- Requirements are already validated and approved
- The requirement set is empty (nothing to score)
- Only formatting/style review is needed (not quality assessment)

## Inputs

```json
{
  "requirements": [
    {
      "id": "FR-001",
      "text": "Requirement text",
      "type": "functional|non-functional|constraint",
      "source": "Source document or interview",
      "acceptance_criteria": []
    }
  ],
  "assessment_scope": "full|6cs_only|invest_only",
  "context": {
    "domain": "Domain name (optional, for domain-specific checks)",
    "related_requirements": []
  }
}
```

## Method

### Step 1: 6Cs Evaluation

For each requirement, score against all 6 criteria (1-5 scale):

#### Clear (Unambiguous, single interpretation)
Check for:
- Vague terms ("some", "many", "various", "etc.")
- Ambiguous pronouns ("it", "they", "this")
- Subjective adjectives ("user-friendly", "fast", "intuitive")
- Missing context or actors

| Score | Meaning |
|-------|---------|
| 5 | Crystal clear, no ambiguity possible |
| 4 | Clear with minor refinement opportunities |
| 3 | Mostly clear but 1-2 ambiguous elements |
| 2 | Multiple ambiguities requiring clarification |
| 1 | Fundamentally unclear, needs rewrite |

#### Concise (No unnecessary words, appropriately brief)
Check for:
- Redundant phrases
- Excessive qualifiers
- Repeated information
- Verbose explanations that should be split

| Score | Meaning |
|-------|---------|
| 5 | Optimally concise |
| 4 | Brief with minor trimming possible |
| 3 | Some redundancy but acceptable |
| 2 | Significantly verbose |
| 1 | Needs major condensation |

#### Complete (All necessary information included)
Check for:
- Missing actors (who)
- Missing conditions (when)
- Missing constraints (how much, how fast)
- Missing error handling
- Missing edge cases

| Score | Meaning |
|-------|---------|
| 5 | Fully complete, all aspects covered |
| 4 | Complete with minor gaps |
| 3 | Key information present, some gaps |
| 2 | Significant missing information |
| 1 | Incomplete, major gaps |

#### Consistent (No contradictions with other requirements)
Check for:
- Contradictory statements
- Inconsistent terminology
- Conflicting constraints
- Overlapping scope with conflicts

| Score | Meaning |
|-------|---------|
| 5 | Fully consistent with all requirements |
| 4 | Consistent with minor terminology variations |
| 3 | Mostly consistent, one potential conflict |
| 2 | Multiple inconsistencies |
| 1 | Major contradictions present |

#### Correct (Accurately represents stakeholder needs)
Check for:
- Alignment with business goals
- Technical feasibility
- Stakeholder validation status
- Domain accuracy

| Score | Meaning |
|-------|---------|
| 5 | Verified correct by stakeholders |
| 4 | Likely correct based on evidence |
| 3 | Plausible but unverified |
| 2 | Questionable accuracy |
| 1 | Known to be incorrect or outdated |

#### Confirmable (Can be verified/tested)
Check for:
- Measurable criteria
- Testable conditions
- Observable outcomes
- Acceptance criteria defined

| Score | Meaning |
|-------|---------|
| 5 | Clear acceptance criteria, easily testable |
| 4 | Testable with minor criteria refinement |
| 3 | Testable but criteria need work |
| 2 | Difficult to test objectively |
| 1 | Cannot be verified or tested |

### Step 2: INVEST Evaluation (if scope includes INVEST)

For each requirement, assess against INVEST principles:

| Criterion | Passing | Failing |
|-----------|---------|---------|
| **I**ndependent | Can be developed without other requirements | Tightly coupled to other requirements |
| **N**egotiable | Implementation details flexible | Too prescriptive, no room for discussion |
| **V**aluable | Clear value to stakeholder | Technical task with no visible value |
| **E**stimable | Scope clear enough to estimate | Too vague or too large to estimate |
| **S**mall | Can be completed in a sprint | Epic-sized, needs breakdown |
| **T**estable | Clear acceptance criteria | No way to verify completion |

Score each as: `pass` (1) or `fail` (0). INVEST score = count of passing criteria / 6.

### Step 3: Quality Band Classification

Calculate overall 6Cs score per requirement:

```
overall_score = average(clear, concise, complete, consistent, correct, confirmable)
```

Classify into quality bands:

| Band | Score Range | Action |
|------|------------|--------|
| Excellent | 4.5–5.0 | Ready for implementation |
| Good | 3.5–4.4 | Minor refinements recommended |
| Acceptable | 2.5–3.4 | Improvements needed before implementation |
| Poor | 1.5–2.4 | Significant rework required |
| Critical | 1.0–1.4 | Requirement needs complete rewrite |

### Step 4: Improvement Recommendations

For each requirement scoring below 4.0 on any criterion, generate specific recommendations:

```yaml
recommendation:
  requirement_id: "FR-001"
  criterion: "clear"
  current_score: 2
  issue: "Uses vague term 'fast' without measurable target"
  suggestion: "Replace 'fast' with specific metric: 'Response time under 200ms at p95'"
  improved_text: "The system shall respond to API requests within 200ms at the 95th percentile"
```

### Step 5: Aggregate Metrics

Calculate set-level quality metrics:

```
set_average = average(all requirement overall_scores)
readiness_percentage = count(score >= 3.5) / total_count * 100
critical_count = count(score < 1.5)
```

## Output

```json
{
  "generated_by": {
    "skill": "sce-6cs-quality-framework",
    "version": "1.0.0"
  },
  "assessment_scope": "full",
  "aggregate_metrics": {
    "total_requirements": 0,
    "set_average_score": 0.0,
    "readiness_percentage": 0.0,
    "quality_band": "excellent|good|acceptable|poor|critical",
    "by_band": {
      "excellent": 0,
      "good": 0,
      "acceptable": 0,
      "poor": 0,
      "critical": 0
    }
  },
  "per_requirement": [
    {
      "id": "FR-001",
      "text": "Requirement text",
      "six_cs": {
        "clear": 4,
        "concise": 5,
        "complete": 3,
        "consistent": 4,
        "correct": 3,
        "confirmable": 2
      },
      "overall_score": 3.5,
      "quality_band": "good",
      "invest": {
        "independent": true,
        "negotiable": true,
        "valuable": true,
        "estimable": false,
        "small": true,
        "testable": false,
        "score": 0.67
      },
      "issues": [
        {
          "criterion": "confirmable",
          "score": 2,
          "issue": "No acceptance criteria defined",
          "suggestion": "Add measurable acceptance criteria"
        }
      ],
      "improved_text": "Suggested improvement if applicable"
    }
  ],
  "recommendations_summary": {
    "total_issues": 0,
    "by_criterion": {
      "clear": 0,
      "concise": 0,
      "complete": 0,
      "consistent": 0,
      "correct": 0,
      "confirmable": 0
    },
    "top_issues": []
  }
}
```

## Error Handling

- **Empty requirements list** → Return error: "No requirements to assess."
- **Requirements without text** → Skip and flag: "Requirement {id} has no text — cannot assess quality."
- **Unknown assessment scope** → Default to "full" with warning.

## Standards Compliance

### Artifact Output Standard
All deliverable outputs MUST have a canonical JSON representation.

### Confidence Standard
Quality scores are rubric-based assessments, not heuristic confidence labels. Scores reflect criteria matching, not model confidence.

### Standards References
- `docs/standards/CONTEXT_PASSING_STANDARDS.md`
- `docs/standards/TECH_STACK_STANDARDS.md`
- `docs/standards/tech-policy-matrix.yaml`
- `docs/standards/APPROVAL_REQUEST.md`
