// Adermio Geo — pays de l'utilisateur pour le formulaire (geo-pricing)
//
// Récupère le pays via /api/geo (résolu par Vercel côté serveur) et le tient
// prêt pour le submit du formulaire.
//
// ══ RÈGLE ABSOLUE ══
// La géo ne doit JAMAIS bloquer ni casser l'envoi du formulaire — c'est le
// chemin de l'argent. Tout ici est non-bloquant, borné dans le temps, et
// échoue en silence vers `""` (pays inconnu). Aucun throw ne peut remonter.
//
// Usage dans une page de formulaire :
//   <script src="/js/geo.js" defer></script>
//   ...
//   const country = await AdermioGeo.get();   // "FR" | "" — jamais > ~600ms
//   params.append("country", country);
//
// Le fetch part au chargement de la page ; l'utilisateur met ensuite plusieurs
// minutes à remplir le formulaire → la valeur est prête bien avant le submit.
// `get()` n'attend que si la réponse n'est pas encore arrivée (submit très
// rapide, réseau lent), et jamais plus de GET_MAX_WAIT_MS.
(function () {
  'use strict';

  var ENDPOINT = '/api/geo';
  var CACHE_KEY = 'adermio_geo_country';
  var FETCH_TIMEOUT_MS = 4000;  // abandon du fetch au-delà
  var GET_MAX_WAIT_MS = 600;    // attente max côté submit

  var country = '';
  var settled = false;
  var readyPromise = null;

  // Cache de session : une seule requête par session, même en naviguant
  // entre les pages du funnel.
  try {
    var ss = window.sessionStorage;
    var cached = ss && ss.getItem(CACHE_KEY);
    if (cached) { country = cached; settled = true; }
  } catch (e) { /* sessionStorage indisponible (Safari privé) → on refetch */ }

  function fetchCountry() {
    return new Promise(function (resolve) {
      // Pas de fetch (très vieux navigateur) → pays inconnu, sans casser.
      if (typeof fetch !== 'function') { settled = true; resolve(''); return; }

      var ctrl = null;
      var timer = 0;
      try { ctrl = new AbortController(); } catch (e) { ctrl = null; }
      if (ctrl) {
        timer = setTimeout(function () {
          try { ctrl.abort(); } catch (e) { /* no-op */ }
        }, FETCH_TIMEOUT_MS);
      }

      function finish(c) {
        if (timer) { clearTimeout(timer); timer = 0; }
        country = c || '';
        settled = true;
        if (country) {
          try { window.sessionStorage.setItem(CACHE_KEY, country); } catch (e) { /* no-op */ }
        }
        resolve(country);
      }

      fetch(ENDPOINT, {
        method: 'GET',
        cache: 'no-store',
        signal: ctrl ? ctrl.signal : undefined,
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { finish(d && typeof d.country === 'string' ? d.country : ''); })
        .catch(function () { finish(''); });  // réseau/abort/JSON invalide → ""
    });
  }

  // Démarre tout de suite (le script est en defer → le DOM est prêt).
  if (!settled) {
    readyPromise = fetchCountry();
  } else {
    readyPromise = Promise.resolve(country);
  }

  /** Pays ISO-2 ("FR") ou "" si inconnu. Attend au plus GET_MAX_WAIT_MS. */
  function get() {
    if (settled) return Promise.resolve(country);
    var guard = new Promise(function (resolve) {
      setTimeout(function () { resolve(country || ''); }, GET_MAX_WAIT_MS);
    });
    // Le premier des deux gagne → le submit n'attend jamais plus de 600ms.
    return Promise.race([readyPromise, guard]).catch(function () { return ''; });
  }

  /** Lecture synchrone immédiate (peut être "" si pas encore résolu). */
  function peek() { return country || ''; }

  window.AdermioGeo = { get: get, peek: peek };
})();
