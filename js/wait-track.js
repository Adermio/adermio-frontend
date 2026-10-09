// Adermio — suivi anonyme de la page d'attente de l'analyse gratuite (09/10/2026) : /analyse-en-cours (FR),
// /it|es|de|en/processing. N'ÉCRIT RIEN dans la page et ne change aucune logique : il OBSERVE les états que la page
// affiche déjà (même structure dans les 5 langues) :
//   #success-btn-container visible → wait_ready ; clic #access-btn → wait_click
//   #delayed-container visible (bloqué à 99 % après 30 s) → wait_long ; #delay-fail-content visible (« Oups », 60 s) → wait_fail
//   #face-error-popup → wait_noface ; #quality-error-popup → wait_retry ; resumeAnalysis() → wait_resume
//   clic vers le formulaire depuis un écran d'erreur → wait_restart ; application quittée / page fermée.
// Même table que le questionnaire et le rapport (web_form_funnel, insert seul), jointure par job_id.
(function (w, d) {
  try {
    var URL_ = 'https://zqhmobgjxmyziuwkrkqf.supabase.co/rest/v1/web_form_funnel';
    var KEY = 'sb_publishable_edhbug0_QNa6pzye-BEAxw_HR1GMtwe';
    var T0 = Date.now();
    var q = new URLSearchParams(w.location.search || '');
    var cut = function (v, n) { return (v === undefined || v === null || v === '') ? null : String(v).slice(0, n); };
    var job = cut(q.get('jobId'), 80);
    var path = ((w.location.pathname || '').replace(/\.html$/, '').replace(/\/+$/, '') || '/').slice(0, 60);
    var sKey = 'adermio_wait_sid_' + (job || '-'), sid = null;
    try { sid = w.sessionStorage.getItem(sKey); } catch (e) {}
    if (!sid) {
      sid = (w.crypto && w.crypto.randomUUID) ? w.crypto.randomUUID() :
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
      try { w.sessionStorage.setItem(sKey, sid); } catch (e) {}
    }
    var ua = navigator.userAgent || '';
    var country = null;
    try { country = cut(w.sessionStorage.getItem('adermio_geo_country'), 3); } catch (e) {}
    var base = {
      session_id: sid, job_id: job, path: path, lang: cut((d.documentElement.getAttribute('lang') || '').slice(0, 2), 5), country: country,
      device: /iPad|Tablet/i.test(ua) ? 'tablet' : (/Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop'),
      inapp: /musical_ly|BytedanceWebview|TikTok/i.test(ua) ? 'tiktok' : /Instagram/i.test(ua) ? 'instagram' : /FBAN|FBAV/i.test(ua) ? 'facebook' : null
    };
    var sent = 0, post = w.fetch ? w.fetch.bind(w) : null;
    function track(event, extra) {
      try {
        if (++sent > 100 || !post) return;
        var row = Object.assign({}, base, { event: event, ms: Math.min(Date.now() - T0, 86400000) }, extra || {});
        post(URL_, {
          method: 'POST', keepalive: true,
          headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify(row)
        }).catch(function () {});
        if (w.clarity) w.clarity('event', event);
      } catch (e) {}
    }

    track('view', { detail: job ? null : 'jobId absent' });

    // États affichés par la page : chacun n'est compté qu'une fois (sauf retour à l'attente après « reprendre »).
    var WATCH = [
      ['success-btn-container', 'wait_ready'], ['delayed-container', 'wait_long'], ['delay-fail-content', 'wait_fail'],
      ['face-error-popup', 'wait_noface'], ['quality-error-popup', 'wait_retry']
    ];
    var shown = {};
    var check = function () {
      try {
        WATCH.forEach(function (x) {
          var el = d.getElementById(x[0]);
          var vis = el && el.style && el.style.display && el.style.display !== 'none';
          if (vis && !shown[x[1]]) { shown[x[1]] = 1; track(x[1]); }
          else if (!vis && shown[x[1]] && x[1] === 'wait_long') shown[x[1]] = 0;
        });
      } catch (e) {}
    };
    var start = function () {
      try {
        check();
        if (w.MutationObserver) {
          var mo = new MutationObserver(check);
          WATCH.forEach(function (x) { var el = d.getElementById(x[0]); if (el) mo.observe(el, { attributes: true, attributeFilter: ['style'] }); });
        }
      } catch (e) {}
    };
    if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();

    // Clics : accès au rapport, reprise malgré la qualité, retour au formulaire depuis un écran d'erreur.
    d.addEventListener('click', function (e) {
      try {
        var t = e.target && e.target.closest ? e.target.closest('a,button') : null;
        if (!t) return;
        if (t.id === 'access-btn') track('wait_click');
        else if (/resumeAnalysis/.test(t.getAttribute('onclick') || '')) track('wait_resume');
        else if (/\/(formulaire|form)(\?|$|\/)/.test(t.getAttribute('href') || '') &&
                 t.closest('#delay-fail-content,#face-error-popup,#quality-error-popup')) track('wait_restart', { detail: cut(t.getAttribute('href'), 120) });
      } catch (err) {}
    }, true);

    var hid = 0;
    d.addEventListener('visibilitychange', function () {
      try { if (d.visibilityState === 'hidden') { if (++hid <= 10) track('hidden'); } else if (hid && hid <= 10) track('visible'); } catch (e) {}
    });
    w.addEventListener('pagehide', function () { try { track('leave'); } catch (e) {} });
  } catch (e) {}
})(window, document);
