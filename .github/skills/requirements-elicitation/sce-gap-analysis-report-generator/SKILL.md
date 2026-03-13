---
name: sce-gap-analysis-report-generator
description: "Generates standardized gap analysis reports from cross-reference results, coverage data, and gap findings. Produces JSON-first reports with Markdown companions including executive summaries, coverage statistics, critical gap highlights, and prioritized recommendations. Supports multiple report types: product-vs-BRD, requirements completeness, standards comparison, and traceability."
metadata:
  version: 1.0.0
  author: Agent Skills Team
  category: requirements-elicitation
  tags:
    - gap-analysis
    - reporting
    - coverage
    - recommendations
  tools: ['Read', 'Search', 'Write']
---

# SCE Gap Analysis Report Generator

## Overview

Given gap analysis data (from cross-reference results, coverage calculations, or completeness assessments), this skill produces standardized reports in JSON + Markdown format. The skill is a **report formatter** — it does not perform the analysis itself. Consuming agents provide the analysis data; this skill structures it into consistent, readable reports.

## When to Use

- After `sce-requirements-cross-reference` produces mapping results that need report formatting
- After completeness analysis identifies missing requirement categories
- After product-vs-BRD mapping produces coverage statistics
- Any workflow that produces gap findings needing a structured report

## When NOT to Use

- The analysis hasn't been performed yet (use the analysis skill/agent first)
- A simple list of gaps suffices (no formal report needed)
- The consuming agent already has a complete, domain-specific report format that differs significantly from this standard

## Inputs

```json
{
  "report_type": "product_gap|completeness_gap|standards_gap|traceability",
  "metadata": {
    "title": "Report title",
    "date": "ISO-8601",
    "source_a": "Source A name (e.g., BRD)",
    "source_b": "Source B name (e.g., Product Documentation)",
    "analyst": "Agent or skill name that performed analysis"
  },
  "coverage_data": {
    "total_items": 0,
    "by_coverage": {
      "full_match": 0,
      "partial_match": 0,
      "weak_match": 0,
      "no_match": 0
    },
    "overall_score": 0.0,
    "weighted_score": 0.0
  },
  "gaps": [
    {
      "id": "GAP-001",
      "source_item_id": "FR-001",
      "source_item_text": "Requirement text",
      "severity": "critical|major|minor",
      "category": "Category name",
      "description": "What is missing or mismatched",
      "evidence": "Supporting evidence or lack thereof",
      "recommendation": "Suggested action"
    }
  ],
  "mappings": [],
  "priority_breakdown": {}
}
```

## Method

### Step 1: Report Structure Selection

Based on `report_type`, select the appropriate report template:

| Report Type | Sections Included |
|-------------|-------------------|
| `product_gap` | Executive Summary, Coverage Matrix, Document Classification, Detailed Mappings, Critical Gaps, Fitness Score, Recommendations |
| `completeness_gap` | Executive Summary, Category Coverage, NFR Analysis, Severity Distribution, Gap Details, Elicitation Recommendations |
| `standards_gap` | Executive Summary, Standards Comparison, Gap Validation, Confidence Scores, YAML Update Proposals |
| `traceability` | Executive Summary, Forward Traceability (A→B), Reverse Traceability (B→A), Orphan Analysis, Coverage Matrix |

### Step 2: Executive Summary Generation

Produce a concise summary block:

```markdown
## Executive Summary

- **Overall Coverage Score:** {percentage}%
- **Weighted Score:** {weighted_percentage}% (if applicable)
- **Total Items Analyzed:** {count}
- **Critical Gaps:** {count}
- **Items Needing Review:** {count}

| Coverage Level | Count | Percentage |
|----------------|-------|------------|
| ✅ Full | {n} | {pct}% |
| ⚠️ Partial | {n} | {pct}% |
| ❌ No Coverage | {n} | {pct}% |
| ❓ Unclear | {n} | {pct}% |
```

### Step 3: Gap Detail Formatting

For each gap, format consistently:

```markdown
### {GAP-ID}: {Category} — {Short Description}
- **Severity:** {Critical/Major/Minor}
- **Source Item:** {ID} — "{text}"
- **Description:** {what is missing}
- **Evidence:** {supporting detail}
- **Recommendation:** {suggested action}
```

Order gaps by: severity (critical first), then category, then ID.

### Step 4: Recommendations Synthesis

Group gaps by category and generate actionable recommendations:

```markdown
## Recommendations

### Critical (Must Address)
1. **{Category}:** {recommendation} — Addresses {GAP-IDs}
   - Effort: {estimate if available}
   - Technique: {interview|research|simulation|document review}

### Major (Should Address)
...

### Minor (Optional)
...
```

### Step 5: Output File Generation

- JSON report → `docs/GAD/{report-name}.json`
- Markdown report → `docs/GAD/{report-name}.md`

File naming: `GAD-{source_a_abbrev}-vs-{source_b_abbrev}-{date}.{ext}`

## Output

```json
{
  "generated_by": {
    "skill": "sce-gap-analysis-report-generator",
    "version": "1.0.0"
  },
  "report_type": "product_gap|completeness_gap|standards_gap|traceability",
  "metadata": {
    "title": "Gap Analysis Report",
    "date": "ISO-8601",
    "source_a": "Source A",
    "source_b": "Source B"
  },
  "executive_summary": {
    "overall_coverage_score": 0.0,
    "weighted_score": 0.0,
    "total_items": 0,
    "critical_gaps_count": 0,
    "review_needed_count": 0
  },
  "coverage_matrix": {
    "full_match": { "count": 0, "percentage": 0.0 },
    "partial_match": { "count": 0, "percentage": 0.0 },
    "weak_match": { "count": 0, "percentage": 0.0 },
    "no_match": { "count": 0, "percentage": 0.0 }
  },
  "gaps_by_severity": {
    "critical": [],
    "major": [],
    "minor": []
  },
  "recommendations": [],
  "output_files": {
    "json": "docs/GAD/report.json",
    "markdown": "docs/GAD/report.md"
  }
}
```

## Error Handling

- **No gaps provided** → Generate report with "No gaps identified" and full coverage summary
- **Missing coverage data** → Calculate from mappings if available; otherwise flag as "Coverage data not provided"
- **Unknown report type** → Return error with list of supported report types
- **Empty metadata** → Use defaults: title = "Gap Analysis Report", date = current, source labels = "Source A"/"Source B"

## Standards Compliance

### Artifact Output Standard
All deliverable outputs MUST have a canonical JSON representation with a Markdown companion.

### Confidence Standard
Do NOT output heuristic confidence labels. Coverage scores are calculated from data.

### Standards References
- `docs/standards/CONTEXT_PASSING_STANDARDS.md`
- `docs/standards/TECH_STACK_STANDARDS.md`
- `docs/standards/tech-policy-matrix.yaml`
- `docs/standards/APPROVAL_REQUEST.md`
