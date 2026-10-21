# Site Adermio en portugais puis en tchèque — plan d'action (21/10/2026)

Modèle : le polonais (site 14/10, n8n 14/10, Nolla v2 18/10, bascule 19/10).
Ordre voulu par Antoine : **portugais d'abord, tchèque ensuite ; le site, puis les workflows n8n.**
Codes : `pt` et `cs` (adresses `/pt/…` et `/cs/…`).

## 0. Décisions d'Antoine (avant la première ligne)

| # | Question | Ma recommandation |
|---|---|---|
| 1 | Portugais du Portugal ou du Brésil ? | **Portugal (pt-PT)** : euro, UE, CGV et RGPD déjà valables, Stripe prêt. Le Brésil = réal, fiscalité locale, autre vocabulaire : chantier à part. |
| 2 | Registre PT | Vouvoiement neutre : 3e personne sans pronom (« o seu », « a sua pele »), jamais « tu ». Équivalent du « vous » FR. |
| 3 | Registre CS | **« vy »** (vykání), sans forme genrée adressée au visiteur (même règle que le polonais : pas de passé genré « udělal/a »). |
| 4 | Prix analyse complète | PT : **5,99 €** (= FR/ES). CS : **149 Kč TTC** (≈ 5,9 €). Nouveau prix Stripe = votre accord. |
| 5 | Moyens de paiement locaux | PT : **MB WAY + Multibanco** (à activer par vous dans Stripe, comme BLIK). CS : carte + Apple/Google Pay suffisent. |
| 6 | Écrans de l'app sur l'accueil | L'app n'existe pas en PT/CS. Comme PL : écrans traduits au pixel si vous comptez traduire l'app ; sinon écrans EN. |
| 7 | Vidéo | EN avec la mention « vídeo em inglês » / « video v angličtině » (comme PL/DE). |
| 8 | Adresses traduites | Oui, comme PL (sobre-nos, contacto, termos…, puis o-nas, kontakt…). |

Toute décision est écrite dans la section « Décisions du client » du glossaire (sinon un relecteur l'annule — leçon italienne).

## 1. Portugais — site

**1a. Glossaire + brief** — `adermio-site/tests/i18n/pt/GLOSSAIRE_PT.md` et `BRIEF_TRADUCTEUR_PT.md` : registre, zéro vocabulaire médical (« análise », jamais « diagnóstico »), types de peau, gravités, libellés repris de l'app FR, marqueurs pt-BR interdits (« você », « tela », « celular », gérondif « estou fazendo »).

**1b. Mémoire de traduction unique** — outillage cloné de `tests/i18n/pl/` : `prep_pt` → tables `tr_pt/` → `apply_tr_pt` → `qa_pt` (résidus FR, segment identique au FR, marqueurs pt-BR, registre, prix, majuscules) + `test_qa_pt` (contre-épreuve : injection de français détectée) → `build_pt --check`. Jamais d'édition à la main des HTML.

**1c. Traduction** — sous-agents traducteurs par lots de pages, puis 3 relecteurs natifs indépendants (faux amis, calques, allégations). Objectif ≥ 9,5/10 comme PL.

**1d. Pages encore à l'ancien design** (alimentées par la même mémoire) : form, processing, processing2, success, premium, premium-second-cycle, bilan, second-cycle, feedback, cancelar-subscrição (construite, jamais liée). Bandeau/code app coupés (`appDispo()` : pt et cs ajoutés à la liste sans app).

**1e. Site Nolla v2** — `output/site-v2/builders/` : `build_home_pt.py`, `build_v2_pt.py`, `build_flow_pt.py`, `textes_attente_pt.py`, `ecrans_pt.py` (si décision 6 = traduits). Les générateurs lisent `source-v1/` (cf. LISEZMOI-BASCULE.md). `bascule_v2.py` : ajouter pt (SEO généré puisque pas d'ancienne page). Police : rien à faire (lettres PT dans `latin`, CS dans `latin-ext` — vérifié : ě š č ř ž ů ď ť ň sont dans U+100–17F).

**1f. Contrôles** — audit WebKit (0 erreur), téléphone, liens internes, pas un mot FR. **Aperçu montré à Antoine avant mise en ligne** (règle « maquette avant publication »).

**1g. Mise en ligne cachée** — pages `/pt/` en noindex, 0 lien entrant, tant que n8n n'est pas prêt (sinon le formulaire tombe dans le vide).

## 2. Portugais — n8n (les 2-3 workflows)

1. **Prix Stripe** 5,99 € « Análise completa Adermio » (votre accord) ; MB WAY/Multibanco (vous).
2. **Gratuit** `analyse-gratuite-pt-web` : clone miroir du FR v1 (comme PL), + patch web-health-free (`WEB_LANGS += pt` dans skin-engine-web, secret jamais dans un fichier). Outillage `adermio-free-report/pt-workflow/` cloné de `pl-workflow/` : build, garde-résidus, simulate, `run_tests_pt` (jobs `job_pttest_`).
3. **Payant** `paid-pt` : miroir du FR, `compare_fr_pt` → NON JUSTIFIÉ = 0 ; mots-clés lus en BDD (grossesse/aspirine/parfum) **restent FR** (bug de sécurité italien) ; encart code app en `return '';`. Aiguillage `bmh94sW7` : nouvelle branche `lang=pt → paid-pt` (sauvegarde avant).
4. **Edges** : `templates.ts` pt dans skin-analysis-ai (redéploiement = votre accord), LABELS/MARKERS pt dans skin-engine.
5. **Routine** : branche anglaise suffit (même décision que PL), à confirmer.
6. **Tests e2e** : gratuit (10 profils dont grossesse, sans visage), paiement simulé → rapport premium 100 % portugais, PDF, mail. Puis **nettoyage** des `job_pttest_%`.

## 3. Portugais — ouverture (sur le « go » d.Antoine)

`expose_pt.py` idempotent : « Português » dans le sélecteur de toutes les pages des 9 langues, hreflang, JSON-LD, sitemap, pixel TikTok, lang-suggest (navigateur pt → /pt), retrait du noindex. Vrai paiement de contrôle. ⚠️ Relancer `expose_pl.py` et `expose_pt.py` après toute reconstruction d'une autre langue.

Mesure ensuite par jour : web_form_funnel, `free_analysis.lang='pt'`, paiements.

## 4. Tchèque — même chaîne, clonée du polonais

Le tchèque est grammaticalement proche du polonais : on clone **l'outillage PL** (pas le PT).
- Pluriel à 3 formes (1 / 2-4 / 5+) : `csPlural` copié de `plPlural`.
- Détecteurs `qa_cs` : formes genrées adressées au visiteur, registre « ty », résidus FR, résidus polonais (refus CS == PL), diacritiques manquantes (texte sans háček = suspect).
- Prix 149 Kč (votre accord), Stripe en CZK.
- Étapes identiques : 1a→1g, 2.1→2.6, 3.

## Hors périmètre (comme PL, plus tard sur décision d.Antoine)

Moteur de sécurité en texte libre (gravidez / těhotenství), branche routine native, J28 / 2e cycle (aujourd'hui `create-checkout-session` traite les langues nouvelles comme fr), support_inbox PT/CS, app traduite.

## Ce que je ne fais jamais sans ordre d.Antoine

Créer un prix Stripe, redéployer une edge, activer un workflow sur le dispatcher de prod, ouvrir le site au public, toute OTA.

## Décisions validées (21/10, « OK pour tout ton plan… GO »)

Portugais du Portugal (pt-PT), vouvoiement neutre sans pronom, 5,99 €, MB WAY + Multibanco (Antoine), CS = « vy » sans genre, 149 Kč, vidéo EN, adresses traduites, écrans de l'app traduits au pixel (comme PL).

## Tchèque — plan d'exécution (21/10 soir, « même principe, site seul puis retour à Antoine »)

Décisions reprises du plan validé : registre **« vy »** (vykání) en minuscules hors début de phrase, **aucune forme genrée
adressée au visiteur** (le passé tchèque s'accorde au genre même au vouvoiement : *udělal/a jste* interdit ; présent, noms,
impersonnel, 1re personne du pluriel côté Adermio), **149 Kč**, zéro langage médical (*diagnóza, pacient, terapie, klinický,
léčit/léčba* côté Adermio interdits), vidéo EN « (video v angličtině) », écrans de l'app traduits au pixel (comme PL/PT),
adresses traduites, html lang="cs", hreflang « cs ». Typographie : „…“, pas d'espace avant ! ? : ;, virgule décimale,
« 98 % », dates « 21. října 2026 », pluriel 1 / 2–4 / 5+.

1. Glossaire GLOSSAIRE_CS.md + brief + outillage `tests/i18n/cs/` cloné du portugais (architecture post-bascule : sources dans
   source-v1/cs, pages de parcours dans cs/) avec les détecteurs slaves du polonais (genre au passé, pluriels, registre,
   diacritiques manquants, résidus FR/EN/PL/PT/SK).
2. 24 pages traduites (8 traducteurs), 3 relecteurs natifs, cohérence entre pages.
3. Nouveau site : build_{v2,flow,home}_cs.py, textes_attente_cs.py, ecrans_cs.py ; police latin-ext pour cs (bascule_v2.font_head).
4. seo_cs + bascule_v2, noindex `/cs/(.*)`, push caché ; webhooks figés `analyse-gratuite-cs-web`, `second-cycle-cs`.
5. Audit : QA à 0, reconstruction identique, liens, JS, rendu navigateur 390/1280 px, relecture du nouveau site.
Hors périmètre de cette étape (après accord d'Antoine) : Stripe 149 CZK, n8n gratuit/payant/aiguillage, ouverture, lang-suggest CZ.
