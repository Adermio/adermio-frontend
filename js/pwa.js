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

  // 2. Install Banner — DISABLED until auth system is in place
  //    Re-enable when user accounts + dashboard are ready
  return;
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
    if (document.getElementById('adermio-pwa-banner')) return;
    if (localStorage.getItem('adermio_pwa_dismissed')) return;

    var shareIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F3D39" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>';

    var banner = document.createElement('div');
    banner.id = 'adermio-pwa-banner';

    if (isIOS) {
      // iOS: card with clear step-by-step instructions
      banner.innerHTML =
        '<div class="apwa-card">' +
          '<div class="apwa-header">' +
            '<img src="/android-chrome-192x192.png" alt="Adermio" width="44" height="44" class="apwa-logo">' +
            '<div>' +
              '<div class="apwa-title">' + (isEN ? 'Install Adermio' : 'Installer Adermio') + '</div>' +
              '<div class="apwa-subtitle">' + (isEN ? 'Access your analysis anytime' : 'Accedez a votre analyse a tout moment') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="apwa-steps">' +
            '<div class="apwa-step">' +
              '<span class="apwa-step-num">1</span>' +
              '<span>' + (isEN
                ? 'Tap the share button ' + shareIcon + ' at the bottom of Safari'
                : 'Appuyez sur le bouton partage ' + shareIcon + ' en bas de Safari') +
              '</span>' +
            '</div>' +
            '<div class="apwa-step">' +
              '<span class="apwa-step-num">2</span>' +
              '<span>' + (isEN
                ? 'Scroll down and tap "<b>Add to Home Screen</b>"'
                : 'Faites defiler et appuyez sur "<b>Sur l\'ecran d\'accueil</b>"') +
              '</span>' +
            '</div>' +
          '</div>' +
          '<button class="apwa-dismiss-btn" id="apwa-dismiss">' + (isEN ? 'Got it' : 'Compris') + '</button>' +
        '</div>';
    } else {
      // Android/Desktop: compact banner with install button
      banner.innerHTML =
        '<div class="apwa-card apwa-compact">' +
          '<img src="/android-chrome-192x192.png" alt="Adermio" width="40" height="40" class="apwa-logo">' +
          '<div class="apwa-text">' +
            '<div class="apwa-title">' + (isEN ? 'Install Adermio' : 'Installer Adermio') + '</div>' +
            '<div class="apwa-subtitle">' + (isEN ? 'Track your skin progress' : "Suivez l'evolution de votre peau") + '</div>' +
          '</div>' +
          '<button class="apwa-install-btn" id="apwa-install">' + (isEN ? 'Install' : 'Installer') + '</button>' +
          '<button class="apwa-close-btn" id="apwa-dismiss" aria-label="Close">&times;</button>' +
        '</div>';
    }

    var style = document.createElement('style');
    style.textContent =
      '#adermio-pwa-banner {' +
        'position: fixed; bottom: 80px; left: 12px; right: 12px; z-index: 999998;' +
        'transform: translateY(20px); opacity: 0;' +
        'animation: apwa-fade-in 0.4s ease-out 0.3s forwards;' +
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;' +
        'pointer-events: none;' +
      '}' +
      '@keyframes apwa-fade-in { to { transform: translateY(0); opacity: 1; } }' +
      '.apwa-card {' +
        'background: #fff; border-radius: 16px;' +
        'box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04);' +
        'padding: 16px; max-width: 400px; margin: 0 auto;' +
        'pointer-events: auto;' +
      '}' +
      '.apwa-compact {' +
        'display: flex; align-items: center; gap: 12px;' +
      '}' +
      '.apwa-header {' +
        'display: flex; align-items: center; gap: 12px; margin-bottom: 16px;' +
      '}' +
      '.apwa-logo { border-radius: 12px; flex-shrink: 0; }' +
      '.apwa-text { flex: 1; min-width: 0; }' +
      '.apwa-title { font-size: 16px; font-weight: 700; color: #0F3D39; }' +
      '.apwa-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }' +
      '.apwa-steps { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }' +
      '.apwa-step {' +
        'display: flex; align-items: flex-start; gap: 10px;' +
        'font-size: 14px; color: #334155; line-height: 1.5;' +
      '}' +
      '.apwa-step-num {' +
        'width: 24px; height: 24px; border-radius: 50%;' +
        'background: #0F3D39; color: #fff; font-size: 13px; font-weight: 700;' +
        'display: flex; align-items: center; justify-content: center; flex-shrink: 0;' +
      '}' +
      '.apwa-dismiss-btn {' +
        'width: 100%; padding: 12px; border: none; border-radius: 10px;' +
        'background: #f1f5f9; color: #0F3D39; font-size: 15px; font-weight: 600;' +
        'cursor: pointer; transition: background 0.2s;' +
      '}' +
      '.apwa-dismiss-btn:active { background: #e2e8f0; }' +
      '.apwa-install-btn {' +
        'background: #0F3D39; color: #fff; border: none; border-radius: 50px;' +
        'padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer;' +
        'white-space: nowrap; flex-shrink: 0;' +
      '}' +
      '.apwa-install-btn:active { opacity: 0.8; }' +
      '.apwa-close-btn {' +
        'background: none; border: none; font-size: 22px; color: #94a3b8;' +
        'cursor: pointer; padding: 0 4px; line-height: 1; flex-shrink: 0;' +
      '}';

    document.head.appendChild(style);
    document.body.appendChild(banner);

    // Install button (Android/Desktop)
    var installBtn = document.getElementById('apwa-install');
    if (installBtn && deferredPrompt) {
      installBtn.addEventListener('click', function () {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (result) {
          if (result.outcome === 'accepted') {
            console.log('Adermio PWA installed');
          }
          deferredPrompt = null;
          dismissBanner();
        });
      });
    }

    // Dismiss button (both iOS and Android close)
    var dismissBtn = document.getElementById('apwa-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function () {
        dismissBanner();
      });
    }
  }

  function dismissBanner() {
    localStorage.setItem('adermio_pwa_dismissed', '1');
    var b = document.getElementById('adermio-pwa-banner');
    if (b) {
      b.style.animation = 'none';
      b.style.opacity = '0';
      b.style.transform = 'translateY(20px)';
      b.style.transition = 'all 0.3s ease-in';
      setTimeout(function () { b.remove(); }, 300);
    }
  }
})();
