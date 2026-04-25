/* ═══════════════════════════════════════════════
   BUDGET.JS — Budget planner logic
   ═══════════════════════════════════════════════ */

const BREAKDOWN = [
  { label: 'Accommodation', percent: 35, color: '#ff6b6b' },
  { label: 'Food & Dining',  percent: 25, color: '#ffd93d' },
  { label: 'Transport',      percent: 15, color: '#4ecdc4' },
  { label: 'Activities',     percent: 15, color: '#a855f7' },
  { label: 'Miscellaneous',  percent: 10, color: '#3b82f6' },
];

document.addEventListener('DOMContentLoaded', () => {
  loadSelectedPlace();
  initSlider();
  initBudgetInput();
  updateBreakdown();
});

function loadSelectedPlace() {
  const place = localStorage.getItem('selectedPlace') || 'Not Selected';
  const destName = document.getElementById('selected-dest-name');
  const destEmoji = document.getElementById('selected-dest-emoji');
  if (destName) destName.textContent = place;

  const emojiMap = { 'Goa': '🏖️', 'Manali': '🏔️', 'Jaipur': '🏰', 'Kerala': '🌴', 'Delhi': '🏛️', 'Varanasi': '🕉️' };
  if (destEmoji) destEmoji.textContent = emojiMap[place] || '📍';
}

function initSlider() {
  const slider = document.getElementById('days-slider');
  const display = document.getElementById('days-value');
  if (!slider) return;

  slider.addEventListener('input', () => {
    display.textContent = slider.value;
    updateBreakdown();
  });
}

function initBudgetInput() {
  const input = document.getElementById('budget-input');
  if (!input) return;
  input.addEventListener('input', () => updateBreakdown());
}

function updateBreakdown() {
  const days = parseInt(document.getElementById('days-slider')?.value || 3);
  const budget = parseInt(document.getElementById('budget-input')?.value || 0);

  // Update per-day stats
  const perDay = budget > 0 ? Math.round(budget / days) : 0;
  const perDayEl = document.getElementById('per-day-amount');
  if (perDayEl) perDayEl.textContent = '₹' + perDay.toLocaleString();

  const totalEl = document.getElementById('total-amount');
  if (totalEl) totalEl.textContent = '₹' + budget.toLocaleString();

  // Update breakdown list
  const list = document.getElementById('breakdown-list');
  if (list) {
    list.innerHTML = BREAKDOWN.map(item => {
      const amount = Math.round(budget * item.percent / 100);
      return `
        <li class="breakdown-item">
          <span class="breakdown-dot" style="background: ${item.color}"></span>
          <span class="breakdown-label">${item.label}</span>
          <span class="breakdown-percent">${item.percent}%</span>
          <span class="breakdown-amount">₹${amount.toLocaleString()}</span>
        </li>
      `;
    }).join('');
  }

  // Update donut chart
  updateDonut(budget);

  // Store in localStorage
  localStorage.setItem('numDays', days);
  localStorage.setItem('budget', budget);
}

function updateDonut(budget) {
  const donut = document.getElementById('donut-chart');
  if (!donut) return;

  let cumulativePercent = 0;
  const segments = BREAKDOWN.map(item => {
    const start = cumulativePercent;
    cumulativePercent += item.percent;
    return `${item.color} ${start}% ${cumulativePercent}%`;
  });

  donut.style.background = `conic-gradient(${segments.join(', ')})`;

  const centerAmount = document.getElementById('donut-total');
  if (centerAmount) centerAmount.textContent = '₹' + budget.toLocaleString();
}

// Change destination button
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('change-btn')) {
    const isInPages = window.location.pathname.includes('/pages/');
    window.location.href = isInPages ? 'destinations.html' : 'pages/destinations.html';
  }
});

// Get AI Recommendations button
document.addEventListener('click', (e) => {
  if (e.target.id === 'get-ai-btn' || e.target.closest('#get-ai-btn')) {
    const budget = document.getElementById('budget-input')?.value;
    const days = document.getElementById('days-slider')?.value;
    if (!budget || parseInt(budget) <= 0) {
      showToast('Please enter a budget amount', 'error');
      return;
    }
    localStorage.setItem('numDays', days);
    localStorage.setItem('budget', budget);
    showToast('Data saved! Opening AI Chat...');
    setTimeout(() => {
      const isInPages = window.location.pathname.includes('/pages/');
      window.location.href = isInPages ? 'chat.html' : 'pages/chat.html';
    }, 800);
  }
});
