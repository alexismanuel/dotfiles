#!/usr/bin/env node
/**
 * Web Tester - Universal Executor
 *
 * Executes Playwright test code with support for:
 * - File path: node run.js script.js
 * - Inline code: node run.js 'await page.goto("...")'
 * - Stdin: cat script.js | node run.js
 * 
 * CLI Commands:
 * - --list-baselines: Show visual baseline status
 * - --approve-baselines: Approve all pending baselines
 * - --approve-baseline <name>: Approve specific baseline
 * - --reject-baseline <name>: Reject specific baseline
 * - --clear-results: Clear test results file
 * - --show-results: Show test results summary
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Change to skill directory for proper module resolution
process.chdir(__dirname);

/**
 * Check if Playwright is installed
 */
function checkPlaywrightInstalled() {
  try {
    require.resolve('playwright');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Install Playwright if missing
 */
function installPlaywright() {
  console.log('\u{1F4E6} Playwright not found. Installing...');
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    execSync('npx playwright install chromium', { stdio: 'inherit', cwd: __dirname });
    console.log('\u2713 Playwright installed successfully');
    return true;
  } catch (e) {
    console.error('\u2717 Failed to install Playwright:', e.message);
    console.error('Please run manually: cd', __dirname, '&& npm run setup');
    return false;
  }
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
Web Tester - Frontend Testing with Playwright

Usage:
  node run.js <script.js>              Execute test file
  node run.js "<inline code>"          Execute inline code
  cat script.js | node run.js          Execute from stdin

Commands:
  --list-baselines                     Show visual baseline status
  --approve-baselines                  Approve all pending baselines (with confirmation)
  --approve-baseline <name>            Approve specific baseline
  --reject-baseline <name>             Reject specific baseline
  --clear-results                      Clear test results file
  --show-results                       Show test results summary
  --help                               Show this help message

Environment Variables:
  VISUAL_BASELINE_DIR                  Baseline directory (default: ./visual-baselines)
  HEADLESS                             Run browser headless (default: false)
  SLOW_MO                              Slow down actions by ms
  PW_HEADER_NAME + PW_HEADER_VALUE     Add custom HTTP header
  PW_EXTRA_HEADERS                     JSON object of extra headers

Examples:
  node run.js /tmp/test-login.js
  node run.js --list-baselines
  node run.js --approve-baseline homepage
`);
}

/**
 * Handle CLI commands
 */
async function handleCLICommands(args) {
  // Help
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return true;
  }

  // Clear results
  if (args.includes('--clear-results')) {
    const { clearResults } = require('./lib/assertions');
    clearResults();
    return true;
  }

  // Show results
  if (args.includes('--show-results')) {
    const { printResultsSummary } = require('./lib/assertions');
    printResultsSummary();
    return true;
  }

  // Baseline commands
  const { handleBaselineCommands } = require('./lib/baselines');
  if (await handleBaselineCommands(args)) {
    return true;
  }

  return false;
}

/**
 * Get code to execute from various sources
 */
function getCodeToExecute(args) {
  // Filter out CLI flags
  const codeArgs = args.filter(a => !a.startsWith('--'));

  // Case 1: File path provided
  if (codeArgs.length > 0 && fs.existsSync(codeArgs[0])) {
    const filePath = path.resolve(codeArgs[0]);
    console.log(`\u{1F4C4} Executing file: ${filePath}`);
    return fs.readFileSync(filePath, 'utf8');
  }

  // Case 2: Inline code provided as argument
  if (codeArgs.length > 0) {
    console.log('\u26A1 Executing inline code');
    return codeArgs.join(' ');
  }

  // Case 3: Code from stdin
  if (!process.stdin.isTTY) {
    console.log('\u{1F4E5} Reading from stdin');
    return fs.readFileSync(0, 'utf8');
  }

  return null;
}

/**
 * Clean up old temporary execution files
 */
function cleanupOldTempFiles() {
  try {
    const files = fs.readdirSync(__dirname);
    const tempFiles = files.filter(f => f.startsWith('.temp-execution-') && f.endsWith('.js'));
    tempFiles.forEach(file => {
      try {
        fs.unlinkSync(path.join(__dirname, file));
      } catch (e) {
        // Ignore
      }
    });
  } catch (e) {
    // Ignore
  }
}

/**
 * Wrap code in async IIFE if needed
 */
function wrapCodeIfNeeded(code) {
  const hasRequire = code.includes('require(');
  const hasAsyncIIFE = code.includes('(async () => {') || code.includes('(async()=>{');

  // Already a complete script
  if (hasRequire && hasAsyncIIFE) {
    return code;
  }

  // Just Playwright commands - wrap in full template
  if (!hasRequire) {
    return `
const { chromium, firefox, webkit, devices } = require('playwright');
const helpers = require('./lib/helpers');

// Re-export for convenience
const { 
  createTest, 
  compareScreenshot, 
  detectDevServers,
  safeClick,
  safeType,
  takeScreenshot,
  printResultsSummary
} = helpers;

(async () => {
  try {
    ${code}
  } catch (error) {
    console.error('\u2717 Test error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
})();
`;
  }

  // Has require but no async wrapper
  if (!hasAsyncIIFE) {
    return `
(async () => {
  try {
    ${code}
  } catch (error) {
    console.error('\u2717 Test error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
})();
`;
  }

  return code;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  // Handle CLI commands first
  if (await handleCLICommands(args)) {
    return;
  }

  console.log('\u{1F9EA} Web Tester\n');

  // Clean up old temp files
  cleanupOldTempFiles();

  // Check Playwright installation
  if (!checkPlaywrightInstalled()) {
    const installed = installPlaywright();
    if (!installed) {
      process.exit(1);
    }
  }

  // Get code to execute
  const rawCode = getCodeToExecute(args);
  
  if (!rawCode) {
    printHelp();
    process.exit(0);
  }

  const code = wrapCodeIfNeeded(rawCode);

  // Create temporary file for execution
  const tempFile = path.join(__dirname, `.temp-execution-${Date.now()}.js`);

  try {
    fs.writeFileSync(tempFile, code, 'utf8');
    console.log('\u{1F680} Starting test...\n');
    require(tempFile);
  } catch (error) {
    console.error('\u2717 Execution failed:', error.message);
    if (error.stack) {
      console.error('\n\u{1F4CB} Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run
main().catch(error => {
  console.error('\u2717 Fatal error:', error.message);
  process.exit(1);
});
