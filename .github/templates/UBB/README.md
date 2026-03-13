# UBB Template

This folder contains the canonical Universal Building Block template derived from the original UBB prompt and now used by the UBB skill and UBB Builder workflow for non-standard technology review packages.

## What this is

- [UBB-{abstraction-level}-{building-block-name-kebab-case}.md](UBB-%7Babstraction-level%7D-%7Bbuilding-block-name-kebab-case%7D.md) is the reusable UBB template.
- It includes section-by-section instructions marked as `DO NOT OUTPUT` plus an output template for each section.

## How it is used

- The default Universal Building Block prompt is now a thin router into the UBB Builder workflow.
- The legacy template-heavy behavior is preserved in `.github/prompts/LEGACY-Architecture-Universal-Building-Block.prompt.md`.
- When generating UBB artifacts for a standards-deviation package, the consuming prompt, skill, or agent should output only the filled profile content.
- Instruction blocks should not appear in the final generated UBB profile.

## Conventions enforced by the template

- Every UBB profile must declare whether it is an `ABB` or `SBB`.
- Every UBB profile must classify the building block as one or more of `Business`, `Data`, `Application`, or `Technology`.
- The automatic UBB workflow should be used only when a proposed technology is not already approved in `docs/standards/TECH_STACK_STANDARDS.md`.
- For that workflow, create one governing `ABB` plus the candidate `SBB` set that informed the decision.
- The file naming convention is `UBB-{abstraction-level}-{building-block-name-kebab-case}.md`.
- Write ABB outputs to `docs/UBB/ABB/` unless the user explicitly specifies another location.
- Write SBB outputs to `docs/UBB/SBB/` unless the user explicitly specifies another location.
- Include purpose, use cases, scope, inputs and outputs, dependencies, examples, selection guidance, and compliance considerations.
- Preserve uncertainty as `TBD` rather than inventing facts.

## Output location

This repo already provides the following default output locations:

- `docs/UBB/ABB/` for architecture building blocks
- `docs/UBB/SBB/` for solution building blocks

Until a broader architecture-document convention replaces this, treat those folders as the default destination for UBB deliverables.
