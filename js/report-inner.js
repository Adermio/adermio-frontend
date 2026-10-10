// Adermio — chargé DANS le rapport gratuit (HTML S3, ajouté en fin de gabarit dans les workflows n8n web, 09/10/2026).
// Signale à la page qui l'encadre (/free-analysis, js/report-track.js) : rapport prêt, page 2 atteinte, profondeur de
// lecture (25/50/75/100 %). N'agit que dans une iframe d'adermio.com ; ne touche ni au rapport ni au bouton Stripe.
(function (w, d) {
  try {
    if (w.parent === w) return;
    var TARGET = 'https://adermio.com';
    var say = function (m) { try { m.type = 'ADERMIO_TRACK'; w.parent.postMessage(m, TARGET); } catch (e) {} };
    var start = function () {
      try {
        var pages = d.querySelectorAll('.pdf-page');
        // Page 2 abonnement (bouton « Commencer mon suivi ») d'abord : elle reprend aussi les pages floutées .o2p.
        var variant = d.querySelector('[data-cta="subscription"]') ? 'page2-abonnement'
          : d.querySelector('.o2p') ? 'page2-ancienne' : 'page2-standard';
        say({ event: 'ready', pages: pages.length, variant: variant });
        var p2 = pages[1];
        if (p2 && w.IntersectionObserver) {
          var io = new IntersectionObserver(function (es) {
            es.forEach(function (x) { if (x.isIntersecting) { say({ event: 'page2' }); io.disconnect(); } });
          }, { threshold: 0.15 });
          io.observe(p2);
        }
        var marks = [25, 50, 75, 100], done = {};
        var onScroll = function () {
          try {
            var h = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight) - w.innerHeight;
            var pct = h > 0 ? Math.round((w.scrollY || d.documentElement.scrollTop) / h * 100) : 100;
            marks.forEach(function (m) { if (pct >= m && !done[m]) { done[m] = 1; say({ event: 'scroll', pct: m }); } });
          } catch (e) {}
        };
        w.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      } catch (e) {}
    };
    if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
  } catch (e) {}
})(window, document);
