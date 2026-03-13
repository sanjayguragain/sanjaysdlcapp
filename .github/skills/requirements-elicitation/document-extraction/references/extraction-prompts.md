# Extraction Prompts Reference

Prompt templates and patterns for requirement extraction from documents.

## Core Extraction Prompt

Use this as the base prompt for document analysis:

```text
Analyze this document for requirements. Extract:

1. EXPLICIT REQUIREMENTS
   - Statements with "shall", "must", "will", "should"
   - Numbered requirement lists
   - Labeled requirements (REQ-XXX)

2. IMPLICIT REQUIREMENTS
   - Capabilities described ("enables users to...")
   - Goals stated ("the system should allow...")
   - Expectations mentioned ("users expect...")

3. CONSTRAINTS
   - Technical limitations
   - Business rules
   - Regulatory compliance

4. ASSUMPTIONS
   - Stated or implied preconditions
   - Environmental assumptions

For each requirement, provide:
- Extracted text (cleaned, imperative form)
- Original text (exact quote)
- Location (section/page/paragraph)
- Type (functional/non-functional/constraint)
- Confidence (high/medium/low)
- Review flag if interpretation needed
```

## Document-Type Specific Prompts

### Formal Specification Prompt

```text
Extract requirements from this formal specification document.

Focus on:
- Section headers indicating requirement types
- Numbered requirements (preserve original IDs)
- "Shall" statements (mandatory)
- "Should" statements (recommended)
- Tables containing requirements

Map to categories based on document sections:
- Functional Requirements → functional
- Performance Requirements → non-functional/performance
- Security Requirements → non-functional/security
- System Constraints → constraint

Maintain traceability by recording:
- Original requirement ID
- Section reference
- Page number
```

### Meeting Transcript Prompt

```text
Analyze this meeting transcript for requirements-related content.

Extract:
1. DECISIONS: Statements indicating agreed requirements
   - "We decided that..."
   - "The conclusion is..."
   - "Going with option X"

2. ACTION ITEMS: Commitments that imply requirements
   - "We need to implement..."
   - "Action: Add feature X"

3. DISCUSSIONS: Requirement-relevant conversations
   - What capability was discussed?
   - What constraints were mentioned?
   - What concerns were raised?

For each extraction:
- Note the speaker (if identifiable)
- Provide surrounding context
- Mark confidence as MEDIUM (needs validation)
- List follow-up questions if clarification needed
```

### User Story Prompt

```text
Convert these user stories into requirement statements.

For each user story:
1. Extract the capability from "I want [X]"
2. Note the user role from "As a [role]"
3. Capture the value from "So that [benefit]"

Transform to requirement format:
"[Role] shall be able to [capability]"

For acceptance criteria (Given/When/Then):
- Convert to: "When [trigger], system shall [behavior]"
- This follows EARS pattern

Note:
- Story ID for traceability
- Priority if specified
- Any noted constraints or conditions
```

### Regulatory Document Prompt

```text
Extract compliance requirements from this regulatory document.

Focus on:
1. MANDATORY: "shall" requirements
   - Direct obligations
   - Required behaviors

2. PROHIBITIONS: "shall not" requirements
   - Forbidden actions
   - Restricted behaviors

3. CONDITIONAL: Requirements with conditions
   - "Where applicable..."
   - "If [condition], then..."

For each extraction:
- Cite exact section number (e.g., Article 5.1.a)
- Preserve legal language exactly
- Note any interpretive uncertainty
- Flag items needing legal review

Mark all as HIGH confidence for extracted text,
but note if interpretation needed for implementation.
```

### Competitor Analysis Prompt

```text
Extract feature requirements from this competitor analysis.

For each competitor feature:
1. Describe the capability observed
2. Convert to requirement form: "[System] shall [capability]"
3. Note the source (competitor name, source URL)

Mark all extractions as:
- Confidence: LOW (based on external observation)
- Type: POTENTIAL (not confirmed need)

Identify:
- Features all competitors have → Table stakes
- Features only some have → Differentiators
- Features none have → Innovation opportunities

Flag items needing:
- Market validation
- Stakeholder prioritization
- Technical feasibility review
```

## Extraction Pattern Prompts

### EARS Pattern Detection

```text
Identify requirements following EARS patterns:

UBIQUITOUS (always true):
"The [system] shall [behavior]"

EVENT-DRIVEN (triggered by event):
"When [trigger], the [system] shall [response]"

STATE-DRIVEN (during a state):
"While [state], the [system] shall [behavior]"

OPTIONAL (for specific feature):
"Where [feature], the [system] shall [behavior]"

UNWANTED (exception handling):
"If [condition], then the [system] shall [response]"

COMPLEX (combinations):
"While [state], when [trigger], the [system] shall [response]"

For non-EARS requirements, suggest EARS reformulation.
```

### NFR Detection Prompt

```text
Identify non-functional requirements in this document.

Scan for indicators of:

PERFORMANCE:
- Response time, throughput, latency
- "fast", "quick", "real-time"
- Numeric targets (< 2 seconds, 99.9%)

SECURITY:
- Authentication, authorization
- Encryption, data protection
- Compliance (GDPR, HIPAA, PCI)

USABILITY:
- User experience, accessibility
- "easy to use", "intuitive"
- Training requirements

RELIABILITY:
- Uptime, availability
- Error handling, recovery
- "always available", "fault tolerant"

SCALABILITY:
- Capacity, growth
- Concurrent users, data volume
- "handle growth", "scale to"

MAINTAINABILITY:
- Modularity, documentation
- Update frequency
- Support requirements
```

## Validation Prompts

### Requirement Quality Check

```text
Review this extracted requirement for quality:

COMPLETE: Does it fully describe the need?
UNAMBIGUOUS: Is there only one interpretation?
VERIFIABLE: Can we test if it's satisfied?
CONSISTENT: Does it conflict with others?
TRACEABLE: Is the source clear?

If issues found:
- Describe the problem
- Suggest improvement
- Flag for stakeholder review
```

### Duplicate Detection

```text
Compare these requirements for potential duplicates:

Check for:
1. EXACT duplicates: Same text, different sources
2. SEMANTIC duplicates: Different words, same meaning
3. PARTIAL overlaps: One contains another
4. CONFLICTS: Contradictory requirements

For each duplicate/overlap:
- Identify the related requirements
- Recommend: merge, keep both, or flag for review
- Suggest consolidated text if merging
```

## Output Formatting

### Standard Extraction Output

```yaml
extractions:
  - id: REQ-EXT-001
    text: "{cleaned requirement text}"
    original: "{exact text from source}"
    source:
      file: "{filename}"
      location: "{section/page/line}"
    type: functional|non-functional|constraint
    confidence: high|medium|low
    extraction_method: explicit|pattern|inferred
    review:
      needed: true|false
      reason: "{why review needed}"
      questions: ["{clarification questions}"]
```

### Summary Output

```yaml
extraction_summary:
  document: "{filename}"
  total_extracted: {number}
  by_type:
    functional: {count}
    non_functional: {count}
    constraint: {count}
  by_confidence:
    high: {count}
    medium: {count}
    low: {count}
  needs_review: {count}
  potential_duplicates: {count}
```
