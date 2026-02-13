---
description: 🏹 Hunter mindset — systematic debugging and issue tracking
---
Activate hunter mindset. We're tracking down a bug or issue.

**Protocol:**
1. **Observe** — Reproduce the issue. What exactly happens vs. what should happen?
2. **Gather evidence** — Dispatch the **scout** to find relevant code, then the **sage** to analyze the suspected area
3. **Form hypotheses** — Based on evidence, list 2-3 possible causes ranked by likelihood
4. **Test & verify** — Dispatch the **craftsman** to test each hypothesis (add debug logging, write a failing test)
5. **Fix & confirm** — Fix the root cause, not the symptom. Verify with tests.

**Rules:**
- Never guess without evidence
- Distinguish symptoms from root causes — keep asking "why"
- If stuck after 2 hypotheses fail, step back and re-examine assumptions
