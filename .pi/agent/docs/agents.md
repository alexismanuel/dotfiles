# Agent Definitions

Specialized agents for delegation via `pi` CLI.

## Quick Reference

| Agent | Role | Tools | Thinking | Use For |
|-------|------|-------|----------|---------|
| **scout** | Find code | read, bash | minimal | File searches, locating symbols |
| **sage** | Deep analysis | read, bash | high | Trace data flow, architecture |
| **craftsman** | Implementation | read, write, edit, bash | medium | Multi-file changes, tests |
| **monk** | Code review | read, bash | high | Review diffs, quality checks |
| **guardian** | Obsidian vault | read, write, edit, bash | low | Vault operations |

| **interviewer** | Requirements | read, bash | medium | Clarify vague requirements |

## Usage

```bash
pi --system-prompt @~/.pi/agent/agents/AGENT.md --tools TOOLS --thinking LEVEL -p "TASK" --print
```

### Examples

```bash
# Find code
pi --system-prompt @~/.pi/agent/agents/scout.md --tools read,bash --thinking minimal -p "Find auth code" --print

# Deep analysis
pi --system-prompt @~/.pi/agent/agents/sage.md --tools read,bash --thinking high -p "Trace data flow" --print

# Implementation
pi --system-prompt @~/.pi/agent/agents/craftsman.md --tools read,write,edit,bash --thinking medium -p "Refactor auth" --print

# Code review
pi --system-prompt @~/.pi/agent/agents/monk.md --tools read,bash --thinking high -p "Review src/auth/" --print

# Interview (clarify vague requirements)
pi --system-prompt @~/.pi/agent/agents/interviewer.md --tools read,bash --thinking medium -p "User wants to 'improve the search'" --print
```

## Parallel Delegation

```bash
# Start agents in background
pi --system-prompt @~/.pi/agent/agents/scout.md ... > /tmp/auth.json &
pi --system-prompt @~/.pi/agent/agents/scout.md ... > /tmp/api.json &
wait

# Parse results
const data = JSON.parse((await readFile("/tmp/auth.json")).content);
```

## Cost Awareness

| Level | Cost | Use Case |
|-------|------|----------|
| `minimal` | Cheapest, fastest | scout/guardian |
| `medium` | Balanced | craftsman |
| `high` | Most capable | sage/monk |

## Behavioral Patterns

All agents inherit behavioral patterns from `~/.pi/agent/BEHAVIORS.md`:

| Pattern | Applies To | Purpose |
|---------|------------|---------|
| **Verification Before Completion** | craftsman | Never claim completion without fresh evidence |
| **Systematic Debugging** | hunt prompt | 4-phase root cause investigation |
| **Systematic Thinking** | sage | 5-phase problem decomposition |
| **User Interview** | interviewer | Structured requirements elicitation |

These patterns are **embedded in agent definitions** (not skills) per harness engineering principles: passive context outperforms active skill invocation.

## Prompt Templates

Available via `/prompt-name` in pi:

| Prompt | Purpose |
|--------|---------|
| `/commit` | Basic commit message generation |
| `/commit-work` | Full commit workflow with staging review & Conventional Commits |
| `/readme` | Write READMEs matched to project type (OSS, internal, personal, config) |
| `/agent-md-refactor` | Refactor bloated AGENTS.md using progressive disclosure |
| `/strategize` | Research and create implementation plan |
| `/implement` | Execute plan in batches |
| `/research` | Research codebase for a topic |
| `/review` | Code review |
| `/hunt` | Systematic debugging and issue tracking |
| `/ticket` | Create Jira ticket |
| `/chronicle` | Log work to daily note |

## Output Schemas

See `lib/agent-output.md` for JSON output format.
