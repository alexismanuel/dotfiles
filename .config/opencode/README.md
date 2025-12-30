# OpenCode Custom Configuration

This directory contains custom plugins and skills for OpenCode. Before using them, ensure all system dependencies are installed.

## System Dependencies

### Required (Core)

| Dependency | Required For | Installation |
|------------|--------------|--------------|
| **Node.js 18+** | Plugins, web-tester, artifacts-builder | `brew install node` or [nodejs.org](https://nodejs.org) |
| **Python 3.10+** | Most skills | `brew install python` or [python.org](https://python.org) |
| **uv** | Python dependency management | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| **Git** | git-commit-helper, mr-generator | Usually pre-installed |

### Required for Specific Skills

| Dependency | Required For | Installation |
|------------|--------------|--------------|
| **GitLab CLI (glab)** | mr-generator, mr-tracker | `brew install glab` or [gitlab.com/gitlab-org/cli](https://gitlab.com/gitlab-org/cli) |
| **Jira CLI** | jira-ticket-creator, jira-ticket-fetcher | `npm install -g jira-cli` |
| **jq** | mr-tracker | `brew install jq` |
| **DuckDB** | duckdb-data-explorer | `pip install duckdb` or `brew install duckdb` |

### Optional (Enhanced Features)

| Dependency | Required For | Installation |
|------------|--------------|--------------|
| **Playwright** | web-tester | Auto-installed by skill setup |
| **Anthropic SDK** | mcp-builder evaluation | `pip install anthropic` |

## Quick Setup

```bash
# 1. Install Node.js dependencies (plugins)
cd ~/.config/opencode
npm install

# 2. Install Python package manager
curl -LsSf https://astral.sh/uv/install.sh | sh

# 3. Setup web-tester skill (includes Playwright)
cd ~/.config/opencode/skill/web-tester
npm run setup
```

## Plugins

| Plugin | Description | Dependencies |
|--------|-------------|--------------|
| **enforce-skill.js** | Auto-suggests relevant skills based on prompt keywords | Node.js (built-in fs/path) |
| **ignore-files.js** | Protects files matching .opencodeignore patterns | `ignore` npm package (auto-installed) |
| **open-notify.js** | Desktop notifications on task completion | macOS (uses osascript) |
| **env-protection.js** | Prevents accidental env file exposure | Node.js (built-in) |

## Skills

### codemap-generator
Generate hierarchical code maps from any codebase.

**Dependencies:**
- Python 3.10+
- uv (handles dependencies automatically via PEP 723)
- Automatically installs: tree-sitter, tree-sitter-languages, gitignore-parser

**Usage:**
```bash
uv run ~/.config/opencode/skill/codemap-generator/scripts/codemap.py -o CODEMAP.md
```

---

### duckdb-data-explorer
Local data exploration and profiling using DuckDB.

**Dependencies:**
- Python 3.10+
- DuckDB: `pip install duckdb`

**Usage:**
```bash
python ~/.config/opencode/skill/duckdb-data-explorer/scripts/data_profiler.py data.csv --output profile.json
```

---

### web-tester
Frontend testing with browser automation, assertions, and visual regression.

**Dependencies:**
- Node.js 16+
- Playwright (auto-installed via setup)

**Setup:**
```bash
cd ~/.config/opencode/skill/web-tester
npm run setup
```

**Usage:**
```bash
cd ~/.config/opencode/skill/web-tester
node run.js /tmp/test.js
node run.js --list-baselines
```

---

### artifacts-builder
Build React/TypeScript artifacts with shadcn/ui for Claude.ai.

**Dependencies:**
- Node.js 18+
- npm (comes with Node.js)
- Dependencies installed per-project via init script

**Usage:**
```bash
bash ~/.config/opencode/skill/artifacts-builder/scripts/init-artifact.sh my-project
cd my-project
bash ~/.config/opencode/skill/artifacts-builder/scripts/bundle-artifact.sh
```

---

### mr-generator
Generate GitLab merge request descriptions from commits.

**Dependencies:**
- Python 3.10+
- GitLab CLI: `brew install glab` or `pip install glab`
- requests: `pip install requests`

**Usage:**
```bash
python ~/.config/opencode/skill/mr-generator/scripts/mr_generator.py --jira PROJ-123
```

---

### mr-tracker
Monitor GitLab merge request comments and status.

**Dependencies:**
- GitLab CLI: `brew install glab`
- jq: `brew install jq`

**Usage:**
```bash
~/.config/opencode/skill/mr-tracker/scripts/mr_tracker.sh comments 123
```

---

### jira-ticket-creator
Create Jira tickets (features, bugs, tasks).

**Dependencies:**
- Python 3.10+
- Jira CLI: `npm install -g jira-cli` (must be authenticated)

**Usage:**
```bash
python ~/.config/opencode/skill/jira-ticket-creator/scripts/jira_helper.py create-feature "Title" "Description"
```

---

### jira-ticket-fetcher
Fetch Jira tickets by ID or search.

**Dependencies:**
- Python 3.10+
- Jira CLI: `npm install -g jira-cli` (must be authenticated)

**Usage:**
```bash
python ~/.config/opencode/skill/jira-ticket-fetcher/scripts/fetch_ticket.py RD-3891
```

---

### mcp-builder
Guide for building MCP (Model Context Protocol) servers.

**Dependencies:**
- Python 3.10+ or Node.js 18+ (depending on implementation)
- For evaluation: `pip install anthropic mcp`

**Note:** This is primarily a documentation/guide skill. Dependencies vary based on the MCP server being built.

---

### git-commit-helper
Generate descriptive commit messages from git diffs.

**Dependencies:**
- Git (usually pre-installed)

**Note:** This is a documentation/guide skill. No additional dependencies required.

---

### skill-creator
Guide for creating new OpenCode skills.

**Dependencies:**
- Python 3.10+ (for helper scripts)

**Note:** This is primarily a documentation/guide skill.

## Verification

Check if all core dependencies are installed:

```bash
# Node.js
node --version  # Should be 18+

# Python
python3 --version  # Should be 3.10+

# uv
uv --version

# Git
git --version

# Optional - GitLab CLI
glab --version

# Optional - Jira CLI
jira --version

# Optional - jq
jq --version

# Optional - DuckDB
python3 -c "import duckdb; print(duckdb.__version__)"
```

## Troubleshooting

### Playwright not working
```bash
cd ~/.config/opencode/skill/web-tester
npm run setup
```

### Python scripts fail with import errors
```bash
# For codemap-generator (uses uv)
uv run <script>  # Dependencies auto-installed

# For other scripts
pip install duckdb requests  # Install as needed
```

### GitLab CLI not authenticated
```bash
glab auth login
```

### Jira CLI not authenticated
```bash
jira login
```

## File Structure

```
~/.config/opencode/
├── opencode.json          # Main configuration
├── package.json           # Node.js dependencies for plugins
├── skill-rules.json       # Skill trigger rules for enforce-skill plugin
├── .opencodeignore        # Global file protection patterns
├── plugin/
│   ├── enforce-skill.js   # Auto-suggest skills
│   ├── ignore-files.js    # File protection
│   ├── open-notify.js     # Desktop notifications
│   └── env-protection.js  # Env file protection
└── skill/
    ├── artifacts-builder/
    ├── codemap-generator/
    ├── duckdb-data-explorer/
    ├── git-commit-helper/
    ├── jira-ticket-creator/
    ├── jira-ticket-fetcher/
    ├── mcp-builder/
    ├── mr-generator/
    ├── mr-tracker/
    ├── skill-creator/
    └── web-tester/
```
