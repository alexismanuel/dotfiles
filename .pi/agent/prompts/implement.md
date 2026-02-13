---
description: Execute plan.md in batches with checkpoints
---
Implement the plan in `./plan.md` (or specify a path).

**Protocol:**
1. Read the plan fully and understand all tasks
2. Dispatch the **craftsman** for each batch of 3 tasks
3. After each batch, report what was done and verification results
4. Wait for my feedback before continuing
5. If mismatch between plan and reality: STOP and report

**Rules:**
- Follow plan exactly — don't skip steps or verifications
- Craftsman runs tests after each batch
- If blocked, ask rather than guess
- For Python: no mocks (dummy classes only), ruff, basedpyright

$@