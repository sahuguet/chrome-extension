module.exports = function ({ test, expect, getContext, getExtensionId, tid }) {
  test('side panel renders correctly', async () => {
    const page = await getContext().newPage();
    await page.goto(`chrome-extension://${getExtensionId()}/sidepanel.html`);

    await expect(page.locator(tid('messages'))).toBeVisible();
    await expect(page.locator(tid('chat-input'))).toBeVisible();
    await expect(page.locator(tid('send-btn'))).toBeVisible();
    await expect(page.locator(tid('attach-btn'))).toBeVisible();
    await expect(page.locator(tid('settings-btn'))).toBeVisible();

    await page.close();
  });
};
