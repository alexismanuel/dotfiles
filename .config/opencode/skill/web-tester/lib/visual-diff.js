/**
 * Visual diff module for web-tester
 * 
 * Compares screenshots against baselines using perceptual diff.
 * Supports configurable threshold and baseline directory.
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

// Default configuration
const DEFAULT_THRESHOLD = 0.5; // 0.5% difference threshold
const DEFAULT_BASELINE_DIR = './visual-baselines';

/**
 * Get baseline directory from env or use default
 */
function getBaselineDir() {
  return process.env.VISUAL_BASELINE_DIR || DEFAULT_BASELINE_DIR;
}

/**
 * Ensure baseline directory exists
 */
function ensureBaselineDir(baselineDir) {
  if (!fs.existsSync(baselineDir)) {
    fs.mkdirSync(baselineDir, { recursive: true });
  }
}

/**
 * Get paths for baseline, current, and diff images
 */
function getPaths(name, baselineDir) {
  const dir = baselineDir || getBaselineDir();
  return {
    baseline: path.join(dir, `${name}.png`),
    current: path.join(dir, `${name}.current.png`),
    diff: path.join(dir, `${name}.diff.png`)
  };
}

/**
 * Read PNG file and return PNG object
 */
function readPNG(filePath) {
  const buffer = fs.readFileSync(filePath);
  return PNG.sync.read(buffer);
}

/**
 * Write PNG object to file
 */
function writePNG(filePath, png) {
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
}

/**
 * Compare a screenshot against baseline
 * 
 * @param {object} page - Playwright page
 * @param {string} name - Screenshot name (without extension)
 * @param {object} options - Options
 * @param {number} options.threshold - Diff threshold percentage (default 0.5)
 * @param {string} options.baselineDir - Baseline directory (default ./visual-baselines)
 * @param {boolean} options.fullPage - Take full page screenshot (default true)
 * @returns {object} Comparison result
 */
async function compareScreenshot(page, name, options = {}) {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const baselineDir = options.baselineDir || getBaselineDir();
  const fullPage = options.fullPage !== false;

  ensureBaselineDir(baselineDir);
  const paths = getPaths(name, baselineDir);

  // Take current screenshot
  const screenshotBuffer = await page.screenshot({ fullPage });
  const currentPNG = PNG.sync.read(screenshotBuffer);

  // Check if baseline exists
  if (!fs.existsSync(paths.baseline)) {
    // No baseline - save as new baseline (pending approval)
    fs.writeFileSync(paths.baseline, screenshotBuffer);
    
    console.log(`\u{1F4F8} New baseline created: ${name}`);
    console.log(`   Path: ${paths.baseline}`);
    console.log(`   Status: PENDING APPROVAL (new baseline)`);
    
    return {
      name,
      status: 'new',
      baselinePath: paths.baseline,
      message: 'New baseline created, needs approval'
    };
  }

  // Baseline exists - compare
  const baselinePNG = readPNG(paths.baseline);

  // Check dimensions match
  if (currentPNG.width !== baselinePNG.width || currentPNG.height !== baselinePNG.height) {
    // Save current for review
    fs.writeFileSync(paths.current, screenshotBuffer);
    
    console.log(`\u2717 Visual diff FAILED: ${name}`);
    console.log(`   Reason: Dimension mismatch`);
    console.log(`   Baseline: ${baselinePNG.width}x${baselinePNG.height}`);
    console.log(`   Current: ${currentPNG.width}x${currentPNG.height}`);
    console.log(`   Current saved to: ${paths.current}`);
    
    return {
      name,
      status: 'failed',
      reason: 'dimension_mismatch',
      baseline: { width: baselinePNG.width, height: baselinePNG.height },
      current: { width: currentPNG.width, height: currentPNG.height },
      currentPath: paths.current
    };
  }

  // Create diff image
  const { width, height } = baselinePNG;
  const diffPNG = new PNG({ width, height });

  // Run pixelmatch
  const diffPixels = pixelmatch(
    baselinePNG.data,
    currentPNG.data,
    diffPNG.data,
    width,
    height,
    { threshold: 0.1 } // pixelmatch threshold (color sensitivity)
  );

  const totalPixels = width * height;
  const diffPercentage = (diffPixels / totalPixels) * 100;
  const passed = diffPercentage <= threshold;

  if (passed) {
    // Clean up any previous diff/current files
    if (fs.existsSync(paths.current)) fs.unlinkSync(paths.current);
    if (fs.existsSync(paths.diff)) fs.unlinkSync(paths.diff);

    console.log(`\u2713 Visual diff PASSED: ${name}`);
    console.log(`   Difference: ${diffPercentage.toFixed(3)}% (threshold: ${threshold}%)`);
    
    return {
      name,
      status: 'passed',
      diffPercentage,
      threshold
    };
  } else {
    // Save current and diff for review
    fs.writeFileSync(paths.current, screenshotBuffer);
    writePNG(paths.diff, diffPNG);

    console.log(`\u2717 Visual diff FAILED: ${name}`);
    console.log(`   Difference: ${diffPercentage.toFixed(3)}% (threshold: ${threshold}%)`);
    console.log(`   Baseline: ${paths.baseline}`);
    console.log(`   Current: ${paths.current}`);
    console.log(`   Diff: ${paths.diff}`);
    
    return {
      name,
      status: 'failed',
      reason: 'threshold_exceeded',
      diffPercentage,
      threshold,
      baselinePath: paths.baseline,
      currentPath: paths.current,
      diffPath: paths.diff
    };
  }
}

/**
 * List all baselines and their status
 */
function listBaselines(baselineDir) {
  const dir = baselineDir || getBaselineDir();
  
  if (!fs.existsSync(dir)) {
    return { baselines: [], new: [], diff: [], approved: [] };
  }

  const files = fs.readdirSync(dir);
  const baselineFiles = files.filter(f => 
    f.endsWith('.png') && 
    !f.endsWith('.current.png') && 
    !f.endsWith('.diff.png')
  );

  const baselines = [];
  const newBaselines = [];
  const diffBaselines = [];
  const approvedBaselines = [];

  baselineFiles.forEach(file => {
    const name = file.replace('.png', '');
    const paths = getPaths(name, dir);
    
    const hasCurrent = fs.existsSync(paths.current);
    const hasDiff = fs.existsSync(paths.diff);

    let status, diffPercentage;

    if (hasDiff) {
      // Has diff - needs review
      status = 'diff';
      
      // Try to calculate diff percentage
      try {
        const baseline = readPNG(paths.baseline);
        const current = readPNG(paths.current);
        
        if (baseline.width === current.width && baseline.height === current.height) {
          const diffPixels = pixelmatch(
            baseline.data,
            current.data,
            null,
            baseline.width,
            baseline.height,
            { threshold: 0.1 }
          );
          diffPercentage = (diffPixels / (baseline.width * baseline.height)) * 100;
        }
      } catch (e) {
        // Ignore errors in diff calculation
      }
      
      diffBaselines.push({ name, diffPercentage });
    } else if (hasCurrent) {
      // Has current but no diff - likely new or dimension mismatch
      status = 'new';
      newBaselines.push({ name });
    } else {
      // Only baseline exists - approved
      status = 'approved';
      approvedBaselines.push({ name });
    }

    baselines.push({ name, status, diffPercentage, paths });
  });

  // Also check for .current.png files without matching baseline (new baselines)
  const currentFiles = files.filter(f => f.endsWith('.current.png'));
  currentFiles.forEach(file => {
    const name = file.replace('.current.png', '');
    if (!baselineFiles.includes(`${name}.png`)) {
      newBaselines.push({ name, pendingOnly: true });
    }
  });

  return {
    baselines,
    new: newBaselines,
    diff: diffBaselines,
    approved: approvedBaselines
  };
}

/**
 * Approve a baseline (make current the new baseline)
 */
function approveBaseline(name, baselineDir) {
  const dir = baselineDir || getBaselineDir();
  const paths = getPaths(name, dir);

  if (fs.existsSync(paths.current)) {
    // Replace baseline with current
    fs.copyFileSync(paths.current, paths.baseline);
    fs.unlinkSync(paths.current);
    
    // Clean up diff if exists
    if (fs.existsSync(paths.diff)) {
      fs.unlinkSync(paths.diff);
    }
    
    console.log(`\u2713 Approved: ${name}`);
    return { success: true, name };
  } else if (fs.existsSync(paths.baseline)) {
    // Baseline exists but no current - already approved
    console.log(`\u2139 Already approved: ${name}`);
    return { success: true, name, message: 'Already approved' };
  } else {
    console.log(`\u2717 Not found: ${name}`);
    return { success: false, name, error: 'Baseline not found' };
  }
}

/**
 * Reject a baseline (delete current and diff, keep old baseline)
 */
function rejectBaseline(name, baselineDir) {
  const dir = baselineDir || getBaselineDir();
  const paths = getPaths(name, dir);

  let deleted = false;

  if (fs.existsSync(paths.current)) {
    fs.unlinkSync(paths.current);
    deleted = true;
  }

  if (fs.existsSync(paths.diff)) {
    fs.unlinkSync(paths.diff);
    deleted = true;
  }

  if (deleted) {
    console.log(`\u2713 Rejected: ${name}`);
    return { success: true, name };
  } else {
    console.log(`\u2139 Nothing to reject: ${name}`);
    return { success: true, name, message: 'Nothing to reject' };
  }
}

/**
 * Approve all pending baselines
 */
function approveAllBaselines(baselineDir) {
  const dir = baselineDir || getBaselineDir();
  const { new: newBaselines, diff: diffBaselines } = listBaselines(dir);
  
  const toApprove = [...newBaselines, ...diffBaselines];
  
  if (toApprove.length === 0) {
    console.log('No baselines pending approval.');
    return { approved: 0 };
  }

  const results = toApprove.map(b => approveBaseline(b.name, dir));
  const approved = results.filter(r => r.success).length;
  
  console.log(`\nApproved ${approved}/${toApprove.length} baselines.`);
  return { approved, total: toApprove.length, results };
}

module.exports = {
  compareScreenshot,
  listBaselines,
  approveBaseline,
  rejectBaseline,
  approveAllBaselines,
  getBaselineDir,
  DEFAULT_THRESHOLD,
  DEFAULT_BASELINE_DIR
};
