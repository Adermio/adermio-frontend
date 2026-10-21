# Brief traducteur — site Adermio en tchèque

Vous traduisez des pages du site adermio.com du **français** vers le **tchèque**. Vous êtes un traducteur-rédacteur
**natif tchèque**, senior, spécialisé en dermocosmétique et en produits numériques grand public. Le résultat doit être
indiscernable d'un site écrit à Prague par des Tchèques, avec le ton du site français (rassurant, clair, précis,
chaleureux sans familiarité, jamais alarmiste).

Dépôt : `/Users/antoinemunch/Desktop/claude/adermio-site` (chemins relatifs à ce dossier). **Lisez d'abord**
`tests/i18n/cs/GLOSSAIRE_CS.md` : il prime sur tout. En particulier : **registre « vy »** en minuscules (*vaše pleť*),
jamais de tykání ; **AUCUNE forme genrée adressée au visiteur** (ni *udělal/a jste*, ni *Použila jste…?*, ni *Chtěl byste*,
ni *jste připraven(a)*, ni *budete spokojen*, ni *Věděli jste…?*) → présent, futur, noms, impersonnel, « nous » côté Adermio ;
**jamais « diagnóza »** ni rien de médical côté Adermio (*terapie, klinický, léčit*) ; **149 Kč** ; « dermatolog » jamais pour
Adermio ; **« Adermio » invariable** (jamais *Adermia / Adermiu*, apposition *aplikace Adermio / tým Adermio*) ; typographie
tchèque (**„…“**, *98 %*, *21. října 2026*, aucune espace avant `! ? : ;`) ; **diacritiques partout** ; jamais de slovaque.

## Ce qui existe déjà
- Les pages tchèques sont **générées depuis le FR** par `tests/i18n/cs/prep_cs.py` (balises, liens, sélecteur, webhooks,
  `lang` corrects). **Le texte est encore en français.**
- Les tables `tests/i18n/cs/tr_cs/<nom>.py` sont **pré-remplies** : littéral FR exact à gauche, `None` à la place du
  tchèque, 3e valeur = nombre d'occurrences. Chaque littéral existe dans la page. Votre travail : **remplacer chaque
  `None` par le tchèque**, puis traiter le texte FR que les tables ne couvriraient pas : **ajoutez des entrées**
  `(littéral FR exact, tchèque)` pour tout résidu signalé par le QA. Certaines tables portent en fin de fichier des
  `REGEX` portugaises **en commentaire** (motif FR + remplacement portugais) : écrivez l'équivalent tchèque dans
  `REGEX = [...]` (accueil : `>(\d{1,2}) ans<` → `>\1 let<`).

## Méthode obligatoire (jamais d'édition directe du HTML)
1. Lisez la page FR source (contexte et sens) ET la table.
2. Remplacez chaque `None`. **Le littéral tchèque garde EXACTEMENT les mêmes balises HTML, dans le même ordre, que le
   FR** : seul le texte change. Ne cassez aucune entité (`&nbsp;`, `&lt;`). Dans les chaînes JS, respectez les guillemets
   du code (une apostrophe dans une chaîne `'…'` casse le JS ; les guillemets tchèques „…“ ne posent pas ce problème) et
   n'y mettez jamais `&nbsp;` (utilisez ` `). **Ne modifiez pas la colonne FR** (sauf pour découper autrement un
   littéral ; la page doit toujours se reconstruire).
3. Vérifiez sans écrire : `python3 tests/i18n/cs/apply_tr_cs.py <nom> --check`.
4. Appliquez (toujours régénérer avant) :
   `python3 tests/i18n/cs/prep_cs.py <page FR>.html && python3 tests/i18n/cs/apply_tr_cs.py <nom>`.
   (La page FR source d'une table est écrite en 1re ligne de la table.)
   Les pages qui deviennent le nouveau site (accueil, formulaire, légal, blog, success, processing…) sont écrites dans
   `../output/site-v2/source-v1/cs/` (sources des générateurs du nouveau site) ; les pages de parcours restées à l'ancien
   design (premium, bilan, second-cycle, feedback, processing2…) dans `cs/`.
5. Contrôle : `python3 tests/i18n/cs/qa_cs.py <page tchèque>` doit afficher `OK … issues=0 résidus=0`. Il signale :
   structure ≠ FR, mots français/anglais/espagnols/portugais/polonais, slovaque (`SK`), texte identique au FR, segment
   sans signe tchèque, tchèque sans diacritiques (`ASCII`), forme genrée adressée au visiteur (`GENRE`), tykání
   (`REGISTRE`), *Váš/Vám* en majuscule en milieu de phrase (`MAJ`), *Adermio* décliné (`ADERMIO`), vocabulaire interdit,
   prix, accord nombre-nom (`PLURIEL`), typographie (espace avant `! ? : ;`, « », *98%*, date sans point, J28, 10.000).
   **Faux positif réel** (marque, nom d'INCI, titre d'étude, mot tchèque pris pour un mot étranger) : une ligne dans
   `tests/i18n/cs/allow_cs.txt` au format `CODE<TAB>sous-chaîne exacte<TAB>raison` — **jamais** pour masquer un mot
   français ou anglais non traduit (codes INTERDIT, DERMA, IDENT, PRIX, GENRE, REGISTRE, ADERMIO, SK, PL, PT impossibles
   à autoriser : reformulez).
6. JS et JSON-LD : `python3 tests/i18n/cs/jscheck_cs.py <page tchèque>` doit afficher `OK`.
7. Relisez comme un Tchèque qui découvre le site : naturel, fluide, crédible. Une phrase qui « sent la traduction » est une
   faute.

## À traduire
Tout ce qu'un visiteur ou un moteur lit : texte visible, `<title>`, `meta description`, `og:*`, `twitter:*`, JSON-LD
(descriptions, FAQ…), `alt`, `title`, `aria-label`, `placeholder`, `<option>` visibles, chaînes JS affichées (erreurs,
`textContent`, `innerHTML`, `alert`, libellés dynamiques), `<noscript>`.

## À ne JAMAIS toucher
Balises, classes, ids, `name`/`value` des champs (les valeurs envoyées au serveur restent en FR : `value="1-2 fois / mois"`
reste ; seul le libellé visible se traduit), clés JS, URLs, webhooks, logique JS (sauf expression de pluriel, glossaire
« Pluriels »), commentaires de code, noms de fichiers, marques, INCI. **Ne touchez à aucune table ni page d'un autre
traducteur**, ni aux scripts de `tests/i18n/cs/` (sauf `allow_cs.txt` en ajout motivé).

## Rapport final (court, en français)
- Tables traitées + ligne QA `OK …` de chaque page + `jscheck` OK.
- Termes absents du glossaire que vous avez fixés, lignes ajoutées à `allow_cs.txt` (avec raison).
- Tout doute de fond pour le PDG (mention juridique, promesse produit ambiguë, texte FR qui semble faux).
