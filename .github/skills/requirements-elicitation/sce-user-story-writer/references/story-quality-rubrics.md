User Story Quality Rubrics
==========================

Use this file when evaluating or improving the quality of a user story.

INVEST
------

INVEST is the most common lightweight rubric for user story quality.

- Independent: The story should minimize coupling to other stories where practical.
- Negotiable: The story should describe the need and value, not lock in every implementation detail.
- Valuable: The story should create clear user or business value.
- Estimable: The story should be clear enough that the team can reason about effort and risk.
- Small: The story should be narrow enough to implement and validate coherently.
- Testable: The story should support clear acceptance criteria and evidence of done.

SMART
-----

SMART is useful when a story is vague on outcome or success conditions.

- Specific: The story is concrete rather than generic.
- Measurable: Success can be observed or validated.
- Achievable: The story is realistic within delivery constraints.
- Relevant: The story ties to a real goal or outcome.
- Time-aware: The story is sized for an execution window rather than open-ended ambition.

6Cs
---

The 6Cs help evaluate whether the story is well-formed as a requirement artifact.

- Clear: The wording is easy to understand.
- Concise: The statement avoids extra noise.
- Complete: The key role, action, and benefit are present.
- Consistent: The story aligns with surrounding backlog and terminology.
- Correct: The story reflects the intended need accurately.
- Confirmable: The story can be validated through acceptance criteria or review.

Heuristics
----------

- Prefer INVEST as the primary quality check.
- Use SMART when the value or success signal is weak.
- Use the 6Cs when the wording itself is confusing or incomplete.
- If a story fails `Small`, split the behavior into multiple stories rather than bloating Gherkin.
- If a story fails `Valuable`, rewrite the benefit before polishing the rest.
