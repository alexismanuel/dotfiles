# Jira CLI Commands Reference

This document provides essential Jira CLI commands for ticket creation and management.

## Installation

```bash
npm install -g jira-cli
```

## Configuration

Configure Jira CLI with your instance details:

```bash
jira config set-host https://your-domain.atlassian.net
jira config set-username your-email@company.com
jira config set-password your-api-token
```

## Core Commands

### Create Tickets

#### Basic Ticket Creation
```bash
jira issue create --project RD --type "Task" --summary "Ticket summary" --description "Ticket description"
```

#### Feature Ticket
```bash
jira issue create \
  --project RD \
  --type "Feature" \
  --summary "Implement user authentication" \
  --description "Full feature description..." \
  --assignee username \
  --sprint "Sprint 12"
```

#### Bug Ticket
```bash
jira issue create \
  --project RD \
  --type "Bug" \
  --summary "Login page crashes on mobile" \
  --description "Bug description with reproduction steps..." \
  --assignee username
```

### List Tickets

#### List All Tickets in Project
```bash
jira issue list --project RD
```

#### Filter by Status
```bash
jira issue list --project RD --status "In Progress"
jira issue list --project RD --status "To Do"
```

#### Filter by Type
```bash
jira issue list --project RD --type "Bug"
jira issue list --project RD --type "Feature"
```

### Update Tickets

#### Update Assignee
```bash
jira issue update TICKET-123 --assignee new-username
```

#### Update Status
```bash
jira issue update TICKET-123 --status "In Progress"
jira issue update TICKET-123 --status "Done"
```

#### Update Summary and Description
```bash
jira issue update TICKET-123 --summary "New summary" --description "New description"
```

### Custom Fields

#### Set Team Field
```bash
jira issue create --project RD --type "Task" --summary "Task" --customfield "team=Backend"
```

#### Set Multiple Custom Fields
```bash
jira issue create --project RD --type "Task" --summary "Task" \
  --customfield "team=Backend" \
  --customfield "priority=High"
```

## Common Options

| Option | Description | Example |
|--------|-------------|---------|
| `--project` | Project key | `--project RD` |
| `--type` | Issue type | `--type "Feature"` |
| `--summary` | Ticket title | `--summary "Fix login bug"` |
| `--description` | Full description | `--description "Detailed info"` |
| `--assignee` | Assigned user | `--assignee john.doe` |
| `--sprint` | Sprint assignment | `--sprint "Sprint 12"` |
| `--status` | Workflow status | `--status "In Progress"` |
| `--customfield` | Custom field | `--customfield "team=Backend"` |

## Output Formats

### JSON Output
```bash
jira issue list --project RD --output json
```

### Table Output
```bash
jira issue list --project RD --output table
```

## Error Handling

Common errors and solutions:

1. **Authentication failed**
   - Check your API token
   - Verify username and host configuration

2. **Project not found**
   - Verify project key exists
   - Check permissions

3. **Invalid issue type**
   - Check available issue types: `jira issue list-types --project RD`

4. **Custom field not found**
   - Verify custom field name and format
   - Check field permissions

## Advanced Usage

### Bulk Operations
```bash
# Create multiple tickets from a file
while read line; do
  jira issue create --project RD --type "Task" --summary "$line"
done < tickets.txt
```

### Search and Filter
```bash
# Search with JQL
jira issue list --jql "project = RD AND status = 'In Progress'"
```

### Integration with Scripts
The `scripts/jira_helper.py` file provides a Python wrapper for common operations, making it easier to integrate into workflows and automate repetitive tasks.