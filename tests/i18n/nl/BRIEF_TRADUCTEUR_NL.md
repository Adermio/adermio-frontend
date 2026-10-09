# Brief traducteur — site Adermio en néerlandais

Vous traduisez des pages du site adermio.com du **français** vers le **néerlandais**. Vous êtes un traducteur-rédacteur **natif des Pays-Bas**, senior, spécialisé en dermocosmétique et en produits numériques grand public. Le résultat doit être indiscernable d'un site écrit aux Pays-Bas par des Néerlandais, avec le ton du site français (rassurant, clair, précis, chaleureux sans familiarité, jamais alarmiste).

Dépôt : `/Users/antoinemunch/Desktop/claude/adermio-site` (tous les chemins ci-dessous sont relatifs à ce dossier).
**Lisez d'abord** `tests/i18n/nl/GLOSSAIRE_NL.md` (décisions du client, style, glossaire figé). Il prime sur tout le reste. En particulier : **« je / jouw », jamais « u / uw »** ; **jamais « diagnose »**, ni rien de médical côté Adermio ; **€ 5,99**.

## Ce qui existe déjà

- Les pages `nl/*.html` ont été **générées à partir du FR** par `tests/i18n/nl/prep_nl.py` : balises, liens, sélecteur de langue, webhooks et attributs `lang` sont corrects. **Le texte est encore en français.**
- Les tables `tests/i18n/nl/tr_nl/<nom>.py` sont **pré-remplies** : chaque entrée contient le littéral FR exact (colonne de gauche), `None` à la place du néerlandais, et le nombre d'occurrences attendu. Le découpage vient de la version allemande et il est prouvé sur le FR actuel : **chaque littéral existe dans la page**. Votre travail : **remplacer chaque `None` par le néerlandais**.

## Méthode obligatoire (table de traduction, jamais d'édition directe du HTML)

1. Lisez la page FR source (le contexte visuel et le sens) ET la table pré-remplie.
2. Remplacez chaque `None` par la traduction. **Le littéral néerlandais garde EXACTEMENT les mêmes balises HTML, dans le même ordre, que le littéral FR** (mêmes `<a href=…>`, `<strong>`, `<br>`, `<span class=…>`, mêmes attributs) : seul le texte change. Entités HTML : gardez le style du FR (si le FR écrit `&eacute;`, vous pouvez écrire les caractères néerlandais directement : `ë`, `é` ; mais ne cassez aucune entité de balisage comme `&nbsp;`, `&lt;`). Dans les chaînes JS, respectez les guillemets du code (échappez `'` dans une chaîne entre `'…'`).
   - **Ne modifiez pas la colonne FR.** Si vous devez absolument découper un littéral autrement, la page doit toujours se reconstruire (étape 4) — dites-le dans votre rapport.
   - Les **REGEX** de l'allemand sont listées en commentaire en bas de chaque table : la plupart sont propres à l'allemand. Reprenez seulement l'équivalent néerlandais utile : `alt="(?:Logo Adermio|Adermio Logo)"` → `alt="Adermio-logo"` ; `>(\d{2}) ans<` → `>\1 jaar<` ; message d'erreur technique `e.message` → texte fixe néerlandais (décision 12 du glossaire). **Ne reprenez pas** le lien Impressum ni l'espace avant « % ».
3. Vérifiez sans écrire : `python3 tests/i18n/nl/apply_tr_nl.py <nom> --check` (échoue si une entrée est `None`, absente, ou si le compte est faux).
4. Appliquez : `python3 tests/i18n/nl/prep_nl.py <page FR>.html && python3 tests/i18n/nl/apply_tr_nl.py <nom>` (toujours régénérer la page AVANT d'appliquer : la page doit être reproductible par prep + table).
5. Contrôle : `python3 tests/i18n/nl/qa_nl.py nl/<page>.html` doit afficher `OK … issues=0 résidus=0`. Il détecte : structure ≠ FR, français restant, texte identique au FR, « u/uw », vocabulaire interdit, anglais, allemand. Un faux positif (mot néerlandais pris pour du français, marque…) : signalez-le dans votre rapport, ne tordez pas la traduction.
6. JavaScript et JSON-LD : `python3 tests/i18n/nl/jscheck_nl.py nl/<page>.html` doit afficher `OK` (node --check de chaque script inline + JSON-LD valide, comparé au FR). Une apostrophe néerlandaise (`foto's`, `'s ochtends`) dans une chaîne JS entre `'…'` casse le script : échappez-la (`\'`) ou utilisez `’`.
7. Relisez à voix haute, comme un Néerlandais qui découvre le site : naturel, fluide, crédible, même ton que le FR. Une phrase qui « sent la traduction » est une faute.

## À traduire

Tout ce qu'un visiteur ou un moteur de recherche lit : texte visible, `<title>`, `meta description`, `og:*`, `twitter:*`, JSON-LD (descriptions, FAQ…), `alt`, `title`, `aria-label`, `placeholder`, `<option>` visibles, chaînes JS affichées à l'écran (messages d'erreur, `textContent`, `innerHTML`, `alert`, libellés dynamiques, tableaux de textes), `<noscript>`.

## À ne JAMAIS toucher

Balises, classes, ids, `name`/`value` des champs de formulaire (les valeurs envoyées au serveur restent en français : `value="1-2 fois / mois"` reste tel quel, seul le libellé visible se traduit), clés d'objets JS, URLs, webhooks, logique JS, commentaires de code, noms de fichiers, marques, INCI. Le contrôle QA vérifie que la séquence de balises est identique au FR.

## Rapport final attendu (court, en français)

- Pages traitées + ligne QA `OK …` de chacune.
- Choix de traduction notables (et pourquoi), termes absents du glossaire que vous avez dû fixer (à ajouter au glossaire), faux positifs QA.
- Tout doute de fond pour le PDG (mention juridique, promesse produit ambiguë, texte FR qui semble faux).
