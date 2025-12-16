
---
description: Generate a detailed implementation plan from an existing PRD and codebase research.
-
---

# Create Implementation Plan

You are tasked with generating a detailed implementation plan from an existing Product Requirements Document (PRD) and codebase research document. The plan synthesizes the "what" from the PRD with the "how" from research, creating actionable tasks, phases, and
dependencies for development.

## Initial Setup

When this command is invoked (e.g., `/create-plan path/to/prd-file.md path/to/research-file.md [optional: feature-name]`), respond with:

I'm ready to create an implementation plan. I'll read the provided PRD and research files, then synthesize them into actionable steps. If you have a specific feature name, provide it; otherwise, I'll infer from the PRD.


Parse arguments:
- `prd_file`: Absolute path to the PRD Markdown file.
- `research_file`: Absolute path to the research Markdown file.
- `feature_name` (optional): Slug for output filename (e.g., "user-auth"); default to sanitized PRD title.

Validate paths exist using List tool. If invalid, prompt user: "Please provide valid absolute paths to the PRD and research files."

If no arguments are parsed, try to look for `./research.md` file and `./plan.md` file.

## Steps to Follow

1. **Read Input Files Fully**:
   - Use Read tool (no offset/limit) to read PRD and research files in parallel.
   - Extract key elements:
     - From PRD: Goals, User Stories, Functional Requirements, Non-Goals, Success Metrics, Open Questions.
     - From Research: Summary, Detailed Findings, Code References (file paths/lines), Architecture Insights, Historical Context.
   - **CRITICAL**: Do this in main context before any sub-tasks to ensure full understanding.

2. **Analyze and Decompose**:
   - Ultrathink: Map PRD requirements to research findings (e.g., "User login flow" → relevant auth components from research).
   - Identify gaps: If PRD questions remain open or research lacks details, ask 1-3 targeted clarifying questions (e.g., "What priority for [requirement]? Options: a) High, b) Medium, c) Low").
   - Create internal todo list with todowrite for plan components (e.g., tasks, dependencies). Break into phases: Planning, Implementation, Testing, Deployment.
   - Consider: Existing patterns from research, security best practices, integration points.

3. **Refine with Sub-Agents (If Needed)**:
   - Spawn parallel Task agents only for gaps (e.g., feasibility checks):
     - Use `codebase-analyzer` for deep dives on unresolved PRD requirements (prompt: "Analyze how to implement [specific req] using existing codebase patterns from [research summary]. Return code examples and file paths.").
     - Use `codebase-locator` to find additional files if research is outdated (prompt: "Locate files related to [PRD component] not covered in [research file].").
   - Limit to 2-3 agents; wait for all to complete before proceeding.
   - Incorporate results into decomposition (update todo).

4. **Synthesize the Plan**:
   - Compile: Connect PRD goals to research-backed tasks. Prioritize based on dependencies and risks.
   - Generate metadata:
     - date: Current ISO datetime.
     - planner: "opencode".
     - git_commit: Current hash (via Bash: `git rev-parse HEAD`).
     - branch: Current branch (via Bash: `git branch --show-current`).
     - repository: Repo name (infer from git remote or env).
     - feature: feature_name or inferred.
     - tags: [plan, feature-name, relevant-tags-from-prd/research].
     - status: complete.
     - last_updated: YYYY-MM-DD.
     - last_updated_by: "opencode".
   - Structure the document with YAML frontmatter + content (saved as `plan.md` via Edit tool, but only after user confirmation).

5. **Generate Plan Document**:
   ```markdown
   ---
   date: [ISO datetime]
   planner: opencode
   git_commit: [hash]
   branch: [name]
   repository: [name]
   feature: "[feature_name]"
   tags: [plan, ...]
   status: complete
   last_updated: [YYYY-MM-DD]
   last_updated_by: opencode
   prd_source: [prd_file path]
   research_source: [research_file path]
   ---

   # Implementation Plan: [Feature Name]

   **Date**: [ISO datetime]
   **Planner**: opencode
   **Git Commit**: [hash]
   **Branch**: [name]
   **Repository**: [name]
   **PRD Source**: [prd_file]
   **Research Source**: [research_file]

   ## Overview
   [Brief synthesis: Problem from PRD + key research insights. State high-level phases.]

   ## Goals (from PRD)
   [List measurable objectives from PRD.]

   ## Phased Task Breakdown
   Use todo-style items with priorities (high/medium/low) and estimated effort.

   ### Phase 1: Setup/Planning
   - Task 1: [Actionable step, e.g., "Update existing auth module based on research findings in auth.ts:45"] (priority: high, est: 2h)
   - [Reference code: file.py:line from research]

   ### Phase 2: Core Implementation
   - [Map to PRD Functional Requirements, backed by research e.g., "Implement user story X using pattern from research Area 1"]

   ### Phase 3: Testing & Integration
   - [Tasks for verification, e.g., "Add tests per success metrics; run npm test"]

   ### Phase 4: Deployment/Polish
   - [Edge cases, non-goals handling]

   ## Dependencies & Risks
   - Dependencies: [e.g., "Requires Auth module from research Component 1"]
   - Risks: [From research insights + PRD non-goals, e.g., "Potential perf issue in large datasets; mitigate with memoization"]

   ## Code References (from Research)
   - `path/to/file.py:123` - [Brief desc + relevance to plan]
   - [List 5-10 key ones]

   ## Architecture & Patterns
   [Synthesize insights: How plan fits existing codebase, e.g., "Follow MVC pattern from research."]

   ## Success Metrics (from PRD)
   [Restate + verification steps, e.g., "Run tests; measure engagement."]

   ## Open Questions
   [Any gaps; suggest follow-ups.]

6. Save and Present:
 • Confirm with user: "Here's the proposed plan summary: [concise 3-5 bullet overview]. Shall I generate the full plan.md?"
 • If yes, use Edit tool to write the file.
 • Output: Present summary with key tasks and code refs. Ask: "Any follow-ups or adjustments?"


## Handle Follow-Ups

• Append to plan.md: Add ## Follow-up [timestamp] section.
• Update frontmatter: last_updated, last_updated_by, add last_updated_note: "Addressed [description]".
• Re-run steps 3-4 for new info; spawn sub-agents as needed.

## Important Notes

• Parallelism: Read files and sub-agents in parallel for efficiency.
• Read-Only: No code changes; focus on planning.
• Conventions: Mimic codebase style from research. Follow security (no secrets).
• Junior-Dev Focus: Tasks explicit, with file refs for navigation.
• Edge Cases: If no feature_name, infer from PRD title (e.g., slugify "User Login" → "user-login").
• Tools: Use todowrite for internal tracking; Bash for git metadata.

