module.exports = function ({ test, expect, getContext, getExtensionId }) {
  test('settings save and load', async () => {
    const page = await getContext().newPage();
    await page.goto(`chrome-extension://${getExtensionId()}/settings.html`);

    await page.click('.tab[data-tab="llm"]');
    await page.fill('#apiUrl', 'https://my-api.example.com/v1');
    await page.fill('#apiToken', 'test-token-123');
    await page.fill('#model', 'gpt-4o');

    await page.click('#saveBtn');

    await expect(page.locator('#status')).toBeVisible();

    const stored = await page.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.local.get(['apiUrl', 'apiToken', 'model'], resolve);
      });
    });
    expect(stored.apiUrl).toBe('https://my-api.example.com/v1');
    expect(stored.apiToken).toBe('test-token-123');
    expect(stored.model).toBe('gpt-4o');

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await page.click('.tab[data-tab="llm"]');
    await expect(page.locator('#apiUrl')).toHaveValue('https://my-api.example.com/v1');
    await expect(page.locator('#apiToken')).toHaveValue('test-token-123');
    await expect(page.locator('#model')).toHaveValue('gpt-4o');

    await page.close();
  });
};
