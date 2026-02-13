// jira-cli - Fast Jira ticket fetcher for pi agent
// Usage: jira-fetch RD-3891
// Output: JSON to stdout, errors to stderr with exit code 1

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"time"
)

// Ticket represents a Jira issue
type Ticket struct {
	Key         string    `json:"key"`
	Summary     string    `json:"summary"`
	Status      string    `json:"status"`
	Assignee    string    `json:"assignee"`
	Type        string    `json:"type"`
	Priority    string    `json:"priority"`
	Created     time.Time `json:"created"`
	Updated     time.Time `json:"updated"`
	Description string    `json:"description"`
	URL         string    `json:"url"`
}

// ErrorOutput represents a structured error
type ErrorOutput struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}

func main() {
	if len(os.Args) < 2 {
		printError("missing ticket ID", "Usage: jira-fetch <TICKET-ID>")
		os.Exit(1)
	}

	ticketID := normalizeTicketID(os.Args[1])
	if !isValidTicketID(ticketID) {
		printError("invalid ticket ID format", "Expected format: PROJ-123 or rd-3891")
		os.Exit(1)
	}

	ticket, err := fetchTicket(ticketID)
	if err != nil {
		printError("failed to fetch ticket", err.Error())
		os.Exit(1)
	}

	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(ticket); err != nil {
		printError("failed to encode response", err.Error())
		os.Exit(1)
	}
}

func normalizeTicketID(id string) string {
	return strings.ToUpper(strings.TrimSpace(id))
}

func isValidTicketID(id string) bool {
	matched, _ := regexp.MatchString(`^[A-Z][A-Z0-9]*-\d+$`, id)
	return matched
}

func fetchTicket(ticketID string) (*Ticket, error) {
	if _, err := exec.LookPath("jira"); err != nil {
		return nil, fmt.Errorf("jira CLI not found. Install from: https://github.com/ankitpokhrel/jira-cli")
	}

	cmd := exec.Command("jira", "issue", "view", ticketID, "--raw")
	output, err := cmd.CombinedOutput()
	if err != nil {
		stderr := string(output)
		if strings.Contains(stderr, "authentication") || strings.Contains(stderr, "API token") {
			return nil, fmt.Errorf("jira authentication required. Run: jira login")
		}
		if strings.Contains(stderr, "not found") || strings.Contains(stderr, "404") {
			return nil, fmt.Errorf("ticket %s not found or no access", ticketID)
		}
		return nil, fmt.Errorf("jira command failed: %s", stderr)
	}

	return parseTicket(output)
}

func parseTicket(data []byte) (*Ticket, error) {
	var raw map[string]interface{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("failed to parse jira response: %w", err)
	}

	fields, ok := raw["fields"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected jira response format")
	}

	ticket := &Ticket{
		Key: getString(raw, "key"),
		URL: getString(raw, "self"),
	}

	if summary, ok := fields["summary"].(string); ok {
		ticket.Summary = summary
	}

	if descRaw := fields["description"]; descRaw != nil {
		ticket.Description = extractTextFromADF(descRaw)
	}

	if status, ok := fields["status"].(map[string]interface{}); ok {
		ticket.Status = getString(status, "name")
	}

	if issueType, ok := fields["issuetype"].(map[string]interface{}); ok {
		ticket.Type = getString(issueType, "name")
	}

	if priority, ok := fields["priority"].(map[string]interface{}); ok {
		ticket.Priority = getString(priority, "name")
	}

	if assignee, ok := fields["assignee"].(map[string]interface{}); ok {
		ticket.Assignee = getString(assignee, "displayName")
	}
	if ticket.Assignee == "" {
		ticket.Assignee = "Unassigned"
	}

	if created, ok := fields["created"].(string); ok {
		ticket.Created = parseJiraTime(created)
	}

	if updated, ok := fields["updated"].(string); ok {
		ticket.Updated = parseJiraTime(updated)
	}

	return ticket, nil
}

// extractTextFromADF recursively extracts text from Atlassian Document Format
func extractTextFromADF(doc interface{}) string {
	switch v := doc.(type) {
	case map[string]interface{}:
		// Try to get text content (inline text nodes)
		if text, ok := v["text"].(string); ok {
			return text
		}
		
		// Process content array
		nodeType, _ := v["type"].(string)
		content, _ := v["content"].([]interface{})
		
		// Handle document root - join blocks with double newlines
		if nodeType == "doc" {
			return extractBlocks(content, "\n\n")
		}
		
		return renderBlock(v, nodeType, content)
		
	case []interface{}:
		return extractTextFromArray(v, "")
	case string:
		return v
	default:
		return ""
	}
}

// renderBlock renders a single block element
func renderBlock(node map[string]interface{}, nodeType string, content []interface{}) string {
	switch nodeType {
	case "heading":
		if attrs, ok := node["attrs"].(map[string]interface{}); ok {
			if lvl, ok := attrs["level"].(float64); ok {
				prefix := strings.Repeat("#", int(lvl)) + " "
				return prefix + extractTextFromArray(content, "")
			}
		}
		return "## " + extractTextFromArray(content, "")
		
	case "codeBlock":
		lang := ""
		if attrs, ok := node["attrs"].(map[string]interface{}); ok {
			if l, ok := attrs["language"].(string); ok {
				lang = l
			}
		}
		return "```" + lang + "\n" + extractTextFromArray(content, "") + "\n```"
		
	case "bulletList":
		var items []string
		for _, item := range content {
			if itemText := extractItemText(item); itemText != "" {
				items = append(items, "- "+itemText)
			}
		}
		return strings.Join(items, "\n")
		
	case "orderedList":
		var items []string
		for i, item := range content {
			if itemText := extractItemText(item); itemText != "" {
				items = append(items, fmt.Sprintf("%d. %s", i+1, itemText))
			}
		}
		return strings.Join(items, "\n")
		
	case "blockquote":
		text := extractTextFromArray(content, "")
		lines := strings.Split(text, "\n")
		for i, line := range lines {
			if line != "" {
				lines[i] = "> " + line
			}
		}
		return strings.Join(lines, "\n")
		
	case "paragraph":
		return extractTextFromArray(content, "")
		
	case "listItem":
		return extractTextFromArray(content, "")
		
	case "rule":
		return "---"
		
	default:
		return extractTextFromArray(content, "")
	}
}

// extractBlocks extracts multiple blocks with separator
func extractBlocks(content []interface{}, sep string) string {
	var parts []string
	for _, item := range content {
		if block := extractTextFromADF(item); block != "" {
			parts = append(parts, block)
		}
	}
	return strings.Join(parts, sep)
}

// extractItemText extracts text from list items (flattening paragraphs)
func extractItemText(item interface{}) string {
	switch v := item.(type) {
	case map[string]interface{}:
		if content, ok := v["content"].([]interface{}); ok {
			// List items contain paragraphs - extract their inline content
			if nodeType, _ := v["type"].(string); nodeType == "listItem" {
				var parts []string
				for _, child := range content {
					if childMap, ok := child.(map[string]interface{}); ok {
						if childType, _ := childMap["type"].(string); childType == "paragraph" {
							if childContent, ok := childMap["content"].([]interface{}); ok {
								parts = append(parts, extractTextFromArray(childContent, ""))
							}
						} else {
							parts = append(parts, extractTextFromADF(child))
						}
					}
				}
				return strings.Join(parts, " ")
			}
		}
		return extractTextFromADF(v)
	default:
		return extractTextFromADF(v)
	}
}

// extractTextFromArray extracts text from an array of ADF nodes
func extractTextFromArray(arr []interface{}, sep string) string {
	var parts []string
	for _, item := range arr {
		if text := extractTextFromADF(item); text != "" {
			parts = append(parts, text)
		}
	}
	return strings.Join(parts, sep)
}

// parseJiraTime handles Jira's timezone format (+0100 vs +01:00)
func parseJiraTime(s string) time.Time {
	// Try RFC3339 first
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t
	}
	// Try with Z timezone format
	if t, err := time.Parse("2006-01-02T15:04:05.000Z0700", s); err == nil {
		return t
	}
	return time.Time{}
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

func printError(msg, details string) {
	err := ErrorOutput{
		Error:   msg,
		Details: details,
	}
	encoder := json.NewEncoder(os.Stderr)
	encoder.Encode(err)
}
