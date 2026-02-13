/**
 * Lightweight assertion collector for web-tester
 * 
 * Collects all assertions without stopping on failure.
 * Reports all results at the end.
 */

const fs = require('fs');
const path = require('path');

const RESULTS_FILE = '/tmp/test-results.json';

/**
 * Load existing results from file
 */
function loadResults() {
  try {
    if (fs.existsSync(RESULTS_FILE)) {
      return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
    }
  } catch (e) {
    // Ignore parse errors, start fresh
  }
  return { runs: [] };
}

/**
 * Save results to file
 */
function saveResults(results) {
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

/**
 * Create a new test instance for collecting assertions
 * @param {string} name - Test name/description
 * @returns {object} Test instance with assertion methods
 */
function createTest(name) {
  const assertions = [];
  const startTime = Date.now();

  const test = {
    name,

    /**
     * Basic assertion
     * @param {boolean} condition - Condition to test
     * @param {string} description - Description of what's being tested
     */
    assert(condition, description) {
      assertions.push({
        description,
        passed: !!condition,
        error: condition ? null : 'Assertion failed'
      });
      
      const icon = condition ? '\u2713' : '\u2717';
      console.log(`  ${icon} ${description}`);
    },

    /**
     * Assert element is visible on page
     * @param {object} page - Playwright page
     * @param {string} selector - CSS selector
     * @param {string} description - Description
     */
    async assertVisible(page, selector, description) {
      try {
        const element = await page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 5000 });
        
        assertions.push({
          description,
          passed: isVisible,
          error: isVisible ? null : `Element "${selector}" not visible`
        });
        
        const icon = isVisible ? '\u2713' : '\u2717';
        console.log(`  ${icon} ${description}`);
      } catch (e) {
        assertions.push({
          description,
          passed: false,
          error: e.message
        });
        console.log(`  \u2717 ${description} (${e.message})`);
      }
    },

    /**
     * Assert element contains expected text
     * @param {object} page - Playwright page
     * @param {string} selector - CSS selector
     * @param {string} expected - Expected text (substring match)
     * @param {string} description - Description
     */
    async assertText(page, selector, expected, description) {
      try {
        const element = await page.locator(selector).first();
        const text = await element.textContent({ timeout: 5000 });
        const passed = text && text.includes(expected);
        
        assertions.push({
          description,
          passed,
          error: passed ? null : `Expected "${expected}", got "${text}"`
        });
        
        const icon = passed ? '\u2713' : '\u2717';
        console.log(`  ${icon} ${description}`);
      } catch (e) {
        assertions.push({
          description,
          passed: false,
          error: e.message
        });
        console.log(`  \u2717 ${description} (${e.message})`);
      }
    },

    /**
     * Assert current URL matches expected
     * @param {object} page - Playwright page
     * @param {string|RegExp} expected - Expected URL or pattern
     * @param {string} description - Description
     */
    async assertUrl(page, expected, description) {
      const currentUrl = page.url();
      let passed;
      
      if (expected instanceof RegExp) {
        passed = expected.test(currentUrl);
      } else {
        passed = currentUrl.includes(expected);
      }
      
      assertions.push({
        description,
        passed,
        error: passed ? null : `Expected URL "${expected}", got "${currentUrl}"`
      });
      
      const icon = passed ? '\u2713' : '\u2717';
      console.log(`  ${icon} ${description}`);
    },

    /**
     * Assert element count matches expected
     * @param {object} page - Playwright page
     * @param {string} selector - CSS selector
     * @param {number} expected - Expected count
     * @param {string} description - Description
     */
    async assertCount(page, selector, expected, description) {
      try {
        const count = await page.locator(selector).count();
        const passed = count === expected;
        
        assertions.push({
          description,
          passed,
          error: passed ? null : `Expected ${expected} elements, found ${count}`
        });
        
        const icon = passed ? '\u2713' : '\u2717';
        console.log(`  ${icon} ${description}`);
      } catch (e) {
        assertions.push({
          description,
          passed: false,
          error: e.message
        });
        console.log(`  \u2717 ${description} (${e.message})`);
      }
    },

    /**
     * Assert element has specific attribute value
     * @param {object} page - Playwright page
     * @param {string} selector - CSS selector
     * @param {string} attribute - Attribute name
     * @param {string} expected - Expected value
     * @param {string} description - Description
     */
    async assertAttribute(page, selector, attribute, expected, description) {
      try {
        const element = await page.locator(selector).first();
        const value = await element.getAttribute(attribute, { timeout: 5000 });
        const passed = value === expected;
        
        assertions.push({
          description,
          passed,
          error: passed ? null : `Expected ${attribute}="${expected}", got "${value}"`
        });
        
        const icon = passed ? '\u2713' : '\u2717';
        console.log(`  ${icon} ${description}`);
      } catch (e) {
        assertions.push({
          description,
          passed: false,
          error: e.message
        });
        console.log(`  \u2717 ${description} (${e.message})`);
      }
    },

    /**
     * Finish the test, save results, and print summary
     * @returns {object} Test results
     */
    async finish() {
      const duration = Date.now() - startTime;
      const passed = assertions.filter(a => a.passed).length;
      const failed = assertions.filter(a => !a.passed).length;
      
      const result = {
        name,
        timestamp: new Date().toISOString(),
        duration,
        passed,
        failed,
        assertions
      };

      // Save to results file
      const results = loadResults();
      results.runs.push(result);
      saveResults(results);

      // Print summary
      console.log('\n' + '='.repeat(50));
      console.log(`Test: ${name}`);
      console.log(`Duration: ${duration}ms`);
      console.log(`Results: ${passed} passed, ${failed} failed`);
      console.log('='.repeat(50));

      if (failed > 0) {
        console.log('\nFailures:');
        assertions.filter(a => !a.passed).forEach(a => {
          console.log(`  - ${a.description}: ${a.error}`);
        });
      }

      return result;
    }
  };

  console.log(`\nRunning: ${name}`);
  console.log('-'.repeat(50));

  return test;
}

/**
 * Print summary of all test runs from results file
 */
function printResultsSummary() {
  const results = loadResults();
  
  if (results.runs.length === 0) {
    console.log('No test results found.');
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));

  let totalPassed = 0;
  let totalFailed = 0;

  results.runs.forEach((run, index) => {
    const status = run.failed > 0 ? '\u2717' : '\u2713';
    console.log(`${status} ${run.name} (${run.passed}/${run.passed + run.failed}) - ${run.duration}ms`);
    totalPassed += run.passed;
    totalFailed += run.failed;
  });

  console.log('-'.repeat(60));
  console.log(`Total: ${totalPassed} passed, ${totalFailed} failed across ${results.runs.length} tests`);
  console.log('='.repeat(60));
}

/**
 * Clear all test results
 */
function clearResults() {
  if (fs.existsSync(RESULTS_FILE)) {
    fs.unlinkSync(RESULTS_FILE);
    console.log('Test results cleared.');
  }
}

module.exports = {
  createTest,
  printResultsSummary,
  clearResults,
  loadResults,
  RESULTS_FILE
};
