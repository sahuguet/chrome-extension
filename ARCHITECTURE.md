## Chrome Extension: Chat Assistant with Side Panel

### Architecture
- **Manifest V3** Chrome extension with a side panel chat UI that calls an OpenAI-compatible `/chat/completions` API with SSE streaming.
- 4 files in `extension/`: `manifest.json`, `background.js` (service worker), `sidepanel.html`+`sidepanel.js` (chat UI), `settings.html`+`settings.js` (tabbed options page), `content.js` (page text extractor).
- Playwright tests in `tests/extension.spec.js` that auto-loads individual test files from `tests/cases/`.

### Manifest
- Permissions: `activeTab`, `tabs`, `sidePanel`, `storage`
- `side_panel.default_path` points to `sidepanel.html`
- `options_ui.page` points to `settings.html` with `open_in_tab: true`
- No `default_popup` — action button toggles the side panel
- Content script on `<all_urls>` injects `content.js`

### Side Panel (`sidepanel.html` + `sidepanel.js`)
- Header with title + settings button (🔧 emoji — **requires `<meta charset="UTF-8">`** or emoji renders as mojibake)
- Scrollable message list, textarea input, Send button, Attach (📎) button
- Settings button calls `chrome.runtime.openOptionsPage()` (opens settings in a new tab)
- Attach button: sends `getPageText` message to background, which forwards to content script, prepends `[Page content]` to input
- Send: posts `{ action: 'chat', messages }` to background, receives streamed chunks via `chrome.runtime.onMessage`
- **Lifecycle tracking**: connects a port (`chrome.runtime.connect({ name: 'sidepanel' })`) so background can detect open/close. Don't use `beforeunload` + async `chrome.tabs.query` — it races and crashes.

### Background (`background.js`)
- **Toggle logic**: Toolbar icon click opens or closes the side panel per-tab.
  - `sidePanel.open()` **must be called synchronously** in the `onClicked` callback — any `await` before it breaks the user gesture chain and throws.
  - Fix: pre-enable the panel on every tab via `chrome.tabs.onActivated` → `sidePanel.setOptions({ tabId, path, enabled: true })`.
  - To close: `sidePanel.setOptions({ tabId, enabled: false })`. **Do not** immediately re-enable — it cancels the close. Use `setTimeout(300ms)` to re-enable after.
  - Disable panel globally on install (`sidePanel.setOptions({ enabled: false })`) so it doesn't appear on all tabs in Chrome's side panel picker.
- **Port-based tracking**: `onConnect` listener for `name === 'sidepanel'` adds tab to `panelOpenTabs` Set; `port.onDisconnect` removes it. Also clean up on `tabs.onRemoved`.
- **Chat handler**: reads `apiUrl`, `apiToken`, `model` from `chrome.storage.local`, calls `/chat/completions` with `stream: true`, parses SSE lines, sends `chatChunk`/`chatDone`/`chatError` messages back.
- **getPageText handler**: forwards to content script via `chrome.tabs.sendMessage`, returns response. Uses `return true` to keep message channel open.

### Settings Page (`settings.html` + `settings.js`)
- 4 tabs: General (display name, theme, system prompt), LLM (API URL, bearer token, model, temperature, max tokens), Service 1, Service 2 (name, URL, API key, enabled)
- Also needs `<meta charset="UTF-8">`
- Header has a ✕ close button (right-aligned) that calls `window.close()`
- Save button writes all fields across all tabs to `chrome.storage.local` at once
- Reset button clears all keys
- Tab switching via `data-tab` attributes + `.active` class toggling
- Registered as `options_ui` in manifest — accessible via right-click on extension icon → Options

### Content Script (`content.js`)
- Responds to `{ action: 'getPageText' }` with `{ text: document.body.innerText }`

### Tests
- `tests/extension.spec.js`: shared `beforeAll` launches persistent context with extension, gets extension ID from service worker URL. Auto-discovers and loads all `tests/cases/*.js` files.
- Each case file exports a function receiving `{ test, expect, getContext, getExtensionId }` (getters because context isn't set until `beforeAll`).
- 8 tests: extension loads, sidepanel renders, settings button opens options page, settings tabs render, settings save/load, settings save across all tabs, attach page content, chat API call format.
- **Flaky test fix**: `onActivated` enabling the side panel causes Chrome keyboard events to leak into Playwright `fill()` calls (stray `j` character). Fix: use `page.evaluate()` to set DOM values directly instead of `page.fill()` for the affected test.

### Key Bug Fixes Summary
1. **Emoji mojibake** → add `<meta charset="UTF-8">`
2. **`sidePanel.open()` user gesture error** → no `await` before `open()`; pre-enable via `onActivated`
3. **Panel won't close** → don't re-enable immediately after disable; use `setTimeout(300ms)`
4. **Panel on all tabs** → disable globally on install, enable per-tab on click
5. **Panel close tracking race** → use `runtime.connect()` port, not `beforeunload` + async query
6. **Hardcoded API key in fallback** → removed, use empty string default
7. **Test keyboard leak** → use `page.evaluate()` to set values instead of `page.fill()`
