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
 * @returns {{ location: string, lang: string, segment: string }}
 */
export function resolveRedirect(params) {
  const l = (params.get("l") || "").toLowerCase();
  const s = params.get("s") || "";

  return {
    location: APP_STORE_REVIEW_URL,
    // Repli ANGLAIS, jamais français.
    lang: LANGS.has(l) ? l : "en",
    // Liste blanche : une valeur inattendue ne doit pas polluer la mesure
    // ni ressortir telle quelle dans un log.
    segment: SEGMENTS.has(s) ? s : "inconnu",
  };
}
