# Question Pathways Reference

Adaptive question pathways for navigating requirements interviews based on stakeholder responses.

## Core Question Types

### Open-Ended Starters

Use to begin exploration of a topic:

```text
"Tell me about..."
"Describe how you currently..."
"Walk me through..."
"What does a typical [scenario] look like?"
"Help me understand..."
```

### Clarifying Questions

Use when response is vague or unclear:

```text
"When you say [term], what specifically do you mean?"
"Can you give me an example of that?"
"How would you define [concept] in this context?"
"What does [vague term] look like in practice?"
```

### Probing Questions

Use to dig deeper into a topic:

```text
"Why is that important?"
"What happens if that doesn't work?"
"How do you handle [edge case]?"
"What's the impact of [situation]?"
"Who else is affected by this?"
```

### Confirming Questions

Use to verify understanding:

```text
"So if I understand correctly, [summary]. Is that right?"
"Let me play that back: [paraphrase]. Did I capture that accurately?"
"Just to confirm: [specific detail]. Correct?"
```

## Domain-Specific Pathways

### User Interface Requirements

```text
START: "Describe what the user sees when they [action]."
  ↓
"What information needs to be visible?"
  ↓
"What actions can they take from here?"
  ↓
"How should errors or problems be communicated?"
  ↓
"Are there any accessibility requirements?"
```

### Data Requirements

```text
START: "What data does the system need to manage?"
  ↓
"Where does this data come from?"
  ↓
"How often does it change?"
  ↓
"Who can view/modify it?"
  ↓
"How long must it be retained?"
  ↓
"Are there data quality requirements?"
```

### Integration Requirements

```text
START: "What other systems does this need to work with?"
  ↓
"What data flows between systems?"
  ↓
"How often does this exchange happen?"
  ↓
"What happens if the other system is unavailable?"
  ↓
"Are there existing APIs or do we need to build them?"
```

### Security Requirements

```text
START: "What security concerns do you have?"
  ↓
"Who should have access to what?"
  ↓
"Are there different permission levels?"
  ↓
"What authentication methods are required?"
  ↓
"Is there sensitive data that needs special handling?"
  ↓
"Are there compliance requirements (GDPR, HIPAA, PCI)?"
```

### Performance Requirements

```text
START: "How fast does this need to be?"
  ↓
"What's an acceptable response time for [key action]?"
  ↓
"How many concurrent users do you expect?"
  ↓
"Are there peak usage periods?"
  ↓
"What's the expected data volume?"
  ↓
"How will you know if performance is acceptable?"
```

## Response-Adaptive Pathways

### When Stakeholder Mentions "Fast"

```text
Trigger: "It needs to be fast" / "quick" / "instant"
  ↓
"When you say fast, what response time are you expecting?"
  ↓
Branch A (specific number):
  "Is that [X seconds] a hard requirement or a target?"
  "What happens if it's slower than that?"
  ↓
Branch B (vague response):
  "Let me give you some context: most web pages load in 2-3 seconds.
   Should this be faster, similar, or is that acceptable?"
  ↓
"Are there specific actions where speed is most critical?"
```

### When Stakeholder Mentions "Easy to Use"

```text
Trigger: "It should be easy to use" / "intuitive" / "simple"
  ↓
"Can you describe what 'easy' means in this context?"
  ↓
"Think of a tool you find easy to use. What makes it easy?"
  ↓
"Who are the users? What's their technical skill level?"
  ↓
"Are there specific workflows that must be streamlined?"
  ↓
"Would users receive training, or should it be self-explanatory?"
```

### When Stakeholder Mentions "Secure"

```text
Trigger: "It must be secure" / "security is important"
  ↓
"What specific security concerns do you have?"
  ↓
Branch A (data protection):
  "What sensitive data will the system handle?"
  "Are there regulatory requirements (GDPR, HIPAA, SOC2)?"
  ↓
Branch B (access control):
  "Who should have access? Any role-based restrictions?"
  "How should authentication work?"
  ↓
Branch C (threat prevention):
  "What threats are you most concerned about?"
  "Have there been security incidents in the past?"
```

### When Stakeholder Mentions "Scalable"

```text
Trigger: "It needs to scale" / "handle growth"
  ↓
"What scale are you planning for?"
  ↓
"What's your current volume?"
  ↓
"What growth do you expect over the next 1/3/5 years?"
  ↓
"Are there seasonal peaks or variable demand patterns?"
  ↓
"What happens if demand exceeds expectations?"
```

## NFR Exploration Pathway

Non-functional requirements are often overlooked. Use this pathway to systematically cover them:

```text
NFR EXPLORATION SEQUENCE:

1. Performance
   "How responsive does this need to be?"
   "What's the expected load?"

2. Security
   "What security requirements apply?"
   "Who should have access to what?"

3. Reliability
   "How critical is uptime?"
   "What's the acceptable downtime?"

4. Scalability
   "How much growth do you expect?"
   "Are there usage spikes?"

5. Usability
   "Who are the users?"
   "What's their technical level?"

6. Maintainability
   "Who will maintain this?"
   "How often do you expect changes?"

7. Compliance
   "Are there regulatory requirements?"
   "Industry standards to follow?"

8. Integration
   "What systems does this connect to?"
   "Are there API requirements?"
```

## Conflict Detection Pathway

When potential conflicts emerge between requirements:

```text
Trigger: Stakeholder says something that conflicts with earlier statement
  ↓
"I want to make sure I understand. Earlier you mentioned [X],
 and now you're describing [Y]. Can you help me reconcile these?"
  ↓
Branch A (Stakeholder clarifies):
  "Thank you, that makes sense. So the actual requirement is [clarified version]?"
  ↓
Branch B (Genuine conflict):
  "It sounds like there might be a trade-off here.
   Which is more important: [X] or [Y]?"
  ↓
Branch C (Needs further input):
  "This might need input from others. Who else should weigh in on this?"
```

## Closing the Loop

At the end of each topic, close the loop:

```text
"Before we move on, is there anything else about [topic] we should discuss?"
"What haven't I asked about [topic] that I should have?"
"Is there anyone else who would have more insight into [topic]?"
```

## Question Anti-Patterns

### Avoid These

| Anti-Pattern | Problem | Better Alternative |
|--------------|---------|-------------------|
| "Don't you think X is important?" | Leading | "How important is X to you?" |
| "So you want X, Y, and Z, right?" | Multiple + leading | Ask about one at a time |
| "What's your requirement for X?" | Too direct/jargon | "Tell me about X" |
| "Is X fast enough?" | Yes/no, leading | "What speed do you need for X?" |
| "How would you implement X?" | Implementation | "What should X accomplish?" |
