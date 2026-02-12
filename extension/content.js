// Extracts page text and sends it back — no processing here
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageText') {
    const text = document.body.innerText || '';
    sendResponse({ text });
  }
});
