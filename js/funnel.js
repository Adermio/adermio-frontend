// Adermio — entonnoir anonyme du questionnaire web (v2, 09/10/2026).
// Chargé sur /formulaire, /it/form, /es/form, /de/form, /en/form. N'ÉCRIT RIEN dans le formulaire et ne change
// aucune logique : il OBSERVE seulement
//   - l'étape affichée (classe « active » des .step-container) — avance ET retour ;
//   - les photos : choix du fichier (input file), puis résultat via les journaux que le formulaire envoie déjà à
//     n8n /webhook/upload-log (upload_ok, upload_failed, presign_failed, too_large, not_image) ;
//   - les blocages : « Suivant » refusé (classe animate-shake posée par le formulaire) et les alert() affichées
//     (le message s'affiche exactement comme avant) ;
//   - la fenêtre « Ouvrez dans votre navigateur » (visiteurs TikTok / Instagram) ;
//   - l'envoi au webhook de l'analyse (réponse rendue intacte) ;
//   - le départ : application quittée / revenue (visibilitychange), page fermée (pagehide).
// Chaque événement part en arrière-plan vers Supabase (table web_form_funnel, insert seul) et Clarity. Aucune donnée
// personnelle : identifiant de session aléatoire + jobId de l'analyse (jointure free_analysis / premium_analysis).
// RÈGLE : ne jamais bloquer ni casser le formulaire — toute erreur est avalée.
(function (w, d) {
  try {
    var URL_ = 'https://zqhmobgjxmyziuwkrkqf.supabase.co/rest/v1/web_form_funnel';
    var KEY = 'sb_publishable_edhbug0_QNa6pzye-BEAxw_HR1GMtwe';
    var T0 = Date.now();
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
    var cut = function (v, n) { return (v === undefined || v === null || v === '') ? null : String(v).slice(0, n); };
    var ref = null;
    try { if (d.referrer) { var r = new URL(d.referrer); ref = cut(r.host + r.pathname, 200); } } catch (e) {}
    var base = {
      session_id: sid, path: path, lang: lang, device: device, inapp: inapp, referrer: ref,
      utm_source: cut(q.get('utm_source'), 80), utm_medium: cut(q.get('utm_medium'), 80), utm_campaign: cut(q.get('utm_campaign'), 120)
    };
    var jobId = function () { try { return cut(w.localStorage.getItem('adermio_jobId'), 80); } catch (e) { return null; } };
    var total = d.querySelectorAll('.step-container[id^="step-"]').length || null;
    var last = null, sent = 0, MAX = 300;

    // Pays : même source que le formulaire (js/geo.js), sans jamais attendre plus de 1,5 s.
    var country = null, ready = false, queue = [];
    var flush = function () { ready = true; var x = queue; queue = []; x.forEach(send); };
    try {
      var g = w.AdermioGeo && w.AdermioGeo.get ? w.AdermioGeo.get() : null;
      if (g && g.then) g.then(function (c) { country = cut(c, 3); flush(); }, flush); else flush();
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
        if (++sent > MAX) return;
        var row = Object.assign({}, base, { event: event, job_id: jobId(), total_steps: total, step: last, ms: Math.min(Date.now() - T0, 86400000) }, extra || {});
        send(row);
        if (w.clarity) {
          if (event === 'step') { w.clarity('event', 'form_step_' + row.step); w.clarity('set', 'form_step', String(row.step)); }
          else w.clarity('event', 'form_' + event + (row.photo_slot ? '_' + row.photo_slot : ''));
        }
      } catch (e) {}
    }

    track('view');

    // 1. Étapes (avance et retour).
    var check = function () {
      try {
        var a = d.querySelector('.step-container.active[id^="step-"]');
        var n = a ? parseInt(a.id.slice(5), 10) : null;
        if (n && n !== last) { last = n; track('step', { step: n }); }
      } catch (e) {}
    };
    check();
    if (w.MutationObserver) {
      new MutationObserver(check).observe(d.body, { attributes: true, attributeFilter: ['class'], subtree: true });
      // 2. Blocages : le formulaire secoue (animate-shake) le champ manquant quand « Suivant » est refusé.
      new MutationObserver(function (muts) {
        try {
          muts.forEach(function (m) {
            var el = m.target, old = ' ' + (m.oldValue || '') + ' ';
            if (!el || !el.classList) return;
            var id = el.id || (el.closest && el.closest('[id]') && el.closest('[id]').id) || el.tagName;
            // a) champ secoué / encadré en rouge ; b) message d'erreur (#…-error) qui apparaît (classe « hidden » retirée).
            if ((el.classList.contains('animate-shake') && old.indexOf(' animate-shake ') < 0) ||
                (el.classList.contains('input-error') && old.indexOf(' input-error ') < 0)) {
              track('blocked', { detail: cut(id, 120) });
            } else if (/-error$/.test(el.id || '') && !el.classList.contains('hidden') && old.indexOf(' hidden ') >= 0) {
              track('blocked', { detail: cut(el.id + ' : ' + (el.textContent || '').replace(/\s+/g, ' ').trim(), 120) });
            }
          });
        } catch (e) {}
      }).observe(d.body, { attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });
      // 3. Fenêtre « Ouvrez dans votre navigateur » (TikTok / Instagram).
      var modal = d.getElementById('inapp-browser-modal'), shown = false;
      var mcheck = function () { try { if (!shown && modal && modal.style.display && modal.style.display !== 'none') { shown = true; track('inapp_modal'); } } catch (e) {} };
      if (modal) { mcheck(); new MutationObserver(mcheck).observe(modal, { attributes: true, attributeFilter: ['style'] }); }
    }

    // 4. Photos : choix du fichier (le formulaire garde son propre traitement).
    var picks = {};
    d.addEventListener('change', function (e) {
      try {
        var t = e.target;
        if (t && t.type === 'file' && t.files && t.files[0]) {
          var f = t.files[0], slot = cut(t.dataset && t.dataset.type, 20) || cut(t.id || t.name, 20);
          picks[slot] = Date.now();
          track('photo_pick', { photo_slot: slot, size_kb: Math.round(f.size / 1024), mime: cut(f.type || (f.name || '').split('.').pop(), 60) });
        }
      } catch (err) {}
    }, true);

    // 5. Alertes : on note le message, puis on l'affiche exactement comme avant.
    if (w.alert) {
      var alert0 = w.alert;
      w.alert = function (msg) { try { track('alert', { detail: cut(msg, 120) }); } catch (e) {} return alert0.apply(this, arguments); };
    }

    // 6. Appels réseau du formulaire : journaux photos (upload-log) et envoi de l'analyse.
    if (post) {
      w.fetch = function (input, init) {
        var p = post(input, init);
        try {
          var u = typeof input === 'string' ? input : (input && input.url) || '';
          var isPost = init && String(init.method || '').toUpperCase() === 'POST';
          if (isPost && /n8n\.adermio\.com\/webhook\/upload-log/.test(u)) {
            var j = {}; try { j = JSON.parse(init.body || '{}'); } catch (e) {}
            var det = j.detail || {}, slot = cut(det.type, 20), ok = j.event === 'upload_ok';
            var dur = picks[slot] ? ' en ' + ((Date.now() - picks[slot]) / 1000).toFixed(1) + ' s' : '';
            track(ok ? 'photo_ok' : 'photo_error', {
              photo_slot: slot, size_kb: det.size ? Math.round(det.size / 1024) : null, mime: cut(det.mime, 60),
              detail: cut((j.event || '?') + dur + (det.status ? ' HTTP ' + det.status : '') + (det.message ? ' : ' + det.message : ''), 120)
            });
          } else if (isPost && /n8n\.adermio\.com\/webhook\//.test(u)) {
            var pm = null, jid = null;
            try { var b = new URLSearchParams(typeof init.body === 'string' ? init.body : ''); pm = cut(b.get('photo_method'), 20); jid = cut(b.get('jobId'), 80); } catch (e) {}
            var ex = { photo_method: pm, job_id: jid || jobId(), detail: cut(u.split('/webhook/')[1], 120) };
            track('submit', ex);
            p.then(function (res) { track(res && res.ok ? 'submit_ok' : 'submit_error', Object.assign({}, ex, { detail: cut('HTTP ' + (res && res.status), 120) })); },
                   function (err) { track('submit_error', Object.assign({}, ex, { detail: cut('réseau: ' + (err && err.message), 120) })); });
          }
        } catch (e) {}
        return p;
      };
    }

    // 7. Départ : application quittée / revenue, page fermée.
    var hid = 0;
    d.addEventListener('visibilitychange', function () {
      try { if (d.visibilityState === 'hidden') { if (++hid <= 10) track('hidden'); } else if (hid && hid <= 10) track('visible'); } catch (e) {}
    });
    w.addEventListener('pagehide', function () { try { track('leave'); } catch (e) {} });
  } catch (e) {}
})(window, document);
