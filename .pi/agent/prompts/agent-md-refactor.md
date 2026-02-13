---
description: Refactor bloated AGENTS.md or CLAUDE.md files using progressive disclosure principles
---

Refactor bloated agent instruction files (AGENTS.md, CLAUDE.md, etc.) to follow **progressive disclosure principles** — keeping essentials at root and organizing the rest into linked, categorized files.

**Process:**

### Phase 1: Find Contradictions
Identify any instructions that conflict with each other:
- Contradictory style guidelines (e.g., "use semicolons" vs "no semicolons")
- Conflicting workflow instructions
- Incompatible tool preferences

Ask user to resolve contradictions before proceeding.

### Phase 2: Identify the Essentials
Extract ONLY what belongs in the root agent file (applies to every single task):

**Essential (keep in root):**
- Project description (one sentence)
- Package manager (only if not npm, e.g., "Uses pnpm")
- Non-standard commands (custom build/test/typecheck)
- Critical overrides (things that MUST override defaults)
- Universal rules (applies to 100% of tasks)

**NOT essential (move to linked files):**
- Language-specific conventions
- Testing guidelines
- Code style details
- Framework patterns
- Documentation standards
- Git workflow details

### Phase 3: Group the Rest
Organize remaining instructions into logical categories:

| Category | Contents |
|----------|----------|
| `typescript.md` | TS conventions, type patterns, strict mode rules |
| `testing.md` | Test frameworks, coverage, mocking patterns |
| `code-style.md` | Formatting, naming, comments, structure |
| `git-workflow.md` | Commits, branches, PRs, reviews |
| `architecture.md` | Patterns, folder structure, dependencies |
| `api-design.md` | REST/GraphQL conventions, error handling |
| `security.md` | Auth patterns, input validation, secrets |

### Phase 4: Create the File Structure
```
project-root/
├── AGENTS.md                    # Minimal root with links
└── docs/agent-instructions/     # Or .pi/instructions/
    ├── typescript.md
    ├── testing.md
    ├── code-style.md
    └── architecture.md
```

**Root file template:**
```markdown
# Project Name

One-sentence description of the project.

## Quick Reference
- **Package Manager:** pnpm
- **Build:** `pnpm build`
- **Test:** `pnpm test`

## Detailed Instructions
For specific guidelines, see:
- [TypeScript Conventions](docs/agent-instructions/typescript.md)
- [Testing Guidelines](docs/agent-instructions/testing.md)
```

### Phase 5: Flag for Deletion
Remove instructions that are:
- Redundant ("Use TypeScript" in a .ts project)
- Too vague ("Write clean code")
- Overly obvious ("Don't introduce bugs")
- Default behavior (agent already knows)

**Execution Checklist:**
- [ ] All contradictions identified and resolved
- [ ] Root file contains ONLY essentials
- [ ] All remaining instructions categorized
- [ ] File structure created with proper links
- [ ] Redundant/vague instructions removed
- [ ] Root file is under 50 lines
- [ ] All links work correctly

$@