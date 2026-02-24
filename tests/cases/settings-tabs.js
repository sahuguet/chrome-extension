module.exports = function ({ test, expect, getContext, getExtensionId, tid }) {
  test('settings page renders with tabs', async () => {
    const page = await getContext().newPage();
    await page.goto(`chrome-extension://${getExtensionId()}/settings.html`);

    // Verify all four tabs exist
    await expect(page.locator(tid('tab-general'))).toBeVisible();
    await expect(page.locator(tid('tab-llm'))).toBeVisible();
    await expect(page.locator(tid('tab-service1'))).toBeVisible();
    await expect(page.locator(tid('tab-service2'))).toBeVisible();

    // General tab content is active by default
    await expect(page.locator(tid('tab-content-general'))).toHaveClass(/active/);
    await expect(page.locator(tid('tab-content-llm'))).not.toHaveClass(/active/);

    // Switch to LLM tab
    await page.click(tid('tab-llm'));
    await expect(page.locator(tid('tab-content-llm'))).toHaveClass(/active/);
    await expect(page.locator(tid('tab-content-general'))).not.toHaveClass(/active/);

    // Verify LLM fields are visible
    await expect(page.locator(tid('input-apiUrl'))).toBeVisible();
    await expect(page.locator(tid('input-apiToken'))).toBeVisible();
    await expect(page.locator(tid('input-model'))).toBeVisible();

    await page.close();
  });
};
