# Python Conventions

Python development guidelines, tooling, and patterns.

## Philosophy

Strong preferences, pragmatic adaptation.
- **New projects**: apply these patterns fully
- **Existing projects**: respect existing conventions, introduce patterns gradually

---

## Tooling

| Tool | Purpose |
|------|---------|
| **uv** | Package management, virtual environments |
| **ruff** | Linting + formatting (replaces flake8, isort, black) |
| **basedpyright** | Type checking |
| **pytest** | Testing framework |
| **alembic** | Database migrations (if existing in project) |

---

## Project Setup

```bash
# New project
uv init my-project
cd my-project

# Add dependencies
uv add fastapi sqlalchemy

# Add dev dependencies
uv add --dev pytest ruff basedpyright

# Run
uv run python -m myapp
```

---

## Code Conventions

### Type Hints
- Type hints on **all function signatures**
- Use `from __future__ import annotations` for forward references

### Docstrings
- Docstrings on all public functions
- Use **Google style**:
```python
def fetch_user(user_id: int) -> User:
    """Fetch a user by ID.

    Args:
        user_id: The unique identifier for the user.

    Returns:
        The user object if found.

    Raises:
        UserNotFoundError: If no user exists with the given ID.
    """
```

### Commits
- Use **Conventional Commits**: `feat(scope):`, `fix(scope):`, `refactor(scope):`

---

## Import Patterns

### No Local Imports
Never use local imports (imports inside functions/methods). Instead:
- Create dedicated modules (e.g., `errors.py`) for shared error classes
- Reorganize module structure to avoid circular dependencies
- Use forward references (`from __future__ import annotations` or `TYPE_CHECKING`) only when absolutely necessary

### Module Organization
- `types.py` - Strawberry GraphQL types only
- `errors.py` - Error classes and exceptions
- `models.py` - Database models
- Keep domain logic in services, types in types modules

---

## Error Handling

### Error-as-Value Pattern
For new code, functions return `(result, error)` tuples instead of raising exceptions:

```python
from typing import TypeVar

T = TypeVar("T")

def find_user(user_id: int) -> tuple[User | None, Error | None]:
    user = db.query(User).get(user_id)
    if user is None:
        return None, Error.not_found(f"User {user_id} not found")
    return user, None

# Usage
user, err = find_user(123)
if err:
    return handle_error(err)
```

---

## Testing

### No Mocks — Dummy Classes Only

**NEVER** use `unittest.mock`, `Mock`, `MagicMock`, `AsyncMock`, or `patch()`.

Instead, use dummy classes that inherit from real classes:

```python
# ✅ CORRECT
class DummyGateway(RealGateway):
    def __init__(self):
        self.calls = []

    def fetch(self, url: str) -> Response:
        self.calls.append(url)
        return Response(status=200, body="test")

# ❌ WRONG
gateway = Mock(spec=RealGateway)
gateway.fetch.return_value = Response(status=200, body="test")
```

### Test Structure

- **Mirror source structure**: `src/module/file.py` → `tests/module/test_file.py`
- **Centralize fixtures**: All fixtures and dummy classes in `tests/fixtures.py`
- **Naming**: Test classes named `TestMethodName` or `TestClassNameMethodName`
- **Parametrization**: Use `pytest.mark.parametrize` for edge cases

```python
# tests/module/test_service.py
import pytest
from tests.fixtures import DummyRepository

class TestUserServiceCreateUser:
    def test_creates_user_with_valid_data(self):
        repo = DummyRepository()
        service = UserService(repo)
        ...

    @pytest.mark.parametrize("email", ["invalid", "", None])
    def test_rejects_invalid_email(self, email: str):
        ...
```

---

## Code Quality Verification

Always verify code quality after making changes:

```bash
# Run tests
uv run pytest tests/ -v

# Lint (auto-fix)
uv run ruff check --fix .

# Format
uv run ruff format .

# Type check
uv run basedpyright .
```

### Pre-commit Checklist
- [ ] Tests pass: `uv run pytest`
- [ ] No lint errors: `uv run ruff check .`
- [ ] Code formatted: `uv run ruff format .`
- [ ] Type check passes: `uv run basedpyright`
