# Jira Ticket Templates

This document provides templates and guidelines for creating different types of Jira tickets in the RD (Research & Development) project.

## Ticket Types

### 1. Feature Tickets

Features are new capabilities or significant enhancements to existing functionality.

**Required Fields:**
- Project: RD
- Type: Feature
- Summary: Clear, concise description of the feature
- Description: PRD-like content with sections below
- Assignee: (optional) Person responsible for implementation
- Team: (optional) Development team
- Sprint: (optional) Target sprint
- State: (optional) Initial workflow state

**Description Template:**
```
h2. Feature Overview
[Brief description of what the feature does and why it's needed]

h2. Requirements
* [Specific requirement 1]
* [Specific requirement 2]
* [Specific requirement 3]

h2. Acceptance Criteria
* [Criterion 1 - must be testable]
* [Criterion 2 - must be testable]
* [Criterion 3 - must be testable]

h2. Technical Considerations
* [Technical details, dependencies, or constraints]
* [Performance considerations]
* [Security considerations]
```

### 2. Bug Tickets

Bugs are issues where the system behaves incorrectly or unexpectedly.

**Required Fields:**
- Project: RD
- Type: Bug
- Summary: Clear description of the problem
- Description: Problem analysis with sections below
- Assignee: (optional) Person to investigate/fix
- Team: (optional) Development team
- Sprint: (optional) Target sprint
- State: (optional) Initial workflow state

**Description Template:**
```
h2. Problem Description
[Clear description of what went wrong]

h2. Steps to Reproduce
# [Step 1]
# [Step 2]
# [Step 3]

h2. Expected Behavior
[Describe what should have happened]

h2. Actual Behavior
[Describe what actually happened]

h2. Resolution Hypothesis
[Theory about the root cause and potential fix approach]

h2. Additional Context
[Logs, screenshots, error messages, environment details, etc.]
```

### 3. Task Tickets

Tasks are general work items that don't fit as features or bugs.

**Required Fields:**
- Project: RD
- Type: Task
- Summary: Clear description of the task
- Description: Detailed explanation of what needs to be done
- Assignee: (optional) Person responsible
- Team: (optional) Development team
- Sprint: (optional) Target sprint
- State: (optional) Initial workflow state

**Description Template:**
```
[Clear description of the task, including:
- What needs to be done
- Why it's important
- Any dependencies or prerequisites
- Expected outcome or deliverable]
```

## Field Mappings

### Common Fields
- **Project**: Always "RD" for Research & Development
- **Assignee**: Username or email of the responsible person
- **Team**: Development team name (if using team-based organization)
- **Sprint**: Sprint name or ID for agile planning
- **State**: Initial workflow state (e.g., "To Do", "Backlog")

### Jira CLI Field Names
- `--project`: Project key
- `--type`: Issue type (Feature, Bug, Task)
- `--summary`: Ticket title/summary
- `--description`: Full description
- `--assignee`: Assigned user
- `--sprint`: Sprint assignment
- `--customfield team=<team_name>`: Custom field for team

## Best Practices

1. **Summaries should be clear and concise**
   - Bad: "Issue with login"
   - Good: "Users cannot login with valid credentials"

2. **Descriptions should provide complete context**
   - Include enough detail for someone to understand the issue without additional conversation
   - Use the templates above to ensure consistency

3. **Acceptance criteria should be testable**
   - Each criterion should be verifiable
   - Use "Given/When/Then" format when helpful

4. **Reproduction steps should be specific**
   - Include exact steps, data, and environment details
   - Number the steps for clarity

5. **Assign tickets appropriately**
   - Don't assign without confirming availability
   - Consider using "Unassigned" for backlog items