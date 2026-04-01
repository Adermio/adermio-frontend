// Adermio PWA — Service Worker Registration + Install Banner
(function () {
  'use strict';

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/service-worker.js')
        .then(function (reg) {
          console.log('Adermio SW registered:', reg.scope);
        })
        .catch(function (err) {
          console.log('Adermio SW registration failed:', err);
        });
    });
  }

  // 2. Install Banner — only on premium result pages
  var premiumPaths = [
    '/premium', '/en/premium',
    '/bilan', '/en/bilan',
    '/premium-second-cycle', '/en/premium-second-cycle'
  ];

  var path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  var isPremiumPage = premiumPaths.indexOf(path) !== -1;

  if (!isPremiumPage) return;

  // Don't show if already installed as standalone
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return;

  // Don't show if user dismissed it
  if (localStorage.getItem('adermio_pwa_dismissed')) return;

  var lang = document.documentElement.lang || 'fr';
  var isEN = lang === 'en';
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  var deferredPrompt = null;

  // Capture beforeinstallprompt (Chrome/Edge/Samsung)
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    showBanner();
  });

  // On iOS, show banner after short delay (no beforeinstallprompt event)
  if (isIOS) {
    setTimeout(showBanner, 2000);
  }

  function showBanner() {
    // Safety: don't show twice
    if (document.getElementById('adermio-pwa-banner')) return;
    if (localStorage.getItem('adermio_pwa_dismissed')) return;

    var banner = document.createElement('div');
    banner.id = 'adermio-pwa-banner';
    banner.innerHTML =
      '<div class="apwa-content">' +
        '<div class="apwa-icon">' +
          '<img src="/android-chrome-192x192.png" alt="Adermio" width="40" height="40">' +
        '</div>' +
        '<div class="apwa-text">' +
          '<div class="apwa-title">' +
            (isEN ? 'Install Adermio' : 'Installer Adermio') +
          '</div>' +
          '<div class="apwa-desc">' +
            (isIOS
              ? (isEN
                  ? 'Tap <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> then "' + (isEN ? 'Add to Home Screen' : "Sur l'ecran d'accueil") + '"'
                  : 'Appuyez sur <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> puis "Sur l\'ecran d\'accueil"')
              : (isEN
                  ? 'Track your skin progress'
                  : "Suivez l'evolution de votre peau"))
          + '</div>' +
        '</div>' +
        (isIOS
          ? ''
          : '<button class="apwa-install-btn" id="apwa-install">' +
              (isEN ? 'Install' : 'Installer') +
            '</button>') +
        '<button class="apwa-close" id="apwa-close" aria-label="Fermer">&times;</button>' +
      '</div>';

    // Inject styles
    var style = document.createElement('style');
    style.textContent =
      '#adermio-pwa-banner {' +
        'position: fixed; bottom: 0; left: 0; right: 0; z-index: 999999;' +
        'background: #fff; border-top: 1px solid #e2e8f0;' +
        'box-shadow: 0 -4px 20px rgba(0,0,0,0.08);' +
        'padding: 14px 16px; padding-bottom: max(14px, env(safe-area-inset-bottom));' +
        'transform: translateY(100%); animation: apwa-slide-up 0.4s ease-out 0.3s forwards;' +
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;' +
      '}' +
      '@keyframes apwa-slide-up { to { transform: translateY(0); } }' +
      '.apwa-content {' +
        'display: flex; align-items: center; gap: 12px; max-width: 600px; margin: 0 auto;' +
      '}' +
      '.apwa-icon img { border-radius: 10px; display: block; }' +
      '.apwa-text { flex: 1; min-width: 0; }' +
      '.apwa-title { font-size: 15px; font-weight: 700; color: #0F3D39; line-height: 1.3; }' +
      '.apwa-desc { font-size: 13px; color: #64748b; line-height: 1.4; margin-top: 2px; }' +
      '.apwa-install-btn {' +
        'background: #0F3D39; color: #fff; border: none; border-radius: 50px;' +
        'padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer;' +
        'white-space: nowrap; flex-shrink: 0; transition: opacity 0.2s;' +
      '}' +
      '.apwa-install-btn:active { opacity: 0.8; }' +
      '.apwa-close {' +
        'position: absolute; top: 8px; right: 8px;' +
        'background: none; border: none; font-size: 20px; color: #94a3b8;' +
        'cursor: pointer; padding: 4px 8px; line-height: 1;' +
      '}';

    document.head.appendChild(style);
    document.body.appendChild(banner);

    // Install button handler (non-iOS)
    var installBtn = document.getElementById('apwa-install');
    if (installBtn && deferredPrompt) {
      installBtn.addEventListener('click', function () {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (result) {
          if (result.outcome === 'accepted') {
            console.log('Adermio PWA installed');
          }
          deferredPrompt = null;
          removeBanner();
        });
      });
    }

    // Close button
    document.getElementById('apwa-close').addEventListener('click', function () {
      localStorage.setItem('adermio_pwa_dismissed', '1');
      removeBanner();
    });
  }

  function removeBanner() {
    var b = document.getElementById('adermio-pwa-banner');
    if (b) {
      b.style.animation = 'none';
      b.style.transform = 'translateY(100%)';
      b.style.transition = 'transform 0.3s ease-in';
      setTimeout(function () { b.remove(); }, 300);
    }
  }
})();
