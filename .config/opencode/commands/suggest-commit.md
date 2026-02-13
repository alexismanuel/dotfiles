---
description: Suggest a git commit message based on current staged/unstaged changes (suggestion only - does NOT commit)
---

Use the `git-commit-helper` skill to analyze current changes and generate a commit message.

## Instructions

1. First, check git status to see all changes
2. Run `git diff --staged` to see staged changes (if any)
3. Run `git diff` to see unstaged changes (if any)
4. Analyze all changes and generate a conventional commit message following the format:
   - `<type>(<scope>): <description>`
   - Include body if changes are complex
5. Present the suggested commit message to the user

## IMPORTANT: Suggestion Only

**DO NOT execute any git commit commands.** This command is for generating commit message suggestions only.

- Do NOT run `git commit`
- Do NOT run `git add`
- Do NOT modify the git staging area
- Only analyze and suggest - let the user decide when to commit

Present the suggested message in a code block so the user can copy it:

```
<suggested commit message here>
```

Arguments: $ARGUMENTS
