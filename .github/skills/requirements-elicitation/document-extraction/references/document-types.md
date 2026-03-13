# Document Types Reference

Detailed guidance for extracting requirements from different document types.

## Document Type Matrix

| Document Type | Requirement Density | Confidence | Extraction Difficulty |
|--------------|--------------------|-----------|-----------------------|
| Formal SRS | High | High | Low |
| User Stories | High | High | Low |
| Meeting Transcripts | Medium | Medium | Medium |
| Email Threads | Low | Low | High |
| Regulatory Docs | High | High | Medium |
| Competitor Analysis | Medium | Low | Medium |
| Technical Specs | Medium | High | Medium |
| User Manuals | Low | Medium | High |

## Formal Specifications (SRS, PRD)

### Characteristics

```yaml
document_profile:
  structure: Highly structured with sections
  language: Formal, technical
  requirement_markers: Explicit (shall, must, will)
  numbering: Usually numbered (REQ-001, 1.1.1)
  confidence: High
```

### Extraction Strategy

```text
1. Parse document structure (headings, sections)
2. Identify requirement sections (Functional, NFR, Constraints)
3. Extract numbered/marked requirements directly
4. Preserve original numbering
5. Map to categories based on section
```

### Pattern Examples

```text
Explicit Markers:
- "REQ-001: The system shall..."
- "3.1.1 The application must..."
- "[M] Users shall be able to..."  (M=Mandatory)

Section Headers:
- "Functional Requirements"
- "Non-Functional Requirements"
- "System Constraints"
```

## User Stories and Acceptance Criteria

### Characteristics

```yaml
document_profile:
  structure: Card format (As a, I want, So that)
  language: User-focused, informal
  requirement_markers: Story format, Given/When/Then
  numbering: Story IDs (US-001, STORY-123)
  confidence: High
```

### Extraction Strategy

```text
1. Identify story format patterns
2. Extract "I want" as functional requirement
3. Extract "So that" as business value/context
4. Parse acceptance criteria as detailed requirements
5. Convert Given/When/Then to requirements
```

### Pattern Examples

```text
User Story:
"As a [user], I want [capability] so that [benefit]"
→ Extract: "[User] shall be able to [capability]"

Acceptance Criteria:
"Given [context], When [action], Then [outcome]"
→ Extract: "When [action] occurs, system shall [outcome]"
```

## Meeting Transcripts

### Characteristics

```yaml
document_profile:
  structure: Chronological, conversational
  language: Informal, contextual
  requirement_markers: Implicit, scattered
  numbering: Usually none
  confidence: Medium (requires interpretation)
```

### Extraction Strategy

```text
1. Identify speakers and roles
2. Look for decision points
3. Extract action items
4. Find requirement discussions
5. Note context around each extraction
6. Flag for validation
```

### Pattern Examples

```text
Decision Markers:
- "We decided that..."
- "The conclusion is..."
- "Going forward, we will..."

Action Items:
- "Action: [name] will..."
- "TODO: ..."
- "We need to..."

Requirement Discussions:
- "The requirement should be..."
- "Users expect..."
- "It must handle..."
```

### Speaker Weighting

```yaml
speaker_weights:
  product_owner: high
  technical_lead: high
  stakeholder: high
  developer: medium
  unknown: low
```

## Regulatory Documents

### Characteristics

```yaml
document_profile:
  structure: Legal structure with sections
  language: Formal, precise, legal
  requirement_markers: Mandatory (shall, must not)
  numbering: Legal section numbers
  confidence: High (but interpretation needed)
```

### Extraction Strategy

```text
1. Identify scope/applicability sections
2. Extract "shall" requirements (mandatory)
3. Extract "shall not" prohibitions
4. Note conditional requirements ("where applicable")
5. Track section references for traceability
6. Flag interpretation-dependent items
```

### Pattern Examples

```text
Mandatory:
- "Organizations shall implement..."
- "The controller must ensure..."

Prohibitions:
- "Personal data shall not be processed..."
- "Systems must not store..."

Conditional:
- "Where technically feasible, the system shall..."
- "If processing special categories, the controller shall..."
```

## Competitor Analysis

### Characteristics

```yaml
document_profile:
  structure: Feature lists, comparisons
  language: Marketing, feature-focused
  requirement_markers: Feature descriptions
  numbering: None or informal
  confidence: Low (external observation)
```

### Extraction Strategy

```text
1. Identify feature descriptions
2. Convert features to capability requirements
3. Note as "competitor has" not "we need"
4. Mark for validation (may not be accurate)
5. Identify differentiation opportunities
```

### Pattern Examples

```text
Feature Descriptions:
- "Enables users to..." → "[System] shall enable users to..."
- "Supports..." → "[System] shall support..."
- "Integrates with..." → "[System] shall integrate with..."

Gap Identification:
- Feature present in competitor but not us → Potential requirement
- Feature absent from all competitors → Differentiation opportunity
```

## Technical Specifications

### Characteristics

```yaml
document_profile:
  structure: Technical sections, diagrams
  language: Technical, precise
  requirement_markers: Interface definitions, constraints
  numbering: Often numbered
  confidence: High for technical requirements
```

### Extraction Strategy

```text
1. Extract interface requirements
2. Identify performance specifications
3. Note technical constraints
4. Extract integration points
5. Map to non-functional categories
```

### Pattern Examples

```text
Performance:
- "Response time < 200ms"
- "Support 10,000 concurrent users"

Integration:
- "API must accept JSON format"
- "Compatible with version X.Y"

Constraints:
- "Must run on container platform"
- "Database limited to PostgreSQL"
```

## Email Threads

### Characteristics

```yaml
document_profile:
  structure: Conversational, nested replies
  language: Informal, contextual
  requirement_markers: Very implicit
  numbering: None
  confidence: Low (high interpretation)
```

### Extraction Strategy

```text
1. Identify key decision makers
2. Find agreement points
3. Extract commitments
4. Note concerns raised
5. Heavy flagging for validation
```

### Challenges

```text
- Context scattered across replies
- Informal language
- May reference attachments
- Decisions may be implicit
- Tone/intent ambiguous
```

## Extraction Quality Checklist

### Before Extraction

- [ ] Document type identified
- [ ] Appropriate strategy selected
- [ ] Confidence level set
- [ ] Scope defined (full doc or sections)

### During Extraction

- [ ] Patterns applied consistently
- [ ] Context preserved
- [ ] Source locations recorded
- [ ] Ambiguities flagged

### After Extraction

- [ ] Duplicates identified
- [ ] Categories assigned
- [ ] Review items listed
- [ ] Summary generated
