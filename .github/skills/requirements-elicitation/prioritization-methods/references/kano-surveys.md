# Kano Model Survey Templates

## Overview

The Kano Model requires paired questions to classify features. This guide provides survey templates and analysis techniques.

## Question Design

### Functional Question

Asks how the user would feel if the feature IS present.

```yaml
functional_question:
  template: "How would you feel if [feature] was available?"

  examples:
    - "How would you feel if you could save your work offline?"
    - "How would you feel if the app had a dark mode theme?"
    - "How would you feel if you received real-time notifications?"
```

### Dysfunctional Question

Asks how the user would feel if the feature is NOT present.

```yaml
dysfunctional_question:
  template: "How would you feel if [feature] was NOT available?"

  examples:
    - "How would you feel if you could NOT save your work offline?"
    - "How would you feel if the app did NOT have a dark mode theme?"
    - "How would you feel if you did NOT receive real-time notifications?"
```

### Answer Scale

Standard 5-point scale for both questions:

```yaml
answer_options:
  1: "I would like it"
  2: "I expect it"
  3: "I'm neutral"
  4: "I can tolerate it"
  5: "I dislike it"
```

## Survey Template

### Complete Survey Structure

```yaml
kano_survey:
  introduction: |
    Thank you for participating in this feature survey. For each feature,
    we'll ask two questions: how you'd feel if it exists, and how you'd
    feel if it doesn't. Please answer honestly based on your preferences.

  features:
    - id: "F001"
      description: "Offline mode - Access and edit content without internet"
      functional: "How would you feel if the app worked offline?"
      dysfunctional: "How would you feel if the app required internet at all times?"

    - id: "F002"
      description: "Dark mode - Alternative color theme for low-light use"
      functional: "How would you feel if the app had a dark mode option?"
      dysfunctional: "How would you feel if the app only had the standard light theme?"

    - id: "F003"
      description: "Auto-save - Automatically saves your work every 30 seconds"
      functional: "How would you feel if your work was saved automatically?"
      dysfunctional: "How would you feel if you had to manually save your work?"

  demographics:  # Optional but recommended
    - "How often do you use this type of application?"
    - "What is your primary use case?"
    - "How long have you been using similar products?"
```

## Classification Matrix

### Evaluation Table

Map functional and dysfunctional responses to categories:

```text
                    DYSFUNCTIONAL RESPONSE
                    Like  Expect  Neutral  Tolerate  Dislike
               ┌────────────────────────────────────────────────┐
         Like  │  Q      E        E        E          O        │
F              │                                               │
U       Expect │  R      I        I        I          B        │
N              │                                               │
C      Neutral │  R      I        I        I          B        │
T              │                                               │
I    Tolerate  │  R      I        I        I          B        │
O              │                                               │
N     Dislike  │  R      R        R        R          Q        │
A              │                                               │
L              └────────────────────────────────────────────────┘

Legend:
  E = Excitement (Delighter)
  O = One-dimensional (Performance)
  B = Basic (Must-be)
  I = Indifferent
  R = Reverse
  Q = Questionable (inconsistent response)
```

### Programmatic Classification

```yaml
classification_rules:
  excitement:
    condition: "Functional = Like AND Dysfunctional in [Neutral, Tolerate, Dislike]"
    meaning: "Feature delights when present, no dissatisfaction when absent"

  performance:
    condition: "Functional = Like AND Dysfunctional = Dislike"
    meaning: "More = better, linear relationship to satisfaction"

  basic:
    condition: "Functional in [Expect, Neutral, Tolerate] AND Dysfunctional = Dislike"
    meaning: "Expected feature, dissatisfaction when missing"

  indifferent:
    condition: "Functional in [Neutral, Tolerate, Expect] AND Dysfunctional in [Neutral, Tolerate, Expect]"
    meaning: "User doesn't care either way"

  reverse:
    condition: "Functional = Dislike OR (Functional = Tolerate AND Dysfunctional = Like)"
    meaning: "Feature actively unwanted"

  questionable:
    condition: "Both Like or Both Dislike"
    meaning: "Inconsistent response - may not understand feature"
```

## Analysis Techniques

### Basic Analysis

Count responses per category:

```yaml
basic_analysis:
  feature: "Offline Mode"
  responses: 100

  distribution:
    excitement: 45 (45%)
    performance: 30 (30%)
    basic: 10 (10%)
    indifferent: 10 (10%)
    reverse: 3 (3%)
    questionable: 2 (2%)

  classification: "Excitement (plurality)"
```

### Better-Worse Analysis

Calculate satisfaction coefficients:

```yaml
better_worse_analysis:
  formulas:
    satisfaction: "(E + O) / (E + O + B + I)"
    dissatisfaction: "(B + O) / (E + O + B + I) × -1"

  interpretation:
    satisfaction_coefficient:
      high: "> 0.5 = Strong satisfaction increase if feature present"
      low: "< 0.2 = Little satisfaction impact"

    dissatisfaction_coefficient:
      high: "< -0.5 = Strong dissatisfaction if feature missing"
      low: "> -0.2 = Little dissatisfaction impact"

  example:
    feature: "Offline Mode"
    E: 45
    O: 30
    B: 10
    I: 10
    total: 95  # Excluding R and Q

    satisfaction: "(45 + 30) / 95 = 0.79"  # High positive impact
    dissatisfaction: "(10 + 30) / 95 × -1 = -0.42"  # Moderate negative if missing
```

### Priority Map

Plot features on satisfaction vs dissatisfaction:

```text
         │ HIGH SATISFACTION
         │
    ●E   │   ●O
         │
─────────┼─────────
         │
    ●I   │   ●B
         │
         │ HIGH DISSATISFACTION

Quadrants:
  Top-Right (O): Invest heavily - high impact both ways
  Top-Left (E): Differentiators - delight opportunities
  Bottom-Right (B): Must-haves - ensure these work perfectly
  Bottom-Left (I): Deprioritize - low impact
```

## Sample Size Recommendations

```yaml
sample_size:
  minimum: 30  # Per user segment
  recommended: 50-100
  statistical_significance: 100+

  segment_considerations:
    - "Survey each user segment separately"
    - "Weight results by segment importance"
    - "Note: Results can vary significantly between segments"
```

## Survey Best Practices

### Question Writing

```yaml
question_best_practices:
  do:
    - "Use simple, clear language"
    - "Describe feature benefits, not technical implementation"
    - "Include brief context if needed"
    - "Test questions with pilot group"

  dont:
    - "Use technical jargon"
    - "Lead the respondent"
    - "Make questions too long"
    - "Assume feature knowledge"
```

### Survey Administration

```yaml
administration_tips:
  - "Limit to 10-15 features per survey (fatigue)"
  - "Randomize feature order"
  - "Include attention check questions"
  - "Allow 'I don't understand' option"
  - "Capture response time for quality filtering"
```

## Output Template

```yaml
kano_analysis_report:
  survey_info:
    date: "{ISO-8601}"
    respondents: 87
    completion_rate: "78%"

  feature_classifications:
    - feature: "Offline Mode"
      category: "Excitement"
      confidence: "High (45% plurality)"
      satisfaction_coef: 0.79
      dissatisfaction_coef: -0.42
      recommendation: "Strong differentiator - prioritize for competitive advantage"

    - feature: "Auto-save"
      category: "Basic"
      confidence: "High (62% plurality)"
      satisfaction_coef: 0.25
      dissatisfaction_coef: -0.78
      recommendation: "Must-have - ensure flawless implementation"

  visualization: |
    [Better-Worse scatter plot]
    [Category distribution bar chart]

  recommendations:
    invest: ["Offline Mode", "Real-time Collaboration"]
    ensure: ["Auto-save", "Data Security"]
    consider: ["Dark Mode", "Keyboard Shortcuts"]
    deprioritize: ["Social Sharing", "Gamification"]
```

---

**Last Updated:** 2025-12-26
