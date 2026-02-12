module.exports = function ({ test, expect, getContext, getExtensionId }) {
  test('settings page renders with tabs', async () => {
    const page = await getContext().newPage();
    await page.goto(`chrome-extension://${getExtensionId()}/settings.html`);

    await expect(page.locator('.tab[data-tab="general"]')).toBeVisible();
    await expect(page.locator('.tab[data-tab="llm"]')).toBeVisible();
    await expect(page.locator('.tab[data-tab="service1"]')).toBeVisible();
    await expect(page.locator('.tab[data-tab="service2"]')).toBeVisible();

    await expect(page.locator('#tab-general')).toHaveClass(/active/);
    await expect(page.locator('#tab-llm')).not.toHaveClass(/active/);

    await page.click('.tab[data-tab="llm"]');
    await expect(page.locator('#tab-llm')).toHaveClass(/active/);
    await expect(page.locator('#tab-general')).not.toHaveClass(/active/);

    await expect(page.locator('#apiUrl')).toBeVisible();
    await expect(page.locator('#apiToken')).toBeVisible();
    await expect(page.locator('#model')).toBeVisible();

    await page.close();
  });
};
