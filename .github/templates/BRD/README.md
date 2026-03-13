# BRD Downstream Package Template

This folder contains the canonical downstream contract for artifacts produced by `3 - Analysis - BRD Technical Requirement Generator`.

Depending on the requesting team, this downstream package may also be described as system requirements, SRD content, engineering requirements, solution requirements, supplemental requirements, supplementary specification, technical specification, architectural characteristics, architectural drivers, non-functional requirements, quality attributes, quality requirements, operational requirements, platform requirements, service requirements, integration requirements, or technical constraints.

## What this is

- `BRD-to-TECH-REQ-PACKAGE.schema.json` is the machine-readable schema for the normalized BRD companion package.
- `BRD-to-TECH-REQ-PACKAGE.example.json` is a worked example showing how an immutable externally owned BRD becomes a downstream package.
- The schema is intended for downstream consumers that need a stable contract without modifying the source BRD.

## Why this exists

In this workflow, the BRD is generally owned by an upstream team and must be treated as immutable.

That means downstream teams need a separate package that:

- preserves the source BRD as received
- normalizes BRD requirements into a working register
- derives technical requirements with explicit traceability
- identifies traceability gaps that require upstream clarification

## Canonical outputs

The BRD Technical Requirement Generator should use this schema for JSON outputs such as:

- `docs/BRD/BRD-REQ-REGISTER-{initiative-name-kebab-case}.json`
- `docs/BRD/TECH-REQ-{initiative-name-kebab-case}.json`
- `docs/BRD/TRACE-GAP-{initiative-name-kebab-case}.json`

The agent may emit these as separate files or as one logical package split across companion artifacts, but the field semantics should align with the schema in this folder.

## Markdown section order

When emitting Markdown artifacts, use this section order:

1. Source BRD Metadata
2. Immutability Statement
3. Normalized BRD Requirement Register
4. Technical Requirements
5. BRD-to-Technical-Requirement Trace Matrix
6. Traceability Gaps Requiring Upstream BRD Clarification
7. Quality Attribute Coverage Summary
8. Operational Quality Scenarios
9. Open Questions
10. Readiness Decision

## Usage guidance

- Do not edit or rewrite the source BRD to make it fit this schema.
- If the BRD lacks explicit requirement IDs, use surrogate normalization IDs such as `NBR-001` in the companion package only.
- If a technical requirement cannot be tied to an explicit BRD requirement, record it as a traceability gap rather than silently accepting it.
