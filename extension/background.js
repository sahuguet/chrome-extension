chrome.runtime.onInstalled.addListener(() => {
  console.log("Chat Assistant extension installed");
  // Disable side panel globally — only opened explicitly via icon click
  chrome.sidePanel.setOptions({ enabled: false });
});

// Track which tabs have the side panel open
const panelOpenTabs = new Set();

// Toggle side panel when action button is clicked
// IMPORTANT: sidePanel.open() must be called synchronously (no await before it)
// in the user gesture callback, so we pre-enable the panel on every tab activation.
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.sidePanel.setOptions({ tabId, path: "sidepanel.html", enabled: true });
});

chrome.action.onClicked.addListener((tab) => {
  if (panelOpenTabs.has(tab.id)) {
    // Close by disabling for this tab
    chrome.sidePanel.setOptions({ tabId: tab.id, enabled: false });
    panelOpenTabs.delete(tab.id);
    // Re-enable after a short delay so the next click can open without await
    setTimeout(() => {
      chrome.sidePanel.setOptions({ tabId: tab.id, path: "sidepanel.html", enabled: true });
    }, 300);
  } else {
    // Panel is pre-enabled via onActivated, so open() works synchronously
    chrome.sidePanel.open({ tabId: tab.id });
    panelOpenTabs.add(tab.id);
  }
});

// Track panel lifecycle via port connection
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "sidepanel" || !port.sender?.tab?.id) return;
  const tabId = port.sender.tab.id;
  panelOpenTabs.add(tabId);
  port.onDisconnect.addListener(() => {
    panelOpenTabs.delete(tabId);
  });
});

// Clean up when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  panelOpenTabs.delete(tabId);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageText") {
    chrome.tabs.sendMessage(
      request.tabId,
      { action: "getPageText" },
      (response) => {
        sendResponse(response || { text: "" });
      },
    );
    return true;
  }

  if (request.action === "chat") {
    handleChat(request.messages);
    sendResponse({ ok: true });
    return false;
  }
});

async function handleChat(messages) {
  try {
    const settings = await chrome.storage.local.get([
      "apiUrl",
      "apiToken",
      "model",
    ]);
    const apiUrl = settings.apiUrl || "https://api.openai.com/v1";
    const apiToken = settings.apiToken || "";
    const model = settings.model || "gpt-4";

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      chrome.runtime.sendMessage({
        action: "chatError",
        error: `${response.status}: ${errorText}`,
      });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            chrome.runtime.sendMessage({ action: "chatChunk", text: content });
          }
        } catch {
          // skip malformed JSON lines
        }
      }
    }

    chrome.runtime.sendMessage({ action: "chatDone" });
  } catch (err) {
    chrome.runtime.sendMessage({ action: "chatError", error: err.message });
  }
}
