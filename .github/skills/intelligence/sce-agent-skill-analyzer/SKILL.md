---
name: sce-agent-skill-analyzer
description: 'Analyzes the repository for existing agents and skills to support a reuse-first strategy. Checks whether a new capability can be covered by existing agents/skills, or whether adaptation/creation is needed. Returns an analysis report with recommendations.'
compatibility:
  - 1 - Strategy & Planning - AI Agent Builder
  - 6 - Change & Release - DevOps Workflow Agent
  - development-tools

metadata:
  version: 1.0.0
  author: Agent Skills Team
  category: agent-engineering
  tools: ['read', 'search', 'execute']
  tags:
    - development
    - analysis
    - reuse-strategy
    - agent-engineering
---

# SCE Agent Skill Analyzer

## Overview

Analyzes repository structure to identify existing agents and skills, evaluates how they match requested capabilities, and recommends reuse, adaptation, or creation.

Follows clearly demarcated guideline based capability building reuse-first principle: always check what exists before building new capabilities.

## When to Use This Skill

- Planning new agent or skill development
- Evaluating if capability already exists
- Checking if existing skill can be adapted
- Understanding relationships between agents/skills
- Assessing dependency and composition needs
- Building architectural diagram of capabilities
- Analyzing multi-step workflows for sub-agent orchestration opportunities

## Unitary Function

**ONE RESPONSIBILITY:** Analyze repository for agents/skills and match against requested capabilities

**NOT RESPONSIBLE FOR:**
- Creating agents or skills (see sce-skill-generator, sce-agent-generator)
- Building agents or skills (see sce-agent-builder-agent)
- Validating agents or skills (see sce-skill-validator, sce-agent-validator)
- Enforcing standards by modifying files (this skill reports standards gaps only)

## Required Build Standards (Consumer Expectations)

When this skill is used by the Agent Builder (or any governance workflow), it MUST be able to report on compliance with these requirements:

- **Artifact outputs are JSON-first** (Markdown companion required for large text, with JSON section-to-Markdown references).
- **Confidence is logprob-only** (no heuristic confidence labels or invented percentages).
- **Standards coverage** includes at minimum:

  - `docs/standards/CONTEXT_PASSING_STANDARDS.md`
  - `docs/standards/TECH_STACK_STANDARDS.md`
  - `docs/standards/tech-policy-matrix.yaml`
  - `docs/standards/APPROVAL_REQUEST.md`
  - Cyber standards
  - Data standards
  - Compliance standards
  - Coding standards

- **External dependencies** are declared when relevant (e.g., Figma MCP, Informatica MCP, APIM MCP).

## Agent/Skill Configuration Standards

This skill includes validation of proper agent configuration for handoffs:

### Required: Agent Tool for Handoff Passing
**All agents that pass handoffs must include 'agent' tool in their configuration:**
```yaml
---
name: Agent Name
tools: ['read', 'edit', 'search', ..., 'agent']  # 'agent' required for handoffs
model: Claude Sonnet 4.5
---
```

**Agents that pass handoffs (must have 'agent' tool):**
- Orchestrator agents coordinating sub-agents
- Any agent with handoffs section in specification
- Agents routing work to other agents or skills

### Validation Checklist
When recommending REUSE, ADAPT, or COMPOSE of existing agents:
- [ ] Agent passing handoff has 'agent' tool
- [ ] All agents have name, description, model, and tools fields defined
- [ ] Handoff agent names match registered agent names (case-sensitive)
- [ ] No reference to kebab-case file names in handoffs (use SDLC phase convention)
- [ ] Agent names follow "N - Phase Name - Agent Title" convention
- [ ] Agent declares version in body (`**Agent Version:** X.Y.Z`)
- [ ] Skill declares version inside `metadata` block
- [ ] Output format includes `generated_by` block with name and version

## Agent Frontmatter Requirements

When analyzing or recommending agents, ensure these frontmatter fields are present.

**Allowed fields only:** agents, argument-hint, description, disable-model-invocation, handoffs, hooks, model, name, target, tools, user-invocable

```yaml
---
description: 'Purpose and use case of agent'
name: "N - Phase Name - Agent Title"  # SDLC phase convention, case-sensitive
tools: ['read', 'edit', 'search', 'agent']  # Must include 'agent' if coordinating
model: Auto  # Or specific model based on agent type
handoffs:  # Only if agent coordinates other agents
  - label: 'Action label'
    agent: "N - Phase Name - Agent Title"
    prompt: 'Instruction for receiving agent'
    send: true
---
```

**Required Fields:**
- `name`: Agent title following SDLC phase convention (e.g., "5 - Test & Build - Python Developer")
- `description`: One-line summary of agent responsibility
- `tools`: MUST include 'agent' if agent passes handoffs
- `model`: LLM specification (Auto for orchestrators, specific model for sub-agents)
- `handoffs`: List with agent name (case-sensitive), clear prompt, send: true

**Frontmatter Validation Rules:**
1. Handoff agent names must match registered agent names exactly (case-sensitive)
2. Agent names follow SDLC phase convention: "N - Phase Name - Agent Title"
3. All agents must have name, description, tools, model fields
4. If agent passes handoff → must include 'agent' in tools list
5. handoffs.agent field is the registered agent name (e.g., "5 - Test & Build - Application Architect")

## Skill Frontmatter Requirements

When analyzing or recommending skills, ensure these frontmatter fields are present.

**Approved top-level fields only:** argument-hint, compatibility, description, disable-model-invocation, license, metadata, name, user-invocable

**DO NOT use at top level:** version, author, tags, category, tools, allowed-tools (place inside `metadata` block)

```yaml
---
name: sce-lowercase-skill-name
description: 'Clear description of what skill does and what problem it solves'
compatibility:
  - 1 - Strategy & Planning - AI Agent Builder
  - sce-compatible-skill
license: 'Proprietary'
metadata:
  version: 1.0.0
  author: Agent Skills Team
  category: domain-name
  tags:
    - domain
    - category
    - keyword
  tools: ['read', 'search', 'execute']
---
```

**Required Fields:**
- `name`: sce-lowercase-with-hyphens format, must start with `sce-`
- `description`: Clear problem statement and solution

**Optional Fields:**
- `compatibility`: Agents/skills that call this skill
- `license`: License identifier
- `metadata`: Object containing version, author, tags, category, tools
- `argument-hint`: Hint for expected input
- `user-invocable`: Whether user can invoke directly

**Frontmatter Validation Rules:**
1. Name must start with `sce-` and use kebab-case
2. Version, author, tags, category, tools go inside `metadata` block (not top-level)
3. Tags should be domain, category, and purpose-related (min 3)
4. metadata.tools must list actual tools used
5. compatibility shows which agents/skills consume this skill
6. description should answer: What problem? How is it solved?

## Input

- **capability_request**: Description of desired capability (natural language)
- **repo_path**: Path to repository to scan (default: current workspace)
- **analysis_depth**: Optional (quick, standard, comprehensive)
- **include_metrics**: Optional boolean for metrics (code size, complexity)

## Output

Agent/Skill Analysis Report (JSON format):

```json
{
  "generated_by": {
    "skill": "sce-agent-skill-analyzer",
    "version": "1.0.0"
  },
  "analysis_id": "ANALYSIS-uuid",
  "timestamp": "ISO-8601",
  "capability_requested": "string",
  "analysis_depth": "quick|standard|comprehensive",
  
  "findings": {
    "existing_agents": [
      {
        "name": "6 - Change & Release - DevOps Workflow Agent",
        "path": ".github/agents/5-DevOps-Workflow-Agent.agent.md",
        "version": "1.0.0",
        "responsibility": "Orchestrates DevOps workflow generation",
        "match_score": 85,
        "match_reason": "Handles workflow orchestration and skill coordination",
        "compatibility": ["devops", "automation"],
        "skills_used": ["sce-workflow-analyzer", "sce-template-manager"],
        "can_reuse": true,
        "requires_adaptation": false
      }
    ],
    
    "existing_skills": [
      {
        "name": "sce-workflow-analyzer",
        "path": ".github/skills/devops/sce-workflow-analyzer/",
        "version": "1.0.0",
        "description": "Detects project type and technology stack",
        "category": "devops",
        "tags": ["analysis", "detection"],
        "match_score": 75,
        "match_reason": "Analyzes project structure similar to requested capability",
        "can_reuse": true,
        "requires_adaptation": true,
        "adaptation_suggestions": [
          "Add new detection patterns for X framework",
          "Extend output to include Y metadata"
        ]
      }
    ],
    
    "composed_option": {
      "reuse_possible": true,
      "composition": [
        "sce-workflow-analyzer - for initial analysis",
        "sce-requirements-gatherer - for input collection",
        "sce-template-manager - for template selection"
      ],
      "explanation": "Capability can be achieved by composing these existing skills",
      "effort_score": 2
    }
  },
  
  "recommendation": {
    "option": "REUSE|ADAPT|COMPOSE|CREATE",
    "confidence": {
      "method": "token_logprob",
      "summary_logprob": -0.0,
      "avg_token_logprob": -0.0,
      "min_token_logprob": -0.0,
      "logprobs_available": true,
      "status": "pass|needs_review",
      "notes": "If logprobs are unavailable, status MUST be needs_review."
    },
    
    "if_reuse": {
      "agent_or_skill": "name",
      "use_as_is": true,
      "no_changes_needed": "Description of why no changes needed"
    },
    
    "if_adapt": {
      "agent_or_skill": "name",
      "changes_required": [
        "Change 1 description",
        "Change 2 description"
      ],
      "effort_hours": 4,
      "adaptation_confidence": {
        "method": "token_logprob",
        "summary_logprob": -0.0,
        "logprobs_available": true,
        "status": "pass|needs_review",
        "notes": "Confidence that adaptation will succeed without breaking changes"
      }
    },
    
    "if_compose": {
      "components": ["skill1", "skill2"],
      "orchestration_needed": "Type of orchestration",
      "new_agent_name": "sce-new-orchestrator-agent",
      "effort_hours": 8
    },
    
    "if_create": {
      "skill_or_agent": "skill",
      "name": "sce-new-capability-skill",
      "rationale": "Why new capability is truly needed",
      "composability_check": "Cannot be built from skill1, skill2, skill3 because...",
      "effort_hours": 16,
      "related_skills_to_create": ["sce-helper-skill-1"]
    },

    "workflow_complexity": {
      "multi_step": true,
      "estimated_tasks": 5,
      "parallelizable_groups": 2,
      "recommendation": "Sub-agent orchestration recommended — see Sub-Agent Orchestration standards",
      "task_summary": [
        {"task": "T1 description", "depends_on": [], "parallelizable": true},
        {"task": "T2 description", "depends_on": ["T1"], "parallelizable": false}
      ]
    }
  },
  
  "repository_inventory": {
    "total_agents": 2,
    "total_skills": 29,
    "agents_by_category": {
      "devops": 1,
      "other": 1
    },
    "skills_by_category": {
      "security": 9,
      "osint": 9,
      "devops": 11
    }
  },

  "standards_findings": {
    "required_documents": [
      {"path": "docs/standards/CONTEXT_PASSING_STANDARDS.md", "status": "present|missing"},
      {"path": "docs/standards/TECH_STACK_STANDARDS.md", "status": "present|missing"},
      {"path": "docs/standards/tech-policy-matrix.yaml", "status": "present|missing"},
      {"path": "docs/standards/APPROVAL_REQUEST.md", "status": "present|missing"},
      {"path": "docs/standards/CYBER_STANDARDS.md", "status": "present|missing"},
      {"path": "docs/standards/DATA_STANDARDS.md", "status": "present|missing"},
      {"path": "docs/standards/COMPLIANCE_STANDARDS.md", "status": "present|missing"},
      {"path": "docs/standards/CODING_STANDARDS.md", "status": "present|missing"}
    ],
    "output_standards": {
      "json_first_required": true,
      "markdown_companion_required_for_large_text": true,
      "logprob_confidence_required": true
    },
    "dependency_declarations": {
      "figma_mcp": "declared|not_applicable|missing",
      "informatica_mcp": "declared|not_applicable|missing",
      "apim_mcp": "declared|not_applicable|missing"
    }
  },
  
  "related_capabilities": [
    "sce-related-skill-1 - Why it's related",
    "sce-related-skill-2 - Why it's related"
  ]
}
```

## Analysis Levels

### Quick (Default)
- Scans skill/agent names and descriptions
- Pattern matching against request
- Basic match scoring
- Duration: <1 minute

### Standard
- Reads SKILL.md/AGENT.md files
- Analyzes responsibilities and boundaries
- Checks tags and categories
- Reviews skill dependencies
- Duration: 2-5 minutes

### Comprehensive
- Full code analysis of scripts
- Dependency mapping
- Complexity metrics
- Composability analysis
- Risk assessment
- Duration: 5-15 minutes

## Usage Example

```bash
# Analyze if we can build a security scanning capability
python .github/skills/sce-agent-skill-analyzer/scripts/analyze.py \
  --capability "I need to scan code for security vulnerabilities" \
  --depth standard \
  --output analysis-report.json

# Check if DevOps capability can be reused
python .github/skills/sce-agent-skill-analyzer/scripts/analyze.py \
  --capability "Generate GitHub Actions workflows for CI/CD" \
  --include-metrics true
```

## Reuse Decision Tree Logic

```
Request Analysis
    ├─ 90-100% match found?
    │  └─ Recommend: REUSE (no changes)
    │
    ├─ 70-89% match found?
    │  └─ Recommend: ADAPT (modify existing)
    │
    ├─ Can compose 2-3 existing skills?
    │  └─ Recommend: COMPOSE (add orchestrator)
    │
    ├─ 40-69% partial matches?
    │  ├─ Can extend one skill?
    │  │  └─ Recommend: ADAPT + new related skill
    │  └─ Recommend: COMPOSE + new skill
    │
    └─ <40% coverage?
       └─ Recommend: CREATE new skill (rare)
```

## Helper Scripts

Located in `scripts/` directory:
- `analyze.py` - Main analyzer engine
- `scan-agents.py` - Scans agent directory
- `scan-skills.py` - Scans skill directory
- `match-scorer.py` - Calculates match scores
- `composition-checker.py` - Checks if skills can compose
- `relationship-mapper.py` - Maps skill/agent relationships

## Pattern Matching

Analyzer matches requests against:

**Skill Descriptions**
- SKILL.md description field
- tag keywords
- category field

**Skill Responsibilities**
- "When to Use" section
- "ONE RESPONSIBILITY" statement
- What skill does vs doesn't do

**Skill Tags**
- Domain tags (security, devops, osint)
- Capability tags (analysis, generation, validation)
- Pattern tags (pattern-matching, ml, rules-based)

**Skill Categories**
- Functional grouping
- Domain classification

## Composability Checks

Analyzes if skills can be composed by checking:

1. **Dependency Graph** - Can skill A feed output to skill B?
2. **Data Flow** - Are output types compatible with input types?
3. **Orchestration** - How complex is the coordination needed?
4. **Scope Boundaries** - Do skills operate in same domain?
5. **Workflow Complexity** - Does the request involve multiple independent steps that benefit from sub-agent parallelization?

## Safety Rules

1. **Read-only** - Never modifies agents or skills
2. **Standards-aware** - Reports standards gaps; never modifies files
3. **Transparent** - Explains match scoring and decisions
4. **Conservative** - Favors reuse over creation when uncertain
5. **Scope-focused** - Reports only on agent/skill architecture

## Key Metrics

**Match Score** - 0-100
- 90+ = Exact match, use as-is
- 70-89 = Strong match, likely adaptable
- 50-69 = Partial match, consider composition
- 30-49 = Weak match, new skill likely needed
- <30 = No relevant capability found

**Effort Estimate** - Relative complexity
- Low (2-4 hours) = Reuse or minor adaptation
- Medium (6-12 hours) = Adaptation or composition
- High (16+ hours) = New skill creation

## Related Skills

- `sce-skill-generator` - Creates skill templates based on analysis
- `sce-agent-generator` - Creates agent templates
- `sce-agent-builder-agent` - Orchestrates agent/skill building
- `sce-skill-validator` - Validates generated skills
- `sce-governance-checker` - Enforces standards and guidelines

## References

- [Agent & Skill Development Guidelines](../../../references/AGENT-SKILL-DEVELOPMENT-GUIDELINES.md)
- [The Pancake Protocol](https://tedt.org/The-Pancake-Protocol/)
- [Agent Skills Standard](https://agentskills.io/)
- [Pancake Protocol Agents](https://tedt.org/The-Pancake-Protocol/#agents)
- [Pancake Protocol Skills](https://tedt.org/The-Pancake-Protocol/#skills)

---

**Skill Type:** Analysis (non-agency)  
**Returns:** Analysis report (JSON)  
**Used By:** sce-agent-builder-agent (planning phase)
