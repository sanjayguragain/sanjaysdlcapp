# Interview Structure Reference

Detailed interview structure and phase guidance for requirements elicitation interviews.

## Full Interview Template

### Pre-Interview Preparation

Before starting the interview:

```yaml
preparation:
  review_existing:
    - Previous requirements documents
    - Domain context
    - Stakeholder background

  prepare_questions:
    - 3-5 opening questions
    - Domain-specific exploration questions
    - NFR checklist questions

  set_environment:
    - Confirm autonomy level
    - Prepare note-taking format
    - Set time expectations
```

## Phase-by-Phase Guide

### Phase 1: Opening (2-3 minutes)

**Objective:** Establish rapport and set expectations.

**Script Template:**

```text
"Thank you for taking the time to meet with me today. I'm here to help
gather requirements for [project/system name].

This interview should take about [30-45] minutes. I'll be asking questions
about your needs and expectations. There are no wrong answers - I'm here
to understand your perspective.

Feel free to interrupt me at any time if something isn't clear or if you
want to add something.

Let's start with some context: Could you tell me about your role and how
you currently interact with [relevant system/process]?"
```

**Adaptive Responses:**

| Stakeholder Type | Adaptation |
|-----------------|------------|
| Executive | Focus on strategic outcomes, business value |
| Technical | Allow technical detail, explore constraints |
| End User | Use simple language, focus on daily workflows |
| Domain Expert | Leverage their expertise, ask for industry context |

### Phase 2: Context Gathering (5-10 minutes)

**Objective:** Build understanding of the stakeholder's world.

**Essential Questions:**

```text
Context Questions:
1. "What's your primary responsibility related to this project?"
2. "Walk me through a typical day/workflow where you'd use this system."
3. "What pain points do you experience with the current solution?"
4. "Who else is impacted by this system in your organization?"
5. "What constraints or limitations should I be aware of?"
```

**Context Mapping Template:**

```yaml
stakeholder_context:
  role: "{title/function}"
  department: "{org unit}"
  primary_interactions:
    - "{system/process 1}"
    - "{system/process 2}"
  pain_points:
    - "{frustration 1}"
    - "{frustration 2}"
  success_metrics:
    - "{how they measure success}"
  related_stakeholders:
    - "{other people to interview}"
```

### Phase 3: Requirements Exploration (15-25 minutes)

**Objective:** Systematically elicit requirements across all categories.

**Exploration Framework:**

```text
For each major feature area:
1. Start broad: "Tell me about [feature area]"
2. Drill down: "You mentioned X - can you elaborate?"
3. Edge cases: "What happens when [unusual situation]?"
4. Constraints: "Are there any limitations on how this should work?"
5. Validate: "So if I understand correctly, [summary]. Is that right?"
```

**Category Checklist:**

```yaml
exploration_categories:
  functional:
    - Core features
    - User workflows
    - Data inputs/outputs
    - Integration points
    - Reporting/analytics

  non_functional:
    - Performance expectations
    - Security requirements
    - Scalability needs
    - Availability/uptime
    - Usability/accessibility

  constraints:
    - Technical limitations
    - Budget restrictions
    - Timeline requirements
    - Regulatory compliance
    - Organizational policies

  assumptions:
    - Implicit expectations
    - Baseline capabilities
    - Environmental factors
```

**Deep-Dive Techniques:**

```text
The 5 Whys:
Q: "Why is fast login important?"
A: "Because users check multiple times a day"
Q: "Why do they need to check so often?"
A: "To see new orders"
Q: "Why can't they get notifications instead?"
A: "Actually, that would be better..."
→ Uncovers real need: notification system, not just fast login

Scenario Exploration:
"Walk me through what happens when [scenario]"
"What if [variation] occurred?"
"How do you handle [edge case] today?"

Concrete Examples:
"Can you give me a specific example of when this was a problem?"
"Think of the last time you needed to [action]. What happened?"
```

### Phase 4: Validation (5-10 minutes)

**Objective:** Confirm understanding and prioritize.

**Summary Template:**

```text
"Let me summarize what I've heard to make sure I understand correctly:

[Category 1]:
- [Requirement 1]
- [Requirement 2]

[Category 2]:
- [Requirement 3]
- [Requirement 4]

Is this accurate? Have I missed anything important?"
```

**Prioritization Exercise:**

```text
"If you had to choose, which of these requirements are absolutely
essential for the first release (must-have), which are important
but could wait (should-have), and which are nice-to-have?"

MoSCoW Categories:
- Must: "Without this, the system is unusable"
- Should: "Important, but workarounds exist"
- Could: "Nice to have, would improve experience"
- Won't: "Explicitly out of scope for now"
```

### Phase 5: Closing (2-3 minutes)

**Objective:** Thank stakeholder and set expectations.

**Closing Script:**

```text
"Thank you for your time and insights. This has been very helpful.

Here's what happens next:
1. I'll document these requirements and share them with you for review
2. If I have follow-up questions, I may reach out
3. [Next step in your process]

Is there anything else you'd like to add before we wrap up?
Do you have any questions for me?"
```

## Interview Timing Guide

```text
Total: 30-45 minutes

[5 min]  Opening + Context Start
[10 min] Context Gathering
[20 min] Requirements Exploration
[7 min]  Validation + Prioritization
[3 min]  Closing

Checkpoints:
- At 15 min: Quick context check
- At 30 min: Transition to validation if running long
- At 40 min: Begin closing regardless
```

## Handling Difficult Situations

### Stakeholder Goes Off-Topic

```text
"That's interesting context. To make sure we cover everything,
let me bring us back to [topic]. We can revisit [tangent] if time allows."
```

### Stakeholder Is Too Brief

```text
"Could you tell me more about that?"
"Can you give me a specific example?"
"What would that look like in practice?"
```

### Stakeholder Is Uncertain

```text
"That's okay - we can mark this as 'needs clarification' and follow up."
"Who else might know the answer to this?"
"What's your best guess, and we can validate it later?"
```

### Conflicting Requirements Emerge

```text
"I notice this seems to conflict with [earlier requirement].
Can you help me understand how these would work together?"
```

## Post-Interview Checklist

```yaml
post_interview:
  immediate:
    - [ ] Save raw notes
    - [ ] Extract requirements
    - [ ] Note follow-up questions
    - [ ] Identify gaps

  within_24_hours:
    - [ ] Clean up notes
    - [ ] Generate summary
    - [ ] Send thank-you if appropriate
    - [ ] Update requirements document

  before_next_interview:
    - [ ] Review for patterns
    - [ ] Identify new questions
    - [ ] Check for conflicts with other stakeholders
```
