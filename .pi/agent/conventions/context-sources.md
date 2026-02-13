# Context Sources Reference

Quick reference for choosing between AGENTS.md, Skills, Conventions, and Prompt Templates.

---

## The Bottom Line

| Source | What It Is | When to Use |
|--------|-----------|-------------|
| **AGENTS.md** | Passive context always in system prompt | Framework knowledge the agent ALWAYS needs |
| **Skills** | Capability packages with code/scripts | Complex workflows the agent DOES on-demand |
| **Conventions** | Tool-specific workflow patterns | "How to use X tool correctly" |
| **Prompt Templates** | Text expansion aliases | Quick prompt snippets with arguments |

---

## Detailed Breakdown

### AGENTS.md
```
Location: Project root (~/.pi/agent/AGENTS.md or ./AGENTS.md)
Loaded: Every turn, always in context
Cost: Linear with size (compress aggressively per Vercel research)
```

**Use for:**
- Framework-specific knowledge (Next.js, Django, etc.)
- Coding standards and patterns
- Semantic compression rules
- Prompt engineering guidelines
- Any knowledge that should override training data

**Per Vercel research:** Passive context (AGENTS.md) beats active retrieval (skills) 100% vs 53-79% pass rate because:
- No decision point (agent doesn't need to "decide" to use it)
- Always available every turn
- No ordering issues

**Example:**
```markdown
## Semantic Compression
LLMs reconstruct grammar from content. Remove predictable glue...

## Next.js Patterns
- Use 'use cache' directive for...
- Prefer server components unless...
```

---

### Skills
```
Location: ~/.pi/agent/skills/<name>/SKILL.md
Loaded: On-demand when task matches description
Cost: Only description in context, full content loaded via read tool
Structure: Directory with SKILL.md + scripts + assets
```

**Use for:**
- Multi-step workflows requiring setup
- External API integrations
- Scripts that need to be executed
- Complex actions with prerequisites

**Invocation:**
- Implicit: Agent loads when task matches description
- Explicit: `/skill:name` command

**Example:** `mr-generator/`
```
mr-generator/
├── SKILL.md          # Instructions + frontmatter
└── scripts/
    └── mr_generator.py  # Executable script
```

---

### Conventions
```
Location: ~/.pi/agent/conventions/*.md
Loaded: Referenced by AGENTS.md "check first"
Cost: Only loaded when relevant task occurs
```

**Use for:**
- Tool-specific workflows ("how to use glab CLI")
- External tool documentation
- CLI patterns and best practices
- "Before using X, read this"

**Key difference from skills:** Conventions are docs for external tools; skills are self-contained capabilities.

**Example:** `gitlab-cli.md`
```markdown
# GitLab CLI Convention

Always use glab for GitLab operations. Do NOT use raw API calls.

## MR Operations
glab mr create --title "..." --description "..."
```

---

### Prompt Templates
```
Location: ~/.pi/agent/prompts/*.md
Loaded: Available as /commands
Cost: Full content in system prompt (like conventions)
Structure: Single file, supports $1, $2, $@ arguments
```

**Use for:**
- Quick prompt expansion (like shell aliases)
- Common request patterns
- Simple text substitution

**Key difference from skills:** Templates are pure text; skills have code/scripts.

**Example:** `review.md`
```markdown
---
description: Review staged changes
---
Review the staged changes (`git diff --cached`). Focus on:
- Bugs and logic errors
- Security issues
```

**Usage:** `/review` expands to the full prompt text

---

## Decision Tree

```
Is it knowledge the agent ALWAYS needs?
├── YES → AGENTS.md
└── NO → Does it require code/scripts?
    ├── YES → Skill
    └── NO → Is it a quick text expansion?
        ├── YES → Prompt Template
        └── NO → Convention (tool workflow docs)
```

---

## Common Mistakes

| Mistake | Why It's Wrong | Fix |
|---------|---------------|-----|
| Putting framework knowledge in skills | Agent won't invoke skill 56% of the time | Move to AGENTS.md (per Vercel research) |
| Putting simple prompts in skills | Overkill, adds indirection | Use prompt template |
| Putting tool docs in AGENTS.md | Bloats context unnecessarily | Use conventions |
| Creating skills without scripts | Just adds cognitive overhead | Use prompt template or AGENTS.md |

---

## File Locations Summary

```
~/.pi/agent/
├── AGENTS.md              # Main agent context (load first, always in prompt)
├── conventions/
│   ├── gitlab-cli.md      # Tool workflow docs
│   ├── python.md          # Language conventions
│   └── context-sources.md # This file
├── skills/
│   └── mr-generator/      # Capability packages
│       ├── SKILL.md
│       └── scripts/
├── prompts/
│   ├── review.md          # /review command
│   └── refactor.md        # /refactor command
└── agents/
    ├── scout.md           # Agent definitions
    ├── craftsman.md
    └── ...
```

---

## Reference: Vercel Research Findings

From [agents.md outperforms skills](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals):

| Approach | Pass Rate | Key Finding |
|----------|-----------|-------------|
| Skills (default) | 53% | Never invoked 56% of the time |
| Skills + explicit instructions | 79% | Fragile to wording changes |
| **AGENTS.md** | **100%** | Always available, no decision point |

> "Skills aren't useless... AGENTS.md approach provides broad, horizontal improvements... Skills work better for vertical, action-specific workflows that users explicitly trigger."

---

*Last updated: 2026-02-12*
