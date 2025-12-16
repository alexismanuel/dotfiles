---
description: Review commits and changes in current branch against main/master/develop
agent: code-reviewer
---

# Code Review Request

Review the following changes in the current branch.

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

**IMPORTANT**: Review ONLY committed changes. Ignore any uncommitted modifications in the working directory.

Follow your standard review process:

1. **Analyze the diff** - Only lines shown in the diff above (committed changes)
2. **Read committed versions** of files for context:
   - Use git to read committed versions: `git show HEAD:path/to/file`
   - Do NOT read working directory files that may have uncommitted changes
   - Read direct dependencies (imported modules)
   - Read up to 10 core architectural files (committed versions)
3. **Generate review comments** using Conventional Comments format
4. **Write the review** to `review.md`

## Additional Context

$ARGUMENTS
