import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * Enforce Skill Plugin
 *
 * This plugin analyzes user messages and automatically suggests relevant skills
 * based on keyword matching and intent pattern detection.
 *
 * Configuration is loaded from skill-rules.json which defines:
 * - Keywords that trigger skill suggestions
 * - Regex intent patterns for flexible matching
 * - Priority levels for skill ordering
 * - File path triggers (optional)
 */

/**
 * Load skill rules from JSON configuration
 */
function loadSkillRules(configDir) {
  const rulesPath = join(configDir, 'skill-rules.json')

  if (!existsSync(rulesPath)) {
    console.error(`[enforce-skill] skill-rules.json not found at ${rulesPath}`)
    return null
  }

  try {
    const content = readFileSync(rulesPath, 'utf-8')
    return JSON.parse(content)
  } catch (err) {
    console.error(`[enforce-skill] Error loading skill-rules.json:`, err)
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

export const EnforceSkillPlugin = async ({ project, client, $, directory, worktree }) => {
  // Determine config directory - use global config location
  const configDir = process.env.HOME
    ? join(process.env.HOME, '.config', 'opencode')
    : directory

  // Load rules once at plugin init
  const rules = loadSkillRules(configDir)

  if (!rules) {
    console.error('[enforce-skill] Plugin disabled - no valid skill-rules.json found')
    return {}
  }

  console.log(`[enforce-skill] Loaded ${Object.keys(rules.skills).length} skill rules`)

  return {
    /**
     * Hook: chat.message
     * Called when a new message is received from the user.
     * Analyzes the prompt and injects skill activation suggestions.
     */
    "chat.message": async (input, output) => {
      // Find the first text part to get the user's prompt
      const firstTextPart = output.parts.find(part => part.type === "text")

      if (!firstTextPart) return

      const userPrompt = firstTextPart.text

      // Match skills based on prompt
      const matchedSkills = matchSkills(userPrompt, rules)

      if (matchedSkills.length > 0) {
        // Generate and prepend activation message
        const activationMessage = generateActivationMessage(
          matchedSkills,
          rules.settings || {}
        )
        firstTextPart.text = activationMessage + userPrompt
      }
      // If no skills matched, don't modify the message
    },
  }
}
