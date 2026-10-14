# Site Adermio en polonais (`/pl/`) — design

Date : 14/10/2026 · Mandat : Antoine (« traduire mon site seulement en polonais », périmètre « tout, ouvert au public »).
Modèle : le grec (11/10/2026), dont on clone l'outillage et l'ordre des étapes. L'app n'est pas traduite.

## 1. Objectif et critère de réussite

Un visiteur polonais arrive sur adermio.com/pl/, remplit le questionnaire, reçoit son analyse gratuite en polonais,
paie **24,99 zł** (BLIK ou carte), reçoit son rapport complet, son mail et son ajustement de routine en polonais. Le moteur
de sécurité comprend la grossesse, l'allaitement, l'isotrétinoïne et les allergies écrites en polonais.

Point de départ mesuré le 14/10 : 13 analyses web depuis la Pologne en 90 jours (9 sur /en), 1 paiement, 1 compte app.
C'est un marché à ouvrir, pas une clientèle existante à rattraper.

## 2. Décisions

| Sujet | Décision | Qui |
|---|---|---|
| Périmètre | Chaîne complète puis ouverture publique | Antoine |
| Prix | **24,99 zł TTC** (TVA PL 23 % via `automatic_tax`), achat unique, BLIK + carte | Antoine |
| Registre | « ty » (tutoiement, usage des marques de soin PL), possessifs en minuscules | Claude |
| Genre | **Aucune forme marquée en genre adressée à l'utilisateur** : jamais de passé à la 2e personne (`-łaś/-łeś`), jamais d'adjectif attribut (`gotowa/gotowy`, `pewna/pewny`). Présent, futur, infinitif, noms, « masz za sobą … » | Claude |
| Vocabulaire interdit | `diagnoza` (même nié), `dermatolog` pour nous, `kliniczn-`, `leczenie` pour désigner nos produits | Claude (règle « zéro langage médical ») |
| Code langue | `pl`, `og:locale pl_PL`, drapeau `pl`, libellé « Polski » | Claude |
| Visuels | Captures et vidéo en anglais, annoncées comme telles | Claude (comme EL/DE/NL) |
| Polices | Inchangées (DM Sans, Playfair, Inter couvrent ą ę ł ś ź ż ć ń ó) | Claude |
| Commits | Messages en ASCII seulement (Vercel `git_info_fail` vu avec le grec) | Claude |

### Adresses des pages (jeu de pages du grec au 14/10 : 19 pages + blog 5)

| Grec | Polonais |
|---|---|
| `schetika-me-emas` | `o-nas` |
| `epikoinonia` | `kontakt` |
| `oroi-chrisis` | `regulamin` |
| `oroi-polisis` (CGV) | `warunki-sprzedazy` |
| `politiki-aporritou` | `polityka-prywatnosci` |
| `nomikes-plirofories` | `informacje-prawne` |
| `piges` | `zrodla` |
| `akyrosi-syndromis` | `anuluj-subskrypcje` |
| blog `typos-epidermidas` | `typ-skory` |
| blog `giati-vgazoume-akmi` | `skad-sie-bierze-tradzik` |
| blog `ormoniki-akmi` | `tradzik-hormonalny` |
| blog `pou-emfanizetai-akmi` | `gdzie-pojawia-sie-tradzik` |

Pages de parcours : mêmes noms que les autres langues (`home`, `form`, `success`, `premium`, `premium-second-cycle`,
`second-cycle`, `bilan`, `processing`, `processing2`, `analysis-in-progress-second-cycle`, `feedback`, `blog/index`).
`vercel.json` : `/pl` et `/pl/` → `/pl/home`, `/pl/cgv` → `/pl/warunki-sprzedazy`, `X-Robots-Tag: noindex` sur `/pl/*` jusqu'à l'ouverture.

### Amorce de glossaire (`tests/i18n/pl/GLOSSAIRE_PL.md`, à compléter par les traducteurs)

analyse gratuite = darmowa analiza · analyse complète = pełna analiza · acné = trądzik · imperfections = niedoskonałości ·
points noirs = zaskórniki otwarte · points blancs = zaskórniki zamknięte · papules = grudki · pustules = krosty ·
kystes = torbiele · marques = przebarwienia potrądzikowe · rougeurs = zaczerwienienia · peau grasse / mixte / sèche /
sensible = skóra tłusta / mieszana / sucha / wrażliwa · routine = rutyna pielęgnacyjna · crème solaire = krem z filtrem
(SPF) · bilan J28 = „Bilans po 28 dniach” · second cycle = druga runda · Point Repère = „Punkt Odniesienia” ·
grossesse = ciąża · allaitement = karmienie piersią. Toute décision d'Antoine est écrite dans la section « Décisions du
client » du glossaire (leçon italienne : un relecteur a annulé une décision absente du glossaire).

## 3. Architecture (cinq étages, comme le grec)

### 3.1 Site statique — `adermio-site/tests/i18n/pl/`
Clone de `tests/i18n/el/` : `prep_pl.py` (squelette mécanique FR → PL, webhook **épinglé** `analyse-gratuite-pl-web`,
jamais déduit du FR) → tables `tr_pl/*.py` (semées par `seed_from_el.py`, colonne FR seulement) → `apply_tr_pl.py`
(refuse une entrée vide) → `qa_pl.py` → `build_pl.py --check` (reconstruction à l'octet) + `jscheck_pl.py` +
`coherence_pl.py`. On n'édite jamais `pl/*.html` à la main.

Adaptations par rapport au grec :
- pas de remplacement de polices ni de retrait d'accents en capitales (spécifique au grec) ;
- `qa_pl.py` : résidus FR/EN (mots-outils), **formes genrées adressées à l'utilisateur** (`\w+łaś\b`, `\w+łeś\b`,
  `gotow[ay]\b`, `pewn[ay]\b`, `zadowolon[ya]\b`… allowlist motivée), vocabulaire interdit, `€` ou `5,99` résiduels,
  notation « 24,99 zł » avec espace insécable ; prouvé par contre-épreuve (injection de chaque défaut détectée) ;
- `facescan.js`, `free-analysis.html`, `js/lang-suggest.js` : entrée `pl` (ce dernier seulement à l'ouverture).

Traduction : 6 sous-agents par lots (accueil / parcours / payant / juridique / blog ×2), brief `BRIEF_TRADUCTEUR_PL.md`.

### 3.2 Stripe
- Produit « Pełna analiza Adermio », prix **24,99 PLN** TTC, créé par Claude **avec l'accord explicite d'Antoine au
  moment de la création** ; identifiant noté dans `adermio-free-report/pl-workflow/stripe_price_pl.txt`.
- Le nœud « Stripe - Create Checkout Session » n'impose pas `payment_method_types` : BLIK apparaît dès qu'il est actif
  sur le compte et que la devise est PLN. **Activation BLIK = Antoine, dans le tableau de bord Stripe.** Pas de `locale`
  imposée : Checkout s'affiche en polonais selon le navigateur.

### 3.3 n8n
- **Gratuit** « Analyse Gratuite Polonais web », webhook `analyse-gratuite-pl-web`, miroir du grec `XrvS5YNs3rMPzYMb`
  (lui-même miroir du FR v1). Outillage `adermio-free-report/pl-workflow/` cloné de `el-workflow/` (build / audit /
  simulate / qa_report / run_tests / deploy, tables `tr/`, `prompts_pl/`, `GLOSSAIRE_WORKFLOW_PL.md`).
  Adaptations : `zonePL`, virgule décimale, `analysis_results_pl`, **fonction `plPlural(n, one, few, many)`** pour
  tout nombre affiché (1 zmiana / 2–4 zmiany / 0, 5+ et 12–14 zmian), « une seule lésion » accordé au genre polonais.
- **Payant** « Analyse Payante Polonais », webhook `paid-pl`, miroir du grec `D9NiS1ECypCBhF48` ; outillage
  `adermio-free-report/pl-workflow-paid/`, comparaison FR ↔ PL « NON JUSTIFIÉ = 0 ». Dans un nœud de code, ce qui lit
  la base (tags `contraindications` en FR canonique) n'est jamais traduit.
- **Aiguillage** `bmh94sW7xkqA6ar9` : `If6 lang=pl → paid-pl` sur la sortie « faux » de `If5` (grec), sauvegarde avant
  modification. Branché **avant** toute ouverture (sinon un paiement polonais reçoit le rapport FR).
- **Routine** `ftMYrSp0SRz8fNH8` : nœuds « … PL » + `If PL` après `If EL`, le reste à l'octet ; outillage
  `adermio-free-report/pl-routine/` avec README de retour arrière et sauvegarde sans nœuds PL.

### 3.4 Moteur de sécurité — `adermio-app`
- Vocabulaire polonais dans des fichiers propres au polonais, lu **seulement si `lang = pl`** : grossesse (`ciąż-`),
  allaitement (`karmi- piersią`, `karmienie piersią`), isotrétinoïne (`izotretynoin-`, Aknenormin, Izotek, Curacne),
  allergies. Recherche par **racines** (déclinaisons : ciąża / ciąży / ciążę / ciążą).
- Règles du grec : jamais d'inférence d'arrêt d'un traitement ; une négation ne compte que si elle est la réponse entière.
- `catalog.ts` n'est pas modifié (sinon il faut redéployer les 5 `point-repere-v2-*` et publier une OTA). FACTS_VERSION
  intouché.
- Preuves : parité des autres langues = 0 écart sur le corpus de textes réels ; « jestem w ciąży », « karmię piersią »,
  « biorę Aknenormin » donnent le même `contextHash` que leur équivalent FR.
- Déploiement de `skin-engine` et `medication-recognize-ai` depuis un instantané `git archive` du commit, **avec l'accord
  d'Antoine**.

### 3.5 Ouverture
`tests/i18n/pl/expose_pl.py` (idempotent, cloné de `expose_el.py`) : « Polski » dans le sélecteur de toutes les pages
FR/EN/ES/IT/DE/NL/EL, `hreflang="pl"`, JSON-LD `availableLanguage`, sitemap (colonne `pl` de `fix_sitemap_hreflang.py`,
chaque entrée s'auto-référence), `js/ttq.js` FORM_PAGES `/pl/form`, `lang-suggest.js` (PL → /pl, « Kontynuuj po
polsku », choix mémorisé `adermio_lang_choice_pl`), retrait du `noindex`.

## 4. Ordre d'exécution

0. Antoine active BLIK ; Claude crée le prix PLN (accord au moment de créer).
1. Site `/pl/` en ligne **caché** (noindex, aucun lien entrant).
2. Gratuit n8n PL + entrée `pl` de `free-analysis.html`.
3. Moteur de sécurité PL + déploiement des 2 edges.
4. Payant PL + `If6`.
5. Routine `If PL`.
6. Tests de bout en bout (`job_pltest_*`), QA sur le rapport **réellement rendu** (onglets générés par JS), puis
   suppression des données de test (penser aux lignes `web_checkout` réinsérées par la synchro Stripe).
7. Vrai paiement BLIK d'Antoine sur le site encore caché (24,99 zł, puis remboursement). Si BLIK n'est pas encore actif :
   on ouvre avec la carte, BLIK apparaîtra sans changement de code.
8. Ouverture (`expose_pl.py`).

## 5. Tests et critères d'acceptation

- Site : `qa_pl` 24/24, `build_pl --check` identique, `jscheck` OK, 0 forme genrée, 0 résidu ; en ligne : 301 `/pl`,
  200 + `x-robots-tag: noindex` avant ouverture ; contrôle visuel mobile 375 px du questionnaire (le polonais est long).
- Gratuit : branches Correction + Stabilisation + sans visage, rapport 100 % polonais, `free_analysis.lang='pl'`,
  session Stripe en PLN à 24,99, `success_url=/pl/success`, `plPlural` testé sur 0, 1, 2, 4, 5, 12, 14, 22, 25.
- Payant : aiguillage `If5 → If6 → paid-pl`, `paid_reports.lang='pl'`, `/pl/premium?token=`, PDF, mail polonais accepté
  par le serveur d'envoi.
- Routine : un ajustement réel passe par `If PL` et revient en polonais.
- Moteur : critères du 3.4.
- Ouverture : « Polski » présent partout, sitemap valide (auto-référence + alternates existants), `noindex` absent.

## 6. Risques connus

- **Genre** : risque principal de la traduction ; couvert par la règle du §2 et le détecteur du `qa_pl`.
- **Pluriel à trois formes** : un nombre mal accordé se voit immédiatement ; couvert par `plPlural` + simulation.
- **Textes générés par les LLM** (Gemini/GPT) : consigne de registre et de neutralité de genre dans les prompts, non
  garantie ; relire quelques analyses réelles après l'ouverture.
- **Chiffre d'affaires** : les mesures existantes supposent l'euro ; les ventes PLN (`web_checkout.currency='pln'`)
  doivent être converties dans tout relevé.
- **Activation BLIK** : délai côté Stripe hors de notre contrôle.

## 7. Hors périmètre (même reste que le grec)

Suivi J28 `mBuObJE4LWp2E8QG`, `second-cycle-pl` (webhook inexistant, comme les autres langues récentes), langue `PL`
dans `support_inbox` et le capteur de langue des mails, chat ai.adermio.com, `skin-bilan-j28`, relecture par un natif
humain, points juridiques polonais (âge du consentement numérique 16 ans, cookies Clarity/TikTok, CGV) remontés à
Antoine sans être traités. L'app n'est pas traduite : un client web polonais qui passe sur l'app la voit en anglais
(repli anglais, jamais français).
