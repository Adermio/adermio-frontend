# Site polonais `/pl/` — plan du lot SITE

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** mettre en ligne adermio.com/pl/ (24 pages), 100 % en polonais, **caché** (noindex, aucun lien entrant), prêt
pour la prod ; il ne restera que n8n, Stripe, le moteur de sécurité et l'ouverture (spec §3.2 → §3.5).

**Architecture:** clone de l'outillage grec `tests/i18n/el/` dans `tests/i18n/pl/` : `prep_pl.py` fabrique le squelette
polonais depuis chaque page FR (balises, liens, sélecteur, webhooks réservés, `lang`), des tables `tr_pl/*.py`
(littéral FR exact → polonais) sont appliquées par `apply_tr_pl.py`, `qa_pl.py` contrôle (détecteurs écrits pour le
polonais, alphabet latin), `build_pl.py --check` prouve la reconstruction à l'octet. On n'édite jamais `pl/*.html`.

**Tech Stack:** Python 3 (scripts), HTML statique Vercel, `node --check` (JS inline), Git → Vercel.

**Spec:** `docs/superpowers/specs/2026-10-14-site-polonais-design.md`

## Global Constraints

- Registre « ty », possessifs et pronoms en minuscules hors début de phrase (`twój`, `ciebie`) ; jamais `Pan/Pani/Państwo`.
- **Aucune forme marquée en genre adressée à l'utilisateur** : ni `-łaś/-łeś/-łabyś/-łbyś`, ni attribut genré (`gotowa/gotowy`, `zadowolona/zadowolony`…), ni `Drogi/Droga`.
- Interdits côté Adermio : `diagnoz-`, `diagnost-`, `pacjent-`, `terapi-`, `terapeut-`, `klinicz-`, `klinik-`, `leczy-`, `wylecz-`, `lecznicz-` ; `dermatolog` jamais pour Adermio/AI.
- Prix de l'analyse complète : **24,99 zł** (`24,99&nbsp;zł` en HTML) ; budgets produits du rapport en euros (`< 60 €`), les produits étant vendus en euros.
- Typographie : guillemets „…”, aucune espace avant `! ? : ;`, virgule décimale, milliers à espace (`10 000`), « J28 » → « dzień 28 ».
- Captures et vidéo de l'accueil en anglais (comme EL/DE/NL).
- Webhooks réservés : `analyse-gratuite-pl-web`, `second-cycle-pl` (créés plus tard dans n8n).
- Messages de commit en ASCII seulement (Vercel `git_info_fail` sur caractères non ASCII).
- `git commit -- <chemins>` uniquement (index partagé entre sessions) ; jamais `git stash`.

## Review Focus

1. Une phrase polonaise **genrée au passé** (« Czy stosowałaś… ») glissée par un traducteur → doit être refusée par `qa_pl` (test dans Task 2).
2. Une phrase **française ou anglaise restée telle quelle** dans un attribut ou une chaîne JS (erreur du formulaire) → refusée (Task 2 : détecteurs FR/EN/« pas polonais » + identique au FR).
3. Polonais **sans diacritiques** (« skora », « sie ») → refusé (Task 2).
4. **Prix** en euros ou à l'ancien montant (5,99 / 4,99) sur une page polonaise, ou `ttq` CompletePayment en EUR → refusé (Task 2 + table `success`).
5. **Formulaire mobile** : libellés polonais plus longs qui cassent l'en-tête des photos (bug vu en italien) → contrôle visuel 375 px (Task 5).

---

### Task 1: Outillage polonais (squelette, application, build) + Vercel + free-analysis

**Files:**
- Create: `tests/i18n/pl/prep_pl.py`, `tests/i18n/pl/apply_tr_pl.py`, `tests/i18n/pl/build_pl.py`, `tests/i18n/pl/jscheck_pl.py`, `tests/i18n/pl/coherence_pl.py`, `tests/i18n/pl/seed_from_el.py`
- Modify: `vercel.json` (redirects + headers), `free-analysis.html` (entrée `pl`), spec §3.1 (facescan inutile)

**Interfaces:**
- Produces: `prep_pl.PAGES` (FR source → `(page PL, en, es, it, de, nl, el)`), `prep_pl.ROOT`, `prep_pl.clean(path)`,
  `prep_pl.transform(fr_rel) -> (pl_rel, notes)` ; `build_pl.TABLES` (page PL → nom de table) ; tables
  `tr_pl/<nom>.py` exposant `TARGET`, `TR = [(fr, pl[, n])]`, `REGEX = [(motif, remplacement)]`.

- [ ] **Step 1: `prep_pl.py`** — copie de `prep_el.py` avec ces différences exactes :
  - `PAGES` construit depuis `prep_el.PAGES` : jumeaux = 5 jumeaux grecs (en, es, it, de, nl) + page grecque nettoyée ; cible PL selon la table :
    ```python
    import prep_el
    PL_NAMES = {
        'index.html': 'pl/home.html', 'about.html': 'pl/o-nas.html', 'formulaire.html': 'pl/form.html',
        'contact.html': 'pl/kontakt.html', 'conditions.html': 'pl/regulamin.html',
        'confidentialite.html': 'pl/polityka-prywatnosci.html', 'mentions-legales.html': 'pl/informacje-prawne.html',
        'sources.html': 'pl/zrodla.html', 'feedback.html': 'pl/feedback.html', 'success.html': 'pl/success.html',
        'premium.html': 'pl/premium.html', 'premium-second-cycle.html': 'pl/premium-second-cycle.html',
        'second-cycle.html': 'pl/second-cycle.html', 'bilan.html': 'pl/bilan.html',
        'analyse-en-cours.html': 'pl/processing.html', 'analyse-en-cours2.html': 'pl/processing2.html',
        'analyse-en-cours-second-cycle.html': 'pl/analysis-in-progress-second-cycle.html',
        'blog/index.html': 'pl/blog/index.html',
        'blog/comment-connaitre-son-type-de-peau.html': 'pl/blog/typ-skory.html',
        'blog/pourquoi-a-t-on-de-l-acne.html': 'pl/blog/skad-sie-bierze-tradzik.html',
        'blog/acne-hormonale.html': 'pl/blog/tradzik-hormonalny.html',
        'blog/ou-apparait-l-acne.html': 'pl/blog/gdzie-pojawia-sie-tradzik.html',
        'cgv.html': 'pl/warunki-sprzedazy.html', 'resilier.html': 'pl/anuluj-subskrypcje.html',
    }
    PAGES = {fr: (PL_NAMES[fr], *v[1:], prep_el.clean(v[0])) for fr, v in prep_el.PAGES.items()}
    assert set(PAGES) == set(PL_NAMES)
    ```
  - `PL_FREE_WEBHOOK = 'analyse-gratuite-pl-web'`, `second-cycle-pl`, `lang: 'pl'`, `params.append("lang", "pl")`, `&lang=pl`.
  - `og:locale` → `pl_PL` ; `<html lang="pl"` ; hreflang `pl` ajouté avant `x-default`.
  - Sélecteur : entrée courante `('#', 'pl', 'Polski', True)` puis English, Español, Italiano, Deutsch, Nederlands,
    **Ελληνικά (drapeau `gr`)**, Français ; bouton `pl` / `PL` (`SEL_BTN` → `\1pl\2PL\3`, span `FR` → `PL`).
  - JSON-LD : `"Greek"]` → `"Greek", "Polish"]`, `"el"]` → `"el", "pl"]` (motifs FR actuels :
    `"availableLanguage": ["French", "English", "Spanish", "Italian", "German", "Dutch", "Greek"]` et
    `"inLanguage": ["fr", "en", "es", "it", "de", "nl", "el"]`).
  - **Pas** de remplacement de polices ni de `GREEK_STYLE` (le polonais est couvert par les polices du site).
  - `VISUALS`, `FR_ONLY_FOOTER`, `LINKMAP`, `block_end`, `clean` : repris tels quels (`'formulaire2'` → `'pl/form'`).
- [ ] **Step 2: `apply_tr_pl.py`** = `apply_tr_el.py` sans `caps_fix`/`destress` (spécifiques au grec), chemins `tr_pl`.
- [ ] **Step 3: clones mécaniques** :
  ```bash
  cd tests/i18n
  sed -e 's/prep_el/prep_pl/g; s/tr_el/tr_pl/g; s/\bEL\b/PL/g; s/el_rel/pl_rel/g; s/grecques/polonaises/g' el/jscheck_el.py > pl/jscheck_pl.py
  sed -e 's/tr_el/tr_pl/g; s/grecque/polonaise/g; s/coherence_nl/coherence_pl/g; s#el/#pl/#g' el/coherence_el.py > pl/coherence_pl.py
  ```
  `build_pl.py` = `build_el.py` avec `prep_pl`, `apply_tr_pl.py`, `qa_pl.py` et `TABLES` = page PL → nom de table
  (`pl/blog/index.html` → `blog_index`, sinon chemin sans `pl/` ni `.html`, `/` et `-` → `_` ; ex.
  `pl/blog/typ-skory.html` → `blog_typ_skory`, `pl/o-nas.html` → `o_nas`), calculé et non écrit à la main :
  ```python
  NAME = lambda p: 'blog_index' if p == 'pl/blog/index.html' else re.sub(r'[/-]', '_', clean(p)[3:]) or 'home'
  TABLES = {v[0]: NAME(v[0]) for v in PAGES.values()}
  ```
- [ ] **Step 4: `seed_from_el.py`** — pour chaque table grecque, reprend **la colonne FR seulement**, réécrit les
  chemins `/el/...` vers `/pl/...` (via `prep_el.clean` ↔ `prep_pl.clean` par page FR commune) et `lang=el` → `lang=pl`,
  vérifie chaque littéral dans la page PL préparée (absent → écarté et listé ; compte → corrigé), écrit
  `tr_pl/<nom>.py` avec `None`, recopie les `REGEX` grecs **en commentaire** (à retraduire), n'écrase jamais.
- [ ] **Step 5: vercel.json** — ajouter après les redirects `/el` :
  ```json
  { "source": "/pl", "destination": "/pl/home", "statusCode": 301 },
  { "source": "/pl/", "destination": "/pl/home", "statusCode": 301 },
  { "source": "/pl/cgv", "destination": "/pl/warunki-sprzedazy", "statusCode": 301 },
  ```
  et en tête de `headers` :
  ```json
  { "source": "/pl/(.*)", "headers": [{ "key": "X-Robots-Tag", "value": "noindex" }] },
  { "source": "/pl/anuluj-subskrypcje", "headers": [{ "key": "X-Robots-Tag", "value": "noindex" }] },
  ```
  (le second reste après l'ouverture, comme les pages de résiliation des autres langues). Vérifier : `python3 -m json.tool vercel.json >/dev/null`.
- [ ] **Step 6: free-analysis.html** — entrée `pl` dans `UX` + commentaire « Allemand, néerlandais, grec, polonais » :
  ```js
  pl: { title: "Twój raport Adermio", errTitle: "Link jest nieprawidłowy lub wygasł", errText: "Nie udało się znaleźć twojej analizy. Otwórz ponownie link z e-maila albo rozpocznij nową analizę.", btn: "Rozpocznij darmową analizę", href: "https://adermio.com/pl/form" },
  ```
- [ ] **Step 7: tester** : `python3 tests/i18n/pl/prep_pl.py` → 24 lignes, aucune note `!!` ; `ls pl pl/blog` = 19 + 5 fichiers ;
  `grep -c 'hreflang="pl"' pl/home.html` = 1 ; `grep -c "analyse-gratuite-pl-web" pl/form.html` ≥ 1 ;
  `grep -c "lang-dropdown" pl/home.html` ≥ 1 ; `python3 tests/i18n/pl/seed_from_el.py` → 24 tables.
  Spec §3.1 : remplacer « `facescan.js`, … : entrée `pl` » par « `free-analysis.html` : entrée `pl` ; `facescan.js` n'est pas chargé par le formulaire FR actuel → rien à faire ».
- [ ] **Step 8: commit** (outillage + tables vides + vercel + free-analysis, pages `pl/` pas encore) :
  ```bash
  git add -- tests/i18n/pl vercel.json free-analysis.html docs/superpowers/specs/2026-10-14-site-polonais-design.md
  git commit -m "pl: outillage site polonais (prep/apply/build/jscheck/coherence, tables semees), vercel /pl + noindex, free-analysis pl" -- tests/i18n/pl vercel.json free-analysis.html docs/superpowers/specs/2026-10-14-site-polonais-design.md
  ```
  ⚠️ Ne pas pousser avant Task 7 (vercel.json + free-analysis sont sans effet visible, mais on pousse tout ensemble).

### Task 2: `qa_pl.py` — contrôle qualité polonais (TDD)

**Files:**
- Create: `tests/i18n/pl/test_qa_pl.py`, `tests/i18n/pl/qa_pl.py`, `tests/i18n/pl/allow_pl.txt`

**Interfaces:**
- Consumes: `prep_pl.PAGES`, `prep_pl.ROOT`.
- Produces: `qa_pl.segment_hits(seg: str, page: str) -> list[tuple[str, str]]` (code, message) ; `qa_pl.check(pl_rel) -> (issues, hits)` ; CLI `python3 tests/i18n/pl/qa_pl.py [pages]` (rc 0 si tout est propre).
  Codes : `GENRE`, `ADJ`, `REGISTRE`, `MAJ`, `INTERDIT`, `DERMA`, `FR`, `EN`, `DE`, `MORPHO`, `PAS_PL`, `ASCII`, `GREC`, `IDENT`, `PRIX`, `TYPO`, `GUILL`, `ESPACE`.

- [ ] **Step 1: écrire le test (contre-épreuves)** `tests/i18n/pl/test_qa_pl.py` :
  ```python
  #!/usr/bin/env python3
  """Contre-épreuves de qa_pl : chaque défaut injecté doit sonner, chaque phrase polonaise propre doit passer."""
  import os, sys
  sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
  from qa_pl import segment_hits

  P = 'pl/home.html'
  def codes(seg, page=P): return {c for c, _ in segment_hits(seg, page)}

  BAD = {
      'GENRE': ['Czy kiedykolwiek stosowałaś retinoidy?', 'Czy stosowałeś już ten krem?', 'Czy chciałabyś zacząć?', 'Jeśli zrobił(a)ś zdjęcie, prześlij je.'],
      'ADJ': ['Jesteś gotowa na zmianę?', 'Będziesz zadowolony z wyników.'],
      'REGISTRE': ['Prosimy Pana o przesłanie zdjęć.', 'Dziękujemy, że Pani wybrała Adermio.'],
      'MAJ': ['Oto Twoja analiza skóry.'],
      'INTERDIT': ['Otrzymasz diagnozę swojej skóry.', 'Nasza terapia działa szybko.', 'Wynik kliniczny w 2 minuty.'],
      'DERMA': ['Adermio to twój dermatolog w kieszeni.'],
      'FR': ['Votre analyse de peau est prête maintenant.', 'Merci pour votre confiance.'],
      'EN': ['Your skin analysis is ready, click here.'],
      'PAS_PL': ['Start free skin scan today now'],
      'ASCII': ['Twoja skora jest tlusta i bedzie lepiej.', 'Zrob zdjecie i wyslij sie teraz.'],
      'GREC': ['Η ανάλυση σας jest gotowa.'],
      'PRIX': ['Pełna analiza kosztuje 5,99 €.', 'Cena: € 24,99', 'Pełna analiza za 24.99 zł.'],
      'TYPO': ['Twój bilans J28 jest gotowy do pobrania.'],
      'GUILL': ['Kliknij « Wyślij », aby kontynuować.'],
      'ESPACE': ['Gotowe ! Twoja analiza jest w drodze.'],
  }
  GOOD = [
      'Twoja analiza skóry jest gotowa.', 'Czy stosujesz obecnie retinoidy?', 'Masz za sobą kurację izotretynoiną?',
      'Pełna analiza kosztuje 24,99 zł.', 'Kliknij „Wyślij”, aby kontynuować.', 'Gotowe! Twoja analiza jest w drodze.',
      'Twój bilans po 28 dniach jest gotowy do pobrania.', 'Zaskórniki otwarte pojawiają się na nosie i brodzie.',
      'Twoja twarz, twoje zdjęcia: przesyłasz je przez bezpieczne połączenie.',
      'Element rutyny, który pomija większość osób: filtr SPF codziennie.',
      'Budżet: < 60 €', 'Ta analiza nie zastępuje wizyty u dermatologa.',
  ]

  def main():
      fails = []
      for code, segs in BAD.items():
          for s in segs:
              if code not in codes(s): fails.append(f'NON DÉTECTÉ {code}: {s!r} -> {sorted(codes(s))}')
      for s in GOOD:
          if codes(s): fails.append(f'FAUX POSITIF: {s!r} -> {sorted(codes(s))}')
      for f in fails: print(f)
      print('OK' if not fails else f'{len(fails)} échec(s)')
      sys.exit(1 if fails else 0)

  if __name__ == '__main__':
      main()
  ```
- [ ] **Step 2: lancer** `python3 tests/i18n/pl/test_qa_pl.py` → échoue (`ModuleNotFoundError: qa_pl`).
- [ ] **Step 3: écrire `qa_pl.py`** : structure de `qa_el.py` (`strip_selector` sans `GREEK_STYLE`, `tags`,
  `visible_segments`, `is_human_text`, `check` avec sélecteur à 6 jumeaux `('us','es','it','de','nl','gr')`, liens
  `/pl/` cassés, `lang="pl"`, `SAME_OK`, `SAME_OK_PAGES = {'pl/zrodla.html'}`, `ALLOW` pour `pl/form.html`
  (`BACKEND_FR | BRANDS`), `pl/premium.html`, `pl/bilan.html`, `pl/second-cycle.html` (`BRANDS`)) ; la détection
  « mot latin » du grec est remplacée par `segment_hits` :
  ```python
  WORD = r"[A-Za-zÀ-ÿĄąĆćĘęŁłŃńÓóŚśŹźŻż]"
  GENRE_RE = re.compile(r"\b\w+(łaś|łeś|łabyś|łbyś)\b|\b\w+ł\(a\)ś\b|\b\w+(łeś/aś|łaś/eś)\b")
  # attribut genré SEULEMENT après un verbe à la 2e personne (« bilans jest gotowy » reste permis)
  ADJ_RE = re.compile(r"(?i:\b(jesteś|będziesz|bądź|(po)?czujesz się|zostaniesz|stajesz się|staniesz się)\s+(\w+\s+){0,2}?(gotow|zadowolon|zainteresowan|zmęczon|przekonan|zaskoczon|zalogowan|zarejestrowan|uprawnion|zobowiązan|zmuszon|świadom|pewn|ciekaw|sam)(a|y)\b)|\b(Drog[ia]|Szanown[ay]|Kochan[ay])\b")
  REGISTRE_RE = re.compile(r"\b(Pan|Pani|Pana|Panią|Panu|Państwo|Państwa|Państwu)\b")
  MAJ_WORDS = re.compile(r"\b(Twój|Twoja|Twoje|Twojego|Twojej|Twoim|Twoją|Twoich|Twoimi|Ciebie|Cię|Tobie|Tobą)\b")
  INTERDIT_RE = re.compile(r"(diagnoz\w*|diagnost\w*|pacjent\w*|terapi\w*|terapeut\w*|klinicz\w*|klinik\w*|wylecz\w*|leczy\w*|lecznicz\w*)", re.I)
  DERMA_RE = re.compile(r"\b(AI|Adermio)\b[^.!?]{0,40}\bdermatolog\w*|\bdermatolog\w*[^.!?]{0,20}\b(AI|Adermio)\b")
  FR_STRONG = re.compile(r"\b(votre|vos|vous|nous|une|pour|avec|dans|sur|peau|gratuite|merci|cliquez|veuillez|réessayer|erreur|chargement|semaine|semaines|jours|mois|très|sans|avant|après|paiement|résultats|conseils|produits|complète|sévérité|boutons|rougeurs|taches|cicatrices|aux|qui|que|mais|tout|tous|toutes|autre|autres|cette|ces|mon|leur|leurs|notre|ici|déjà|encore|toujours|aussi|ainsi|puis|donc|selon|chez|depuis|pendant|parmi|afin|lorsque|quand|comment|pourquoi|combien|quel|quels|quelles|est|sont|et)\b", re.I)
  EN_RE = re.compile(r"\b(the|your|you|and|with|for|this|that|our|free|skin|analysis|report|please|click|here|now|today)\b", re.I)
  DE_RE = re.compile(r"\b(und|nicht|Sie|Ihre?|Ihnen|für|über|sind|auch|ist|eine|einen|wir|uns|oder|Haut|jetzt|kostenlose?|bitte)\b")
  MORPHO_RE = re.compile(r"\b(\w{3,}ez|\w{4,}ement|\w{3,}eux|ci-dessous|ci-dessus|formulaire|veuillez)\b", re.I)
  MORPHO_OK = {'przez', 'poprzez', 'element', 'suplement', 'temperament', 'fundament', 'management', 'engagement', 'treatment', 'development', 'assessment', 'improvement'}
  PL_SIGNAL = re.compile(r"[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]|\b(i|w|z|na|do|się|nie|jest|to|że|aby|oraz|dla|po|od|jak|czy|co|o|a|ale|lub|ze|przez|bez|pod|przy|ten|ta|te|są|tak|twoja|twoje|twój|masz|jesteś)\b", re.I)
  ASCII_RE = re.compile(r"\b(sie|skora|skory|skore|skorze|tradzik\w*|moze|mozesz|wiecej|juz|takze|rowniez|byc|ktor\w+|dzieki|prosze|zdjecie|zdjecia|zdjec|bedzie|bedziesz|wazne|jesli|zrob|wyslij|tlust\w*)\b", re.I)
  GREC_RE = re.compile(r"[Α-Ωα-ωάέήίόύώ]")
  PRIX_RE = re.compile(r"\d,\d\d\s?€|€\s?\d|\b(5,99|4,99|6,99)\b|\d+\.\d\d\s?zł|zł\s?\d|\d,\d\dzł")
  TYPO_RE = re.compile(r"\bJ\+?\d{1,3}\b|\b\d+\s?Mo\b|\b\d{1,3}\.\d{3}\b")
  GUILL_RE = re.compile(r"[«»]")
  ESPACE_RE = re.compile(r"[\wÀ-ž%)”’]\s*[   ]+[!?;:](?=\s|$|[“\"’<)„”])")

  def maj_hits(seg):
      out = []
      for m in MAJ_WORDS.finditer(seg):
          before = seg[:m.start()].rstrip()
          if before and before[-1] not in '.!?:„"«(—–-•✓✔>':
              out.append(m.group(0))
      return out

  def segment_hits(seg, page):
      hits = []
      ref = page in SAME_OK_PAGES
      clean_seg = re.sub(r'https?://\S+|[\w.+-]+@[\w.-]+|\b[\w-]+\.(com|fr|pl|html)\b', ' ', seg)
      if GENRE_RE.search(clean_seg): hits.append(('GENRE', GENRE_RE.search(clean_seg).group(0)))
      if ADJ_RE.search(clean_seg): hits.append(('ADJ', ADJ_RE.search(clean_seg).group(0)))
      if REGISTRE_RE.search(clean_seg): hits.append(('REGISTRE', REGISTRE_RE.search(clean_seg).group(0)))
      if (w := maj_hits(clean_seg)): hits.append(('MAJ', w[0]))
      if not ref and INTERDIT_RE.search(clean_seg): hits.append(('INTERDIT', INTERDIT_RE.search(clean_seg).group(0)))
      if DERMA_RE.search(re.sub(r'\s*[—–|-]\s*Adermio\s*$', '', clean_seg)): hits.append(('DERMA', 'dermatolog = Adermio ?'))
      if not ref:
          fr = FR_STRONG.findall(clean_seg)
          if len(fr) >= 2 or (fr and not PL_SIGNAL.search(clean_seg)): hits.append(('FR', ','.join(fr[:4])))
          if len(EN_RE.findall(clean_seg)) >= 2: hits.append(('EN', ','.join(EN_RE.findall(clean_seg)[:4])))
          if len(DE_RE.findall(clean_seg)) >= 2: hits.append(('DE', ','.join(DE_RE.findall(clean_seg)[:4])))
          mo = [m.group(0) for m in MORPHO_RE.finditer(clean_seg) if m.group(0).lower() not in MORPHO_OK]
          if mo: hits.append(('MORPHO', mo[0]))
          words = re.findall(WORD + r"{2,}", clean_seg)
          if len(words) >= 5 and not PL_SIGNAL.search(clean_seg): hits.append(('PAS_PL', ' '.join(words[:5])))
      if ASCII_RE.search(clean_seg): hits.append(('ASCII', ASCII_RE.search(clean_seg).group(0)))
      if GREC_RE.search(clean_seg): hits.append(('GREC', GREC_RE.search(clean_seg).group(0)))
      if PRIX_RE.search(clean_seg): hits.append(('PRIX', PRIX_RE.search(clean_seg).group(0)))
      if TYPO_RE.search(clean_seg): hits.append(('TYPO', TYPO_RE.search(clean_seg).group(0)))
      if GUILL_RE.search(clean_seg): hits.append(('GUILL', '« »'))
      if ESPACE_RE.search(clean_seg): hits.append(('ESPACE', ESPACE_RE.search(clean_seg).group(0)))
      return [h for h in hits if not allowed(h[0], seg, page)]
  ```
  `allowed(code, seg, page)` lit `allow_pl.txt` (lignes `CODE<TAB>sous-chaîne<TAB>raison`, `#` = commentaire) ;
  **interdit** d'y mettre `INTERDIT`, `DERMA`, `IDENT`, `PRIX`, `GREC` (le chargeur lève une erreur). Dans `check`,
  chaque segment visible passe par `segment_hits` + le contrôle `IDENT` (≥ 3 mots identiques au FR, hors `ref`).
- [ ] **Step 4: lancer** `python3 tests/i18n/pl/test_qa_pl.py` → `OK`. Ajuster les motifs jusqu'au vert **sans retirer de cas**.
- [ ] **Step 5: sanity** : `python3 tests/i18n/pl/qa_pl.py pl/home.html` → `XX` avec des dizaines de `FR`/`IDENT` (texte encore français) — preuve que le contrôle mord.
- [ ] **Step 6: commit** `git add -- tests/i18n/pl && git commit -m "pl: qa_pl (genre, registre, residus FR/EN/DE, diacritiques, prix zl, typo) + contre-epreuves" -- tests/i18n/pl`

### Task 3: Glossaire + brief traducteur

**Files:** Create `tests/i18n/pl/GLOSSAIRE_PL.md`, `tests/i18n/pl/BRIEF_TRADUCTEUR_PL.md`

- [ ] **Step 1: GLOSSAIRE_PL.md** — sections « Décisions (PDG + client, 14/10/2026) — non négociables » : registre ty
  (impératif singulier *Zrób, Prześlij, Rozpocznij*, possessifs minuscules) ; neutralité de genre (liste des tournures :
  présent *Czy stosujesz…*, *Masz za sobą…*, noms *Wcześniejsze kuracje*, impersonnel *Jeśli zdjęcie jest nieostre…* ;
  interdits `-łaś/-łeś`, conditionnel `-łabyś/-łbyś`, attributs genrés, *Drogi/Droga*) ; zéro langage médical
  (traitement de l'utilisateur → *leki / kuracja*, ex. « Czy przyjmujesz leki na trądzik? » ; *dermatolog* = vrai médecin) ;
  prix **24,99 zł** (`24,99&nbsp;zł`), FR « 4,99 € » → 24,99 zł ; budgets produits en euros `< 60 €` ; témoignages (prénoms
  gardés, même texte sur toutes les pages, référence `tr_pl/home.py`) ; pied de page *© 2026 Adermio. Wszelkie prawa
  zastrzeżone.* ; « Conditions de vente » → *Warunki sprzedaży* ; erreurs jamais techniques ; visuels en anglais
  (*(wideo w języku angielskim)*) ; juridique : « l'Utilisateur » → *Użytkownik* (3e pers.), RGPD → **RODO**, autorité
  polonaise *Prezes Urzędu Ochrony Danych Osobowych (UODO)* seulement si le FR cite l'autorité du pays ; Point Repère →
  *Punkt Odniesienia*. Terminologie (spec §2) + typographie (Global Constraints). Section « Décisions du client » vide au départ.
- [ ] **Step 2: BRIEF_TRADUCTEUR_PL.md** — copie adaptée de `el/BRIEF_TRADUCTEUR_EL.md` : traducteur natif de Pologne ;
  méthode (remplacer chaque `None`, balises identiques, `--check`, `prep_pl.py <page FR> && apply_tr_pl.py <nom>`,
  `qa_pl.py pl/<page>` = OK, `jscheck_pl.py` = OK) ; faux positifs → une ligne dans `allow_pl.txt` avec raison (jamais
  pour masquer du FR/EN réel) ; nouvelles entrées pour tout texte FR non couvert ; ne toucher que ses tables ; rapport final.
- [ ] **Step 3: commit** `git commit -m "pl: glossaire + brief traducteur" -- tests/i18n/pl/GLOSSAIRE_PL.md tests/i18n/pl/BRIEF_TRADUCTEUR_PL.md` (après `git add`).

### Task 4: Traduction (7 sous-agents en parallèle)

**Files:** Modify `tests/i18n/pl/tr_pl/*.py` (chaque agent : ses tables seulement), `tests/i18n/pl/allow_pl.txt` (ajouts motivés)

| Lot | Tables |
|---|---|
| A accueil | `home`, `o_nas`, `kontakt`, `feedback`, `zrodla`, `blog_index` |
| B parcours | `form`, `processing`, `processing2`, `success` (+ REGEX ttq : `value: 5.99, currency: "EUR"` → `value: 24.99, currency: "PLN"`), `analysis_in_progress_second_cycle` |
| C payant | `premium`, `premium_second_cycle`, `second_cycle`, `bilan`, `anuluj_subskrypcje` |
| D juridique 1 | `polityka_prywatnosci`, `informacje_prawne` |
| E juridique 2 | `regulamin`, `warunki_sprzedazy` |
| F1 blog | `blog_typ_skory`, `blog_skad_sie_bierze_tradzik` |
| F2 blog | `blog_tradzik_hormonalny`, `blog_gdzie_pojawia_sie_tradzik` |

- [ ] **Step 1** : lancer les 7 agents (prompt = brief + glossaire + liste de tables + « rapport court en français »).
- [ ] **Step 2** : à chaque retour, vérifier `apply_tr_pl.py <nom> --check` et `qa_pl.py` des pages du lot ; relancer l'agent sur ses écarts.
- [ ] **Step 3** : relire `allow_pl.txt` ligne par ligne (une entrée qui masque du vrai FR/EN est retirée et la page retraduite).

### Task 5: Intégration et contrôles

- [ ] **Step 1** : `python3 tests/i18n/pl/build_pl.py` → 24 × `OK … issues=0 résidus=0`.
- [ ] **Step 2** : `python3 tests/i18n/pl/jscheck_pl.py` → 24 × `OK` ; `python3 tests/i18n/pl/coherence_pl.py` → `Cohérence : OK` (harmoniser sur `home`).
- [ ] **Step 3** : `python3 tests/i18n/pl/build_pl.py --check` → « Reconstruction identique ».
- [ ] **Step 4 (Review Focus 5)** : serveur local `python3 tests/i18n/serve_it.py` (lancé depuis Bash, port 8091), Browser pane à 375 px :
  `/pl/home`, `/pl/form` (toutes les étapes visibles sans envoi), `/pl/success` ; aucun débordement horizontal
  (`document.documentElement.scrollWidth <= innerWidth`), en-tête des photos de profil sur une ligne commune.
  Correctifs éventuels par table (texte plus court) ou par `REGEX` de style, jamais à la main.
- [ ] **Step 5** : commit `pl/` + tables : `git add -- pl tests/i18n/pl && git commit -m "pl: site polonais 24 pages /pl/ (cache, noindex)" -- pl tests/i18n/pl`.

### Task 6: Audit final (relecture native + correctifs)

- [ ] **Step 1** : 3 relecteurs natifs polonais en parallèle (UX A+B+C / juridique D+E / blog F1+F2). Chacun lit FR et
  PL table par table : contresens, omissions, calques du français, genre, registre, terminologie du glossaire,
  crédibilité « site écrit à Varsovie ». Ils corrigent **dans les tables** (colonne polonaise seulement), relancent
  `prep_pl` + `apply_tr_pl` + `qa_pl` sur leurs pages, et rendent une note /10 + liste des corrections + points de fond.
- [ ] **Step 2** : `build_pl.py` + `build_pl.py --check` + `jscheck_pl.py` + `coherence_pl.py` + `test_qa_pl.py` → tous verts.
- [ ] **Step 3** : relecture « œil de client » de `/pl/home` et `/pl/form` rendues (get_page_text) par Claude.
- [ ] **Step 4** : commit `git commit -m "pl: corrections relecture native" -- pl tests/i18n/pl`.

### Task 7: Mise en ligne cachée + vérification prod

- [ ] **Step 1** : `git log origin/main..main --oneline` (ne pousser que nos commits ; si d'autres commits locaux non poussés d'une autre session apparaissent, ne pas pousser et prévenir Antoine).
- [ ] **Step 2** : `git push origin main` ; attendre le déploiement Vercel (vérifier par `curl`).
- [ ] **Step 3** : `curl -sI https://adermio.com/pl` → 301 `/pl/home` ; `curl -sI https://adermio.com/pl/home` → 200 + `x-robots-tag: noindex` ;
  `curl -s https://adermio.com/pl/form | grep -c analyse-gratuite-pl-web` ≥ 1 ; `curl -s https://adermio.com/ | grep -c '/pl/'` = 0 (aucun lien entrant).
- [ ] **Step 4** : mémoire (`adermio-site-polonais-chantier.md`) + rapport à Antoine : site prêt, reste n8n/Stripe/moteur/ouverture.
