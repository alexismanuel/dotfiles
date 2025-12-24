#!/bin/bash

# MR Activity Tracker for OpenCode
# Fetches and displays comments on merge requests

# Simple working version that shows diff comments with file/line context
list_mr_comments_with_context() {
    local mr_iid="$1"
    local limit="${2:-10}"

    if [[ -z "$mr_iid" ]]; then
        echo "Usage: list_mr_comments_with_context <mr_iid> [limit]"
        return 1
    fi

    echo "📝 Comments for MR #$mr_iid (with file/line context):"
    echo "=================================================="

    # First try discussions API, then fall back to notes API for diff comments
    local comments
    comments=$(glab api "projects/cnty-ai%2Fcontinuity/merge_requests/$mr_iid/discussions" 2>/dev/null | \
               jq -r '.[] | .notes[] | select(.system == false)' 2>/dev/null)

    # If no non-system comments in discussions, try notes API
    if [[ -z "$comments" ]]; then
        comments=$(glab api "projects/cnty-ai%2Fcontinuity/merge_requests/$mr_iid/notes" 2>/dev/null | \
                  jq -r '.[] | select(.system == false)' 2>/dev/null)
    fi

    # Process comments with jq
    echo "$comments" | \
    jq -r --arg limit "$limit" '
    {
        author: .author.name,
        username: .author.username,
        created_at: .created_at[:10],
        body: .body,
        type: (.type // "General"),
        file_path: (.position.new_path // .position.old_path // null),
        new_line: (.position.new_line // null),
        old_line: (.position.old_line // null)
    } |
    [
        if .type == "DiffNote" then
            "🔍 DIFF COMMENT\n👤 \(.author) (@\(.username)) - \(.created_at)\n📁 File: \(.file_path // "unknown")\n📍 Line: " +
            (if .new_line and .old_line then "\(.old_line)→\(.new_line)"
             elif .new_line then "+\(.new_line)"
             elif .old_line then "-\(.old_line)"
             else "unknown" end)
        else
            "💬 GENERAL COMMENT\n👤 \(.author) (@\(.username)) - \(.created_at)"
        end,
        "",
        (.body | if length > 300 then .[:300] + "..." else . end),
        "──────────────────────────────────────────────────"
    ] |
    join("\n")
    ' | \
    head -n "$((limit * 10))"
}

# List current MRs for the current branch
list_current_mr() {
    local current_branch=$(git branch --show-current 2>/dev/null)
    if [[ -z "$current_branch" ]]; then
        echo "❌ Not in a git repository"
        return 1
    fi

    echo "🔍 Looking for MRs on branch: $current_branch"
    echo "=========================================="
    
    # Get MRs for current branch
    local mrs
    mrs=$(glab mr list --source-branch "$current_branch" --json 2>/dev/null)
    
    if [[ -z "$mrs" ]]; then
        echo "❌ No MRs found for branch '$current_branch'"
        return 1
    fi
    
    echo "$mrs" | jq -r '.[] | "MR #\(.iid): \(.title) (State: \(.state))"'
}

# Watch MR for new comments
watch_mr() {
    local mr_iid="$1"
    local interval="${2:-60}"  # Default check every 60 seconds
    
    if [[ -z "$mr_iid" ]]; then
        echo "Usage: watch_mr <mr_iid> [interval_seconds]"
        return 1
    fi

    echo "👀 Watching MR #$mr_iid for new comments (checking every ${interval}s)..."
    echo "Press Ctrl+C to stop"
    echo ""

    # Store initial comment count
    local initial_count
    initial_count=$(glab api "projects/cnty-ai%2Fcontinuity/merge_requests/$mr_iid/discussions" 2>/dev/null | \
                    jq '[.[] | .notes[] | select(.system == false)] | length' 2>/dev/null)

    if [[ -z "$initial_count" ]]; then
        initial_count=0
    fi

    echo "📊 Initial comment count: $initial_count"
    echo ""

    while true; do
        sleep "$interval"
        
        local current_count
        current_count=$(glab api "projects/cnty-ai%2Fcontinuity/merge_requests/$mr_iid/discussions" 2>/dev/null | \
                       jq '[.[] | .notes[] | select(.system == false)] | length' 2>/dev/null)

        if [[ -z "$current_count" ]]; then
            current_count=0
        fi

        if [[ "$current_count" -gt "$initial_count" ]]; then
            echo "🆕 New comments detected! ($(date))"
            echo "================================"
            
            # Show only new comments (last N comments)
            local new_comments_count=$((current_count - initial_count))
            list_mr_comments_with_context "$mr_iid" "$new_comments_count"
            
            echo ""
            initial_count="$current_count"
        fi
    done
}

# Show MR status and summary
show_mr_status() {
    local mr_iid="$1"
    
    if [[ -z "$mr_iid" ]]; then
        echo "Usage: show_mr_status <mr_iid>"
        return 1
    fi

    echo "📊 MR #$mr_iid Status"
    echo "=================="
    
    # Get MR details
    local mr_details
    mr_details=$(glab api "projects/cnty-ai%2Fcontinuity/merge_requests/$mr_iid" 2>/dev/null)
    
    if [[ -z "$mr_details" ]]; then
        echo "❌ MR #$mr_iid not found"
        return 1
    fi
    
    echo "$mr_details" | jq -r '
    "Title: " + .title,
    "State: " + .state,
    "Author: " + .author.name,
    "Source Branch: " + .source_branch,
    "Target Branch: " + .target_branch,
    "Created: " + .created_at,
    "Updated: " + .updated_at,
    "👍 Approvals: " + (.approvals_before_merge | tostring),
    "🔁 Merge Status: " + .merge_status,
    "📝 Changes: " + (.changes_count | tostring) + " files, +" + (.additions | tostring) + " -" + (.deletions | tostring)
    '
    
    echo ""
    echo "📝 Recent Comments:"
    list_mr_comments_with_context "$mr_iid" 5
}

# Main menu
show_help() {
    echo "MR Activity Tracker"
    echo "=================="
    echo ""
    echo "Usage: $0 <command> [args]"
    echo ""
    echo "Commands:"
    echo "  comments <mr_iid> [limit]    Show comments for MR"
    echo "  current                       Show MRs for current branch"
    echo "  watch <mr_iid> [interval]     Watch MR for new comments"
    echo "  status <mr_iid>               Show MR status and summary"
    echo "  help                          Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 comments 123"
    echo "  $0 current"
    echo "  $0 watch 123 30"
    echo "  $0 status 123"
}

# Main script logic
case "${1:-help}" in
    "comments")
        list_mr_comments_with_context "$2" "$3"
        ;;
    "current")
        list_current_mr
        ;;
    "watch")
        watch_mr "$2" "$3"
        ;;
    "status")
        show_mr_status "$2"
        ;;
    "help"|*)
        show_help
        ;;
esac