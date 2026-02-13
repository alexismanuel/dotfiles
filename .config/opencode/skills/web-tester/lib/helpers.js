/**
 * Helper utilities for web-tester
 * 
 * Provides common browser automation utilities plus integration
 * with assertions and visual diff modules.
 */

const { chromium, firefox, webkit } = require('playwright');
const http = require('http');

// Re-export assertion and visual-diff modules
const assertions = require('./assertions');
const visualDiff = require('./visual-diff');

/**
 * Parse extra HTTP headers from environment variables.
 * Supports two formats:
 * - PW_HEADER_NAME + PW_HEADER_VALUE: Single header
 * - PW_EXTRA_HEADERS: JSON object for multiple headers
 */
function getExtraHeadersFromEnv() {
  const headerName = process.env.PW_HEADER_NAME;
  const headerValue = process.env.PW_HEADER_VALUE;

  if (headerName && headerValue) {
    return { [headerName]: headerValue };
  }

  const headersJson = process.env.PW_EXTRA_HEADERS;
  if (headersJson) {
    try {
      const parsed = JSON.parse(headersJson);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse PW_EXTRA_HEADERS:', e.message);
    }
  }

  return null;
}

/**
 * Launch browser with standard configuration
 */
async function launchBrowser(browserType = 'chromium', options = {}) {
  const defaultOptions = {
    headless: process.env.HEADLESS === 'true' ? true : false,
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };
  
  const browsers = { chromium, firefox, webkit };
  const browser = browsers[browserType];
  
  if (!browser) {
    throw new Error(`Invalid browser type: ${browserType}`);
  }
  
  return await browser.launch({ ...defaultOptions, ...options });
}

/**
 * Create browser context with common settings
 */
async function createContext(browser, options = {}) {
  const envHeaders = getExtraHeadersFromEnv();

  const mergedHeaders = {
    ...envHeaders,
    ...options.extraHTTPHeaders
  };

  const defaultOptions = {
    viewport: { width: 1280, height: 720 },
    userAgent: options.mobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
      : undefined,
    locale: options.locale || 'en-US',
    timezoneId: options.timezoneId || 'America/New_York',
    ...(Object.keys(mergedHeaders).length > 0 && { extraHTTPHeaders: mergedHeaders })
  };

  return await browser.newContext({ ...defaultOptions, ...options });
}

/**
 * Create a new page with default settings
 */
async function createPage(context, options = {}) {
  const page = await context.newPage();
  
  if (options.viewport) {
    await page.setViewportSize(options.viewport);
  }
  
  page.setDefaultTimeout(options.timeout || 30000);
  
  return page;
}

/**
 * Detect running dev servers on common ports
 */
async function detectDevServers(customPorts = []) {
  const commonPorts = [3000, 3001, 3002, 5173, 8080, 8000, 4200, 5000, 9000, 1234];
  const allPorts = [...new Set([...commonPorts, ...customPorts])];
  const detectedServers = [];

  console.log('\u{1F50D} Checking for running dev servers...');

  for (const port of allPorts) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: port,
          path: '/',
          method: 'HEAD',
          timeout: 500
        }, (res) => {
          if (res.statusCode < 500) {
            detectedServers.push(`http://localhost:${port}`);
            console.log(`  \u2713 Found server on port ${port}`);
          }
          resolve();
        });

        req.on('error', () => resolve());
        req.on('timeout', () => {
          req.destroy();
          resolve();
        });

        req.end();
      });
    } catch (e) {
      // Port not available
    }
  }

  if (detectedServers.length === 0) {
    console.log('  \u2717 No dev servers detected');
  }

  return detectedServers;
}

/**
 * Safe click with retry logic
 */
async function safeClick(page, selector, options = {}) {
  const maxRetries = options.retries || 3;
  const retryDelay = options.retryDelay || 1000;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.waitForSelector(selector, { 
        state: 'visible',
        timeout: options.timeout || 5000 
      });
      await page.click(selector, {
        force: options.force || false,
        timeout: options.timeout || 5000
      });
      return true;
    } catch (e) {
      if (i === maxRetries - 1) {
        throw e;
      }
      console.log(`Retry ${i + 1}/${maxRetries} for clicking ${selector}`);
      await page.waitForTimeout(retryDelay);
    }
  }
}

/**
 * Safe text input with clear before type
 */
async function safeType(page, selector, text, options = {}) {
  await page.waitForSelector(selector, { 
    state: 'visible',
    timeout: options.timeout || 10000 
  });
  
  if (options.clear !== false) {
    await page.fill(selector, '');
  }
  
  if (options.slow) {
    await page.type(selector, text, { delay: options.delay || 100 });
  } else {
    await page.fill(selector, text);
  }
}

/**
 * Wait for page to be ready
 */
async function waitForPageReady(page, options = {}) {
  const waitUntil = options.waitUntil || 'networkidle';
  const timeout = options.timeout || 30000;
  
  try {
    await page.waitForLoadState(waitUntil, { timeout });
  } catch (e) {
    console.warn('Page load timeout, continuing...');
  }
  
  if (options.waitForSelector) {
    await page.waitForSelector(options.waitForSelector, { timeout });
  }
}

/**
 * Take screenshot with timestamp
 */
async function takeScreenshot(page, name, options = {}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = options.path || `/tmp/${name}-${timestamp}.png`;
  
  await page.screenshot({
    path: filename,
    fullPage: options.fullPage !== false,
    ...options
  });
  
  console.log(`\u{1F4F8} Screenshot saved: ${filename}`);
  return filename;
}

/**
 * Handle cookie banners
 */
async function handleCookieBanner(page, timeout = 3000) {
  const selectors = [
    'button:has-text("Accept")',
    'button:has-text("Accept all")',
    'button:has-text("OK")',
    'button:has-text("Got it")',
    'button:has-text("I agree")',
    '.cookie-accept',
    '#cookie-accept'
  ];
  
  for (const selector of selectors) {
    try {
      const element = await page.waitForSelector(selector, { 
        timeout: timeout / selectors.length,
        state: 'visible'
      });
      if (element) {
        await element.click();
        console.log('Cookie banner dismissed');
        return true;
      }
    } catch (e) {
      // Continue
    }
  }
  
  return false;
}

/**
 * Extract text from multiple elements
 */
async function extractTexts(page, selector) {
  await page.waitForSelector(selector, { timeout: 10000 });
  return await page.$$eval(selector, elements => 
    elements.map(el => el.textContent?.trim()).filter(Boolean)
  );
}

/**
 * Extract table data
 */
async function extractTableData(page, tableSelector) {
  await page.waitForSelector(tableSelector);
  
  return await page.evaluate((selector) => {
    const table = document.querySelector(selector);
    if (!table) return null;
    
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => 
      th.textContent?.trim()
    );
    
    const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
      const cells = Array.from(tr.querySelectorAll('td'));
      if (headers.length > 0) {
        return cells.reduce((obj, cell, index) => {
          obj[headers[index] || `column_${index}`] = cell.textContent?.trim();
          return obj;
        }, {});
      } else {
        return cells.map(cell => cell.textContent?.trim());
      }
    });
    
    return { headers, rows };
  }, tableSelector);
}

/**
 * Scroll page
 */
async function scrollPage(page, direction = 'down', distance = 500) {
  switch (direction) {
    case 'down':
      await page.evaluate(d => window.scrollBy(0, d), distance);
      break;
    case 'up':
      await page.evaluate(d => window.scrollBy(0, -d), distance);
      break;
    case 'top':
      await page.evaluate(() => window.scrollTo(0, 0));
      break;
    case 'bottom':
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      break;
  }
  await page.waitForTimeout(300);
}

// Export everything
module.exports = {
  // Browser helpers
  launchBrowser,
  createContext,
  createPage,
  detectDevServers,
  getExtraHeadersFromEnv,
  
  // Interaction helpers
  safeClick,
  safeType,
  waitForPageReady,
  takeScreenshot,
  handleCookieBanner,
  scrollPage,
  
  // Data extraction
  extractTexts,
  extractTableData,
  
  // Assertions (re-exported)
  createTest: assertions.createTest,
  printResultsSummary: assertions.printResultsSummary,
  clearResults: assertions.clearResults,
  
  // Visual diff (re-exported)
  compareScreenshot: visualDiff.compareScreenshot,
  listBaselines: visualDiff.listBaselines,
  approveBaseline: visualDiff.approveBaseline,
  rejectBaseline: visualDiff.rejectBaseline,
  approveAllBaselines: visualDiff.approveAllBaselines
};
