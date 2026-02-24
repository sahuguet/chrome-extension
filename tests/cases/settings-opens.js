module.exports = function ({ test, expect, getContext, getExtensionId, tid }) {
  test('settings button opens options page', async () => {
    const context = getContext();
    const page = await context.newPage();
    await page.goto(`chrome-extension://${getExtensionId()}/sidepanel.html`);

    const [settingsPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click(tid('settings-btn')),
    ]);

    expect(settingsPage.url()).toContain('settings.html');
    await expect(settingsPage.locator(tid('tab-general'))).toBeVisible();

    await settingsPage.close();
    await page.close();
  });
};
