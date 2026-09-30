# Site Adermio en allemand — plan d'action

> **Pour les agents :** feuille de route en 7 lots. Chaque lot aura son plan détaillé (tâches en cases à cocher, contrôles, commits) écrit au moment de l'exécuter, à partir de l'état réel du dépôt et de n8n à ce moment-là. Exécution recommandée : superpowers:subagent-driven-development, un lot à la fois, revue avant de passer au suivant.

**Objectif :** un Allemand, un Autrichien ou un Suisse germanophone fait tout le parcours web en allemand natif (accueil → formulaire → analyse gratuite → paiement → rapport complet → mails → routine → support), sans une seule ligne de français ou d'anglais visible, avec le même ton et la même DA que le site français.

**Architecture :** on refait ce qui a marché pour l'italien le 03/09 (site traduit en miroir de balises strict du FR, outils rejouables dans `tests/i18n/`), plus la couche langue générique des workflows (`create-og-web-lang.mjs` / `patches/og-v6-lang.mjs`, où l'allemand = une entrée de config + un fichier de vocabulaire). La source de toute traduction est le **français**, jamais l'anglais ou l'italien : c'est le FR qui porte le ton et la DA.

**Outils :** site statique Vercel (`adermio-site` → dépôt `adermio-frontend`), n8n (`n8n.adermio.com`), Stripe, Supabase, scripts Python/Node existants.

**Référence :** `memory/adermio-web-i18n-map.md` (carte « une langue = N surfaces », établie pour l'italien).

## État mesuré le 30/09

- **Volume du site italien (modèle du DE) :** 20 pages + 5 pages de blog ≈ **14 600 mots de texte + ~2 800 mots dans le JavaScript** (messages du formulaire, écrans d'attente, bilan). Les plus gros morceaux : conditions + confidentialité (2 700 mots), blog (5 000), formulaires (500 mots + 250 en JS).
- **Parcours IT qui sert de modèle :** `it/form` → n8n gratuit (depuis ce soir `form-test-it-og`, remake OG pur) ; Stripe → aiguillage `bmh94sW7xkqA6ar9` (branches en/es/it, **toute langue inconnue part en FR**) → `paid-it` ; rapport payant lu via `/it/premium` ; mails envoyés par le workflow payant ; `routine` n'a que des branches **FR et EN** (IT/ES reçoivent l'ajustement en anglais) ; `second-cycle-it` appelé par la page.
- **Trafic germanophone actuel (60 jours) :** 57 analyses depuis DE/AT/CH, faites en it/en/fr, 11 achats. Il n'existe aucune base de mesure en allemand.
- **App :** l'allemand n'existe pas. Un client web allemand qui active son rapport dans l'app (code ADR) aura l'app **en anglais** (repli normal, `inconnu → en`). Hors périmètre ici, à décider séparément.

## Décisions

### Prises par Claude (fond, technique)
| # | Décision | Pourquoi |
|---|---|---|
| D1 | Dossier `/de/`, mêmes noms de fichiers que `/it/` (`home`, `form`, `processing`, `success`, `premium`…) ; articles de blog avec des **noms allemands** | Rejoue l'outillage IT tel quel ; le nom des articles compte pour le référencement Google |
| D2 | Traduire **depuis le FR**, page par page, balises identiques au FR (même structure, même CSS, mêmes classes) | La DA est garantie par la structure ; seul le texte change |
| D3 | Workflows n8n DE **construits par le générateur** (`--lang de`), jamais recopiés à la main | L'italien l'a prouvé : 1 fichier de vocabulaire + 1 entrée de config, et le FR reste intouché |
| D4 | Aiguillage Stripe : **branche `de → paid-de`** ajoutée AVANT toute mise en ligne | Sinon un paiement allemand déclenche le rapport payant FRANÇAIS (défaut du dispatcher) |
| D5 | Registre de langue : **« Sie »** partout (site, rapports, mails, prompts) | Même logique que « vous » FR, « Lei » IT, « usted » ES : ton pro, sérieux |
| D6 | Vocabulaire interdit : **Diagnose, diagnostizieren, Behandlung (au sens soin), Patient, heilen** ; on dit **Hautanalyse, Analyse, Pflege, Routine** | Règle « zéro langage médical » d'Adermio, et la loi allemande sur la publicité santé est plus stricte que la française |
| D7 | Fenêtre de suggestion de langue (`js/lang-suggest.js`) étendue : visiteur situé en DE/AT (et CH germanophone) sur /en → « Auf Deutsch weiter » | Les Italiens sur /en convertissaient 3 % contre 10 % sur /it : même risque pour les Allemands |
| D8 | Lancement en deux temps : **/de/ caché** (noindex, hors sélecteur) pour tester, puis ouverture publique | Aucune mise en ligne publique sans parcours complet vérifié avec de vrais paiements |

### À trancher par Antoine avant le lot concerné
| # | Question | Ma recommandation | Bloque |
|---|---|---|---|
| A1 | Moteur de l'analyse gratuite DE : **OG + v6** (FR/EN/ES) ou **remake OG pur** (IT depuis ce soir) ? | Suivre celui qui gagne la comparaison IT dans les prochains jours. Le générateur sait faire les deux, donc on choisit au dernier moment | Lot 4 |
| A2 | Prix : **5,99 €** (comme FR/IT/ES) ou 6,99 € (comme EN) ? | 5,99 € : même pouvoir d'achat que la France | Lot 4 |
| A3 | Moyens de paiement : ajouter **PayPal + Klarna + SEPA** dans Stripe ? | Oui. En Allemagne, PayPal est le premier moyen de paiement en ligne et la carte bancaire est moins répandue qu'en France. C'est un réglage de ton tableau de bord Stripe | Lot 7 |
| A4 | **Relecture humaine** par un·e natif·ve allemand·e (≈ 2-3 h de freelance, ~150-300 €) ? | Oui. Les relectures par agents attrapent les erreurs, mais seul un natif garantit que le texte « sonne vrai », et c'est ton exigence | Lot 6 |
| A5 | **Vérification juridique** allemande (Impressum, droit de rétractation pour un contenu numérique, confidentialité, consentement cookies) ? | Oui, au moins une relecture par un juriste. L'Allemagne est connue pour ses mises en demeure sur ces points ; je traduis et je signale, je ne remplace pas un avocat | Lot 6 |
| A6 | Blog : traduire les 4 articles ? | Oui (5 000 mots), c'est l'entrée Google | Lot 2 |

## Lots

### Lot 0 — Glossaire et guide de style (½ séance)
- Créer `tests/i18n/GLOSSAIRE_DE.md` : termes fixes (Hautanalyse, Hautbild, Unreinheiten, Pickel/entzündete Pickel, Mitesser, Mitesser geschlossen, Rötungen, Pigmentflecken, Aknenarben, Poren, Talg, Routine, Morgen-/Abendroutine, sévérités « leicht / mittel / ausgeprägt »…), noms des 6 cases du rapport, CTA, formules de politesse, format des prix (« 5,99 € »), dates (TT.MM.JJJJ), décimales à virgule. S'appuyer sur le glossaire IT (`GLOSSAIRE_WORKFLOW_IT.md`) et sur le vocabulaire des marques de dermocosmétique vendues en pharmacie en Allemagne (La Roche-Posay DE, Eucerin, Avène DE) pour les termes de peau.
- Section **« Décisions du client »** dans le glossaire (Sie, vocabulaire interdit D6, et chaque réponse à A1-A6). Leçon de l'IT : un relecteur avait annulé une décision d'Antoine faute de l'avoir écrite.
- `BRIEF_TRADUCTEUR_DE.md` (dérivé du brief IT) : ton = celui du FR (rassurant, clair, jamais alarmiste), phrases courtes, pas de calques du français, pas d'anglicismes inutiles.
- **Livrable :** glossaire + brief, relus par 2 agents « natifs » indépendants avant tout usage.

### Lot 1 — Pages cœur du parcours (1 séance)
`home`, `form` (+ JS : validations, erreurs, étapes photo, `facescan.js` dictionnaire `T.de`), `processing`, `success`, `premium`, `premium-second-cycle`, `second-cycle`, `analysis-in-progress-second-cycle`, `bilan`, `contact`, `feedback`, `about`, `sources`.
- Squelette mécanique `prep_de.py` (copie de `prep_it.py`), tables de littéraux `tr_de/*.py` (FR → DE), application `apply_tr.py`, qui **échoue si un littéral manque**.
- `qa_de.py` : structure = FR (balises, classes, liens, scripts), **aucun résidu FR ou EN** (mots-outils, segments identiques au FR, morphologies françaises en -ez/-ement/-eux), liens internes en `/de/`.
- Mobile : les mots allemands sont longs (« Hautanalyse », « Unreinheiten ») ⇒ contrôle de chaque page à 360 px dans le navigateur (boutons, badges, en-têtes du formulaire). À l'IT, deux libellés à la ligne avaient désaligné le formulaire.
- **Livrable :** parcours cliquable en local, `qa_de.py` vert, captures 360 px + ordinateur.

### Lot 2 — Pages légales et blog (1 séance)
`conditions`, `confidentialite`, `legal-notice` (→ **Impressum**), blog index + 4 articles (noms de fichiers allemands).
- Pages légales : traduction fidèle du FR, plus les écarts spécifiquement allemands **listés pour le juriste** (A5), sans les inventer : Impressum complet, droit de rétractation (Widerrufsrecht) pour un contenu numérique, base légale des données de santé (photos du visage), consentement aux traceurs.
- **Livrable :** pages en `/de/`, liste « points juridiques à valider » pour Antoine.

### Lot 3 — Rendre le DE visible dans le site, mais caché (½ séance)
`vercel.json` (`/de` → `/de/home`), `js/ttq.js` (pixel TikTok, liste des pages formulaire), `js/lang-suggest.js` (D7), `js/geo.js` si besoin. Pages **en noindex et absentes du sélecteur** tant que le lot 7 n'est pas passé. Déploiement sur Vercel.

### Lot 4 — Analyse gratuite DE dans n8n (1 séance)
- `og-v6-de-i18n.json` (vocabulaire des cases, résumé, intro, gabarits PDF, page 2) + entrée `de` dans `OG_LANGS` (prix, `success_url=/de/success`, `lang: de`, correspondance des zones du formulaire vers le FR canonique).
- Prompts Gemini/GPT en allemand « Sie », avec la consigne de vocabulaire D6 ; **logique, seuils et moteur identiques au FR au caractère près** (règle « miroir fidèle »).
- Prix Stripe DE créé (A2) ; `create-og-web-lang.mjs --lang de` (ou `create-og-v6-web.mjs`, selon A1) → workflow de **test** avec son propre webhook.
- Tests : 10 bouts en bout (Correction + Stabilisation, sans visage, formulaire sans zone), **0 mot français** dans les rapports, `free_analysis.lang='de'`, `metadata.lang=de` dans Stripe. Lignes de test supprimées après.
- Captures « page 2 » en allemand (`app-*-de.webp`) : l'app n'existe pas en allemand ⇒ **décision visuelle pour Antoine** : captures EN avec une mention « App auf Englisch », comme la vidéo IT.

### Lot 5 — Paiement, rapport complet, mails, routine, support (1-2 séances)
- **Aiguillage Stripe** : branche `If3 lang=de → paid-de` (D4), testée AVANT le branchement du formulaire.
- **Workflow payant DE** (clone de `paid-it`, 73 nœuds) : gabarits du rapport (~1,1 M de caractères), 3 mails, `/de/premium?token=`. Pièges connus de l'IT à rejouer : **ne jamais traduire les mots-clés qui lisent la base** (`grossesse`, `aspirine`, `parfum`, `arachide` dans les contre-indications : ce sont des tags FR canoniques ; les traduire rendait muets les blocages de sécurité) ; accords de genre allemands (3 genres, déclinaisons) dans les libellés générés par le code.
- Contrôle miroir `compare_fr_de.py` (adapté de `compare_fr_it.py`, déjà validé par 9 contre-épreuves) : tout écart avec le FR doit être une traduction ou un écart technique listé, **0 écart non justifié**.
- **Routine** (`ftMYrSp0SRz8fNH8`) : aujourd'hui FR ou EN seulement ⇒ l'ajustement de routine d'un client allemand arriverait en anglais. Ajouter une branche DE (mesurée d'abord : même dette pour IT et ES).
- **Second cycle** : page `de/second-cycle` seulement si le webhook `second-cycle-de` existe (l'ES a une page qui appelle un webhook inexistant : ne pas reproduire).
- **Produits du rapport** : textes produits (`how_to_use`, `why_recommended`) = colonnes FR/EN ⇒ ajouter la langue `de` au catalogue traduit automatiquement (`products_i18n`, règles `rules/de.json`) ou accepter l'anglais en repli. Mesurer combien de produits sont concernés avant de choisir.
- **Support** : capteur de mails + skill de relance savent-ils lire et répondre en allemand ? Ajouter `DE` à `support_inbox.langue` (contrainte CHECK FR/EN actuelle).
- **Test réel :** 2 vrais paiements par carte, puis remboursés (Correction + Stabilisation) ⇒ rapport, PDF, 3 mails, routine, reprise dans l'app avec le code ADR (app en anglais, attendu).

### Lot 6 — Relecture native (1 séance + délai freelance)
1. **4 relecteurs agents indépendants**, un rôle chacun : (a) copywriter natif (naturel, rythme, ton FR conservé), (b) terminologie peau/cosmétique et vocabulaire interdit, (c) microcopie d'interface (boutons, erreurs, longueurs à l'écran), (d) cohérence avec le glossaire et les « Décisions du client ». Chacun sort une liste de corrections sourcée ; rien n'est appliqué sans passer par les tables de traduction, sinon c'est perdu au prochain rejeu.
2. **Retraduction à l'aveugle** DE → FR d'un échantillon (accueil, formulaire, 2 rapports, 3 mails) par un agent qui n'a pas vu le FR : chaque écart de sens avec le FR d'origine = contresens à corriger.
3. **Relecture humaine** (A4) des pages qui vendent : accueil, formulaire, page 2 du rapport, offre, mails. **Relecture juridique** (A5).
- **Livrable :** journal des corrections, 0 correction ouverte.

### Lot 7 — Ouverture (½ séance + 3 jours de mesure)
- Test discret : 20-30 vraies analyses allemandes (un TikTok DE, ou le trafic germanophone qui arrive déjà sur /en et /it) ; relecture de chaque rapport ; conversion mesurée par jour.
- Si c'est propre : `hreflang` + « Deutsch » dans le sélecteur de toutes les pages FR/EN/ES/IT, sitemap (les alternates se réécrivent avec `fix_sitemap_hreflang.py` ; **chaque entrée doit s'auto-référencer**, piège de l'IT), retrait du noindex, fenêtre de suggestion active.
- Moyens de paiement (A3) activés avant l'ouverture.

## Ce que je ne fais délibérément PAS
- L'**app** en allemand : chantier séparé (le socle i18n de l'app permet `npm run i18n:new-locale -- --dry-run de`, mais il faut un build).
- **Améliorer** quoi que ce soit du FR en traduisant : miroir fidèle, les défauts connus du moteur restent les mêmes qu'en FR.
- Mettre en ligne publiquement sans que le lot 7 soit passé.

## Risques principaux et parade
| Risque | Parade |
|---|---|
| Un paiement DE produit un rapport FR | Branche du dispatcher d'abord (lot 5) + test avec un vrai paiement avant d'ouvrir le formulaire |
| Traduire un tag de la base casse la sécurité (grossesse, allergies) | Règle « on traduit ce que lit l'utilisateur, jamais ce que lit la base » + contrôle miroir |
| Texte correct mais pas naturel | Glossaire d'abord, 4 relecteurs, retraduction à l'aveugle, relecture humaine |
| Mise en page cassée par les mots longs | Contrôle à 360 px à chaque lot |
| Mise en demeure juridique | Points juridiques listés au lot 2, validés par un juriste avant l'ouverture |
| Un correctif appliqué à la main disparaît au rejeu | Toute correction passe par les tables `tr_de/*`, rejouabilité vérifiée à l'octet |

## Estimation
5 à 7 séances de travail, plus le délai des relectures humaine et juridique. Les lots 0 → 3 (site) et 4 → 5 (n8n) peuvent avancer en parallèle une fois le glossaire validé.
