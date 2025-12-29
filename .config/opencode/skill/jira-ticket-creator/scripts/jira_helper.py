#!/usr/bin/env python3
"""
Jira CLI helper script for creating and managing Jira tickets.
Supports features, bugs, and tasks with proper field mapping.
"""

import subprocess
import json
import sys
from typing import Dict, Optional, List


class JiraHelper:
    def __init__(self, project: str = "RD"):
        self.project = project
    
    def run_jira_command(self, command: List[str]) -> Dict:
        """Execute jira CLI command and return parsed result."""
        try:
            result = subprocess.run(
                ["jira"] + command,
                capture_output=True,
                text=True,
                check=True
            )
            return {"success": True, "output": result.stdout, "error": None}
        except subprocess.CalledProcessError as e:
            return {"success": False, "output": None, "error": e.stderr}
        except FileNotFoundError:
            return {"success": False, "output": None, "error": "Jira CLI not found. Please install with: npm install -g jira-cli"}
    
    def create_feature_ticket(self, summary: str, description: str, assignee: Optional[str] = None, 
                            team: Optional[str] = None, sprint: Optional[str] = None) -> Dict:
        """Create a feature ticket with PRD-like content."""
        # Format description for feature
        formatted_desc = f"""h2. Feature Overview
{description}

h2. Requirements
* [TODO: Add specific requirements]

h2. Acceptance Criteria
* [TODO: Define acceptance criteria]

h2. Technical Considerations
* [TODO: Add technical details if needed]"""

        return self._create_ticket("Feature", summary, formatted_desc, assignee, team, sprint)
    
    def create_bug_ticket(self, summary: str, problem: str, reproduction_steps: str, 
                         resolution_hypothesis: str, assignee: Optional[str] = None,
                         team: Optional[str] = None, sprint: Optional[str] = None) -> Dict:
        """Create a bug ticket with problem analysis."""
        formatted_desc = f"""h2. Problem Description
{problem}

h2. Steps to Reproduce
# {reproduction_steps}

h2. Expected Behavior
[TODO: Describe what should happen]

h2. Actual Behavior
[TODO: Describe what actually happens]

h2. Resolution Hypothesis
{resolution_hypothesis}

h2. Additional Context
[TODO: Add any relevant context, logs, screenshots, etc.]"""

        return self._create_ticket("Bug", summary, formatted_desc, assignee, team, sprint)
    
    def create_task_ticket(self, summary: str, description: str, assignee: Optional[str] = None,
                          team: Optional[str] = None, sprint: Optional[str] = None) -> Dict:
        """Create a general task ticket."""
        return self._create_ticket("Task", summary, description, assignee, team, sprint)
    
    def _create_ticket(self, issue_type: str, summary: str, description: str, 
                       assignee: Optional[str], team: Optional[str], sprint: Optional[str]) -> Dict:
        """Internal method to create a Jira ticket with common fields."""
        command = [
            "issue", "create",
            "--project", self.project,
            "--type", issue_type,
            "--summary", summary,
            "--description", description
        ]
        
        if assignee:
            command.extend(["--assignee", assignee])
        if team:
            command.extend(["--customfield", f"team={team}"])
        if sprint:
            command.extend(["--sprint", sprint])
        
        return self.run_jira_command(command)
    
    def list_tickets(self, project: Optional[str] = None, status: Optional[str] = None) -> Dict:
        """List tickets with optional filtering."""
        command = ["issue", "list"]
        
        if project or self.project:
            command.extend(["--project", project or self.project])
        if status:
            command.extend(["--status", status])
        
        return self.run_jira_command(command)
    
    def update_ticket(self, issue_key: str, **fields) -> Dict:
        """Update an existing ticket."""
        command = ["issue", "update", issue_key]
        
        for field, value in fields.items():
            if field == "assignee":
                command.extend(["--assignee", value])
            elif field == "status":
                command.extend(["--status", value])
            elif field == "summary":
                command.extend(["--summary", value])
            elif field == "description":
                command.extend(["--description", value])
        
        return self.run_jira_command(command)


def main():
    """CLI interface for the Jira helper."""
    if len(sys.argv) < 2:
        print("Usage: python jira_helper.py <command> [args...]")
        print("Commands: create-feature, create-bug, create-task, list, update")
        sys.exit(1)
    
    command = sys.argv[1]
    helper = JiraHelper()
    
    if command == "create-feature":
        if len(sys.argv) < 4:
            print("Usage: python jira_helper.py create-feature <summary> <description> [assignee] [team] [sprint]")
            sys.exit(1)
        result = helper.create_feature_ticket(sys.argv[2], sys.argv[3], 
                                              sys.argv[4] if len(sys.argv) > 4 else None,
                                              sys.argv[5] if len(sys.argv) > 5 else None,
                                              sys.argv[6] if len(sys.argv) > 6 else None)
    elif command == "create-bug":
        if len(sys.argv) < 6:
            print("Usage: python jira_helper.py create-bug <summary> <problem> <reproduction> <hypothesis> [assignee] [team] [sprint]")
            sys.exit(1)
        result = helper.create_bug_ticket(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5],
                                          sys.argv[6] if len(sys.argv) > 6 else None,
                                          sys.argv[7] if len(sys.argv) > 7 else None,
                                          sys.argv[8] if len(sys.argv) > 8 else None)
    elif command == "create-task":
        if len(sys.argv) < 4:
            print("Usage: python jira_helper.py create-task <summary> <description> [assignee] [team] [sprint]")
            sys.exit(1)
        result = helper.create_task_ticket(sys.argv[2], sys.argv[3],
                                          sys.argv[4] if len(sys.argv) > 4 else None,
                                          sys.argv[5] if len(sys.argv) > 5 else None,
                                          sys.argv[6] if len(sys.argv) > 6 else None)
    elif command == "list":
        result = helper.list_tickets()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
    
    if result["success"]:
        print("✅ Success!")
        print(result["output"])
    else:
        print("❌ Error:")
        print(result["error"])
        sys.exit(1)


if __name__ == "__main__":
    main()