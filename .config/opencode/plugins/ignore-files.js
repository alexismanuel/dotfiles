import ignore from 'ignore';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const FileProtection = async ({ project, client, $, directory, worktree }) => {
  let ig = ignore();

  // Load global ignore
  const globalIgnorePath = path.join(os.homedir(), '.config', 'opencode', '.opencodeignore');
  if (fs.existsSync(globalIgnorePath)) {
    ig.add(fs.readFileSync(globalIgnorePath, 'utf-8'));
  }

  // Load local ignore
  const localIgnorePath = path.join(directory, '.opencodeignore');
  if (fs.existsSync(localIgnorePath)) {
    ig.add(fs.readFileSync(localIgnorePath, 'utf-8'));
  }

  return {
    "tool.execute.before": async (input, output) => {
      // Only block read operations - this is the critical security control
      if (input.tool === "read" && output.args.filePath) {
        const relativePath = path.relative(directory, output.args.filePath);

        if (ig.ignores(relativePath)) {
          throw new Error(`Access denied: ${relativePath} is protected`);
        }
      }
    }
  };
};
