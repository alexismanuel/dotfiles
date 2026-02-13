# Go CLI Standards

Standards for building internal command-line tools in Go.

## When to Use Go for CLIs

| Criteria | Go | Python/Shell |
|----------|-----|-------------|
| Called frequently (>10x/session) | ✅ Native binary, no startup lag | ⚠️ Import/module load time |
| Complex data structures | ✅ Strong types, JSON safety | ⚠️ Runtime errors |
| Long-term maintenance | ✅ Single binary, self-contained | ⚠️ Dependency drift |
| Rapid prototyping | ⚠️ 20 min to scaffold | ✅ Minutes to working |

**Rule of thumb:** If I'll use it daily and it needs reliability, build it in Go.

---

## Project Structure

```
~/.pi/agent/extensions/tools/
└── <tool-name>/
    ├── main.go          # Entry point
    ├── go.mod           # Module definition
    ├── internal/        # Private packages (if needed)
    │   └── jira/
    │       ├── client.go
    │       └── types.go
    └── cmd/             # Subcommand packages (if complex)
        └── fetch.go
```

---

## Interface Contract (Critical for LLM Integration)

### 1. Output

**Success:** Print JSON to stdout

```go
encoder := json.NewEncoder(os.Stdout)
encoder.SetIndent("", "  ")
encoder.Encode(result)
```

**Error:** Print JSON to stderr, exit 1

```go
func printError(msg, details string) {
	err := struct {
		Error   string `json:"error"`
		Details string `json:"details,omitempty"`
	}{Error: msg, Details: details}
	
	json.NewEncoder(os.Stderr).Encode(err)
	os.Exit(1)
}
```

### 2. Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success, valid JSON in stdout |
| 1 | Error, error JSON in stderr |

### 3. Arguments

- Positional args: `jira-fetch RD-3891`
- Flags for options: `jira-fetch --format=compact RD-3891`
- No interactive prompts (breaks automation)

---

## Scaffolding Template

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

// Result is your output type
type Result struct {
    Field string `json:"field"`
}

func main() {
    if len(os.Args) < 2 {
        printError("missing argument", "Usage: tool-name <arg>")
    }
    
    result, err := doWork(os.Args[1])
    if err != nil {
        printError("operation failed", err.Error())
    }
    
    output(result)
}

func doWork(arg string) (*Result, error) {
    // Implementation
    return &Result{Field: arg}, nil
}

func output(v interface{}) {
    enc := json.NewEncoder(os.Stdout)
    enc.SetIndent("", "  ")
    enc.Encode(v)
}

func printError(err, details string) {
    json.NewEncoder(os.Stderr).Encode(map[string]string{
        "error":   err,
        "details": details,
    })
    os.Exit(1)
}
```

---

## Building & Installing

```bash
# One-shot build
cd ~/.pi/agent/extensions/tools/<tool-name>
go build -buildvcs=false -o ~/bin/<tool-name> .

# Verify
which <tool-name>
<tool-name> --help
```

Ensure `~/bin/` is in `$PATH` (add to `~/.zshrc` or `~/.bashrc`):

```bash
export PATH="$HOME/bin:$PATH"
```

---

## Dependencies

Use minimal deps. Preferred:

- Standard library only (ideal for simple tools)
- `github.com/spf13/cobra` (complex subcommands)
- `github.com/charmbracelet/lipgloss` (colored output, optional)

Lock versions in `go.mod`:

```bash
go get github.com/spf13/cobra@latest
go mod tidy
```

---

## Error Messages

Make errors actionable for LLM parsing:

| Bad | Good |
|-----|------|
| `failed` | `jira authentication required. Run: jira login` |
| `not found` | `ticket RD-9999 not found or no access` |
| `error` | `network timeout connecting to jira.example.com` |

---

## Existing Tools

| Tool | Purpose | Location |
|------|---------|----------|
| `jira-fetch` | Fetch Jira tickets by ID | `~/.pi/agent/extensions/tools/jira-cli/` |
| `gitlab-mr-fetch` | Fetch GitLab MR details, discussions, approvals | `~/.pi/agent/extensions/tools/gitlab-mr/` |

Add new tools here as they're built.
