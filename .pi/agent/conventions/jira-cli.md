# Jira CLI

Go-based CLI tools for fetching Jira tickets.

## Tools

### jira-fetch

Fetch a Jira ticket by ID and output structured JSON.

**Usage:**
```bash
jira-fetch RD-3891
```

**Output (success - exit 0):**
```json
{
  "key": "RD-3891",
  "summary": "Implement user authentication",
  "status": "In Progress",
  "assignee": "Jane Doe",
  "type": "Story",
  "priority": "High",
  "created": "2025-01-15T10:30:00Z",
  "updated": "2025-02-12T09:15:00Z",
  "description": "As a user, I want to...",
  "url": "https://jira.example.com/rest/api/2/issue/12345"
}
```

**Output (error - exit 1):**
```json
{
  "error": "failed to fetch ticket",
  "details": "ticket RD-9999 not found or no access"
}
```

**Requirements:**
- Jira CLI (`jira`) installed and authenticated (`jira login`)

**Installation:**
```bash
cd ~/.pi/agent/extensions/tools/jira-cli
make install
```

## When to Use

- User mentions ticket IDs (RD-XXXX, PROJ-123)
- Before implementing features — fetch ticket for context
- User asks "what's the status of RD-3891?"

## Pattern for Agent Usage

When you see a ticket ID in conversation:

```typescript
const result = await tool("bash", {
  command: `jira-fetch ${ticketID}`
});

if (result.exitCode === 0) {
  const ticket = JSON.parse(result.stdout);
  // Use ticket.summary, ticket.status, ticket.description
} else {
  const error = JSON.parse(result.stderr);
  // Report error.details to user
}
```

## See Also

- [Go CLI Standards](./go-cli.md) — Building guidelines for Go-based tools
