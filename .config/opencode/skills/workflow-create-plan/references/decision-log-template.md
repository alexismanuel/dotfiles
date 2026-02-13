# Decision Log Template and Guidelines

## ADR (Architecture Decision Record) Format

Each decision should follow this structure:

```markdown
### [DECISION #]: [Decision Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]

**Context:**
[Brief 2-3 sentences explaining the problem space, constraints, or driving factors. What situation led to this decision?]

**Decision:**
[Chosen approach - 1-2 sentences clearly stating what was selected. Use positive language.]

**Justification:**
[4-5 bullet points explaining why this choice is good, using positive framing:]
- [Benefit 1: positive impact, measurable advantage]
- [Benefit 2: what we gain from this approach]
- [Benefit 3: efficiency, maintainability, or performance win]
- [Benefit 4: alignment with existing patterns or best practices]
- [Benefit 5: specific advantage over alternatives]

**Alternatives Considered:**
- [Alternative A]: [Brief description + why not chosen]
- [Alternative B]: [Brief description + why not chosen]

**Rationale:**
[1-2 sentences synthesizing the justification into a clear, concise choice statement. Should emphasize the positive outcome.]
```

## Decision Extraction Guidelines

### What to Extract

From the detailed Plan.md content, identify:

1. **Architectural Choices** (e.g., "Use PostgreSQL vs MongoDB", "REST vs GraphQL")
2. **Design Patterns** (e.g., "Repository pattern", "Observer pattern", "Dependency injection")
3. **Technology Selections** (e.g., "Use FastAPI for API layer", "Choose Redis for caching")
4. **Data Modeling Decisions** (e.g., "Normalize user data", "Use JSONB for flexible schemas")
5. **Integration Approaches** (e.g., "Event-driven communication", "Direct database access")
6. **Testing Strategy** (e.g., "Dummy-class testing over mocks", "Integration tests per feature")

### How Many Decisions

Target **6-8 key decisions**. These should be high-level, cross-cutting choices that impact multiple tasks or the overall architecture. Avoid:

- Minor implementation details (e.g., "Use snake_case for variable names")
- Coding conventions (e.g., "Follow existing code style")
- Trivial choices (e.g., "Use for loop vs while loop")

### Where to Find Decisions

Search Plan.md for:

- "Architecture" sections
- "Tech Stack" selections
- "Dependencies & Risks" mentions
- "Task Breakdown" patterns
- Code examples showing repeated patterns
- Testing approaches

### Abstraction Level

Decision log should be at a **higher abstraction level** than Plan.md:

- Plan.md: "Create `src/auth/jwt.py` with `create_token()` function that uses HS256 algorithm"
- Decision Log: "Use JWT tokens for authentication with HS256 signing"

- Plan.md: "Write test `test_user_login()` in `tests/auth/test_login.py` using `DummyUser` class"
- Decision Log: "Adopt dummy-class testing pattern over mocks for all tests"

## Positive Framing Examples

### ❌ Negative Framing (AVOID)

> "We chose PostgreSQL because MongoDB doesn't handle complex queries well."
> "Avoid mocks - they make tests brittle."
> "Don't use shared state - it causes race conditions."

### ✅ Positive Framing (USE)

> "PostgreSQL enables advanced querying, ACID transactions, and joins across related data."
> "Dummy-class testing provides realistic interaction patterns, clear dependencies, and maintainable test suites."
> "Immutable state eliminates race conditions, simplifies reasoning, and enables concurrent operations."

## Example Architecture-Decisions.md Output

```markdown
---
date: 2025-01-19T10:30:00Z
planner: opencode
git_commit: abc123def
branch: feature/user-auth
repository: myapp
feature: user-authentication
status: accepted
---

# Architecture Decisions: User Authentication

> **Generated from:** plan.md
> **Review time:** 5-10 minutes

## Decision Summary

This document captures 7 key architectural decisions for the user authentication feature. Each decision follows the ADR (Architecture Decision Record) format with positive justification for the chosen approach.

---

### 1: Use JWT Tokens for Authentication

**Status:** Accepted

**Context:**
The application requires stateless authentication that scales horizontally and supports mobile/web clients without session storage overhead.

**Decision:**
Implement JWT (JSON Web Tokens) for user authentication with HS256 signing algorithm and 24-hour token expiration.

**Justification:**
- Stateless design eliminates server-side session storage, reducing infrastructure costs
- Tokens are self-contained, enabling efficient load balancing and horizontal scaling
- Standard JWT libraries provide secure signing and verification with minimal custom code
- Built-in expiration and claims support flexible authorization patterns
- Compatible across web and mobile platforms with minimal client-side logic

**Alternatives Considered:**
- Session-based auth: Requires server-side storage, complicates horizontal scaling
- OAuth2: Overkill for single-tenant application, introduces external dependencies
- API keys: Less flexible for user sessions, harder to revoke individual tokens

**Rationale:**
JWT provides the optimal balance of scalability, security, and implementation simplicity for our stateless authentication requirements.

---

### 2: Repository Pattern for Data Access

**Status:** Accepted

**Context:**
Multiple data models (User, Session, Permission) require consistent access patterns and testable database interactions.

**Decision:**
Implement Repository pattern with abstract base classes and concrete implementations for each data model.

**Justification:**
- Separates business logic from data access, improving code organization and maintainability
- Enables easy mocking or substitution for testing with dummy repositories
- Centralizes query logic, reducing code duplication across the codebase
- Supports future database migrations by changing implementation without affecting callers
- Aligns with existing codebase patterns found in research (src/data/repositories/)

**Alternatives Considered:**
- Active Record: Couples models to database logic, harder to test in isolation
- Direct SQL queries: Scattered query logic, no abstraction layer for testing
- ORM-only approach: Limits flexibility for complex queries and caching strategies

**Rationale:**
The Repository pattern provides a clean separation of concerns and aligns with established codebase patterns, making it the best fit for our data access layer.

---

### 3: Dummy-Class Testing Over Mocks

**Status:** Accepted

**Context:**
Python testing requires realistic test doubles without the brittleness of mock-based approaches, per python-testing-guidelines skill requirements.

**Decision:**
Use dummy classes that inherit from real classes instead of unittest.mock for all test fixtures and dependencies.

**Justification:**
- Dummy classes maintain real type signatures, catching interface changes at compile/test time
- Tests interact with actual implementation details, ensuring realistic behavior
- Centralized fixture management in tests/fixtures.py improves test maintainability
- Eliminates "mock drift" where mocks diverge from actual implementation
- Clearer test intent: dummy classes make test dependencies explicit and obvious

**Alternatives Considered:**
- unittest.mock: Brittle, implicit interfaces, hard to debug when implementation changes
- pytest fixtures without inheritance: Less realistic, may miss edge cases
- Integration tests only: Slower, harder to isolate failures, don't catch interface mismatches

**Rationale:**
Dummy-class testing provides robust, maintainable test coverage that evolves with the codebase while enforcing explicit dependencies.

---

### 4: Error-as-Value Pattern for Business Logic

**Status:** Accepted

**Context:**
Authentication and authorization functions need clear error handling without exceptions for predictable failure modes.

**Decision:**
Implement error-as-value pattern where functions return (result, error) tuples instead of raising exceptions for business logic errors.

**Justification:**
- Explicit error handling reduces unexpected exceptions and improves code reliability
- Callers must handle errors explicitly, making error paths obvious and tested
- Aligns with functional programming principles, easier to reason about
- Enables clean error aggregation and composite operations (e.g., "try all, collect failures")
- Maintains compatibility with Python's type hints and static analysis tools

**Alternatives Considered:**
- Exception-based error handling: Can cause uncaught exceptions, harder to follow control flow
- Global error codes: Less type-safe, harder to track error context
- Status object wrapper: More verbose, introduces additional object allocations

**Rationale:**
The error-as-value pattern provides explicit, type-safe error handling that improves code reliability and makes error paths first-class citizens in the codebase.

---

[Continue with decisions 5-7...]

---

## Implementation Tracking

These decisions are reflected in the detailed implementation tasks in plan.md. Each decision maps to one or more implementation tasks:

- Decision 1 (JWT) → Tasks 3-5 (token generation, verification, middleware)
- Decision 2 (Repository) → Tasks 7-10 (repository implementations)
- Decision 3 (Dummy Testing) → All testing tasks (tests/auth/test_*.py)
- Decision 4 (Error-as-Value) → Tasks 12-15 (service layer functions)

## Related Documents

- PRD: prd.md
- Research: research.md
- Implementation Plan: plan.md
- Git Commit: abc123def
