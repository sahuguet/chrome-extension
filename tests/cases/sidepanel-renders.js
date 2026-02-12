module.exports = function ({ test, expect, getContext, getExtensionId }) {
  test('side panel renders correctly', async () => {
    const page = await getContext().newPage();
    await page.goto(`chrome-extension://${getExtensionId()}/sidepanel.html`);

    await expect(page.locator('#messages')).toBeVisible();
    await expect(page.locator('#chatInput')).toBeVisible();
    await expect(page.locator('#sendBtn')).toBeVisible();
    await expect(page.locator('#attachBtn')).toBeVisible();
    await expect(page.locator('#settingsBtn')).toBeVisible();

    await page.close();
  });
};
