import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveRedirect,
  APP_STORE_REVIEW_URL,
  APP_STORE_REVIEW_ITMS_URL,
  buildClickPayload,
} from "../api/_review-redirect.mjs";

test("redirige vers la feuille de notation App Store", () => {
  const r = resolveRedirect(new URLSearchParams("l=es&s=abonne_actif"));
  assert.equal(r.location, APP_STORE_REVIEW_URL);
});

test("conserve langue et segment pour la mesure", () => {
  const r = resolveRedirect(new URLSearchParams("l=es&s=abonne_actif"));
  assert.equal(r.lang, "es");
  assert.equal(r.segment, "abonne_actif");
});

test("une langue inconnue retombe sur l'anglais, jamais le francais", () => {
  const r = resolveRedirect(new URLSearchParams("l=it&s=skinmatch"));
  assert.equal(r.lang, "en");
});

test("parametres absents : on redirige quand meme", () => {
  const r = resolveRedirect(new URLSearchParams(""));
  assert.equal(r.location, APP_STORE_REVIEW_URL);
  assert.equal(r.lang, "en");
  assert.equal(r.segment, "inconnu");
});

test("le segment de recette est reconnu", () => {
  const r = resolveRedirect(new URLSearchParams("l=fr&s=test"));
  assert.equal(r.segment, "test");
});

test("un segment fantaisiste est neutralise, pas propage", () => {
  const r = resolveRedirect(new URLSearchParams("l=fr&s=<script>alert(1)</script>"));
  assert.equal(r.segment, "inconnu");
});

test("buildClickPayload : produit exactement lang + segment", () => {
  const payload = buildClickPayload("es", "abonne_actif");
  assert.deepEqual(payload, { lang: "es", segment: "abonne_actif" });
});

test("buildClickPayload : aucune donnee personnelle, exactement deux cles", () => {
  const payload = buildClickPayload("fr", "test");
  assert.deepEqual(Object.keys(payload).sort(), ["lang", "segment"]);
});

test("buildClickPayload : reprend les valeurs deja neutralisees par resolveRedirect", () => {
  const r = resolveRedirect(new URLSearchParams("l=it&s=<script>alert(1)</script>"));
  const payload = buildClickPayload(r.lang, r.segment);
  assert.deepEqual(payload, { lang: "en", segment: "inconnu" });
});

// --- Branchement selon le User-Agent : iOS ouvre la feuille de notation
// via le schéma itms-apps (échappe au 301 du serveur web Apple qui mange
// action=write-review) ; tout le reste garde l'URL https classique.

test("iPhone : redirige vers itms-apps avec action=write-review", () => {
  const ua =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
  const r = resolveRedirect(new URLSearchParams("l=fr&s=test"), ua);
  assert.equal(r.location, APP_STORE_REVIEW_ITMS_URL);
  assert.match(r.location, /^itms-apps:/);
  assert.match(r.location, /action=write-review/);
});

test("iPad : redirige vers itms-apps", () => {
  const ua =
    "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
  const r = resolveRedirect(new URLSearchParams("l=fr&s=test"), ua);
  assert.equal(r.location, APP_STORE_REVIEW_ITMS_URL);
});

test("iPod : redirige vers itms-apps", () => {
  const ua =
    "Mozilla/5.0 (iPod touch; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
  const r = resolveRedirect(new URLSearchParams("l=fr&s=test"), ua);
  assert.equal(r.location, APP_STORE_REVIEW_ITMS_URL);
});

test("macOS Safari : garde l'URL https (jamais itms-apps)", () => {
  const ua =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
  const r = resolveRedirect(new URLSearchParams("l=fr&s=test"), ua);
  assert.equal(r.location, APP_STORE_REVIEW_URL);
});

test("Android : garde l'URL https", () => {
  const ua =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
  const r = resolveRedirect(new URLSearchParams("l=fr&s=test"), ua);
  assert.equal(r.location, APP_STORE_REVIEW_URL);
});

test("User-Agent absent : jamais de crash, URL https par defaut", () => {
  const r = resolveRedirect(new URLSearchParams("l=fr&s=test"));
  assert.equal(r.location, APP_STORE_REVIEW_URL);
});

test("User-Agent vide : URL https", () => {
  const r = resolveRedirect(new URLSearchParams("l=fr&s=test"), "");
  assert.equal(r.location, APP_STORE_REVIEW_URL);
});

test("iOS insensible a la casse (iphone en minuscules)", () => {
  const r = resolveRedirect(
    new URLSearchParams("l=fr&s=test"),
    "some iphone useragent",
  );
  assert.equal(r.location, APP_STORE_REVIEW_ITMS_URL);
});

test("les deux URLs constantes portent action=write-review", () => {
  assert.match(APP_STORE_REVIEW_URL, /action=write-review/);
  assert.match(APP_STORE_REVIEW_ITMS_URL, /action=write-review/);
});

test("branchement iOS n'affecte pas lang/segment", () => {
  const ua = "iPhone";
  const r = resolveRedirect(new URLSearchParams("l=es&s=abonne_actif"), ua);
  assert.equal(r.lang, "es");
  assert.equal(r.segment, "abonne_actif");
});
