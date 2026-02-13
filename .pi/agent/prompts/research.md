---
description: Research the codebase for a topic — produces research.md
---
Research the codebase to answer a question or understand a feature.

**Protocol:**
1. Dispatch **scout** and **sage** in parallel:
   - Scout: find all files related to the topic
   - Sage: analyze the most relevant components
2. Synthesize findings into `research.md` with YAML frontmatter
3. Include: architecture insights, code references (file:line), data flow, dependencies

**Output:** `research.md`

**Topic:** $@