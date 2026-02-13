# Technical Specification Template

Use this template when requirements are clear and implementation planning is needed.

## Template Structure

```markdown
# [Feature] Technical Specification

## Summary
One paragraph: what we're building and the high-level approach.

## Background
- Link to PRD or requirements doc
- Why this approach was chosen
- Key constraints driving the design

## Goals
- [Specific technical goal]
- [Specific technical goal]

## Non-Goals
- [What this spec explicitly doesn't address]

## Proposed Solution

### Architecture Overview
[Diagram or description of how components interact]

### Data Model
```
[Schema, types, or data structures]
```

### API Changes
```
[New or modified endpoints/interfaces]
```

### Key Implementation Details
[The non-obvious parts that need explanation]

## Alternatives Considered
| Approach | Pros | Cons | Why Not Chosen |
|----------|------|------|----------------|

## Security Considerations
- [Authentication/authorization changes]
- [Data handling implications]

## Performance Considerations
- [Expected load/scale]
- [Performance requirements]
- [Potential bottlenecks]

## Testing Strategy
- Unit tests: [coverage areas]
- Integration tests: [key flows]
- Manual testing: [scenarios]

## Rollout Plan
1. [Phase 1]
2. [Phase 2]
3. [Rollback procedure]

## Dependencies
- [External services]
- [Other teams/features]
- [Timeline dependencies]

## Open Questions
- [ ] [Technical decision pending]

## Estimated Effort
[T-shirt size or story points with breakdown]
```

## Writing Guidance

**Summary**: Should be understandable by someone unfamiliar with the project.

**Non-Goals**: Prevents scope creep. State what you're NOT solving.

**Alternatives Considered**: Shows you evaluated options. Helps future readers understand why.

**Security/Performance**: Don't skip these. Flag "no concerns" explicitly if that's the case.

**Open Questions**: Use checkboxes. Track resolution.

## When to Use Tech Spec vs PRD

| Use PRD When | Use Tech Spec When |
|--------------|-------------------|
| Problem unclear | Problem is clear |
| Multiple solutions possible | Solution approach chosen |
| Product decisions needed | Implementation planning needed |
| Stakeholder alignment required | Engineering handoff needed |
