// gitlab-mr-fetch - Fetch GitLab MR details, discussions, and approvals
// Usage: gitlab-mr-fetch <mr-iid> [--project=path] [--summary]
// Output: JSON to stdout, errors to stderr with exit code 1

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"
)

const defaultProject = "cnty-ai/continuity"

// MR represents GitLab merge request details
type MR struct {
	IID           int       `json:"iid"`
	Title         string    `json:"title"`
	State         string    `json:"state"`
	Status        string    `json:"status"`
	Author        Author    `json:"author"`
	SourceBranch  string    `json:"source_branch"`
	TargetBranch  string    `json:"target_branch"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	Description   string    `json:"description"`
	ChangesCount  int       `json:"changes_count"`
	Additions     int       `json:"additions"`
	Deletions     int       `json:"deletions"`
	WebURL        string    `json:"web_url"`
}

type Author struct {
	Name     string `json:"name"`
	Username string `json:"username"`
}

// Note represents a comment/note on an MR
type Note struct {
	ID         string    `json:"id"`
	Author     Author    `json:"author"`
	Body       string    `json:"body"`
	CreatedAt  time.Time `json:"created_at"`
	Type       string    `json:"type"` // "DiffNote" or "Note"
	Resolvable bool      `json:"resolvable"`
	Resolved   bool      `json:"resolved"`
	File       string    `json:"file,omitempty"`
	Line       int       `json:"line,omitempty"`
}

// Discussion represents a thread of notes
type Discussion struct {
	ID    string `json:"id"`
	Notes []Note `json:"notes"`
}

// Approvals represents MR approval state
type Approvals struct {
	Required int      `json:"approvals_required"`
	Left     int      `json:"approvals_left"`
	ApprovedBy []Author `json:"approved_by"`
}

// Result is the full output structure
type Result struct {
	MR          MR         `json:"mr"`
	Discussions []Discussion `json:"discussions"`
	Approvals   Approvals  `json:"approvals"`
	Summary     Summary    `json:"summary"`
}

// Summary provides quick stats
type Summary struct {
	TotalComments      int `json:"total_comments"`
	UnresolvedThreads  int `json:"unresolved_threads"`
	DiffComments       int `json:"diff_comments"`
	GeneralComments    int `json:"general_comments"`
}

// ErrorOutput represents a structured error
type ErrorOutput struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}

func main() {
	if len(os.Args) < 2 {
		printError("missing MR IID", "Usage: gitlab-mr-fetch <mr-iid> [--project=path] [--summary]")
		os.Exit(1)
	}

	mrIid, err := strconv.Atoi(os.Args[1])
	if err != nil {
		printError("invalid MR IID", "Expected a number (e.g., 7849)")
		os.Exit(1)
	}

	// Parse flags
	project := defaultProject
	summaryOnly := false
	for _, arg := range os.Args[2:] {
		if strings.HasPrefix(arg, "--project=") {
			project = strings.TrimPrefix(arg, "--project=")
		} else if arg == "--summary" {
			summaryOnly = true
		}
	}

	result, err := fetchMR(project, mrIid)
	if err != nil {
		printError("failed to fetch MR", err.Error())
		os.Exit(1)
	}

	var output interface{} = result
	if summaryOnly {
		output = result.Summary
	}

	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(output); err != nil {
		printError("failed to encode response", err.Error())
		os.Exit(1)
	}
}

func fetchMR(project string, mrIid int) (*Result, error) {
	// Check glab is available
	if _, err := exec.LookPath("glab"); err != nil {
		return nil, fmt.Errorf("glab CLI not found. Install from: https://gitlab.com/gitlab-org/cli")
	}

	encodedProject := encodeProject(project)

	// Fetch in parallel
	mrChan := make(chan *rawMR, 1)
	discChan := make(chan []map[string]interface{}, 1)
	apprChan := make(chan *rawApprovals, 1)
	errChan := make(chan error, 3)

	go func() {
		mr, err := fetchMRDetails(encodedProject, mrIid)
		if err != nil {
			errChan <- err
			return
		}
		mrChan <- mr
	}()

	go func() {
		disc, err := fetchDiscussions(encodedProject, mrIid)
		if err != nil {
			errChan <- err
			return
		}
		discChan <- disc
	}()

	go func() {
		appr, err := fetchApprovals(encodedProject, mrIid)
		if err != nil {
			errChan <- err
			return
		}
		apprChan <- appr
	}()

	// Collect results
	var rawMR *rawMR
	var rawDisc []map[string]interface{}
	var rawAppr *rawApprovals

	for i := 0; i < 3; i++ {
		select {
		case err := <-errChan:
			return nil, err
		case rawMR = <-mrChan:
		case rawDisc = <-discChan:
		case rawAppr = <-apprChan:
		}
	}

	// Transform to structured output
	return transformResult(rawMR, rawDisc, rawAppr), nil
}

func encodeProject(project string) string {
	return strings.ReplaceAll(project, "/", "%2F")
}

// Raw types for JSON unmarshaling
type rawMR struct {
	IID           int                    `json:"iid"`
	Title         string                 `json:"title"`
	State         string                 `json:"state"`
	Author        map[string]interface{} `json:"author"`
	SourceBranch  string                 `json:"source_branch"`
	TargetBranch  string                 `json:"target_branch"`
	CreatedAt     string                 `json:"created_at"`
	UpdatedAt     string                 `json:"updated_at"`
	Description   string                 `json:"description"`
	ChangesCount  string                 `json:"changes_count"`
	Additions     int                    `json:"additions"`
	Deletions     int                    `json:"deletions"`
	MergeStatus   string                 `json:"merge_status"`
	WebURL        string                 `json:"web_url"`
}

type rawApprovals struct {
	ApprovalsRequired int                      `json:"approvals_required"`
	ApprovalsLeft     int                      `json:"approvals_left"`
	ApprovedBy        []map[string]interface{} `json:"approved_by"`
}

func fetchMRDetails(project string, mrIid int) (*rawMR, error) {
	cmd := exec.Command("glab", "api", fmt.Sprintf("projects/%s/merge_requests/%d", project, mrIid))
	output, err := cmd.CombinedOutput()
	if err != nil {
		stderr := string(output)
		if strings.Contains(stderr, "401") {
			return nil, fmt.Errorf("gitlab authentication failed. Run: glab auth login")
		}
		if strings.Contains(stderr, "404") {
			return nil, fmt.Errorf("MR !%d not found or no access", mrIid)
		}
		return nil, fmt.Errorf("gitlab api error: %s", stderr)
	}

	var mr rawMR
	if err := json.Unmarshal(output, &mr); err != nil {
		return nil, fmt.Errorf("failed to parse MR response: %w", err)
	}
	return &mr, nil
}

func fetchDiscussions(project string, mrIid int) ([]map[string]interface{}, error) {
	cmd := exec.Command("glab", "api", fmt.Sprintf("projects/%s/merge_requests/%d/discussions", project, mrIid))
	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch discussions: %s", output)
	}

	var discussions []map[string]interface{}
	if err := json.Unmarshal(output, &discussions); err != nil {
		return nil, fmt.Errorf("failed to parse discussions: %w", err)
	}
	return discussions, nil
}

func fetchApprovals(project string, mrIid int) (*rawApprovals, error) {
	cmd := exec.Command("glab", "api", fmt.Sprintf("projects/%s/merge_requests/%d/approvals", project, mrIid))
	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch approvals: %s", output)
	}

	var appr rawApprovals
	if err := json.Unmarshal(output, &appr); err != nil {
		return nil, fmt.Errorf("failed to parse approvals: %w", err)
	}
	return &appr, nil
}

func transformResult(rawMR *rawMR, rawDisc []map[string]interface{}, rawAppr *rawApprovals) *Result {
	mr := MR{
		IID:          rawMR.IID,
		Title:        rawMR.Title,
		State:        rawMR.State,
		Status:       rawMR.MergeStatus,
		SourceBranch: rawMR.SourceBranch,
		TargetBranch: rawMR.TargetBranch,
		Description:  rawMR.Description,
		Additions:    rawMR.Additions,
		Deletions:    rawMR.Deletions,
		WebURL:       rawMR.WebURL,
		Author: Author{
			Name:     getString(rawMR.Author, "name"),
			Username: getString(rawMR.Author, "username"),
		},
	}

	// Parse counts
	if n, err := strconv.Atoi(rawMR.ChangesCount); err == nil {
		mr.ChangesCount = n
	}

	// Parse times
	mr.CreatedAt, _ = time.Parse(time.RFC3339, rawMR.CreatedAt)
	mr.UpdatedAt, _ = time.Parse(time.RFC3339, rawMR.UpdatedAt)

	// Transform discussions
	discussions := []Discussion{}
	allNotes := []Note{}

	for _, rawDisc := range rawDisc {
		discID, _ := rawDisc["id"].(string)
		rawNotes, _ := rawDisc["notes"].([]interface{})
		
		notes := []Note{}
		for _, rn := range rawNotes {
			rawNote, ok := rn.(map[string]interface{})
			if !ok {
				continue
			}
			
			// Skip system notes
			if system, _ := rawNote["system"].(bool); system {
				continue
			}

			authorMap, _ := rawNote["author"].(map[string]interface{})
			createdAt, _ := rawNote["created_at"].(string)
			noteType, _ := rawNote["type"].(string)
			resolvable, _ := rawNote["resolvable"].(bool)
			resolved, _ := rawNote["resolved"].(bool)
			
			note := Note{
				ID:         getString(rawNote, "id"),
				Body:       getString(rawNote, "body"),
				Type:       noteType,
				Resolvable: resolvable,
				Resolved:   resolved,
				CreatedAt:  parseTime(createdAt),
				Author: Author{
					Name:     getString(authorMap, "name"),
					Username: getString(authorMap, "username"),
				},
			}

			// Extract file/line from position if present
			if pos, ok := rawNote["position"].(map[string]interface{}); ok {
				note.File = getString(pos, "new_path")
				if line, ok := pos["new_line"].(float64); ok {
					note.Line = int(line)
				}
			}

			notes = append(notes, note)
			allNotes = append(allNotes, note)
		}

		if len(notes) > 0 {
			discussions = append(discussions, Discussion{
				ID:    discID,
				Notes: notes,
			})
		}
	}

	// Transform approvals
	approvedBy := []Author{}
	for _, a := range rawAppr.ApprovedBy {
		user, _ := a["user"].(map[string]interface{})
		approvedBy = append(approvedBy, Author{
			Name:     getString(user, "name"),
			Username: getString(user, "username"),
		})
	}
	approvals := Approvals{
		Required:   rawAppr.ApprovalsRequired,
		Left:       rawAppr.ApprovalsLeft,
		ApprovedBy: approvedBy,
	}

	// Calculate summary
	summary := Summary{
		TotalComments:     len(allNotes),
		DiffComments:      0,
		GeneralComments:   0,
		UnresolvedThreads: 0,
	}

	unresolvedMap := make(map[string]bool)
	for _, d := range discussions {
		hasUnresolved := false
		for _, n := range d.Notes {
			if n.Type == "DiffNote" {
				summary.DiffComments++
			} else {
				summary.GeneralComments++
			}
			if n.Resolvable && !n.Resolved {
				hasUnresolved = true
			}
		}
		if hasUnresolved {
			summary.UnresolvedThreads++
		}
		unresolvedMap[d.ID] = hasUnresolved
	}

	return &Result{
		MR:          mr,
		Discussions: discussions,
		Approvals:   approvals,
		Summary:     summary,
	}
}

func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

func parseTime(s string) time.Time {
	t, _ := time.Parse(time.RFC3339, s)
	return t
}

func printError(msg, details string) {
	err := ErrorOutput{
		Error:   msg,
		Details: details,
	}
	encoder := json.NewEncoder(os.Stderr)
	encoder.Encode(err)
}
