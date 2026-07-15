# Scan web jalon 1 — scoring sur pixels réels : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chaque photo candidate du scan web est acceptée/rejetée et scorée sur les pixels réels de son JPEG (fin du proxy vidéo aveugle au flou de mouvement), la sélection finale examine tous les candidats, et `scan_log` trace la décision.

**Architecture:** Tout vit dans `facescan.js` (IIFE vanilla JS, v9.7 → v9.8). Trois fonctions **pures** (score, verdict, sélection de bin) testables hors navigateur par extraction textuelle (pattern harnais du projet), greffées dans le `.then` de `capFrame` existant (derrière `capGen`) et dans un `selectFinal` qui remplace `verifyWinners`. `capFrame`, le watchdog, `getAllowedBins`, le force-accept et le workflow n8n ne sont **pas touchés**.

**Tech Stack:** Vanilla JS (navigateur), `node:test` + extraction regex pour les tests, Vercel (déploiement = push sur `main`).

## Global Constraints (de la spec)

- Web UNIQUEMENT — ne rien porter à l'app mobile.
- `capFrame` + son repli synchrone + watchdog 3 s : intouchés (stabilisés v9.4).
- `getAllowedBins`, force-accept (`rejectForceAfter: 15`), garantie de progression : inchangés au jalon 1.
- Bin sans candidat utilisable (frontal compris) : comportement actuel conservé (moins-pire + bandeau doré) — omission/reprise = jalon 3.
- Messages neutres : AUCUN nouveau texte UI au jalon 1.
- Décodage blob impossible (`analyzeBlobQuality` → `null`) : bénéfice du doute — comportement proxy actuel intégral.
- Seuils durs réutilisés tels quels : `postBlurMinReject: 8`, `postBrightMinReject: 35`, `postBrightMaxReject: 240`, `blurIdeal: 45`, `brightIdeal: 130`.
- Score : `netteté×0.45 + angle×0.35 + expo×0.20` (spec §3.1).

---

### Task 1 : Fonctions pures + harnais de test

**Files:**
- Modify: `facescan.js` (nouvelle section après `analyzeBlobQuality`, ~l.955)
- Create: `tests/scan-quality.test.mjs`

**Interfaces (Produces):**
- `scoreCandidateReal(lap, luma, absYaw, idealYaw, C)` → `number` 0..1 — `C = {blurIdeal, brightIdeal}`
- `realQualityVerdict(lap, luma, C)` → `string|null` (`"lowLight"|"strongLight"|"blur"` ou `null` si acceptable) — `C = {postBrightMinReject, postBrightMaxReject, postBlurMinReject}`
- `bestPossibleRealScore(absYaw, idealYaw)` → `number` — borne sup du score réel quand netteté/expo inconnues (pré-flight)
- `selectBinFinal(cands, C)` → `{ winnerIdx, winnerUsable, proxyRank }` — `cands = [{lap, luma, score, pScore, provisional}]` trié score desc ; verdict-C

- [x] **Step 1 : écrire le test qui échoue** — `tests/scan-quality.test.mjs` :

```js
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
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1);
  }
  throw new Error("accolades non équilibrées: " + name);
}
const fns = {};
for (const n of ["scoreCandidateReal", "realQualityVerdict", "bestPossibleRealScore", "selectBinFinal"])
  fns[n] = new Function("return (" + extract(n) + ")")();

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
  assert.ok(s(90, 130, 0, 0, SC) <= 1);                     // netteté clampée
});

test("realQualityVerdict : seuils durs actuels", () => {
  const v = fns.realQualityVerdict;
  assert.equal(v(30, 130, VC), null);
  assert.equal(v(7.9, 130, VC), "blur");
  assert.equal(v(30, 34, VC), "lowLight");
  assert.equal(v(30, 241, VC), "strongLight");
  assert.equal(v(7, 34, VC), "lowLight");  // priorité lumière (parité analyzePhotoQuality)
});

test("bestPossibleRealScore : borne sup atteignable", () => {
  const b = fns.bestPossibleRealScore;
  approx(b(0, 0), 1);                                         // angle parfait → 1.0
  approx(b(25, 0), 0.65);                                     // angle nul → 0.45+0.20
  const real = fns.scoreCandidateReal(45, 130, 12, 0, SC);
  assert.ok(b(12, 0) >= real);                                // jamais < score réel
});

test("selectBinFinal : meilleur utilisable, sinon moins-pire", () => {
  const sel = fns.selectBinFinal;
  const c = (lap, luma, score, pScore, prov) => ({ lap, luma, score, pScore, provisional: !!prov });
  // [0] flou (inutilisable) mais mieux scoré par erreur ? non — trié desc par score réel
  const bin1 = [c(30, 130, 0.9, 0.5), c(20, 130, 0.7, 0.9)];
  assert.deepEqual(sel(bin1, VC), { winnerIdx: 0, winnerUsable: true, proxyRank: 2 });
  // premier inutilisable → 2e gagne
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
});
```

- [x] **Step 2 : vérifier l'échec** — `node --test tests/scan-quality.test.mjs` → FAIL (`scoreCandidateReal introuvable`).

- [x] **Step 3 : implémenter les 4 fonctions** dans `facescan.js`, juste après `blobQualityUnacceptable` (~l.958) :

```js
  /* ═══════════════════════════════════════════════════════════
     v9.8 — SCORING SUR PIXELS RÉELS (jalon 1, spec 2026-07-15)
     Fonctions PURES (aucune capture de CFG/S) : extraites telles
     quelles par tests/scan-quality.test.mjs. Ne pas les faire
     dépendre de l'extérieur — passer les constantes en paramètre.
     ═══════════════════════════════════════════════════════════ */

  // Score d'un candidat sur les mesures RÉELLES de son JPEG.
  // Remplace le proxy vidéo (aveugle au flou de mouvement créé dans les
  // ~100 ms entre la mesure preview et la capture). La stabilité sort du
  // score : elle n'était qu'un proxy du flou, désormais mesuré.
  function scoreCandidateReal(lap, luma, absYaw, idealYaw, C) {
    var sharp = Math.min(1, lap / C.blurIdeal);
    var angle = Math.max(0, 1 - Math.abs(absYaw - idealYaw) / 25);
    var expo = Math.max(0, 1 - Math.abs(luma - C.brightIdeal) / C.brightIdeal);
    return sharp * 0.45 + angle * 0.35 + expo * 0.20;
  }

  // Verdict accept/reject sur mesures réelles — mêmes seuils durs et même
  // priorité (lumière avant flou) que analyzePhotoQuality, qui reste le
  // repli quand le blob ne se décode pas.
  function realQualityVerdict(lap, luma, C) {
    if (luma < C.postBrightMinReject) return "lowLight";
    if (luma > C.postBrightMaxReject) return "strongLight";
    if (lap < C.postBlurMinReject) return "blur";
    return null;
  }

  // Borne supérieure du score réel quand netteté/expo sont encore inconnues
  // (pré-flight : l'angle, lui, est connu avant capture).
  function bestPossibleRealScore(absYaw, idealYaw) {
    var angle = Math.max(0, 1 - Math.abs(absYaw - idealYaw) / 25);
    return 0.45 + angle * 0.35 + 0.20;
  }

  // Sélection finale d'un bin : meilleur candidat UTILISABLE (candidats déjà
  // triés score desc), sinon moins-pire (idx 0). Un provisoire (blob non
  // décodé) est utilisable — bénéfice du doute, comme aujourd'hui.
  // proxyRank = rang qu'aurait eu le vainqueur sous l'ancien score proxy →
  // mesure directe, dans scan_log, de ce que le scoring réel change.
  function selectBinFinal(cands, C) {
    var winnerIdx = 0, winnerUsable = false;
    for (var i = 0; i < cands.length; i++) {
      var u = cands[i].provisional || realQualityVerdict(cands[i].lap, cands[i].luma, C) === null;
      if (u) { winnerIdx = i; winnerUsable = true; break; }
    }
    var rank = 1;
    for (var j = 0; j < cands.length; j++) {
      if (j !== winnerIdx && cands[j].pScore > cands[winnerIdx].pScore) rank++;
    }
    return { winnerIdx: winnerIdx, winnerUsable: winnerUsable, proxyRank: rank };
  }
```

⚠️ `selectBinFinal` référence `realQualityVerdict` : le harnais évalue chaque fonction isolément → dans le test, injecter le verdict via `new Function("realQualityVerdict", "return (" + extract("selectBinFinal") + ")")(fns.realQualityVerdict)`. Adapter la ligne d'extraction du test en conséquence.

- [x] **Step 4 : vérifier** — `node --test tests/scan-quality.test.mjs` → 4 tests PASS. Puis `node --check facescan.js` → OK.

- [x] **Step 5 : commit** — `git add facescan.js tests/scan-quality.test.mjs && git commit -m "feat(scan): fonctions pures de scoring réel + harnais (jalon 1, v9.8)"`

---

### Task 2 : greffer le scoring réel dans le chemin de capture

**Files:**
- Modify: `facescan.js` — `tryCapture`, bloc `capFrame($v, S.logger).then(...)` (~l.2580-2642) + pré-flight (~l.2568-2571) + `ScanLogger.prototype.logCapture` (~l.1082)

**Interfaces:**
- Consumes: Task 1 (`scoreCandidateReal`, `realQualityVerdict`, `bestPossibleRealScore`)
- Produces: entrées de bin enrichies `{blob, url, score, pScore, lap, luma, provisional}` — Task 3 en dépend.

- [x] **Step 1 : pré-flight** — remplacer (l.~2568) :

```js
      var bestPossibleAdjusted = preScore * 0.6 + 0.4;
      if (bin.length >= CFG.binTopN && bestPossibleAdjusted <= bin[bin.length - 1].score) return;
```

par :

```js
      // v9.8 : borne sup RÉELLE (angle connu, netteté/expo optimistes à 1).
      var bestPossible = bestPossibleRealScore(absYaw, BIN_IDEAL_YAW[binId]);
      if (bin.length >= CFG.binTopN && bestPossible <= bin[bin.length - 1].score) return;
```

- [x] **Step 2 : cœur du `.then`** — remplacer le corps entre `if (!blob || dead) { S.capturing = false; return; }` et le `}).catch(` par :

```js
        // v9.8 — verdict et score sur les PIXELS RÉELS du JPEG capturé.
        // analyzeBlobQuality ≈ 15 ms (bitmap 120×120) ; le verrou S.capturing
        // reste posé pendant ce temps, très en-deçà du watchdog 3 s.
        // RETURN obligatoire : le .catch existant de capFrame doit attraper
        // toute erreur d'ici (sinon verrou coincé jusqu'au watchdog).
        return analyzeBlobQuality(blob).then(function (q) {
          // Génération périmée → le watchdog a repris le verrou (une capture
          // plus récente le détient peut-être) : NE PAS y toucher, sortir.
          if (capGen !== S._capGen) return;

          var quality, realLap, realLuma, provisional;
          if (q) {
            provisional = false;
            realLap = q.lap; realLuma = q.luma;
            var reason = realQualityVerdict(q.lap, q.luma, CFG);
            quality = { isAcceptable: reason === null, rejectReason: reason };
          } else {
            // Décodage impossible → bénéfice du doute : comportement proxy
            // intégral (verdict + valeurs preview), marqué provisoire.
            provisional = true;
            realLap = bl.s; realLuma = br.face;
            quality = analyzePhotoQuality(br, bl);
          }

          if (!quality.isAcceptable) {
            S.retakeRejects++;
            S.logger.logRejected(binId, quality.rejectReason || "quality_low");
            if (DEBUG) console.log("[FaceScan] Rejected " + binId + ": " + quality.rejectReason +
              " (luma=" + realLuma.toFixed(0) + ", lap=" + realLap.toFixed(1) + (provisional ? ", proxy" : "") + ")");

            var isLight = (quality.rejectReason === "lowLight" || quality.rejectReason === "strongLight");
            if (isLight) {
              S.qualityHint = "lightDuringScan";
              if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
            } else if (S.retakeRejects >= CFG.rejectGuidanceAfter) {
              S.qualityHint = "qualityLow";
            }
            if (S.retakeRejects >= CFG.rejectForceAfter) {
              // Force-accept inchangé : garantie de progression absolue.
              S.retakeRejects = 0;
              S.qualityHint = null;
              // fall through to add to bin
            } else {
              S.capturing = false;
              return;
            }
          } else {
            if (S.retakeRejects > 0) {
              S.retakeRejects = 0;
              S.qualityHint = null;
            }
          }

          // Score stocké = RÉEL ; pScore = l'ancien proxy, conservé pour la
          // télémétrie proxyRank (final_selection).
          // provisoire : quality EST le résultat d'analyzePhotoQuality → réutiliser
          // son overallScore (pas de double appel).
          var pScore = preScore * 0.6 +
            ((provisional ? quality.overallScore : quality0to1(realLap, realLuma)) * 0.4);
          var realScore = provisional
            ? pScore
            : scoreCandidateReal(realLap, realLuma, absYaw, BIN_IDEAL_YAW[binId], CFG);

          var wasEmpty = bin.length === 0;
          bin.push({ blob: blob, url: URL.createObjectURL(blob), score: realScore,
                     pScore: pScore, lap: realLap, luma: realLuma, provisional: provisional });
          bin.sort(function (a, b) { return b.score - a.score; });
          while (bin.length > CFG.binTopN) { var rm = bin.pop(); URL.revokeObjectURL(rm.url); }

          S.logger.logCapture(binId, realScore, wasEmpty, Math.round(br.face), Math.round(br.bg),
            Math.round(br.skinMed), Math.round(realLap * 10) / 10);
          if (wasEmpty) S.lastNewBinAt = performance.now();
          if (wasEmpty && navigator.vibrate) navigator.vibrate(25);
          S.capturing = false;
        });
```

avec, à côté des fonctions pures de Task 1, le petit adaptateur (même formule 50/50 que `analyzePhotoQuality.overallScore`, pour un `pScore` comparable) :

```js
  // Équivalent overallScore d'analyzePhotoQuality, sur mesures réelles —
  // sert uniquement à pScore (télémétrie proxyRank).
  function quality0to1(lap, luma) {
    var b = Math.max(0, 1 - Math.abs(luma - CFG.brightIdeal) / 90);
    var s = Math.min(1, lap / CFG.blurIdeal);
    return b * 0.5 + s * 0.5;
  }
```

- [x] **Step 3 : `logCapture` accepte `lap`** (l.~1082) — ajouter le 7ᵉ paramètre :

```js
  ScanLogger.prototype.logCapture = function (bin, score, wasNew, f, b, sm, lap) {
    var e = { type: "capture", timestamp: Date.now(), bin: bin, score: Math.round(score * 100) / 100, isNew: wasNew, faceLuma: f, bgLuma: b, skinMedian: sm };
    if (lap !== undefined) e.lap = lap;
    this.events.push(e);
  };
```

(reprendre le corps existant exact et n'ajouter que `lap` — vérifier à l'implémentation.)

- [x] **Step 4 : vérifier** — `node --check facescan.js` OK ; `node --test tests/scan-quality.test.mjs` PASS (les pures n'ont pas bougé) ; relire le diff : le `catch` de `capFrame` et le watchdog sont inchangés, `S.capturing` est libéré sur TOUS les chemins (early-return capGen, reject, bank, catch).

- [x] **Step 5 : commit** — `git commit -m "feat(scan): verdict + score des candidats sur pixels réels du JPEG (v9.8 jalon 1)"`

---

### Task 3 : sélection finale exhaustive + télémétrie `final_selection`

**Files:**
- Modify: `facescan.js` — `verifyWinners` (~l.2668-2712, dans `finish()`)

**Interfaces:**
- Consumes: Task 1 (`selectBinFinal`), Task 2 (candidats `{lap, luma, score, pScore, provisional}`)
- Produces: `bin[0]` = vainqueur final (le code d'upload existant lit `bin[0]` — inchangé) ; `S._allWinnersBad` ; événement `final_selection`.

- [x] **Step 1 : remplacer intégralement `verifyWinners`** par :

```js
      // v9.8 — sélection finale exhaustive : les scores réels sont déjà
      // connus (mesurés à la capture) → plus AUCUN décodage ici, juste un
      // choix + un log. Remplace verifyWinners (qui ne re-mesurait que le
      // vainqueur + son dauphin pendant l'overlay de 1,5 s).
      function selectFinal() {
        var okCount = 0, filledCount = 0;
        var summary = {};
        for (var vi = 0; vi < BIN_IDS.length; vi++) {
          var binId = BIN_IDS[vi];
          var bin = S.bins[binId];
          if (!bin.length) continue;
          filledCount++;
          var sel = selectBinFinal(bin, CFG);
          if (sel.winnerIdx !== 0) {
            var w = bin.splice(sel.winnerIdx, 1)[0];
            bin.unshift(w); // l'upload lit bin[0]
          }
          if (sel.winnerUsable) okCount++;
          summary[binId] = {
            n: bin.length,
            winner: { lap: Math.round(bin[0].lap * 10) / 10, luma: Math.round(bin[0].luma),
                      score: Math.round(bin[0].score * 100) / 100, prov: bin[0].provisional ? 1 : 0 },
            usable: sel.winnerUsable ? 1 : 0,
            proxyRank: sel.proxyRank,
            cands: bin.map(function (c) { return [Math.round(c.lap * 10) / 10, Math.round(c.luma)]; }),
          };
        }
        S._allWinnersBad = filledCount > 0 && okCount === 0;
        S.logger.log({ type: "final_selection", timestamp: Date.now(), bins: summary });
        return Promise.resolve();
      }
```

et remplacer l'appel `Promise.all([verifyWinners(), overlayDelay])` par `Promise.all([selectFinal(), overlayDelay])`. Supprimer l'ancienne `verifyWinners` (l'événement `winner_swap` est remplacé par `final_selection.proxyRank > 1`).

- [x] **Step 2 : vérifier l'ordre zoom** — lire le code d'upload (~l.2760-2820) et confirmer que la photo zoom est dérivée de `bins.face[0]` APRÈS `selectFinal` (elle l'était après `verifyWinners` — même point d'accrochage). Aucun changement attendu ; si la dérivation lisait autre chose que `bin[0]`, STOP et corriger.

- [x] **Step 3 : vérifier** — `node --check facescan.js` ; `node --test` PASS ; grep : plus aucune référence à `verifyWinners` ni `winner_swap`.

- [x] **Step 4 : commit** — `git commit -m "feat(scan): sélection finale exhaustive + télémétrie final_selection (v9.8 jalon 1)"`

---

### Task 4 : version, en-tête, revue finale

**Files:**
- Modify: `facescan.js` (en-tête l.2-25)

- [x] **Step 1** : en-tête → `Adermio Face Scan v9.8` + ligne de changelog :

```
 * v9.8 (jalon 1 capture-quali, 2026-07-15) — verdict + score des candidats
 * sur les pixels RÉELS du JPEG (analyzeBlobQuality à la capture, ~15 ms) au
 * lieu du proxy vidéo aveugle au flou de mouvement ; sélection finale
 * exhaustive (selectBinFinal) ; télémétrie final_selection (proxyRank =
 * ce que le scoring réel a changé). Spec : docs/superpowers/specs/
 * 2026-07-15-scan-capture-large-selection-design.md
```

- [x] **Step 2** : gates — `node --check facescan.js` ; `node --test tests/` ; relecture du diff complet (`git diff`) avec la checklist : verrou `S.capturing` libéré partout · `capGen` vérifié dans chaque `.then` · aucun texte UI ajouté · `CFG` non modifié · `getAllowedBins`/force-accept intouchés.

- [x] **Step 3** : vérifier le cache Vercel — `cat vercel.json | grep -A3 facescan` (s'assurer qu'aucun header `immutable` ne servirait l'ancien fichier ; `formulaire.html` le charge sans `?v=`).

- [x] **Step 4 : commit** — `git commit -m "chore(scan): v9.8 — en-tête + changelog jalon 1"`

---

### Task 5 : audit adversarial, prod, vérification post-déploiement

- [x] **Step 1** : audit adversarial du diff par agent indépendant (courses async, fuites de verrou, régressions de comportement vs v9.7 sur les chemins reject/force-accept/retake). Corriger ce qui est confirmé.
- [x] **Step 2** : push `main` → déploiement Vercel automatique.
- [x] **Step 3** : vérifier le déploiement (statut Vercel READY, `curl` du facescan.js de prod → l'en-tête contient `v9.8`).
- [x] **Step 4** : consigner en mémoire (jalon livré, critères de mesure, rendez-vous données à J+14 pour arbitrer jalons 2-3).
