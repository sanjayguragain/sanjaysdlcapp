---
name: sce-dora-metrics-calculator
description: "Calculates DORA (DevOps Research and Assessment) performance metrics from GitHub data: Deployment Frequency, Lead Time for Changes, Change Failure Rate, and Mean Time to Restore. Consumes PR data, commit history, and release data to produce normalized DORA scores with performance band classifications (Elite/High/Medium/Low)."
metadata:
  version: 1.0.0
  author: Agent Skills Team
  category: devops
  tags:
    - dora
    - metrics
    - devops
    - deployment-frequency
    - lead-time
    - change-failure-rate
    - mttr
  tools: ['Read', 'Search']
---

# SCE DORA Metrics Calculator

## Overview

Given GitHub activity data (PRs, commits, releases), this skill calculates the four DORA metrics and classifies performance against industry benchmarks. Results are JSON-first with performance band classifications.

This skill is a **calculation engine** — it does not collect data. The consuming agent is responsible for data collection (via `gh` CLI or GitHub API) and passing structured data to this skill.

## When to Use

- Generating developer or team status reports that include DORA metrics
- Evaluating CI/CD pipeline effectiveness
- Quality assessment reports that need deployment health metrics
- Sprint retrospectives requiring quantitative DevOps health data

## When NOT to Use

- Collecting raw data from GitHub (agent responsibility)
- Setting up CI/CD pipelines (use DevOps Workflow Agent)
- Non-GitHub source control systems (metrics formulas assume GitHub PR model)

## Inputs

```json
{
  "time_period": {
    "start_date": "ISO-8601",
    "end_date": "ISO-8601",
    "days": 14
  },
  "pr_data": [
    {
      "number": 1,
      "title": "PR title",
      "state": "merged|closed|open",
      "createdAt": "ISO-8601",
      "mergedAt": "ISO-8601 or null",
      "closedAt": "ISO-8601 or null",
      "additions": 0,
      "deletions": 0,
      "changedFiles": 0,
      "labels": []
    }
  ],
  "release_data": [
    {
      "tag": "v1.0.0",
      "published_at": "ISO-8601",
      "is_prerelease": false
    }
  ],
  "commit_data": [
    {
      "hash": "abc1234",
      "date": "ISO-8601",
      "message": "commit message"
    }
  ]
}
```

## Method

### Step 1: Deployment Frequency

Count production deployments per unit time:

```
deployment_frequency = merged_prs_count / days_in_period
```

**Assumption:** This formula treats each merged PR as a production deployment. In organizations where PRs do not map 1:1 to deployments, prefer basing this metric on `release_data` (count of non-prerelease releases in the period) instead.

**Data source:** PRs merged within the time period (state = "merged", mergedAt within range), or releases published in the period

**Performance bands:**
| Band | Threshold |
|------|-----------|
| Elite | Multiple deploys per day (> 1.0/day) |
| High | Between once per day and once per week (0.14–1.0/day) |
| Medium | Between once per week and once per month (0.03–0.14/day) |
| Low | Less than once per month (< 0.03/day) |

### Step 2: Lead Time for Changes

Average PR cycle time (from PR creation to merge):

```
lead_time = average(mergedAt - createdAt) for all merged PRs
```

**Note:** This measures PR cycle time (creation to merge), not the full DORA definition of commit-to-deploy. To approximate true lead time, correlate PRs with releases from `release_data` when available.

**Data source:** PR `createdAt` and `mergedAt` timestamps for merged PRs

**Performance bands:**
| Band | Threshold |
|------|-----------|
| Elite | Less than one hour |
| High | Between one day and one week |
| Medium | Between one week and one month |
| Low | More than one month |

### Step 3: Change Failure Rate

Percentage of deployments that result in a failure requiring remediation:

```
change_failure_rate = fix_prs_count / total_merged_prs_count * 100
```

**Fix PR detection heuristics** (match any):
- PR title contains: `fix`, `hotfix`, `bugfix`, `revert`, `rollback`, `patch`
- PR labels contain: `bug`, `hotfix`, `incident`, `regression`
- PR is a revert of another merged PR

**Performance bands:**
| Band | Threshold |
|------|-----------|
| Elite | 0–5% |
| High | 5–10% |
| Medium | 10–15% |
| Low | > 15% |

### Step 4: Mean Time to Restore (MTTR)

Average time to recover from a failure:

```
mttr = average(fix_pr_mergedAt - fix_pr_createdAt) for fix PRs
```

**Data source:** Cycle time of PRs identified as fixes in Step 3

**Performance bands:**
| Band | Threshold |
|------|-----------|
| Elite | Less than one hour |
| High | Less than one day |
| Medium | Between one day and one week |
| Low | More than one week |

### Step 5: Overall DORA Score

Aggregate band classification:

```
overall_band = mode(df_band, lt_band, cfr_band, mttr_band)
```

If no mode exists (all different), use the lowest band as the overall classification.

## Output

```json
{
  "generated_by": {
    "skill": "sce-dora-metrics-calculator",
    "version": "1.0.0"
  },
  "time_period": {
    "start": "ISO-8601",
    "end": "ISO-8601",
    "days": 14
  },
  "metrics": {
    "deployment_frequency": {
      "value": 0.0,
      "unit": "deploys/day",
      "band": "elite|high|medium|low",
      "raw_count": 0
    },
    "lead_time_for_changes": {
      "value": 0.0,
      "unit": "hours",
      "band": "elite|high|medium|low",
      "samples": 0
    },
    "change_failure_rate": {
      "value": 0.0,
      "unit": "percent",
      "band": "elite|high|medium|low",
      "fix_prs": 0,
      "total_prs": 0
    },
    "mean_time_to_restore": {
      "value": 0.0,
      "unit": "hours",
      "band": "elite|high|medium|low",
      "samples": 0
    }
  },
  "overall_band": "elite|high|medium|low",
  "data_quality": {
    "pr_count": 0,
    "release_count": 0,
    "commit_count": 0,
    "insufficient_data_warnings": []
  }
}
```

## Data Quality Warnings

Flag insufficient data when:
- Fewer than 5 merged PRs → `"Deployment Frequency may be unreliable (< 5 data points)"`
- Zero fix PRs detected → `"Change Failure Rate is 0% — verify fix PR detection heuristics"`
- Time period < 7 days → `"Short time period may not reflect typical performance"`

## Error Handling

- **No PR data provided** → Return error: "No PR data to calculate metrics from."
- **No merged PRs in period** → All metrics return 0 with warning: "No merged PRs found in time period."
- **Missing timestamps** → Skip affected PRs, note in `insufficient_data_warnings`

## Standards Compliance

### Artifact Output Standard
All deliverable outputs MUST have a canonical JSON representation.

### Confidence Standard
Do NOT output heuristic confidence labels. Metric values are calculated from data; performance bands are benchmark-based classifications, not confidence assessments.

### Standards References
- `docs/standards/CONTEXT_PASSING_STANDARDS.md`
- `docs/standards/TECH_STACK_STANDARDS.md`
- `docs/standards/tech-policy-matrix.yaml`
- `docs/standards/APPROVAL_REQUEST.md`
