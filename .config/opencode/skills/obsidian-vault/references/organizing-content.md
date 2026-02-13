# Organizing Content

## Folder Structure Rules

### topics/
Technical domains and broad topics. Keep flat structure—avoid nested folders.

### work/
Contains work-related content with subdirectories:
- **concepts/**: Learned concepts, technical explanations
- **tickets/**: Jira-style tickets (RD-XXXX format)
- **retros/**: Team retrospectives
- **interviews/**: Candidate assessments

### daily/
Daily journal entries using daily template.

### templates/
Reusable note templates including daily template with YAML frontmatter.

## Template Usage

### Daily Template
```yaml
---
date: YYYY-MM-DD
tags: [daily]
---
- [ ] Task 1
- [ ] Task 2
```

Always include:
- YAML frontmatter with date and tags
- Checkboxes for actionable items
- French content when appropriate

## Handling Empty or Stub Files

- Delete notes with no content after 30 days
- Merge stubs into parent topics rather than leaving orphaned
- Use `{{TODO}}` placeholders if content is pending

## Git Workflow

When reorganizing notes:

1. **Use git mv**: Preserves file history and git blame
   ```bash
   git mv old-location.md new-location.md
   ```

2. **Preserve history**: Never copy-paste to move files
   - Using `cp` destroys history
   - Using `mv` maintains attribution

3. **Commit with context**: Explain why the move was made
   ```
   git commit -m "Move concepts/architecture.md to topics/ for better organization"
   ```

4. **Update links**: After moving, search for inbound wikilinks and update them
