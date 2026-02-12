module.exports = function ({ test, expect, getContext, getExtensionId }) {
  test('attach page content', async () => {
    const context = getContext();
    const targetPage = await context.newPage();
    await targetPage.goto('https://example.com');
    await targetPage.waitForTimeout(1000);

    const panelPage = await context.newPage();
    await panelPage.goto(`chrome-extension://${getExtensionId()}/sidepanel.html`);

    const result = await panelPage.evaluate(async () => {
      const tabs = await chrome.tabs.query({});
      const target = tabs.find(t => t.url && t.url.includes('example.com'));
      if (!target) return null;
      return new Promise(resolve => {
        chrome.runtime.sendMessage({ action: 'getPageText', tabId: target.id }, resolve);
      });
    });

    expect(result).toBeTruthy();
    expect(result.text).toBeTruthy();
    expect(result.text.length).toBeGreaterThan(0);

    await panelPage.close();
    await targetPage.close();
  });
};
