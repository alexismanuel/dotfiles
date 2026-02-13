# Jira CLI Commands Reference

This document provides essential Jira CLI commands used by the Jira Ticket Fetcher skill.

## Core Commands

### View a Specific Ticket
```bash
jira issue view TICKET-ID [--raw] [--comments N]
```
- `TICKET-ID`: The Jira ticket identifier (e.g., RD-3891)
- `--raw`: Output raw JSON response
- `--comments N`: Show N comments (default: 1)

### Search for Tickets
```bash
jira issue list [search_text] [flags]
```
Key flags:
- `--plain`: Display output in plain text mode
- `--raw`: Output raw JSON
- `--columns`: Specify columns to display
- `-q`: Run raw JQL query
- `-t`: Filter by issue type
- `-s`: Filter by status
- `-l`: Filter by labels

### Current Sprint Operations
```bash
jira sprint list --current [--plain] [--raw]
```
- `--current`: Show current active sprint
- `--plain`: Plain text output
- `--raw`: Raw JSON output

### Search in Current Sprint
```bash
jira sprint list --current --plain --raw "search_text"
```

## Common Search Patterns

### By Ticket ID Pattern
Ticket IDs follow the pattern: `PROJECT-NUMBER`
- Examples: RD-3891, PROJ-123, TASK-456

### Text Search Examples
```bash
# Search for tickets containing "engine i18n"
jira issue list "engine i18n" --plain --raw

# Search in current sprint only
jira sprint list --current --plain --raw "engine i18n"

# Search across all projects with JQL
jira issue list -q'text ~ "engine i18n"' --plain --raw
```

### Filter Examples
```bash
# Filter by status
jira issue list -s"In Progress" --plain --raw

# Filter by type
jira issue list -tEpic --plain --raw

# Filter by assignee
jira issue list -a"user@example.com" --plain --raw

# Combine filters
jira issue list -tEpic -s"In Progress" --plain --raw
```

## Output Formats

### Plain Text Format
```
KEY    SUMMARY    STATUS    TYPE    ASSIGNEE
RD-3891    Engine i18n epic    In Progress    Epic    John Doe
```

### JSON Format (with --raw)
```json
{
  "key": "RD-3891",
  "fields": {
    "summary": "Engine i18n epic",
    "status": {"name": "In Progress"},
    "issuetype": {"name": "Epic"},
    "assignee": {"displayName": "John Doe"},
    "created": "2025-01-15T10:30:00.000Z",
    "updated": "2025-01-16T14:20:00.000Z",
    "description": "Epic description here..."
  }
}
```

## Error Handling

Common error scenarios:
1. **Invalid ticket ID**: Ticket not found or access denied
2. **Network issues**: Connection timeout or server unavailable
3. **Authentication**: Invalid credentials or expired session
4. **Permission**: User lacks access to requested tickets/projects

## Best Practices

1. Always use `--raw` flag for programmatic parsing
2. Include timeout handling for long-running queries
3. Validate ticket ID format before making requests
4. Use appropriate search scopes (current sprint vs all projects)
5. Handle empty results gracefully
6. Parse JSON responses with error handling

## Integration Notes

The skill's Python script (`fetch_ticket.py`) wraps these commands and provides:
- Automatic ticket ID detection
- Scope-based searching (current sprint vs all projects)
- Structured error handling
- Formatted output display
- JSON parsing with fallback handling