module.exports = function ({ test, expect, getContext, getExtensionId, tid }) {
  test('settings save across all tabs', async () => {
    const page = await getContext().newPage();
    await page.goto(`chrome-extension://${getExtensionId()}/settings.html`);
    await page.waitForLoadState('domcontentloaded');

    // Set values directly via DOM (avoids keyboard event leaks)
    await page.evaluate(() => {
      document.getElementById('userName').value = 'TestUser';
      document.getElementById('systemPrompt').value = 'Be concise.';
      document.getElementById('service1Name').value = 'Search API';
      document.getElementById('service1Url').value = 'https://search.example.com';
      document.getElementById('service2Name').value = 'DB API';
    });

    // Save
    await page.click(tid('save-btn'));

    // Verify all values in storage
    const stored = await page.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.local.get(
          ['userName', 'systemPrompt', 'service1Name', 'service1Url', 'service2Name'],
          resolve,
        );
      });
    });
    expect(stored.userName).toBe('TestUser');
    expect(stored.systemPrompt).toBe('Be concise.');
    expect(stored.service1Name).toBe('Search API');
    expect(stored.service1Url).toBe('https://search.example.com');
    expect(stored.service2Name).toBe('DB API');

    await page.close();
  });
};
