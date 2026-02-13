import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";

export default function (pi: ExtensionAPI) {
  pi.registerCommand("reflect", {
    description: "Analyze session feedback and update system configuration",
    handler: async (_args, ctx) => {
      const entries = ctx.sessionManager.getEntries();
      
      // Get relevant context from session
      const recentMessages = entries
        .slice(-20)
        .filter(e => e.type === "message")
        .map(e => {
          if (e.type === "message") {
            const text = e.message.content
              .filter(c => c.type === "text")
              .map(c => c.text)
              .join("");
            return `${e.message.role}: ${text.substring(0, 500)}`;
          }
          return "";
        })
        .join("\n\n");

      // Send message to LLM to analyze and suggest updates
      const analysisPrompt = `Analyze this session and identify concrete improvements needed in my system configuration.

Recent conversation:
${recentMessages}

Look for:
1. Explicit feedback given to the assistant (corrections, clarifications)
2. Implicit patterns (things that were done wrong then fixed)
3. Missing conventions or unclear guidelines

Output a JSON object with these fields:
{
  "summary": "Brief description of what was learned",
  "filesToUpdate": [
    {
      "path": "relative/path/to/file",
      "reason": "Why this file needs updating",
      "suggestedChange": "Specific text to add or modify"
    }
  ],
  "newConventions": ["List of new conventions to establish"]
}`;

      // Inject the analysis request as a system message
      pi.sendMessage({
        customType: "reflect-request",
        content: analysisPrompt,
        display: false,
      }, { triggerTurn: true });

      ctx.ui.notify("Reflection analysis triggered — check the LLM response for suggested updates", "info");
    },
  });

  // Tool to apply reflection updates
  pi.registerTool({
    name: "apply_reflection",
    label: "Apply Reflection Updates",
    description: "Apply suggested updates to system configuration files based on session reflection",
    parameters: {
      type: "object",
      properties: {
        updates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              filePath: { type: "string", description: "Path to file relative to ~/.pi/agent/" },
              searchText: { type: "string", description: "Exact text to find (for edit mode)" },
              newText: { type: "string", description: "New text to insert or replace with" },
              mode: { 
                type: "string", 
                enum: ["append", "edit", "create"],
                description: "append: add to end, edit: replace searchText, create: new file"
              },
            },
            required: ["filePath", "newText", "mode"]
          }
        }
      },
      required: ["updates"]
    },
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const baseDir = path.join(process.env.HOME || "", ".pi", "agent");
      const results: string[] = [];

      for (const update of params.updates) {
        const fullPath = path.join(baseDir, update.filePath);
        
        try {
          if (update.mode === "create") {
            // Ensure directory exists
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(fullPath, update.newText, "utf-8");
            results.push(`✅ Created: ${update.filePath}`);
          } else if (update.mode === "append") {
            const existing = fs.existsSync(fullPath) 
              ? fs.readFileSync(fullPath, "utf-8") 
              : "";
            fs.writeFileSync(fullPath, existing + "\n" + update.newText, "utf-8");
            results.push(`✅ Appended to: ${update.filePath}`);
          } else if (update.mode === "edit") {
            if (!update.searchText) {
              results.push(`❌ Missing searchText for edit: ${update.filePath}`);
              continue;
            }
            const existing = fs.readFileSync(fullPath, "utf-8");
            if (!existing.includes(update.searchText)) {
              results.push(`⚠️ Search text not found in: ${update.filePath}`);
              continue;
            }
            const newContent = existing.replace(update.searchText, update.newText);
            fs.writeFileSync(fullPath, newContent, "utf-8");
            results.push(`✅ Edited: ${update.filePath}`);
          }
        } catch (error) {
          results.push(`❌ Error with ${update.filePath}: ${error}`);
        }
      }

      return {
        content: [{ 
          type: "text", 
          text: results.join("\n") 
        }],
        details: { results }
      };
    }
  });
}
