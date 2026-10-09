# Site Adermio en néerlandais — feuille de route (phase 1 : site seul, caché)

> Décidé avec Antoine le 09/10/2026, puis exécution en autonomie (« travaille en autonomie et traduis-moi le site en néerlandais. Audit final ensuite. Comme si tu étais un natif des Pays-Bas. Même ton et style que le FR. GO »).

**Objectif :** les 22 pages du site en néerlandais natif, même ton et même DA que le FR, prêtes pour la phase 2 (n8n), sans aucune exposition publique.

## Décisions

| # | Décision | Qui |
|---|---|---|
| D1 | **Périmètre phase 1 = site seul**, caché (noindex, hors sélecteur/hreflang/sitemap des autres langues). Le formulaire `/nl/form` est traduit mais son webhook `analyse-gratuite-nl-web` n'existe pas encore → caché tant que la phase 2 n'est pas faite | Antoine |
| D2 | **Registre « je / jouw »**, jamais « u / uw » : standard NL, y compris Thuisarts.nl, La Roche-Posay NL, Eucerin NL (vérifié le 09/10) | Antoine |
| D3 | **Outillage cloné de l'allemand** (`tests/i18n/nl/`), source = FR, IT/DE intouchés, + correctif du webhook DE (lot 0) | Antoine |
| D4 | Néerlandais standard (*Algemeen Nederlands*), une seule version NL/BE, code `nl`, `og:locale nl_NL` | Claude |
| D5 | Pages de contenu aux noms néerlandais (`over-ons`, `gebruiksvoorwaarden`, `privacyverklaring`, `juridische-informatie`, `bronnen`, blog `huidtype-bepalen`, `waarom-krijg-je-acne`, `hormonale-acne`, `waar-ontstaat-acne`) ; pages de parcours aux noms de `/it/` et `/de/` (le backend les construit) | Claude |
| D6 | Visuels de l'accueil (captures du rapport, vidéo) = anglais, comme `/de/` | Claude (comme DE) |
| D7 | Prix affiché **€ 5,99** (notation NL) | Claude (comme FR/DE/IT) |
| D8 | `facescan.js` non traduit : le scan n'est pas chargé par le formulaire de prod (mode import manuel), YAGNI | Claude |

## Lots

## État au 09/10/2026 (soir) : phase 1 TERMINÉE
22 pages en ligne, cachées (noindex, liées nulle part hors de `/nl/`). Audit final natif : **9,2/10 → ~9,4 après corrections, « prêt pour un public néerlandais » sur la langue**. Retraduction à l'aveugle : 0 contresens / 672 segments. 6 traducteurs + 2 relecteurs du glossaire + 5 relecteurs + 1 auditeur final ; ~103 corrections, toutes passées par les tables (`revue/R*_corrections.py`, arbitrages `revue/ARBITRAGE.py`). Contrôles : `build_nl.py --check` identique à l'octet, `qa_nl.py` 22/22, `jscheck_nl.py` OK, `coherence_nl.py` OK, `test_qa_nl.py` 26 pièges / 15 phrases OK, 8 types de fautes injectés sur de vraies pages tous détectés, `build_de.py --check` identique, FR/EN/ES/IT inchangés.

- **Lot 0 — outillage** ✅ : correctif `prep_de.py` (ligne du webhook épinglée ; le motif laissait « -pur » depuis le 05/10 → `analyse-gratuite-de-web-pur` au prochain rebuild), `prep_nl.py`, `apply_tr_nl.py` (refuse `None`), `qa_nl.py` (détecteurs adaptés au néerlandais : « de », « en », « die », « pas », « analyse », « routine », « abonnement » ne sonnent pas ; + vouvoiement « u/uw », allemand, anglais, vocabulaire interdit), `jscheck_nl.py` (node --check + JSON-LD contre le FR), `build_nl.py [--check]`, `seed_from_de.py` (tables pré-remplies avec le découpage FR prouvé de l'allemand, colonne NL vide), glossaire + brief, glossaire relu par 2 natifs (NL + BE).
- **Lot 1 — traduction** : 22 tables `tr_nl/*.py` remplies par 6 traducteurs en parallèle (accueil/contenu, parcours gratuit, parcours payant/2e ronde, légal + sources, blog ×2) ; QA 0 issue 0 résidu par page ; harmonisation des témoignages (même avis = même texte partout).
- **Lot 2 — relecture native** : 4 relecteurs (naturel du texte, terminologie peau + interdits, microcopie d'interface et longueurs mobile, respect du glossaire) + retraduction à l'aveugle NL → FR d'un échantillon ; toute correction passe par les tables ; `build_nl.py --check` identique.
- **Lot 3 — mise en ligne cachée** : `vercel.json` (`/nl` → `/nl/home`, `X-Robots-Tag: noindex` sur `/nl/*`), commit, push, vérification en ligne (200, en-tête noindex, liens), contrôle visuel 360 px + ordinateur.
- **Lot 4 — audit final** : relecture native indépendante de bout en bout, contre-épreuves du QA, `build_de.py --check` et `build_nl.py --check` identiques, FR/EN/ES/IT/DE inchangés.

## Phase 2 (hors de ce chantier) — à savoir avant de la lancer
- **La page de résultat gratuit (`free-analysis`) ne connaît pas `nl`** → repli anglais : le bouton € 5,99, le rapport, les mails et l'app seraient en anglais (1re cause de méfiance relevée par l'audit final). À traiter avec le workflow gratuit NL.
- **Valeur postée en néerlandais** : la durée (`3-6 maanden`, `> 3 jaar`…) part traduite dans le payload (comme DE/ES/IT) ; tout le reste (zones, facteurs, sexe, fréquence) reste en FR canonique. Le workflow n8n NL doit l'accepter.
- `lang: 'nl'` est envoyé à `second-cycle-nl`, au chat du premium (`ai.adermio.com`), à `skin-bilan-j28` et à `create-checkout-session` : vérifier qu'ils acceptent `nl` (sinon repli FR !) avant d'ouvrir.
- **Paiement** : iDEAL (Pays-Bas) et Bancontact (Belgique) à activer dans Stripe Checkout.
- Points juridiques NL/BE : `tests/i18n/nl/revue/POINTS_JURIDIQUES.md` ; allégations et contradictions de fond (FR aussi) : `revue/R2_termino.md`, `revue/R6_audit_final.md`.

Workflow n8n gratuit NL (webhook `analyse-gratuite-nl-web`), prix Stripe NL, branche `nl → paid-nl` dans l'aiguillage `bmh94sW7xkqA6ar9` (sinon un paiement NL part en FR), payant + 3 mails, `free-analysis.html` en néerlandais, `second-cycle-nl`, captures d'un rapport NL, relecture humaine payée, points juridiques NL/BE, puis ouverture (`expose_nl.py` : sélecteur, hreflang, sitemap, `ttq.js`, retrait du noindex).
