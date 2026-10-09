# Néerlandais — phase 2 : backend (n8n, Stripe, routine) — design

> Validé avec Antoine le 09/10/2026. Suite de la phase 1 (site `/nl/` traduit, caché : `docs/superpowers/plans/2026-10-09-site-neerlandais-roadmap.md`).

## Objectif
Un visiteur néerlandais ou flamand fait tout le parcours web en néerlandais : formulaire `/nl/form` → analyse gratuite → paiement → rapport complet + PDF + mails → ajustement de routine. Puis la version néerlandaise est ouverte au public. Succès = 0 mot français dans ce parcours, les autres langues strictement inchangées, et un vrai paiement vérifié de bout en bout avant l'ouverture.

## Décisions
| # | Décision | Qui |
|---|---|---|
| D1 | Moteur de l'analyse gratuite NL = **celui de l'allemand** (miroir du FR « v1 », `Analyse Gratuite web` `Y0xSMbwk9DALHkmn` ; DE = 22,6 % de conversion du 02 au 08/10, contre FR OG pur 12,1 %, IT 10,8 %, ES 4,2 %). Traduction **depuis le FR**, jamais depuis l'allemand | Antoine |
| D2 | **Branche néerlandaise dans l'ajustement de routine** (`routine` `ftMYrSp0SRz8fNH8`) dès cette phase, avec non-régression FR/EN | Antoine |
| D3 | Textes produits du rapport (mode d'emploi, pourquoi ce produit) **en anglais au lancement**, comme l'allemand ; catalogue NL plus tard si le volume le justifie | Antoine |
| D4 | **iDEAL + Bancontact activés avant l'ouverture** (réglage du tableau de bord Stripe, fait par Antoine) | Antoine |
| D5 | Registre « je / jouw », zéro langage médical, € 5,99, glossaire du site = référence (`tests/i18n/nl/GLOSSAIRE_NL.md`) | Antoine (phase 1) |
| D6 | Prix 5,99 € TTC, nouveau produit Stripe au nom néerlandais, `automatic_tax` comme les autres langues | Claude |
| D7 | Un workflow par langue, cloné et traduit par tables rejouables (règle du 24/09), outillage cloné de l'allemand | Claude |
| D8 | Pas de 2e ronde NL (0 exécution récente, 1 inscription web en 90 j), bilan J28 en repli anglais, app en anglais | Claude |

## Inventaire (mesuré le 09/10)
**À créer / modifier**
1. Workflow gratuit NL — webhook `analyse-gratuite-nl-web` (déjà dans `/nl/form`), prompts Gemini/GPT NL, rapport page 1 + page 2 floutée, nœuds Stripe (prix NL, `metadata[lang]=nl`, `success_url=/nl/success`), `free_analysis.lang='nl'`, zones du formulaire en FR canonique, durée postée en néerlandais (`3-6 maanden`…), suivi du rapport (`apply-report-track.mjs`), vidéo/captures annoncées en anglais.
2. Prix Stripe NL.
3. Aiguillage Stripe `bmh94sW7xkqA6ar9` : branche `If4 lang=nl → paid-nl` (sinon un paiement NL déclenche le rapport FR).
4. Workflow payant NL `paid-nl` (clone de `Analyse Payante Allemand` `vuoVBmSeLBhSQ5VD`, 74 nœuds, texte depuis le FR `knYCq6L4eBlulcbK`) : rapport, PDF, 3 mails, liens `/nl/premium` `/nl/bilan`, arête vers `envoie_feedback` retirée (comme DE/IT/ES).
5. `routine` : `If lang=fr` → aiguillage FR / NL / sinon EN ; branche NL = structure de la branche EN (sans l'offre FR `section_upgrade`), textes traduits depuis les nœuds FR jumeaux.
6. `free-analysis.html` : entrée `UX.nl` (titre, erreur, lien `/nl/form`).
7. `support_inbox_langue_check` : + `NL` (+ `DE`, refusé aujourd'hui).
8. Ouverture : `expose_nl.py` (sélecteur, hreflang, sitemap, `ttq.js` FORM_PAGES, retrait du noindex), fenêtre de suggestion de langue si pertinente.

**Neutres (rien à faire)** : job-status, upload-log, presign-upload, Contact, feedback, get-form-context, Sync Stripe checkout, Rapport quotidien achats.

**Repli accepté** : bilan J28 (`skin-bilan-j28`, normaliseur → anglais), app (anglais), textes produits (anglais, D3), 2e ronde (non construite ; `create-checkout-session` ne connaît que fr/en, sans effet tant qu'il n'y a pas de 2e ronde NL).

**À vérifier en test** : chat du rapport complet (`ai.adermio.com/api/chat`, serveur hors GitHub) avec `lang=nl` ; `skin-engine` avec `lang=nl` dans le payant et la routine (repli anglais attendu, pas français).

## Architecture
```
/nl/form ──POST──▶ [Gratuit NL] ──▶ free_analysis(lang=nl) + rapport S3 + Stripe Checkout (prix NL, metadata lang=nl)
                                                         │ paiement (carte, Link, iDEAL, Bancontact)
                                                         ▼
                          Stripe webhook ──▶ [Aiguillage] ── lang=nl ──▶ [Payant NL] ──▶ paid_reports(lang=nl) + rapport + PDF + 3 mails
                                                                                     │
/nl/premium?token= ── get_report / chat / routine ──▶ [routine] ── lang=nl ──▶ branche NL (Gemini NL + skin-engine + gabarits NL)
```

## Méthode (reprise de l'allemand)
- Outillage `adermio-free-report/nl-workflow/` (gratuit) et `nl-workflow-paid/` (payant), clonés de `de-workflow/` et `de-workflow-paid/` : nœuds FR source → tables FR→NL (`tr/*.py`) → build (assertions) → audit (structure = FR, JS valide, clés/expressions intactes, 0 résidu FR/EN/DE, « u/uw » interdit) → simulation → déploiement par l'API REST (`curl --http1.1 --compressed`, pagination).
- Règle de sécurité : dans un nœud de code, **ce qui lit l'utilisateur se traduit, ce qui lit la base jamais** (tags `contraindications` en FR canonique).
- Contrôle miroir `compare_fr_nl.py` (dérivé de `compare_fr_de.py`) : chaque écart = TEXTE, TECHNIQUE listé ou CODE justifié ; **0 NON JUSTIFIÉ**.
- `routine` : sauvegarde JSON avant toute modification ; preuve que les nœuds FR et EN sont identiques à l'octet avant/après ; rejeu de requêtes FR et EN réelles avant/après (sortie identique hors horodatages et identifiants).
- Glossaire des workflows NL dérivé de `GLOSSAIRE_NL.md` + `GLOSSAIRE_WORKFLOW_DE.md` / `GLOSSAIRE_PAYANT_DE.md` (section « Décisions du client » en tête).

## Tests
1. Gratuit : ≥ 10 e2e avec de vrais questionnaires rejoués (Correction + Stabilisation, sans visage, sans zone), rapport 100 % néerlandais, `free_analysis.lang='nl'`, session Stripe `metadata.lang=nl`, `success_url=/nl/success`. Lignes de test supprimées après.
2. Payant : événement Stripe simulé sur une gratuite NL → rapport, PDF, 3 mails néerlandais, `paid_reports.lang='nl'`, `premium_analysis.downloadUrl=/nl/premium?token=`.
3. Aiguillage : `lang=nl` → paid-nl ; fr/en/es/it/de inchangés (lecture du JSON avant/après).
4. Routine : NL de bout en bout depuis `/nl/premium` ; non-régression FR/EN.
5. Relecture native (relecteurs + retraduction à l'aveugle) des rapports, mails et ajustements générés.
6. Ouverture : iDEAL/Bancontact visibles sur une Checkout NL ; un vrai paiement d'Antoine (remboursé) de bout en bout ; puis exposition et suivi par jour.

## Risques et parades
| Risque | Parade |
|---|---|
| Paiement NL → rapport FR | Branche de l'aiguillage avant tout paiement réel, testée |
| Casser l'ajustement de routine FR/EN en prod | Sauvegarde, preuve d'identité des branches FR/EN à l'octet, rejeu avant/après, retour arrière = PUT de la sauvegarde |
| Traduire un tag de la base (sécurité) | Règle « utilisateur oui, base jamais » + contrôle miroir |
| Texte IA qui glisse en anglais ou français | Consignes NL explicites dans les prompts, audit des rapports générés, relecture native |
| Fenêtre glissante trompeuse à l'ouverture | Mesure par jour et par pays (`web_form_funnel`, `web_checkout`) |

## Hors périmètre
2e ronde NL, bilan J28 NL, catalogue produits NL, app NL, réparation du workflow « Suivi 28 jours » (ne connecte plus aucun envoi : chantier séparé).
