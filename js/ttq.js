// Adermio — TikTok Pixel.
//  - Routage par langue : pages /en/* → pixel EN (compte Adermio_adv),
//    tout le reste (FR + ES) → pixel FR (compte 3). Les ttq.track des pages
//    (CompletePayment sur success) partent automatiquement vers le pixel chargé.
//  - PageView : toutes les pages.
//  - ViewContent : arrivée sur le formulaire de scan (/formulaire, /formulaire2,
//    /en/form, /en/form2).
//    C'est le DERNIER événement fiablement attribuable pour le trafic TikTok :
//    il se déclenche dans le navigateur in-app AVANT que l'utilisateur bascule
//    vers Safari/Chrome pour scanner (bascule qui casse le clic-ID ttclid).
//    Sert d'événement d'optimisation ET de mesure « coût par arrivée ».
//  - CompletePayment : sur success.html (FR/EN/ES), après paiement Stripe
//    confirmé (présence du jobId). NB : non attribuable au trafic TikTok
//    in-app car il se déclenche dans le navigateur externe. Voir success.html.
!function (w, d, t) {
  w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"], ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } }; for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]); ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e }, ttq.load = function (e, n) { var r = "https://analytics.tiktok.com/i18n/pixel/events.js", o = n && n.partner; ttq._i = ttq._i || {}, ttq._i[e] = [], ttq._i[e]._u = r, ttq._t = ttq._t || {}, ttq._t[e] = +new Date, ttq._o = ttq._o || {}, ttq._o[e] = n || {}; n = document.createElement("script"); n.type = "text/javascript", n.async = !0, n.src = r + "?sdkid=" + e + "&lib=" + t; e = document.getElementsByTagName("script")[0]; e.parentNode.insertBefore(n, e) };

  var isEN = /^\/en(\/|$)/.test(w.location.pathname || '');
  ttq.load(isEN ? 'D9CBFSBC77U1ITCMP12G' : 'D9CEQGBC77U3GHS8I2BG');
  ttq.page();

  // ViewContent sur les pages du formulaire de scan. Dédup par session
  // (1 arrivée = 1 event, pas de double-comptage au refresh). Chemin
  // normalisé (retire .html et le / final) pour matcher les clean URLs.
  try {
    var p = (w.location.pathname || '').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    var FORM_PAGES = ['/formulaire', '/formulaire2', '/en/form', '/en/form2'];
    if (FORM_PAGES.indexOf(p) !== -1 && !w.sessionStorage.getItem('ttq_vc_' + p)) {
      ttq.track('ViewContent', {
        contents: [{ content_id: 'free_scan', content_type: 'product', content_name: isEN ? 'Adermio free skin analysis' : 'Analyse gratuite Adermio' }]
      });
      w.sessionStorage.setItem('ttq_vc_' + p, '1');
    }
  } catch (e) {}
}(window, document, 'ttq');
