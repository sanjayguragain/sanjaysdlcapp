# Agent & Skill Development Guidelines

Reference guide for building standardized agents and skills based on clearly demarcated guideline based capability building and Agent Skills standards.

## Guideline Based Capability Building: Core Principles

### Standard Work Approach
- **Clarity creates capacity** - Well-defined processes enable consistent execution
- **Reuse first, update second, create new last** - Always check existing capabilities before adding new ones
- **Controlled capability** - Actions available in standard shape with clear inputs/outputs
- **Guardrails matter** - Authorization, consent, and scope prevent system failures

### Key Concepts

**Model Context Protocol (MCP)** - Standard infrastructure for connecting AI applications to tools and context
- **Tools** - Concrete actions (create, modify, trigger)
- **Resources** - Read-only materials (files, schemas, documentation)
- **Prompts** - Standardized ways to run common tasks

**Agents** - The decision makers
- Responsible for specific domain/workflow
- Explicit specification file with responsibilities, boundaries, tone
- Can delegate to skills and other agents
- No independent authority beyond scope

**Sub-Agents** - Focused workers (sous-chefs)
- Narrow, specific scope
- Parallel execution capability
- No authority beyond parent agent
- Clear responsibility stations

**Skills** - Reusable techniques/behaviors
- How to do something (not why)
- Repeatable routines that can be relied upon
- Consistent execution method
- Can be composed into larger workflows

### Technical Specifications & Constraints

Define what "done" looks like:
- **Desired output format** - Document type, structure
- **Policy boundaries** - What must never be done
- **Data boundaries** - Allowed sources
- **Time/cost limits** - Resource constraints
- **Quality checks** - What "good" looks like

## Agent Skills Standard Format

### Directory Structure

**Agents** (single file per agent):
```
.github/agents/
├── 1-AI-Agent-Builder-Agent.agent.md
├── 5-PRD-App-Builder.agent.md
├── 5-DevOps-Workflow-Agent.agent.md
└── 6-Azure-Deployment-Agent.agent.md
```

**Skills** (folder per skill):
```
.github/skills/
├── sce-devops-ci-workflow-generator/
│   ├── SKILL.md              # Specification
│   ├── skill.json            # Metadata
│   ├── scripts/              # Implementation
│   ├── templates/            # Reusable templates
│   └── examples/             # Usage examples
└── sce-security-token-validator/
    ├── SKILL.md
    ├── skill.json
    └── scripts/
```

### SKILL.md Format

```markdown
---
name: <skill-name>
version: <version>
author: <author>
description: >
  One-sentence description of what skill does.
  Can span multiple lines if needed.
tags:
  - tag1
  - tag2
allowed-tools: [Tool1, Tool2]
compatibility:
  - agent-type-1
  - agent-type-2

---

# Skill Name

## Overview
Clear explanation of what the skill does.

## When to Use
Specific scenarios where this skill applies.

## Unitary Function
**ONE RESPONSIBILITY:** State what this skill owns.

**NOT RESPONSIBLE FOR:**
- Related but separate concerns (point to other skills)

## Input
- **param1**: Description
- **param2**: Optional with default

## Output
Example output format with structure.

## Usage Example
```bash
command --flag value
```

## Safety Rules
1. Read-only vs write operations
2. What it never does
3. Scope boundaries
```

### AGENT.md Format

```markdown
---
name: <agent-name>
version: <version>
author: <author>
description: >
  What decisions this agent makes and what it orchestrates.
responsibility: >
  Explicit statement of what this agent owns.
authority: >
  What this agent can decide vs what requires approval.
boundaries: >
  Hard limits on scope.
tone: <tone>  # professional, creative, technical, etc.
---

# Agent Name

## Overview
What this agent does.

## Responsibilities
- Decision 1
- Decision 2

## Boundary Conditions
- Cannot do X
- Must never Y
- Requires approval for Z

## Skills
- skill-name-1
- skill-name-2
```

## Naming Conventions

### Skill Naming
- **Prefix:** `sce-` (Standard Capability Entity)
- **Format:** `sce-<domain>-<capability>` or `sce-<verb>-<noun>`
- **Examples:**
  - `sce-workflow-analyzer` - analyzes workflows
  - `sce-security-scanner` - scans for security issues
  - `sce-api-validator` - validates APIs
  - `sce-requirement-gatherer` - gathers requirements

### Agent Naming
- **Display Name (frontmatter `name:`):** `N - <SDLC Phase> - <Agent Title>`
- **File Format:** `N-<Agent-Title>.agent.md` (single file at `.github/agents/` root)
- **Examples:**
  - `name: "1 - Strategy & Planning - AI Agent Builder"` → `1-AI-Agent-Builder-Agent.agent.md`
  - `name: "5 - Test & Build - Application Builder"` → `5-PRD-App-Builder.agent.md`
  - `name: "6 - Change & Release - DevOps Workflow Agent"` → `5-DevOps-Workflow-Agent.agent.md`

### Agent File Structure
Agent files use frontmatter format:
```markdown
---
description: 'Brief description of what this agent does and when to use it.'
tools:
  - skill-name-1
  - skill-name-2
---

# Agent Name

## Purpose
What this agent accomplishes...

## What This Agent Does
1. First responsibility
2. Second responsibility

## Skills
- skill-name-1
- skill-name-2

## When to Use This Agent
- Scenario 1
- Scenario 2

## Authority & Boundaries
**This Agent CAN:** ...
**This Agent CANNOT:** ...

## Workflow Process
Step-by-step process...

## Inputs
What inputs it expects...

## Outputs
What it produces...

## Progress Reporting
How it communicates progress...

## Escalation / Asking for Help
When it asks for human input...
```

### Skill JSON Format

```json
{
  "name": "sce-skill-name",
  "version": "1.0.0",
  "author": "Team Name",
  "description": "Clear description of skill purpose",
  "category": "Category Name",
  "tags": ["tag1", "tag2"],
  "license": "MIT",
  "compatibility": ["agent-type-1", "agent-type-2"],
  "allowed-tools": ["Tool1", "Tool2"]
}
```

## Reuse-First Strategy

### Analysis Before Creation (RAUC)

1. **Reuse** - Does an existing skill/agent do this?
   - Check `.github/skills/` for similar skills
   - Check `.github/agents/` for related agents
   - Review SKILL.md descriptions and tags

2. **Adapt** - Can we modify existing skill?
   - Update SKILL.md description
   - Add new capability to existing skill
   - Extend parameters or outputs
   - Update version number (semantic versioning)

3. **Update** - Do we need to enhance existing infrastructure?
   - Add reference materials
   - Improve documentation
   - Expand examples
   - Create related skill for complementary capability

4. **Create** - Only when truly new capability needed
   - Follows unitary function principle
   - Has clear, focused responsibility
   - Cannot be composed from existing skills
   - Provides unique value

### Reuse Decision Tree

```
New Capability Needed?
    ├─ 100% match exists? → Use existing skill
    ├─ 70-99% match? → Adapt existing skill
    ├─ 50-69% match? → Consider skill composition
    ├─ 20-49% match? → Maybe add sub-skill
    └─ <20% match? → Create new skill (rare)
```

## Pancake Protocol Patterns

### Composability
- Skills are "pancake mix" - pre-measured kits
- Agents combine skills like ingredients
- Sub-agents handle focused work stations
- No skill should be a "megakit"

### Guardrails
- Every agent has explicit boundaries
- Every skill has scope definition
- No secret capabilities
- Humans understand what agent can do

### Interaction Patterns
- Clear input/output contracts
- Metadata for discovery
- Version compatibility stated
- Dependencies explicit

## Skills Declaration Standard

Every agent that uses skills **must** include a `## Skills` section in its body listing each skill by its exact ID (the folder name or frontmatter `name` in `.github/skills/`). This section is the **authoritative source** for the dependency graph.

### Format

```markdown
## Skills

- sce-workflow-analyzer
- sce-security-scanner
- dependency-scanner
```

### Rules

1. **Heading must be exactly `## Skills`** — not "Skills to Invoke", "Integration with Skills", etc.
2. **One skill per bullet** — plain `-` list, no descriptions or annotations.
3. **Use exact skill IDs** — must match either the folder name or the `name:` field in the skill's SKILL.md frontmatter.
4. **Alphabetical order** — keeps diffs clean and makes scanning easy.
5. **CI validates references** — `python scripts/build-graph.py --validate` fails if any listed skill doesn't exist in `.github/skills/`.
6. **Agents with no skills** — omit the section entirely (don't add an empty section).

### Tooling

- `python scripts/build-graph.py` — reads `## Skills` sections as the authoritative source for `uses-skill` edges.
- `python scripts/build-graph.py --validate` — checks that every skill ref resolves to an actual skill.
- `python scripts/migrate-skills-section.py --apply` — migrates old-style skill sections to the standard format.

## Quality Checklist

Before marking skill/agent as complete:

**Documentation**
- [ ] SKILL.md or AGENT.md complete
- [ ] Clear description of purpose
- [ ] Usage examples included
- [ ] Safety rules documented

**Structure**
- [ ] Follows naming convention
- [ ] Appropriate tags added
- [ ] Version number set
- [ ] Compatibility stated

**Responsibility**
- [ ] Unitary function clear
- [ ] Boundaries explicit
- [ ] Non-responsibilities listed
- [ ] No scope creep

**Reuse Consideration**
- [ ] Checked for existing similar capability
- [ ] Evaluated adaptation vs creation
- [ ] Documented why new skill needed
- [ ] Connected to related skills

## References

- **The Pancake Protocol**: https://tedt.org/The-Pancake-Protocol/
- **Agent Skills Standard**: https://agentskills.io/
- **Agent Skills Specification**: https://agentskills.io/specification
- **MCP Documentation**: Part of Pancake Protocol

## Related Skills in Repository

- `sce-agent-builder-agent` - Orchestrates building agents
- `sce-agent-skill-analyzer` - Analyzes existing agents/skills
- `sce-skill-generator` - Generates skill templates
- `sce-agent-generator` - Generates agent templates
