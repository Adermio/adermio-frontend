import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveRedirect,
  APP_STORE_REVIEW_URL,
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
