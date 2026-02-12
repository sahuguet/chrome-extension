module.exports = function ({ test, expect, getContext, getExtensionId }) {
  test('settings button opens options page', async () => {
    const context = getContext();
    const page = await context.newPage();
    await page.goto(`chrome-extension://${getExtensionId()}/sidepanel.html`);

    const [settingsPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('#settingsBtn'),
    ]);

    expect(settingsPage.url()).toContain('settings.html');
    await expect(settingsPage.locator('.tab[data-tab="general"]')).toBeVisible();

    await settingsPage.close();
    await page.close();
  });
};
