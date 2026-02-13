# Creating Notes

## Where to Place New Notes

Place notes in the correct directory based on their purpose:

- **topics/**: Broad technical topics (data engineering, GIS, AI/GenAI, DevOps)
- **work/concepts/**: Learned concepts, patterns, and technical explanations
- **work/tickets/**: Jira-style tickets and work items (RD-XXXX format)
- **work/retros/**: Retrospective notes and team reflections
- **work/interviews/**: Interview notes and candidate assessments
- **daily/**: Daily journal entries with daily template
- **templates/**: Reusable note templates

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Daily | `YYYY-MM-DD.md` | 2024-03-15.md |
| Tickets | `RD-XXXX [Title]/` (folder) | RD-3891 API Migration/ |
| Ticket components | Inside ticket folder | `Ticket.md`, `PRD.md`, `Plan.md` |
| Concepts | Descriptive lowercase | kubernetes-ingress.md |
| Topics | Descriptive title | Data Engineering Index.md |
| Objectives | `Y[X]S[X] Objectives.md` | Y2S3 Objectives.md |

## Ticket Folder Structure

Each ticket is a folder containing three markdown files:

```
work/tickets/RD-XXXX [Title]/
├── Ticket.md      # Dashboard: links to PRD and Plan, progress tracking
├── PRD.md         # Goal, Requirements, Non-Goals, Questions (❓), Decisions (✅)
└── Plan.md        # Technical Strategy, Implementation Tasks (TDD), Testing Strategy
```

Use the templates in `templates/` when creating new tickets.

## Linking Patterns

Use wikilinks in the `[[filename]]` format. The filename should match exactly (including capitalization and extension).

Good: `[[kubernetes-ingress]]` → links to `kubernetes-ingress.md`
Good: `[[RD-3891 API Migration]]` → links to `RD-3891 API Migration.md`

## When to Create a New Note

Create a new note when:
- An idea contains 3+ words and needs development
- Starting a new topic area
- A concept is distinct enough to stand alone
- A ticket or work item requires tracking

Do NOT create a new note for:
- Quick inline thoughts (use current daily note)
- Trivial one-liners
- Duplicates of existing content
