const messagesEl = document.getElementById('messages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const settingsBtn = document.getElementById('settingsBtn');

let chatHistory = [];

// Connect a port to background — when the panel closes, the port disconnects
// and background can track the panel lifecycle without async races
chrome.runtime.connect({ name: 'sidepanel' });

// Open settings page in a new tab
settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Attach page content
attachBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  chrome.runtime.sendMessage({ action: 'getPageText', tabId: tab.id }, (response) => {
    if (response && response.text) {
      const prefix = chatInput.value ? chatInput.value + '\n\n' : '';
      chatInput.value = prefix + '[Page content]\n' + response.text;
    }
  });
});

function addMessage(role, content) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = content;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

// Send message
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  addMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const assistantDiv = addMessage('assistant', '...');

  chrome.runtime.sendMessage({
    action: 'chat',
    messages: [...chatHistory],
    tabId: tab?.id,
  }, (response) => {
    if (response && response.error) {
      assistantDiv.textContent = `Error: ${response.error}`;
    }
  });
}

// Listen for streamed response chunks from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'chatChunk') {
    const assistantDivs = messagesEl.querySelectorAll('.message.assistant');
    const lastDiv = assistantDivs[assistantDivs.length - 1];
    if (lastDiv) {
      if (lastDiv.textContent === '...') {
        lastDiv.textContent = message.text;
      } else {
        lastDiv.textContent += message.text;
      }
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  } else if (message.action === 'chatDone') {
    const assistantDivs = messagesEl.querySelectorAll('.message.assistant');
    const lastDiv = assistantDivs[assistantDivs.length - 1];
    if (lastDiv) {
      chatHistory.push({ role: 'assistant', content: lastDiv.textContent });
    }
  } else if (message.action === 'chatError') {
    const assistantDivs = messagesEl.querySelectorAll('.message.assistant');
    const lastDiv = assistantDivs[assistantDivs.length - 1];
    if (lastDiv) {
      lastDiv.textContent = `Error: ${message.error}`;
    }
  }
});
