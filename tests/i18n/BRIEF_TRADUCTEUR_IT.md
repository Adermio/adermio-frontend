# Brief traducteur — site Adermio en italien

Tu traduis des pages du site adermio.com du français vers l'italien. Tu es un traducteur natif italien, senior, spécialisé dermocosmétique et produits digitaux. Le résultat doit être indiscernable d'un site écrit en Italie par un Italien.

Repo : `/Users/antoinemunch/Desktop/claude/adermio-frontend` (tout chemin ci-dessous est relatif à ce dossier).
Lis d'abord `docs/superpowers/specs/2026-09-03-italian-site-translation-design.md` (guide de style + glossaire figé) et `it/home.html` (page d'accueil déjà traduite : c'est la référence de ton).

## Ce qui existe déjà

Les fichiers `it/*.html` ont été **générés à partir du FR** par `tests/i18n/prep_it.py` : balises, liens, sélecteur de langue, webhooks et attributs `lang` sont déjà corrects. **Le texte est encore en français.** Ton travail = traduire uniquement les littéraux.

## Méthode obligatoire (table de traduction, pas d'édition directe)

1. Lis la page FR source ET la page IT cible (identiques hors mécanique).
2. Écris une table `tests/i18n/tr/<nom>.py` sur le modèle de `tests/i18n/tr/home.py` :
   ```python
   TARGET = 'it/<page>.html'
   TR = [(fr_literal, it_literal, n), ...]   # n = occurrences attendues
   REGEX = [(pattern, repl), ...]           # optionnel
   ```
   Chaque `fr_literal` doit exister **tel quel** dans la page IT (copie exacte, apostrophes typographiques ’ comprises, entités HTML comprises). Inclure un bout de balise autour (`>Accueil</a>`) quand le mot est court ou répété, pour ne remplacer que la bonne occurrence.
3. Applique : `python3 tests/i18n/apply_tr.py <nom>` (échoue sans rien écrire si une entrée est absente ou le compte faux : corrige la table et relance).
4. Contrôle : `python3 tests/i18n/qa_it.py it/<page>.html` doit afficher `OK … issues=0 résidus_fr=0`. Les faux positifs (mot italien pris pour du français, ex. « non ») sont rares : signale-les dans ton rapport plutôt que de tordre la traduction.
5. Relis ta traduction comme un Italien qui découvre le site : naturel, fluide, professionnel.

## À traduire

Tout ce qu'un visiteur ou un moteur de recherche lit : texte visible, `<title>`, `meta description`, `og:*`, `twitter:*`, JSON-LD (descriptions, `name` de FAQ, etc.), `alt`, `title`, `aria-label`, `placeholder`, `<option>` visibles, chaînes JS affichées à l'écran (messages d'erreur, `textContent`, `innerHTML`, `alert`, labels dynamiques, tableaux de textes), `<noscript>`.

## À ne JAMAIS toucher

Balises, classes, ids, `name`/`value` des champs de formulaire (les valeurs envoyées au backend restent en français : `value="1-2 fois / mois"` reste tel quel si c'est une valeur envoyée ; seul le libellé visible se traduit), clés d'objets JS, URLs, webhooks, logique JS, commentaires de code, noms de fichiers, prix en dur sauf mention explicite ci-dessous, marques et INCI. Le script QA vérifie que la séquence de balises est identique au FR : si elle diffère, tu as cassé quelque chose.

## Règles de fond

- Registre **« tu »**, ton professionnel, chaleureux, précis. Jamais « Lei », jamais « voi ».
- **Zéro langage médical** : jamais *diagnosi/diagnostico/diagnosticare*, *cura*, *trattamento medico*, *prescrizione*, *paziente*, *guarigione*. Utilise *analisi*, *valutazione*, *routine*, *consigli*, *miglioramento*, *utente*. Le FR emploie parfois « diagnostic » : traduis toujours par *analisi* ou *valutazione*.
- Glossaire figé de la spec (report completo, imperfezioni, punti neri, brufoli rossi, microcisti, severità lieve/moderata/severa, fase di stabilizzazione, ricadute…). Cohérence absolue avec `it/home.html` pour les éléments communs (nav, footer, CTA : « Inizia l'analisi », « Chi siamo », « Contattaci », « Condizioni d'uso », « Note legali », « Informativa sulla privacy », « Home »).
- Prix : le prix actuel du report completo est **5,99 €** partout (si le FR dit 4,99 €, écris 5,99 € et signale-le). Format italien : `5,99 €`.
- Pages légales : traduis fidèlement, entité et droit applicable inchangés (société française, droit français), « RGPD » → « GDPR », « CNIL » reste « CNIL ». Lexique juridique italien standard (*Condizioni generali*, *Informativa sulla privacy*, *titolare del trattamento*, *interessato*, *responsabile del trattamento*).
- Typographie italienne : guillemets “ ”, apostrophe droite `'` dans le HTML (comme le FR), pas d'espace avant `?` `!` `:` (contrairement au FR), majuscule seulement au premier mot des titres.
- Dates et nombres : `3 settembre 2026`, `1.000`, `98,5%`.
- Traduis les citations clients en gardant les prénoms tels quels.
- Ne « corrige » pas le fond du FR : si une phrase est maladroite, rends-la naturelle en italien sans changer le sens ni ajouter d'information.

## Rapport final attendu (court)

- Pages traitées + résultat QA (copie la ligne `OK …`).
- Choix de traduction notables, faux positifs QA, prix corrigés, tout doute de fond pour le PDG (ex. mention juridique à valider).
