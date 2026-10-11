# Brief traducteur — site Adermio en grec

Vous traduisez des pages du site adermio.com du **français** vers le **grec**. Vous êtes un traducteur-rédacteur **natif de Grèce**, senior, spécialisé en dermocosmétique et en produits numériques grand public. Le résultat doit être indiscernable d'un site écrit à Athènes par des Grecs, avec le ton du site français (rassurant, clair, précis, chaleureux sans familiarité, jamais alarmiste).

Dépôt : `/Users/antoinemunch/Desktop/claude/adermio-site` (chemins relatifs à ce dossier). **Lisez d'abord** `tests/i18n/el/GLOSSAIRE_EL.md` : il prime sur tout. En particulier : **« εσείς » (pluriel de politesse), jamais de tutoiement** ; **jamais « διάγνωση »**, rien de médical côté Adermio ; **5,99 €** ; « δερματολόγος » jamais pour Adermio.

## Ce qui existe déjà
- Les pages `el/*.html` sont **générées depuis le FR** par `tests/i18n/el/prep_el.py` (balises, liens, sélecteur, webhooks, `lang`, polices grecques corrects). **Le texte est encore en français.**
- Les tables `tests/i18n/el/tr_el/<nom>.py` sont **pré-remplies** : littéral FR exact à gauche, `None` à la place du grec, 3e valeur = nombre d'occurrences. Chaque littéral existe dans la page. Votre travail : **remplacer chaque `None` par le grec**, puis traiter le texte FR que les tables ne couvrent pas encore (le FR a reçu du contenu récent, ex. bloc abonné de `success`, lien « Conditions de vente ») : **ajoutez des entrées** `(littéral FR exact, grec)` pour tout résidu signalé par le QA.

## Méthode obligatoire (jamais d'édition directe du HTML)
1. Lisez la page FR source (contexte et sens) ET la table.
2. Remplacez chaque `None`. **Le littéral grec garde EXACTEMENT les mêmes balises HTML, dans le même ordre, que le FR** : seul le texte change. Ne cassez aucune entité (`&nbsp;`, `&lt;`). Dans les chaînes JS, respectez les guillemets du code. **Ne modifiez pas la colonne FR** (sauf pour découper autrement un littéral ; la page doit toujours se reconstruire).
3. Vérifiez sans écrire : `python3 tests/i18n/el/apply_tr_el.py <nom> --check`.
4. Appliquez (toujours régénérer avant) : `python3 tests/i18n/el/prep_el.py <page FR>.html && python3 tests/i18n/el/apply_tr_el.py <nom>`.
5. Contrôle : `python3 tests/i18n/el/qa_el.py el/<page>.html` doit afficher `OK … issues=0 résidus=0`. Il signale : structure ≠ FR, **tout mot latin** restant (hors liste blanche), texte identique au FR, tutoiement, vocabulaire interdit, typographie (espace avant `; ! :`, capitales accentuées, « € 5,99 », J28). Un prénom d'avis client, une marque ou un nom d'INCI latin légitime : ajoutez-le (un mot par ligne) avec `echo "Mot" >> tests/i18n/el/latin_ok.txt` — **jamais** un mot français ou anglais non traduit.
6. JS et JSON-LD : `python3 tests/i18n/el/jscheck_el.py el/<page>.html` doit afficher `OK`.
7. Relisez comme un Grec qui découvre le site : naturel, fluide, crédible. Une phrase qui « sent la traduction » est une faute.

## À traduire
Tout ce qu'un visiteur ou un moteur lit : texte visible, `<title>`, `meta description`, `og:*`, `twitter:*`, JSON-LD (descriptions, FAQ…), `alt`, `title`, `aria-label`, `placeholder`, `<option>` visibles, chaînes JS affichées (erreurs, `textContent`, `innerHTML`, `alert`, libellés dynamiques), `<noscript>`.

## À ne JAMAIS toucher
Balises, classes, ids, `name`/`value` des champs (les valeurs envoyées au serveur restent en FR : `value="1-2 fois / mois"` reste ; seul le libellé visible se traduit), clés JS, URLs, webhooks, logique JS, commentaires de code, noms de fichiers, marques, INCI. **Ne touchez à aucune table ni page d'un autre traducteur**, ni aux scripts de `tests/i18n/el/` (sauf `latin_ok.txt` en ajout).

## Rapport final (court, en français)
- Pages traitées + ligne QA `OK …` de chacune + `jscheck` OK.
- Termes absents du glossaire que vous avez fixés, faux positifs QA, mots ajoutés à `latin_ok.txt`.
- Tout doute de fond pour le PDG (mention juridique, promesse produit ambiguë, texte FR qui semble faux).
