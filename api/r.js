/**
 * /api/r — redirection de mesure du mail « avis App Store ».
 *
 * Servie sur /r/av via un rewrite dans vercel.json. Redirige en 302 vers la
 * feuille de notation App Store et laisse une trace dans `app_review_click`
 * (Supabase) — les logs Vercel ne survivent pas aux semaines de la
 * campagne, alors que c'est la SEULE mesure attribuable du projet : Apple
 * ne dit jamais qui a laissé une note.
 *
 * ⚠️ CACHE : `no-store` obligatoire. Une redirection cachée fausserait le
 * comptage — même raison que /api/geo.
 *
 * Ne casse jamais : en cas d'anomalie (réseau, Supabase en panne, timeout),
 * on redirige quand même. Un visiteur qui a cliqué doit arriver sur
 * l'App Store, mesure ou pas — c'est la priorité absolue, avant la mesure
 * elle-même.
 *
 * `anon` n'a que l'INSERT sur `app_review_click` (pas de SELECT) : la clé
 * publique ci-dessous est donc sans risque à exposer, comme dans bilan.html
 * et consorts.
 */
import {
  resolveRedirect,
  APP_STORE_REVIEW_URL,
  buildClickPayload,
} from "./_review-redirect.mjs";

export const config = { runtime: "edge" };

const SUPABASE_URL = "https://zqhmobgjxmyziuwkrkqf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaG1vYmdqeG15eml1d2tya3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTUzODgsImV4cCI6MjA3OTM3MTM4OH0.1RenqEuFcJulmi-1ZK10n301bS-QpFLKZ5Un1Xa5C_w";

// 700 ms max : on ATTEND ce POST avant de renvoyer le 302. Contre-intuitif
// vu la règle « ne jamais retarder la redirection », mais sur le runtime
// Edge de Vercel un fetch non-attendu peut être annulé dès que la Response
// est retournée — la mesure serait perdue en silence, sans même l'ombre
// d'une erreur. Attendre un appel borné à 700 ms est donc un choix
// délibéré : le pire cas coûte 700 ms de redirection, jamais un clic perdu
// sans laisser de trace.
const CLICK_POST_TIMEOUT_MS = 700;

async function recordClick(lang, segment) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLICK_POST_TIMEOUT_MS);
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/app_review_click`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(buildClickPayload(lang, segment)),
      signal: controller.signal,
    });
  } catch (e) {
    // Réseau, timeout, Supabase en panne : la mesure est perdue mais la
    // redirection, elle, ne l'est jamais. console.log ci-dessous reste la
    // trace de secours.
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req) {
  let location = APP_STORE_REVIEW_URL;
  let lang = "en";
  let segment = "inconnu";
  try {
    const { searchParams } = new URL(req.url);
    const r = resolveRedirect(searchParams);
    location = r.location;
    lang = r.lang;
    segment = r.segment;
  } catch (e) {
    // location/lang/segment gardent leurs valeurs de repli.
  }

  // Lu dans les logs Vercel : trace de secours, aucune donnée personnelle.
  console.log(`review_click lang=${lang} segment=${segment}`);
  await recordClick(lang, segment);

  return new Response(null, {
    status: 302,
    headers: { Location: location, "Cache-Control": "no-store" },
  });
}
