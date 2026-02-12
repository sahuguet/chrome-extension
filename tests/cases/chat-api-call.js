module.exports = function ({ test, expect, getContext, getExtensionId }) {
  test('chat API call format', async () => {
    const page = await getContext().newPage();
    await page.goto(`chrome-extension://${getExtensionId()}/sidepanel.html`);

    await page.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.local.set({
          apiUrl: 'https://mock-api.test',
          apiToken: 'test-bearer-token',
          model: 'test-model',
        }, resolve);
      });
    });

    const chatMessage = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const messages = [{ role: 'user', content: 'Hello test' }];
        chrome.runtime.sendMessage({
          action: 'chat',
          messages,
          tabId: 1,
        }, (response) => {
          resolve({ sent: { messages, action: 'chat' }, response });
        });
      });
    });

    expect(chatMessage.sent.action).toBe('chat');
    expect(chatMessage.sent.messages).toHaveLength(1);
    expect(chatMessage.sent.messages[0].role).toBe('user');
    expect(chatMessage.sent.messages[0].content).toBe('Hello test');
    expect(chatMessage.response.ok).toBe(true);

    const settings = await page.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.local.get(['apiUrl', 'apiToken', 'model'], resolve);
      });
    });
    expect(settings.apiUrl).toBe('https://mock-api.test');
    expect(settings.apiToken).toBe('test-bearer-token');
    expect(settings.model).toBe('test-model');

    await page.close();
  });
};
