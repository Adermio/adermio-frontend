// Harnais : extrait les fonctions PURES de facescan.js par nom (accolades
// équilibrées) et les évalue isolément — même pattern que les harnais n8n
// du projet. Toute dépendance externe dans ces fonctions = échec du test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../facescan.js", import.meta.url), "utf8");
function extract(name) {
  const i = src.indexOf("function " + name + "(");
  assert.notEqual(i, -1, name + " introuvable dans facescan.js");
  let d = 0;
  const j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1);
  }
  throw new Error("accolades non équilibrées: " + name);
}

const fns = {};
for (const n of ["scoreCandidateReal", "realQualityVerdict", "bestPossibleRealScore"])
  fns[n] = new Function("return (" + extract(n) + ")")();
// selectBinFinal référence realQualityVerdict → injection explicite.
fns.selectBinFinal = new Function(
  "realQualityVerdict",
  "return (" + extract("selectBinFinal") + ")"
)(fns.realQualityVerdict);

const SC = { blurIdeal: 45, brightIdeal: 130 };
const VC = { postBrightMinReject: 35, postBrightMaxReject: 240, postBlurMinReject: 8 };

const approx = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, a + " ≉ " + b);

test("scoreCandidateReal : bornes et monotonie", () => {
  const s = fns.scoreCandidateReal;
  approx(s(45, 130, 0, 0, SC), 1);                          // parfait
  approx(s(0, 130, 0, 0, SC), 0.55);                        // netteté nulle → angle+expo
  assert.ok(s(45, 130, 25, 0, SC) < s(45, 130, 5, 0, SC));  // angle pénalise
  assert.ok(s(10, 130, 0, 0, SC) < s(40, 130, 0, 0, SC));   // flou pénalise
  assert.ok(s(45, 35, 0, 0, SC) < s(45, 130, 0, 0, SC));    // sombre pénalise
  assert.ok(s(90, 130, 0, 0, SC) <= 1 + 1e-9);              // netteté clampée
});

test("realQualityVerdict : seuils durs actuels", () => {
  const v = fns.realQualityVerdict;
  assert.equal(v(30, 130, VC), null);
  assert.equal(v(7.9, 130, VC), "blur");
  assert.equal(v(30, 34, VC), "lowLight");
  assert.equal(v(30, 241, VC), "strongLight");
  assert.equal(v(7, 34, VC), "lowLight"); // priorité lumière (parité analyzePhotoQuality)
});

test("bestPossibleRealScore : borne sup atteignable", () => {
  const b = fns.bestPossibleRealScore;
  approx(b(0, 0), 1);                                       // angle parfait → 1.0
  approx(b(25, 0), 0.65);                                   // angle nul → 0.45+0.20
  const real = fns.scoreCandidateReal(45, 130, 12, 0, SC);
  assert.ok(b(12, 0) >= real - 1e-9);                       // jamais < score réel
});

test("selectBinFinal : meilleur utilisable, sinon moins-pire", () => {
  const sel = fns.selectBinFinal;
  const c = (lap, luma, score, pScore, prov) => ({ lap, luma, score, pScore, provisional: !!prov });
  // trié score desc : [0] net et mieux scoré → gagne ; proxy aurait préféré [1]
  const bin1 = [c(30, 130, 0.9, 0.5), c(20, 130, 0.7, 0.9)];
  assert.deepEqual(sel(bin1, VC), { winnerIdx: 0, winnerUsable: true, proxyRank: 2 });
  // premier inutilisable (flou) → 2e gagne
  const bin2 = [c(5, 130, 0.9, 0.9), c(25, 130, 0.7, 0.5)];
  assert.deepEqual(sel(bin2, VC), { winnerIdx: 1, winnerUsable: true, proxyRank: 2 });
  // aucun utilisable → moins-pire (idx 0), winnerUsable false
  const bin3 = [c(5, 130, 0.6, 0.6), c(4, 20, 0.3, 0.3)];
  assert.deepEqual(sel(bin3, VC), { winnerIdx: 0, winnerUsable: false, proxyRank: 1 });
  // provisoire = bénéfice du doute (utilisable)
  const bin4 = [c(5, 130, 0.8, 0.8), c(0, 0, 0.5, 0.5, true)];
  assert.deepEqual(sel(bin4, VC), { winnerIdx: 1, winnerUsable: true, proxyRank: 2 });
  // proxyRank 1 quand le proxy aurait choisi pareil
  const bin5 = [c(30, 130, 0.9, 0.9), c(20, 130, 0.5, 0.4)];
  assert.equal(sel(bin5, VC).proxyRank, 1);
  // bin d'un seul candidat
  assert.deepEqual(sel([c(30, 130, 0.9, 0.9)], VC), { winnerIdx: 0, winnerUsable: true, proxyRank: 1 });
});
