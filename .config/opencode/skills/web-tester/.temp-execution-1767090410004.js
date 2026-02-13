
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
    
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('https://example.com');
await compareScreenshot(page, 'example-homepage', { threshold: 0.5 });

await browser.close();

  } catch (error) {
    console.error('✗ Test error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
})();
