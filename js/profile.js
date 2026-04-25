/* ═══════════════════════════════════════════════
   PROFILE.JS — User Profile Page Logic
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Always init logout first so users can escape corrupt states
  initLogout();

  // Run modules safely so one crash doesn't break the whole page
  const runSafe = (fn) => { try { fn(); } catch (e) { console.error(`Error in ${fn.name}:`, e); } };

  runSafe(loadUserProfile);
  runSafe(loadSavedPreferences);
  runSafe(loadTripHistory);
  runSafe(initDashboardMap);
  runSafe(loadSavedItinerary);
  runSafe(initEditProfile);
});

function loadUserProfile() {
  // ── Route Guard: redirect to login if no token ──
  const token = localStorage.getItem('tp_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(localStorage.getItem('tp_user') || 'null');
  const nameEl = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const avatarEl = document.getElementById('profile-avatar-emoji');
  const heroGreetingContainer = document.getElementById('hero-greeting-container');
  const heroQuoteEl = document.getElementById('hero-quote');

  const quotes = [
    "Ready for your next adventure?",
    "Let’s plan something amazing today.",
    "Your next journey starts here.",
    "The world is waiting for you.",
    "Time to explore new horizons."
  ];

  const currentHour = new Date().getHours();
  let greeting = "Good Evening";
  if (currentHour >= 5 && currentHour < 12) {
    greeting = "Good Morning";
  } else if (currentHour >= 12 && currentHour < 17) {
    greeting = "Good Afternoon";
  }

  if (heroQuoteEl) {
    heroQuoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
  }

  if (user) {
    if (nameEl) nameEl.textContent = user.name || 'Traveler';
    if (heroGreetingContainer) {
      const displayName = user.name || 'Traveler';
      heroGreetingContainer.innerHTML = `${greeting}, <span class="gradient-text">${displayName}</span> 👋`;
    }
    if (emailEl) emailEl.textContent = user.email || 'Not set';
    // Fill edit form
    const editName = document.getElementById('edit-name');
    const editEmail = document.getElementById('edit-email');
    const editPhone = document.getElementById('edit-phone');
    const editBio = document.getElementById('edit-bio');
    if (editName) editName.value = user.name || '';
    if (editEmail) editEmail.value = user.email || '';
    if (editPhone) editPhone.value = user.phone || '';
    if (editBio) editBio.value = user.bio || '';
  } else {
    if (nameEl) nameEl.textContent = 'Guest User';
    if (heroGreetingContainer) {
      heroGreetingContainer.innerHTML = `${greeting}, <span class="gradient-text">Guest</span> 👋`;
    }
    if (emailEl) emailEl.textContent = 'Sign in to save your profile';
  }

  // Update trip count
  const history = JSON.parse(localStorage.getItem('tp_trip_history') || '[]');
  const tripCountEl = document.getElementById('trip-count');
  if (tripCountEl) tripCountEl.textContent = history.length;

  // Destinations visited
  const destCount = new Set(history.map(t => t.place)).size;
  const destCountEl = document.getElementById('dest-count');
  if (destCountEl) destCountEl.textContent = destCount;

  // Total Budget Spend
  const totalSpendEl = document.getElementById('total-spend-count');
  if (totalSpendEl) {
    const totalSpend = history.reduce((sum, trip) => sum + (parseInt(trip.budget) || 0), 0);
    totalSpendEl.textContent = `₹${totalSpend.toLocaleString()}`;
  }
}

function loadSavedPreferences() {
  const prefs = JSON.parse(localStorage.getItem('preferences') || '{}');
  const container = document.getElementById('pref-chips');
  if (!container) return;

  let chips = [];

  if (prefs.travelStyle) {
    const styleLabels = { adventure: '🏔️ Adventure', relaxation: '🧘 Relaxation', cultural: '🏛️ Cultural', foodie: '🍛 Foodie' };
    chips.push(`<span class="pref-chip">${styleLabels[prefs.travelStyle] || prefs.travelStyle}</span>`);
  }

  if (prefs.budgetPref) {
    const budgetLabels = { budget: '💰 Budget', 'mid-range': '💎 Mid-Range', luxury: '👑 Luxury' };
    chips.push(`<span class="pref-chip teal">${budgetLabels[prefs.budgetPref] || prefs.budgetPref}</span>`);
  }

  if (prefs.interests && prefs.interests.length) {
    prefs.interests.forEach(interest => {
      const icons = { beaches: '🏖️', mountains: '🏔️', heritage: '🏰', nightlife: '🎉', food: '🍛', shopping: '🛍️', wildlife: '🐘', photography: '📸', spiritual: '🕉️', 'water-sports': '🌊', trekking: '🥾', wellness: '🧘' };
      chips.push(`<span class="pref-chip purple">${icons[interest] || '✨'} ${interest}</span>`);
    });
  }

  if (chips.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="empty-icon">⚙️</span><p>No preferences set yet. <a href="preferences.html" style="color: var(--accent-coral);">Set them now →</a></p></div>';
  } else {
    container.innerHTML = chips.join('');
  }
}

async function loadTripHistory() {
  const container = document.getElementById('trip-history');
  if (!container) return;
  
  const user = JSON.parse(localStorage.getItem('tp_user') || 'null');
  const token = localStorage.getItem('tp_token');
  
  if (!user || !token) {
    container.innerHTML = '<div class="empty-state"><span class="empty-icon">🔒</span><p>Please <a href="login.html" style="color: var(--accent-coral);">sign in</a> to view your saved trips.</p></div>';
    return;
  }

  container.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted);">Loading trips...</div>';

  try {
    // /my-trips is now protected — userId is derived server-side from the JWT
    const response = await fetch(`${API_BASE_URL}/my-trips`, {
      headers: {
        'Authorization': `Bearer ${token}`   // ← JWT token
      }
    });
    const history = await response.json();

    if (response.status === 401 || response.status === 403) {
      // Token expired or tampered — force re-login
      showToast('Session expired. Please log in again.', 'error');
      localStorage.removeItem('tp_token');
      localStorage.removeItem('tp_user');
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
      return;
    }

    if (!response.ok) {
      throw new Error(history.error || 'Failed to load trips');
    }

    if (!history || history.length === 0) {
      container.innerHTML = '<div class="empty-state"><span class="empty-icon">🗺️</span><p>No trips planned yet. <a href="chat.html" style="color: var(--accent-coral);">Plan a new trip →</a></p></div>';
      return;
    }

    // Sort by latest trip first
    history.reverse();

    container.innerHTML = history.map(trip => {
      const emoji = getPlaceEmoji(trip.place);
      const budgetDisplay = trip.budget
        ? `₹${parseInt(trip.budget).toLocaleString('en-IN')}`
        : 'N/A';
      return `
        <div class="trip-history-item" style="cursor:pointer;" data-trip-id="${trip.tripId}" onclick="viewSavedTrip('${trip.tripId}')">
          <div class="trip-history-icon">${emoji}</div>
          <div class="trip-history-info">
            <h4>${trip.place}</h4>
            <span>${trip.days} days · ${trip.date || 'Recently'}</span>
          </div>
          <div class="trip-history-budget">
            <h4>${budgetDisplay}</h4>
            <span>Budget</span>
          </div>
        </div>
      `;
    }).join('');

    // Store fetched history locally for other stats or quick viewing
    localStorage.setItem('tp_trip_history_fetched', JSON.stringify(history));

    // Update stats on profile side panel
    updateProfileStats(history);

  } catch (error) {
    console.error('Fetch trips error:', error);
    container.innerHTML = '<div class="empty-state"><span class="empty-icon">⚠️</span><p>Could not load your trips. Please try again later.</p></div>';
  }
}

function updateProfileStats(history) {
  const tripCountEl = document.getElementById('trip-count');
  if (tripCountEl) tripCountEl.textContent = history.length;

  const destCount = new Set(history.map(t => t.place)).size;
  const destCountEl = document.getElementById('dest-count');
  if (destCountEl) destCountEl.textContent = destCount;
}

window.viewSavedTrip = function(tripId) {
  // Toggle inline itinerary expansion
  const row = document.querySelector(`.trip-history-item[data-trip-id="${tripId}"]`);
  if (!row) return;
  const existing = row.nextElementSibling;
  if (existing && existing.classList.contains('trip-inline-detail')) {
    existing.remove();
    return;
  }
  const history = JSON.parse(localStorage.getItem('tp_trip_history_fetched') || '[]');
  const trip = history.find(t => t.tripId === tripId);
  if (!trip || !trip.itinerary) return;
  const detail = document.createElement('div');
  detail.className = 'trip-inline-detail';
  detail.style.cssText = 'background: var(--bg-glass); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px; animation: fadeInUp 0.3s ease;';
  const itin = trip.itinerary;
  let html = '';
  if (itin.days && itin.days.length) {
    itin.days.forEach(d => {
      html += `<div style="margin-bottom:10px;"><strong style="color:var(--accent-coral);">Day ${d.day}</strong><br>
        <span style="color:var(--text-secondary); font-size:0.88rem;">🌅 ${d.morning || ''}<br>☀️ ${d.afternoon || ''}<br>🌙 ${d.evening || ''}</span></div>`;
    });
  }
  if (itin.tips && itin.tips.length) {
    html += `<strong style="color:var(--accent-teal);">Tips:</strong><ul style="color:var(--text-secondary);font-size:0.88rem;padding-left:16px;">`;
    itin.tips.forEach(t => { html += `<li>${t}</li>`; });
    html += '</ul>';
  }
  detail.innerHTML = html || '<p style="color:var(--text-muted);">No details available.</p>';
  row.after(detail);
};

function getPlaceEmoji(place) {
  const map = {
    'Goa': '🏖️', 'Manali': '🏔️', 'Jaipur': '🏀', 'Kerala': '🌴',
    'Delhi': '🏙️', 'Varanasi': '🙏', 'Bihar': '🗻️',
    'Odisha': '🌊', 'Kashmir': '❄️', 'Mumbai': '🏙️',
    'Agra': '🏛️', 'Kolkata': '📚', 'Bangalore': '💻',
    'Hyderabad': '🫕', 'Chennai': '🎶', 'Rajasthan': '🏀'
  };
  return map[place] || '📍';
}

function initDashboardMap() {
  const mapEl = document.getElementById('dashboard-map');
  if (!mapEl || typeof L === 'undefined') return;

  const map = L.map('dashboard-map', {
    center: [20.5937, 78.9629],
    zoom: 4,
    zoomControl: false,
    scrollWheelZoom: false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // Use server-fetched trips (accurate) with fallback to local cache
  const history = JSON.parse(localStorage.getItem('tp_trip_history_fetched') || localStorage.getItem('tp_trip_history') || '[]');

  const coordinates = {
    'Goa': [15.2993, 74.1240], 'Manali': [32.2396, 77.1887],
    'Jaipur': [26.9124, 75.7873], 'Kerala': [10.8505, 76.2711],
    'Delhi': [28.6139, 77.2090], 'Varanasi': [25.3176, 82.9739],
    'Bihar': [25.0961, 85.3131], 'Odisha': [20.9517, 85.0985],
    'Kashmir': [34.0837, 74.7973], 'Mumbai': [19.0760, 72.8777],
    'Agra': [27.1767, 78.0081], 'Kolkata': [22.5726, 88.3639],
    'Paris': [48.8566, 2.3522], 'Tokyo': [35.6764, 139.6500],
    'New York': [40.7128, -74.0060]
  };

  history.forEach(trip => {
    let latlng = coordinates[trip.place];
    if (trip.lat && trip.lon) latlng = [parseFloat(trip.lat), parseFloat(trip.lon)];
    if (!latlng) return;

    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="background:var(--gradient-primary); width:20px; height:20px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px rgba(255,107,107,0.5);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    L.marker(latlng, { icon: customIcon }).addTo(map)
      .bindPopup(`<b>${trip.place}</b><br>${trip.days} Days • ₹${parseInt(trip.budget || 0).toLocaleString('en-IN')}`);
  });
}

function loadSavedItinerary() {
  const container = document.getElementById('saved-itinerary-container');
  if (!container) return;

  const savedData = JSON.parse(localStorage.getItem('tp_saved_itinerary') || 'null');
  
  if (!savedData) {
    container.innerHTML = '<div class="empty-state"><span class="empty-icon">🤖</span><p>No AI itineraries generated yet. <a href="chat.html" style="color: var(--accent-coral);">Chat with AI now →</a></p></div>';
    return;
  }

  // Advanced markdown parser
  const parseMd = (text) => {
    if (!text) return '';
    let html = text
      .replace(/^### (.*$)/gim, '<h4 style="color:var(--accent-coral); margin-top:10px; margin-bottom:8px;">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 style="color:var(--text-primary); margin-top:12px; margin-bottom:8px;">$1</h3>')
      .replace(/^# (.*$)/gim, '<h2 style="color:var(--text-primary); margin-top:15px; margin-bottom:10px;">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary);">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\s*[-*]\s+(.*)$/gim, '<div style="margin-left:15px; display:flex; gap:8px; margin-bottom:4px;"><span style="color:var(--accent-coral)">•</span><span>$1</span></div>');

    html = html.replace(/\n/g, '<br>');
    html = html.replace(/(<br>\s*)+(<div style="margin-left)/g, '$2');
    html = html.replace(/(<\/div>)\s*(<br>)+/g, '$1');
    html = html.replace(/(<\/h[234]>)\s*(<br>)+/g, '$1');
    return html;
  };

  let html = `<div style="display:flex; flex-direction:column; gap:16px;">`;

  if (savedData.itinerary) {
    html += `<div style="background: rgba(255,255,255,0.05); padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
      <h4 style="color:var(--accent-coral); margin-bottom:12px; font-family:var(--font-heading);">📅 Generated Itinerary</h4>
      <div style="color:var(--text-secondary); font-size:0.95rem; line-height:1.6;">${parseMd(savedData.itinerary)}</div>
    </div>`;
  }

  if (savedData.cost || savedData.costBreakdown) {
    const costData = savedData.cost || (Array.isArray(savedData.costBreakdown) ? savedData.costBreakdown.map(c => `**${c.category}:** ${c.estimatedCost}`).join('\\n') : '');
    html += `<div style="background: rgba(255,255,255,0.05); padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
      <h4 style="color:var(--accent-coral); margin-bottom:12px; font-family:var(--font-heading);">💰 Estimated Costs</h4>
      <div style="color:var(--text-secondary); font-size:0.95rem; line-height:1.6;">${parseMd(costData)}</div>
    </div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

function initEditProfile() {
  const form = document.getElementById('edit-profile-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('edit-name').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();

    if (!name) {
      showToast('Name is required', 'error');
      return;
    }

    const user = JSON.parse(localStorage.getItem('tp_user') || '{}');
    user.name = name;
    user.email = email;
    user.phone = phone;
    user.bio = bio;
    localStorage.setItem('tp_user', JSON.stringify(user));

    showToast('Profile updated successfully!');
    loadUserProfile();
  });
}

function initLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', () => {
    // Clear JWT token and user data from localStorage
    localStorage.removeItem('tp_token');
    localStorage.removeItem('tp_user');
    showToast('Logged out successfully');
    setTimeout(() => { window.location.href = 'login.html'; }, 800);
  });
}
