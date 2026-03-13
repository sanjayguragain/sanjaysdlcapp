User Story Format
=================

Use this file as the canonical output structure for the skill.

Update this format file when you want to change the layout, headings, naming pattern, or level of detail. The skill should follow this file rather than improvising its own structure.

Story ID (Optional)
-------------------

`<PRODUCT>-US-<PARENT>-<SEQUENCE>`

Include this section only when the prompt or team standard provides an ID convention.

User Story
----------

As a `<user role>`, I want `<capability or action>`, so that `<outcome or benefit>`.

Story Context
-------------

- Persona: `<persona or stakeholder>`
- Source / Reference: `<document, note, conversation, or file>`
- Constraints: `<known constraints or None provided>`

Gherkin Acceptance Criteria
---------------------------

Add one scenario block for each materially distinct behavior that must be tested.

**Scenario N: `<brief scenario name>`**

```gherkin
Scenario: <Brief description>
  Given <starting condition / preconditions>
    And <additional context if needed>
  When <action taken by user or system>
  Then <expected outcome>
    And <optional second outcome>
    And <optional third outcome>
```

Recommended Verification Approach
---------------------------------

- `<one verification type from the approved list>` - `<one-sentence activity that confirms we built the system right>`

Select exactly one verification approach unless the user explicitly asks for more than one.

Recommended Validation Approach
-------------------------------

- `<one validation type from the approved list>` - `<one-sentence activity that confirms we built the right system>`

Select exactly one validation approach unless the user explicitly asks for more than one.

Open Questions
--------------

- `<missing fact, ambiguity, or dependency>`
