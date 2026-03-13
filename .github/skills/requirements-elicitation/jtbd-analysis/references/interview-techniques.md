# JTBD Interview Techniques

Detailed methods for conducting Jobs to Be Done interviews.

## The Switch Interview

The core JTBD interview technique explores the customer's decision journey.

### Interview Structure

```yaml
interview_phases:
  1_first_thought:
    duration: "10-15 minutes"
    goal: "Understand the trigger"
    questions:
      - "When did you first start thinking you needed [solution]?"
      - "What was happening in your life/business at that time?"
      - "What was the first thing you did about it?"

  2_passive_looking:
    duration: "10-15 minutes"
    goal: "Understand early exploration"
    questions:
      - "Did you look at any alternatives initially?"
      - "How long did you stay in this 'thinking about it' phase?"
      - "What kept you from taking action?"

  3_active_looking:
    duration: "15-20 minutes"
    goal: "Understand decision criteria"
    questions:
      - "When did you start actively looking for solutions?"
      - "What triggered you to get serious about it?"
      - "What options did you consider?"
      - "How did you evaluate them?"

  4_deciding:
    duration: "10-15 minutes"
    goal: "Understand the choice"
    questions:
      - "What made you finally choose [product]?"
      - "Was there a specific moment when you decided?"
      - "What almost made you choose something else?"

  5_consuming:
    duration: "10 minutes"
    goal: "Understand post-purchase experience"
    questions:
      - "What happened after you bought it?"
      - "Was there anything surprising about using it?"
      - "Would you buy it again?"
```

### Timeline Reconstruction

```yaml
timeline_technique:
  purpose: "Reconstruct the decision timeline accurately"

  approach:
    - Start with the purchase moment and work backwards
    - Ask "And before that?" repeatedly
    - Get specific dates and events
    - Link decisions to life events

  example_flow:
    "When did you buy it?": "Last month, March 15th"
    "And before that?": "I had been looking online for a few weeks"
    "What triggered the online search?": "My old one broke"
    "When did it break?": "Beginning of February"
    "And before that?": "I had been thinking about upgrading anyway..."
```

## Push/Pull Analysis

### Four Forces Framework

```yaml
forces:
  push_away:
    definition: "Pain with current situation"
    interview_questions:
      - "What was frustrating about how you used to do it?"
      - "What problems were you experiencing?"
      - "What finally made you say 'enough is enough'?"
    examples:
      - "Current tool was too slow"
      - "Kept making mistakes"
      - "Wasting too much time"

  pull_toward:
    definition: "Attraction to new solution"
    interview_questions:
      - "What attracted you to [product]?"
      - "What did you hope would be different?"
      - "What was the ideal outcome you imagined?"
    examples:
      - "Promised to save 2 hours/day"
      - "Beautiful interface"
      - "Recommended by trusted friend"

  anxiety_of_new:
    definition: "Fear about switching"
    interview_questions:
      - "What concerns did you have about switching?"
      - "What almost stopped you from buying?"
      - "What risks did you worry about?"
    examples:
      - "Learning curve"
      - "Will it actually work?"
      - "What if I lose my data?"

  habit_of_present:
    definition: "Inertia of current behavior"
    interview_questions:
      - "What made it hard to change?"
      - "What were you comfortable with before?"
      - "Why didn't you switch sooner?"
    examples:
      - "Already know how to use current tool"
      - "Team is trained on old process"
      - "Good enough for now"
```

### Force Diagram

```text
                    CHANGE
                       ↑
    PUSH              │              PULL
  (Problems)          │           (Attraction)
      ──────────────► │ ◄──────────────
                      │
                      │
                      │
  ──────────────►     │     ◄──────────────
   HABIT              │          ANXIETY
  (Inertia)           │           (Fear)
                      ↓
                   NO CHANGE

For switch to happen: PUSH + PULL > HABIT + ANXIETY
```

## Emotional Probing Techniques

### Getting Beyond Surface Answers

```yaml
emotional_probes:
  5_whys_variant:
    approach: "Ask 'why is that important?' repeatedly"
    example:
      Q: "Why did you want faster reporting?"
      A: "So I could get numbers to my boss quicker"
      Q: "Why is that important?"
      A: "Because he needs them for board meetings"
      Q: "Why is that important to you?"
      A: "I don't want to look unprepared"
      Q: "Why is that important?"
      A: "I'm up for promotion and need to look competent"
      insight: "The real job is 'help me look competent for promotion'"

  feeling_questions:
    questions:
      - "How did that make you feel?"
      - "What was that like for you?"
      - "Were you stressed/relieved/frustrated when..."

  contrast_questions:
    questions:
      - "How is it different now?"
      - "What would it be like if you had to go back?"
      - "What would you miss most if you couldn't use it?"
```

### Identifying Emotional Jobs

```yaml
emotional_job_indicators:
  anxiety_reduction:
    signals:
      - "I just wanted peace of mind"
      - "I needed to stop worrying about..."
      - "I couldn't sleep thinking about..."

  confidence_building:
    signals:
      - "I wanted to feel prepared"
      - "I needed to know I was doing it right"
      - "I wanted to be sure..."

  status_achievement:
    signals:
      - "I wanted to impress..."
      - "I needed to look professional"
      - "Others would see me as..."

  control_seeking:
    signals:
      - "I needed to be in control of..."
      - "I wanted to manage it myself"
      - "I didn't want to depend on..."
```

## Social Context Probes

### Understanding Social Jobs

```yaml
social_probes:
  stakeholder_mapping:
    questions:
      - "Who else was involved in this decision?"
      - "Who did you consult before buying?"
      - "Who would notice if you switched?"
      - "Who benefits from your choice?"

  perception_questions:
    questions:
      - "What do others think about your choice?"
      - "How did [boss/team/family] react?"
      - "What would [important person] say?"

  social_pressure_indicators:
    signals:
      - "Everyone else was using..."
      - "My [colleague/friend] recommended..."
      - "I didn't want to be the only one not..."
```

## Interview Best Practices

### Preparation

```yaml
pre_interview:
  - Schedule 45-60 minutes
  - Choose quiet, private setting
  - Record (with permission) for later analysis
  - Have timeline template ready
  - Prepare but don't over-script
```

### During Interview

```yaml
interview_conduct:
  do:
    - Let them tell their story
    - Use "tell me more about that"
    - Get specific details and dates
    - Follow interesting tangents
    - Stay curious, not judgmental

  avoid:
    - Leading questions ("Wasn't it frustrating when...")
    - Yes/no questions
    - Asking about features directly
    - Interrupting their narrative
    - Projecting your assumptions
```

### After Interview

```yaml
post_interview:
  immediate: "Write notes within 1 hour"
  analysis:
    - Identify the main job
    - Map the 4 forces
    - Extract emotional/social dimensions
    - Note surprising insights
  synthesis:
    - Compare across multiple interviews
    - Look for patterns
    - Identify underserved jobs
```

## Sample Interview Script

```yaml
opening:
  "Thank you for talking with me today. I'd love to hear the story
   of how you came to use [product]. Can you take me back to when
   you first started thinking about this?"

first_thought:
  "What was happening in your life/work at that time?"
  "What was the very first thing you did about it?"

passive_phase:
  "Did you look at any alternatives at first?"
  "How long were you in this 'just thinking about it' phase?"

active_phase:
  "When did you start really looking for a solution?"
  "What made you get serious about it?"
  "What options did you consider?"

deciding:
  "What made you finally choose [product]?"
  "Was there a specific moment when you decided?"
  "What almost made you choose something else?"

closing:
  "If you had to go back to the old way, what would you miss most?"
  "Is there anything I should have asked but didn't?"
```

## Common Interview Mistakes

```yaml
mistakes_to_avoid:
  asking_about_features:
    wrong: "Do you like the dashboard feature?"
    right: "Walk me through how you use [product] day to day"

  hypotheticals:
    wrong: "Would you use X if we built it?"
    right: "Tell me about a time when you struggled with..."

  leading_questions:
    wrong: "Wasn't it frustrating when the old tool crashed?"
    right: "What happened when you were using the old tool?"

  surface_level_answers:
    wrong: Accepting "It was easier"
    right: "Can you give me a specific example of when it was easier?"
```
