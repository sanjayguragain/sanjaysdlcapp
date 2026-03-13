# Job Mapping and Outcome Statements

Creating job maps and measurable outcome statements for JTBD analysis.

## Job Map Structure

### The Universal Job Map

Every job follows a predictable structure of stages:

```yaml
universal_job_map:
  1_define:
    name: "Define the job"
    description: "Determine goals and plan approach"
    key_questions:
      - "What are they trying to achieve?"
      - "How do they decide what to do?"

  2_locate:
    name: "Locate inputs"
    description: "Gather necessary items and information"
    key_questions:
      - "What do they need to get started?"
      - "Where do they find required inputs?"

  3_prepare:
    name: "Prepare inputs"
    description: "Set up inputs for use"
    key_questions:
      - "How do they prepare materials?"
      - "What setup is required?"

  4_confirm:
    name: "Confirm readiness"
    description: "Verify everything is ready"
    key_questions:
      - "How do they know they're ready?"
      - "What checks do they perform?"

  5_execute:
    name: "Execute the job"
    description: "Perform the core task"
    key_questions:
      - "What is the main activity?"
      - "What steps are involved?"

  6_monitor:
    name: "Monitor progress"
    description: "Track execution and adjust"
    key_questions:
      - "How do they track progress?"
      - "What do they look for?"

  7_modify:
    name: "Modify as needed"
    description: "Make adjustments during execution"
    key_questions:
      - "What changes might be needed?"
      - "How do they course-correct?"

  8_conclude:
    name: "Conclude the job"
    description: "Finish and wrap up"
    key_questions:
      - "How do they know it's done?"
      - "What cleanup is needed?"
```

### Example: Job Map for "Prepare a Healthy Meal"

```yaml
job_map:
  main_job: "Prepare a healthy meal for my family"

  stages:
    1_define:
      name: "Define what to make"
      sub_jobs:
        - "Decide on dietary constraints"
        - "Consider family preferences"
        - "Check what's in the fridge"
        - "Find a suitable recipe"

    2_locate:
      name: "Locate ingredients"
      sub_jobs:
        - "Identify what's needed"
        - "Check pantry inventory"
        - "Make shopping list for missing items"
        - "Go to store if needed"

    3_prepare:
      name: "Prepare ingredients"
      sub_jobs:
        - "Wash produce"
        - "Chop vegetables"
        - "Marinate proteins"
        - "Measure spices"

    4_confirm:
      name: "Confirm readiness"
      sub_jobs:
        - "Verify all ingredients prepped"
        - "Preheat oven/stove"
        - "Check timing for each component"

    5_execute:
      name: "Cook the meal"
      sub_jobs:
        - "Follow recipe steps"
        - "Coordinate multiple dishes"
        - "Adjust seasoning"

    6_monitor:
      name: "Monitor cooking"
      sub_jobs:
        - "Check temperatures"
        - "Taste for seasoning"
        - "Watch timing"

    7_modify:
      name: "Adjust as needed"
      sub_jobs:
        - "Add more seasoning"
        - "Adjust heat levels"
        - "Extend/reduce cooking time"

    8_conclude:
      name: "Serve and clean"
      sub_jobs:
        - "Plate attractively"
        - "Serve family"
        - "Store leftovers"
        - "Clean kitchen"
```

## Outcome Statements

### Outcome Statement Structure

```text
[Direction] + [Measure] + [Object of Control] + [Context]
```

**Components:**

| Component | Description | Examples |
| --------- | ----------- | -------- |
| Direction | What to do with the measure | Minimize, Maximize, Increase, Reduce |
| Measure | What's being measured | Time, Likelihood, Effort, Accuracy |
| Object of Control | What the measure applies to | Finding a recipe, Prepping vegetables |
| Context | When this applies | When cooking for guests, When short on time |

### Writing Effective Outcome Statements

```yaml
outcome_examples:
  good_examples:
    - "Minimize the time it takes to find a suitable recipe"
    - "Increase the likelihood that the meal turns out well"
    - "Reduce the effort required to clean up after cooking"
    - "Minimize the risk of overcooking proteins"
    - "Maximize the variety of meals cooked per week"

  improvement_examples:
    before: "Easy to use"
    after: "Minimize the time it takes to learn the interface"

    before: "Reliable"
    after: "Minimize the likelihood of unexpected errors during use"

    before: "Fast"
    after: "Minimize the time it takes to complete [specific action]"
```

### Outcome Categories

```yaml
outcome_types:
  speed:
    direction: Minimize/Reduce
    measures: time, duration, wait
    examples:
      - "Minimize the time it takes to..."
      - "Reduce the time spent waiting for..."

  reliability:
    direction: Minimize/Reduce
    measures: likelihood of failure, probability of error
    examples:
      - "Minimize the likelihood of [negative outcome]"
      - "Reduce the probability of [error]"

  output_quality:
    direction: Maximize/Increase
    measures: accuracy, completeness, precision
    examples:
      - "Maximize the accuracy of..."
      - "Increase the completeness of..."

  effort:
    direction: Minimize/Reduce
    measures: effort, complexity, steps
    examples:
      - "Minimize the effort required to..."
      - "Reduce the number of steps needed to..."

  cost:
    direction: Minimize/Reduce
    measures: cost, expense, resources
    examples:
      - "Minimize the cost of..."
      - "Reduce the resources consumed by..."
```

## Opportunity Scoring

### Importance vs Satisfaction

```yaml
opportunity_algorithm:
  formula: "Opportunity = Importance + (Importance - Satisfaction)"

  interpretation:
    10-15: "Low opportunity - well served"
    15-18: "Moderate opportunity"
    18-20: "High opportunity - underserved"

  example:
    outcome: "Minimize time to find a recipe"
    importance: 9  # Out of 10
    satisfaction: 4  # Out of 10
    opportunity: 14  # 9 + (9-4) = 14
```

### Opportunity Landscape

```text
                    HIGH IMPORTANCE (8-10)
                          │
     OVER-SERVED          │         UNDERSERVED
    (Low opportunity)     │      (High opportunity)
    Score: 0-10           │        Score: 15-20
                          │
                          │         ★ TARGET THESE
  ────────────────────────┼────────────────────────
                          │
    APPROPRIATELY         │        APPROPRIATELY
      SERVED              │          SERVED
    (Low priority)        │       (Maintain)
    Score: 5-10           │        Score: 10-15
                          │
                    LOW IMPORTANCE (1-5)
                          │
        LOW SATISFACTION ─┼─ HIGH SATISFACTION
             (1-5)        │        (6-10)
```

### Survey for Scoring

```yaml
survey_format:
  for_each_outcome:
    importance_question:
      text: "How important is it to you to [outcome]?"
      scale: 1-10
      anchors:
        1: "Not important at all"
        10: "Extremely important"

    satisfaction_question:
      text: "How satisfied are you with your ability to [outcome]?"
      scale: 1-10
      anchors:
        1: "Not satisfied at all"
        10: "Extremely satisfied"
```

## From Jobs to Requirements

### Translation Pattern

```yaml
translation_process:
  step_1_identify_job:
    example_job: "Keep track of team progress on projects"

  step_2_map_stages:
    stages:
      - "Define project milestones"
      - "Assign tasks to team members"
      - "Track completion status"
      - "Report progress to stakeholders"

  step_3_write_outcomes:
    outcomes:
      - "Minimize time to see overall project status"
      - "Reduce likelihood of missing deadlines"
      - "Minimize effort to generate progress reports"
      - "Increase accuracy of completion estimates"

  step_4_score_opportunities:
    highest_opportunity: "Reduce likelihood of missing deadlines"
    importance: 9
    satisfaction: 3
    score: 15

  step_5_derive_requirements:
    from_outcome: "Reduce likelihood of missing deadlines"
    functional_requirements:
      - "Automatic deadline reminders 3/2/1 days before due"
      - "Visual timeline showing upcoming deadlines"
      - "Risk indicators for tasks falling behind"

    non_functional_requirements:
      - "Notifications within 1 minute of deadline threshold"
      - "Dashboard loads in under 2 seconds"
```

### Requirements Mapping Table

```yaml
job_to_requirement_mapping:
  job_dimension: functional
  job_statement: "Track completion status of team tasks"
  key_outcomes:
    - outcome: "Minimize time to see task status"
      requirements:
        - "At-a-glance dashboard with task counts"
        - "Color-coded status indicators"

    - outcome: "Increase accuracy of progress tracking"
      requirements:
        - "Automatic time tracking integration"
        - "Percentage complete calculations"

  job_dimension: emotional
  job_statement: "Feel confident about project progress"
  key_outcomes:
    - outcome: "Reduce anxiety about project status"
      requirements:
        - "Clear health indicators (green/yellow/red)"
        - "Proactive alerts for issues"

  job_dimension: social
  job_statement: "Demonstrate team accountability to stakeholders"
  key_outcomes:
    - outcome: "Increase stakeholder confidence"
      requirements:
        - "Professional export/report formats"
        - "Real-time sharing capabilities"
```

## Job Hierarchy

### Decomposing Jobs

```yaml
job_hierarchy:
  main_job: "Manage my personal finances"

  sub_jobs:
    - "Track income and expenses"
      micro_jobs:
        - "Record transactions"
        - "Categorize spending"
        - "Reconcile accounts"

    - "Plan for the future"
      micro_jobs:
        - "Set savings goals"
        - "Create a budget"
        - "Monitor progress"

    - "Optimize spending"
      micro_jobs:
        - "Identify waste"
        - "Find better deals"
        - "Reduce subscriptions"

    - "Handle taxes"
      micro_jobs:
        - "Track deductible expenses"
        - "Prepare tax documents"
        - "File returns"
```

### Choosing the Right Job Level

```yaml
job_level_guidance:
  too_high:
    example: "Live a good life"
    problem: "Too abstract to act on"

  too_low:
    example: "Click the submit button"
    problem: "Too granular, just a step"

  just_right:
    example: "Prepare a healthy meal for my family"
    criteria:
      - "Stable over time (won't change with technology)"
      - "Has clear beginning and end"
      - "Customer would recognize and relate to it"
      - "Can be improved with better solutions"
```

## Output Templates

### Job Analysis Summary

```yaml
job_analysis:
  job_statement: "When [situation], I want to [motivation], so I can [outcome]"

  job_executor: "[Primary user persona]"

  job_dimensions:
    functional: ["List of functional jobs"]
    emotional: ["List of emotional jobs"]
    social: ["List of social jobs"]

  job_map:
    - stage: "Define"
      sub_jobs: ["..."]
    - stage: "Execute"
      sub_jobs: ["..."]
    - stage: "Conclude"
      sub_jobs: ["..."]

  key_outcomes:
    - outcome: "..."
      importance: 0
      satisfaction: 0
      opportunity: 0

  top_opportunities:
    - "Highest scoring outcome"
    - "Second highest"
    - "Third highest"

  requirements_derived:
    - requirement_id: "REQ-001"
      from_outcome: "..."
      text: "..."
```

### Competitive Analysis Using JTBD

```yaml
competitive_jtbd_analysis:
  job: "Track completion status"

  competitors:
    - name: "Competitor A"
      outcomes_served:
        - outcome: "Minimize time to see status"
          how_well: 8
        - outcome: "Reduce effort to update"
          how_well: 5

    - name: "Our Product"
      outcomes_served:
        - outcome: "Minimize time to see status"
          how_well: 6
        - outcome: "Reduce effort to update"
          how_well: 9

  gaps_to_exploit:
    - "Competitor A weak on effort to update"

  threats_to_address:
    - "We're behind on time to see status"
```
