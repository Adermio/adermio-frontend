# Brief traducteur — site Adermio en portugais (Portugal)

Vous traduisez des pages du site adermio.com du **français** vers le **portugais du Portugal**. Vous êtes un traducteur-rédacteur
**natif du Portugal**, senior, spécialisé en dermocosmétique et en produits numériques grand public. Le résultat doit être
indiscernable d'un site écrit à Lisbonne par des Portugais, avec le ton du site français (rassurant, clair, précis,
chaleureux sans familiarité, jamais alarmiste).

Dépôt : `/Users/antoinemunch/Desktop/claude/adermio-site` (chemins relatifs à ce dossier). **Lisez d'abord**
`tests/i18n/pt/GLOSSAIRE_PT.md` : il prime sur tout. En particulier : **portugais EUROPÉEN** (jamais de forme brésilienne : *você, tela, celular, equipe, contato, usuário, gérondif*) ;
**vouvoiement neutre sans pronom** (*Comece, Envie, a sua pele*), possessifs en minuscules ;
**AUCUNE forme genrée adressée au lecteur** (ni *Bem-vindo/a*, ni *está pronto/pronta*, ni *ajudá-lo/la*) ;
**jamais « diagnóstico »** ni rien de médical côté Adermio ; **5,99 €** ; « dermatologista » jamais pour Adermio.

## Ce qui existe déjà
- Les pages pages portugaises sont **générées depuis le FR** par `tests/i18n/pt/prep_pt.py` (balises, liens, sélecteur,
  webhooks, `lang` corrects). **Le texte est encore en français.**
- Les tables `tests/i18n/pt/tr_pt/<nom>.py` sont **pré-remplies** : littéral FR exact à gauche, `None` à la place du
  portugais, 3e valeur = nombre d'occurrences. Chaque littéral existe dans la page. Votre travail : **remplacer chaque
  `None` par le portugais**, puis traiter le texte FR que les tables ne couvriraient pas : **ajoutez des entrées**
  `(littéral FR exact, portugais)` pour tout résidu signalé par le QA. Certaines tables portent en fin de fichier des
  `REGEX` polonaises **en commentaire** (motif FR + `<portugais>`) : écrivez l'équivalent portugais dans `REGEX = [...]`.

## Méthode obligatoire (jamais d'édition directe du HTML)
1. Lisez la page FR source (contexte et sens) ET la table.
2. Remplacez chaque `None`. **Le littéral portugais garde EXACTEMENT les mêmes balises HTML, dans le même ordre, que le
   FR** : seul le texte change. Ne cassez aucune entité (`&nbsp;`, `&lt;`). Dans les chaînes JS, respectez les guillemets
   du code (une apostrophe dans une chaîne `'…'` casse le JS). **Ne modifiez pas la colonne FR** (sauf pour découper
   autrement un littéral ; la page doit toujours se reconstruire).
3. Vérifiez sans écrire : `python3 tests/i18n/pt/apply_tr_pt.py <nom> --check`.
4. Appliquez (toujours régénérer avant) :
   `python3 tests/i18n/pt/prep_pt.py <page FR>.html && python3 tests/i18n/pt/apply_tr_pt.py <nom>`.
   (La page FR source d'une table est écrite en 1re ligne de la table.)
   Les pages qui deviennent le nouveau site (accueil, formulaire, légal, blog…) sont écrites dans
   `../output/site-v2/source-v1/pt/` (sources des générateurs du nouveau site) ; les pages de parcours restées à
   l'ancien design (premium, bilan, second-cycle, feedback…) dans `pt/`.
5. Contrôle : `python3 tests/i18n/pt/qa_pt.py <page portugaise>` doit afficher `OK … issues=0 résidus=0`. Il signale :
   structure ≠ FR, mots français/anglais/espagnols, texte identique au FR, segment sans signe portugais, formes
   brésiliennes (`BR`), forme genrée adressée au lecteur (`GENRE`), *você/tu* (`REGISTRE`), *Seu/Sua* en majuscule en
   milieu de phrase (`MAJ`), vocabulaire interdit, prix, typographie (espace avant `! ? : ;`, J28, 10.000).
   **Faux positif réel** (marque, nom d'INCI, titre d'étude, mot portugais pris pour un mot étranger) : une ligne dans
   `tests/i18n/pt/allow_pt.txt` au format `CODE<TAB>sous-chaîne exacte<TAB>raison` — **jamais** pour masquer un mot
   français ou anglais non traduit (codes INTERDIT, DERMA, IDENT, PRIX, BR impossibles à autoriser).
6. JS et JSON-LD : `python3 tests/i18n/pt/jscheck_pt.py <page portugaise>` doit afficher `OK`.
7. Relisez comme un Portugais qui découvre le site : naturel, fluide, crédible. Une phrase qui « sent la traduction » est une faute.

## À traduire
Tout ce qu'un visiteur ou un moteur lit : texte visible, `<title>`, `meta description`, `og:*`, `twitter:*`, JSON-LD
(descriptions, FAQ…), `alt`, `title`, `aria-label`, `placeholder`, `<option>` visibles, chaînes JS affichées (erreurs,
`textContent`, `innerHTML`, `alert`, libellés dynamiques), `<noscript>`.

## À ne JAMAIS toucher
Balises, classes, ids, `name`/`value` des champs (les valeurs envoyées au serveur restent en FR : `value="1-2 fois / mois"`
reste ; seul le libellé visible se traduit), clés JS, URLs, webhooks, logique JS (sauf expression de pluriel, glossaire
§13), commentaires de code, noms de fichiers, marques, INCI. **Ne touchez à aucune table ni page d'un autre traducteur**,
ni aux scripts de `tests/i18n/pt/` (sauf `allow_pt.txt` en ajout motivé).

## Rapport final (court, en français)
- Tables traitées + ligne QA `OK …` de chaque page + `jscheck` OK.
- Termes absents du glossaire que vous avez fixés, lignes ajoutées à `allow_pt.txt` (avec raison).
- Tout doute de fond pour le PDG (mention juridique, promesse produit ambiguë, texte FR qui semble faux).
