# Skills 🛠️

Organized collection of specialized, reusable procedural knowledge and techniques.

## Categories

### [Architecture](./architecture/)

Architecture governance and decision-documentation utilities.

- **sce-adr-writer** - Drafts standardized Architecture Decision Record work packages with indexed ADR IDs and consistent governance content
- **sce-ubb-writer** - Drafts ABB plus SBB standards-deviation packages for technologies that are not already approved in TECH_STACK_STANDARDS.md

### [Code Generation](./code-generation/)

Code analysis and generation utilities.

- **sce-prd-generator** - Generates PRD documents from various inputs
- **sce-codebase-analyzer** - Analyzes code structure and patterns

### [Requirements Elicitation](./requirements-elicitation/)

Backlog shaping, use-case modeling, and issue-writing utilities.

- **sce-github-issue-writer** - Drafts properly formatted GitHub issues for planned work
- **sce-story-slicing-strategist** - Selects the right slicing strategy for oversized or tangled backlog work
- **sce-technical-requirement-writer** - Formats technical requirements and standards consistently with V&V guidance
- **sce-user-story-writer** - Formats user stories consistently with Gherkin and V&V guidance
- **use-case-2.0** - Models use cases and derives implementable slices

### [Security](./security/) 🔒

Security scanning, vulnerability assessment, and secure coding practices.

- **sce-vulnerability-scanner** - SAST scanning for vulnerabilities
- **sce-secure-coding-reviewer** - Code security review
- **sce-api-security-reviewer** - API security analysis
- **sce-auth-auditor** - Authentication/authorization auditing
- **sce-data-protection-reviewer** - Data handling validation
- **sce-mobile-security-auditor** - Mobile app security assessment
- **sce-web-infrastructure-auditor** - Infrastructure security analysis
- **sce-security-report-generator** - Security report generation
- **sce-input-validation-checker** - Input validation verification

### [Compliance](./compliance/)

Configuration, dependency, and standards compliance.

- **sce-compliance-checker** - Regulatory compliance validation
- **sce-config-detector** - Configuration analysis
- **sce-dependency-scanner** - Vulnerable dependency detection

### [Intelligence](./intelligence/) 🔍

OSINT (Open Source Intelligence) and analysis capabilities.

- **sce-agent-skill-analyzer** - Agent/skill portfolio analysis
- **sce-threat-intel-osint** - Threat intelligence research
- **sce-domain-osint** - Domain information gathering
- **sce-ip-osint** - IP address intelligence
- **sce-email-osint** - Email address research
- **sce-people-osint** - People information gathering
- **sce-username-osint** - Username research across platforms
- **sce-social-media-osint** - Social media investigation
- **sce-company-osint** - Company information gathering
- **sce-document-osint** - Document metadata analysis

### [DevOps](./devops/)

Workflow generation and CI/CD automation.

- **sce-build-workflow-generator** - Build workflow automation
- **sce-deploy-workflow-generator** - Deployment workflow automation
- **sce-check-workflow-generator** - Code quality check workflows
- **sce-release-notes-workflow-generator** - Release notes generation
- **sce-tag-workflow-generator** - Version tagging automation
- **sce-build-deploy-test-workflow-generator** - Complete CI/CD pipelines
- **sce-requirements-gatherer** - DevOps requirements elicitation
- **sce-template-manager** - Workflow template management
- **sce-workflow-analyzer** - Workflow analysis
- **sce-workflow-documenter** - Workflow documentation
- **sce-workflow-validator** - Workflow validation

---

## Quick Reference

| Need | Skill | Category |
| --- | --- | --- |
| Scan code for vulnerabilities | sce-vulnerability-scanner | Security |
| Review API security | sce-api-security-reviewer | Security |
| Check dependencies | sce-dependency-scanner | Compliance |
| Validate input handling | sce-input-validation-checker | Security |
| Generate build workflows | sce-build-workflow-generator | DevOps |
| Analyze agents/skills | sce-agent-skill-analyzer | Intelligence |
| Research domain info | sce-domain-osint | Intelligence |
| Create CI/CD pipelines | sce-build-deploy-test-workflow-generator | DevOps |
| Create GitHub work items | sce-github-issue-writer | Requirements Elicitation |
| Document architecture decisions | sce-adr-writer | Architecture |
| Document non-standard technology building-block packages | sce-ubb-writer | Architecture |
| Split oversized backlog work | sce-story-slicing-strategist | Requirements Elicitation |
| Format technical requirements consistently | sce-technical-requirement-writer | Requirements Elicitation |
| Format user stories consistently | sce-user-story-writer | Requirements Elicitation |

---

## Skill vs. Agent

**Skills** (this directory):

- Contain procedural knowledge and techniques
- Execute specific tasks without decision-making
- Called by agents or other skills
- Example: "Scan this code for SQL injection vulnerabilities"
- No authority to make decisions
- Follow instructions provided by caller

**Agents** (../agents/):

- Make decisions and orchestrate
- Route work to appropriate skills
- Manage approval gates
- No procedural knowledge, just decision-making authority
- Example: "Decide which security skills to run based on detected tech stack"

### The Pancake Protocol Philosophy

Think of skills as **knife techniques** and agents as **chefs**:

- Agents (chefs) decide which techniques to use
- Skills (knife techniques) execute consistently every time
- A chef (agent) can combine multiple techniques (skills) to create meals (outcomes)

---

## Integration with Agents

Skills are called by agents during various phases:

- `4 - Design - SCE Solution Architect` calls `sce-adr-writer` whenever it makes or formalizes a material architecture decision
- `4 - Design - Universal Building Block Builder` calls `sce-ubb-writer` when a non-approved technology needs a governing ABB plus candidate SBB package
- `4 - Design - SCE Solution Architect` calls `sce-ubb-writer` when a proposed technology is not part of the approved stack and must be evaluated through ABB plus SBB artifacts before ADR approval
- `5 - Test & Build - Application Architect` calls `sce-adr-writer` whenever it introduces a material design decision that needs durable governance documentation
- `3 - Analysis - Backlog Shaping Orchestrator` calls `elicitation-methodology`, `sce-story-slicing-strategist`, `sce-user-story-writer`, `sce-technical-requirement-writer`, and `user-story-mapping`
- `5 - Test & Build - Quality Assurance Agent` calls `sce-vulnerability-scanner`, `sce-dependency-scanner`, and `sce-secure-coding-reviewer`
- `6 - Change & Release - DevOps Workflow Agent` calls all `sce-devops-*` skills
- `sce-security-check-agent` calls all `sce-*-security-*` and `sce-*-osint` skills
- `1 - Strategy & Planning - AI Agent Builder` calls `sce-agent-skill-analyzer`

---

## Skill File Structure

Each skill is a directory containing:

```text
skill-directory/
├── SKILL.md                 # Skill metadata and instructions
├── scripts/                 # (Optional) Executable scripts
├── references/              # (Optional) Reference documentation
└── assets/                  # (Optional) Templates, examples, configs
```

### SKILL.md Format

Required sections in SKILL.md:

- **name** (lowercase-with-hyphens)
- **description** (what it does + when to use)
- **inputs** (what data it accepts)
- **outputs** (what it produces)
- **instructions** (detailed procedural steps)

---

## Getting Started with Skills

### Using a Skill (Agents)

1. Call the agent that uses the skill
2. Agent decides which skills to invoke
3. Agent passes standardized context to skill
4. Skill executes and returns results

### Creating a New Skill

1. Use [1 - Strategy & Planning - AI Agent Builder](../agents/1-AI-Agent-Builder-Agent.agent.md)
2. It will recommend REUSE, ADAPT, COMPOSE, or CREATE
3. If creating new: Follow SKILL.md format and standards
4. Get approval before deployment

### Extending Existing Skill

1. Create a new subdirectory with enhanced logic
2. Reference original skill in documentation
3. Update calling agents to use new skill

---

## Security Considerations

- Skills should not expose sensitive data in logs
- Skills should validate all inputs
- Skills should handle errors gracefully
- Skills should be idempotent when possible
- No credentials in code (environment variables only)

---

## Development Guidelines

- **Naming**: `sce-{domain}-{function}` (e.g., `sce-api-security-reviewer`)
- **Documentation**: Every skill must be self-documenting
- **Testing**: Skills should include test cases
- **Versioning**: Track breaking changes
- **Reuse**: Always prefer composing existing skills over creating new

---

## File Structure

```text
skills/
├── architecture/
│   └── sce-adr-writer/
│   └── sce-ubb-writer/
├── devops/
│   ├── sce-build-workflow-generator/
│   ├── sce-deploy-workflow-generator/
│   ├── sce-check-workflow-generator/
│   ├── sce-release-notes-workflow-generator/
│   ├── sce-tag-workflow-generator/
│   ├── sce-build-deploy-test-workflow-generator/
│   ├── sce-requirements-gatherer/
│   ├── sce-template-manager/
│   ├── sce-workflow-analyzer/
│   ├── sce-workflow-documenter/
│   └── sce-workflow-validator/
├── code-generation/
│   ├── sce-prd-generator/
│   └── sce-codebase-analyzer/
├── security/
│   ├── sce-vulnerability-scanner/
│   ├── sce-secure-coding-reviewer/
│   ├── sce-api-security-reviewer/
│   ├── sce-auth-auditor/
│   ├── sce-data-protection-reviewer/
│   ├── sce-mobile-security-auditor/
│   ├── sce-web-infrastructure-auditor/
│   ├── sce-security-report-generator/
│   └── sce-input-validation-checker/
├── compliance/
│   ├── sce-compliance-checker/
│   ├── sce-config-detector/
│   └── sce-dependency-scanner/
├── intelligence/
│   ├── sce-agent-skill-analyzer/
│   ├── sce-threat-intel-osint/
│   ├── sce-domain-osint/
│   ├── sce-ip-osint/
│   ├── sce-email-osint/
│   ├── sce-people-osint/
│   ├── sce-username-osint/
│   ├── sce-social-media-osint/
│   ├── sce-company-osint/
│   └── sce-document-osint/
├── requirements-elicitation/
│   ├── sce-github-issue-writer/
│   ├── sce-story-slicing-strategist/
│   ├── sce-technical-requirement-writer/
│   ├── sce-user-story-writer/
│   └── use-case-2.0/
└── README.md (this file)
```

---

## See Also

- [Agents Directory](../agents/) - Orchestration and decision-making
- [Development Guidelines](../references/AGENT-SKILL-DEVELOPMENT-GUIDELINES.md)
- [The Pancake Protocol](https://tedt.org/The-Pancake-Protocol/) - Agent vs. Skill philosophy
- [AgentSkills.io Specification](https://agentskills.io/specification)
