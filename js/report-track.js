// Adermio — suivi anonyme du rapport gratuit (09/10/2026), chargé sur /free-analysis (page qui encadre le rapport S3
// dans une iframe, pour les 5 langues). N'ÉCRIT RIEN dans la page et ne change aucune logique : il OBSERVE
//   - l'ouverture du rapport (chargement de l'iframe) ou le lien invalide (pas de jobId) ;
//   - les messages que le rapport envoie à cette page : OPEN_STRIPE (clic « Débloquer », déjà en place) et
//     ADERMIO_TRACK (envoyés par js/report-inner.js, chargé dans le rapport : prêt, page 2 atteinte, profondeur) ;
//   - le retour sur la page après être parti vers Stripe sans payer ;
//   - l'application quittée / revenue, la page fermée (temps de lecture = ms).
// Même table que le questionnaire (web_form_funnel, insert seul) : la jointure se fait par job_id.
// RÈGLE : ne jamais bloquer ni casser la page — toute erreur est avalée.
(function (w, d) {
  try {
    var URL_ = 'https://zqhmobgjxmyziuwkrkqf.supabase.co/rest/v1/web_form_funnel';
    var KEY = 'sb_publishable_edhbug0_QNa6pzye-BEAxw_HR1GMtwe';
    var S3 = 'https://adermio-free.s3.eu-north-1.amazonaws.com';
    var T0 = Date.now();
    var q = new URLSearchParams(w.location.search || '');
    var cut = function (v, n) { return (v === undefined || v === null || v === '') ? null : String(v).slice(0, n); };
    var job = cut(q.get('jobId'), 80), lang = cut(q.get('lang') || 'fr', 5);
    var sKey = 'adermio_report_sid_' + (job || '-'), sid = null;
    try { sid = w.sessionStorage.getItem(sKey); } catch (e) {}
    if (!sid) {
      sid = (w.crypto && w.crypto.randomUUID) ? w.crypto.randomUUID() :
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
      try { w.sessionStorage.setItem(sKey, sid); } catch (e) {}
    }
    var ua = navigator.userAgent || '';
    var base = {
      session_id: sid, job_id: job, path: '/free-analysis', lang: lang,
      device: /iPad|Tablet/i.test(ua) ? 'tablet' : (/Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop'),
      inapp: /musical_ly|BytedanceWebview|TikTok/i.test(ua) ? 'tiktok' : /Instagram/i.test(ua) ? 'instagram' : /FBAN|FBAV/i.test(ua) ? 'facebook' : null
    };
    var country = null;
    try { country = cut(w.sessionStorage.getItem('adermio_geo_country') || w.localStorage.getItem('adermio_geo_country'), 3); } catch (e) {}
    var sent = 0, post = w.fetch ? w.fetch.bind(w) : null;
    function track(event, extra) {
      try {
        if (++sent > 200 || !post) return;
        var row = Object.assign({}, base, { event: event, country: country, ms: Math.min(Date.now() - T0, 86400000) }, extra || {});
        post(URL_, {
          method: 'POST', keepalive: true,
          headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify(row)
        }).catch(function () {});
        if (w.clarity) w.clarity('event', 'report_' + event.replace(/^report_/, '') + (row.detail && event === 'report_scroll' ? '_' + row.detail : ''));
      } catch (e) {}
    }

    // Retour depuis Stripe sans payer : un clic « Débloquer » a déjà eu lieu pour ce rapport dans cet onglet.
    var cKey = 'adermio_report_cta_' + (job || '-');
    try { if (w.sessionStorage.getItem(cKey)) track('report_return', { detail: cut('après ' + w.sessionStorage.getItem(cKey) + ' clic(s)', 120) }); } catch (e) {}

    var onReady = function () {
      try {
        if (!job) { track('report_error', { detail: 'jobId absent' }); return; }
        var f = d.getElementById('reportFrame');
        if (f) f.addEventListener('load', function () { track('report_open'); }, { once: true });
      } catch (e) {}
    };
    if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', onReady); else onReady();

    var seen = {};
    w.addEventListener('message', function (ev) {
      try {
        if (ev.origin !== S3 || !ev.data) return;
        if (ev.data.type === 'OPEN_STRIPE') {
          var n = 1; try { n = (parseInt(w.sessionStorage.getItem(cKey) || '0', 10) || 0) + 1; w.sessionStorage.setItem(cKey, String(n)); } catch (e) {}
          track('cta_click', { detail: cut('clic n°' + n, 120) });
        } else if (ev.data.type === 'ADERMIO_TRACK') {
          var e = String(ev.data.event || ''), k = e + ':' + (ev.data.pct || '');
          if (seen[k]) return; seen[k] = 1;
          if (e === 'ready') track('report_ready', { total_steps: ev.data.pages || null, detail: cut(ev.data.variant, 120) });
          else if (e === 'page2') track('report_page2');
          else if (e === 'scroll') track('report_scroll', { detail: cut(String(ev.data.pct), 10) });
        }
      } catch (err) {}
    });

    var hid = 0;
    d.addEventListener('visibilitychange', function () {
      try { if (d.visibilityState === 'hidden') { if (++hid <= 10) track('hidden'); } else if (hid && hid <= 10) track('visible'); } catch (e) {}
    });
    w.addEventListener('pagehide', function () { try { track('leave'); } catch (e) {} });
  } catch (e) {}
})(window, document);
