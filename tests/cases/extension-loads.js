module.exports = function ({ test, expect, getContext, getExtensionId }) {
  test('extension is loaded', async () => {
    expect(getExtensionId()).toBeTruthy();
  });
};
