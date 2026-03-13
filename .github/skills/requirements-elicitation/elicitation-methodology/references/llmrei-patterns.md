# LLMREI Patterns Reference

Research-backed patterns for AI-conducted requirements elicitation interviews.

Based on: *"LLMREI: Automating Requirements Elicitation Interviews with LLMs"* (arxiv.org/html/2507.02564v1)

## Overview

LLMREI (LLM Requirements Elicitation Interview) is a methodology for conducting AI-led stakeholder interviews with minimal human intervention. Research shows:

- **73.7% requirement capture** with zero-shot prompting
- **Error rate comparable** to trained human interviewers
- **Context-adaptive questioning** improves elicitation quality

## Prompting Strategies

### Zero-Shot (LLMREI-short)

Use for quick, exploratory interviews.

```text
You are an interviewer who assists in eliciting requirements. Ask questions
about the stakeholder's business and project to find out everything they
envision. Act like a real-world interviewer - only ask one question at a
time or two related questions per topic.
```

**Characteristics:**

- Simple, direct instruction
- Works well with GPT-4o and Claude
- Captures 60-74% of requirements
- Good for initial exploration

**Best for:**

- Time-constrained sessions
- Exploratory discovery
- Follow-up clarification

### Least-to-Most (LLMREI-long)

Use for comprehensive, structured interviews.

**Structure:**

1. **Role Description** - Clear interviewer identity
2. **5-Phase Interview Guidelines**
3. **Error Handling** - Behavior adjustments
4. **Context Adaptation** - Dynamic questioning

```text
You are an interviewer called LLMREI who assists a requirements engineer
in eliciting requirements.

Goal: Conduct comprehensive requirements elicitation interviews with
stakeholders, ensuring all necessary information is gathered.

## Interview Phases

### Phase 1: Opening (2-3 minutes)
- Introduce yourself and the purpose
- Explain the interview structure
- Set expectations for duration

### Phase 2: Context Gathering (5-10 minutes)
- Understand the stakeholder's role
- Explore their relationship to the project
- Identify their main concerns and priorities

### Phase 3: Requirements Exploration (15-25 minutes)
- Start with high-level needs
- Drill down into specifics
- Explore functional requirements
- Identify non-functional requirements
- Uncover constraints and assumptions

### Phase 4: Validation (5-10 minutes)
- Summarize key requirements
- Verify understanding
- Ask for corrections or additions

### Phase 5: Closing (2-3 minutes)
- Thank the stakeholder
- Explain next steps
- Offer to answer questions

## Behavior Guidelines

- Ask ONE question at a time (or two closely related)
- Adapt language to stakeholder's expertise level
- Actively listen and follow up on key points
- Summarize periodically to verify understanding
- Let the stakeholder describe scenarios in their own words
```

**Characteristics:**

- Structured, methodical approach
- Reduces common interview mistakes
- Better coverage of requirement types
- Generates interview summaries

**Best for:**

- Formal elicitation sessions
- Complex domains
- Complete requirement coverage

## Question Categories

### Context-Independent Questions

General questions applicable to any interview.

```text
Examples:
- "What is your role in this project?"
- "What are the main goals you want to achieve?"
- "Who are the primary users of this system?"
- "What existing systems does this need to integrate with?"
```

### Parameterized Questions

Template questions with project-specific placeholders.

```text
Examples:
- "Could you elaborate on what you want the {feature} to accomplish?"
- "How should the {system} handle {scenario}?"
- "What happens when {condition} occurs?"
```

### Context-Deepening Questions

Follow-up questions based on stakeholder responses.

```text
Pattern: Take stakeholder statement → Ask for specifics

Stakeholder: "We need fast search"
Context-deepening: "When you say fast, what response time are you expecting? Under 1 second? Under 100ms?"

Stakeholder: "Security is important"
Context-deepening: "What specific security concerns do you have? Authentication? Authorization? Data encryption?"
```

### Context-Enhancing Questions

Introduce new ideas the stakeholder might not have considered.

```text
Examples:
- "Have you considered how this might work on mobile devices?"
- "What happens if the user loses connectivity mid-operation?"
- "Would you want notifications when {event} occurs?"
- "Some similar systems offer {feature}. Would that be valuable here?"
```

**Research finding:** Short prompts generate more context-enhancing questions (15% vs 10%).

## Common Interview Mistakes to Avoid

From LLMREI research, these are the most common mistakes:

### Question Formulation

| Mistake | Prevention |
|---------|------------|
| Very long questions | Keep questions concise |
| Multiple unrelated questions | One question at a time |
| Leading questions | Use neutral language |
| Jargon overload | Match stakeholder's vocabulary |

### Question Omission

| Mistake | Prevention |
|---------|------------|
| Skipping NFRs | Explicitly ask about performance, security |
| Ignoring constraints | Ask about limitations |
| Missing edge cases | Ask "what if" scenarios |
| No prioritization | Ask about must-have vs nice-to-have |

### Interview Flow

| Mistake | Prevention |
|---------|------------|
| Jumping topics randomly | Follow logical progression |
| No summary | Periodically recap |
| Rushing the close | Allow time for additions |
| Ignoring signals | Follow up on hesitation |

## Expected Performance

Based on 33 simulated interviews:

| Metric | Zero-Shot | Least-to-Most |
|--------|-----------|---------------|
| Requirements captured | 73.7% | 70.2% |
| Complete requirements | 60.9% | 58.1% |
| Partial requirements | 12.8% | 12.1% |
| Context-deepening questions | 44.4% | 32.3% |
| Context-enhancing questions | 15.3% | 10.4% |

**Key insight:** Zero-shot often performs BETTER for requirement capture, but least-to-most reduces interview errors.

## Interview Summary Template

After each interview, generate a summary:

```yaml
interview_summary:
  session_id: "INT-{number}"
  stakeholder_role: "{role}"
  duration: "{minutes} minutes"
  date: "{ISO-8601-date}"

  key_themes:
    - "{theme-1}"
    - "{theme-2}"

  requirements_elicited:
    - id: REQ-{number}
      text: "{requirement}"
      confidence: high|medium|low
      type: functional|non-functional|constraint
      priority: must|should|could

  follow_up_needed:
    - "{question or topic needing clarification}"

  stakeholder_quotes:
    - "{notable direct quote}"

  observations:
    - "{interviewer observation about needs or concerns}"
```

## Adaptation for Claude

While LLMREI was developed with GPT-4o, the patterns work well with Claude:

1. **Use clear role framing** - Claude responds well to explicit role definitions
2. **Provide structure** - Claude excels with structured guidance
3. **Enable thinking** - For complex interviews, allow extended thinking
4. **Multi-turn context** - Claude maintains context well across long interviews

## Integration with Autonomy Levels

| Autonomy | LLMREI Application |
|----------|-------------------|
| Guided | Human approves each question before asking |
| Semi-auto | AI conducts with periodic human checkpoints |
| Full-auto | Complete AI-led interview with summary review |

## Sources

- [arxiv.org/html/2507.02564v1](https://arxiv.org/html/2507.02564v1) - LLMREI paper
- [perplexity research] - 2025 AI requirements gathering techniques
