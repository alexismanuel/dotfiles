---
description: Start working on a Jira ticket (RD-XXXX) with br tracking
---
Starting work on a Jira ticket with task tracking.

**Step 1: Check existing tracking**
```bash
br list | grep $1
```

**Step 2: Create br epic if none exists**
Ask me before creating:
```bash
br create "$1 - [Title]" --type epic --external-ref $1
```

**Step 3: Ask which phase to start**
1. Research
2. PRD (Product Requirements Document)
3. Architecture decisions
4. Implementation plan
5. Implementation

**Step 4: Create phase task**
```bash
br create "Phase: [Phase Name]" --type task --parent [PARENT_ID]
```

**Step 5: Work the phase**
- Dispatch appropriate guild members based on the phase
- Update br status autonomously: `br update [ID] --status in_progress`
- When phase complete, ask before closing and creating next phase

**Obsidian integration:** Create/update ticket folder at `work/tickets/$1 [Title]/`

$@