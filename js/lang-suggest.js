// Adermio — suggestion de langue pour les visiteurs italiens des pages anglaises
//
// Constat (29/09/2026) : ~70 visiteurs/jour situés en Italie arrivent sur /en/*
// par un lien externe ; ils convertissent à ~2 % en anglais contre ~10 % sur
// /it. À l'arrivée, on leur propose la version italienne (même parcours) :
//   « Continua in italiano »  → page /it équivalente, query string conservée
//                               (utm, ttclid…) pour ne pas casser l'attribution ;
//   « Continue in English »   → on ferme et on ne redemande plus (localStorage).
//
// ══ RÈGLES ══
// - Jamais de redirection automatique : le visiteur choisit (et Googlebot,
//   résolu hors d'Italie, ne voit jamais rien → aucun effet sur l'indexation).
// - Jamais bloquant : tout est en try/catch, échec silencieux = rien affiché.
// - Styles en ligne (le CSS Tailwind compilé ne contient pas de nouvelles classes).
(function () {
  'use strict';

  var CHOICE_KEY = 'adermio_lang_choice_it';   // "en" = a choisi l'anglais
  var GEO_KEY = 'adermio_geo_country';         // même cache que /js/geo.js
  var TARGETS = { '/en/form': '/it/form', '/en/home': '/it/home' };

  function path() {
    return (location.pathname || '').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
  }
  function store(kind) {
    try { return window[kind]; } catch (e) { return null; }
  }
  function alreadyChose() {
    var ls = store('localStorage');
    try { return !!(ls && ls.getItem(CHOICE_KEY)); } catch (e) { return false; }
  }
  function remember() {
    var ls = store('localStorage');
    try { if (ls) ls.setItem(CHOICE_KEY, 'en'); } catch (e) { /* no-op */ }
  }

  function country() {
    var ss = store('sessionStorage');
    try {
      var c = ss && ss.getItem(GEO_KEY);
      if (c) return Promise.resolve(c);
    } catch (e) { /* no-op */ }
    if (typeof fetch !== 'function') return Promise.resolve('');
    return fetch('/api/geo', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var c = d && typeof d.country === 'string' ? d.country : '';
        try { if (c && ss) ss.setItem(GEO_KEY, c); } catch (e) { /* no-op */ }
        return c;
      })
      .catch(function () { return ''; });
  }

  function show(target) {
    var href = target + (location.search || '') + (location.hash || '');
    var root = document.createElement('div');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'adm-ls-title');
    root.setAttribute('lang', 'it');
    // Mobile : feuille en bas de l'écran ; ordinateur : fenêtre centrée.
    var wide = (window.innerWidth || 0) >= 640;
    root.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;align-items:' + (wide ? 'center' : 'flex-end') + ';justify-content:center;' +
      'background:rgba(15,61,57,.45);padding:16px;font-family:"DM Sans",system-ui,sans-serif;opacity:0;transition:opacity .25s ease';
    root.innerHTML =
      '<div style="width:100%;max-width:420px;background:#FAFAF9;border-radius:20px;padding:24px 22px 18px;' +
      'box-shadow:0 20px 50px rgba(15,61,57,.25);transform:translateY(16px);transition:transform .25s ease;margin-bottom:max(8px,env(safe-area-inset-bottom))">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">' +
          '<img src="https://flagcdn.com/it.svg" width="26" height="18" alt="" style="border-radius:3px;box-shadow:0 1px 2px rgba(0,0,0,.15)">' +
          '<span style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#14B8A6;font-weight:600">Italiano</span>' +
        '</div>' +
        '<h2 id="adm-ls-title" style="margin:0 0 8px;font-family:\'Playfair Display\',serif;font-size:22px;line-height:1.25;color:#0F3D39;font-weight:600">' +
          'Adermio è disponibile in italiano</h2>' +
        '<p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#44403C">' +
          'La Sua analisi gratuita e il report completo, interamente in italiano.</p>' +
        '<a data-adm-ls="it" href="' + href.replace(/"/g, '&quot;') + '" style="display:block;text-align:center;text-decoration:none;' +
          'background:#0F3D39;color:#fff;font-weight:600;font-size:16px;padding:14px 16px;border-radius:999px">Continua in italiano</a>' +
        '<button data-adm-ls="en" type="button" style="display:block;width:100%;margin-top:8px;background:none;border:0;' +
          'color:#57534E;font-size:14px;padding:12px;cursor:pointer;font-family:inherit">Continue in English</button>' +
      '</div>';

    var prevOverflow = document.body.style.overflow;
    function close() {
      remember();
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      root.style.opacity = '0';
      setTimeout(function () { if (root.parentNode) root.parentNode.removeChild(root); }, 250);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    root.addEventListener('click', function (e) {
      var t = e.target;
      if (t === root || (t.getAttribute && t.getAttribute('data-adm-ls') === 'en')) close();
      if (t.getAttribute && t.getAttribute('data-adm-ls') === 'it') {
        try { if (window.ttq) window.ttq.track('ClickButton', { content_name: 'lang_suggest_it' }); } catch (err) { /* no-op */ }
      }
    });
    document.addEventListener('keydown', onKey);

    document.body.appendChild(root);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () {
      root.style.opacity = '1';
      root.firstChild.style.transform = 'translateY(0)';
      var cta = root.querySelector('[data-adm-ls="it"]');
      try { cta.focus({ preventScroll: true }); } catch (e) { /* no-op */ }
    });
  }

  try {
    var target = TARGETS[path()];
    if (!target || alreadyChose() || !document.body) return;
    country().then(function (c) {
      try { if (c === 'IT' && !alreadyChose()) show(target); } catch (e) { /* no-op */ }
    });
  } catch (e) { /* jamais bloquant */ }
})();
