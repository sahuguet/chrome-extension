module.exports = function ({ test, expect, getContext, getExtensionId }) {
  test('attach page content', async () => {
    const context = getContext();
    const targetPage = await context.newPage();
    await targetPage.goto('https://example.com');

    const panelPage = await context.newPage();
    await panelPage.goto(`chrome-extension://${getExtensionId()}/sidepanel.html`);

    // Poll until the content script responds (replaces fixed waitForTimeout)
    const result = await panelPage.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      const target = tabs.find(t => t.url && t.url.includes('example.com'));
      if (!target) return null;

      // Retry until content script is ready
      for (let i = 0; i < 20; i++) {
        try {
          const res = await chrome.runtime.sendMessage({ action: 'getPageText', tabId: target.id });
          if (res && res.text) return res;
        } catch { /* content script not ready yet */ }
        await new Promise(r => setTimeout(r, 200));
      }
      return null;
    });

    expect(result).toBeTruthy();
    expect(result.text).toBeTruthy();
    expect(result.text.length).toBeGreaterThan(0);

    await panelPage.close();
    await targetPage.close();
  });
};
