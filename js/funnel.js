// Adermio — entonnoir anonyme du questionnaire web (09/10/2026).
// Chargé sur /formulaire, /it/form, /es/form, /de/form, /en/form. N'ÉCRIT RIEN dans le formulaire et ne change
// aucune logique : il OBSERVE (1) l'étape affichée (classe « active » des .step-container), (2) l'envoi au webhook
// n8n (fetch observé, réponse rendue telle quelle). Chaque événement part en arrière-plan vers Supabase
// (table web_form_funnel, insert seul) et vers Clarity (événement + tag « form_step »). Aucune donnée personnelle :
// identifiant de session aléatoire + jobId de l'analyse (pour relier à free_analysis / premium_analysis).
// RÈGLE : ne jamais bloquer ni casser le formulaire — toute erreur est avalée.
(function (w, d) {
  try {
    var URL_ = 'https://zqhmobgjxmyziuwkrkqf.supabase.co/rest/v1/web_form_funnel';
    var KEY = 'sb_publishable_edhbug0_QNa6pzye-BEAxw_HR1GMtwe';
    var path = ((w.location.pathname || '').replace(/\.html$/, '').replace(/\/+$/, '') || '/').slice(0, 60);
    var lang = ((d.documentElement.getAttribute('lang') || '').slice(0, 2) || null);
    var sKey = 'adermio_funnel_sid_' + path, sid = null;
    try { sid = w.sessionStorage.getItem(sKey); } catch (e) {}
    if (!sid) {
      sid = (w.crypto && w.crypto.randomUUID) ? w.crypto.randomUUID() :
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
      try { w.sessionStorage.setItem(sKey, sid); } catch (e) {}
    }
    var ua = navigator.userAgent || '';
    var inapp = /musical_ly|BytedanceWebview|TikTok/i.test(ua) ? 'tiktok' : /Instagram/i.test(ua) ? 'instagram' : /FBAN|FBAV/i.test(ua) ? 'facebook' : null;
    var device = /iPad|Tablet/i.test(ua) ? 'tablet' : (/Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop');
    var q = new URLSearchParams(w.location.search || '');
    var cut = function (v, n) { return v ? String(v).slice(0, n) : null; };
    var ref = null;
    try { if (d.referrer) { var r = new URL(d.referrer); ref = cut(r.host + r.pathname, 200); } } catch (e) {}
    var base = {
      session_id: sid, path: path, lang: lang, device: device, inapp: inapp, referrer: ref,
      utm_source: cut(q.get('utm_source'), 80), utm_medium: cut(q.get('utm_medium'), 80), utm_campaign: cut(q.get('utm_campaign'), 120)
    };
    var jobId = function () { try { return cut(w.localStorage.getItem('adermio_jobId'), 80); } catch (e) { return null; } };
    var total = d.querySelectorAll('.step-container[id^="step-"]').length || null;

    // Pays : même source que le formulaire (js/geo.js), sans jamais attendre plus de 1,5 s.
    var country = null, ready = false, queue = [];
    var flush = function () { ready = true; var x = queue; queue = []; x.forEach(send); };
    try {
      var g = w.AdermioGeo && w.AdermioGeo.get ? w.AdermioGeo.get() : null;
      if (g && g.then) g.then(function (c) { country = cut(c, 3) || null; flush(); }, flush); else flush();
    } catch (e) { flush(); }
    setTimeout(function () { if (!ready) flush(); }, 1500);

    var post = w.fetch ? w.fetch.bind(w) : null;
    function send(row) {
      if (!ready) { queue.push(row); return; }
      try {
        row.country = country;
        if (post) post(URL_, {
          method: 'POST', keepalive: true,
          headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify(row)
        }).catch(function () {});
      } catch (e) {}
    }
    function track(event, extra) {
      try {
        var row = Object.assign({}, base, { event: event, job_id: jobId(), total_steps: total }, extra || {});
        send(row);
        if (w.clarity) {
          if (event === 'step') { w.clarity('event', 'form_step_' + row.step); w.clarity('set', 'form_step', String(row.step)); }
          else w.clarity('event', 'form_' + event);
        }
      } catch (e) {}
    }

    track('view');

    // Étapes : on suit la classe « active » des conteneurs d'étape.
    var last = null;
    var check = function () {
      try {
        var a = d.querySelector('.step-container.active[id^="step-"]');
        var n = a ? parseInt(a.id.slice(5), 10) : null;
        if (n && n !== last) { last = n; track('step', { step: n }); }
      } catch (e) {}
    };
    check();
    if (w.MutationObserver) {
      var mo = new MutationObserver(check);
      d.querySelectorAll('.step-container[id^="step-"]').forEach(function (el) { mo.observe(el, { attributes: true, attributeFilter: ['class'] }); });
    }

    // Envoi du formulaire : on observe l'appel au webhook n8n (la réponse est rendue intacte).
    if (post) {
      w.fetch = function (input, init) {
        var p = post(input, init);
        try {
          var u = typeof input === 'string' ? input : (input && input.url) || '';
          if (/n8n\.adermio\.com\/webhook\//.test(u) && init && String(init.method || '').toUpperCase() === 'POST') {
            var pm = null, jid = null;
            try { var b = new URLSearchParams(typeof init.body === 'string' ? init.body : ''); pm = cut(b.get('photo_method'), 20); jid = cut(b.get('jobId'), 80); } catch (e) {}
            var ex = { step: last, photo_method: pm, job_id: jid || jobId(), detail: cut(u.split('/webhook/')[1], 120) };
            track('submit', ex);
            p.then(function (res) { track(res && res.ok ? 'submit_ok' : 'submit_error', Object.assign({}, ex, { detail: cut('HTTP ' + (res && res.status), 120) })); },
                   function (err) { track('submit_error', Object.assign({}, ex, { detail: cut('réseau: ' + (err && err.message), 120) })); });
          }
        } catch (e) {}
        return p;
      };
    }
  } catch (e) {}
})(window, document);
