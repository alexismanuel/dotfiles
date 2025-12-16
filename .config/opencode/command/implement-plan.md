# Implement Plan

You are tasked with implementing an approved technical plan generated from the "Create Implementation Plan" command, typically saved in `./plan.md`. These plans include phased tasks, dependencies, code references, and success metrics
synthesized from PRD and research.

## Invocation

When invoked (e.g., `/implement-plan path/to/plan-file.md [optional: phase-to-start]`), respond with:

I'm ready to implement the plan. I'll read the plan file, referenced PRD/research, and key code files, then track progress via a todo list. We'll proceed phase-by-phase, adapting as needed. If specifying a starting phase (e.g., "Phase 2"), provide it; otherwise, we'll
resume from the first unchecked task.

Parse arguments:
- `plan_file`: Absolute path to the plan Markdown file (must have YAML frontmatter with PRD/research sources).
- `start_phase` (optional): Phase name (e.g., "Core Implementation") to jump to; default to current progress.

When no plan file is provided, try to look for the `./plan.md` file. If one is present, use it.
Validate paths using List tool. If invalid or no frontmatter, prompt: "Please provide a valid plan file path from the Create Implementation Plan output."

## Steps to Follow

1. **Initial Setup and Full Reads**:
   - Use Read tool (no offset/limit) to read the plan file in full.
   - Parallel reads: PRD and research files from plan frontmatter; all code references (e.g., `file.py:123`) listed in the plan.
   - Extract: Phases, tasks (with priorities/efforts), dependencies, risks, success metrics, open questions. Note any existing checkmarks (- [x]) for resumption.
   - Use Bash for metadata: Current git commit (`git rev-parse HEAD`), branch (`git branch --show-current`).
   - If start_phase provided, validate it exists; else, find first unchecked task.
   - **CRITICAL**: Do all reads in main context first for complete understanding.

2. **Analyze and Todo Creation**:
   - Ultrathink: Map plan tasks to codebase reality—cross-reference research/code refs (e.g., adapt "Update auth module" using auth.ts:45 patterns).
   - Identify mismatches: If code has evolved (e.g., refactored since plan), note gaps (e.g., "File moved from auth.ts to services/auth.js").
   - Create internal todo list with todowrite: Mirror plan phases as items (e.g., "Phase 1: Setup—complete all high-priority tasks"). Set status: pending for unchecked, in_progress for current, completed for checked. One in_progress at a time.
   - Prioritize: Follow plan's high/medium/low; consider dependencies/risks. Break tasks if needed (e.g., "Implement login UI" → sub-tasks for component, state, styles).
   - Security/Conventions: Scan for best practices (e.g., no secrets; mimic existing patterns from reads). If gaps, ask 1-2 clarifying questions (e.g., "How to handle [risk]? Options: a) Skip, b) Mitigate with [approach]").

3. **Refine with Sub-Agents (If Needed)**:
   - Spawn 1-2 parallel Task agents only for mismatches/gaps:
     - `codebase-analyzer`: For adaptations (prompt: "Analyze how to implement [task] adapting to current codebase changes since [plan date]. Use patterns from [code refs]. Return updated code examples and file paths.").
     - `codebase-locator`: For missing refs (prompt: "Locate current files for [plan component], e.g., updated auth module.").
   - Wait for results; incorporate into todos (e.g., update task with new paths/examples). Limit to essential—prefer direct tools (Grep/Read) for simple locates.

4. **Phased Implementation**:
   - Proceed phase-by-phase (or from start_phase): Mark todo in_progress, implement using Edit/Bash tools (e.g., edit files per task, run builds).
     - Follow plan intent: Actionable steps with code refs (e.g., "Add toggle in settings.ts:200 using dark-mode pattern from research").
     - Adapt proactively: If mismatch, STOP, report clearly:
       ```
       Mismatch in [Task/Phase]:
       Plan: [expected, e.g., "Use existing Auth hook"]
       Found: [actual, e.g., "Hook refactored to useContext"]
       Impact: [why it matters, e.g., "Breaks dependency on legacy component"]
       Proposal: [suggestion, e.g., "Update to new hook; est. +1h"]
       Proceed? (y/n/adjust)
       ```
     - After each task/phase: Verify with plan success criteria (e.g., run `npm test`, `npm run lint` via Bash). Fix issues immediately.
   - Update plan: After phase completion, use Edit to add checkmarks (- [x]), append progress notes under ## Implementation Log [ISO timestamp]: "Completed [tasks]; adaptations: [summary]. Verification: [test results]."

5. **Verification and Completion**:
   - Batch verifications: After full phase, run all checks (e.g., tests, lint, typecheck—discover via package.json or plan).
   - If failures: Debug (e.g., use Grep for errors), fix, re-verify. Report: "Fixed [issue] in [file]; tests now pass."
   - On full completion: Update plan frontmatter (via Edit): status: implemented; last_updated: [ISO]; last_updated_by: opencode; implementation_notes: [brief summary].
   - Confirm with user: "Phase [N] complete. Summary: [3-5 bullets on changes, refs]. Next phase? Or adjustments?"

## Handle Follow-Ups and Resumption

- If plan has checkmarks: Resume from first unchecked; verify prior phases only if inconsistencies found (e.g., run tests).
- User interruptions: Update todos/plan on pause; on resume, re-read updated files.
- Mismatches/Stuck: Always report and seek input before deviating >10% from plan.
- Post-Implementation: Suggest next: "Plan implemented. Create PR? Run full suite?"

## Important Notes

- Parallelism: Initial reads and sub-agents in parallel; implementations sequential per phase.
- Changes: Only edit code/files explicitly tasked; no unrelated mods. Mimic codebase conventions from research/reads.
- Tools: todowrite for tracking; Bash for git/verification (e.g., no pushes/commits unless asked). Read-Only for non-implementation steps.
- Junior-Dev Focus: Tasks granular with refs; explain adaptations briefly in logs.
- Edge Cases: No plan progress? Start from Phase 1. Evolved codebase? Use agents to bridge. No git? Skip metadata.
- Philosophy: Forward momentum—implement intent, adapt intelligently, verify rigorously. Communicate mismatches early.
