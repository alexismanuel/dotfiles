---
description: Suggest a git commit message based on current changes (does NOT commit)
---
Analyze current git changes and suggest a commit message.

1. Run `git status` to see all changes
2. Run `git diff --staged` for staged changes (if any), else `git diff`
3. Generate a conventional commit message: `<type>(<scope>): <description>`
4. Include body if changes are complex

**IMPORTANT:** Suggestion only — do NOT run `git commit` or `git add`.

Present the suggested message in a code block so I can copy it.

$@