/**
 * Slate — Your writing companion for Obsidian vaults
 *
 * Replaces obsidian-vault and obsidian-daily-note skills with an integrated
 * extension experience.
 */

import type { ExtensionAPI, ExtensionContext, Theme } from "@mariozechner/pi-coding-agent";
import { complete } from "@mariozechner/pi-ai";
import { Type } from "@sinclair/typebox";
import { matchesKey, Container, Text, truncateToWidth } from "@mariozechner/pi-tui";
import * as fs from "node:fs/promises";
import * as path from "node:path";

// ═════════════════════════════════════════════════════════════════════════════
// Configuration
// ═════════════════════════════════════════════════════════════════════════════

const VAULT_PATH = "/Users/alexismanuel/workspace/obsidian_notes/notes";

// ═════════════════════════════════════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════════════════════════════════════

interface DailyNoteSections {
  previousEpisode?: string;
  todo?: string;
  workLog?: string;  // Tasks completed today (replaces tasksWork)
  learnings?: string;
  nextEpisode?: string;
  linksBack?: string;
  ideasForNotes?: string;
}

// ═════════════════════════════════════════════════════════════════════════════
// Date Utilities
// ═════════════════════════════════════════════════════════════════════════════

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// ═════════════════════════════════════════════════════════════════════════════
// Vault Operations
// ═════════════════════════════════════════════════════════════════════════════

async function vaultPathExists(subpath: string): Promise<boolean> {
  try {
    await fs.access(path.join(VAULT_PATH, subpath));
    return true;
  } catch {
    return false;
  }
}

async function readVaultFile(subpath: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(VAULT_PATH, subpath), "utf-8");
  } catch {
    return null;
  }
}

async function writeVaultFile(subpath: string, content: string): Promise<void> {
  const fullPath = path.join(VAULT_PATH, subpath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, "utf-8");
}

// ═════════════════════════════════════════════════════════════════════════════
// Daily Note Parsing
// ═════════════════════════════════════════════════════════════════════════════

function parseDailyNote(content: string): DailyNoteSections {
  const sections: DailyNoteSections = {};

  // Match both ## Section and # Section (legacy format support)
  const sectionRegex = /^#{1,2}\s+(.+)$/gm;
  const matches = [...content.matchAll(sectionRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const sectionName = match[1];
    const startIndex = match.index! + match[0].length;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
    const sectionContent = content.slice(startIndex, endIndex).trim();

    // Normalize: lowercase, remove all spaces for matching
    const key = sectionName.toLowerCase().replace(/\s+/g, "");

    // Handle special cases for mapping
    const normalizedKey = key === "taskswork" ? "workLog" :
                          key === "worklog" ? "workLog" :
                          key === "ideasfornotes" ? "ideasForNotes" :
                          key === "linksback" ? "linksBack" :
                          key === "previousepisode" ? "previousEpisode" :
                          key === "nextepisode" ? "nextEpisode" :
                          key === "todo" ? "todo" :
                          key === "learnings" ? "learnings" :
                          key;

    // @ts-ignore - dynamic key assignment is fine here
    sections[normalizedKey] = sectionContent;
  }

  return sections;
}

function extractNextEpisodeTasks(content: string): string[] {
  const lines = content.split("\n");
  let inNextEpisode = false;
  const tasks: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## Next episode")) {
      inNextEpisode = true;
      continue;
    }
    if (inNextEpisode) {
      if (line.startsWith("## ")) break;
      if (line.trim().startsWith("- ")) {
        tasks.push(line.trim().replace(/^- /, ""));
      }
    }
  }

  return tasks;
}

// ═════════════════════════════════════════════════════════════════════════════
// Session Summarization
// ═════════════════════════════════════════════════════════════════════════════

type SessionEntry = {
  type: string;
  message?: {
    role?: string;
    content?: unknown;
  };
};

function buildSessionText(entries: SessionEntry[]): string {
  const sections: string[] = [];

  for (const entry of entries) {
    if (entry.type !== "message" || !entry.message?.role) {
      continue;
    }

    const role = entry.message.role;
    if (role !== "user" && role !== "assistant") {
      continue;
    }

    const textParts: string[] = [];
    const content = entry.message.content;

    if (typeof content === "string") {
      textParts.push(content);
    } else if (Array.isArray(content)) {
      for (const part of content) {
        if (part && typeof part === "object" && part.type === "text" && typeof part.text === "string") {
          textParts.push(part.text);
        }
      }
    }

    const messageText = textParts.join("\n").trim();
    if (messageText.length > 0) {
      const label = role === "user" ? "User" : "Assistant";
      sections.push(`${label}: ${messageText}`);
    }
  }

  return sections.join("\n\n");
}

async function generateSessionSummary(sessionText: string, ctx: ExtensionContext): Promise<string | null> {
  // Use the model currently selected in the session
  const model = ctx.model;
  if (!model) {
    ctx.ui.notify("No model selected in current session", "warning");
    return null;
  }

  const apiKey = await ctx.modelRegistry.getApiKey(model);
  if (!apiKey) {
    ctx.ui.notify(`No API key for ${model.provider}/${model.id}`, "warning");
    return null;
  }

  const prompt = `Summarize this coding session into a work log entry. Focus on:
- What was accomplished
- Key decisions made
- Technical changes (files edited, refactors)
- Tickets or tasks explicitly mentioned by the user

Format as:
- [x] High-level session theme or main task
  - Specific accomplishment or change
  - Another detail or finding
  - Key decision or outcome

Rules:
- Only add ticket wikilinks like [[RD-4470]] if the user EXPLICITLY mentioned that ticket ID
- Do NOT infer or guess ticket references from context
- If no ticket was explicitly mentioned, don't add any wikilinks
- Keep it concise

<session>
${sessionText.slice(-8000)}
</session>`;

  try {
    const response = await complete(
      model,
      {
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }],
            timestamp: Date.now(),
          },
        ],
      },
      { apiKey, reasoningEffort: "medium" }
    );

    const summary = response.content
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join("\n")
      .trim();

    return summary;
  } catch (err) {
    ctx.ui.notify(`Summary generation failed: ${err}`, "error");
    return null;
  }
}

function formatAsTaskItems(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let inMainTask = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      result.push("");
      continue;
    }

    // Already formatted correctly
    if (trimmed.startsWith("- [x] ") || trimmed.startsWith("- [ ] ")) {
      result.push(line);
      inMainTask = true;
      continue;
    }

    // Starts with dash but no checkbox
    if (trimmed.startsWith("- ")) {
      const content = trimmed.slice(2).trim();
      // If indented or looks like a subtask
      if (line.startsWith("  ") || inMainTask) {
        result.push(line); // Keep subtask as-is
      } else {
        result.push(`- [x] ${content}`);
        inMainTask = true;
      }
      continue;
    }

    // Plain text line - make it a main task if no task open
    if (!inMainTask) {
      result.push(`- [x] ${trimmed}`);
      inMainTask = true;
    } else {
      // Indent as subtask
      result.push(`  - ${trimmed}`);
    }
  }

  return result.join("\n");
}

// ═════════════════════════════════════════════════════════════════════════════
// Template Builders
// ═════════════════════════════════════════════════════════════════════════════

function buildDailyNoteTemplate(date: string, previousSummary: string = "", todos: string[] = []): string {
  const todoSection = todos.length > 0
    ? todos.map((t) => `- [ ] ${t.replace(/^-?\s*\[.?\]?\s*/, "")}`).join("\n")
    : "- [ ] ";

  return `---
date: ${date}
tags: [daily]
---
# ${date}

## Previous episode
${previousSummary || "_Previous day's work summary will appear here_"}

## Todo
${todoSection}

## Work log
_Tasks completed today_

## Learnings
_Insights and discoveries from today_

## Next episode
_Plan tomorrow's focus_

## Links back
- Add related notes here

## Ideas for Notes
- Potential concepts to document
`;
}

// ═════════════════════════════════════════════════════════════════════════════
// State for /slate-get-ticket - queued files to inject on next message
// ═════════════════════════════════════════════════════════════════════════════

interface QueuedTicketFiles {
	ticketId: string;
	folderName: string;
	folderPath: string;
	files: string[]; // selected file names
}

// Shared state across the extension
const ticketQueue: { queued: QueuedTicketFiles | null } = {
	queued: null,
};

// ═════════════════════════════════════════════════════════════════════════════
// File Selector Component for /slate-get-ticket
// ═════════════════════════════════════════════════════════════════════════════

interface FileSelectorState {
	files: string[];
	selected: Set<string>;
	focusedIndex: number;
}

class FileSelectorComponent {
	private state: FileSelectorState;
	private theme: Theme;
	private onDone: (selected: string[]) => void;
	private tui: unknown;
	private cachedWidth?: number;
	private cachedLines?: string[];

	constructor(files: string[], theme: Theme, tui: unknown, onDone: (selected: string[]) => void) {
		this.state = {
			files,
			selected: new Set(files), // All selected by default
			focusedIndex: 0,
		};
		this.theme = theme;
		this.tui = tui;
		this.onDone = onDone;
	}

	handleInput(data: string): void {
		if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
			this.onDone(Array.from(this.state.selected));
		} else if (matchesKey(data, "up")) {
			this.state.focusedIndex = Math.max(0, this.state.focusedIndex - 1);
			this.invalidate();
			(this.tui as { requestRender(): void }).requestRender();
		} else if (matchesKey(data, "down")) {
			this.state.focusedIndex = Math.min(
				this.state.files.length,
				this.state.focusedIndex + 1
			);
			this.invalidate();
			(this.tui as { requestRender(): void }).requestRender();
		} else if (matchesKey(data, "return") || matchesKey(data, "space")) {
			// Toggle selection for focused item
			if (this.state.focusedIndex < this.state.files.length) {
				const file = this.state.files[this.state.focusedIndex]!;
				if (this.state.selected.has(file)) {
					this.state.selected.delete(file);
				} else {
					this.state.selected.add(file);
				}
				this.invalidate();
				(this.tui as { requestRender(): void }).requestRender();
			} else {
				// "Done" button selected
				this.onDone(Array.from(this.state.selected));
			}
		}
	}

	render(width: number): string[] {
		if (this.cachedLines && this.cachedWidth === width) {
			return this.cachedLines;
		}

		const lines: string[] = [];
		const th = this.theme;

		lines.push("");
		const title = th.fg("accent", " Select Files to Load ");
		const headerLine =
			th.fg("borderMuted", "─".repeat(2)) +
			title +
			th.fg("borderMuted", "─".repeat(Math.max(0, width - 22)));
		lines.push(truncateToWidth(headerLine, width));
		lines.push("");

		// Show file list
		for (let i = 0; i < this.state.files.length; i++) {
			const file = this.state.files[i]!;
			const isSelected = this.state.selected.has(file);
			const isFocused = i === this.state.focusedIndex;

			const check = isSelected ? th.fg("success", "☑") : th.fg("dim", "☐");
			const fileName = isFocused
				? th.bg("selectedBg", th.fg("text", ` ${file} `))
				: th.fg("text", file);

			const line = `  ${check} ${fileName}`;
			lines.push(truncateToWidth(line, width));
		}

		// "Done" button
		const isDoneFocused = this.state.focusedIndex === this.state.files.length;
		const doneText = isDoneFocused
			? th.bg("selectedBg", th.fg("text", " ✓ Done "))
			: th.fg("dim", "  ✓ Done");
		lines.push("");
		lines.push(truncateToWidth(doneText, width));

		// Selection summary
		lines.push("");
		const selectedCount = this.state.selected.size;
		const totalCount = this.state.files.length;
		const summary = th.fg(
			"muted",
			`  ${selectedCount}/${totalCount} selected • Space/Enter: toggle • Esc: finish`
		);
		lines.push(truncateToWidth(summary, width));
		lines.push("");

		this.cachedWidth = width;
		this.cachedLines = lines;
		return lines;
	}

	invalidate(): void {
		this.cachedWidth = undefined;
		this.cachedLines = undefined;
	}
}

function buildTicketFolderTemplate(ticketId: string, title: string): Record<string, string> {
  const folderName = `${ticketId} ${title}`;
  return {
    [`${folderName}/Ticket.md`]: `---
ticket: ${ticketId}
title: ${title}
status: Backlog
---
# ${ticketId} — ${title}

## Overview
Dashboard for [[${ticketId}]] work.

## Documents
- [[PRD]] — Product Requirements
- [[Plan]] — Implementation Plan

## Progress
- [ ] Initial setup
- [ ] Implementation
- [ ] Testing
- [ ] MR Ready

## Links
- Main ticket: [[${ticketId}]]
- Related tickets: 
`,
    [`${folderName}/PRD.md`]: `---
ticket: ${ticketId}
type: PRD
---
# ${ticketId} PRD — ${title}

## Problem Statement
What are we solving?

## Solution Overview
High-level approach

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Notes
_Add as we learn_
`,
    [`${folderName}/Plan.md`]: `---
ticket: ${ticketId}
type: Plan
---
# ${ticketId} Plan — ${title}

## Approach
Implementation strategy

## Tasks
- [ ] Task 1
- [ ] Task 2

## Open Questions
_Notes during implementation_
`,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// Core Functions
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Extracts main task items from Work log section for Previous episode
 * Takes top-level checked items and converts to bullet points
 */
function extractWorkLogItems(workLogContent: string): string[] {
  if (!workLogContent) return [];

  const lines = workLogContent.split("\n");
  const mainItems: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Match main task lines: "- [x] task description" or "- [X] task description"
    if (/^- \[[xX]\]/.test(trimmed)) {
      // Remove the checkbox and extract the task text
      const taskText = trimmed.replace(/^- \[[xX]\]\s*/, "").trim();
      if (taskText) {
        mainItems.push(taskText);
      }
    }
  }

  return mainItems.slice(0, 5); // Limit to top 5 items
}

/**
 * Extracts todo items from Next episode section
 */
function extractTodosFromNextEpisode(nextEpisodeContent: string): string[] {
  if (!nextEpisodeContent) return [];

  return nextEpisodeContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("- "))
    .map((l) => l.replace(/^- \[[x ]\]\s*/i, "").replace(/^- /, ""))
    .filter((t) => t.length > 0 && !t.toLowerCase().startsWith("unblock:"));
}

async function getOrCreateDailyNote(date: string): Promise<{ path: string; content: string; created: boolean }> {
  const dailyPath = `daily/${date}.md`;
  const archivePath = `archives/daily/${date}.md`;

  // Check both locations
  let content = await readVaultFile(dailyPath);
  if (content) return { path: dailyPath, content, created: false };

  content = await readVaultFile(archivePath);
  if (content) return { path: archivePath, content, created: false };

  // Need to create fresh
  const yesterday = getYesterdayKey();
  const yesterdayPath = `archives/daily/${yesterday}.md`;

  let previousItems: string[] = [];
  let todos: string[] = [];

  // Try to extract from yesterday's note
  const yesterdayContent = await readVaultFile(yesterdayPath);
  if (yesterdayContent) {
    const yesterdaySections = parseDailyNote(yesterdayContent);

    // Extract previous episode items from yesterday's Work log
    const workLog = yesterdaySections.workLog || "";
    previousItems = extractWorkLogItems(workLog);

    // Extract todos from "Next episode"
    const nextEpisode = yesterdaySections.nextEpisode || "";
    todos = extractTodosFromNextEpisode(nextEpisode);
  }

  // Format previous items as bullet points
  const previousSummary = previousItems.length > 0
    ? previousItems.map((item) => `- ${item}`).join("\n")
    : `_See [[${yesterday}]] for previous work_`;

  const newContent = buildDailyNoteTemplate(date, previousSummary, todos);
  await writeVaultFile(dailyPath, newContent);

  return { path: dailyPath, content: newContent, created: true };
}

/**
 * Populates an existing daily note with previous episode and todo items from yesterday
 * Handles both # Section (H1) and ## Section (H2) formats
 */
async function populateExistingNote(date: string, content: string, path: string, ctx?: ExtensionContext): Promise<{ content: string; updated: boolean }> {
  const yesterday = getYesterdayKey();
  const yesterdayPath = `archives/daily/${yesterday}.md`;

  const yesterdayContent = await readVaultFile(yesterdayPath);
  if (!yesterdayContent) {
    return { content, updated: false };
  }

  const yesterdaySections = parseDailyNote(yesterdayContent);

  // Normalize line endings to handle Windows-style \r\n
  let newContent = content.replace(/\r\n/g, "\n");
  let updated = false;

  // Extract and populate Previous episode from yesterday's Work log
  const workLog = yesterdaySections.workLog || "";
  const previousItems = extractWorkLogItems(workLog);

  if (previousItems.length > 0) {
    const previousSummary = previousItems.map((item) => `- ${item}`).join("\n");
    // Replace the Previous episode section content (handles both # and ##, case insensitive, and Windows/Mac line endings)
    // Matches until next # section or end of string, handles both \n# and direct # (no blank line)
    const previousRegex = /(#+\s+[Pp]revious\s+[Ee]pisode\s*\r?\n)([\s\S]*?)(?=\r?\n*#+\s+|$)/;
    if (previousRegex.test(newContent)) {
      newContent = newContent.replace(previousRegex, `$1${previousSummary}\n`);
      updated = true;
    }
  }

  // Extract and populate Todo from yesterday's Next episode
  const nextEpisode = yesterdaySections.nextEpisode || "";
  const todos = extractTodosFromNextEpisode(nextEpisode);

  if (todos.length > 0) {
    const todoSection = todos.map((t) => `- [ ] ${t}`).join("\n");
    // Replace the Todo section content (handles both # and ##, case insensitive)
    // Matches # Todo or ## Todo followed by content until next section or EOF
    // Allows for zero or more newlines before next section (handles adjacent sections)
    const todoRegex = /(#+\s+[Tt]odo\s*\r?\n)([\s\S]*?)(?=\r?\n*#+\s+|$)/;
    if (todoRegex.test(newContent)) {
      newContent = newContent.replace(todoRegex, `$1${todoSection}\n`);
      updated = true;
    }
  }

  return { content: newContent, updated };
}

// ═════════════════════════════════════════════════════════════════════════════
// Extension Registration
// ═════════════════════════════════════════════════════════════════════════════

export default function (pi: ExtensionAPI) {
  // ═══════════════════════════════════════════════════════════════════════════
  // Commands
  // ═══════════════════════════════════════════════════════════════════════════

  // ────────────────────────────────────────────────────────────────────────────
  // /slate-setup — Daily note setup workflow
  // ────────────────────────────────────────────────────────────────────────────
  pi.registerCommand("slate-setup", {
    description: "Set up today's daily note from yesterday",
    handler: async (_args, ctx) => {
      const date = getTodayKey();
      const { path: notePath, content, created } = await getOrCreateDailyNote(date);

      if (!created) {
        // Note exists - populate previous episode and todo from yesterday
        ctx.ui.notify(`Populating existing note: ${notePath}...`, "info");

        const { content: updatedContent, updated } = await populateExistingNote(date, content, notePath, ctx);

        if (updated) {
          await writeVaultFile(notePath, updatedContent);
          ctx.ui.notify(`Updated ${notePath} with yesterday's data`, "success");

          const parsed = parseDailyNote(updatedContent);
          // Count non-empty bullet points for previous episode (e.g., "- something")
          const itemCount = parsed.previousEpisode?.split("\n")
            .filter((l) => /^\s*- /.test(l) && l.trim().length > 2).length || 0;
          // Count non-empty todo checkboxes (e.g., "- [ ] something")
          const todoCount = parsed.todo?.split("\n")
            .filter((l) => /- \[[ x]\]\s+\S/.test(l)).length || 0;

          ctx.ui.notify(`Added ${itemCount} previous episode items, ${todoCount} todos`, "info");
        } else {
          ctx.ui.notify(`Note exists, no yesterday data found to populate`, "warning");
        }
        return;
      }

      ctx.ui.notify(`Created ${notePath}`, "success");

      // Show summary of what was extracted
      const parsed = parseDailyNote(content);
      const itemCount = parsed.previousEpisode?.split("\n")
        .filter((l) => /^\s*- /.test(l) && l.trim().length > 2).length || 0;
      const todoCount = parsed.todo?.split("\n")
        .filter((l) => /- \[[ x]\]\s+\S/.test(l)).length || 0;

      ctx.ui.notify(`Added ${itemCount} previous episode items from yesterday's work`, "info");
      if (todoCount > 0) {
        ctx.ui.notify(`Carried over ${todoCount} todos from yesterday's plan`, "info");
      }
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // /slate-log — Log current session work (AI-generated, editable)
  // ────────────────────────────────────────────────────────────────────────────
  pi.registerCommand("slate-log", {
    description: "Generate and edit session summary for daily note",
    handler: async (_args, ctx) => {
      const date = getTodayKey();
      const dailyPath = `daily/${date}.md`;

      const content = await readVaultFile(dailyPath);
      if (!content) {
        ctx.ui.notify("No daily note found. Run /slate-setup first.", "error");
        return;
      }

      // Get session history
      const branch = ctx.sessionManager.getBranch();
      const sessionText = buildSessionText(branch);

      if (!sessionText.trim()) {
        ctx.ui.notify("No session content to summarize", "warning");
        return;
      }

      ctx.ui.notify("Generating session summary...", "info");

      // Generate AI summary
      const summary = await generateSessionSummary(sessionText, ctx);
      if (!summary) {
        ctx.ui.notify("Failed to generate summary", "error");
        return;
      }

      // Show in editor for user to edit/confirm
      const edited = await ctx.ui.editor(
        "Edit the session summary (Cancel to skip):",
        summary
      );

      if (!edited || !edited.trim()) {
        ctx.ui.notify("Cancelled — nothing logged", "info");
        return;
      }

      // Format and append to daily note
      const formatted = formatAsTaskItems(edited);

      const sections = parseDailyNote(content);
      const workLog = sections.workLog || "";
      const separator = workLog.trim() ? "\n" : "";
      const newWorkLog = workLog + separator + formatted;

      // Match both "Work log" and legacy "Tasks (Work)" formats
      const workLogRegex = /(#+\s+(?:Work log|Tasks \(Work\))\s*\r?\n)([\s\S]*?)(?=\r?\n*#+\s+|$)/i;
      const newContent = content.replace(workLogRegex, `$1${newWorkLog}\n\n`);

      await writeVaultFile(dailyPath, newContent);
      ctx.ui.notify("Session logged to Work log", "success");
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // /slate-wrapup — Daily wrapup interview
  // ────────────────────────────────────────────────────────────────────────────
  pi.registerCommand("slate-wrapup", {
    description: "Daily wrapup: lessons, tomorrow's plan, archive",
    handler: async (_args, ctx) => {
      const date = getTodayKey();
      const dailyPath = `daily/${date}.md`;

      const content = await readVaultFile(dailyPath);
      if (!content) {
        ctx.ui.notify("No daily note found.", "error");
        return;
      }

      // Interview: tomorrow's plan
      const tomorrow = await ctx.ui.input("What's on your plate for tomorrow?");
      if (!tomorrow) return;

      const blocking = await ctx.ui.input("Anything blocking you?");

      // Interview: learnings
      const showLearnings = await ctx.ui.confirm("Learnings", "Extract key learnings from today?");
      let learnings = "";
      if (showLearnings) {
        learnings = await ctx.ui.editor(
          "Key learnings (decisions, discoveries, debugging wins):",
          "- Learned: ...\n- Decided: ..."
        ) || "";
      }

      // Interview: ideas for notes
      const showIdeas = await ctx.ui.confirm("Ideas", "Any concepts to document?");
      let ideas = "";
      if (showIdeas) {
        ideas = await ctx.ui.editor(
          "Ideas for future notes:",
          "- [[Concept name]] — brief description"
        ) || "";
      }

      // Build updated content
      let newContent = content;

      // Update Next episode
      const nextEpisode = [`- ${tomorrow}`];
      if (blocking) nextEpisode.push(`- Unblock: ${blocking}`);
      newContent = newContent.replace(
        /## Next episode\n.*?((?=\n## )|$)/s,
        `## Next episode\n${nextEpisode.join("\n")}\n\n`
      );

      // Update Learnings if provided
      if (learnings.trim()) {
        const existing = parseDailyNote(newContent).learnings || "";
        const prefix = existing.trim() ? existing + "\n" : "";
        newContent = newContent.replace(
          /## Learnings\n.*?((?=\n## )|$)/s,
          `## Learnings\n${prefix}${learnings}\n\n`
        );
      }

      // Update Ideas if provided
      if (ideas.trim()) {
        const existing = parseDailyNote(newContent).ideasForNotes || "";
        const prefix = existing.trim() ? existing + "\n" : "";
        newContent = newContent.replace(
          /## Ideas for Notes\n.*?((?=\n## )|$)/s,
          `## Ideas for Notes\n${prefix}${ideas}\n\n`
        );
      }

      // Write updated note
      await writeVaultFile(dailyPath, newContent);

      // Archive
      const archivePath = `archives/daily/${date}.md`;
      await writeVaultFile(archivePath, newContent);
      await fs.unlink(path.join(VAULT_PATH, dailyPath));

      ctx.ui.notify(`Day wrapped up. Archived to ${archivePath}`, "success");
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // /slate-ticket — Create ticket folder
  // ────────────────────────────────────────────────────────────────────────────
  pi.registerCommand("slate-ticket", {
    description: "Create a new ticket folder structure",
    handler: async (args, ctx) => {
      // Parse args: "RD-4470 Ticket Title" or prompt
      let [ticketId, ...titleParts] = (args || "").split(" ");
      let title = titleParts.join(" ");

      if (!ticketId) {
        ticketId = await ctx.ui.input("Ticket ID (e.g., RD-4470):");
        if (!ticketId) return;
      }
      if (!title) {
        title = await ctx.ui.input("Ticket title:") || "Untitled";
      }

      const templates = buildTicketFolderTemplate(ticketId, title);
      const basePath = `work/tickets`;
      const folderName = `${ticketId} ${title}`;

      for (const [filePath, content] of Object.entries(templates)) {
        await writeVaultFile(`${basePath}/${filePath}`, content);
      }

      ctx.ui.notify(`Created ${folderName}/ with Ticket.md, PRD.md, Plan.md`, "success");
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // /slate-get-ticket — Read selected files from a ticket folder
  // ────────────────────────────────────────────────────────────────────────────
  pi.registerCommand("slate-get-ticket", {
    description: "Read selected markdown files from a ticket folder (e.g., /slate-get-ticket RD-4444)",
    handler: async (args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("/slate-get-ticket requires interactive mode", "error");
        return;
      }

      const ticketId = args?.trim() || (await ctx.ui.input("Ticket ID (e.g., RD-4444):"));
      if (!ticketId) return;

      const normalizedTicketId = ticketId.toUpperCase();
      const ticketsPath = `${VAULT_PATH}/work/tickets`;

      try {
        const entries = await fs.readdir(ticketsPath, { withFileTypes: true });
        const folder = entries.find(
          (e) => e.isDirectory() && e.name.toUpperCase().startsWith(normalizedTicketId)
        );

        if (!folder) {
          ctx.ui.notify(`Ticket ${ticketId} not found`, "error");
          return;
        }

        const folderPath = `${ticketsPath}/${folder.name}`;
        const files = await fs.readdir(folderPath);
        const markdownFiles = files.filter((f) => f.endsWith(".md")).sort();

        if (markdownFiles.length === 0) {
          ctx.ui.notify(`No markdown files in ${folder.name}`, "warning");
          return;
        }

        // Use custom file selector component with toggle support
        const selectedFiles = await ctx.ui.custom<string[]>((tui, theme, _kb, done) => {
          return new FileSelectorComponent(markdownFiles, theme, tui, (selected) => done(selected));
        });

        // If nothing selected (user cancelled), abort
        if (!selectedFiles || selectedFiles.length === 0) {
          ctx.ui.notify("No files selected", "info");
          return;
        }

        // Store in queue for injection on next message
        ticketQueue.queued = {
          ticketId,
          folderName: folder.name,
          folderPath,
          files: selectedFiles,
        };

        // Show visual indicator
        ctx.ui.setStatus("ticket", `🎫 ${ticketId} (${selectedFiles.length} files)`);
        ctx.ui.setWidget("ticket", [
          `\x1b[2m🎫 Ticket: \x1b[0m\x1b[36m${ticketId}\x1b[0m\x1b[2m — ${selectedFiles.length} file(s) ready\x1b[0m`,
        ]);

        ctx.ui.notify(`${selectedFiles.length} file(s) queued for next message`, "success");
      } catch (err) {
        ctx.ui.notify(`Error reading ticket: ${err}`, "error");
      }
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // /slate-concept — Create concept note
  // ────────────────────────────────────────────────────────────────────────────
  pi.registerCommand("slate-concept", {
    description: "Create a new concept note",
    handler: async (args, ctx) => {
      const [name, ...rest] = (args || "").split(" ");
      let title = name ? [name, ...rest].join(" ") : "";

      if (!title) {
        title = await ctx.ui.input("Concept name:") || "Untitled Concept";
      }

      // Sanitize filename
      const filename = title.replace(/[^a-zA-Z0-9\s_-]/g, "").trim() + ".md";
      const dailyDate = getTodayKey();

      const content = `---
created: ${dailyDate}
type: concept
---
# ${title}

## Overview
Brief description of this concept.

## Details

## Examples

## Related
- [[Related concept]]

## Origin
Derived from work on [[${dailyDate}]]
`;

      await writeVaultFile(`work/concepts/${filename}`, content);
      ctx.ui.notify(`Created work/concepts/${filename}`, "success");
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // /slate-topic — Create or open topic note
  // ────────────────────────────────────────────────────────────────────────────
  pi.registerCommand("slate-topic", {
    description: "Create or open a topic note",
    handler: async (args, ctx) => {
      const title = args || (await ctx.ui.input("Topic name:"));
      if (!title) return;

      const filename = title.replace(/[^a-zA-Z0-9\s_-]/g, "").trim() + ".md";
      const filepath = `topics/${filename}`;

      const exists = await vaultPathExists(filepath);
      if (exists) {
        ctx.ui.notify(`Topic exists: ${filepath}`, "info");
        return;
      }

      const dailyDate = getTodayKey();
      const content = `---
created: ${dailyDate}
type: topic
---
# ${title}

## Overview

## Resources

## Notes

## Origin
Started from exploration on [[${dailyDate}]]
`;

      await writeVaultFile(filepath, content);
      ctx.ui.notify(`Created ${filepath}`, "success");
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // /slate-where — Open daily note location
  // ────────────────────────────────────────────────────────────────────────────
  pi.registerCommand("slate-where", {
    description: "Show vault location and today's note",
    handler: async (_args, ctx) => {
      const date = getTodayKey();
      const dailyPath = `daily/${date}.md`;
      const archivePath = `archives/daily/${date}.md`;

      const inDaily = await vaultPathExists(dailyPath);
      const inArchive = await vaultPathExists(archivePath);

      const location = inDaily ? dailyPath : inArchive ? archivePath : "(not created yet)";

      ctx.ui.notify(`Vault: ${VAULT_PATH}`, "info");
      ctx.ui.notify(`Today's note: ${location}`, inDaily || inArchive ? "success" : "warning");
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Tools
  // ═══════════════════════════════════════════════════════════════════════════

  // ────────────────────────────────────────────────────────────────────────────
  // slate_read_daily — Read today's daily note
  // ────────────────────────────────────────────────────────────────────────────
  pi.registerTool({
    name: "slate_read_daily",
    label: "Slate: Read Daily",
    description: "Read today's daily note from the Obsidian vault",
    parameters: Type.Object({
      date: Type.Optional(Type.String({ description: "Date in YYYY-MM-DD format (default: today)" })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const date = params.date || getTodayKey();
      const dailyPath = `daily/${date}.md`;
      const archivePath = `archives/daily/${date}.md`;

      const content = await readVaultFile(dailyPath) || await readVaultFile(archivePath);

      if (!content) {
        return {
          content: [{ type: "text", text: `No daily note found for ${date}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: content }],
        details: { path: await vaultPathExists(dailyPath) ? dailyPath : archivePath, date },
      };
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // slate_append_tasks — Append tasks to today's note
  // ────────────────────────────────────────────────────────────────────────────
  pi.registerTool({
    name: "slate_append_tasks",
    label: "Slate: Append Tasks",
    description: "Append completed tasks to the Work log section of today's daily note",
    parameters: Type.Object({
      tasks: Type.String({ description: "Tasks to append (markdown format with - [x])" }),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const date = getTodayKey();
      const dailyPath = `daily/${date}.md`;

      let content = await readVaultFile(dailyPath);
      if (!content) {
        // Create if doesn't exist
        const { content: newContent } = await getOrCreateDailyNote(date);
        content = newContent;
      }

      const sections = parseDailyNote(content);
      const workLog = sections.workLog || "";
      const separator = workLog.trim() ? "\n" : "";
      const newWorkLog = workLog + separator + params.tasks;

      // Match both "Work log" and legacy "Tasks (Work)" formats
      const workLogRegex = /(#+\s+(?:Work log|Tasks \(Work\))\s*\r?\n)([\s\S]*?)(?=\r?\n*#+\s+|$)/i;
      const newContent = content.replace(workLogRegex, `$1${newWorkLog}\n\n`);

      await writeVaultFile(dailyPath, newContent);

      return {
        content: [{ type: "text", text: `Appended tasks to Work log in ${dailyPath}` }],
        details: { path: dailyPath, date },
      };
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // slate_read_ticket — Read a ticket's Ticket.md
  // ────────────────────────────────────────────────────────────────────────────
  pi.registerTool({
    name: "slate_read_ticket",
    label: "Slate: Read Ticket",
    description: "Read a ticket's Ticket.md by ID (case-insensitive)",
    parameters: Type.Object({
      ticketId: Type.String({ description: "Ticket ID, e.g., RD-4470" }),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const { ticketId } = params;
      const normalizedTicketId = ticketId.toUpperCase();

      // Find the ticket folder (case-insensitive match)
      const ticketsPath = `${VAULT_PATH}/work/tickets`;
      try {
        const entries = await fs.readdir(ticketsPath, { withFileTypes: true });
        const folder = entries.find(
          (e) => e.isDirectory() && e.name.toUpperCase().startsWith(normalizedTicketId)
        );

        if (!folder) {
          return {
            content: [{ type: "text", text: `Ticket ${ticketId} not found in ${ticketsPath}` }],
            isError: true,
          };
        }

        const ticketPath = `work/tickets/${folder.name}/Ticket.md`;
        const content = await readVaultFile(ticketPath);

        if (!content) {
          return {
            content: [{ type: "text", text: `Ticket.md not found in ${folder.name}` }],
            isError: true,
          };
        }

        return {
          content: [{ type: "text", text: content }],
          details: { path: ticketPath, ticketId, folder: folder.name },
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error reading tickets: ${err}` }],
          isError: true,
        };
      }
    },
  });

  // ────────────────────────────────────────────────────────────────────────────
  // slate_get_ticket — Read all files in a ticket folder
  // ────────────────────────────────────────────────────────────────────────────
  pi.registerTool({
    name: "slate_get_ticket",
    label: "Slate: Get Ticket",
    description: "Read all markdown files in a ticket folder by ID (case-insensitive)",
    parameters: Type.Object({
      ticketId: Type.String({ description: "Ticket ID, e.g., RD-4470" }),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      const { ticketId } = params;
      const normalizedTicketId = ticketId.toUpperCase();

      // Find the ticket folder (case-insensitive match)
      const ticketsPath = `${VAULT_PATH}/work/tickets`;
      try {
        const entries = await fs.readdir(ticketsPath, { withFileTypes: true });
        const folder = entries.find(
          (e) => e.isDirectory() && e.name.toUpperCase().startsWith(normalizedTicketId)
        );

        if (!folder) {
          return {
            content: [{ type: "text", text: `Ticket ${ticketId} not found in ${ticketsPath}` }],
            isError: true,
          };
        }

        const folderPath = `${ticketsPath}/${folder.name}`;
        const files = await fs.readdir(folderPath);
        const markdownFiles = files.filter((f) => f.endsWith(".md"));

        if (markdownFiles.length === 0) {
          return {
            content: [{ type: "text", text: `No markdown files found in ${folder.name}` }],
            isError: true,
          };
        }

        // Read all markdown files
        const contents: string[] = [];
        contents.push(`# Ticket: ${folder.name}\n`);
        contents.push(`Found ${markdownFiles.length} file(s):\n`);

        for (const file of markdownFiles.sort()) {
          const filePath = `work/tickets/${folder.name}/${file}`;
          const content = await readVaultFile(filePath);

          if (content) {
            contents.push(`\n${"=".repeat(60)}`);
            contents.push(`## File: ${file}`);
            contents.push(`${"=".repeat(60)}\n`);
            contents.push(content);
          }
        }

        return {
          content: [{ type: "text", text: contents.join("\n") }],
          details: { 
            path: `work/tickets/${folder.name}/`, 
            ticketId, 
            folder: folder.name, 
            files: markdownFiles 
          },
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error reading ticket: ${err}` }],
          isError: true,
        };
      }
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Welcome on session start
  // ═══════════════════════════════════════════════════════════════════════════
  pi.on("session_start", async (_event, ctx) => {
    const date = getTodayKey();
    const dailyPath = `daily/${date}.md`;

    const exists = await vaultPathExists(dailyPath);
    if (!exists) {
      ctx.ui.setStatus("slate", `📓 Daily note not created (${date}) — run /slate-setup`);
    } else {
      ctx.ui.setStatus("slate", "📓 Slate ready");
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Inject queued ticket files before agent starts processing
  // ═══════════════════════════════════════════════════════════════════════════
  pi.on("before_agent_start", async (_event, ctx) => {
    if (!ticketQueue.queued) {
      return {};
    }

    const queued = ticketQueue.queued;
    ticketQueue.queued = null; // Clear the queue

    // Clear visual indicators
    ctx.ui?.setStatus("ticket", undefined);
    ctx.ui?.setWidget("ticket", undefined);

    try {
      // Read all selected files and combine them
      const contents: string[] = [];
      contents.push(`# Ticket: ${queued.folderName}\n`);

      for (const file of queued.files.sort()) {
        const content = await fs.readFile(`${queued.folderPath}/${file}`, "utf-8");
        contents.push(`\n${"=".repeat(60)}`);
        contents.push(`## File: ${file}`);
        contents.push(`${"=".repeat(60)}\n`);
        contents.push(content);
      }

      const fullContent = contents.join("\n");

      return {
        message: {
          customType: "ticket-context",
          content: `<ticket id="${queued.ticketId}">\n${fullContent}\n</ticket>`,
          display: true, // Show in chat
        },
      };
    } catch (err) {
      ctx.ui?.notify(`Failed to load ticket files: ${err}`, "warning");
      return {};
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Custom message renderer for ticket-context messages
  // ═══════════════════════════════════════════════════════════════════════════
  pi.registerMessageRenderer("ticket-context", (message, options, theme) => {
    // Extract ticket ID and content
    const rawContent = typeof message.content === "string"
      ? message.content
      : Array.isArray(message.content)
        ? message.content.map((c: { type: string; text?: string }) => c.type === "text" ? c.text || "" : "").join("")
        : "";
    const idMatch = rawContent.match(/<ticket id="([^"]+)">/);
    const ticketId = idMatch?.[1] || "Unknown";

    // Extract content between tags
    const contentMatch = rawContent.match(/<ticket[^>]*>\n?([\s\S]*?)\n?<\/ticket>/);
    const ticketContent = contentMatch?.[1]?.trim() || rawContent;

    // Use Container and Text from pi-tui for rendering
    const container = new Container();

    // Header with ticket icon and ID
    const header = new Text(
      theme.fg("accent", "🎫 ") +
      theme.fg("customMessageLabel", theme.bold("Ticket: ")) +
      theme.fg("accent", ticketId),
      1, 0
    );
    container.addChild(header);

    // Content preview
    const lines = ticketContent.split("\n");
    const PREVIEW_LINES = 8;
    const isLong = lines.length > PREVIEW_LINES;
    const showLines = options.expanded ? lines : lines.slice(0, PREVIEW_LINES);

    for (const line of showLines) {
      container.addChild(new Text(theme.fg("dim", line), 1, 0));
    }

    if (!options.expanded && isLong) {
      const hiddenCount = lines.length - PREVIEW_LINES;
      container.addChild(new Text(
        theme.fg("muted", `... ${hiddenCount} more lines (click to expand)`),
        1, 0
      ));
    }

    return container;
  });
}