// Extracts page text and sends it back — no processing here
function getPageText() {
  return document.body.innerText || '';
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageText') {
    sendResponse({ text: getPageText() });
  }
});

// Expose test hooks for Playwright
window.__myExt = {
  getPageText,
};
