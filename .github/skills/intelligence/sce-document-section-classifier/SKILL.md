---
name: sce-document-section-classifier
description: "Classifies document sections by type (marketing, functional, technical, configuration, pricing, support, preamble, procedural) using indicator-based heuristics. Determines which sections should be included as evidence sources vs excluded. Supports configurable classification taxonomies for different document domains (product docs, standards, specifications)."
metadata:
  version: 1.0.0
  author: Agent Skills Team
  category: intelligence
  tags:
    - document-analysis
    - section-classification
    - evidence-filtering
    - content-triage
  tools: ['Read', 'Search']
---

# SCE Document Section Classifier

## Overview

Given a document converted to markdown (via markitdown or equivalent), this skill classifies each section by content type and determines its suitability as an evidence source. Classification drives downstream processing — agents use the classification to filter which sections to search for evidence vs which to skip.

This skill is generative: it interprets section content semantically to assign classifications. Ambiguous sections are flagged for human review.

## When to Use

- Before mapping requirements to product documentation (filter marketing from functional)
- Before extracting requirements from mixed documents (skip boilerplate, focus on specification content)
- Before analyzing standards documents (identify decision-bearing sections vs preamble)
- Any workflow where document sections need content-type triage

## When NOT to Use

- Document is already structured with clear section types (e.g., formal SRS with numbered requirements)
- Single-section documents (no meaningful subdivision)
- Non-text documents (images, diagrams — use OCR first)

## Inputs

```json
{
  "document": {
    "path": "path/to/document.md",
    "title": "Document title",
    "source_format": "pdf|docx|html|markdown"
  },
  "taxonomy": "product|standards|specification|custom",
  "custom_taxonomy": {
    "categories": {},
    "evidence_rules": {}
  }
}
```

## Built-in Taxonomies

### Product Documentation Taxonomy (`taxonomy: "product"`)

```yaml
section_classifications:
  marketing:
    description: "Executive overviews, sales messaging, customer testimonials, market positioning"
    indicators:
      - Superlative language ("industry-leading", "best-in-class", "revolutionary")
      - Customer success stories or testimonials
      - Market positioning or competitive claims
      - Vague capability statements without configuration detail
      - ROI projections without methodology
    evidence_role: "EXCLUDED — documented as excluded with reason"

  functional:
    description: "Feature descriptions, capability specifications, workflow documentation"
    indicators:
      - Specific feature names with described behavior
      - User workflow descriptions (step-by-step)
      - Input/output specifications
      - Screen or interface descriptions
      - API endpoint documentation
    evidence_role: "PRIMARY evidence source"

  technical:
    description: "Architecture, integrations, data models, deployment requirements"
    indicators:
      - System architecture or component diagrams
      - Integration protocols (REST, SOAP, SFTP)
      - Data model or schema descriptions
      - Infrastructure requirements
      - Security architecture
    evidence_role: "PRIMARY evidence source"

  configuration:
    description: "Setup instructions, admin settings, customization options"
    indicators:
      - Configuration parameters or settings
      - Admin console workflows
      - Customization capabilities and limits
      - Tenant/environment setup procedures
    evidence_role: "PRIMARY evidence source — strongest evidence of actual capability"

  pricing:
    description: "Licensing models, tier comparisons, add-on pricing"
    indicators:
      - Price tables or tier descriptions
      - Feature-by-tier matrices
      - Licensing terms
    evidence_role: "CONTEXTUAL — used for feasibility notes, not capability evidence"

  support:
    description: "SLA definitions, support tiers, maintenance windows"
    indicators:
      - Support tier descriptions
      - SLA tables
      - Maintenance schedules
      - Escalation procedures
    evidence_role: "CONTEXTUAL — used for operational requirement mapping"
```

### Standards Document Taxonomy (`taxonomy: "standards"`)

```yaml
section_classifications:
  preamble:
    description: "Introduction, scope, purpose, revision history"
    indicators:
      - "Purpose of this document"
      - Version history tables
      - Scope and audience descriptions
      - Acronym/glossary sections
    evidence_role: "EXCLUDED — contextual background only"

  normative:
    description: "Mandatory requirements, standards, policies"
    indicators:
      - "shall", "must", "required" language
      - Policy statements with enforcement implications
      - Version constraints or technology mandates
      - Compliance requirements
    evidence_role: "PRIMARY — contains actual standards decisions"

  informative:
    description: "Guidance, recommendations, best practices"
    indicators:
      - "should", "recommended", "consider" language
      - Best practice suggestions
      - Implementation guidance without mandates
    evidence_role: "SECONDARY — may suggest gaps but not mandates"

  procedural:
    description: "How-to instructions, processes, workflows"
    indicators:
      - Step-by-step instructions
      - Process flow descriptions
      - Decision trees or flowcharts
    evidence_role: "CONTEXTUAL — implementation detail, not decisions"

  reference:
    description: "External references, links, citations"
    indicators:
      - Bibliography or reference lists
      - External standard citations (ISO, NIST)
      - URL collections
    evidence_role: "EXCLUDED — not original content"
```

### Specification Document Taxonomy (`taxonomy: "specification"`)

```yaml
section_classifications:
  requirements:
    description: "Explicit requirements with testable acceptance criteria"
    indicators:
      - Requirement IDs (REQ-nnn, FR-nnn)
      - "shall", "must" statements
      - Acceptance criteria blocks
      - User stories with AC
    evidence_role: "PRIMARY — direct requirement content"

  design:
    description: "Architecture and design decisions"
    indicators:
      - Architecture diagrams
      - Component descriptions
      - Interface definitions
      - Design rationale
    evidence_role: "PRIMARY — design context for requirements"

  constraints:
    description: "Technical and business constraints"
    indicators:
      - Platform requirements
      - Budget or timeline references
      - Regulatory mentions
    evidence_role: "PRIMARY — constraint requirements"

  narrative:
    description: "Background, context, stakeholder descriptions"
    indicators:
      - Problem statements
      - User persona descriptions
      - Business context
    evidence_role: "CONTEXTUAL — informs interpretation"
```

## Method

### Step 1: Section Identification

Parse the markdown document into sections using heading hierarchy:
- H1 (`#`) = Major section
- H2 (`##`) = Sub-section
- H3+ (`###`) = Detail section

For each section, extract:
- Section ID (sequential: `SEC-001`, `SEC-002`, ...)
- Heading text
- Content (text between this heading and the next heading of same or higher level)
- Word count
- Heading level

### Step 2: Indicator Matching

For each section, apply the selected taxonomy's indicators:

1. Scan content for indicator matches
2. Count matching indicators per category
3. Assign the category with the most indicator matches
4. If tied or no matches exceed threshold, classify as `ambiguous`

**Minimum confidence threshold:** At least 2 indicator matches required for classification. Sections with 0-1 matches are classified as `ambiguous` and flagged for review.

### Step 3: Evidence Role Assignment

Based on classification, assign the evidence role from the taxonomy:
- `PRIMARY` — Include in evidence searches
- `SECONDARY` — Include with lower weight
- `CONTEXTUAL` — Include for context but not as primary evidence
- `EXCLUDED` — Skip in evidence searches, document reason

### Step 4: Classification Summary

Produce aggregate statistics and the section-by-section classification.

## Output

```json
{
  "generated_by": {
    "skill": "sce-document-section-classifier",
    "version": "1.0.0"
  },
  "document": {
    "path": "path/to/document.md",
    "title": "Document title",
    "total_sections": 0,
    "total_words": 0
  },
  "taxonomy_used": "product|standards|specification|custom",
  "classification_summary": {
    "by_category": {
      "functional": { "count": 0, "word_count": 0 },
      "marketing": { "count": 0, "word_count": 0 }
    },
    "by_evidence_role": {
      "PRIMARY": 0,
      "SECONDARY": 0,
      "CONTEXTUAL": 0,
      "EXCLUDED": 0
    },
    "ambiguous_count": 0
  },
  "sections": [
    {
      "section_id": "SEC-001",
      "heading": "Section heading",
      "level": 2,
      "word_count": 0,
      "classification": "functional",
      "evidence_role": "PRIMARY",
      "indicator_matches": ["feature names with behavior", "step-by-step workflow"],
      "confidence": "high|medium|ambiguous"
    }
  ],
  "excluded_sections": [
    {
      "section_id": "SEC-003",
      "heading": "Why Our Customers Love Us",
      "classification": "marketing",
      "reason": "Superlative language and testimonials — no functional detail"
    }
  ],
  "review_needed": [
    {
      "section_id": "SEC-007",
      "heading": "Platform Overview",
      "reason": "Mixed indicators — contains both marketing language and technical details"
    }
  ]
}
```

## Error Handling

- **Document not in markdown** → Return error: "Document must be converted to markdown first. Use markitdown or equivalent converter."
- **No sections found** → Treat entire document as one section. Classify based on overall content.
- **Unknown taxonomy** → Return error with list of supported taxonomies.
- **All sections ambiguous** → Flag document as "difficult to classify — may need domain-specific taxonomy" and return best-effort classifications.

## Standards Compliance

### Artifact Output Standard
All deliverable outputs MUST have a canonical JSON representation.

### Confidence Standard
Do NOT output heuristic confidence labels for the overall result. Section-level confidence reflects indicator match strength (high = 3+ matches, medium = 2 matches, ambiguous = 0-1 matches).

### Standards References
- `docs/standards/CONTEXT_PASSING_STANDARDS.md`
- `docs/standards/TECH_STACK_STANDARDS.md`
- `docs/standards/tech-policy-matrix.yaml`
- `docs/standards/APPROVAL_REQUEST.md`
