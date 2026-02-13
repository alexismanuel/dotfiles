# Delegation Convention

How to delegate to specialist agents in pi.

## Basic Pattern

```bash
pi --system-prompt @~/.pi/agent/agents/AGENT.md --tools TOOLS --thinking LEVEL \
  -p "SPECIFIC TASK" > /tmp/pi-AGENT-output.log 2>&1
```

Then read the output:
```bash
read /tmp/pi-AGENT-output.log
```

## Output Redirection is MANDATORY

Always use `> /tmp/pi-AGENT-output.log 2>&1` to capture output. Do NOT use `--print`.

## Blocking is OK

Agent execution can be long-running. Do NOT use background processes (`&`), `timeout`, or `sleep` loops. Just run the command and wait.

## Never Ask Agents to Write Files

The agent outputs to stdout, which YOU capture via shell redirection. Do NOT ask agents to write result files themselves.

## Output Naming Convention

| Agent | Output File |
|-------|-------------|
| scout | `/tmp/pi-scout-output.log` |
| sage | `/tmp/pi-sage-output.log` |
| craftsman | `/tmp/pi-craftsman-output.log` |
| hunter | `/tmp/pi-hunter-output.log` |
| monk | `/tmp/pi-monk-output.log` |
| bard | `/tmp/pi-bard-output.log` |
| guardian | `/tmp/pi-guardian-output.log` |
| interviewer | `/tmp/pi-interviewer-output.log` |

## Common Mistakes

### ❌ Wrong: Using --print
```bash
pi ... -p "task" --print  # Don't do this
```

### ❌ Wrong: Background process
```bash
pi ... -p "task" &  # Don't do this
```

### ❌ Wrong: Asking agent to write files
```bash
pi ... -p "Write results to /tmp/output.md"  # Don't do this
```

### ✅ Correct: Shell redirection
```bash
pi ... -p "task" > /tmp/pi-AGENT-output.log 2>&1
```
