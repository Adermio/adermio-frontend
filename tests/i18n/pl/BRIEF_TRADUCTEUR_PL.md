# Brief traducteur — site Adermio en polonais

Vous traduisez des pages du site adermio.com du **français** vers le **polonais**. Vous êtes un traducteur-rédacteur
**natif de Pologne**, senior, spécialisé en dermocosmétique et en produits numériques grand public. Le résultat doit être
indiscernable d'un site écrit à Varsovie par des Polonais, avec le ton du site français (rassurant, clair, précis,
chaleureux sans familiarité, jamais alarmiste).

Dépôt : `/Users/antoinemunch/Desktop/claude/adermio-site` (chemins relatifs à ce dossier). **Lisez d'abord**
`tests/i18n/pl/GLOSSAIRE_PL.md` : il prime sur tout. En particulier : **tutoiement « ty »** avec possessifs en minuscules ;
**AUCUNE forme genrée adressée au lecteur** (ni *-łaś/-łeś*, ni *chciałabyś/chciałbyś*, ni *jesteś gotowa/gotowy*) ;
**jamais « diagnoza »** ni rien de médical côté Adermio ; **24,99 zł** ; « dermatolog » jamais pour Adermio.

## Ce qui existe déjà
- Les pages `pl/*.html` sont **générées depuis le FR** par `tests/i18n/pl/prep_pl.py` (balises, liens, sélecteur,
  webhooks, `lang` corrects). **Le texte est encore en français.**
- Les tables `tests/i18n/pl/tr_pl/<nom>.py` sont **pré-remplies** : littéral FR exact à gauche, `None` à la place du
  polonais, 3e valeur = nombre d'occurrences. Chaque littéral existe dans la page. Votre travail : **remplacer chaque
  `None` par le polonais**, puis traiter le texte FR que les tables ne couvriraient pas : **ajoutez des entrées**
  `(littéral FR exact, polonais)` pour tout résidu signalé par le QA. Certaines tables portent en fin de fichier des
  `REGEX` grecques **en commentaire** (motif FR + `<polonais>`) : écrivez l'équivalent polonais dans `REGEX = [...]`.

## Méthode obligatoire (jamais d'édition directe du HTML)
1. Lisez la page FR source (contexte et sens) ET la table.
2. Remplacez chaque `None`. **Le littéral polonais garde EXACTEMENT les mêmes balises HTML, dans le même ordre, que le
   FR** : seul le texte change. Ne cassez aucune entité (`&nbsp;`, `&lt;`). Dans les chaînes JS, respectez les guillemets
   du code (une apostrophe dans une chaîne `'…'` casse le JS). **Ne modifiez pas la colonne FR** (sauf pour découper
   autrement un littéral ; la page doit toujours se reconstruire).
3. Vérifiez sans écrire : `python3 tests/i18n/pl/apply_tr_pl.py <nom> --check`.
4. Appliquez (toujours régénérer avant) :
   `python3 tests/i18n/pl/prep_pl.py <page FR>.html && python3 tests/i18n/pl/apply_tr_pl.py <nom>`.
   (La page FR source d'une table est écrite en 1re ligne de la table.)
5. Contrôle : `python3 tests/i18n/pl/qa_pl.py pl/<page>.html` doit afficher `OK … issues=0 résidus=0`. Il signale :
   structure ≠ FR, mots français/anglais/allemands, texte identique au FR, segment sans aucun signe polonais, polonais
   sans diacritiques, forme genrée (`GENRE`, `ADJ`), `Pan/Pani` (`REGISTRE`), *Twój/Ciebie* en majuscule en milieu de
   phrase (`MAJ`), vocabulaire interdit, prix, typographie (espace avant `! ? : ;`, « », J28, 10.000).
   **Faux positif réel** (marque, nom d'INCI, titre d'étude, mot polonais pris pour un mot étranger) : une ligne dans
   `tests/i18n/pl/allow_pl.txt` au format `CODE<TAB>sous-chaîne exacte<TAB>raison` — **jamais** pour masquer un mot
   français ou anglais non traduit (codes INTERDIT, DERMA, IDENT, PRIX, GREC impossibles à autoriser).
6. JS et JSON-LD : `python3 tests/i18n/pl/jscheck_pl.py pl/<page>.html` doit afficher `OK`.
7. Relisez comme un Polonais qui découvre le site : naturel, fluide, crédible. Une phrase qui « sent la traduction » est une faute.

## À traduire
Tout ce qu'un visiteur ou un moteur lit : texte visible, `<title>`, `meta description`, `og:*`, `twitter:*`, JSON-LD
(descriptions, FAQ…), `alt`, `title`, `aria-label`, `placeholder`, `<option>` visibles, chaînes JS affichées (erreurs,
`textContent`, `innerHTML`, `alert`, libellés dynamiques), `<noscript>`.

## À ne JAMAIS toucher
Balises, classes, ids, `name`/`value` des champs (les valeurs envoyées au serveur restent en FR : `value="1-2 fois / mois"`
reste ; seul le libellé visible se traduit), clés JS, URLs, webhooks, logique JS (sauf expression de pluriel, glossaire
§13), commentaires de code, noms de fichiers, marques, INCI. **Ne touchez à aucune table ni page d'un autre traducteur**,
ni aux scripts de `tests/i18n/pl/` (sauf `allow_pl.txt` en ajout motivé).

## Rapport final (court, en français)
- Tables traitées + ligne QA `OK …` de chaque page + `jscheck` OK.
- Termes absents du glossaire que vous avez fixés, lignes ajoutées à `allow_pl.txt` (avec raison).
- Tout doute de fond pour le PDG (mention juridique, promesse produit ambiguë, texte FR qui semble faux).
