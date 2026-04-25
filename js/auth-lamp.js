/* ═══════════════════════════════════════════════════════
   AUTH-LAMP.JS — Cinematic lamp drag + viewport escape btn
   ═══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────
     UTIL — must be defined FIRST (const is not hoisted)
  ───────────────────────────────────────────────────── */
  function el(tag, text) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    return node;
  }
  function elId(tag, id) {
    const node = document.createElement(tag);
    node.id = id;
    return node;
  }

  /* ─────────────────────────────────────────────────────
     1.  BUILD LAMP SCENE DOM
  ───────────────────────────────────────────────────── */
  function buildScene() {
    const scene = elId('div', 'lamp-scene');

    /* Stars */
    const stars = elId('div', 'ls-stars-wrap');
    stars.className = 'ls-stars';
    for (let i = 0; i < 90; i++) {
      const s = document.createElement('div');
      s.className = 'ls-star';
      const size = Math.random() < 0.25 ? 3 : 2;
      s.style.cssText =
        'left:'  + (Math.random() * 100).toFixed(1) + '%;' +
        'top:'   + (Math.random() * 100).toFixed(1) + '%;' +
        'width:' + size + 'px;height:' + size + 'px;' +
        '--dur:' + (Math.random() * 3 + 2).toFixed(1) + 's;' +
        '--del:' + (Math.random() * 5).toFixed(1) + 's;';
      stars.appendChild(s);
    }

    /* Glow layers */
    const ambient   = elId('div', 'ls-ambient');
    const floorGlow = elId('div', 'ls-floor-glow');
    const cone      = elId('div', 'ls-cone');

    /* Lamp assembly */
    const lampWrap  = elId('div', 'ls-lamp-wrap');
    const wire      = elId('div', 'ls-wire');
    const cap       = elId('div', 'ls-cap');
    const shade     = elId('div', 'ls-shade');
    const bulb      = elId('div', 'ls-bulb');
    shade.appendChild(bulb);

    /* Rope */
    const ropeWrap  = elId('div', 'ls-rope-wrap');
    ropeWrap.setAttribute('role', 'button');
    ropeWrap.setAttribute('tabindex', '0');
    ropeWrap.setAttribute('aria-label', 'Drag rope to turn on lamp');
    const rope      = elId('div', 'ls-rope');
    const knot      = elId('div', 'ls-rope-knot');
    ropeWrap.appendChild(rope);
    ropeWrap.appendChild(knot);

    lampWrap.appendChild(wire);
    lampWrap.appendChild(cap);
    lampWrap.appendChild(shade);
    lampWrap.appendChild(ropeWrap);

    /* Hint */
    const hint = elId('div', 'ls-hint');
    hint.textContent = '💡 Drag the rope to enter';

    scene.appendChild(stars);
    scene.appendChild(ambient);
    scene.appendChild(floorGlow);
    scene.appendChild(cone);
    scene.appendChild(lampWrap);
    scene.appendChild(hint);

    document.body.insertBefore(scene, document.body.firstChild);
    return { scene, rope, ropeWrap, knot, hint };
  }

  /* ─────────────────────────────────────────────────────
     2.  ROPE DRAG — with stretch physics
  ───────────────────────────────────────────────────── */
  function initRopeDrag(scene, rope, ropeWrap, knot, hint) {
    var BASE_H   = 110;   // resting rope height px
    var MAX_PULL = 90;    // maximum drag px
    var TRIGGER  = 52;    // drag distance to trigger lamp

    var dragging  = false;
    var startY    = 0;
    var pullDist  = 0;
    var triggered = false;

    function clientY(e) {
      return e.touches ? e.touches[0].clientY : e.clientY;
    }

    function onStart(e) {
      if (triggered) return;
      dragging  = true;
      startY    = clientY(e);
      rope.style.transition = 'none';
      ropeWrap.style.transition = 'none';
      e.preventDefault();
    }

    function onMove(e) {
      if (!dragging || triggered) return;
      pullDist = Math.max(0, Math.min(MAX_PULL, clientY(e) - startY));

      rope.style.height = (BASE_H + pullDist * 0.65) + 'px';

      var sway = (pullDist / MAX_PULL) * 3;
      ropeWrap.style.transform = 'rotate(' + sway + 'deg)';
      knot.style.transform      = 'scale(' + (1 + pullDist / MAX_PULL * 0.18) + ')';

      var glow = pullDist / MAX_PULL;
      document.getElementById('ls-bulb').style.boxShadow =
        '0 0 ' + (10 * glow) + 'px ' + (4 * glow) + 'px rgba(255,220,80,' + (0.6 * glow) + ')';

      e.preventDefault();
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;

      rope.style.transition     = 'height 0.4s cubic-bezier(0.34,1.56,0.64,1)';
      ropeWrap.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';

      if (pullDist >= TRIGGER && !triggered) {
        triggered = true;
        activateLamp(scene, hint);
      } else {
        /* Bounce back */
        rope.style.height         = BASE_H + 'px';
        ropeWrap.style.transform  = 'rotate(0deg)';
        knot.style.transform      = 'scale(1)';
        document.getElementById('ls-bulb').style.boxShadow = '';
        pullDist = 0;
      }
    }

    ropeWrap.addEventListener('mousedown',  onStart, { passive: false });
    document.addEventListener('mousemove',  onMove,  { passive: false });
    document.addEventListener('mouseup',    onEnd);
    ropeWrap.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove',  onMove,  { passive: false });
    document.addEventListener('touchend',   onEnd);

    /* Also support plain click / keyboard */
    ropeWrap.addEventListener('click', function () {
      if (!triggered) { triggered = true; activateLamp(scene, hint); }
    });
    ropeWrap.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && !triggered) {
        e.preventDefault();
        triggered = true;
        activateLamp(scene, hint);
      }
    });
  }

  /* ─────────────────────────────────────────────────────
     3.  ACTIVATE LAMP + REVEAL FORM
  ───────────────────────────────────────────────────── */
  function activateLamp(scene, hint) {
    /* Ripple at knot */
    var knot  = document.getElementById('ls-rope-knot');
    var rect  = knot.getBoundingClientRect();
    var rip   = document.createElement('div');
    rip.className = 'ls-ripple';
    rip.style.left = (rect.left + rect.width  / 2 - 6) + 'px';
    rip.style.top  = (rect.top  + rect.height / 2 - 6) + 'px';
    document.body.appendChild(rip);
    rip.addEventListener('animationend', function () { rip.remove(); }, { once: true });

    /* Soft click sound */
    try {
      var ctx  = new (window.AudioContext || window.webkitAudioContext)();
      var osc  = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (_) {}

    scene.classList.add('ls-on');
    hint.textContent = '✨ Welcome!';

    /* Fade out scene, reveal form */
    setTimeout(function () {
      scene.style.transition = 'opacity 0.8s ease';
      scene.style.opacity    = '0';
      scene.style.pointerEvents = 'none';

      var authPage = document.querySelector('.auth-page');
      if (authPage) {
        authPage.style.display    = '';
        authPage.style.visibility = 'visible';
        /* Double rAF to ensure display:'' is painted before transition fires */
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            authPage.classList.add('ls-revealed');
          });
        });
      }

      setTimeout(function () { scene.remove(); }, 900);
    }, 850);
  }

  /* ─────────────────────────────────────────────────────
     4.  FORM SHAKE
  ───────────────────────────────────────────────────── */
  var shakeStyle = document.createElement('style');
  shakeStyle.textContent =
    '@keyframes ls-shake{' +
      '0%,100%{transform:translateX(0)}' +
      '15%{transform:translateX(-7px)}' +
      '30%{transform:translateX(7px)}' +
      '45%{transform:translateX(-5px)}' +
      '60%{transform:translateX(5px)}' +
      '75%{transform:translateX(-2px)}' +
      '90%{transform:translateX(2px)}' +
    '}' +
    '.ls-shaking{animation:ls-shake 0.5s ease!important;}';
  document.head.appendChild(shakeStyle);

  function shakeForm(form) {
    form.classList.remove('ls-shaking');
    void form.offsetHeight;
    form.classList.add('ls-shaking');
    form.addEventListener('animationend', function () {
      form.classList.remove('ls-shaking');
    }, { once: true });
  }

  /* ─────────────────────────────────────────────────────
     5.  SHARED TOOLTIP (one instance for whole page)
  ───────────────────────────────────────────────────── */
  var _tip      = null;
  var _tipTimer = null;

  function showTooltip(text, anchorBtn, duration) {
    if (!_tip) {
      _tip = document.createElement('div');
      _tip.className = 'ls-tooltip';
      document.body.appendChild(_tip);
    }
    _tip.textContent = text;

    var r = anchorBtn.getBoundingClientRect();
    _tip.style.left = (r.left + r.width / 2) + 'px';
    _tip.style.top  = Math.max(8, r.top - 50) + 'px';

    _tip.classList.remove('show');
    void _tip.offsetHeight;
    _tip.classList.add('show');

    clearTimeout(_tipTimer);
    _tipTimer = setTimeout(function () { _tip.classList.remove('show'); }, duration || 2000);
  }

  /* ─────────────────────────────────────────────────────
     6.  ESCAPING BUTTON — viewport-bounded fixed position
  ───────────────────────────────────────────────────── */
  var MAX_ESCAPES  = 4;
  var EDGE_MARGIN  = 28;

  var TOOLTIP_MSGS = [
    'Fill the details first 😄',
    'Not so fast! 😏',
    "I'm watching you... 👀",
    'Last chance! Fill up 😤'
  ];

  function initEscapeButton(btn) {
    var form = btn.closest('form');
    if (!form) return;

    /* Wrapper + error message */
    var wrapper   = document.createElement('div');
    wrapper.className = 'ls-btn-wrapper';
    btn.parentNode.insertBefore(wrapper, btn);
    wrapper.appendChild(btn);

    var errMsg = document.createElement('div');
    errMsg.className = 'ls-error-msg';
    errMsg.textContent = '⚠️ Please fill all required details';
    wrapper.appendChild(errMsg);

    var escapes  = 0;
    var isFixed  = false;
    var ghost    = null;

    /* ── Validation ──────────────────────────────────── */
    function valid() {
      var inputs = form.querySelectorAll('input[required]');
      for (var i = 0; i < inputs.length; i++) {
        var inp = inputs[i];
        if (!inp.value.trim()) return false;
        if (inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value)) return false;
        if (inp.type === 'tel'   && !/^\d{10}$/.test(inp.value.trim())) return false;
      }
      var pw  = form.querySelector('#signup-password, #login-password');
      var cfw = form.querySelector('#signup-confirm');
      if (pw  && pw.value.length < 6)              return false;
      if (cfw && pw && cfw.value !== pw.value)      return false;
      return true;
    }

    /* ── Move via Fixed Body Append ─────────────────────── */
    function moveButton() {
      if (!isFixed) {
        /* Snapshot natural position first */
        var r = btn.getBoundingClientRect();
        
        /* Create ghost to hold the layout space */
        if (!ghost) {
          ghost = document.createElement('div');
          wrapper.insertBefore(ghost, btn);
        }
        ghost.style.cssText = 'height:' + r.height + 'px; width:100%; visibility:hidden; display:block;';
        
        /* Pop out to body so it can traverse the whole screen freely */
        document.body.appendChild(btn);
        
        btn.classList.add('ls-escape-mode');
        btn.style.width  = r.width + 'px';
        btn.style.height = r.height + 'px';
        btn.style.left   = r.left + 'px';
        btn.style.top    = r.top + 'px';
        btn.style.margin = '0';
        
        /* Force reflow so transition kicks in from natural spot */
        void btn.offsetWidth;
        
        isFixed  = true;
      }

      var bw   = btn.offsetWidth;
      var bh   = btn.offsetHeight;
      var vw   = window.innerWidth;
      var vh   = window.innerHeight;

      /* Random target position in viewport */
      var targetX = EDGE_MARGIN + Math.random() * (vw - bw - EDGE_MARGIN * 2);
      var targetY = EDGE_MARGIN + Math.random() * (vh - bh - EDGE_MARGIN * 2);

      var rot  = (Math.random() * 10 - 5).toFixed(1);
      btn.style.left = targetX + 'px';
      btn.style.top  = targetY + 'px';
      btn.style.transform = 'rotate(' + rot + 'deg)';
    }

    /* ── Reset Function ──────────────────────────────── */
    btn._resetEscape = function() {
      if (isFixed) {
        btn.style.position = '';
        btn.style.left = '';
        btn.style.top = '';
        btn.style.transform = '';
        btn.style.width = '';
        btn.style.height = '';
        btn.style.margin = '';
        btn.classList.remove('ls-escape-mode');
        wrapper.insertBefore(btn, ghost);
        if (ghost) ghost.style.display = 'none';
        isFixed = false;
        escapes = 0;
      }
    };

    /* ── Escape logic ────────────────────────────────── */
    function doEscape() {
      var msgIndex = escapes < TOOLTIP_MSGS.length ? escapes : Math.floor(Math.random() * TOOLTIP_MSGS.length);
      showTooltip(TOOLTIP_MSGS[msgIndex], btn, 1800);
      shakeForm(form);
      moveButton();
      escapes++;
      errMsg.classList.remove('visible');
    }

    /* ── Escape on hover (desktop) ───────────────────── */
    btn.addEventListener('mouseenter', function (e) {
      if (!valid()) {
        doEscape();
      }
    });

    /* ── Intercept submit click in capture phase ─────── */
    btn.addEventListener('click', function (e) {
      if (valid()) {
        setValid();
        /* allow normal submit */
      } else {
        e.preventDefault();
        e.stopImmediatePropagation();
        doEscape();
      }
    }, true);

    /* ── Escape on touch (mobile) ────────────────────── */
    btn.addEventListener('touchstart', function (e) {
      if (!valid()) {
        e.preventDefault();
        doEscape();
      }
    }, { passive: false });

    /* ── Live validation ─────────────────────────────── */
    form.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        if (valid()) { setValid(); }
        else         { btn.classList.remove('ls-valid'); }
      });
    });

    function setValid() {
      btn.classList.add('ls-valid');
      if (escapes > 0) showTooltip('Ready to go 🚀', btn, 1500);
      errMsg.classList.remove('visible');
      btn._resetEscape();
    }
  }

  /* ─────────────────────────────────────────────────────
     7.  INIT ON DOM READY
  ───────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    /* Hide auth form until lamp is triggered */
    var authPage = document.querySelector('.auth-page');
    if (authPage) {
      authPage.style.display    = 'none';
      authPage.style.visibility = 'hidden';
    }

    /* Build & wire lamp */
    var parts = buildScene();
    initRopeDrag(parts.scene, parts.rope, parts.ropeWrap, parts.knot, parts.hint);

    /* Wire escape buttons (skip reset overlay) */
    document.querySelectorAll('.auth-submit').forEach(function (btn) {
      if (!btn.closest('#reset-form')) initEscapeButton(btn);
    });

    /* Reset escaped buttons when flipping the card */
    document.querySelectorAll('.auth-switch a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.querySelectorAll('.auth-submit').forEach(function (btn) {
          if (typeof btn._resetEscape === 'function') btn._resetEscape();
        });
      });
    });
  });

})();
