---
name: codemap
description: "Generate hierarchical code maps from any codebase for AI agent consumption. Use when: (1) Analyzing or understanding a codebase structure, (2) Creating documentation of code architecture, (3) Mapping dependencies between files, (4) Extracting class hierarchies and call graphs, (5) Onboarding to a new project, (6) Preparing context for AI-assisted code modifications. Supports Python, JavaScript, TypeScript, Go, Rust, Java, C/C++, Ruby, PHP, and 20+ languages via tree-sitter."
---

# Codemap Generator

Generate structured code maps from any codebase, optimized for AI agent consumption.

## Quick Start

```bash
# From repository root, generate a codemap (uv handles dependencies automatically)
uv run scripts/codemap.py -o CODEMAP.md

# File-level only (faster)
uv run scripts/codemap.py -g file -o CODEMAP.md
```

## When to Use

- **Codebase analysis**: Understanding project structure before making changes
- **Dependency mapping**: Identifying which files depend on others
- **Architecture docs**: Creating high-level documentation
- **AI context**: Preparing comprehensive context for code modifications

## Command Reference

```bash
uv run scripts/codemap.py [directory] [options]
```

| Option | Description |
|--------|-------------|
| `directory` | Root directory to analyze (default: current) |
| `-g, --granularity` | `file` (structure only) or `detailed` (classes/functions) |
| `-o, --output` | Output file path (default: stdout) |
| `-c, --contextualized` | Include scope chains, siblings, and used imports per entity |
| `--include-private` | Include private functions/classes (starting with `_`) |
| `--no-docstrings` | Exclude docstrings from output |
| `--no-signatures` | Exclude function signatures |
| `--max-depth N` | Max directory depth (default: 10) |
| `-q, --quiet` | Suppress progress messages |

## Output Structure

The generated markdown contains:

1. **Summary** - File count, languages, class/function counts
2. **Project Structure** - Tree view of all files
3. **File Dependencies** - Internal import relationships
4. **Classes & Types** - All classes with methods, inheritance, docstrings
5. **Functions** - Top-level functions with signatures
6. **Inheritance Hierarchy** - Mermaid diagram of class relationships
7. **Call Graph** - Function call relationships
8. **File Details** - Per-file breakdown of imports, classes, functions

## Supported Languages

Python, JavaScript, TypeScript, Go, Rust, Java, C, C++, Ruby, PHP, Swift, Kotlin, Scala, Lua, Zig, Elixir, Erlang, Haskell, OCaml, R, Julia, Bash, SQL, HTML, CSS, YAML, TOML, JSON, Vue, Svelte.

## Dependencies

The script uses inline dependency metadata (PEP 723), so `uv run` automatically installs required packages. No manual installation needed.

Manual installation (if needed):
```bash
uv pip install tree-sitter==0.21.3 tree-sitter-languages gitignore-parser
```

## Usage Patterns

### Full codebase analysis
```bash
uv run scripts/codemap.py -o CODEMAP.md
```

### Quick structure overview
```bash
uv run scripts/codemap.py -g file -o STRUCTURE.md
```

### Focused analysis on subdirectory
```bash
uv run scripts/codemap.py src/api -o API_MAP.md
```

### Include everything (private functions, all details)
```bash
uv run scripts/codemap.py --include-private -o FULL_MAP.md
```

### Contextualized output for enhanced AI understanding
```bash
uv run scripts/codemap.py -c -o CODEMAP.md
```

The `-c/--contextualized` flag enriches each entity with:
- **Scope chain**: Where this entity lives (e.g., `MyClass > _helper_method`)
- **Used imports**: Which imports are referenced by this entity
- **Siblings**: What entities come before/after in source order

Example output with contextualized mode:

```markdown
### `UserService`

**File:** `src/services/user.py` (line 15)
**Extends:** `BaseService`
**Uses:** `Database`, `Logger`
**After:** `AuthService`
**Before:** `OrderService`

**Methods:**
- `get_user(id: str) -> User`
  - Uses: `Database`
  - After: `__init__`
  - Before: `update_user`
```

## Integration with AI Workflows

The codemap output is designed to be included in AI context for:

1. **Code modification tasks**: Include relevant sections to help AI understand what exists
2. **Refactoring**: Use dependency graph to identify impact
3. **Bug fixing**: Use call graph to trace execution flow
4. **Feature planning**: Use class hierarchy to understand architecture
