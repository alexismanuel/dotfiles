# Prompt Engineering

Guidelines for writing system prompts, tool docs, and agent definitions.

## High-Impact Interventions (+15-30% improvement)

1. **Persistence**: "Keep going until fully resolved" — prevents premature termination
2. **Tool verification**: "Use tools to verify; do not guess" — reduces hallucination
3. **Planning**: "Plan approach before acting" — improves complex task success
4. **Context positioning**: Critical instructions at START and END — middle content degrades 20%+
5. **Urgency framing**: "This matters" / "Get this right" — 8-115% improvement
6. **Edit format**: SEARCH/REPLACE beats line-numbers 3X on code generation

## Tag Hierarchy

| Tag | Enforcement | When to Use |
|-----|-------------|-------------|
| `<critical>` | Inviolable | Safety constraints, must-follow rules, repeat at END |
| `<prohibited>` | Forbidden | Actions that cause harm, never acceptable |
| `<caution>` | High priority | Important to follow |
| `<instruction>` | Operational | How to use a tool, perform a task |
| `<conditions>` | Contextual | When rules apply, trigger criteria |
| `<avoid>` | Anti-patterns | What not to do, prefer alternatives |

**Positioning rule**: Place `<critical>` at START for priming, repeat at END for recency. Middle content suffers 20%+ degradation.

## Writing Style

**Direct and imperative.** Research shows direct tone improves accuracy 4%+ over polite hedging.

```
Bad:  "You might want to consider using..."
Good: "Use X when Y."

Bad:  "Please note that this is important..."
Good: "Critical: X."
```

**Positive framing**: Models process "Always do Y" better than "Don't do X":
```
Bad:  "Don't use grep via bash"
Good: "ALWAYS use Grep tool for search—NEVER invoke grep via Bash"
```

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| "Would you be so kind..." | +perplexity, -4% accuracy |
| "I'll tip $2000" | No improvement |
| "Be efficient with tokens" | Premature task abandonment |
| "Don't do X" without positive alternative | "Always do Y" processes better |
| Critical instructions only in middle | 20%+ degradation vs start/end |

## Templates

### Tool Documentation
```markdown
# Tool Name

One-line description.

<instruction>
- How to use it
- Key parameters
- Common patterns
</instruction>

<output>
What the tool returns.
</output>

<critical>
Must-follow rules. Safety constraints.
</critical>

<example name="basic">
tool {"param": "value"}
</example>
```

### Agent Definition
```markdown
<role>Senior [role] doing [task].</role>

<critical>
Inviolable constraints first.
READ-ONLY if applicable.
</critical>

<directives>
- Operating instruction 1
- Operating instruction 2
</directives>

<output>
What to return. Schema requirements.
</output>
```
