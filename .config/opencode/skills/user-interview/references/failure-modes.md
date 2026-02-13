# Failure Modes in Requirements Gathering

Common patterns that lead to building the wrong thing, and how to avoid them.

## Failure Mode 1: Solution-First Thinking

**Pattern**: Stakeholder describes a solution instead of a problem. You build the solution. It doesn't solve the actual problem.

**Example**: "We need a dropdown menu" → You build dropdown → Users still can't find options (real problem was information architecture).

**Detection**:
- Request is phrased as implementation detail
- No "so that" or "because" in the requirement
- Cannot explain what problem it solves

**Prevention**:
- Always ask: "What problem does this solve?"
- Ask: "What would this let you do that you can't do now?"
- Ask: "How are you solving this today?"

---

## Failure Mode 2: Accepting Fluff

**Pattern**: Stakeholder uses vague positive language. You assume shared understanding. Result doesn't match expectations.

**Example**: "Make it more user-friendly" → You add features → Stakeholder wanted fewer clicks.

**Fluff indicators**:
- "Better", "faster", "easier", "intuitive"
- "Usually", "often", "sometimes" without specifics
- "User-friendly", "modern", "clean"

**Prevention**:
- Immediately ask for specifics: "What would 'user-friendly' look like?"
- Ask: "Can you give me an example of user-friendly?"
- Establish measurable criteria: "How would we know if it's user-friendly?"

---

## Failure Mode 3: The Curse of Knowledge

**Pattern**: Stakeholder assumes you know context they haven't shared. You assume their words mean what you think. Requirements diverge silently.

**Example**: "Update the dashboard" → You update main dashboard → They meant the admin dashboard.

**Detection**:
- Terms used without definition
- References to "the" [thing] as if only one exists
- Assumes organizational context you may not have

**Prevention**:
- Clarify every ambiguous term: "Which dashboard specifically?"
- Repeat back understanding: "So when you say X, you mean..."
- Ask: "Is there context I might be missing?"

---

## Failure Mode 4: Premature Commitment

**Pattern**: Stakeholder commits to a direction before exploring alternatives. You implement it. Better solutions existed.

**Example**: "Let's add email notifications" → Built → Turns out in-app notifications would have been better.

**Detection**:
- Decision made before problem fully explored
- No alternatives discussed
- "Let's just do X" without analysis

**Prevention**:
- Before solutions, ask: "What outcomes are we trying to drive?"
- Ask: "What other ways could we approach this?"
- Explicitly explore 2-3 alternatives before committing

---

## Failure Mode 5: Missing Edge Cases

**Pattern**: Requirements cover happy path only. Edge cases discovered during development or after launch.

**Example**: "Users submit a form" → Built → No handling for partial submissions, duplicates, or network failures.

**Detection**:
- Requirements describe only the ideal flow
- No error states mentioned
- No discussion of "what if"

**Prevention**:
- Systematically ask: "What happens when [X goes wrong]?"
- Ask: "What's the most unusual case you've seen?"
- Walk through: "What if the user does [unexpected thing]?"
- Consider: empty states, errors, timeouts, duplicates, concurrent access

---

## Failure Mode 6: Scope Ambiguity

**Pattern**: Boundaries unclear. Features creep in. Delivery delayed or expectations misaligned.

**Example**: "Build user profiles" → Scope grows to include social features, achievements, privacy settings → Project derails.

**Detection**:
- No explicit "out of scope" section
- "And also..." additions during development
- Different stakeholders have different scope assumptions

**Prevention**:
- Explicitly document what's IN scope and OUT of scope
- Ask: "What's definitely not included in this?"
- Ask: "If we had half the time, what would you cut?"
- Get written confirmation on scope boundaries

---

## Failure Mode 7: Stakeholder Proxy Problem

**Pattern**: You interview someone who isn't the actual user. Their assumptions about user needs are wrong.

**Example**: Manager says "Users want feature X" → Built → Actual users never wanted it.

**Detection**:
- Interviewee speaks in third person about users
- Answers are hypothetical, not based on observed behavior
- Can't provide specific examples

**Prevention**:
- Ask: "How do you know users want this?"
- Ask: "When's the last time a user mentioned this?"
- Request access to actual users when possible
- Triangulate with data (support tickets, usage analytics)

---

## Failure Mode 8: Confirmation Bias

**Pattern**: You have a solution in mind. Questions steer toward validating it. Disconfirming information ignored.

**Example**: "Wouldn't a dashboard help here?" → Stakeholder agrees → Built dashboard nobody uses.

**Detection**:
- Questions suggest the "right" answer
- Positive feedback taken at face value
- Negative signals explained away

**Prevention**:
- Ask open questions that don't suggest answers
- Actively seek disconfirming information
- Ask: "What might make this NOT work?"
- Treat enthusiasm as data, not validation (per Mom Test)

---

## Failure Mode 9: Requirements by Committee

**Pattern**: Multiple stakeholders with conflicting needs. Requirements try to satisfy everyone. Result satisfies no one.

**Detection**:
- Different stakeholders give different answers
- Requirements contain contradictions
- "It depends" without clear resolution

**Prevention**:
- Identify primary stakeholder/user
- Surface conflicts explicitly: "Person A wants X, Person B wants Y—how should we prioritize?"
- Establish decision-making authority
- Document unresolved conflicts for explicit resolution

---

## Failure Mode 10: Missing the Why

**Pattern**: Requirements specify WHAT without WHY. Implementation makes wrong tradeoffs because intent is unclear.

**Example**: "Display timestamps" → Implemented in UTC → Users needed local time to coordinate.

**Detection**:
- Requirements are implementation directives
- No stated purpose or goal
- Can't explain why this matters

**Prevention**:
- Always ask: "Why is this important?"
- Ensure requirements explain intent, not just specification
- Document the goal/outcome, not just the feature

---

## Red Flags Checklist

Before finalizing requirements, check for these warning signs:

| Red Flag | Question to Ask |
|----------|-----------------|
| Vague adjectives (better, faster, easier) | "How would we measure that?" |
| Solution without problem | "What problem does this solve?" |
| Single perspective | "Who else should we talk to?" |
| No edge cases discussed | "What could go wrong?" |
| No explicit scope boundaries | "What's NOT included?" |
| No success criteria | "How will we know this worked?" |
| Third-person user descriptions | "When did a user actually say this?" |
| No constraints mentioned | "Are there technical/time/budget limits?" |
| Conflicting requirements | "How do we prioritize when these conflict?" |
| Implementation details without intent | "Why does it need to work this way?" |
