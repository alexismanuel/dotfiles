# Agent Output Convention

How to interpret and use agent output.

## Output Format

Agents return **natural language markdown**, not JSON. Parse the content, not a data structure.

## What to Expect

### Scout Output Structure
- Summary of search commands run
- List of files found (usually in tables or bullet lists)
- Patterns observed
- Recommended starting points

### Sage Output Structure
- Overview/executive summary
- Detailed analysis sections
- Data flow descriptions
- Key insights with file:line references
- Recommendations

### Craftsman Output Structure
- Summary of changes made
- Files modified/created
- Verification results (test output, lint status)
- Any issues or notes

### Hunter Output Structure
- Symptom description
- Investigation steps taken
- Hypotheses tested
- Root cause identified
- Fix location and verification plan

### Monk Output Structure
- Overall correctness assessment
- Findings by priority (P0-P3)
- Specific file:line references
- Actionable recommendations

### Bard Output Structure
- Audience and purpose stated
- Key points outlined
- Polished draft message
- Tone and rationale notes

## Reading Strategy

1. **Read the full output** — Don't stop at first paragraph
2. **Look for file references** — Agents include paths and line numbers
3. **Check for verification** — Craftsman and Hunter should show evidence
4. **Note confidence levels** — Sage and Monk may indicate certainty

## Follow-up Questions

If output is unclear:
- "What files did you read?"
- "What commands did you run?"
- "Can you show the specific line?"

Do NOT ask agents to change output format. Work with natural language.
