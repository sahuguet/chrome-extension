module.exports = function ({ test, expect, getContext, getExtensionId, tid }) {
  test('settings save and load', async () => {
    const page = await getContext().newPage();
    await page.goto(`chrome-extension://${getExtensionId()}/settings.html`);

    // Switch to LLM tab and fill in settings
    await page.click(tid('tab-llm'));
    await page.fill(tid('input-apiUrl'), 'https://my-api.example.com/v1');
    await page.fill(tid('input-apiToken'), 'test-token-123');
    await page.fill(tid('input-model'), 'gpt-4o');

    // Save
    await page.click(tid('save-btn'));

    // Verify status message appears
    await expect(page.locator(tid('status'))).toBeVisible();

    // Verify values persisted in storage
    const stored = await page.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.local.get(['apiUrl', 'apiToken', 'model'], resolve);
      });
    });
    expect(stored.apiUrl).toBe('https://my-api.example.com/v1');
    expect(stored.apiToken).toBe('test-token-123');
    expect(stored.model).toBe('gpt-4o');

    // Reload and wait for settings to load from storage
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.click(tid('tab-llm'));

    // Poll until the value is populated from storage (replaces waitForTimeout)
    await page.waitForFunction(
      (sel) => document.querySelector(sel)?.value === 'https://my-api.example.com/v1',
      tid('input-apiUrl'),
    );
    await expect(page.locator(tid('input-apiToken'))).toHaveValue('test-token-123');
    await expect(page.locator(tid('input-model'))).toHaveValue('gpt-4o');

    await page.close();
  });
};
