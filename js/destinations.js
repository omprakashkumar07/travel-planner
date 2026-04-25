/* ═══════════════════════════════════════════════
   DESTINATIONS.JS — Card interactions & search
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initDestSearch();
  initPlanButtons();
});

function initDestSearch() {
  const searchInput = document.getElementById('dest-search');
  if (!searchInput) return;

  let debounceTimer;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.dest-card:not(.dynamic-card)');
    const grid = document.querySelector('.dest-grid');
    
    // Remove existing dynamic card
    const existingDynamic = document.querySelector('.dynamic-card');
    if (existingDynamic) existingDynamic.remove();

    if (!query) {
      cards.forEach(card => {
        card.style.display = '';
        card.style.opacity = '1';
      });
      return;
    }

    let hasStaticMatch = false;
    cards.forEach(card => {
      const name = card.querySelector('h3').textContent.toLowerCase();
      const desc = card.querySelector('p').textContent.toLowerCase();
      const match = name.includes(query) || desc.includes(query);
      card.style.display = match ? '' : 'none';
      card.style.opacity = match ? '1' : '0';
      if (match) hasStaticMatch = true;
    });

    // If typing continues, wait to fetch
    debounceTimer = setTimeout(async () => {
      if (query.length < 3) return;
      
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          const place = data[0];
          const displayName = place.name || place.display_name.split(',')[0];
          
          // Don't show if it's already a static card
          if (Array.from(cards).some(c => c.querySelector('h3').textContent.toLowerCase() === displayName.toLowerCase() && c.style.display !== 'none')) {
            return;
          }

          const dynamicCard = document.createElement('div');
          dynamicCard.className = 'dest-card card dynamic-card reveal visible';
          dynamicCard.innerHTML = `
            <div class="dest-card-img" style="background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; height: 200px;">
              <span style="font-size: 4rem;">🌍</span>
              <span class="dest-card-price">Dynamic</span>
            </div>
            <div class="dest-card-body">
              <h3>${displayName}</h3>
              <div class="dest-card-location">📍 ${place.display_name.split(',').slice(-1)[0].trim()}</div>
              <p>Explore this amazing destination worldwide. Plan your perfect trip now.</p>
              <div class="dest-card-tags">
                <span class="dest-tag">🗺️ Global</span>
                <span class="dest-tag">✨ New</span>
              </div>
              <a href="explore.html?place=${encodeURIComponent(displayName)}&lat=${place.lat}&lon=${place.lon}" class="dest-card-link">Explore ${displayName} →</a>
            </div>
          `;
          grid.prepend(dynamicCard);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      }
    }, 800);
  });
}

function initPlanButtons() {
  document.querySelectorAll('[data-plan-city]').forEach(btn => {
    btn.addEventListener('click', () => {
      const city = btn.getAttribute('data-plan-city');
      localStorage.setItem('selectedPlace', city);
      showToast(`${city} selected! Redirecting to budget planner...`);
      setTimeout(() => {
        // Detect if we're in pages/ or root
        const isInPages = window.location.pathname.includes('/pages/');
        window.location.href = isInPages ? 'budget.html' : 'pages/budget.html';
      }, 800);
    });
  });
}
