/* ═══════════════════════════════════════════════
   JS/CONFIG.JS — Centralised API Base URL
   ═══════════════════════════════════════════════

   This is the SINGLE source of truth for the
   backend API URL across the entire frontend.

   How it works:
     • In production  → VITE_API_URL / window.API_BASE_URL
       is injected at build time (Netlify env vars).
     • In local dev   → falls back to localhost:5000.

   To switch environments just update the Netlify
   env var REACT_APP_API_URL (or equivalent).

   ─── Usage ────────────────────────────────────
   Include this script BEFORE auth.js / chat.js:
     <script src="../js/config.js"></script>

   Then in any JS file:
     const res = await fetch(`${API_BASE_URL}/login`, { ... });
   ═══════════════════════════════════════════════ */

/**
 * API_BASE_URL — backend origin, no trailing slash.
 *
 * Priority:
 *   1. window.__API_BASE_URL  (injected by Netlify snippet or meta tag)
 *   2. Fallback to localhost for local development
 */
window.API_BASE_URL = (function () {
  // Allow Netlify / any host to inject the production URL at runtime.
  // Add a <script> in your Netlify post-processing or use a meta tag
  // approach. The simplest way is to set it via netlify.toml env vars
  // and bake it in during the build. Since this is a static site with
  // no build step, we read it from a global that can be set by a tiny
  // inline script placed BEFORE this file is loaded.
  if (window.__API_BASE_URL) return window.__API_BASE_URL;

  // Auto-detect: if page is served from a non-localhost origin,
  // the deployed Render URL must be provided via __API_BASE_URL above.
  // For now, default to localhost for local development.
  return 'http://localhost:5000';
})();
