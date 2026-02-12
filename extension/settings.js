// All setting field IDs and their storage keys
const FIELDS = {
  // General
  userName:       { key: 'userName',       type: 'text' },
  theme:          { key: 'theme',          type: 'select' },
  systemPrompt:   { key: 'systemPrompt',   type: 'text' },
  // LLM
  apiUrl:         { key: 'apiUrl',         type: 'text' },
  apiToken:       { key: 'apiToken',       type: 'text' },
  model:          { key: 'model',          type: 'text' },
  temperature:    { key: 'temperature',    type: 'number' },
  maxTokens:      { key: 'maxTokens',      type: 'number' },
  // Service 1
  service1Name:    { key: 'service1Name',    type: 'text' },
  service1Url:     { key: 'service1Url',     type: 'text' },
  service1Token:   { key: 'service1Token',   type: 'text' },
  service1Enabled: { key: 'service1Enabled', type: 'select' },
  // Service 2
  service2Name:    { key: 'service2Name',    type: 'text' },
  service2Url:     { key: 'service2Url',     type: 'text' },
  service2Token:   { key: 'service2Token',   type: 'text' },
  service2Enabled: { key: 'service2Enabled', type: 'select' },
};

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
  });
});

// Load all settings
function loadSettings() {
  const keys = Object.values(FIELDS).map(f => f.key);
  chrome.storage.local.get(keys, (result) => {
    for (const [id, field] of Object.entries(FIELDS)) {
      const el = document.getElementById(id);
      if (!el) continue;
      const val = result[field.key];
      if (val !== undefined && val !== null) {
        el.value = String(val);
      }
    }
  });
}

// Save all settings
function saveSettings() {
  const data = {};
  for (const [id, field] of Object.entries(FIELDS)) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (field.type === 'number') {
      const num = parseFloat(el.value);
      data[field.key] = isNaN(num) ? '' : num;
    } else {
      data[field.key] = el.value;
    }
  }
  chrome.storage.local.set(data, () => {
    const status = document.getElementById('status');
    status.style.display = 'block';
    setTimeout(() => { status.style.display = 'none'; }, 2000);
  });
}

// Reset to defaults (clear all)
function resetSettings() {
  const keys = Object.values(FIELDS).map(f => f.key);
  chrome.storage.local.remove(keys, () => {
    for (const id of Object.keys(FIELDS)) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.tagName === 'SELECT') {
        el.selectedIndex = 0;
      } else {
        el.value = '';
      }
    }
    const status = document.getElementById('status');
    status.textContent = 'Settings reset.';
    status.style.display = 'block';
    setTimeout(() => {
      status.textContent = 'Settings saved.';
      status.style.display = 'none';
    }, 2000);
  });
}

document.getElementById('saveBtn').addEventListener('click', saveSettings);
document.getElementById('resetBtn').addEventListener('click', resetSettings);
document.getElementById('closeBtn').addEventListener('click', () => window.close());

loadSettings();
