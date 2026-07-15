# Scan web — capture large + sélection sur pixels réels

**Date** : 2026-07-15 · **Périmètre** : `facescan.js` (web UNIQUEMENT — ne pas porter à l'app mobile) · **Statut** : design validé par Antoine, en attente d'implémentation

---

## 1. Problème

Retours terrain : des photos de mauvaise qualité — **flou de mouvement en tête** — partent à l'analyse IA. Gemini ne s'abstient pas sur une photo floue : il produit des comptages et des scores **confiants et faux** (hallucination), ce qui dégrade l'analyse gratuite ET le dossier payant à 5,99 € construits sur les mêmes photos.

### Causes racines (constatées dans le code, v9.4)

1. **Score aveugle au flou de mouvement** : la qualité d'un candidat est mesurée sur l'aperçu vidéo ~100 ms *avant* la capture (`analyzePhotoQuality` sur les caches `br`/`bl`). Le flou créé pendant la rotation de tête entre la mesure et le JPEG n'est jamais vu.
2. **Entonnoir à 1 photo** : `getAllowedBins` n'autorise la capture que sur les bins **vides** → en flux normal, chaque angle s'arrête à sa 1ʳᵉ photo acceptable. Le top-3 (`CFG.binTopN`) ne sert qu'en mode reprise.
3. **Vérification finale partielle** : `verifyWinners` ne re-mesure sur pixels réels que le vainqueur de chaque bin (+ le dauphin si le vainqueur échoue), en 1,5 s. Le 3ᵉ candidat n'est jamais examiné.
4. **Force-accept** : après 15 rejets sur un angle, on banque une photo médiocre exprès (garantie de progression — leçon v9.1, à CONSERVER).

## 2. Décisions produit (actées avec Antoine)

| Question | Décision |
|---|---|
| Défaut dominant à corriger | **Flou de mouvement** (retours terrain) |
| Profil (semi/plein/large) sans aucun candidat utilisable | **Omettre la photo** — envoyer 6 (ou moins) au lieu de 7. Le backend le tolère déjà (`addPhoto` saute les absentes ; appel Gemini d'un côté sauté si 0 photo) |
| Frontale sans aucun candidat utilisable | **Micro-reprise automatique, UNE seule fois** (réutilise le mécanisme de retake par angle existant). Échec → moins-pire + bandeau doré existant |
| Approche technique | **A — renforcer l'existant** (scoring réel + entonnoir élargi + sélection exhaustive). Pas de ring buffer continu (risque CPU/mémoire low-end + pipeline capture stabilisé la veille, v9.4) |

## 3. Design

### 3.1 Scoring sur pixels réels (cœur du fix)

À chaque capture acceptée, `analyzeBlobQuality(blob)` (existant : bitmap 120×120, crop central 60 %, Laplacien + luma, ~15 ms) tourne **immédiatement** et son résultat devient le score du candidat :

```
score = netteté_réelle × 0.45 + justesse_angle × 0.35 + exposition_réelle × 0.20

netteté_réelle    = min(1, lap / 45)            // sur le JPEG réel (45 = CFG.blurIdeal)
justesse_angle    = max(0, 1 − |absYaw − yawIdéal| / 25)   // inchangé
exposition_réelle = max(0, 1 − |luma − 130| / 130)          // 130 = CFG.brightIdeal
```

- La **stabilité disparaît du score** (elle n'était qu'un proxy du flou, désormais mesuré directement). Elle reste utilisable dans les gates pré-capture.
- Candidat stocké immédiatement avec un score **provisoire** (proxy actuel) ; à la résolution d'`analyzeBlobQuality` (~15 ms), score réel remplace le provisoire, re-tri du bin, éviction éventuelle.
- Décodage impossible (`null`) → le score provisoire est conservé (bénéfice du doute, comportement actuel).
- Garde anti-course : `capGen` existant + les résolutions tardives sur un bin réinitialisé (mode reprise) sont ignorées.
- Le pre-flight skip actuel (ne pas capturer si le meilleur cas possible ne bat pas le pire stocké) est conservé, comparé aux scores réels ; « meilleur cas possible » suppose netteté = 1.

### 3.2 Entonnoir élargi

- **`getAllowedBins` assoupli** : un bin du côté actuellement guidé reste capturable tant qu'il n'est pas **plein** (aujourd'hui : tant qu'il est *vide*).
- **Le guidage ne change pas** : il avance dès la 1ʳᵉ photo d'un bin (même signal qu'aujourd'hui) → durée de scan inchangée. L'élargissement est opportuniste : les re-passages de la tête devant un angle déjà « fait » ajoutent des candidats gratuitement.
- **`binTopN` : 3 → 6** (haut de gamme) / **4** (low-end, via `deviceTier` existant). Éviction immédiate au-delà, référence blob libérée aussitôt.
- Mémoire bornée : ~42 blobs ≈ 8 Mo (haut de gamme, CAP 1280-1500 px) ; ~28 blobs ≈ 3 Mo (low-end, caméra 640 px).
- Cadence de tentatives **inchangée** (`captureMs` 150/300 ms) — on élargit la fenêtre, pas la pression CPU.
- Le compteur de force-accept et son comportement sont **inchangés**.

### 3.3 Sélection finale (remplace `verifyWinners`)

À la fin du scan, tous les scores réels sont déjà connus → plus de décodage en catastrophe pendant l'overlay de 1,5 s.

1. **Candidat utilisable** = `lap ≥ CFG.postBlurMinReject (8)` ET `luma ∈ [postBrightMinReject (35), postBrightMaxReject (240)]` — les seuils durs actuels, pas de nouveau seuil.
2. **Vainqueur d'un bin** = meilleur score parmi les utilisables.
3. **Bin de profil sans aucun utilisable → omis** (photo non uploadée, clé absente de `formState.photos`). On n'omet jamais au niveau « warning » (`lap < 20`) — uniquement en dessous du seuil « sévèrement flou » actuel : on n'omet que ce qui serait parti inutilisable de toute façon.
4. **Bin frontal sans aucun utilisable → micro-reprise** (§3.4).
5. **Photo zoom** : ~~re-dérivée du vainqueur frontal~~ — hypothèse invalidée à l'implémentation (2026-07-15) : le zoom est une photo **optionnelle ajoutée manuellement par l'utilisateur** en preview (« Ajouter un gros plan »), indépendante des bins. Aucune dépendance d'ordre, rien à faire.
6. Bandeau doré « qualité limite » (`_allWinnersBad`) conservé, recalculé sur la sélection finale.

### 3.4 Micro-reprise frontale

- Déclenchée automatiquement, **au plus une fois par scan**, entre l'overlay « Scan terminé » et la preview, uniquement si le bin frontal n'a aucun candidat utilisable.
- Réutilise le flux de retake par angle existant (`S.retake = "face"`), ~2-3 s, capture face uniquement.
- Message **neutre** (règle produit : jamais culpabilisant, pas de conseil d'éclairage directif) : « Reprenons la vue de face — quelques secondes ».
- Échec de la reprise → moins-pire + bandeau doré. **La garantie de progression est absolue : le scan finit toujours.**

### 3.5 Télémétrie (dans `scan_log`, pipeline existant)

Nouveaux événements :
- `final_selection` (1 par scan) : par bin — tableau des candidats `{lap, luma, score}` arrondis, vainqueur retenu, et **rang qu'aurait eu le vainqueur avec l'ancien score proxy** (rang 1 = le proxy aurait choisi pareil → mesure directe de la valeur du scoring réel). Taille bornée : ≤ 7 bins × 6 candidats.
- `bin_omitted` : bin, nb candidats, meilleur lap/luma.
- `front_retake` : déclenchée + résultat (candidat utilisable obtenu ou non).

**Critères de succès (mesurés avant/après sur scan_log)** :
- Médiane du `lap` des photos réellement uploadées : ↑
- Part des uploads avec `lap < 20` (zone warning) : ↓
- Taux d'omission et de micro-reprise : surveillés — s'ils explosent, seuils mal calés (même méthode que la calibration lumière phase 2).

## 4. Invariants (ne changent PAS)

- Parcours guidé, son ordre, sa durée ; messages neutres ; échappatoire manuelle 12 s.
- Force-accept pendant la capture (progression) ; le scan finit **toujours**.
- `capFrame`, son repli synchrone et son watchdog (v9.4, stabilisé la veille) : **intouchés**.
- Workflow n8n `Analyse Gratuite fr Scan` : **intouché** (la tolérance aux photos manquantes existe déjà).
- App mobile : **intouchée** (chantier web only).
- Nombre de photos uploadées : ≤ 7 + zoom (jamais plus qu'aujourd'hui).

## 5. Risques & garde-fous

| Risque | Garde-fou |
|---|---|
| Régression du pipeline capture fraîchement réparé | Jalon 1 ne touche pas au chemin de capture ; scoring greffé après le blob, derrière `capGen` |
| Course score asynchrone / éviction / reprise | JS single-thread ; re-tri à la résolution ; epoch de bin en mode reprise |
| Mémoire low-end | topN 4 + blobs évincés immédiatement + caméra 640 px |
| Sur-omission de profils | Seuil = « inacceptable » actuel uniquement ; télémétrie `bin_omitted` pour vérifier sur du réel |
| Reprise frontale en boucle | Une seule par scan, par construction |

## 6. Livraison — 3 jalons indépendants, chacun mesurable

1. **Scoring réel + sélection finale exhaustive + télémétrie** — corrige la cause racine, risque minimal, ne touche pas à `getAllowedBins`. Au jalon 1, un bin sans candidat utilisable (frontal compris) garde le comportement actuel : moins-pire + bandeau doré — l'omission et la micro-reprise n'arrivent qu'au jalon 3. Livrer, puis **2 semaines de données** avant de décider la suite.
2. **Entonnoir élargi** (`getAllowedBins` assoupli + top-6/4) — si les données du jalon 1 montrent que le pool de candidats est le facteur limitant.
3. **Omission des profils + micro-reprise frontale** — si les données montrent des bins entiers inutilisables.

## 7. Tests

- Fonctions pures extraites et testables hors navigateur (node) : calcul du score, insertion/éviction dans un bin, sélection finale (utilisable/omission/rang du vainqueur).
- Cas limites couverts : bin vide, tous candidats inutilisables, décodage null, scores ex æquo, résolution tardive après reset de bin.
- Validation terrain : comparaison des distributions `scan_log` avant/après chaque jalon (les critères §3.5 font foi).

## 8. Hors périmètre (explicitement)

- Calibration des seuils lumière (phase 2 dédiée, données en cours de collecte).
- Alignement des prompts app/web (ancres de calibration) et score de confiance affiché — étage « interprétation », chantier distinct.
- Tout changement du guidage UX ou des textes au-delà du message unique de micro-reprise.
