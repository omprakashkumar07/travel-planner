/* ═══════════════════════════════════════════════
   EXPLORE.JS — Dynamic Destination Data Fetching
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  loadDynamicDestination();
});

async function loadDynamicDestination() {
  const urlParams = new URLSearchParams(window.location.search);
  const placeName = urlParams.get('place') || 'Unknown Destination';
  const lat = parseFloat(urlParams.get('lat'));
  const lon = parseFloat(urlParams.get('lon'));

  // Update static UI first
  document.title = `${placeName} — TravelPlanner`;
  document.getElementById('dyn-title').textContent = placeName;
  document.getElementById('dyn-name').textContent = `About ${placeName}`;

  // Setup Map if we have coordinates
  if (!isNaN(lat) && !isNaN(lon)) {
    initMap(lat, lon, placeName);
  } else {
    document.getElementById('leaflet-map').innerHTML = '<div style="color:white; padding: 20px; text-align:center;">Map coordinates unavailable</div>';
  }

  // Plan trip CTA
  const planBtn = document.getElementById('plan-dynamic-btn');
  if (planBtn) {
    planBtn.textContent = `Plan Trip to ${placeName} →`;
    planBtn.addEventListener('click', () => {
      localStorage.setItem('selectedPlace', placeName);
      showToast(`${placeName} selected! Redirecting...`);
      setTimeout(() => { window.location.href = 'budget.html'; }, 800);
    });
  }

  // Fetch Wikipedia Summary
  try {
    const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      
      // Extract Description
      const descEl = document.getElementById('dyn-desc');
      if (wikiData.extract_html) {
        descEl.innerHTML = wikiData.extract_html;
      } else {
        descEl.innerHTML = '<p>Explore this beautiful location. Start planning your customized itinerary using TravelPlanner AI.</p>';
      }

      // Extract Image
      if (wikiData.thumbnail && wikiData.thumbnail.source) {
        const bgImg = wikiData.thumbnail.source.replace(/\d+px/, '1200px'); // Get higher res
        document.getElementById('dyn-hero-bg').style.backgroundImage = `url('${bgImg}')`;
      } else {
        // Fallback generic image
        document.getElementById('dyn-hero-bg').style.backgroundImage = `url('../images/hero-bg.png')`;
      }

      // Update Tagline
      if (wikiData.description) {
        document.getElementById('dyn-tagline').textContent = wikiData.description;
      }

    } else {
      throw new Error("Wikipedia page not found");
    }
  } catch (err) {
    console.error(err);
    document.getElementById('dyn-desc').innerHTML = '<p>Information for this location is currently unavailable. But you can still plan a trip here!</p>';
    document.getElementById('dyn-tagline').textContent = 'Explore the world with TravelPlanner';
    document.getElementById('dyn-hero-bg').style.backgroundImage = `url('../images/hero-bg.png')`;
  }
}

function initMap(lat, lon, placeName) {
  // We use Leaflet.js which should be included via CDN in the HTML
  if (typeof L === 'undefined') {
    setTimeout(() => initMap(lat, lon, placeName), 100);
    return;
  }

  const map = L.map('leaflet-map').setView([lat, lon], 12);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  L.marker([lat, lon]).addTo(map)
    .bindPopup(`<b>${placeName}</b><br>Start your adventure here.`)
    .openPopup();
}
