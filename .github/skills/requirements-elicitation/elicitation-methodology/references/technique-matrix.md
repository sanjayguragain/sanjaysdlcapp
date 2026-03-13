# Elicitation Technique Selection Matrix

Guide for selecting the appropriate requirements elicitation technique based on context.

## Quick Selection Guide

| Situation | Primary Technique | Secondary Technique |
|-----------|------------------|---------------------|
| Direct stakeholder access | Interview | Domain research |
| Existing documentation | Document extraction | Gap analysis |
| Working solo | Stakeholder simulation | Domain research |
| Unfamiliar domain | Domain research | Document extraction |
| Regulatory requirements | Document extraction | Compliance persona |
| Validating completeness | Gap analysis | Stakeholder simulation |
| Technical constraints | Technical persona | Domain research |

## Technique Comparison

### Interviews

**Strengths:**

- Captures tacit knowledge
- Allows clarification
- Builds stakeholder relationships
- Explores unknown unknowns

**Weaknesses:**

- Time-intensive
- Requires stakeholder availability
- Interviewer bias possible
- Limited scalability

**Best for:**

- Complex domains
- Strategic requirements
- User-facing features
- Ambiguous situations

### Document Extraction

**Strengths:**

- Scalable to large documents
- Captures existing knowledge
- Consistent extraction
- Asynchronous operation

**Weaknesses:**

- Limited to documented knowledge
- May miss tacit requirements
- Document quality dependent
- Context may be lost

**Best for:**

- Regulatory compliance
- Legacy system migration
- Meeting transcript analysis
- Competitive analysis

### Stakeholder Simulation

**Strengths:**

- Available when stakeholders are not
- Multiple perspectives simultaneously
- Rapid iteration
- Conflict identification

**Weaknesses:**

- Based on assumptions
- May miss domain nuances
- Requires validation
- Less authentic than real stakeholders

**Best for:**

- Solo projects
- Early exploration
- Perspective validation
- Gap identification

### Domain Research

**Strengths:**

- Access to industry knowledge
- Current best practices
- Technology constraints
- Standards and regulations

**Weaknesses:**

- Generic, not project-specific
- May overwhelm with options
- Verification needed
- API/quota limits

**Best for:**

- New domains
- Technology selection
- Compliance requirements
- Competitive analysis

### Gap Analysis

**Strengths:**

- Systematic coverage check
- Identifies blind spots
- Validates completeness
- Prioritizes follow-up

**Weaknesses:**

- Requires initial requirements
- Checklist dependent
- May miss novel needs
- Can be mechanical

**Best for:**

- Requirement validation
- Pre-specification check
- Quality gate
- Audit preparation

## Combination Patterns

### Full Discovery (All Techniques)

```text
1. Domain Research → Understand the space
2. Document Extraction → Capture existing knowledge
3. Interviews → Explore with stakeholders
4. Stakeholder Simulation → Validate perspectives
5. Gap Analysis → Check completeness
```

### Solo Developer Pattern

```text
1. Domain Research → Build domain knowledge
2. Stakeholder Simulation → Generate perspectives
3. Gap Analysis → Validate coverage
4. Document Extraction → Supplement with docs
```

### Enterprise Pattern

```text
1. Document Extraction → Process existing artifacts
2. Interviews → Key stakeholder sessions
3. Domain Research → Technology/compliance
4. Gap Analysis → Formal validation
```

### Agile/Rapid Pattern

```text
1. Interviews (quick) → Core needs
2. Domain Research → Just-in-time knowledge
3. Gap Analysis (light) → Critical gaps only
```

## Effort vs Value Matrix

```text
HIGH VALUE
    ↑
    │  ┌─────────────────┐  ┌─────────────────┐
    │  │  Interviews     │  │  Stakeholder    │
    │  │  (high effort,  │  │  Simulation     │
    │  │   high value)   │  │  (med effort)   │
    │  └─────────────────┘  └─────────────────┘
    │
    │  ┌─────────────────┐  ┌─────────────────┐
    │  │  Document       │  │  Gap Analysis   │
    │  │  Extraction     │  │  (low effort,   │
    │  │  (med effort)   │  │   high value)   │
    │  └─────────────────┘  └─────────────────┘
    │
    │  ┌─────────────────┐
    │  │  Domain Research│
    │  │  (low effort)   │
    │  └─────────────────┘
    │
    └─────────────────────────────────────────→ LOW EFFORT
                                          HIGH EFFORT
```

## Autonomy Level Impact

| Technique | Guided | Semi-Auto | Full-Auto |
|-----------|--------|-----------|-----------|
| Interviews | Human leads, AI assists | AI leads with checkpoints | AI conducts fully |
| Document Extraction | Human selects docs | AI extracts, human reviews | AI extracts and validates |
| Stakeholder Simulation | Human guides personas | AI runs, human validates | AI runs fully |
| Domain Research | Human queries, AI searches | AI researches, human filters | AI researches and synthesizes |
| Gap Analysis | Human defines criteria | AI checks, human prioritizes | AI checks and prioritizes |

## Selection Decision Tree

```text
START
  │
  ├─ Do you have stakeholder access?
  │   ├─ YES → Use INTERVIEWS as primary
  │   │         └─ Supplement with DOMAIN RESEARCH
  │   │
  │   └─ NO → Do you have existing documents?
  │             ├─ YES → Use DOCUMENT EXTRACTION as primary
  │             │         └─ Supplement with STAKEHOLDER SIMULATION
  │             │
  │             └─ NO → Use STAKEHOLDER SIMULATION as primary
  │                       └─ Supplement with DOMAIN RESEARCH
  │
  └─ After initial elicitation:
       └─ Always run GAP ANALYSIS
            └─ Use results to guide follow-up techniques
```
