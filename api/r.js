/**
 * /api/r — redirection de mesure du mail « avis App Store ».
 *
 * Servie sur /r/av via un rewrite dans vercel.json. Redirige en 302 vers la
 * feuille de notation App Store et laisse une trace dans les logs Vercel,
 * d'où se lit le taux de clic par langue et par segment.
 *
 * ⚠️ CACHE : `no-store` obligatoire. Une redirection cachée fausserait le
 * comptage — même raison que /api/geo.
 *
 * Ne casse jamais : en cas d'anomalie, on redirige quand même. Un visiteur
 * qui a cliqué doit arriver sur l'App Store, mesure ou pas.
 */
import { resolveRedirect, APP_STORE_REVIEW_URL } from "./_review-redirect.mjs";

export const config = { runtime: "edge" };

export default function handler(req) {
  let location = APP_STORE_REVIEW_URL;
  try {
    const { searchParams } = new URL(req.url);
    const r = resolveRedirect(searchParams);
    location = r.location;
    // Lu dans les logs Vercel : aucune donnée personnelle.
    console.log(`review_click lang=${r.lang} segment=${r.segment}`);
  } catch (e) {
    console.log("review_click lang=en segment=inconnu");
  }

  return new Response(null, {
    status: 302,
    headers: { Location: location, "Cache-Control": "no-store" },
  });
}
