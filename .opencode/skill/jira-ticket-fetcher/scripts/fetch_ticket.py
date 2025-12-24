#!/usr/bin/env python3
"""
Jira Ticket Fetcher Script

This script provides functions to fetch Jira tickets using the Jira CLI.
It supports fetching by ticket ID or searching by title/description.
"""

import subprocess
import json
import sys
import re
from typing import Dict, List, Optional, Any


def run_jira_command(command: List[str]) -> Dict[str, Any]:
    """
    Execute a Jira CLI command and return the result.
    
    Args:
        command: List of command arguments
        
    Returns:
        Dictionary containing success status, data, and error message
    """
    try:
        result = subprocess.run(
            ['jira'] + command,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            return {
                'success': True,
                'data': result.stdout,
                'error': None
            }
        else:
            error_msg = result.stderr
            # Check for authentication errors
            if 'API token' in error_msg or 'authentication' in error_msg.lower():
                error_msg = """
🔐 JIRA AUTHENTICATION REQUIRED

The Jira CLI needs to be authenticated before use. Please follow these steps:

1. Generate an API token:
   - For cloud: https://id.atlassian.com/manage-profile/security/api-tokens
   - For local server: Use your Jira password or PAT from your profile

2. Set up authentication (choose one method):
   - Export as environment variable: export JIRA_API_TOKEN=your_token
   - Or use .netrc file with machine details
   - Or run: jira init

3. Test authentication: jira me

For detailed setup: https://github.com/ankitpokhrel/jira-cli#getting-started
"""
            return {
                'success': False,
                'data': None,
                'error': error_msg
            }
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'data': None,
            'error': 'Command timed out after 30 seconds'
        }
    except Exception as e:
        return {
            'success': False,
            'data': None,
            'error': str(e)
        }


def get_ticket_by_id(ticket_id: str) -> Dict[str, Any]:
    """
    Fetch a specific ticket by its ID.
    
    Args:
        ticket_id: The Jira ticket ID (e.g., "RD-3891")
        
    Returns:
        Dictionary containing the ticket data or error
    """
    # Normalize ticket ID format
    ticket_id = ticket_id.upper().strip()
    
    # Use view command to get ticket details
    result = run_jira_command(['issue', 'view', ticket_id, '--raw'])
    
    if result['success']:
        try:
            ticket_data = json.loads(result['data'])
            return {
                'success': True,
                'ticket': ticket_data,
                'error': None
            }
        except json.JSONDecodeError:
            return {
                'success': False,
                'ticket': None,
                'error': 'Failed to parse Jira response'
            }
    else:
        return {
            'success': False,
            'ticket': None,
            'error': result['error']
        }


def search_tickets_by_text(search_text: str, scope: str = 'current') -> Dict[str, Any]:
    """
    Search for tickets by text content.
    
    Args:
        search_text: Text to search for in tickets
        scope: Search scope - 'current' (sprint) or 'all'
        
    Returns:
        Dictionary containing search results or error
    """
    if scope == 'current':
        # Search in current sprint
        result = run_jira_command(['sprint', 'list', '--current', '--plain', '--raw', search_text])
    else:
        # Search across all projects
        result = run_jira_command(['issue', 'list', '--plain', '--raw', '-q', f'text ~ "{search_text}"'])
    
    if result['success']:
        try:
            if scope == 'current':
                # Parse sprint results
                lines = result['data'].strip().split('\n')
                tickets = []
                for line in lines[1:]:  # Skip header
                    if line.strip():
                        parts = line.split('\t')
                        if len(parts) >= 3:
                            tickets.append({
                                'key': parts[0],
                                'summary': parts[1],
                                'status': parts[2],
                                'type': parts[3] if len(parts) > 3 else 'Unknown'
                            })
            else:
                # Parse issue list results (JSON format)
                tickets = json.loads(result['data'])
            
            return {
                'success': True,
                'tickets': tickets,
                'error': None
            }
        except (json.JSONDecodeError, IndexError):
            return {
                'success': False,
                'tickets': [],
                'error': 'Failed to parse search results'
            }
    else:
        return {
            'success': False,
            'tickets': [],
            'error': result['error']
        }


def get_current_sprint_tickets() -> Dict[str, Any]:
    """
    Get all tickets in the current sprint.
    
    Returns:
        Dictionary containing current sprint tickets or error
    """
    result = run_jira_command(['sprint', 'list', '--current', '--plain', '--raw'])
    
    if result['success']:
        try:
            lines = result['data'].strip().split('\n')
            tickets = []
            for line in lines[1:]:  # Skip header
                if line.strip():
                    parts = line.split('\t')
                    if len(parts) >= 3:
                        tickets.append({
                            'key': parts[0],
                            'summary': parts[1],
                            'status': parts[2],
                            'type': parts[3] if len(parts) > 3 else 'Unknown'
                        })
            
            return {
                'success': True,
                'tickets': tickets,
                'error': None
            }
        except IndexError:
            return {
                'success': False,
                'tickets': [],
                'error': 'Failed to parse sprint results'
            }
    else:
        return {
            'success': False,
            'tickets': [],
            'error': result['error']
        }


def is_ticket_id(input_text: str) -> bool:
    """
    Check if the input text looks like a ticket ID.
    
    Args:
        input_text: Input text to check
        
    Returns:
        True if it looks like a ticket ID, False otherwise
    """
    # Pattern: PROJECT-NUMBER (e.g., RD-3891, PROJ-123)
    pattern = r'^[A-Z][A-Z0-9]*-\d+$'
    return bool(re.match(pattern, input_text.upper().strip()))


def main():
    """Main function for command line usage."""
    if len(sys.argv) < 2:
        print("Usage: python fetch_ticket.py <ticket_id_or_search_text> [--scope=current|all]")
        sys.exit(1)
    
    input_text = sys.argv[1]
    scope = 'current'
    
    if len(sys.argv) > 2:
        scope = sys.argv[2]
    
    if is_ticket_id(input_text):
        print(f"Fetching ticket by ID: {input_text}")
        result = get_ticket_by_id(input_text)
        
        if result['success']:
            ticket = result['ticket']
            print(f"\n📋 Ticket: {ticket.get('key', 'N/A')}")
            print(f"📝 Summary: {ticket.get('fields', {}).get('summary', 'N/A')}")
            print(f"📊 Status: {ticket.get('fields', {}).get('status', {}).get('name', 'N/A')}")
            print(f"👤 Assignee: {ticket.get('fields', {}).get('assignee', {}).get('displayName', 'Unassigned')}")
            print(f"🏷️  Type: {ticket.get('fields', {}).get('issuetype', {}).get('name', 'N/A')}")
            print(f"📅 Created: {ticket.get('fields', {}).get('created', 'N/A')}")
            print(f"🔄 Updated: {ticket.get('fields', {}).get('updated', 'N/A')}")
            
            description = ticket.get('fields', {}).get('description', 'No description')
            if description and description != 'No description':
                print(f"\n📄 Description:\n{description}")
        else:
            print(f"❌ Error: {result['error']}")
    else:
        print(f"Searching for tickets with text: {input_text} (scope: {scope})")
        result = search_tickets_by_text(input_text, scope)
        
        if result['success']:
            tickets = result['tickets']
            if tickets:
                print(f"\n🔍 Found {len(tickets)} tickets:")
                for ticket in tickets:
                    print(f"  • {ticket.get('key', 'N/A')}: {ticket.get('summary', 'N/A')} [{ticket.get('status', 'N/A')}]")
            else:
                print("📭 No tickets found matching the search criteria.")
        else:
            print(f"❌ Error: {result['error']}")


if __name__ == '__main__':
    main()