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

- **Lot 0 — outillage** ✅ : correctif `prep_de.py` (ligne du webhook épinglée ; le motif laissait « -pur » depuis le 05/10 → `analyse-gratuite-de-web-pur` au prochain rebuild), `prep_nl.py`, `apply_tr_nl.py` (refuse `None`), `qa_nl.py` (détecteurs adaptés au néerlandais : « de », « en », « die », « pas », « analyse », « routine », « abonnement » ne sonnent pas ; + vouvoiement « u/uw », allemand, anglais, vocabulaire interdit), `jscheck_nl.py` (node --check + JSON-LD contre le FR), `build_nl.py [--check]`, `seed_from_de.py` (tables pré-remplies avec le découpage FR prouvé de l'allemand, colonne NL vide), glossaire + brief, glossaire relu par 2 natifs (NL + BE).
- **Lot 1 — traduction** : 22 tables `tr_nl/*.py` remplies par 6 traducteurs en parallèle (accueil/contenu, parcours gratuit, parcours payant/2e ronde, légal + sources, blog ×2) ; QA 0 issue 0 résidu par page ; harmonisation des témoignages (même avis = même texte partout).
- **Lot 2 — relecture native** : 4 relecteurs (naturel du texte, terminologie peau + interdits, microcopie d'interface et longueurs mobile, respect du glossaire) + retraduction à l'aveugle NL → FR d'un échantillon ; toute correction passe par les tables ; `build_nl.py --check` identique.
- **Lot 3 — mise en ligne cachée** : `vercel.json` (`/nl` → `/nl/home`, `X-Robots-Tag: noindex` sur `/nl/*`), commit, push, vérification en ligne (200, en-tête noindex, liens), contrôle visuel 360 px + ordinateur.
- **Lot 4 — audit final** : relecture native indépendante de bout en bout, contre-épreuves du QA, `build_de.py --check` et `build_nl.py --check` identiques, FR/EN/ES/IT/DE inchangés.

## Phase 2 (hors de ce chantier)
Workflow n8n gratuit NL (webhook `analyse-gratuite-nl-web`), prix Stripe NL, branche `nl → paid-nl` dans l'aiguillage `bmh94sW7xkqA6ar9` (sinon un paiement NL part en FR), payant + 3 mails, `free-analysis.html` en néerlandais, `second-cycle-nl`, captures d'un rapport NL, relecture humaine payée, points juridiques NL/BE, puis ouverture (`expose_nl.py` : sélecteur, hreflang, sitemap, `ttq.js`, retrait du noindex).
