const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const extensionPath = path.resolve(__dirname, '..', 'extension');
const casesDir = path.resolve(__dirname, 'cases');

test.describe('Chat Assistant Extension', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    let serviceWorker;
    if (context.serviceWorkers().length === 0) {
      serviceWorker = await context.waitForEvent('serviceworker');
    } else {
      serviceWorker = context.serviceWorkers()[0];
    }
    extensionId = serviceWorker.url().split('/')[2];
  });

  test.afterAll(async () => {
    await context.close();
  });

  // Load all test cases from the cases/ directory
  const caseFiles = fs.readdirSync(casesDir).filter(f => f.endsWith('.js')).sort();
  for (const file of caseFiles) {
    const register = require(path.join(casesDir, file));
    register({
      test,
      expect,
      getContext: () => context,
      getExtensionId: () => extensionId,
    });
  }
});
