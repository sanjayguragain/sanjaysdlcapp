#!/usr/bin/env python3

import argparse
import datetime as dt
import os
import re
from pathlib import Path


TEMPLATE = """# Product Requirements Document (PRD)

## Document Information & Revision History

**Product / Project:** {product_name}
**Document Version:** {doc_version}
**Status:** {status}
**Author:** {author}
**Last Updated:** {date}

### Revision History

| Version | Date | Author | Summary |
|---|---|---|---|
| {doc_version} | {date} | {author} | Initial draft (scaffold created). |

## Executive Summary

**Problem / Opportunity**
- TBD

**Target Users**
- TBD

**Proposed Solution**
- TBD

**Leading Indicators (Early Signals)**
| Indicator | Baseline | Target | Measurement Window | Data Source | Owner |
|---|---:|---:|---|---|---|
| TBD | TBD | TBD | TBD | TBD | TBD |

**Success Metrics (Outcomes / KPIs)**
| Outcome KPI | Baseline | Target | Timeframe | Data Source | Owner |
|---|---:|---:|---|---|---|
| TBD | TBD | TBD | TBD | TBD | TBD |

**Scope Summary**
- In scope (Release 1): TBD
- Not included: TBD

## Project Background & Overview

TBD

## Objectives & Success Metrics

| Objective ID | Objective | KPI / Metric | Baseline | Target | Timeframe | Data Source | Owner |
|---|---|---|---:|---:|---|---|---|
| OBJ-001 | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

## Scope of Work

**In Scope**
- TBD

**Out of Scope**
- TBD

## Release Plan / Phasing

| Phase | Goal | Users / Rollout | Included Capabilities (Epics) | Exit Criteria | Not Included / Deferred |
|---|---|---|---|---|---|
| 0 — Discovery | TBD | TBD | TBD | TBD | TBD |
| 1 — MVP Build | TBD | TBD | TBD | TBD | TBD |
| 2 — Pilot | TBD | TBD | TBD | TBD | TBD |
| 3 — GA | TBD | TBD | TBD | TBD | TBD |
| 4 — Phase 2+ | TBD | TBD | TBD | TBD | TBD |

**Scope negotiation rules**
- TBD

## Out of Scope / Anti-Goals / Future Ideas

| Item | Category (Out of Scope / Anti-Goal / Future Idea) | Rationale | Revisit Trigger | Owner |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## Stakeholders

| Stakeholder | Role | Interest / Contribution | Decision Authority |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Operating Environment & Technical Constraints

TBD

## User Personas

### Persona 1 — TBD
- **Profile:** TBD
- **Needs:** TBD
- **Frustrations:** TBD

## User Scenarios & Use Cases

### Scenario 1 — TBD
- **Narrative:** TBD
- **Acceptance Criteria (Critical scenario — Gherkin):**
  - **Given** TBD
  - **When** TBD
  - **Then** TBD

## Functional Requirements & Features

### Requirements

| ID | Priority (Must/Should/Could) | Requirement |
|---|---|---|
| FR-001 | TBD | TBD |

### Notes
- Functional requirements must be clear and testable.

## Traceability Matrix (Objectives → Scenarios → Requirements)

| Objective ID | Scenario(s) | Requirement IDs |
|---|---|---|
| OBJ-001 | TBD | FR-001 |

## UI / UX Design Specifications

TBD

## Data Management & Governance

| Rule ID | Data Entity | System of Record | Owner | Steward | Classification | Rule |
|---|---|---|---|---|---|---|
| DG-001 | TBD | TBD | TBD | TBD | TBD | TBD |

## Security & Compliance Requirements

| ID | Requirement |
|---|---|
| SEC-001 | TBD |

## Non-Functional Requirements / Quality Attributes

| ID | Category | Requirement |
|---|---|---|
| NFR-001 | TBD | TBD |

## Product Architecture Overview

TBD

## Assumptions & Dependencies

**Assumptions**
- TBD

**Dependencies**
- TBD

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## Open Questions / Issues Log

| ID | Question | Owner | Needed-by | Status |
|---|---|---|---|---|
| Q-01 | TBD | TBD | TBD | OPEN |

## Supporting Materials

### Appendix & References

- PRD Template reference: https://tedt.org/product-requirements-document-prd-template-4/
"""


def to_kebab_case(value: str) -> str:
    value = value.strip()
    value = re.sub(r"[^A-Za-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value)
    return value.strip("-").lower()


def main() -> int:
    parser = argparse.ArgumentParser(description="Scaffold a PRD Markdown file using Template 4 headings.")
    parser.add_argument("--product-name", required=True, help="Product/Project name")
    parser.add_argument("--author", default="TBD", help="Author name")
    parser.add_argument("--status", default="Draft", help="Document status")
    parser.add_argument("--doc-version", default="0.1", help="Document version")
    parser.add_argument("--output-dir", default="docs/PRD", help="Output directory (default: docs/PRD)")
    parser.add_argument("--force", action="store_true", help="Overwrite if the PRD file already exists")

    args = parser.parse_args()

    slug = to_kebab_case(args.product_name)
    if not slug:
        raise SystemExit("Product name produced an empty slug")

    repo_root = Path(__file__).resolve().parents[4]
    output_dir = repo_root / args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    output_path = output_dir / f"PRD-{slug}.md"
    if output_path.exists() and not args.force:
        raise SystemExit(f"PRD already exists: {output_path}. Re-run with --force to overwrite.")

    today = dt.date.today().isoformat()
    content = TEMPLATE.format(
        product_name=args.product_name,
        doc_version=args.doc_version,
        status=args.status,
        author=args.author,
        date=today,
    )

    output_path.write_text(content, encoding="utf-8")
    print(f"Wrote PRD scaffold: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
