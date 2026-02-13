---
description: Analyze session work to create or improve skills based on learning opportunities
---

Analyze the current session conversation to identify learning opportunities and suggest creating new skills or improving existing ones.

**Focus on areas where the agent struggled, received user corrections, or needed guidance:**
- User corrections and feedback ("that's wrong", "do X instead", "try this approach")
- Repeated patterns or themes across tasks
- Friction points where agent took wrong direction
- Domain knowledge that should have been known ahead of time
- Missing process steps or workflows

**Present your findings as an interactive workflow:**

1. **Show 2-3 skill suggestions** with light summaries (1-2 sentences each). Format like: "Should we create a skill for X? This would prevent [problem from this session]"

2. **Wait for user response** - They may ask for more details, choose an option, or skip

3. **Expand on request** - If user asks "tell me more about option X", provide detailed breakdown including:
   - Problem that occurred in this session
   - User feedback/corrections given
   - What the skill should contain
   - Expected benefit for future sessions

4. **Execute choice** - If user wants to proceed, load the `skill-creator` skill to implement

**Use progressive presentation:** start with light summaries, expand details only when requested.

Arguments: $ARGUMENTS
