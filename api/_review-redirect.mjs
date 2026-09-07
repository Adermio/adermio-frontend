/**
 * Décision PURE de la redirection de mesure du mail « avis App Store ».
 *
 * Aucun I/O, aucune dépendance : testable sous `node --test`. Les effets
 * (Response, en-têtes, log) vivent dans `api/r.js`.
 *
 * 🚨 Aucune donnée personnelle ne transite par cette URL — ni id, ni email,
 * ni jeton nominatif. Seulement la langue et le segment, pour obtenir un
 * TAUX par segment, jamais un suivi individuel.
 *
 * Le préfixe `_` exclut ce fichier des routes Vercel.
 */

export const APP_STORE_REVIEW_URL =
  "https://apps.apple.com/app/id6768772221?action=write-review";

// 🚨 Le serveur web d'Apple répond 301 et JETTE `action=write-review` en
// route — vérifié au curl sur toutes les formes d'URL (avec/sans code
// pays, avec/sans slug). Le schéma `itms-apps:` est géré par l'app App
// Store elle-même, aucun serveur web ne le voit donc jamais : le
// paramètre survit et ouvre directement la feuille de notation au lieu
// de la fiche produit.
export const APP_STORE_REVIEW_ITMS_URL =
  "itms-apps://apps.apple.com/app/id6768772221?action=write-review";

// iPhone/iPad/iPod uniquement. ⚠️ macOS Safari envoie `Macintosh`, pas
// `iPhone` : il tombe donc correctement dans la branche https. iPadOS en
// mode bureau se fait aussi passer pour `Macintosh` — limitation connue et
// acceptée (Apple ne distingue pas les deux côté User-Agent), pas la peine
// d'essayer de la contourner.
const IOS_UA_RE = /iphone|ipad|ipod/i;

const LANGS = new Set(["fr", "en", "es"]);

const SEGMENTS = new Set([
  "feedback_positif",
  "abonne_actif",
  "skinmatch",
  "etape_cochee",
  "routine_generee",
  // Envois de recette vers les appareils d'Antoine : on veut pouvoir
  // distinguer ses propres clics des vrais dans la mesure.
  "test",
]);

/**
 * @param {URLSearchParams} params
 * @param {string} [userAgent] En-tête User-Agent de la requête, optionnel
 *   (repli `""` — jamais planter faute de valeur). Sur iOS on bascule vers
 *   le schéma `itms-apps:`, seul moyen de garder `action=write-review`.
 * @returns {{ location: string, lang: string, segment: string }}
 */
export function resolveRedirect(params, userAgent = "") {
  const l = (params.get("l") || "").toLowerCase();
  const s = params.get("s") || "";

  return {
    location: IOS_UA_RE.test(userAgent)
      ? APP_STORE_REVIEW_ITMS_URL
      : APP_STORE_REVIEW_URL,
    // Repli ANGLAIS, jamais français.
    lang: LANGS.has(l) ? l : "en",
    // Liste blanche : une valeur inattendue ne doit pas polluer la mesure
    // ni ressortir telle quelle dans un log.
    segment: SEGMENTS.has(s) ? s : "inconnu",
  };
}

/**
 * Construit le corps de la mesure de clic — et seulement lui.
 *
 * 🚨 Exactement deux clés, `lang` et `segment` : jamais d'id, jamais
 * d'email, jamais de jeton. `resolveRedirect` a déjà mis `lang`/`segment`
 * en liste blanche ; cette fonction ne fait que les remettre en forme pour
 * l'INSERT Supabase, sans ajouter le moindre champ.
 *
 * @param {string} lang
 * @param {string} segment
 * @returns {{ lang: string, segment: string }}
 */
export function buildClickPayload(lang, segment) {
  return { lang, segment };
}
