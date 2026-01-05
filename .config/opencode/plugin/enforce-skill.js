import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * Enforce Skill Plugin (Enhanced with Superpowers Bootstrap)
 *
 * This plugin provides two key capabilities:
 *
 * 1. SESSION BOOTSTRAP: Injects skill-checking discipline at session start
 *    - Establishes the "1% chance = must check" philosophy
 *    - Re-injects after context compaction to maintain discipline
 *    - Adapted from superpowers:using-superpowers skill
 *
 * 2. PER-MESSAGE SKILL MATCHING: Analyzes user messages and suggests skills
 *    - Keyword matching and intent pattern detection
 *    - Priority levels for skill ordering
 *    - File path triggers (optional)
 *
 * Configuration is loaded from skill-rules.json which defines:
 * - Keywords that trigger skill suggestions
 * - Regex intent patterns for flexible matching
 * - Priority levels for skill ordering
 * - File path triggers (optional)
 */

/**
 * Load skill rules from JSON configuration
 * Note: This runs at init time before log helper is available, so errors go to stderr
 */
function loadSkillRules(configDir) {
  const rulesPath = join(configDir, 'skill-rules.json')

  if (!existsSync(rulesPath)) {
    // Can't use log() here as it's not available yet
    return null
  }

  try {
    const content = readFileSync(rulesPath, 'utf-8')
    return JSON.parse(content)
  } catch (err) {
    return null
  }
}

/**
 * Match skills based on prompt content
 */
function matchSkills(prompt, rules) {
  const promptLower = prompt.toLowerCase()
  const matchedSkills = []

  for (const [skillName, config] of Object.entries(rules.skills)) {
    const triggers = config.promptTriggers
    if (!triggers) continue

    let matched = false
    let matchType = null

    // Keyword matching
    if (triggers.keywords) {
      const keywordMatch = triggers.keywords.some(kw =>
        promptLower.includes(kw.toLowerCase())
      )
      if (keywordMatch) {
        matched = true
        matchType = 'keyword'
      }
    }

    // Intent pattern matching (regex)
    if (!matched && triggers.intentPatterns) {
      const intentMatch = triggers.intentPatterns.some(pattern => {
        try {
          const regex = new RegExp(pattern, 'i')
          return regex.test(prompt)
        } catch {
          return false
        }
      })
      if (intentMatch) {
        matched = true
        matchType = 'intent'
      }
    }

    if (matched) {
      matchedSkills.push({
        name: skillName,
        matchType,
        priority: config.priority || 'medium',
        enforcement: config.enforcement || 'suggest',
        description: config.description || ''
      })
    }
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  matchedSkills.sort((a, b) =>
    (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
  )

  return matchedSkills
}

/**
 * Generate skill activation message
 */
function generateActivationMessage(matchedSkills, settings = {}) {
  const maxSkills = settings.maxSkillsToSuggest || 3
  const showDetails = settings.showMatchDetails !== false

  const skillsToShow = matchedSkills.slice(0, maxSkills)

  let message = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL ACTIVATION CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`

  // Group by priority
  const critical = skillsToShow.filter(s => s.priority === 'critical')
  const high = skillsToShow.filter(s => s.priority === 'high')
  const medium = skillsToShow.filter(s => s.priority === 'medium')
  const low = skillsToShow.filter(s => s.priority === 'low')

  if (critical.length > 0) {
    message += `CRITICAL SKILLS (REQUIRED):\n`
    critical.forEach(s => {
      message += `  -> ${s.name}`
      if (showDetails && s.description) message += ` - ${s.description}`
      message += `\n`
    })
    message += `\n`
  }

  if (high.length > 0) {
    message += `RECOMMENDED SKILLS:\n`
    high.forEach(s => {
      message += `  -> ${s.name}`
      if (showDetails && s.description) message += ` - ${s.description}`
      message += `\n`
    })
    message += `\n`
  }

  if (medium.length > 0) {
    message += `SUGGESTED SKILLS:\n`
    medium.forEach(s => {
      message += `  -> ${s.name}`
      if (showDetails && s.description) message += ` - ${s.description}`
      message += `\n`
    })
    message += `\n`
  }

  if (low.length > 0) {
    message += `OPTIONAL SKILLS:\n`
    low.forEach(s => {
      message += `  -> ${s.name}`
      if (showDetails && s.description) message += ` - ${s.description}`
      message += `\n`
    })
    message += `\n`
  }

  message += `ACTION: Use the "skill" tool to load the relevant skill(s) BEFORE responding.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User's message follows:

`

  return message
}

/**
 * Generate session bootstrap content
 * Adapted from superpowers:using-superpowers skill
 * @param {boolean} compact - Use compact version (for post-compaction re-injection)
 */
function getBootstrapContent(compact = false) {
  if (compact) {
    return `<EXTREMELY_IMPORTANT>
You have superpowers.

**CRITICAL:** If there's even a 1% chance a skill applies, you MUST invoke it using the "skill" tool.

**Red Flags (STOP if thinking):** "just a simple question" | "explore first" | "quick check" | "don't need formal skill" → CHECK SKILLS FIRST

**Priority:** Process skills (debugging, brainstorming) BEFORE implementation skills.

**Tools:** Use built-in \`skill\` and \`find_skills\` tools. Use \`todowrite\` for task tracking.
</EXTREMELY_IMPORTANT>`
  }

  return `<EXTREMELY_IMPORTANT>
You have superpowers.

If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill using the built-in "skill" tool.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.

## Red Flags - STOP if you catch yourself thinking:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |

## Skill Priority

When multiple skills could apply, use this order:

1. **Process skills first** (brainstorming, debugging, verification) - these determine HOW to approach the task
2. **Implementation skills second** (mcp-builder, artifacts-builder, etc.) - these guide execution

Examples:
- "Let's build X" → brainstorming first, then implementation skills
- "Fix this bug" → systematic-debugging first, then domain-specific skills
- "I'm done with X" → verification-before-completion first

## Tool Usage

Use OpenCode's built-in tools:
- \`skill\` tool to load and read skills
- \`find_skills\` to discover available skills
- \`todowrite\` for task tracking and planning
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` for file and system operations

## Skill Types

**Rigid** (verification, debugging, TDD): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns, guidelines): Adapt principles to context.

The skill itself tells you which type it is.
</EXTREMELY_IMPORTANT>`
}

export const EnforceSkillPlugin = async ({ project, client, $, directory, worktree }) => {
  // Create logging helper - NEVER use console.log/error in plugins
  const log = (level, message, extra) => 
    client.app.log({ body: { service: "enforce-skill", level, message, extra } })

  // Determine config directory - use global config location
  const configDir = process.env.HOME
    ? join(process.env.HOME, '.config', 'opencode')
    : directory

  // Load rules once at plugin init
  const rules = loadSkillRules(configDir)

  if (!rules) {
    await log("warn", "Plugin disabled - no valid skill-rules.json found")
    return {}
  }

  // Track which sessions have received bootstrap injection
  // Key: sessionID, Value: true if bootstrapped
  const bootstrappedSessions = new Map()

  // Helper to inject bootstrap via session.prompt (only used for compaction now)
  // sessionInfo contains model and agent settings that must be preserved
  const injectBootstrapViaPrompt = async (sessionID, compact = false) => {
    const bootstrapContent = getBootstrapContent(compact)

    try {
      // Fetch session to get model/agent info
      let model, agent
      try {
        const session = await client.session.get({ path: { id: sessionID } })
        model = session?.model
        agent = session?.agent
      } catch (fetchErr) {
        await log("warn", `Could not fetch session: ${fetchErr.message}`)
      }

      const body = {
        noReply: true,
        parts: [{ type: "text", text: bootstrapContent, synthetic: true }]
      }

      // Preserve model and agent settings
      if (model) body.model = model
      if (agent) body.agent = agent

      await client.session.prompt({
        path: { id: sessionID },
        body
      })
      return true
    } catch (err) {
      await log("error", `Failed to inject bootstrap: ${err.message}`)
      return false
    }
  }

  return {
    /**
     * Event handler for session lifecycle events
     * - session.created: Mark session as needing bootstrap (will be done on first message)
     * - session.compacted: Re-inject bootstrap after compaction
     */
    event: async ({ event }) => {
      // Extract sessionID from various event structures
      const getSessionID = () => {
        return event.properties?.info?.id ||
               event.properties?.sessionID ||
               event.session?.id
      }

      // On session creation, just mark it as NOT bootstrapped yet
      // Bootstrap will be injected on first chat.message to preserve model selection
      if (event.type === 'session.created') {
        const sessionID = getSessionID()
        if (sessionID) {
          bootstrappedSessions.set(sessionID, false)
          await log("debug", "Session created, awaiting first message for bootstrap", { sessionID })
        }
      }

      // Re-inject bootstrap after context compaction (compact version to save tokens)
      // This uses the prompt API since the session already exists with model set
      if (event.type === 'session.compacted') {
        const sessionID = getSessionID()
        if (sessionID) {
          await injectBootstrapViaPrompt(sessionID, true)
        }
      }

      // Clean up when session is deleted
      if (event.type === 'session.deleted') {
        const sessionID = getSessionID()
        if (sessionID) {
          bootstrappedSessions.delete(sessionID)
        }
      }
    },

    /**
     * Hook: chat.message
     * Called when a new message is received from the user.
     * - On FIRST message: Prepends bootstrap content (preserves model since it's part of the message)
     * - On ALL messages: Analyzes prompt and injects skill activation suggestions
     */
    "chat.message": async (input, output) => {
      // Find the first text part to get the user's prompt
      const firstTextPart = output.parts.find(part => part.type === "text")
      if (!firstTextPart) return

      // Get sessionID from input
      const sessionID = input.sessionID
      let prefix = ""

      // Check if this session needs bootstrap injection
      // If session is new (not in map) or marked as not bootstrapped, inject bootstrap
      if (sessionID && bootstrappedSessions.get(sessionID) !== true) {
        const bootstrapContent = getBootstrapContent(false)
        prefix = bootstrapContent + "\n\n"
        bootstrappedSessions.set(sessionID, true)
      } else if (!sessionID) {
        // If we can't determine sessionID, always inject bootstrap
        // This ensures we don't miss first messages
        const bootstrapContent = getBootstrapContent(false)
        prefix = bootstrapContent + "\n\n"
      }

      // Get the original user prompt for skill matching
      const userPrompt = firstTextPart.text

      // Match skills based on prompt
      const matchedSkills = matchSkills(userPrompt, rules)

      if (matchedSkills.length > 0) {
        // Generate and prepend activation message
        const activationMessage = generateActivationMessage(
          matchedSkills,
          rules.settings || {}
        )
        prefix += activationMessage
      }

      // Apply prefix if any
      if (prefix) {
        firstTextPart.text = prefix + userPrompt
      }
    },
  }
}
