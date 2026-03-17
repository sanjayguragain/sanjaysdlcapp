# Agent Skills Standard: Quick Reference

Concise reference to Agent Skills from <https://agentskills.io/>

## What is an Agent Skill?

A skill is a self-contained, reusable capability that agents can learn and execute.

**Purpose:** Give agents new expertise and abilities in a standardized, composable way.

**Analogy:** Teaching a chef new techniques (how to make croissants, flambe desserts, plate artfully).

## Key Characteristics

**Reusable** — Written once, used by many agents across different products

**Standardized** — Common format enables discovery and composition

**Declarative** — Agents understand what the skill does without reading implementation code

**Modular** — Skills combine without conflicts or rebuilding the whole system

**Documented** — Clear specifications and usage instructions included

## Standard Structure

Every skill is a folder with:

```
skill-name/
├── SKILL.md              # Specification & documentation
├── skill.json            # Metadata
├── scripts/              # Implementation (Python, Bash, etc.)
├── resources/            # Data files, templates, schemas
├── prompts/              # Instruction templates
└── README.md             # Quick summary
```

### SKILL.md Template Structure

```markdown
# Skill: [Name]

## Overview
Brief description of what the skill does and why

## Responsibility
Core domain and constraints of this skill

## Inputs
```json
{
  "required_param": "type and description",
  "optional_param": "type and description"
}
```

## Outputs

```json
{
  "result": "type and structure of output"
}
```

## Decision Tree / Logic

How the skill makes decisions (if applicable)

## Error Handling

What happens when things go wrong

## Examples

Concrete examples of using the skill

## Dependencies

External systems, APIs, or resources required

## Limitations

What this skill does NOT do
```

### skill.json Template

```json
{
  "name": "skill-name",
  "version": "1.0.0",
  "description": "Brief description",
  "author": "Your Name",
  "license": "MIT",
  "tags": ["domain", "capability", "type"],
  "compatibility": {
    "minimum_agent_version": "1.0.0",
    "agents": ["all", "or", "specific"]
  },
  "required_tools": ["bash", "python", "curl"],
  "allowed_tools": ["bash", "read", "grep"],
  "external_dependencies": ["python-package"],
  "resource_files": ["template.md", "schema.json"]
}
```

## Naming Convention

```
sce-<domain>-<capability>

Examples:
- sce-security-token-validator
- sce-devops-container-builder
- sce-osint-domain-analyzer
- sce-data-privacy-scanner

Pattern: sce = Skills Capability Ecosystem (or domain prefix)
```

## The Reuse-First Strategy

Before creating a new skill, always check:

1. **Existing skill does 90-100%?** → **REUSE** it exactly
2. **Existing skill does 70-89%?** → **ADAPT** by extending it
3. **Can combine 2-3 skills?** → **COMPOSE** via orchestrator
4. **Partial matches (40-69%)?** → **ADAPT existing + CREATE new** for gaps
5. **Less than 40% match?** → **CREATE** new skill (but justify why)

**Goal:** Maximize reuse, minimize creation.

## Quality Checklist for Skills

Before submitting a skill:

- [ ] **Documentation** - SKILL.md is complete and clear
- [ ] **Responsibility** - Skill has ONE clear, focused domain
- [ ] **Structure** - Folder layout matches standard format
- [ ] **Inputs/Outputs** - JSON schemas are well-defined
- [ ] **Examples** - Real usage examples included
- [ ] **Error Handling** - Covers failure modes
- [ ] **Reuse Check** - Verified no existing skill covers this
- [ ] **Dependencies** - All external requirements listed
- [ ] **Metadata** - skill.json is accurate and complete
- [ ] **Testing** - Scripts work as documented

## Composability: Combining Skills

Skills work together through:

**Sequential Composition**
```
Input → Skill A → Skill B → Output
```

**Parallel Composition**
```
       ├→ Skill A ─┐
Input ─┤           ├→ Aggregator
       └→ Skill B ─┘
```

**Orchestrated Composition** (via an agent)
```
Agent decides:
  if condition → call Skill X
  else → call Skills Y + Z
```

## Common Patterns

### Analyzer Skills

Examine data, identify patterns, generate findings

Example: `sce-security-token-scanner`

### Transformer Skills

Convert from one format to another

Example: `sce-data-format-converter`

### Validator Skills

Check if something meets criteria

Example: `sce-api-spec-validator`

### Generator Skills

Create new content based on inputs

Example: `sce-documentation-generator`

### Orchestrator (Agent-like Skills)

Coordinate other skills to solve complex problems

Example: `sce-incident-coordinator`

## Adoption

Agent Skills standard is adopted by:

- **Anthropic** Claude (Original standard creator)
- **Goose** (Codegen agent)
- **Amp** (Agency platform)
- **OpenAI** Products (GPT ecosystem)
- **Factory** (Workflow platform)

## Where to Find Skills

- **Official Registry:** <https://agentskills.io/registry>
- **GitHub:** Search for `sce-` prefix
- **Your Repository:** `.github/skills/` directory

## Creating Your First Skill

1. **Identify the capability** - What can you teach agents to do?
2. **Check for reuse** - Does something similar exist?
3. **Define inputs/outputs** - What goes in? What comes out?
4. **Write SKILL.md** - Complete specification
5. **Create scripts** - Implementation code
6. **Test it** - Does it work as documented?
7. **Add metadata** - skill.json with tags and dependencies
8. **Submit** - Make available to other agents

## Key Principles

**Self-Contained** — Skill works without external config

**Discoverable** — Name, tags, and description enable finding it

**Observable** — Outputs are clear, errors are meaningful

**Composable** — Works with other skills without conflicts

**Documented** — Anyone can understand and use it

## Quick Decision Tree

```markdown
Do we need new capability?
├─ YES: Does something similar exist? (90%+ match)
│  ├─ YES: Use REUSE, don't create new
│  └─ NO: Proceed to create new skill
├─ NO: Check our existing skills first
│  ├─ Found match: Use ADAPT/COMPOSE
│  └─ No match: Plan new skill
└─ Unknown: Run skill analyzer to check repository
```

## Common Mistakes to Avoid

❌ **God-Skills** - One skill doing everything (violates single responsibility)

❌ **Hidden Dependencies** - External requirements not documented

❌ **Unclear I/O** - Ambiguous inputs or outputs cause confusion

❌ **No Error Handling** - Skill crashes instead of graceful failure

❌ **Missing Examples** - Documentation without concrete usage

❌ **Duplicate Skill** - Creating when existing skill covers 90%+

## References

- **Specification:** <https://agentskills.io/specification>
- **Registry:** <https://agentskills.io/registry>
- **Getting Started:** <https://agentskills.io/guides/getting-started>
- **Best Practices:** <https://agentskills.io/guides/best-practices>
- **Community:** <https://discord.gg/agentskills> (if exists)

---

**Use this reference when:**

- Creating new skills
- Understanding skill structure
- Checking naming conventions
- Deciding whether to create or reuse
- Documenting skill I/O
- Implementing composable capabilities
