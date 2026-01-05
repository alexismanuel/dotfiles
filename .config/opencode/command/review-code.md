---
description: Review commits and changes in current branch against main/master/develop
tools:
    write: true
    bash: true
---

# Code Review Request

Review the following changes in the current branch.

## Argument Parsing

```
!JIRA_TICKET=$(echo "$ARGUMENTS" | grep -oE '[A-Z]+-[0-9]+' | head -1) && echo "JIRA Ticket: ${JIRA_TICKET:-none detected}"
```

```
!MR_IID=$(echo "$ARGUMENTS" | grep -oE 'merge_requests/[0-9]+' | grep -oE '[0-9]+') && echo "MR IID: ${MR_IID:-none detected}"
```

## JIRA Ticket Context

```
!JIRA_TICKET=$(echo "$ARGUMENTS" | grep -oE '[A-Z]+-[0-9]+' | head -1) && [ -n "$JIRA_TICKET" ] && python /Users/alexismanuel/.config/opencode/skill/jira-ticket-fetcher/scripts/fetch_ticket.py "$JIRA_TICKET" || echo "No JIRA ticket provided - skipping"
```

## Merge Request Context

**MR Status & Description:**
```
!MR_IID=$(echo "$ARGUMENTS" | grep -oE 'merge_requests/[0-9]+' | grep -oE '[0-9]+') && [ -n "$MR_IID" ] && /Users/alexismanuel/.config/opencode/skill/mr-tracker/scripts/mr_tracker.sh status "$MR_IID" || echo "No MR URL provided - skipping"
```

**Review Comments & Discussions:**
```
!MR_IID=$(echo "$ARGUMENTS" | grep -oE 'merge_requests/[0-9]+' | grep -oE '[0-9]+') && [ -n "$MR_IID" ] && /Users/alexismanuel/.config/opencode/skill/mr-tracker/scripts/mr_tracker.sh comments "$MR_IID" || echo "No MR URL provided - skipping"
```

## Branch Context

**Working Directory Status:**
```
!git status --short
```

**Current Branch:**
```
!git rev-parse --abbrev-ref HEAD
```

**Branch Commits (not in main/master/develop):**
```
!git log --oneline --no-merges $(git merge-base HEAD $(git for-each-ref --format='%(refname:short)' refs/heads/ | grep -E '^(main|master|develop)$' | head -n1))..HEAD
```

**Commit Details:**
```
!git log --no-merges --format="%H%n  Author: %an <%ae>%n  Date: %ad%n  Message: %s%n  Body: %b%n" --date=short $(git merge-base HEAD $(git for-each-ref --format='%(refname:short)' refs/heads/ | grep -E '^(main|master|develop)$' | head -n1))..HEAD
```

**Files Changed:**
```
!git diff --name-status $(git merge-base HEAD $(git for-each-ref --format='%(refname:short)' refs/heads/ | grep -E '^(main|master|develop)$' | head -n1))..HEAD
```

**Full Diff:**
```
!git diff $(git merge-base HEAD $(git for-each-ref --format='%(refname:short)' refs/heads/ | grep -E '^(main|master|develop)$' | head -n1))..HEAD
```

## Review Instructions

### Using Available Context

When JIRA ticket or MR context is provided above, use it to enhance your review:

**If JIRA Ticket Context is available:**
- **Validate requirements**: Check that the implementation matches the ticket description/acceptance criteria
- **Flag deviations**: If the code diverges from the ticket scope, highlight this in your review
- **Reference the ticket**: Mention the ticket ID when discussing requirement alignment

**If MR Context is available:**
- **Address prior feedback**: Check if previous review comments have been addressed
- **Avoid duplicate comments**: Don't repeat feedback that was already given
- **Acknowledge resolved issues**: Note when prior concerns have been fixed
- **Continue discussions**: If prior comments raised questions, follow up on them

**If neither is provided:**
- Review based solely on code quality, best practices, and the diff content
- If you need more context, use the `jira-ticket-fetcher` or `mr-tracker` skills to fetch additional information

### Review Process

**IMPORTANT**: Review ONLY committed changes. Ignore any uncommitted modifications in the working directory.

1. **Analyze the diff** - Only lines shown in the diff above (committed changes)
2. **Read committed versions** of files for context:
   - Use git to read committed versions: `git show HEAD:path/to/file`
   - Do NOT read working directory files that may have uncommitted changes
   - Read direct dependencies (imported modules)
   - Read up to 10 core architectural files (committed versions)
3. **Generate review comments** using Conventional Comments format
4. **Write the review** to `review.md`

## Additional Notes

$ARGUMENTS
