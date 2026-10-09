# Néerlandais phase 2 (n8n, Stripe, routine) — plan d'exécution

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** un client néerlandais fait tout le parcours web en néerlandais (`/nl/form` → analyse gratuite → paiement → rapport complet + PDF + 3 mails → ajustement de routine), puis `/nl/` est ouvert au public.

**Architecture :** on clone l'outillage de l'allemand (`adermio-free-report/de-workflow`, `de-workflow-paid`) en `nl-workflow`, `nl-workflow-paid`, plus un nouvel outil `nl-routine`. Chaque workflow est construit depuis un instantané FR, avec des tables de traduction FR→NL rejouables et des audits qui échouent au moindre écart. Les workflows partagés (aiguillage Stripe, `routine`) ne reçoivent qu'un ajout de branche `nl`, prouvé sans effet sur les autres langues.

**Tech Stack :** n8n (API REST publique, `curl --http1.1 --compressed`), Python 3, Node 20 (`node --check`, patchs `adermio-app/scripts/n8n`), Supabase (MCP SQL / migrations), Stripe (MCP), site statique Vercel (`adermio-site` → dépôt `adermio-frontend`).

**Spec :** `adermio-site/docs/superpowers/specs/2026-10-09-n8n-neerlandais-design.md`

## Global Constraints
- Langue source de toute traduction = **le français**, jamais l'allemand ni l'anglais.
- Registre **« je / jouw »**, jamais « u / uw » ; **zéro langage médical** côté Adermio (jamais *diagnose*, *klinisch*, *patiënt*, *behandelen* quand c'est Adermio ; *dermatoloog* jamais pour Adermio) ; référence : `adermio-site/tests/i18n/nl/GLOSSAIRE_NL.md`.
- Prix **5,99 € TTC**, affichage NL `€ 5,99` (espace insécable dans le HTML).
- Webhooks : gratuit `analyse-gratuite-nl-web` (déjà appelé par `/nl/form`), payant `paid-nl`.
- **Rien ne change** dans les workflows FR/EN/ES/IT/DE, hormis l'ajout d'une branche `nl` dans l'aiguillage `bmh94sW7xkqA6ar9` et dans `routine` `ftMYrSp0SRz8fNH8` ; **sauvegarde JSON avant tout PUT**.
- Dans un nœud de code : **ce que lit l'utilisateur se traduit, ce que lit la base jamais** (tags `contraindications` FR : `grossesse`, `aspirine`, `parfum`, `arachide`…).
- Textes produits du rapport en **anglais** (D3) ; les edge functions reçoivent `EN` là où l'allemand envoie `EN`.
- API n8n : PUT = `{name, nodes, connections, settings filtrées}` uniquement ; pagination obligatoire.
- Jamais de `pkill`/`killall` par motif ; jamais de secret affiché (clés lues depuis `~/.claude/settings.json` ou les nœuds, jamais imprimées).
- Commits : `git commit -- <chemins>` (index partagé), message terminé par la ligne Co-Authored-By — **seulement dans `adermio-site`**. `adermio-free-report/` n'est **pas versionné** (comme l'outillage DE) : dans les lots A-E, chaque étape « commit » = consigner l'état dans le `README.md` du dossier concerné + archive horodatée `tar czf archives/<dossier>_<AAAAMMJJ-HHMM>.tgz <dossier>`.

## Review Focus
1. **Nom du client absent chez Stripe** (iDEAL, Link, Bancontact laissent souvent `customer_details.name = null`) → le PDF et le mail doivent partir quand même (repli prénom du formulaire, puis « Adermio »). Testé : Task 10, étape 6.
2. **Durée postée en néerlandais** (`3-6 maanden`, `> 3 jaar`) alors que les autres valeurs sont en FR canonique → le gratuit NL doit produire un rapport sans « undefined » ni valeur FR. Testé : Task 6, payloads C1-C3.
3. **Paiement iDEAL / Bancontact** → `checkout.session.completed` doit arriver `paid` et passer par `If4 → paid-nl`. Testé : Task 16 (vrai paiement d'Antoine en iDEAL).
4. **Repli des edge functions** (`skin-engine`, `product-substitute-ai`…) avec une langue NL → doit donner de l'**anglais**, jamais du français, dans le rapport et l'ajustement. Testé : Task 10 étape 7, Task 13 étape 4.
5. **Mots néerlandais longs dans le PDF et les tuiles du rapport** (*huidverzorgingsroutine*, *acnelittekens*) → aucun débordement à 360 px ni dans le PDF A4. Testé : Task 14, étape 3.

---

## Lot A — Préalables

### Task 1 : Glossaire des workflows NL

**Files :**
- Create : `adermio-free-report/nl-workflow/GLOSSAIRE_WORKFLOW_NL.md`
- Read : `adermio-site/tests/i18n/nl/GLOSSAIRE_NL.md`, `adermio-free-report/de-workflow/GLOSSAIRE_WORKFLOW_DE.md`, `adermio-free-report/de-workflow-paid/GLOSSAIRE_PAYANT_DE.md`, `adermio-free-report/de-workflow/simulate_de.js` (objet `LABELS`)

**Interfaces :**
- Produces : la table `LABELS` FR→NL (libellés générés par le code : types de peau, sévérités, lésions au singulier, au pluriel et « isolé(e) », zones, objectifs), reprise telle quelle par `simulate_nl.js` (Task 5) et par les tables de code (Tasks 5, 9, 12).

- [ ] **Step 1 :** créer le glossaire. En tête, la section « Décisions du client », recopiée du glossaire du site (décisions 1 à 17) et complétée par D1-D4 de la spec. Puis une section « Libellés générés par le code », avec **chaque** clé de `LABELS` de `simulate_de.js` et sa traduction NL. Règle néerlandaise pour l'accord de l'adjectif : *de*-woord → `geïsoleerde`, *het*-woord indéfini → `geïsoleerd`. Exemples : `Bouton rouge isolé` → `Eén ontstoken puistje`, `Point noir isolé` → `Eén mee-eter`. Formuler sans accord quand c'est plus naturel.
- [ ] **Step 2 :** vérifier la couverture.
  Run : `cd adermio-free-report && node -e "const s=require('fs').readFileSync('de-workflow/simulate_de.js','utf8');const m=s.match(/const LABELS = \{([\s\S]*?)\n\};/)[1];const keys=[...m.matchAll(/'((?:[^'\\\\]|\\\\.)*)'\s*:/g)].map(x=>x[1]);const g=require('fs').readFileSync('nl-workflow/GLOSSAIRE_WORKFLOW_NL.md','utf8');const miss=keys.filter(k=>!g.includes('| '+k+' |'));console.log(keys.length,'clés,',miss.length,'manquantes',miss)"`
  Expected : `… clés, 0 manquantes []`
- [ ] **Step 3 :** faire relire le glossaire par un agent natif néerlandais (persona : rédacteur dermocosmétique Pays-Bas ; consigne : ne jamais contredire « Décisions du client »), puis intégrer ses corrections.
- [ ] **Step 4 :** commit (au sens des Global Constraints : `README.md` + archive horodatée de `nl-workflow/`).

### Task 2 : Prix Stripe NL

**Files :**
- Create : `adermio-free-report/nl-workflow/stripe_price_nl.txt` (id du prix)

**Interfaces :**
- Produces : `PRICE_NL` (`price_…`) lu par `build_nl.py --price` (Task 6).

- [ ] **Step 1 :** lire le prix DE `price_1ULV1T0GLtgfLG0abqUDflRi` (MCP Stripe, `stripe_api_read`) et noter `currency`, `unit_amount`, `tax_behavior` et le produit.
- [ ] **Step 2 : demander l'accord d'Antoine dans le chat** (création d'un objet Stripe live). Sans accord explicite, s'arrêter ici.
- [ ] **Step 3 :** créer le produit « Je volledige Adermio-analyse », puis le prix (EUR, `unit_amount=599`, même `tax_behavior` que DE). Écrire l'id dans `stripe_price_nl.txt`.
- [ ] **Step 4 :** relire le prix créé : `unit_amount == 599`, `currency == eur`, `active == true`, nom du produit exact.

### Task 3 : Support — langues NL et DE

**Files :**
- Migration Supabase : `support_inbox_langue_nl_de`
- Modify (n8n) : « Capteur Email Support Adermio » `OHtJ8ISY2yrpAmIH`, nœud `Parse Email Body` (objet `KEYWORDS`)
- Modify : `skills/adermio-relance-analyse-extracted/adermio-relance-analyse/SKILL.md` (lignes « Détecter la langue » et `UPDATE … langue`)
- Create : `adermio-free-report/nl-workflow/test_capteur_langue.mjs`

- [ ] **Step 1 : test d'abord.** Écrire `test_capteur_langue.mjs`. Il charge le JS du nœud `Parse Email Body` depuis une sauvegarde JSON, extrait la fonction de détection et vérifie :
  - `"Hallo, ik heb betaald maar mijn analyse niet ontvangen, de link werkt niet"` → `NL` ;
  - `"Hallo, ich habe bezahlt aber meine Analyse nicht erhalten"` → `DE` ;
  - les 4 phrases témoins FR/EN/ES/IT → inchangées.
  Lancer sur la sauvegarde actuelle. Expected : échec sur NL et DE.
- [ ] **Step 2 :** sauvegarder le workflow, dans `archives/n8n-backups-<AAAAMMJJ>-nl/capteur_OHtJ_avant.json`.
- [ ] **Step 3 :** ajouter `NL` (`ontvangen`, `betaald`, `analyse`, `toegang`, `hallo`, `bedankt`, `rapport`, `link`, `niet`, `mijn`) et `DE` (`erhalten`, `bezahlt`, `Analyse`, `Zugang`, `hallo`, `danke`, `Bericht`, `Link`, `nicht`, `meine`) à `KEYWORDS`. Ordre de départage inchangé pour FR/EN/ES/IT, NL et DE ajoutés à la fin. PUT, relire, relancer le test. Expected : PASS.
- [ ] **Step 4 :** migration `alter table support_inbox drop constraint support_inbox_langue_check, add constraint support_inbox_langue_check check (langue = any (array['FR','EN','ES','IT','DE','NL']));`. Vérifier par `begin; insert … langue='NL' …; rollback;` (MCP SQL).
- [ ] **Step 5 :** mettre à jour SKILL.md : langues `FR|EN|ES|IT|DE|NL`. Cas 2 (relance) pour DE/NL : rappeler `paid-de` / `paid-nl` avec l'événement Stripe stocké, comme le fait l'aiguillage. Mail de réponse rédigé dans la langue du client.

---

## Lot B — Analyse gratuite NL

### Task 4 : Outillage `nl-workflow` (échafaudage, build qui refuse le non-traduit)

**Files :**
- Create (copies adaptées de `de-workflow/`) : `nl-workflow/build_nl.py`, `audit_nl.py`, `simulate_nl.js`, `deploy_nl.py`, `run_tests_nl.py`, `n8n_api.py`, `report_text.py`, `inspect_exec.py`, `wait_exec.py`, `seed_tables_nl.py`, `backups/fr_Y0xSMbwk9DALHkmn_20260903.json` (copie à l'identique)
- Create : `nl-workflow/tr/code.py`, `tr/html_pdf3.py`, `tr/html_pdf1.py` (pré-remplies, NL = `None`), `nl-workflow/prompts_fr/` (copie), `nl-workflow/prompts_nl/` (vide)

**Interfaces :**
- Produces : `build_nl.py [--price price_xxx]` → `build/nl_workflow.json` ; constantes `NAME_NL='Analyse Gratuite Néerlandais web'`, `WEBHOOK_NL='analyse-gratuite-nl-web'` ; `audit_nl.py [fichier]` ; `node simulate_nl.js [fichier]` ; `run_tests_nl.py [tags…]` → `build/nl_test_jobs.txt`.

- [ ] **Step 1 :** copier les scripts, puis remplacer : `de` → `nl` (lang Supabase, `metadata[lang]`, `/de/success` → `/nl/success`, préfixe des jobs de test `job_detest_` → `job_nltest_`), `NAME_DE`/`WEBHOOK_DE`/`PRICE_DE` → `NAME_NL`/`WEBHOOK_NL`/`PRICE_NL` (lu dans `stripe_price_nl.txt`), `prompts_de` → `prompts_nl`, `zoneDE` → `zoneNL`, `lang="de"` → `lang="nl"`.
  - `apply_table` de `build_nl.py` refuse toute entrée dont la valeur NL est `None` : `errors.append(f'{label}: NON TRADUIT {fr[:80]!r}')`.
  - `audit_nl.py` : remplacer les détecteurs de résidus DE par ceux de `adermio-site/tests/i18n/nl/qa_nl.py` (importer `STRONG`, `FR_RE`, `EN_RE`, `DE_RE`, `U_RE`, `BANNED_RE`, `has_fr_morphology` via `sys.path`). Ajouter un résidu **allemand** interdit.
- [ ] **Step 2 :** `seed_tables_nl.py` : pour chaque table `de-workflow/tr/*.py`, écrire `nl-workflow/tr/*.py`, mêmes entrées FR (colonne 1, compte), colonne NL = `None`. Les REGEX/`SIMPLE` allemands sont recopiés en commentaire. Ne jamais écraser une table existante.
- [ ] **Step 3 : test d'échec attendu.** Run : `cd adermio-free-report/nl-workflow && python3 build_nl.py --price price_DUMMY`. Expected : `N erreur(s) — rien écrit`, chaque ligne `NON TRADUIT`, et `build/nl_workflow.json` absent.
- [ ] **Step 4 : contre-épreuve de l'audit.** Copier `de-workflow/build/de_workflow.json` vers `/tmp`, lancer `python3 audit_nl.py /tmp/de_workflow.json`. Expected : échec (lang ≠ nl, résidus allemands).
- [ ] **Step 5 :** commit des scripts et tables pré-remplies.

### Task 5 : Traduction du gratuit (tables, prompts, libellés)

**Files :**
- Modify : `nl-workflow/tr/code.py`, `tr/html_pdf3.py`, `tr/html_pdf1.py`, `nl-workflow/simulate_nl.js` (`LABELS` FR→NL = glossaire Task 1)
- Create : `nl-workflow/prompts_nl/{message_a_model,message_a_model1,gemini,gemini1}.txt`, `nl-workflow/BRIEF_TRADUCTEUR_WORKFLOW_NL.md` (dérivé de `adermio-site/tests/i18n/nl/BRIEF_TRADUCTEUR_NL.md` + règles des nœuds de code)

**Interfaces :**
- Consumes : glossaire Task 1, échafaudage Task 4.
- Produces : `build/nl_workflow.json` valide.

- [ ] **Step 1 :** traduire les tables par sous-agents (un pour `code.py` + KPI, un pour les 2 gabarits HTML, un pour les 4 prompts). Brief :
  - prompts GPT/Gemini = traduction **exacte** des consignes FR, sortie demandée en néerlandais « je », avec « Les données du formulaire peuvent être en français » écrit en néerlandais ;
  - `zoneNL()` dans KPI/KPI1 affiche en néerlandais les zones postées en FR canonique ;
  - accents néerlandais (ë, é, ï) encodés en entités dans les gabarits HTML, comme le FR (règle de `audit_nl.py`).
- [ ] **Step 2 :** intégrer le suivi du rapport dans le build : après l'étape 4 de `build_nl.py`, importer `applyReportTrack` de `adermio-app/scripts/n8n/patches/report-inner-track.mjs` via `node -e`, sur le JSON construit. Expected : 2 gabarits `Assemble_HTML_flou` portent `RT_MARK`.
- [ ] **Step 3 :** Run : `python3 build_nl.py --price $(cat stripe_price_nl.txt)`. Expected : `OK -> build/nl_workflow.json (… 57 nœuds, price=price_…)`.
- [ ] **Step 4 :** Run : `python3 audit_nl.py`. Expected : structure = FR, 0 résidu FR/EN/DE, 0 « u/uw », JS valide, expressions `{{ }}` identiques.
- [ ] **Step 5 :** Run : `node simulate_nl.js`. Expected : 5 scénarios, tous les champs identiques au FR sauf les libellés de `LABELS`, 0 écart non attendu.
- [ ] **Step 6 :** commit.

### Task 6 : Déploiement et tests e2e du gratuit NL

**Files :**
- Create : `nl-workflow/build/nl_workflow_id.txt`, `nl-workflow/build/nl_test_jobs.txt`
- Modify : `nl-workflow/run_tests_nl.py` (5 profils NL : C1-C3 Correction avec durées `6-12 maanden`, `1-3 jaar`, `> 3 jaar` ; S1-S2 Stabilisation ; plaintes et produits rédigés en néerlandais ; `lang=nl`, `country=NL`/`BE`, mail `contact@adermio.com`, `info_suppl='TEST INTERNE NL — negeren'`)

- [ ] **Step 1 :** POST de `build/nl_workflow.json` (workflow inactif), id écrit dans `nl_workflow_id.txt`, puis activation (`POST /workflows/{id}/activate`). Relire : 57 nœuds, webhook `analyse-gratuite-nl-web`, actif.
- [ ] **Step 2 :** Run : `python3 run_tests_nl.py`. Attendre la fin des exécutions avec `wait_exec.py`.
- [ ] **Step 3 :** pour chaque job, vérifier (MCP SQL + `report_text.py`) :
  - `free_analysis.lang = 'nl'` ;
  - la session Stripe porte `metadata.lang = nl`, `success_url` commence par `https://adermio.com/nl/success`, prix `PRICE_NL` ;
  - le texte du rapport (page 1 + page 2) passe les détecteurs de `qa_nl.py` (0 FR/EN/DE, 0 « u/uw », 0 interdit) ;
  - aucune chaîne `undefined`, `null` ou `NaN` dans le rapport.
  Expected : 5/5.
- [ ] **Step 4 :** cas limites : un payload sans zone (`Aucune zone spécifique`) et un payload sans visage (photo de main). Expected : message néerlandais prévu par le FR (pas de crash, pas de FR).
- [ ] **Step 5 :** supprimer les lignes de test (`free_analysis`, `web_form_funnel` éventuelles, `jobId like 'job_nltest_%'`) après accord d'Antoine sur la liste affichée.
- [ ] **Step 6 :** commit de l'outillage et des preuves (`build/exec_*_report.html` exclus si > 1 Mo).

### Task 7 : Page `free-analysis` en néerlandais

**Files :**
- Modify : `adermio-site/free-analysis.html` (objet `UX` : entrée `nl` ; ligne 153 : `["it","es"]` → `["it","es","de","nl"]` si l'entrée `de` n'y est pas déjà)

- [ ] **Step 1 :** lire `UX.de` et `UX.en`, puis écrire `UX.nl` : `title`, texte d'erreur, `href: "https://adermio.com/nl/form"`, dans le registre « je ».
- [ ] **Step 2 :** vérifier dans le navigateur intégré, sur `https://adermio.com/free-analysis?lang=nl&jobId=inexistant` (après déploiement) : textes néerlandais, lien vers `/nl/form`, `document.documentElement.lang == 'nl'`.
- [ ] **Step 3 :** non-régression : `?lang=fr`, `?lang=de`, `?lang=xx` (→ anglais) inchangés.
- [ ] **Step 4 :** commit, puis push du site.

---

## Lot C — Payant NL + aiguillage

### Task 8 : Outillage `nl-workflow-paid` (échafaudage)

**Files :**
- Create (copies adaptées de `de-workflow-paid/`) : `build_paid_nl.py`, `audit_paid_nl.py`, `compare_fr_nl.py`, `check_table.py`, `deploy_create_nl.py`, `deploy_put_nl.py`, `dispatcher_add_nl.py`, `create_free_nl_tests.py`, `test_paid_nl.py`, `test_dispatcher_nl.py`, `test_audit_nl.py`, `test_compare_nl.py`, `patch_local.mjs` (option `--lang=nl`), `explain_diff.py`
- Create : `backups/knYCq6L4eBlulcbK_20260903.json` (copie), `tr_paid_nl/*.py` pré-remplies (NL = `None`), `prompts_nl/` (vide)

**Interfaces :**
- Produces : `build/nl_paid_workflow.json`, `build/nl_paid_patched_local.json`, `WEBHOOK='paid-nl'`, `NAME='Analyse Payante Néerlandais'`.

- [ ] **Step 1 :** copier et remplacer `de` → `nl` dans les **mécaniques** de `build_paid_nl.py`.
  - Garder les remplacements vers `EN` pour les edge functions, comme l'allemand : `tab-routine` `lang: 'fr'` → `lang: 'nl'` ; `suivi_evo*`, `products_search`, `tab-food` : `'FR'` → `'EN'`.
  - Mettre `<html lang="nl">` et les URL `/nl/premium`, `/nl/bilan`.
  - Retirer l'arête `Code in JavaScript14 → envoie_feedback`.
  - `test_paid_nl.py` : option `--no-name` qui met `customer_details.name = null` dans l'événement simulé (Review Focus 1) ; préfixe des jobs `job_nltest_paid_`.
- [ ] **Step 2 :** ajouter à `patch_local.mjs` la retouche du 07/10 (nom Stripe nul) : reprendre le corps de `Code in JavaScript7` du payant DE **en ligne** (seule différence connue entre l'outil DE et la prod DE). `compare_fr_nl.py` doit la classer en MOTEUR/CODE justifié.
- [ ] **Step 3 : test d'échec attendu.** `python3 build_paid_nl.py` → `NON TRADUIT` sur chaque table, rien écrit.
- [ ] **Step 4 : contre-épreuves.** `python3 test_compare_nl.py` et `python3 test_audit_nl.py` sur un build DE renommé : chaque défaut injecté (seuil modifié, condition inversée, littéral vidé, champ renommé, nœud ou connexion supprimés, credential changé) doit être détecté.
- [ ] **Step 5 :** commit.

### Task 9 : Traduction du payant

**Files :**
- Modify : `nl-workflow-paid/tr_paid_nl/*.py` (≈ 21 tables de nœuds Set, `code.py`, `mails.py`), `prompts_nl/message_a_model1.txt`, `message_a_model2.txt`
- Create : `nl-workflow-paid/BRIEF_PAYANT_NL.md`, `GLOSSAIRE_PAYANT_NL.md` (= glossaire Task 1 + termes du payant)

- [ ] **Step 1 :** traduire par sous-agents, un par groupe de tables (gabarits du rapport, code, 3 mails, prompts). Brief obligatoire :
  - **ne jamais traduire** les mots-clés qui lisent la base (`c.includes('grossesse'|'aspirine'|'parfum'|'arachide'…)`) ;
  - accorder les libellés générés (de/het) ;
  - virgule décimale ;
  - « je » partout, même dans les mails.
- [ ] **Step 2 : test de sécurité.** `grep -c "includes('grossesse')\|includes('aspirine')\|includes('parfum')\|includes('arachide')"` sur le `jsCode` de `Code in JavaScript23` du build NL = même compte que le FR.
- [ ] **Step 3 :** Run : `python3 build_paid_nl.py && node patch_local.mjs --lang=nl build/nl_paid_workflow.json build/nl_paid_patched_local.json && python3 audit_paid_nl.py build/nl_paid_patched_local.json && python3 compare_fr_nl.py build/nl_paid_patched_local.json`. Expected : audit OK ; compare **`NON JUSTIFIÉ : 0`**.
- [ ] **Step 4 :** commit.

### Task 10 : Déploiement payant, branche de l'aiguillage, tests e2e

**Files :**
- Create : `nl-workflow-paid/build/nl_paid_workflow_id.txt`, `backups/dispatcher_bmh94sW7xkqA6ar9_avant_nl_<horodatage>.json`

- [ ] **Step 1 :** `python3 deploy_create_nl.py` (POST, inactif), puis `python3 deploy_put_nl.py` (PUT de la version patchée, relecture identique au build), puis activation. Relire : 74 nœuds, webhook `paid-nl`, actif.
- [ ] **Step 2 :** `python3 dispatcher_add_nl.py` (sans `--deploy`) : sauvegarde, puis `If4` + `paid-nl` copies conformes de `If3`/`paid-de` (seuls `'de'` → `'nl'`, l'URL, les ids et les positions changent). Audit : les 10 nœuds existants sont identiques au JSON près, les connexions identiques sauf `If3[1]` (`paid-fr` → `If4`).
- [ ] **Step 3 :** `python3 dispatcher_add_nl.py --deploy`, puis relecture distante.
- [ ] **Step 4 :** `python3 create_free_nl_tests.py`. Il crée 2 gratuites NL : C3 (allergie parfum, *parfum*) et S2 (isotrétinoïne terminée).
- [ ] **Step 5 :** `python3 test_dispatcher_nl.py`. C'est un événement simulé, aucun paiement. Expected : exécution de l'aiguillage passée par `If4 → paid-nl`.
- [ ] **Step 6 : nom Stripe nul (Review Focus 1).** `python3 test_paid_nl.py <job C3> --no-name`, avec un événement où `customer_details.name = null`. Expected : PDF nommé avec le prénom du formulaire et mail envoyé.
- [ ] **Step 7 :** pour C3 et S2, vérifier :
  - `paid_reports.lang='nl'` et `premium_analysis.downloadUrl` qui commence par `https://adermio.com/nl/premium?token=` ;
  - les 3 mails reçus sur contact@adermio.com sont en néerlandais ;
  - le texte du rapport et du PDF passe les détecteurs `qa_nl` ;
  - l'allergie au parfum bloque bien les produits parfumés ;
  - **textes produits en anglais, jamais en français** (Review Focus 4).
- [ ] **Step 8 :** nettoyage des lignes `job_nltest_paid_%`, liste affichée et accord d'Antoine.
- [ ] **Step 9 :** commit.

---

## Lot D — Branche NL de l'ajustement de routine

### Task 11 : Cartographie et outil `nl-routine`

**Files :**
- Create : `adermio-free-report/nl-routine/fetch_routine.py`, `map_branches.py`, `build_routine_nl.py`, `audit_routine_nl.py`, `test_audit_routine_nl.py`, `tr_routine/*.py`, `backups/routine_ftMYrSp0SRz8fNH8_<horodatage>.json`, `CARTOGRAPHIE.md`

**Interfaces :**
- Produces : `build/routine_with_nl.json` = workflow en ligne + 25 nœuds NL (suffixe ` NL` ajouté à chaque nom ; positions décalées de +1600 px en y) + nœud `If NL` (copie conforme de `If`, valeur `nl`).
  - Connexions : `If[1]` : `Code in JavaScript3` → `If NL` ; `If NL[0]` → `Code in JavaScript NL` ; `If NL[1]` → `Code in JavaScript3`.

- [ ] **Step 1 :** `fetch_routine.py` : GET et sauvegarde horodatée.
- [ ] **Step 2 :** `map_branches.py` : apparier chaque nœud de la branche EN à son jumeau FR (`Code in JavaScript3`↔`Code in JavaScript`, `Code in JavaScript13`↔`Code in JavaScript12`, `tab-routine1`↔`tab-routine`, … `assemblage1`↔`assemblage`, `Upload a file1`↔`Upload a file`, `Update a row3/4/6`↔`Update a row1/2/5`).
  - Comparer le **squelette** (code sans chaînes ni commentaires, HTML sans texte) de chaque paire, et écrire `CARTOGRAPHIE.md`.
  - Règle : nœud NL = **paramètres du jumeau FR** traduits, sauf écart de squelette FR/EN, à documenter et trancher dans `CARTOGRAPHIE.md`. Exemple : `Stripe - Create Checkout Session` et `section_upgrade` n'existent que côté FR, donc non repris.
- [ ] **Step 3 :** `build_routine_nl.py` : construit `build/routine_with_nl.json` à partir de la sauvegarde, des tables `tr_routine/` (pré-remplies FR, NL = `None` → refus) et des mécaniques `lang: 'fr'` → `lang: 'nl'`, `<html lang="fr">` → `<html lang="nl">`. Les appels `Skin Engine` gardent `lang` de la ligne (`nl`, repli anglais côté moteur).
- [ ] **Step 4 : audit (test d'abord).** `audit_routine_nl.py` échoue si :
  - un nœud préexistant diffère d'un octet ;
  - une connexion préexistante change, hors `If[1]` ;
  - un nœud NL a un squelette différent de son jumeau FR, hors écarts listés ;
  - un nœud NL contient un résidu FR/EN/DE ou « u/uw » ;
  - un JS est invalide.
  `test_audit_routine_nl.py` injecte chacun de ces défauts et exige l'échec.
- [ ] **Step 5 :** commit.

### Task 12 : Traduction de la branche NL

**Files :**
- Modify : `nl-routine/tr_routine/*.py` (onglet routine ~107 k, escalade `Code in JavaScript12` ~35 k, prompt Gemini `Message a model` ~10 k, `assemblage` ~24 k, `tab-old-routine`, `tab-recap`, `Code in JavaScript11`, `Code in JavaScript15`)

- [ ] **Step 1 :** traduction par sous-agents (même brief que Task 9, avec en plus : le prompt Gemini demande la sortie en néerlandais « je »).
- [ ] **Step 2 :** `python3 build_routine_nl.py && python3 audit_routine_nl.py`. Expected : `OK`, 0 écart sur les nœuds préexistants, 0 résidu.
- [ ] **Step 3 :** commit.

### Task 13 : Déploiement de la routine et non-régression

- [ ] **Step 1 :** nouvelle sauvegarde juste avant le PUT (l'en ligne a pu changer depuis la Task 11). Si le JSON préexistant diffère de celui de la Task 11 : **s'arrêter**, refaire la Task 11 à partir de la nouvelle version.
- [ ] **Step 2 :** PUT de `build/routine_with_nl.json`, relecture distante identique au build, workflow toujours actif.
- [ ] **Step 3 :** e2e NL : sur le job de test C3 (Task 10), appeler `/webhook/routine` avec le corps exact envoyé par `/nl/premium` (lire `nl/premium.html`, `URL_SUBMIT_ROUTINE`). Suivre avec `job-status-routine`. Expected : page de routine néerlandaise, 0 résidu `qa_nl`.
- [ ] **Step 4 :** textes produits de l'ajustement en anglais, jamais en français (Review Focus 4).
- [ ] **Step 5 : non-régression.** Un job de test FR et un EN, créés par un événement simulé sur `paid-fr` / `paid-en`, avec le mail `contact@adermio.com`. Expected : passage par la branche FR / EN d'origine (lecture de `runData`), page générée dans la bonne langue.
- [ ] **Step 6 :** retour arrière documenté et testé à sec : `PUT` de la sauvegarde (commande écrite dans `nl-routine/README.md`).
- [ ] **Step 7 :** nettoyage des lignes de test, liste affichée et accord d'Antoine ; commit.

---

## Lot E — Relecture native

### Task 14 : Relecture des textes générés et du rendu

**Files :**
- Create : `nl-workflow/revue/R*_*.md`, `R*_corrections.py` (même format que `adermio-site/tests/i18n/nl/revue/`)

- [ ] **Step 1 :** 4 relecteurs agents sur les sorties réelles des Tasks 6, 10 et 13 :
  - rapports gratuits C et S ;
  - rapport complet et PDF ;
  - 3 mails ;
  - page de routine.
  Rôles : naturel du texte, terminologie et conformité, microcopie, retraduction à l'aveugle NL→FR. Corrections au format machine.
- [ ] **Step 2 :** appliquer via les tables (gratuit, payant, routine), rebuild, audits, PUT ciblés, puis rejouer 1 gratuit et 1 payant de test.
- [ ] **Step 3 : rendu (Review Focus 5).** Rapport gratuit et premium à 360 px (navigateur intégré) et PDF A4 : aucune tuile, aucun badge, aucun titre qui déborde.
- [ ] **Step 4 :** chat du rapport complet : sur `/nl/premium?token=<test>`, poser 2 questions en néerlandais. Noter la langue des réponses ; si ce n'est pas le néerlandais, l'écrire dans le rapport à Antoine (serveur hors GitHub).
- [ ] **Step 5 :** commit.

---

## Lot F — Ouverture

### Task 15 : iDEAL + Bancontact

- [ ] **Step 1 :** donner à Antoine le chemin exact, et c'est lui qui agit : Stripe Dashboard → Paramètres → Paiements → Moyens de paiement → activer **iDEAL** et **Bancontact**.
- [ ] **Step 2 :** vérifier : lancer un gratuit NL de test (Task 6), ouvrir l'URL de la session Checkout dans le navigateur intégré, avec un en-tête `Accept-Language: nl`. Expected : iDEAL (et Bancontact si pays BE) proposés. Ne **pas** payer.
- [ ] **Step 3 :** nettoyer le job de test.

### Task 16 : Vrai paiement d'Antoine

- [ ] **Step 1 :** Antoine fait `/nl/form` avec ses photos, puis paie **en iDEAL** (Review Focus 3).
- [ ] **Step 2 :** vérifier :
  - aiguillage `If4 → paid-nl` ;
  - rapport et PDF ;
  - 3 mails en néerlandais ;
  - ajustement de routine NL depuis `/nl/premium` ;
  - ligne `web_checkout` (moyen de paiement `ideal`).
- [ ] **Step 3 :** remboursement fait par Antoine dans le tableau de bord, ou par Claude avec son accord explicite.

### Task 17 : Exposition publique

**Files :**
- Create : `adermio-site/tests/i18n/nl/expose_nl.py` (copie adaptée de `tests/i18n/de/expose_de.py`)
- Modify : pages FR/EN/ES/IT/DE jumelles (hreflang `nl` + entrée « Nederlands » du sélecteur), `sitemap.xml` (13 URL `/nl/`, alternates via `tests/i18n/fix_sitemap_hreflang.py` qui doit connaître `nl`), `js/ttq.js` (`/nl/form` dans `FORM_PAGES` + `content_name` « Gratis Adermio-huidanalyse »), `vercel.json` (retrait du bloc noindex `/nl/(.*)`), `tests/i18n/de/prep_de.py` et `tests/i18n/prep_it.py` (entrée « Nederlands » dans `rebuild_dropdown`, sinon perdue au prochain rebuild : piège de l'allemand), `tests/i18n/nl/prep_nl.py` (rien : le NL liste déjà les autres langues)

- [ ] **Step 1 : test d'abord.** `python3 tests/i18n/nl/expose_nl.py --check` échoue : NL non exposé.
- [ ] **Step 2 :** écrire et lancer `expose_nl.py` (idempotent), puis `fix_sitemap_hreflang.py`. Contrôle : chaque entrée du sitemap s'auto-référence, et chaque `href` d'alternate existe comme `<loc>`.
- [ ] **Step 3 :** `build_de.py --check`, `build_nl.py --check` et la reconstruction IT doivent rester identiques (selon le cas, après mise à jour de leurs `rebuild_dropdown`).
- [ ] **Step 4 :** retrait du noindex, commit, push, puis contrôle en ligne : `/nl/home` sans `x-robots-tag`, sélecteur « Nederlands » visible sur `/`, `/de/home` et `/it/home`, sitemap valide.

### Task 18 : Mesure des premiers jours et mémoire

- [ ] **Step 1 :** chaque jour, pendant 3 jours :
  - `free_analysis` `lang='nl'` par jour et par pays (NL/BE) et conversion ;
  - `web_checkout` NL (moyen de paiement, échecs) ;
  - entonnoir `web_form_funnel` `path='/nl/form'` ;
  - relecture de 5 rapports réels.
- [ ] **Step 2 :** mettre à jour la mémoire (`adermio-site-neerlandais-chantier.md`) : ids des workflows, prix, état, pièges.
