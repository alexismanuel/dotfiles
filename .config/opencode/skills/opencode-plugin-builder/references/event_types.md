# OpenCode Event Types Reference

Complete reference of all event types and their properties, extracted from the SDK.

## Session Events

### session.created

Fired when a new session is created.

```typescript
{
  type: "session.created"
  properties: {
    info: Session  // Full session object with id, agent, model, etc.
  }
}
```

**Session object contains:**
- `id: string` - Session ID
- `agent: string` - Agent name
- `model: { providerID: string, modelID: string }` - Model configuration
- `system?: string` - Custom system prompt
- `tools?: { [key: string]: boolean }` - Tool configuration

### session.updated

Fired when session properties change.

```typescript
{
  type: "session.updated"
  properties: {
    info: Session
  }
}
```

### session.deleted

Fired when a session is deleted.

```typescript
{
  type: "session.deleted"
  properties: {
    info: Session
  }
}
```

### session.idle

Fired when a session finishes processing and becomes idle.

```typescript
{
  type: "session.idle"
  properties: {
    sessionID: string
    isSubagent?: boolean      // True if this is a subagent session
    parentSessionID?: string  // Parent session ID if subagent
  }
}
```

### session.compacted

Fired after context compaction completes.

```typescript
{
  type: "session.compacted"
  properties: {
    info: Session
  }
}
```

### session.error

Fired when a session encounters an error.

```typescript
{
  type: "session.error"
  properties: {
    sessionID: string
    error: ProviderAuthError | UnknownError | MessageOutputLengthError | MessageAbortedError | ApiError
  }
}
```

### session.status

Fired when session status changes.

```typescript
{
  type: "session.status"
  properties: {
    [sessionID: string]: SessionStatus
  }
}
```

### session.diff

Fired when files are changed in a session.

```typescript
{
  type: "session.diff"
  properties: {
    sessionID: string
    diff: Array<FileDiff>
  }
}
```

## Message Events

### message.updated

Fired when a message is updated.

```typescript
{
  type: "message.updated"
  properties: {
    info: Message  // UserMessage | AssistantMessage
    parts: Array<Part>
  }
}
```

### message.removed

Fired when a message is removed.

```typescript
{
  type: "message.removed"
  properties: {
    info: Message
  }
}
```

### message.part.updated

Fired when a message part (tool call, text, etc.) is updated.

```typescript
{
  type: "message.part.updated"
  properties: {
    part: Part
  }
}
```

### message.part.removed

Fired when a message part is removed.

```typescript
{
  type: "message.part.removed"
  properties: {
    part: Part
  }
}
```

## Permission Events

### permission.updated

Fired when a permission request is created.

```typescript
{
  type: "permission.updated"
  properties: {
    permission: Permission
  }
}
```

### permission.replied

Fired when a permission request is answered.

```typescript
{
  type: "permission.replied"
  properties: {
    permission: Permission
  }
}
```

## File Events

### file.edited

Fired when a file is edited.

```typescript
{
  type: "file.edited"
  properties: {
    path: string
    sessionID: string
    // Additional edit metadata
  }
}
```

### file.watcher.updated

Fired when the file watcher detects changes.

```typescript
{
  type: "file.watcher.updated"
  properties: {
    files: Array<{
      path: string
      event: "create" | "modify" | "delete"
    }>
  }
}
```

## Todo Events

### todo.updated

Fired when the todo list is updated.

```typescript
{
  type: "todo.updated"
  properties: {
    sessionID: string
    todos: Array<Todo>
  }
}
```

## Command Events

### command.executed

Fired when a command is executed.

```typescript
{
  type: "command.executed"
  properties: {
    command: string
    sessionID: string
  }
}
```

## LSP Events

### lsp.updated

Fired when LSP server status changes.

```typescript
{
  type: "lsp.updated"
  properties: {
    servers: Array<{
      name: string
      status: "starting" | "running" | "stopped" | "error"
    }>
  }
}
```

### lsp.client.diagnostics

Fired when LSP diagnostics are received.

```typescript
{
  type: "lsp.client.diagnostics"
  properties: {
    uri: string
    diagnostics: Array<Diagnostic>
  }
}
```

## VCS Events

### vcs.branch.updated

Fired when the git branch changes.

```typescript
{
  type: "vcs.branch.updated"
  properties: {
    branch: string
    previous?: string
  }
}
```

## TUI Events

### tui.prompt.append

Fired when text is appended to the prompt.

```typescript
{
  type: "tui.prompt.append"
  properties: {
    text: string
  }
}
```

### tui.command.execute

Fired when a TUI command is executed.

```typescript
{
  type: "tui.command.execute"
  properties: {
    command: string
  }
}
```

### tui.toast.show

Fired when a toast notification is shown.

```typescript
{
  type: "tui.toast.show"
  properties: {
    message: string
    level: "info" | "warn" | "error"
  }
}
```

## PTY Events

### pty.created

Fired when a PTY session is created.

```typescript
{
  type: "pty.created"
  properties: {
    id: string
  }
}
```

### pty.updated

Fired when a PTY session is updated.

```typescript
{
  type: "pty.updated"
  properties: {
    id: string
    output?: string
  }
}
```

### pty.exited

Fired when a PTY session exits.

```typescript
{
  type: "pty.exited"
  properties: {
    id: string
    exitCode: number
  }
}
```

### pty.deleted

Fired when a PTY session is deleted.

```typescript
{
  type: "pty.deleted"
  properties: {
    id: string
  }
}
```

## Server Events

### server.connected

Fired when the server connects.

```typescript
{
  type: "server.connected"
  properties: {}
}
```

### server.instance.disposed

Fired when the server instance is disposed.

```typescript
{
  type: "server.instance.disposed"
  properties: {}
}
```

## Installation Events

### installation.updated

Fired when the installation is updated.

```typescript
{
  type: "installation.updated"
  properties: {
    version: string
  }
}
```

### installation.update.available

Fired when an update is available.

```typescript
{
  type: "installation.update.available"
  properties: {
    currentVersion: string
    newVersion: string
  }
}
```
