---
description: Create a detailed Product Requirements Document (PRD) based on an initial user prompt
agent: product-manager
---
# Rule: Generating a Product Requirements Document (PRD)

## Goal

You are tasked to create a detailed Product Requirements Document (PRD) in Markdown format, based on an initial user prompt. The PRD should be clear, actionable, and suitable for a junior developer to understand and implement the feature.

**Related skill:** This command incorporates principles from the `brainstorming` skill. For pure design exploration without PRD output, use that skill directly.

## Process

1.  **Check Project Context First:** Before asking questions, review relevant files, docs, and recent commits to understand the current state.

2.  **Receive Initial Prompt:** The user provides a brief description or request for a new feature or functionality.

3.  **Ask Clarifying Questions (ONE AT A TIME):**
    - Ask questions **one at a time** - do not overwhelm with multiple questions
    - **Prefer multiple choice** when possible (easier to answer)
    - Open-ended questions are fine when choices aren't clear
    - Goal: understand the "what" and "why", not the "how"
    - Make sure to provide options in letter/number lists so the user can respond easily

4.  **Explore Approaches (2-3 options):**
    - Before finalizing requirements, propose 2-3 different approaches
    - Present with trade-offs and your recommendation
    - Get explicit agreement on approach before writing final PRD

5.  **Present PRD Incrementally:**
    - Present the PRD in sections (200-300 words each)
    - Check after each major section: "Does this look right so far?"
    - Be ready to revise based on feedback

6.  **Save PRD:** Save the finalized document as `prd.md`. 

## Clarifying Questions (Examples)

Adapt questions based on the prompt. **Ask ONE question at a time.** Common areas to explore:

*   **Problem/Goal:** "What problem does this feature solve? a) Users can't do X, b) System is slow at Y, c) Something else?"
*   **Target User:** "Who is the primary user? a) End users, b) Admins, c) Both, d) Other?"
*   **Core Functionality:** "What's the key action a user should perform?"
*   **User Stories:** "Can you describe a typical usage scenario?"
*   **Acceptance Criteria:** "How will we know it's done? What's the minimum viable version?"
*   **Scope/Boundaries:** "What should this feature NOT do? (non-goals)"
*   **Data Requirements:** "What data does this feature need?"
*   **Design/UI:** "Any existing mockups or UI patterns to follow?"
*   **Edge Cases:** "Any error conditions to consider?"

**Question discipline:**
- One question per message
- If a topic needs more exploration, break into multiple questions
- Prefer multiple choice (a/b/c) when possible
- Open-ended when choices aren't clear

## PRD Structure

The generated PRD should include the following sections:

1.  **Introduction/Overview:** Briefly describe the feature and the problem it solves. State the goal.
2.  **Goals:** List the specific, measurable objectives for this feature.
3.  **User Stories:** Detail the user narratives describing feature usage and benefits.
4.  **Functional Requirements:** List the specific functionalities the feature must have. Use clear, concise language (e.g., "The system must allow users to upload a profile picture."). Number these requirements.
5.  **Non-Goals (Out of Scope):** Clearly state what this feature will *not* include to manage scope.
6.  **Design Considerations (Optional):** Link to mockups, describe UI/UX requirements, or mention relevant components/styles if applicable.
7.  **Technical Considerations (Optional):** Mention any known technical constraints, dependencies, or suggestions (e.g., "Should integrate with the existing Auth module").
8.  **Success Metrics:** How will the success of this feature be measured? (e.g., "Increase user engagement by 10%", "Reduce support tickets related to X").
9.  **Open Questions:** List any remaining questions or areas needing further clarification.

## Target Audience

Assume the primary reader of the PRD is a **junior developer**. Therefore, requirements should be explicit, unambiguous, and avoid jargon where possible. Provide enough detail for them to understand the feature's purpose and core logic.

## Output

*   **Format:** Markdown (`.md`)
*   **Filename:** `prd.md`

## Key Principles

| Principle | Description |
|-----------|-------------|
| **One question at a time** | Don't overwhelm with multiple questions |
| **Multiple choice preferred** | Easier to answer than open-ended |
| **YAGNI ruthlessly** | Remove unnecessary features from requirements |
| **Explore alternatives** | Propose 2-3 approaches before settling |
| **Incremental validation** | Present PRD in sections, validate each |

## Final Instructions

1. Do NOT start implementing the PRD
2. Check project context BEFORE asking questions
3. Ask clarifying questions ONE AT A TIME
4. Propose 2-3 approaches with trade-offs before finalizing
5. Present PRD incrementally, checking after each section
6. Take user feedback and improve the PRD

## Next Steps

After PRD is complete, suggest:
- `/research-codebase` - to understand implementation context
- `/create-plan` - to create detailed implementation tasks
