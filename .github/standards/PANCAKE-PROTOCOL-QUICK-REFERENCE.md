# The Pancake Protocol: Quick Reference

Concise reference to The Pancake Protocol from https://tedt.org/The-Pancake-Protocol/

## Core Philosophy

**Clarity Creates Capacity** - Well-defined processes and standards enable reliable, repeatable execution without requiring constant heroic effort.

Standard Work isn't about limiting creativity. It's about establishing predictability so excellence becomes the default.

## Key Components

### Model Context Protocol (MCP)

Standard infrastructure for connecting AI applications to tools, resources, and context.

**Host** → MCP Client → MCP Server → {Tools, Resources, Prompts} → External Systems

Why MCP matters:
- Predictable, repeatable integration
- Standard "shapes" for capabilities
- Safe for hosts to call without custom duct tape
- Enables discovery and composition

### MCP Servers: Three Kinds of Capabilities

**Tools** — Actions the system can take
- Create, modify, trigger, update
- Concrete capabilities
- Clear inputs/outputs
- "Utensils and appliances" in a kitchen

**Resources** — Read-only reference materials
- Files, schemas, documentation, knowledge bases
- Things you consult, not "cook with"
- "The pantry and reference binder"

**Prompts** — Standardized ways to run common tasks
- Pre-shaped instructions
- Consistent phrasing
- Reusable routines
- "Laminated cards taped to the cabinet"

### Guardrails: Authorization, Consent, and Scope

In a kitchen, rules prevent disasters. In agentic systems:

- Not every capability available in every context
- Not every agent can do every action
- Humans can see what's happening and why
- Trust intact, system not "confidently wrong"

### Interaction Patterns

Even in a kitchen: measuring cups are marked, salt and sugar different containers, stove labeled.

In agentic systems:
- Icons & metadata for visual clarity
- Structured elicitation (forms, requests for confirmation)
- Host UI integration (maps, dashboards, previews)
- Humans understand what's happening and why

### Composability: The "Pancake Mix" Effect

Once you have standards:
- Add new capability without rebuilding kitchen
- New tool station, new pantry shelf, new recipe card
- Workflow still makes sense
- Pre-measured kit ships consistent results faster

Risk: Know what's in the box, who made it, safety.

## Agents

Decision makers. Think: chefs in a kitchen.

**Decide:**
- What matters right now
- What to do next
- What to delegate
- When to stop

**Defined by:** Explicit specification file
- What agent is responsible for
- What it must never do
- Tone/style
- Boundaries to honor

## Sub-Agents

Like sous-chefs at specific stations.

**Characteristics:**
- Narrow, focused scope
- Can execute in parallel
- No independent authority beyond station
- Prevents one "chef" from bottlenecking
- Enables "kind of" problems (coordination without chaos)

## Skills

Shared technique. Think: how to dice an onion, check doneness, plate consistently.

**Examples:**
- "Write an executive summary of this PRD"
- "Compare these two documents and explain changes"
- "Summarize logs and highlight anomalies"
- "Draft incident update for leadership"

**Purpose:** Stabilize method so improvement is possible

When everyone does things differently, hard to know what's working.

**Distinction:**
- **Prompts** = Recipe cards (what to make)
- **Skills** = Knife skills and routines (how to make it consistently)

## Technical Specifications and Constraints

Recipe card doesn't say "make pancakes." It defines success:
- Ingredients
- Steps
- Timing
- What "done" means

In agentic systems, specs and constraints define success:
- **Desired output format** (document type, structure)
- **Policy boundaries** (what must never happen)
- **Data boundaries** (allowed sources)
- **Time/cost limits**
- **Quality checks** (what "good" looks like)

Same kitchen, same basic goal, different definitions of success.

Example: Different customers, different constraints
- Customer 1: Gluten-free, nut-free, thoroughly cooked
- Customer 2: Vegan, fluffy, chocolate chips

Same pancakes, different specs. Both possible only with explicit constraints.

## Pattern: Standard Work for Agents

Standard work in a kitchen:
- Clear roles (chef, sous, line cooks)
- Clear stations (prep, grill, plating)
- Clear processes (mise en place, flow, cleanup)
- Clear handoffs (ticket system, calling "order up")

In agentic systems:
- Clear agent roles and responsibilities
- Clear skill stations and capabilities
- Clear processes (when to delegate, how to compose)
- Clear handoffs (inputs/outputs, success criteria)

## Anti-Patterns

**Don't:**
- Create god-agents that do everything
- Build megaskills with scattered responsibility
- Hide capabilities or make them opaque
- Let agents make decisions beyond their scope
- Assume AI "smartness" substitutes for clarity

**Do:**
- Keep agents focused on specific domains
- Make skills reusable and composable
- Expose capabilities clearly
- Honor boundaries explicitly
- Make boring stuff boring (predictable, reliable)

## The Goal

"Not magic. Not hype. Just a kitchen that's set up well—so the people in it can cook with joy, move with confidence, and end up with something nourishing on the table."

Translating to agentic AI:
- Setup matters more than raw capability
- Clarity enables confidence
- Reliable systems enable joy
- Standard work = sustainable excellence

## Key Takeaway

Making AI boring on purpose means:
1. Define what "good" looks like explicitly
2. Build standard processes to deliver it
3. Make capabilities clear and composable
4. Honor boundaries and guardrails
5. Let systems do reliable work, not magic

## References

- Full article: https://tedt.org/The-Pancake-Protocol/
- Author: Ted Tschopp
- Context: SCE (Southern California Edison), Enterprise Architecture
- Category: AI, Standard Work, Architecture, Governance

---

**Use this reference when:**
- Designing new agents or skills
- Establishing boundaries and authority
- Creating composable capabilities
- Defining success criteria
- Building governance structures
