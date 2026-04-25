/* ═══════════════════════════════════════════════
   CHAT.JS — AI Chat Interface with Backend Fetch
   ═══════════════════════════════════════════════ */


let isTyping = false;
let chatHistory = [];
// Store trip data by a safe numeric key instead of encoding in HTML attributes
const _tripDataStore = new Map();
let _tripDataKey = 0;

document.addEventListener('DOMContentLoaded', () => {
  loadChatContext();
  initChatInput();
  initQuickActions();
  sendWelcomeMessage();
});

function loadChatContext() {
  const place = localStorage.getItem('selectedPlace') || 'Not Selected';
  const days = localStorage.getItem('numDays') || '3';
  const budget = localStorage.getItem('budget') || '0';

  const contextEl = document.getElementById('chat-context');
  if (contextEl) {
    contextEl.textContent = `📍 ${place} · ${days} days · ₹${parseInt(budget).toLocaleString()}`;
  }
}

function sendWelcomeMessage() {
  const place = localStorage.getItem('selectedPlace');
  const days = localStorage.getItem('numDays') || '3';
  const budget = localStorage.getItem('budget') || '0';

  let welcome = `👋 Hey there! `;
  if (place && place !== 'Not Selected') {
    welcome += `I see you're heading to **${place}** for **${days} days** with a budget of **₹${parseInt(budget).toLocaleString()}**. How can I help you fine-tune this trip?`;
  } else {
    welcome += `I'm here to help you piece together your next trip. Where are you thinking of going?`;
  }

  setTimeout(() => addBotMessageHTML(formatMessageText(welcome)), 500);
}

function initChatInput() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  if (!input || !sendBtn) return;

  const send = () => {
    if (isTyping) return;
    const text = input.value.trim();
    if (!text) return;

    addUserMessage(text);
    input.value = '';
    fetchAIResponse(text);
  };

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') send();
  });
}

function initQuickActions() {
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (isTyping) return;
      const text = btn.textContent;
      addUserMessage(text);
      fetchAIResponse(text);
    });
  });
}

function addUserMessage(text) {
  const container = document.getElementById('chat-messages');
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const html = `
    <div class="message user">
      <div class="message-avatar">👤</div>
      <div>
        <div class="message-bubble">${escapeHtml(text)}</div>
        <div class="message-time">${time}</div>
      </div>
    </div>`;
  container.insertAdjacentHTML('beforeend', html);
  scrollToBottom();
}

async function fetchAIResponse(userText) {
  let place = localStorage.getItem('selectedPlace') || '';
  if (!place || place === 'Not Selected') place = 'General / Anywhere in India';
  const days = localStorage.getItem('numDays') || '3';
  const budget = localStorage.getItem('budget') || '15000';

  showTyping();
  isTyping = true;

  // 30-second timeout so the UI never hangs indefinitely
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: place, days, budget, query: userText })
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    hideTyping();
    isTyping = false;

    if (!response.ok) throw new Error(data.error || 'Server error occurred');

    localStorage.setItem('tp_saved_itinerary', JSON.stringify(data));
    renderStructuredAIResponse(data, place, days, budget);

  } catch (error) {
    clearTimeout(timeoutId);
    hideTyping();
    isTyping = false;
    console.error('AI Fetch Error:', error);

    const isTimeout = error.name === 'AbortError';
    const msg = isTimeout
      ? '⚠️ **Request timed out** — the AI took too long to respond. Please try again.'
      : '⚠️ **Connection error** — please check the server is running and try again.';
    addBotMessageHTML(formatMessageText(msg));
  }
}

function renderStructuredAIResponse(data, location, days, budget) {
  let html = `<div class="ai-structured-response">`;

  // 1. Day-wise Itinerary Cards
  if (data.days && Array.isArray(data.days) && data.days.length > 0) {
    html += `<div class="ai-section"><h4>📅 Your Itinerary</h4><div class="itinerary-days-container">`;
    data.days.forEach(dayInfo => {
      html += `
        <div class="day-card" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <h5 style="color: var(--accent-coral); margin-bottom: 12px; font-size: 1.1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 8px;">Day ${dayInfo.day}</h5>
          <div style="margin-bottom: 8px;"><strong>🌅 Morning:</strong> <span style="color: var(--text-secondary);">${escapeHtml(dayInfo.morning || '')}</span></div>
          <div style="margin-bottom: 8px;"><strong>☀️ Afternoon:</strong> <span style="color: var(--text-secondary);">${escapeHtml(dayInfo.afternoon || '')}</span></div>
          <div><strong>🌙 Evening:</strong> <span style="color: var(--text-secondary);">${escapeHtml(dayInfo.evening || '')}</span></div>
        </div>
      `;
    });
    html += `</div></div>`;
  } else {
    html += `<div class="ai-section"><p style="color:var(--text-muted);">No itinerary data returned. Please try again.</p></div>`;
  }

  // 2. Cost Breakdown Section
  if (data.cost) {
    html += `<div class="ai-section"><h4>💰 Cost Breakdown</h4>
             <div class="cost-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px;">
               <div style="background: rgba(78,205,196,0.1); padding: 12px; border-radius: var(--radius-md); border: 1px solid rgba(78,205,196,0.2);">
                 <strong style="display: block; color: var(--accent-teal); margin-bottom: 4px;">🏨 Stay</strong>
                 <span style="color: var(--text-secondary); font-size: 0.9rem;">${escapeHtml(data.cost.stay)}</span>
               </div>
               <div style="background: rgba(255,107,107,0.1); padding: 12px; border-radius: var(--radius-md); border: 1px solid rgba(255,107,107,0.2);">
                 <strong style="display: block; color: var(--accent-coral); margin-bottom: 4px;">🍔 Food</strong>
                 <span style="color: var(--text-secondary); font-size: 0.9rem;">${escapeHtml(data.cost.food)}</span>
               </div>
               <div style="background: rgba(168,85,247,0.1); padding: 12px; border-radius: var(--radius-md); border: 1px solid rgba(168,85,247,0.2);">
                 <strong style="display: block; color: var(--accent-purple); margin-bottom: 4px;">🚕 Transport</strong>
                 <span style="color: var(--text-secondary); font-size: 0.9rem;">${escapeHtml(data.cost.transport)}</span>
               </div>
             </div></div>`;
  }

  // 3. Tips List
  if (data.tips && Array.isArray(data.tips)) {
    html += `<div class="ai-section"><h4>💡 Travel Tips</h4>
             <ul style="list-style-type: disc; padding-left: 20px; color: var(--text-secondary); line-height: 1.6;">`;
    data.tips.forEach(tip => {
      html += `<li style="margin-bottom: 6px;">${escapeHtml(tip)}</li>`;
    });
    html += `</ul></div>`;
  }

  // 4. Save Trip Button — uses a safe data-store key instead of encoding JSON in onclick
  const storeKey = ++_tripDataKey;
  _tripDataStore.set(storeKey, { location, days, budget, data });
  html += `
    <div style="margin-top: 20px; text-align: right;">
      <button data-trip-key="${storeKey}" class="btn btn-primary save-trip-btn" style="padding: 10px 20px; font-size: 0.9rem;">
        💾 Save Trip to Profile
      </button>
    </div>
  `;

  html += `</div>`;
  addBotMessageHTML(html);

  // Attach click listener after inserting into DOM
  setTimeout(() => {
    document.querySelectorAll(`.save-trip-btn[data-trip-key="${storeKey}"]`).forEach(btn => {
      btn.addEventListener('click', () => saveTripAction(btn, storeKey));
    });
  }, 0);
}

// Save trip — reads data from safe in-memory store
window.saveTripAction = async function(btn, storeKey) {
  const user = (() => { try { return JSON.parse(localStorage.getItem('tp_user')); } catch { return null; } })();
  const token = localStorage.getItem('tp_token');

  if (!user || !token) {
    showToast('Please log in to save trips!', 'error');
    window.location.href = 'login.html';
    return;
  }

  const tripData = _tripDataStore.get(storeKey);
  if (!tripData) {
    showToast('Trip data not found. Please regenerate the itinerary.', 'error');
    return;
  }

  const { location, days, budget, data } = tripData;

  try {
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Saving...';
    btn.disabled = true;

    const response = await fetch(`${API_BASE_URL}/save-trip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ location, days, budget, itineraryJSON: data })
    });

    const result = await response.json();

    if (response.ok) {
      btn.innerHTML = '✓ Trip Saved!';
      btn.style.background = 'var(--accent-teal)';
      btn.style.color = '#fff';
      _tripDataStore.delete(storeKey); // free memory
      showToast('Trip saved to your profile!', 'success');
    } else if (response.status === 401 || response.status === 403) {
      showToast('Session expired. Please log in again.', 'error');
      localStorage.removeItem('tp_token');
      localStorage.removeItem('tp_user');
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    } else {
      throw new Error(result.error || 'Failed to save trip');
    }
  } catch (error) {
    console.error('Save trip error:', error);
    btn.innerHTML = '💾 Save Trip to Profile';
    btn.disabled = false;
    showToast('Could not save trip. Try again.', 'error');
  }
};

function addBotMessageHTML(htmlContent) {
  const container = document.getElementById('chat-messages');
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const html = `
    <div class="message bot">
      <div class="message-avatar">🤖</div>
      <div>
        <div class="message-bubble">${htmlContent}</div>
        <div class="message-time">${time}</div>
      </div>
    </div>`;
  container.insertAdjacentHTML('beforeend', html);
  scrollToBottom();
}

function markdownToHtml(text) {
  if (!text) return '';
  let html = text
    .replace(/^### (.*$)/gim, '<h4 style="color:var(--accent-coral); margin-top:12px; margin-bottom:8px;">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 style="color:var(--text-primary); margin-top:16px; margin-bottom:8px;">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 style="color:var(--text-primary); margin-top:20px; margin-bottom:10px;">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary);">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\s*[-*]\s+(.*)$/gim, '<div style="margin-left:20px; display:flex; gap:8px; margin-bottom:4px;"><span style="color:var(--accent-coral)">•</span><span>$1</span></div>');

  // Replace remaining newlines with br, but avoid double spacing around divs/headings
  html = html.replace(/\n/g, '<br>');
  html = html.replace(/(<br>\s*)+(<div style="margin-left)/g, '$2'); // remove br before lists
  html = html.replace(/(<\/div>)\s*(<br>)+/g, '$1'); // remove br after lists
  html = html.replace(/(<\/h[234]>)\s*(<br>)+/g, '$1'); // remove br after headings
  return html;
}

// Convert markdown bold to strong (kept for backwards compatibility)
function formatMessageText(text) {
  return markdownToHtml(text);
}

function showTyping() {
  const input = document.getElementById('chat-input');
  const btn = document.getElementById('chat-send');
  if (input) input.disabled = true;
  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  }

  const container = document.getElementById('chat-messages');
  if (document.getElementById('typing-indicator')) return;
  const html = `
    <div class="message bot" id="typing-indicator">
      <div class="message-avatar">🤖</div>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
  container.insertAdjacentHTML('beforeend', html);
  scrollToBottom();
}

function hideTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();

  const input = document.getElementById('chat-input');
  const btn = document.getElementById('chat-send');
  if (input) {
    input.disabled = false;
    input.focus();
  }
  if (btn) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }
}

function scrollToBottom() {
  const container = document.getElementById('chat-messages');
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
