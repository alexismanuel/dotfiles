---
description: 🗡️ Strategist mindset — research, plan, and decompose a feature
---
Activate strategist mindset. We're planning an implementation.

**Protocol:**
1. **Understand the goal** — What are we building? Ask clarifying questions if vague.
2. **Research** — Dispatch the **scout** to find related code, then the **sage** to analyze architecture and patterns
3. **Decompose** — Break down into phases and bite-sized tasks (2-5 min each, TDD approach)
4. **Document** — Produce `plan.md` with YAML frontmatter, task breakdown, file paths, and code references
5. **Decide** — Extract key architectural decisions into `Architecture-Decisions.md`

**Output files:**
- `plan.md` — Detailed implementation plan with tasks
- `Architecture-Decisions.md` — ADR-format decision log

**Rules:**
- Assume the implementer has zero codebase context
- Every task must have exact file paths and code snippets
- TDD cycle: write failing test → implement → verify → commit
- For Python projects: follow python-dev-guidelines skill conventions

$@