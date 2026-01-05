import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, basename } from 'path'

/**
 * OpenNotify Plugin
 *
 * Desktop notifications for OpenCode - alerts when tasks complete or permissions needed.
 * Replicates CCNotify functionality for Claude Code.
 *
 * Features:
 * - Notify on task completion with duration
 * - Notify on permission requests
 * - Per-session sequence numbers
 * - JSON file storage (no external dependencies)
 * - Native macOS notifications via osascript
 */

const DB_FILENAME = 'open-notify.json'

/**
 * Load notification database
 */
function loadDB(configDir) {
  const dbPath = join(configDir, DB_FILENAME)

  if (!existsSync(dbPath)) {
    return { pending: {}, session_seqs: {} }
  }

  try {
    const content = readFileSync(dbPath, 'utf-8')
    return JSON.parse(content)
  } catch (err) {
    console.log(`[open-notify] Error loading database:`, err)
    return { pending: {}, session_seqs: {} }
  }
}

/**
 * Save notification database
 */
function saveDB(configDir, db) {
  const dbPath = join(configDir, DB_FILENAME)

  try {
    writeFileSync(dbPath, JSON.stringify(db, null, 2))
  } catch (err) {
    console.log(`[open-notify] Error saving database:`, err)
  }
}

/**
 * Get project name from directory path
 */
function getProjectName(directory) {
  if (!directory) return 'OpenCode Task'
  return basename(directory) || 'OpenCode Task'
}

/**
 * Format duration in human-readable form
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000)

  if (seconds < 60) {
    return `${seconds}s`
  }

  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m}m${s}s` : `${m}m`
  }

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m > 0 ? `${h}h${m}m` : `${h}h`
}

/**
 * Escape string for AppleScript
 */
function escapeAppleScript(str) {
  if (!str) return ''
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
}

/**
 * Format current timestamp for notification
 */
function formatTimestamp() {
  return new Date().toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

/**
 * Send macOS notification using osascript
 */
async function sendNotification($, title, subtitle) {
  const safeTitle = escapeAppleScript(title)
  const safeSubtitle = escapeAppleScript(subtitle)
  const timestamp = escapeAppleScript(formatTimestamp())

  const script = `display notification "${safeSubtitle}\\n${timestamp}" with title "${safeTitle}" sound name "Glass"`

  try {
    await $`osascript -e ${script}`
  } catch (err) {
    console.log(`[open-notify] Error sending notification:`, err)
  }
}

export const openNotify = async ({ project, client, $, directory, worktree }) => {
  // Determine config directory
  const configDir = process.env.HOME
    ? join(process.env.HOME, '.config', 'opencode')
    : directory


  return {
    /**
     * Hook: chat.message
     * Track when user sends a prompt (start timer)
     */
    "chat.message": async (input, output) => {
      const db = loadDB(configDir)
      const sessionId = input.sessionID

      if (!sessionId) return

      // Increment sequence for this session
      db.session_seqs[sessionId] = (db.session_seqs[sessionId] || 0) + 1

      // Mark this prompt as pending
      db.pending[sessionId] = {
        started_at: Date.now(),
        directory: directory || worktree || '',
        seq: db.session_seqs[sessionId]
      }

      saveDB(configDir, db)
    },

    /**
     * Hook: event
     * Handle session.idle (completion) and permission.updated events
     */
    event: async ({ event }) => {
      const db = loadDB(configDir)

      // Session completed - only use session.idle to avoid duplicate notifications
      if (event.type === 'session.idle') {
        // Skip subagent completions
        if (event.properties.isSubagent || event.properties.parentSessionID) {
          return
        }

        const sessionId = event.properties.sessionID
        const pending = db.pending[sessionId]

        // Only notify for sessions we started tracking via chat.message
        if (pending) {
          const duration = formatDuration(Date.now() - pending.started_at)
          const projectName = getProjectName(pending.directory)

          await sendNotification(
            $,
            projectName,
            `job#${pending.seq} done, duration: ${duration}`
          )

          // Clear pending state for this session
          delete db.pending[sessionId]
          saveDB(configDir, db)
        }
      }

      // Permission request
      if (event.type === 'permission.updated') {
        const projectName = getProjectName(directory || worktree)

        await sendNotification(
          $,
          projectName,
          'Permission Required'
        )

      }
    }
  }
}
