# Autonomy Levels Reference

Detailed configuration and behavior for each autonomy level in requirements elicitation.

## Overview

Autonomy levels control how much human oversight vs AI independence is applied during elicitation. Choose based on domain sensitivity, trust level, and time constraints.

## Level 1: Guided (Human-in-Loop)

### Description

Maximum human control. AI acts as an intelligent assistant, suggesting actions for human approval.

### Behavior Configuration

```yaml
autonomy: guided
ai_role: assistant
human_role: driver

interview_behavior:
  question_generation: AI suggests, human approves before asking
  follow_up: AI recommends, human decides
  summarization: AI drafts, human edits and confirms
  requirement_extraction: AI highlights candidates, human confirms

document_extraction:
  document_selection: Human selects
  extraction_strategy: AI suggests approach, human approves
  requirement_candidates: AI highlights, human confirms each
  categorization: AI suggests, human validates

stakeholder_simulation:
  persona_selection: Human chooses personas
  interaction_style: Human guides conversation
  requirement_generation: AI proposes, human filters
  conflict_resolution: Human decides

gap_analysis:
  checklist_selection: Human approves criteria
  gap_identification: AI flags, human validates
  prioritization: Human decides

checkpoints:
  frequency: Every action
  approval_required: Yes, for all changes
  rollback: Immediate on any concern
```

### Use Cases

- **Regulatory domains** - Healthcare, finance, government
- **Learning mode** - New team members learning elicitation
- **High-stakes projects** - Mission-critical systems
- **Sensitive stakeholders** - Executive interviews, legal matters

### Example Interaction

```text
AI: "Based on the stakeholder's response about security, I suggest asking:
     'What specific authentication methods are required?'
     Do you approve this question?"

Human: "Yes, go ahead."

AI: [Asks the approved question]
    [Receives response]
    "I captured this as a potential requirement:
     'REQ-042: System shall support MFA including TOTP and hardware tokens.'
     Shall I add this to the requirements list?"
```

## Level 2: Semi-Autonomous

### Description

Balanced approach. AI takes initiative within defined boundaries, with periodic human checkpoints.

### Behavior Configuration

```yaml
autonomy: semi-auto
ai_role: collaborator
human_role: supervisor

interview_behavior:
  question_generation: AI asks freely within topic scope
  follow_up: AI pursues promising threads autonomously
  summarization: AI generates, human reviews at end
  requirement_extraction: AI extracts automatically, human validates batches

document_extraction:
  document_selection: AI suggests priority order, human approves list
  extraction_strategy: AI chooses approach autonomously
  requirement_candidates: AI extracts all, human reviews in batches
  categorization: AI categorizes automatically

stakeholder_simulation:
  persona_selection: AI recommends based on domain, human approves
  interaction_style: AI runs simulation autonomously
  requirement_generation: AI generates, human validates periodically
  conflict_resolution: AI flags conflicts, human decides major ones

gap_analysis:
  checklist_selection: AI uses domain-appropriate checklist
  gap_identification: AI identifies and categorizes automatically
  prioritization: AI suggests, human confirms critical items

checkpoints:
  frequency: After each major phase
  approval_required: For major decisions only
  rollback: On request or major concern
```

### Use Cases

- **Standard projects** - Most software development
- **Experienced teams** - Teams familiar with AI-assisted elicitation
- **Time-constrained** - When efficiency is important
- **Iterative discovery** - Agile/rapid development cycles

### Example Interaction

```text
[AI conducts 15-minute interview segment autonomously]

AI: "I've completed the security requirements exploration. Summary:
     - 8 requirements identified (5 functional, 3 non-functional)
     - Key themes: authentication, authorization, audit logging
     - Confidence: High (7), Medium (1)

     Notable finding: Stakeholder emphasized compliance with SOC 2.
     I suggest exploring audit requirements next.

     Should I continue, or would you like to review these first?"
```

## Level 3: Fully Autonomous

### Description

Maximum AI independence. AI conducts complete elicitation with minimal human intervention.

### Behavior Configuration

```yaml
autonomy: full-auto
ai_role: driver
human_role: reviewer

interview_behavior:
  question_generation: AI conducts full interview
  follow_up: AI pursues all relevant threads
  summarization: AI generates comprehensive summary
  requirement_extraction: AI extracts and categorizes all requirements

document_extraction:
  document_selection: AI processes all relevant documents
  extraction_strategy: AI optimizes approach per document
  requirement_candidates: AI extracts, deduplicates, categorizes
  categorization: AI applies full taxonomy automatically

stakeholder_simulation:
  persona_selection: AI selects all relevant personas
  interaction_style: AI runs full multi-persona simulation
  requirement_generation: AI generates comprehensive set
  conflict_resolution: AI proposes resolutions, flags unresolvable

gap_analysis:
  checklist_selection: AI applies all relevant checklists
  gap_identification: AI identifies all gaps with severity
  prioritization: AI prioritizes based on domain knowledge

checkpoints:
  frequency: At completion only
  approval_required: For final output only
  rollback: On human request after review
```

### Use Cases

- **Well-understood domains** - E-commerce, CRUD apps, standard patterns
- **Preliminary discovery** - Initial requirement gathering before refinement
- **Competitive analysis** - Extracting requirements from competitor products
- **Time-critical situations** - When speed is paramount

### Example Interaction

```text
[AI runs complete elicitation workflow autonomously]

AI: "Elicitation complete. Full report generated.

     Sources processed:
     - 3 stakeholder interviews (simulated: Product Manager, Developer, End User)
     - 2 documents (PRD, competitor analysis)
     - 1 domain research session (e-commerce best practices)

     Results:
     - 47 requirements identified
     - 12 gaps flagged (3 critical, 5 major, 4 minor)
     - 3 conflicts detected and resolved
     - Confidence score: 82%

     Output saved to: .requirements/checkout/requirements.yaml

     Ready for your review. Key areas to focus on:
     1. Payment provider integration requirements (needs validation)
     2. Performance requirements (based on assumptions)
     3. Accessibility requirements (may need stakeholder input)"
```

## Autonomy Selection Guide

### Decision Matrix

| Factor | Guided | Semi-Auto | Full-Auto |
|--------|--------|-----------|-----------|
| Domain sensitivity | High | Medium | Low |
| Regulatory requirements | Strict | Moderate | None |
| Team experience with AI | Low | Medium | High |
| Stakeholder availability | High | Medium | Low |
| Time constraints | Relaxed | Moderate | Tight |
| Requirement criticality | High | Medium | Low |

### Transition Guidelines

Start with **guided** mode when:

- New to AI-assisted elicitation
- Unfamiliar domain
- High-stakes project
- Regulatory compliance required

Progress to **semi-auto** when:

- Comfortable with AI suggestions
- Trust in AI judgment established
- Standard domain patterns apply
- Team is experienced

Use **full-auto** when:

- Well-understood domain
- Preliminary exploration
- Time is limited
- AI performance validated

### Hybrid Approach

Different techniques can use different autonomy levels in the same project:

```yaml
hybrid_configuration:
  interviews: guided          # Keep human in loop for stakeholder interaction
  document_extraction: full-auto  # Let AI process documents freely
  stakeholder_simulation: semi-auto  # Balance speed with oversight
  gap_analysis: full-auto     # Let AI identify all gaps systematically
  domain_research: full-auto  # Let AI research freely
```

## Configuration Examples

### Conservative (Regulated Industry)

```yaml
project: healthcare_portal
autonomy:
  default: guided
  document_extraction: semi-auto
  domain_research: semi-auto

compliance:
  require_human_approval: all_requirements
  audit_trail: full
  sign_off: per_requirement
```

### Balanced (Standard Enterprise)

```yaml
project: internal_crm
autonomy:
  default: semi-auto
  interviews: guided
  gap_analysis: full-auto

compliance:
  require_human_approval: major_changes
  audit_trail: summary
  sign_off: per_phase
```

### Aggressive (Rapid Prototyping)

```yaml
project: mvp_prototype
autonomy:
  default: full-auto

compliance:
  require_human_approval: final_review
  audit_trail: minimal
  sign_off: final_only
```
