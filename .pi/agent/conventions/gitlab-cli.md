# GitLab CLI

Go-based CLI tools for GitLab merge requests and related operations.

## Prerequisites

Ensure the tool is built and available:

```bash
cd ~/.pi/agent/extensions/tools/gitlab-mr
make install
```

If `gitlab-mr-fetch` is not found in PATH, use the full path:
```bash
$(brew --prefix)/bin/gitlab-mr-fetch 7849
```

## Tools

### gitlab-mr-fetch

Fetch GitLab merge request details including discussions, approvals, and metadata.

**Usage:**
```bash
gitlab-mr-fetch <mr-iid> [--project=path] [--summary]
```

**Examples:**
```bash
gitlab-mr-fetch 7849                      # Full details
gitlab-mr-fetch 7849 --summary            # Just summary stats
gitlab-mr-fetch 7849 --project=other/proj # Different project
```

**Output (success - exit 0):**
```json
{
  "mr": {
    "iid": 7849,
    "title": "Feature implementation",
    "state": "opened",
    "status": "can_be_merged",
    "author": { "name": "John Doe", "username": "jdoe" },
    "source_branch": "feature-branch",
    "target_branch": "master",
    "created_at": "2025-02-12T10:00:00Z",
    "updated_at": "2025-02-12T15:30:00Z",
    "description": "## What's new...",
    "changes_count": 25,
    "additions": 120,
    "deletions": 45,
    "web_url": "https://gitlab.com/..."
  },
  "discussions": [
    {
      "id": "discussion-id",
      "notes": [
        {
          "id": "note-id",
          "author": { "name": "Reviewer", "username": "reviewer" },
          "body": "Consider using a constant here",
          "created_at": "2025-02-12T11:00:00Z",
          "type": "DiffNote",
          "resolvable": true,
          "resolved": false,
          "file": "src/main.go",
          "line": 42
        }
      ]
    }
  ],
  "approvals": {
    "approvals_required": 1,
    "approvals_left": 1,
    "approved_by": []
  },
  "summary": {
    "total_comments": 1,
    "unresolved_threads": 1,
    "diff_comments": 1,
    "general_comments": 0
  }
}
```

**Output (error - exit 1):**
```json
{
  "error": "failed to fetch MR",
  "details": "gitlab authentication failed. Run: glab auth login"
}
```

**Requirements:**
- GitLab CLI (`glab`) installed and authenticated (`glab auth login`)

**Installation:**
```bash
cd ~/.pi/agent/extensions/tools/gitlab-mr
make install
```

## When to Use

- User mentions an MR number (!7849)
- Before reviewing code — see discussion context
- User asks "what's the status of !7849?"
- Check approval status before merging
- Identify unresolved review threads

## Pattern for Agent Usage

### Basic Fetch

```typescript
const result = await tool("bash", {
  command: "gitlab-mr-fetch 7849 --summary"
});

if (result.exitCode === 0) {
  const summary = JSON.parse(result.stdout);
  // summary.total_comments, summary.unresolved_threads
} else {
  const error = JSON.parse(result.stderr);
  // error.details
}
```

### Full Details with Formatted Output

```typescript
const result = await tool("bash", {
  command: "gitlab-mr-fetch 7849"
});

const data = JSON.parse(result.stdout);

// Format output
let output = `## MR !${data.mr.iid}: ${data.mr.title}\n\n`;
output += `**Status:** ${data.mr.state} | ${data.mr.status}\n`;
output += `**Approvals:** ${data.approvals.approved_by.length}/${data.approvals.approvals_required}\n`;
output += `**Comments:** ${data.summary.total_comments}`;

if (data.summary.unresolved_threads > 0) {
  output += ` | ⚠️ ${data.summary.unresolved_threads} unresolved`;
}

// Group comments by file
const fileComments = new Map();
const generalComments = [];

for (const disc of data.discussions) {
  for (const note of disc.notes) {
    if (note.file) {
      if (!fileComments.has(note.file)) fileComments.set(note.file, []);
      fileComments.get(note.file).push(note);
    } else {
      generalComments.push(note);
    }
  }
}
```

### Check Before Merge

```typescript
// Quick check if MR is ready to merge
const result = await tool("bash", {
  command: "gitlab-mr-fetch 7849 --summary"
});

const summary = JSON.parse(result.stdout);

if (summary.unresolved_threads > 0) {
  return `⚠️ Cannot merge: ${summary.unresolved_threads} unresolved review threads`;
}

if (summary.total_comments === 0) {
  return "ℹ️ No reviews yet — consider requesting review first";
}

return "✅ Ready to merge if pipeline passes";
```

## See Also

- [Go CLI Standards](./go-cli.md) — Building guidelines for Go-based tools
- [Jira CLI](./jira-cli.md) — Similar pattern for Jira tickets

### Convention Adherence Rule

**CRITICAL:** When this convention is loaded, you MUST use `gitlab-mr-fetch`. Never fall back to `glab mr view` or other raw CLI commands.

If the tool is not found:
1. Build it: `cd ~/.pi/agent/extensions/tools/gitlab-mr && make install`
2. Retry with the tool
3. Only if build fails, report the error and ask for guidance

**Anti-pattern to avoid:** Reading the convention, then ignoring it and using `glab` instead of `gitlab-mr-fetch`.