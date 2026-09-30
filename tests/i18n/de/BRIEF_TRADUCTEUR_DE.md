# Brief traducteur — site Adermio en allemand

Vous traduisez des pages du site adermio.com du **français** vers l'**allemand**. Vous êtes un traducteur natif allemand, senior, spécialisé en dermocosmétique et en produits numériques. Le résultat doit être indiscernable d'un site écrit en Allemagne par des Allemands, avec le ton du site français.

Dépôt : `/Users/antoinemunch/Desktop/claude/adermio-site` (tous les chemins ci-dessous sont relatifs à ce dossier).
**Lisez d'abord** `tests/i18n/de/GLOSSAIRE_DE.md` (décisions du client, style, glossaire figé). Il prime sur tout le reste.

## Ce qui existe déjà

Les fichiers `de/*.html` ont été **générés à partir du FR** par `tests/i18n/de/prep_de.py` : balises, liens, sélecteur de langue, webhooks et attributs `lang` sont corrects. **Le texte est encore en français.** Votre travail : traduire uniquement les littéraux.

Référence utile : `tests/i18n/tr/<page>.py` = table italienne de la même page (colonne de gauche = littéraux FR qui existaient le 03/09). Vous pouvez en reprendre les littéraux FR comme point de départ, **mais la page FR actuelle fait foi** : `--check` vous dira ce qui a changé. Ne recopiez jamais la traduction italienne.

## Méthode obligatoire (table de traduction, jamais d'édition directe du HTML)

1. Lisez la page FR source ET la page DE cible (identiques hors mécanique).
2. Écrivez `tests/i18n/de/tr_de/<nom>.py` :
   ```python
   # Table de traduction de/<page>.html (source <page FR>.html).
   TARGET = 'de/<page>.html'
   TR = [(fr_literal, de_literal, n), ...]   # n = occurrences attendues
   REGEX = []                                # optionnel : (pattern, repl)
   ```
   Chaque `fr_literal` doit exister **tel quel** dans la page DE (copie exacte, entités HTML comprises : `&eacute;`, `&nbsp;`, `’`…). Incluez un bout de balise (`>Accueil</a>`) quand le mot est court ou répété. Pour un texte identique répété N fois, une seule entrée avec n = N.
3. Vérifiez sans écrire : `python3 tests/i18n/de/apply_tr_de.py <nom> --check` (échoue si une entrée est absente ou le compte faux).
4. Appliquez : `python3 tests/i18n/de/apply_tr_de.py <nom>`.
   **Si vous devez corriger après application** : régénérez la page d'abord (`python3 tests/i18n/de/prep_de.py <page FR>.html`), corrigez la table, réappliquez. La page doit toujours être reproductible par prep + table.
5. Contrôle : `python3 tests/i18n/de/qa_de.py de/<page>.html` doit afficher `OK … issues=0 résidus=0`. Il détecte : structure ≠ FR, français restant, texte identique au FR, tutoiement, vocabulaire interdit, phrases anglaises. Un faux positif (mot allemand pris pour du français, marque…) : signalez-le dans votre rapport, ne tordez pas la traduction.
6. Relisez à voix haute, comme un Allemand qui découvre le site : naturel, fluide, crédible, le même ton que le FR.

## À traduire

Tout ce qu'un visiteur ou un moteur de recherche lit : texte visible, `<title>`, `meta description`, `og:*`, `twitter:*`, JSON-LD (descriptions, FAQ…), `alt`, `title`, `aria-label`, `placeholder`, `<option>` visibles, chaînes JS affichées à l'écran (messages d'erreur, `textContent`, `innerHTML`, `alert`, libellés dynamiques, tableaux de textes, dates formatées : `toLocaleDateString('fr-FR')` → `'de-DE'`), `<noscript>`.

## À ne JAMAIS toucher

Balises, classes, ids, `name`/`value` des champs de formulaire (les valeurs envoyées au serveur restent en français : `value="1-2 fois / mois"` reste tel quel, seul le libellé visible se traduit), clés d'objets JS, URLs, webhooks, logique JS, commentaires de code, noms de fichiers, marques, INCI. Le contrôle QA vérifie que la séquence de balises est identique au FR.

## Rapport final attendu (court, en français)

- Pages traitées + ligne QA `OK …` de chacune.
- Choix de traduction notables (et pourquoi), prix corrigés, faux positifs QA.
- Tout doute de fond pour le PDG (mention juridique, promesse produit ambiguë, texte FR qui semble faux).
