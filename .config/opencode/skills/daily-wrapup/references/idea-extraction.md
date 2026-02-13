# Idea Extraction Patterns

How to identify note-worthy learnings from completed tasks.

## Triggers in Task Descriptions

Look for these keywords/phrases in completed tasks:

### Decision Patterns
- "Decided to use X over Y"
- "Chose approach Z because..."
- "Evaluated options A/B/C, went with B"

### Learning Patterns
- "Learned that X does Y"
- "Discovered Z pattern"
- "New technique: W"

### Debugging Patterns
- "Root cause: ..."
- "Fixed issue with X by doing Y"
- "Debugged and resolved Z"

### Process Patterns
- "Established workflow for X"
- "Created process to handle Y"
- "Documented best practice for Z"

## Decision Tree

1. **Is it >3 words?** → Potential new note
2. **Is it reusable?** → Worth documenting as pattern
3. **Is it unique to this ticket?** → Document in ticket, not separate note
4. **Does existing note cover this?** → Update existing note

## Example Patterns

| Task Text | Idea Suggested | Action |
|-----------|---------------|--------|
| "Decided defensive programming over assert" | Defensive Programming vs Assert | New note |
| "Added parametrized tests for edge cases" | Parametrized test pattern | Update existing testing note |
| "Fixed RD-4391 shebang typo" | None (one-off) | Skip |

## Note Structure Template

```markdown
# [Title]

[Brief description - 1-2 sentences]

## Key Learnings

- [Bullet points of core insights]

## Pattern/Process

``[code example if applicable]``

## Origin

- [[YYYY-MM-DD]]
```