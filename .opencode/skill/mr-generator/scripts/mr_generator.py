#!/usr/bin/env python3
"""
Merge Request Generator for OpenCode
Generates MR descriptions based on git commits and templates
"""

import argparse
import json
import os
import re
import subprocess
import sys
from typing import Dict, List, Optional, Tuple
import requests


class MRGenerator:
    def __init__(self):
        self.template = """Closes #X or Relates to [link to backlog]

## What's new
- 🎉 Init of a new component
- ✨ [New feature](url)
- 🐛 [Bug fixed](url)
- 💄 [Glitch fixed](url)
- 🔥 [P1 bug fixed](url)
- 🚀 Something is deployed
- ...

## BTW
Something relevant fixed along the way (tech debt, doc).

## SCREENSHOTS
Screenshots of the app with your fix/new feature on.

## Requirements & Dependencies
- Required software (ex. Docker, Node)?
- Critical new dependency (ex. framework)

## Testing

Run the following commands
```
cd ...
make help
make tests
```"""

    def run_git_command(self, command: List[str]) -> str:
        """Run a git command and return output"""
        try:
            result = subprocess.run(
                ["git"] + command,
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            print(f"Error running git command: {e}")
            return ""

    def get_current_branch(self) -> str:
        """Get current git branch"""
        return self.run_git_command(["rev-parse", "--abbrev-ref", "HEAD"])

    def get_commits_since_main(self) -> List[Dict]:
        """Get commits since diverging from main branch"""
        try:
            # Find the merge base with main
            main_hash = self.run_git_command(["merge-base", "HEAD", "origin/main"])
            if not main_hash:
                main_hash = self.run_git_command(["merge-base", "HEAD", "main"])
            
            if not main_hash:
                print("Could not find main branch")
                return []

            # Get commits since merge base
            commit_range = f"{main_hash}..HEAD"
            commit_output = self.run_git_command([
                "log", "--pretty=format:%H|%s|%b", commit_range
            ])
            
            commits = []
            for line in commit_output.split('\n'):
                if line.strip():
                    hash_id, subject, *body_parts = line.split('|')
                    body = '|'.join(body_parts) if body_parts else ""
                    commits.append({
                        "hash": hash_id,
                        "subject": subject,
                        "body": body
                    })
            
            return commits
        except Exception as e:
            print(f"Error getting commits: {e}")
            return []

    def categorize_commit(self, commit: Dict) -> Tuple[str, str]:
        """Categorize commit type and generate appropriate emoji/bullet"""
        subject = commit["subject"].lower()
        body = commit["body"].lower()
        
        # Check for different commit types
        if any(keyword in subject for keyword in ["feat", "feature", "add"]):
            return "✨", "New feature"
        elif any(keyword in subject for keyword in ["fix", "bug", "patch"]):
            if "p1" in subject or "critical" in subject:
                return "🔥", "P1 bug fixed"
            return "🐛", "Bug fixed"
        elif any(keyword in subject for keyword in ["refactor", "tech debt", "cleanup"]):
            return "🔧", "Refactoring"
        elif any(keyword in subject for keyword in ["docs", "documentation"]):
            return "📚", "Documentation"
        elif any(keyword in subject for keyword in ["test", "tests"]):
            return "🧪", "Tests"
        elif any(keyword in subject for keyword in ["init", "initial", "start"]):
            return "🎉", "Init of a new component"
        elif any(keyword in subject for keyword in ["deploy", "release"]):
            return "🚀", "Deployment"
        elif any(keyword in subject for keyword in ["style", "ui", "glitch"]):
            return "💄", "Glitch fixed"
        else:
            return "🔄", "Changes"

    def extract_ticket_number(self, commit: Dict) -> Optional[str]:
        """Extract ticket number from commit message"""
        # Look for patterns like TICKET-123, PROJ-456, etc.
        patterns = [
            r'([A-Z]+-\d+)',  # JIRA style
            r'#(\d+)',        # GitHub style
        ]
        
        text = f"{commit['subject']} {commit['body']}"
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1) or match.group(0)
        
        return None

    def generate_whats_new(self, commits: List[Dict]) -> str:
        """Generate the 'What's new' section from commits"""
        if not commits:
            return "- No changes detected"
        
        categorized = {}
        tickets = set()
        
        for commit in commits:
            emoji, category = self.categorize_commit(commit)
            ticket = self.extract_ticket_number(commit)
            
            if ticket:
                tickets.add(ticket)
            
            if category not in categorized:
                categorized[category] = []
            
            categorized[category].append({
                "emoji": emoji,
                "subject": commit["subject"],
                "ticket": ticket
            })
        
        # Generate bullets
        bullets = []
        for category, items in categorized.items():
            if len(items) == 1:
                item = items[0]
                ticket_ref = f" ({item['ticket']})" if item['ticket'] else ""
                bullets.append(f"- {item['emoji']} {category}{ticket_ref}: {item['subject']}")
            else:
                # Multiple items in same category
                ticket_refs = [item['ticket'] for item in items if item['ticket']]
                ticket_str = f" ({', '.join(ticket_refs)})" if ticket_refs else ""
                bullets.append(f"- {items[0]['emoji']} {category}{ticket_str} ({len(items)} commits)")
        
        return "\n".join(bullets)

    def get_jira_ticket_info(self, ticket: str) -> Optional[Dict]:
        """Get Jira ticket information including title"""
        # This would need Jira API integration with proper authentication
        # For now, return None and let user provide it manually
        # TODO: Implement Jira API integration
        return None

    def get_jira_description(self, ticket: str) -> Optional[str]:
        """Get Jira ticket description (placeholder for future implementation)"""
        # This would need Jira API integration
        # For now, return None and let user provide it manually
        return None

    def generate_mr_description(self, jira_ticket: Optional[str] = None) -> str:
        """Generate complete MR description"""
        commits = self.get_commits_since_main()
        current_branch = self.get_current_branch()
        
        # Update header with ticket info
        header = "Closes #X or Relates to [link to backlog]"
        if jira_ticket:
            header = f"Closes {jira_ticket}"
        
        # Generate What's new section
        whats_new = self.generate_whats_new(commits)
        
        # Build the description
        description = f"{header}\n\n## What's new\n{whats_new}\n\n"
        
        # Add the rest of the template
        template_parts = self.template.split("\n\n## What's new\n", 1)
        if len(template_parts) > 1:
            description += template_parts[1]
        
        return description

    def generate_mr_title(self, jira_ticket: Optional[str] = None) -> str:
        """Generate MR title in format RD-[ticket] [title]"""
        if not jira_ticket:
            # Ask for ticket number
            response = input("Enter Jira ticket number (required for title): ").strip()
            if not response:
                print("❌ Jira ticket number is required for MR title")
                sys.exit(1)
            jira_ticket = response
        
        # Try to get ticket info from Jira
        ticket_info = self.get_jira_ticket_info(jira_ticket)
        ticket_title = ""
        
        if ticket_info and 'summary' in ticket_info:
            ticket_title = ticket_info['summary']
        else:
            # Ask user for ticket title
            response = input(f"Enter title for {jira_ticket}: ").strip()
            if not response:
                print("❌ Ticket title is required")
                sys.exit(1)
            ticket_title = response
        
        return f"RD-{jira_ticket} {ticket_title}"

    def confirm_mr_creation(self, title: str, description: str) -> bool:
        """Show MR details and ask for confirmation"""
        print("\n" + "="*60)
        print("📋 MERGE REQUEST PREVIEW")
        print("="*60)
        print(f"Title: {title}")
        print("\nDescription:")
        print("-" * 40)
        print(description)
        print("-" * 40)
        
        while True:
            response = input("\nCreate this MR? (y/n/edit): ").strip().lower()
            if response in ['y', 'yes']:
                return True
            elif response in ['n', 'no']:
                return False
            elif response in ['e', 'edit']:
                print("\nEdit options:")
                print("1. Edit title")
                print("2. Edit description")
                print("3. Continue without editing")
                
                choice = input("Choose option (1-3): ").strip()
                if choice == '1':
                    new_title = input(f"New title [{title}]: ").strip()
                    if new_title:
                        title = new_title
                elif choice == '2':
                    print("Enter new description (Ctrl+D to finish):")
                    lines = []
                    try:
                        while True:
                            line = input()
                            lines.append(line)
                    except EOFError:
                        pass
                    if lines:
                        description = '\n'.join(lines)
                # Continue to show updated preview
                print("\n" + "="*60)
                print("📋 UPDATED MERGE REQUEST PREVIEW")
                print("="*60)
                print(f"Title: {title}")
                print("\nDescription:")
                print("-" * 40)
                print(description)
                print("-" * 40)
            else:
                print("Please enter 'y', 'n', or 'edit'")

    def create_mr_with_glab(self, description: str, title: Optional[str] = None, jira_ticket: Optional[str] = None) -> bool:
        """Create MR using glab CLI with confirmation"""
        try:
            # Generate title if not provided
            if not title:
                title = self.generate_mr_title(jira_ticket)
            
            # Show preview and ask for confirmation
            if not self.confirm_mr_creation(title, description):
                print("❌ MR creation cancelled")
                return False
            
            # Write description to temp file
            temp_file = "/tmp/mr_description.txt"
            with open(temp_file, 'w') as f:
                f.write(description)
            
            # Create MR
            cmd = ["glab", "mr", "create", "--title", title, "--description", f"@{temp_file}"]
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            # Clean up
            os.remove(temp_file)
            
            if result.returncode == 0:
                print("✅ MR created successfully!")
                print(result.stdout)
                return True
            else:
                print(f"❌ Error creating MR: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False


def main():
    parser = argparse.ArgumentParser(description="Generate Merge Request descriptions")
    parser.add_argument("--jira", help="Jira ticket number (e.g., PROJ-123)")
    parser.add_argument("--create", action="store_true", help="Create MR using glab CLI")
    parser.add_argument("--title", help="MR title (used with --create)")
    parser.add_argument("--output", help="Output file (default: stdout)")
    
    args = parser.parse_args()
    
    generator = MRGenerator()
    
    # Ask for Jira ticket if not provided and creating MR
    jira_ticket = args.jira
    if args.create and not jira_ticket:
        response = input("Enter Jira ticket number (required for MR creation): ").strip()
        if not response:
            print("❌ Jira ticket number is required for MR creation")
            sys.exit(1)
        jira_ticket = response
    elif not jira_ticket:
        response = input("Enter Jira ticket number (optional): ").strip()
        jira_ticket = response if response else None
    
    # Generate description
    description = generator.generate_mr_description(jira_ticket)
    
    if args.create:
        # Create MR using glab with confirmation
        success = generator.create_mr_with_glab(description, args.title, jira_ticket)
        sys.exit(0 if success else 1)
    else:
        # Output description
        if args.output:
            with open(args.output, 'w') as f:
                f.write(description)
            print(f"MR description written to {args.output}")
        else:
            print(description)


if __name__ == "__main__":
    main()