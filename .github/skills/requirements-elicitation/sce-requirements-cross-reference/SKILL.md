---
name: sce-requirements-cross-reference
description: "Bidirectional cross-reference of two requirement sets with semantic matching, coverage scoring, and gap identification. Compares Source A items against Source B items (and vice versa) to produce a structured gap analysis. Supports any combination: transcript vs BRD, BRD vs product docs, old requirements vs new requirements, workshop notes vs specifications."
metadata:
  version: 1.0.0
  author: Agent Skills Team
  category: requirements-elicitation
  tags:
    - gap-analysis
    - cross-reference
    - requirements-comparison
    - transcript-analysis
    - brd
    - coverage-scoring
  tools: ['Read', 'Search', 'Grep']
---

# SCE Requirements Cross-Reference

## Overview

Given two structured requirement sets (Source A and Source B), this skill performs a **bidirectional semantic cross-reference** — identifying what's in A but missing from B, what's in B but missing from A, what partially overlaps, and producing coverage scores with match rationale.

This is a **generative** skill: semantic matching between informally-expressed items (e.g., workshop transcript findings) and formally-written requirements (e.g., BRD) requires LLM reasoning, not simple string comparison. The skill provides structured methodology to guide that reasoning consistently.

## When to Use

**Keywords:** cross-reference, compare requirements, transcript vs BRD, gap analysis between documents, bidirectional comparison, coverage mapping, requirement traceability, workshop gaps

Invoke this skill when:

- Comparing workshop transcript findings against a BRD or requirements document
- Comparing a BRD against vendor/product documentation
- Cross-referencing old requirements vs new requirements after revision
- Building a traceability matrix between two requirement sources
- Identifying what was discussed in a meeting but not captured in formal requirements
- Identifying formal requirements that were never discussed with stakeholders

Do NOT use this skill when:

- Extracting requirements from a single document (use `document-extraction` skill)
- Checking a single requirement set for internal completeness (use `gap-analysis` skill)
- Evaluating requirement quality (use `sce-6cs-quality-framework` skill)
- Comparing code against requirements (different problem domain)

## Unitary Function

**ONE RESPONSIBILITY:** Take two pre-structured requirement sets and produce a bidirectional coverage map with semantic match rationale, gap identification, and scoring.

**NOT RESPONSIBLE FOR:**

- Extracting requirements from raw documents (caller must pre-extract using `document-extraction` or equivalent)
- Converting document formats (use `sce-document-markdown-converter` before this skill)
- Classifying document sections (use `sce-document-section-classifier` before this skill)
- Generating the final formatted report (use `sce-gap-analysis-report-generator` after this skill)
- Making build-vs-buy decisions (that's for the calling agent or human)

## Inputs

JSON input contract (provided by the calling agent):

```json
{
  "cross_reference_id": "XREF-uuid",
  "source_a": {
    "label": "Requirements Workshop Transcript (2026-03-05)",
    "type": "transcript|brd|product_doc|specification|meeting_notes|requirements_list",
    "items": [
      {
        "id": "A-001",
        "text": "The cleaned, normalized item text",
        "original_text": "Exact quote from source document",
        "source_location": "Section/page/timestamp/speaker reference",
        "category": "functional|non-functional|constraint|decision|action_item|concern|assumption",
        "priority": "mandatory|important|nice-to-have|unspecified",
        "context": "Optional additional context (e.g., speaker role, discussion thread)"
      }
    ]
  },
  "source_b": {
    "label": "BRD-internal-vibe-coding-contest v2.0",
    "type": "transcript|brd|product_doc|specification|meeting_notes|requirements_list",
    "items": [
      {
        "id": "B-001",
        "text": "The cleaned, normalized item text",
        "original_text": "Exact quote from source document",
        "source_location": "Section/page/requirement ID reference",
        "category": "functional|non-functional|constraint|decision|action_item|concern|assumption",
        "priority": "mandatory|important|nice-to-have|unspecified",
        "context": "Optional additional context (e.g., capability group, MVP tier)"
      }
    ]
  },
  "comparison_config": {
    "direction": "bidirectional|a_to_b|b_to_a",
    "match_threshold": "strict|moderate|loose",
    "priority_weighting": {
      "mandatory": 3,
      "important": 2,
      "nice-to-have": 1,
      "unspecified": 1
    },
    "flag_for_review_threshold": 0.5,
    "group_by": "category|priority|source_location|none"
  }
}
```

### Input Field Details

| Field | Required | Default | Description |
|---|---|---|---|
| `cross_reference_id` | No | Auto-generated UUID | Unique ID for traceability |
| `source_a.label` | Yes | — | Human-readable name for Source A |
| `source_a.type` | Yes | — | Document type for matching strategy selection |
| `source_a.items` | Yes | — | Pre-extracted structured items from Source A |
| `source_b.label` | Yes | — | Human-readable name for Source B |
| `source_b.type` | Yes | — | Document type for matching strategy selection |
| `source_b.items` | Yes | — | Pre-extracted structured items from Source B |
| `comparison_config.direction` | No | `bidirectional` | Which direction(s) to compare |
| `comparison_config.match_threshold` | No | `moderate` | How strict semantic matching should be |
| `comparison_config.flag_for_review_threshold` | No | `0.5` | Confidence below this triggers `needs_review` |

### Match Threshold Definitions

```yaml
match_thresholds:
  strict:
    description: "Items must address the same specific requirement with clear evidence"
    guidance: "Use when comparing formal documents (BRD vs BRD, spec vs spec)"
    semantic_similarity: "High — same domain concept, same scope, same intent"

  moderate:
    description: "Items address the same topic area with reasonable overlap"
    guidance: "Use when comparing formal vs informal sources (BRD vs transcript)"
    semantic_similarity: "Medium — same domain concept, may differ in scope or detail"

  loose:
    description: "Items are topically related even if scope or detail differs significantly"
    guidance: "Use when comparing very different source types (brainstorm notes vs specification)"
    semantic_similarity: "Low — related domain area, may be tangential"
```

## Method (Structured Generative Reasoning)

### Step 1: Source Normalization

Before comparison, normalize both item sets:

1. Ensure every item has a unique `id` (generate if missing)
2. Ensure `category` is assigned (infer from text if not provided)
3. Ensure `priority` is assigned (default to `unspecified` if not provided)
4. Count total items per source for statistics

```yaml
normalization_result:
  source_a:
    label: "{label}"
    total_items: {count}
    by_category: {functional: N, non-functional: N, ...}
    by_priority: {mandatory: N, important: N, ...}
  source_b:
    label: "{label}"
    total_items: {count}
    by_category: {functional: N, non-functional: N, ...}
    by_priority: {mandatory: N, important: N, ...}
```

### Step 2: A → B Mapping (Forward Pass)

For each item in Source A, find the best matching item(s) in Source B:

1. Read the Source A item text and context
2. Search Source B items for semantic matches
3. For each candidate match, assess:
   - **Semantic relevance**: Do they address the same requirement/topic?
   - **Scope alignment**: Same scope, or one is broader/narrower?
   - **Detail level**: Same detail, or one is more specific?
4. Classify the match:

```yaml
match_classification:
  full_match:
    description: "Source B item fully addresses the Source A item"
    symbol: "✅"
    confidence_range: "0.8 - 1.0"

  partial_match:
    description: "Source B item addresses some aspects but gaps remain"
    symbol: "⚠️"
    confidence_range: "0.5 - 0.79"
    requires: "gap description — what specifically is missing"

  weak_match:
    description: "Source B item is topically related but does not substantively address the Source A item"
    symbol: "🔶"
    confidence_range: "0.3 - 0.49"
    requires: "always flagged for human review"

  no_match:
    description: "No Source B item addresses this Source A item"
    symbol: "❌"
    confidence_range: "0.0 - 0.29"
    requires: "gap documented as unaddressed item"
```

5. Produce a mapping entry per Source A item:

```json
{
  "source_item_id": "A-001",
  "source_item_text": "We discussed needing single sign-on for enterprise customers",
  "source_item_category": "functional",
  "source_item_priority": "mandatory",
  "match_classification": "partial_match",
  "matched_items": [
    {
      "target_item_id": "B-012",
      "target_item_text": "The system shall support SAML 2.0 federated authentication",
      "match_confidence": 0.72,
      "match_rationale": "Both address enterprise SSO. Source A uses informal 'single sign-on' language; Source B specifies SAML 2.0 protocol. Source A implies broader SSO (could include OIDC, social login); Source B is narrower (SAML only).",
      "scope_comparison": "Source A is broader — mentions SSO generally; Source B specifies only SAML 2.0",
      "gaps_in_target": [
        "No mention of OIDC/OAuth 2.0 support discussed in workshop",
        "No mention of social login providers discussed in workshop"
      ]
    }
  ],
  "unmatched_aspects": [
    "OIDC/OAuth 2.0 support (discussed but not in BRD)",
    "Social login providers (discussed but not in BRD)"
  ],
  "needs_review": false
}
```

### Step 3: B → A Mapping (Reverse Pass)

Repeat Step 2 in the opposite direction: for each Source B item, find matches in Source A.

This pass identifies **Source B items that were never discussed/mentioned in Source A** — e.g., BRD requirements that stakeholders never validated in the workshop.

The output structure is identical to Step 2, with source and target swapped.

### Step 4: Coverage Scoring

Aggregate all mappings into coverage statistics:

```yaml
coverage_scoring:
  a_to_b:
    total_items: {count}
    full_match: {count}
    partial_match: {count}
    weak_match: {count}
    no_match: {count}
    coverage_percentage: {(full + partial) / total * 100}
    weighted_coverage_score: {weighted by priority}
    items_needing_review: {count}

  b_to_a:
    total_items: {count}
    full_match: {count}
    partial_match: {count}
    weak_match: {count}
    no_match: {count}
    coverage_percentage: {(full + partial) / total * 100}
    weighted_coverage_score: {weighted by priority}
    items_needing_review: {count}

  overall:
    bidirectional_coverage: "{average of both directions}"
    critical_gaps_count: "{mandatory items with no_match in either direction}"
    review_items_count: "{total items flagged for human review}"
```

**Weighted Coverage Formula:**

```
# Let each item i have:
#   - priority_i          (e.g., mandatory / important / nice-to-have / unspecified)
#   - weight_i            (numeric weight derived from priority_i via priority_weighting config)
#   - match_type_i        ∈ {full, partial, weak, none}
#   - match_factor_i      = 1.0 for full
#                         = 0.5 for partial
#                         = 0.1 for weak
#                         = 0.0 for none
#
# Then, over all items i in the direction being scored (A→B or B→A):
#
Weighted Coverage Score (%) = (
  Σ_i (match_factor_i × weight_i)
) / (
  Σ_i weight_i
) × 100
```

### Step 5: Gap Synthesis

Consolidate all gaps into actionable categories:

```yaml
gap_synthesis:
  in_a_not_in_b:
    description: "Items discussed/present in Source A but missing from Source B"
    interpretation: "{context-dependent — e.g., 'discussed in workshop but not captured in BRD'}"
    critical: [{id, text, priority}]
    non_critical: [{id, text, priority}]

  in_b_not_in_a:
    description: "Items in Source B but never mentioned in Source A"
    interpretation: "{context-dependent — e.g., 'in BRD but never discussed with stakeholders'}"
    critical: [{id, text, priority}]
    non_critical: [{id, text, priority}]

  partial_coverage:
    description: "Items with partial matches — some aspects covered, others missing"
    items: [{source_id, target_id, gaps_identified: [...]}]

  conflicting:
    description: "Items where Source A and Source B appear to contradict each other"
    items: [{a_id, b_id, conflict_description}]

  ambiguous:
    description: "Items where match determination requires human judgment"
    items: [{id, text, reason_for_ambiguity}]
```

## Outputs

### Primary Output (JSON-first)

```json
{
  "generated_by": {
    "skill": "sce-requirements-cross-reference",
    "version": "1.0.0"
  },
  "cross_reference_id": "XREF-uuid",
  "timestamp": "ISO-8601",
  "inputs_summary": {
    "source_a": {
      "label": "string",
      "type": "string",
      "total_items": 0
    },
    "source_b": {
      "label": "string",
      "type": "string",
      "total_items": 0
    },
    "comparison_config": {
      "direction": "bidirectional",
      "match_threshold": "moderate"
    }
  },
  "a_to_b_mappings": [
    {
      "source_item_id": "A-001",
      "source_item_text": "string",
      "source_item_category": "functional",
      "source_item_priority": "mandatory",
      "match_classification": "full_match|partial_match|weak_match|no_match",
      "matched_items": [
        {
          "target_item_id": "B-012",
          "target_item_text": "string",
          "match_confidence": 0.0,
          "match_rationale": "string",
          "scope_comparison": "string",
          "gaps_in_target": ["string"]
        }
      ],
      "unmatched_aspects": ["string"],
      "needs_review": false
    }
  ],
  "b_to_a_mappings": [
    {
      "source_item_id": "B-001",
      "source_item_text": "string",
      "source_item_category": "functional",
      "source_item_priority": "mandatory",
      "match_classification": "full_match|partial_match|weak_match|no_match",
      "matched_items": [
        {
          "target_item_id": "A-005",
          "target_item_text": "string",
          "match_confidence": 0.0,
          "match_rationale": "string",
          "scope_comparison": "string",
          "gaps_in_target": ["string"]
        }
      ],
      "unmatched_aspects": ["string"],
      "needs_review": false
    }
  ],
  "coverage": {
    "a_to_b": {
      "total_items": 0,
      "full_match": 0,
      "partial_match": 0,
      "weak_match": 0,
      "no_match": 0,
      "coverage_percentage": 0.0,
      "weighted_coverage_score": 0.0,
      "items_needing_review": 0
    },
    "b_to_a": {
      "total_items": 0,
      "full_match": 0,
      "partial_match": 0,
      "weak_match": 0,
      "no_match": 0,
      "coverage_percentage": 0.0,
      "weighted_coverage_score": 0.0,
      "items_needing_review": 0
    },
    "overall": {
      "bidirectional_coverage": 0.0,
      "critical_gaps_count": 0,
      "review_items_count": 0
    }
  },
  "gap_synthesis": {
    "in_a_not_in_b": {
      "description": "string",
      "interpretation": "string",
      "critical": [],
      "non_critical": []
    },
    "in_b_not_in_a": {
      "description": "string",
      "interpretation": "string",
      "critical": [],
      "non_critical": []
    },
    "partial_coverage": [],
    "conflicting": [],
    "ambiguous": []
  },
  "confidence": {
    "method": "token_logprob",
    "logprobs_available": false,
    "status": "needs_review",
    "rationale": "Semantic matching is generative — all match classifications should be validated by a human reviewer"
  }
}
```

## Usage Examples

### Example 1: Workshop Transcript vs BRD

```
Agent (Document Miner):
  1. Extract items from workshop transcript → Source A items
  2. Extract items from BRD → Source B items
  3. Invoke sce-requirements-cross-reference with:
     - source_a: transcript items (type: "transcript")
     - source_b: BRD items (type: "brd")
     - direction: "bidirectional"
     - match_threshold: "moderate" (informal vs formal text)

Result interpretation:
  - in_a_not_in_b = "Discussed in workshop but not in BRD" → BRD needs updating
  - in_b_not_in_a = "In BRD but never discussed" → Stakeholders may not have validated these
  - partial_coverage = "Partially aligned" → BRD may need refinement
```

### Example 2: BRD vs Vendor Product Documentation

```
Agent (Product Gap Analyzer):
  1. Extract requirements from BRD → Source A items
  2. Extract capabilities from product doc → Source B items
  3. Invoke sce-requirements-cross-reference with:
     - source_a: BRD requirements (type: "brd")
     - source_b: product capabilities (type: "product_doc")
     - direction: "a_to_b" (only care if product covers BRD needs)
     - match_threshold: "strict" (formal vs formal)

Result interpretation:
  - no_match items = "Product cannot satisfy these requirements"
  - partial_match items = "Product partially covers — customization needed"
```

### Example 3: Requirements Traceability Matrix

```
Agent (Test Strategy Planner):
  1. Extract requirements → Source A items
  2. Extract test cases → Source B items
  3. Invoke sce-requirements-cross-reference with:
     - source_a: requirements (type: "requirements_list")
     - source_b: test cases (type: "requirements_list")
     - direction: "a_to_b" (which requirements have tests?)
     - match_threshold: "moderate"

Result interpretation:
  - no_match items = "Requirements without test coverage"
  - coverage_percentage = "Test traceability score"
```

### Example 4: Standards Comparison

```
Agent (Standards Gap Analyzer):
  1. Extract decisions from new standards doc → Source A items
  2. Extract existing policies from tech-policy-matrix → Source B items
  3. Invoke sce-requirements-cross-reference with:
     - source_a: new standards (type: "specification")
     - source_b: existing policies (type: "specification")
     - direction: "a_to_b" (what's new vs what exists?)
     - match_threshold: "strict"

Result interpretation:
  - no_match items = "New standards not yet in policy matrix"
  - conflicting items = "Standards that contradict existing policies"
```

## Quality Safeguards

### Human Review Triggers

The following conditions MUST flag items for `needs_review: true`:

1. **Low confidence match** — Match confidence below `flag_for_review_threshold`
2. **One-to-many mapping** — One source item matches 3+ target items (may indicate overly broad item)
3. **Conflicting matches** — Source item appears to match contradictory target items
4. **Category mismatch** — Items match semantically but belong to different categories (e.g., functional requirement matched to a non-functional constraint)
5. **Priority escalation** — A `mandatory` item has only a `weak_match`

### Match Rationale Requirements

Every match entry MUST include:

- **`match_rationale`**: 1-2 sentences explaining WHY the items match (what semantic concepts connect them)
- **`scope_comparison`**: Whether source is broader/narrower/equivalent to target
- **`gaps_in_target`**: Specific aspects of the source item NOT covered by the target match

This ensures human reviewers can validate match quality without re-reading source documents.

## Error Handling

- **Empty source set** → Return empty mappings with 0% coverage; note in output
- **Single item in a source** → Process normally; coverage stats still valid
- **No matches found in entire comparison** → Return 0% coverage; flag entire comparison for review
- **Duplicate items in a source** → Deduplicate by text similarity before comparison; note deduplication in output
- **Missing required fields** → Infer where possible (category from text, priority defaults to `unspecified`); note inferences in output
