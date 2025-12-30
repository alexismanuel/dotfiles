/**
 * Baseline management CLI commands for web-tester
 * 
 * Provides CLI interface for listing, approving, and rejecting baselines.
 */

const readline = require('readline');
const {
  listBaselines,
  approveBaseline,
  rejectBaseline,
  approveAllBaselines,
  getBaselineDir
} = require('./visual-diff');

/**
 * Print baselines status in a formatted way
 */
function printBaselinesStatus(baselineDir) {
  const dir = baselineDir || getBaselineDir();
  const { new: newBaselines, diff: diffBaselines, approved: approvedBaselines } = listBaselines(dir);

  console.log('\n\u{1F4F8} Visual Baselines Status');
  console.log('='.repeat(50));
  console.log(`Directory: ${dir}\n`);

  if (newBaselines.length > 0) {
    console.log('NEW (needs review):');
    newBaselines.forEach(b => {
      console.log(`  - ${b.name}.png`);
    });
    console.log();
  }

  if (diffBaselines.length > 0) {
    console.log('DIFF (needs review):');
    diffBaselines.forEach(b => {
      const pct = b.diffPercentage !== undefined 
        ? ` (${b.diffPercentage.toFixed(2)}% different)` 
        : '';
      console.log(`  - ${b.name}.png${pct}`);
    });
    console.log();
  }

  if (approvedBaselines.length > 0) {
    console.log('APPROVED:');
    approvedBaselines.forEach(b => {
      console.log(`  - ${b.name}.png`);
    });
    console.log();
  }

  const pendingCount = newBaselines.length + diffBaselines.length;
  if (pendingCount === 0 && approvedBaselines.length === 0) {
    console.log('No baselines found.\n');
  } else {
    console.log('-'.repeat(50));
    console.log(`Total: ${approvedBaselines.length} approved, ${pendingCount} pending review`);
  }

  console.log('='.repeat(50));

  return { newBaselines, diffBaselines, approvedBaselines };
}

/**
 * Prompt user for confirmation
 */
async function confirm(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Handle --list-baselines command
 */
async function handleListBaselines(baselineDir) {
  printBaselinesStatus(baselineDir);
}

/**
 * Handle --approve-baselines command (approve all with confirmation)
 */
async function handleApproveAll(baselineDir) {
  const dir = baselineDir || getBaselineDir();
  const { new: newBaselines, diff: diffBaselines } = listBaselines(dir);
  
  const pendingCount = newBaselines.length + diffBaselines.length;
  
  if (pendingCount === 0) {
    console.log('\nNo baselines pending approval.');
    return;
  }

  console.log('\nBaselines to approve:');
  [...newBaselines, ...diffBaselines].forEach(b => {
    const pct = b.diffPercentage !== undefined 
      ? ` (${b.diffPercentage.toFixed(2)}% different)` 
      : ' (new)';
    console.log(`  - ${b.name}${pct}`);
  });

  const confirmed = await confirm(`\nApprove ${pendingCount} baseline(s)?`);
  
  if (confirmed) {
    approveAllBaselines(dir);
  } else {
    console.log('Cancelled.');
  }
}

/**
 * Handle --approve-baseline <name> command
 */
async function handleApproveOne(name, baselineDir) {
  const dir = baselineDir || getBaselineDir();
  approveBaseline(name, dir);
}

/**
 * Handle --reject-baseline <name> command
 */
async function handleRejectOne(name, baselineDir) {
  const dir = baselineDir || getBaselineDir();
  rejectBaseline(name, dir);
}

/**
 * Parse and execute baseline CLI commands
 * @param {string[]} args - Command line arguments
 * @returns {boolean} True if a baseline command was handled
 */
async function handleBaselineCommands(args) {
  const baselineDir = process.env.VISUAL_BASELINE_DIR || getBaselineDir();

  if (args.includes('--list-baselines')) {
    await handleListBaselines(baselineDir);
    return true;
  }

  if (args.includes('--approve-baselines')) {
    await handleApproveAll(baselineDir);
    return true;
  }

  const approveIndex = args.indexOf('--approve-baseline');
  if (approveIndex !== -1) {
    const name = args[approveIndex + 1];
    if (!name || name.startsWith('--')) {
      console.error('Error: --approve-baseline requires a baseline name');
      console.error('Usage: --approve-baseline <name>');
      process.exit(1);
    }
    await handleApproveOne(name, baselineDir);
    return true;
  }

  const rejectIndex = args.indexOf('--reject-baseline');
  if (rejectIndex !== -1) {
    const name = args[rejectIndex + 1];
    if (!name || name.startsWith('--')) {
      console.error('Error: --reject-baseline requires a baseline name');
      console.error('Usage: --reject-baseline <name>');
      process.exit(1);
    }
    await handleRejectOne(name, baselineDir);
    return true;
  }

  return false;
}

module.exports = {
  handleBaselineCommands,
  printBaselinesStatus,
  handleListBaselines,
  handleApproveAll,
  handleApproveOne,
  handleRejectOne
};
