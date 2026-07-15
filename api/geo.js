/**
 * /api/geo — pays de l'utilisateur, résolu par l'infra (Vercel Edge).
 *
 * Pourquoi une fonction et pas du client-side : Vercel résout l'IP → pays
 * nativement et GRATUITEMENT (header `x-vercel-ip-country`, disponible sur
 * tous les plans). Zéro API tierce, zéro clé, ~20 ms au edge. Les pages du
 * site étant statiques et CACHÉES (x-vercel-cache: HIT), on ne peut pas
 * injecter le pays dans le HTML — d'où ce endpoint que le client appelle.
 *
 * ⚠️ CACHE : la réponse est propre à chaque visiteur → `no-store` obligatoire.
 * Sans ça, le premier visiteur ferait cacher SON pays pour tous les suivants.
 *
 * Renvoie TOUJOURS 200 avec `{ country }` — jamais d'erreur : ce endpoint ne
 * doit sous aucun prétexte casser le parcours du formulaire (chemin de
 * l'argent). Pays inconnu → country: "".
 *
 * Périmètre : `country` (ISO 3166-1 alpha-2, ex. "FR") + `region`/`city` que
 * Vercel fournit aussi — utiles plus tard, sans coût. `country` reste la
 * seule donnée sur laquelle on s'appuie.
 *
 * NB confiance (décision Antoine 2026-07-15) : le client renvoie ensuite ce
 * pays dans le formulaire — donc techniquement falsifiable (devtools). Assumé :
 * l'incitation à tricher sur un produit à 5,99 € est marginale. Si un jour on
 * différencie fortement les prix, il faudra signer ce jeton (HMAC) et le
 * vérifier dans n8n.
 */
export const config = { runtime: "edge" };

export default function handler(req) {
  let country = "";
  let region = "";
  let city = "";
  try {
    const h = req.headers;
    country = (h.get("x-vercel-ip-country") || "").toUpperCase();
    region = h.get("x-vercel-ip-country-region") || "";
    city = h.get("x-vercel-ip-city") || "";
    // Vercel URL-encode la ville (ex. "Saint-%C3%89tienne").
    try { city = decodeURIComponent(city); } catch (e) { /* garde la brute */ }
  } catch (e) {
    /* on renvoie quand même 200 avec des champs vides */
  }

  return new Response(JSON.stringify({ country, region, city }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Propre au visiteur : jamais mis en cache (CDN ni navigateur).
      "cache-control": "no-store, max-age=0",
    },
  });
}
