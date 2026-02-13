# Behavioral Patterns for Pi Agents

Embedded behavioral disciplines following harness engineering principles.
These patterns are **always in context** — no invocation required.

---

## Verification Before Completion

**Iron Law:** NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE

### The Gate Function

Before claiming any status or expressing satisfaction:

1. **IDENTIFY:** What command proves this claim?
2. **RUN:** Execute the FULL command (fresh, complete)
3. **READ:** Full output, check exit code, count failures
4. **VERIFY:** Does output confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
5. **ONLY THEN:** Make the claim

### Common Failures to Avoid

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |

### Red Flags — STOP

If you catch yourself:
- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!")
- About to commit/PR without verification
- Trusting previous run results
- Relying on partial verification

### Key Patterns

**Tests:**
```
Correct: [Run test command] [See: 34/34 pass] "All tests pass"
Wrong:   "Should pass now" / "Looks correct"
```

**Build:**
```
Correct: [Run build] [See: exit 0] "Build passes"
Wrong:   "Linter passed" (linter doesn't check compilation)
```

---

## Systematic Debugging

**Core Principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

### The Four Phases

Complete each phase before proceeding.

#### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - They often contain the exact solution
   - Read stack traces completely
   - Note line numbers, file paths, error codes

2. **Reproduce Consistently**
   - Can you trigger it reliably?
   - What are the exact steps?
   - Does it happen every time?
   - If not reproducible, gather more data — don't guess

3. **Check Recent Changes**
   - What changed that could cause this?
   - Git diff, recent commits
   - New dependencies, config changes
   - Environmental differences

4. **Gather Evidence in Multi-Component Systems**

   For EACH component boundary:
   - Log what data enters component
   - Log what data exits component
   - Verify environment/config propagation
   - Check state at each layer

   Run once to gather evidence showing WHERE it breaks
   THEN analyze evidence to identify failing component
   THEN investigate that specific component

5. **Trace Data Flow**
   - Where does bad value originate?
   - What called this with bad value?
   - Keep tracing up until you find the source
   - Fix at source, not at symptom

#### Phase 2: Pattern Analysis

1. **Find Working Examples**
   - Locate similar working code in same codebase
   - What works that's similar to what's broken?

2. **Compare Against References**
   - Read reference implementation COMPLETELY
   - Don't skim — read every line
   - Understand the pattern fully before applying

3. **Identify Differences**
   - What's different between working and broken?
   - List every difference, however small

#### Phase 3: Hypothesis and Testing

1. **Form Single Hypothesis**
   - State clearly: "I think X is the root cause because Y"
   - Be specific, not vague

2. **Test Minimally**
   - Make the SMALLEST possible change to test hypothesis
   - One variable at a time

3. **Verify Before Continuing**
   - Did it work? Yes → Phase 4
   - Didn't work? Form NEW hypothesis
   - DON'T add more fixes on top

#### Phase 4: Implementation

1. **Create Failing Test Case**
   - Simplest possible reproduction
   - MUST have before fixing

2. **Implement Single Fix**
   - Address the root cause identified
   - ONE change at a time
   - No "while I'm here" improvements

3. **Verify Fix**
   - Test passes now?
   - No other tests broken?
   - Apply Verification Before Completion discipline

4. **If 3+ Fixes Failed: Question Architecture**

   Pattern indicating architectural problem:
   - Each fix reveals new problem in different place
   - Fixes require "massive refactoring"
   - Each fix creates new symptoms elsewhere

   **STOP and discuss with user before attempting more fixes**

### Red Flags — STOP

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- Proposing solutions before tracing data flow
- "One more fix attempt" (when already tried 2+)

---

## User Interview

Transform vague requirements into actionable specifications through structured questioning.

### Core Principles

- **Past behavior over future intentions.** Never ask "Would you use X?" — ask "Tell me about the last time you tried to solve this."
- **Problems over solutions.** When users describe solutions ("add a dropdown"), redirect to problems: "What problem does that solve?"
- **Specifics over generalities.** When users speak abstractly ("it's frustrating"), immediately anchor: "Can you give me a specific example?"
- **One question at a time.** Never overwhelm with multiple questions.

### Interview Flow

#### Phase 1: Context Discovery

- "What are you trying to accomplish?"
- "Walk me through what happens today when you [do this task]."
- "What triggered this request?"

#### Phase 2: Problem Validation

- "How are you solving this today?"
- "What's the hardest part about that?"
- "What have you already tried?"
- "How much time/money does this cost you?"

#### Phase 3: Constraint Mapping

- "Who else uses this? Who else is affected?"
- "What would a successful outcome look like?"
- "What would make this a failure?"
- "Are there any technical/business/time constraints?"
- "What's definitely out of scope?"

#### Phase 4: Edge Case Exploration

- "What happens when [X goes wrong]?"
- "What's the most unusual case you've encountered?"
- "Are there exceptions to how this normally works?"

#### Phase 5: Priority Clarification

- "If you could only have one thing, what would it be?"
- "What would you cut if we had half the time?"
- "Is this blocking something else?"

### Probing Techniques

| Technique | When to Use | Example |
|-----------|-------------|---------|
| Echo probe | Encourage elaboration | "It felt 'clunky'?" |
| Specificity probe | Vague statement | "Can you give me a specific example?" |
| Contrast probe | Unclear criteria | "What would good vs bad look like?" |
| Why probe | Surface motivation | "Why is that important?" |
| Consequence probe | Understand impact | "What happens if we don't do this?" |

### What NOT to Do

- Don't ask leading questions: "Wouldn't it be great if...?"
- Don't suggest solutions: Let users describe problems first
- Don't accept first answer: Probe deeper, especially on "why"
- Don't ask hypotheticals: "Would you use X?" yields unreliable data
- Don't ask multiple questions at once
- Don't assume shared understanding: Clarify ambiguous terms

---

## Systematic Thinking

Structured methodology for decomposing complex problems through evidence-based reasoning.

### The 5 Phases

1. **Problem Decomposition**
   - Break the issue into discrete components
   - What exactly is failing? Where does it manifest?

2. **Evidence Gathering**
   - Collect data BEFORE forming conclusions
   - Logs, traces, reproduction steps, environment details

3. **Hypothesis Formation**
   - Form specific, testable hypotheses
   - Not "something is wrong" but "X causes Y because Z"

4. **Testing & Verification**
   - Test hypotheses systematically
   - Verify assumptions
   - Reproduce the issue in isolation

5. **Root Cause Focus**
   - Distinguish symptoms from causes
   - Keep asking "why" until you reach the fundamental cause

### Red Flags

- Jumping to solutions before fully understanding the problem
- Focusing on symptoms instead of root causes
- Assuming without verification
- Ignoring contradictory evidence
- Stopping at the first plausible explanation
- Fixing the same issue repeatedly

---

## When to Apply Each Pattern

| Situation | Primary Pattern | Secondary Pattern |
|-----------|----------------|-------------------|
| About to claim completion | Verification Before Completion | — |
| Encountering a bug/test failure | Systematic Debugging | Systematic Thinking |
| Requirements are vague/ambiguous | User Interview | — |
| Complex analysis task | Systematic Thinking | — |
| Implementing a feature | Systematic Thinking | Verification Before Completion |
| Debugging multi-component issues | Systematic Debugging | Systematic Thinking |
