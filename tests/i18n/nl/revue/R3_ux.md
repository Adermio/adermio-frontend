# R3 — Relecture UX writing / microcopie (néerlandais natif) — 09/10/2026

Périmètre : parcours d'analyse (form, processing, processing2, success, premium, premium_second_cycle, second_cycle, processing_second_cycle, bilan, contact, feedback). J'ai relu chaque entrée de table dans son contexte réel : page FR source, page NL générée, CSS (largeurs, tailles de police) et JS (quand et comment chaque texte s'affiche).

Corrections : `revue/R3_corrections.py`. Elles ont été générées par script, FR et NL actuels repris par valeur. `apply_corrections.py --dry-run --only R3` donne 35 corrections à appliquer, 0 conflit, 0 refusée. Je les ai aussi appliquées dans une **copie** du site : `build_nl.py` passe (QA OK), `jscheck_nl.py` OK, `coherence_nl.py` OK.

| Gravité | Nombre |
|---|---|
| bloquant | 0 |
| améliore | 17 |
| goût | 18 |

## ⚠️ À lire avant d'appliquer : bug dans `set_nl.py` (outil, pas traduction)

`set_nl()` calcule la position de la chaîne NL avec `col_offset` / `end_col_offset` de l'AST. Ces positions sont en **octets UTF-8**, mais le script les ajoute à des positions en **caractères**. Dès que la valeur NL actuelle contient un caractère non ASCII (é, ë, ï, ü, —, “ ”, ’, €…), la fin de la zone remplacée glisse d'un octet par caractère accentué. Le remplacement mange alors la suite de la ligne (`, 1),`).

- Constaté sur une copie : la correction R3 `form` « crème op recept » fait planter `apply_corrections.py` (SyntaxError dans `form.py`). Le `--dry-run` ne le voit **pas**.
- Pire cas : si le glissement est de 3 octets, il mange exactement `, 1`. La ligne reste du Python valide, mais le compteur d'occurrences disparaît **sans erreur**.
- Cela touche **tous** les relecteurs : en néerlandais, la plupart des valeurs contiennent ë, é, — ou “ ”.

Correctif testé sur la copie (après le correctif, les 35 corrections R3 s'appliquent et le build est propre) :

```python
# dans set_nl(), à la place de la ligne spans.append(...)
lines = src.split('\n')
ch = lambda ln, col: len(lines[ln - 1].encode('utf-8')[:col].decode('utf-8'))
spans.append((off[n.lineno - 1] + ch(n.lineno, n.col_offset), off[n.end_lineno - 1] + ch(n.end_lineno, n.end_col_offset)))
```

Je n'ai pas modifié l'outil : mon périmètre se limite à 2 fichiers. À corriger **avant** tout `apply_corrections.py` sans `--dry-run`.

## Verdict

La microcopie est **bonne et prête à l'emploi**. Rien ne bloque le parcours. Les bases sont solides :

- « je » partout, aucun « u ».
- Ton chaleureux sans familiarité.
- Boutons système à l'infinitif (*Volgende, Beginnen, Annuleren, Versturen, Opnieuw beginnen, Verder wachten, Code kopiëren*), CTA marketing à l'impératif (*Bekijk je analyse, Start ronde 2, Download de app*).
- *Tik* partout.
- Messages d'erreur sans jargon technique (les `e.message` / « jobId » / « F12 » ont bien disparu).

Ce que j'ai corrigé relève de la finition : quelques textes qui ne collent pas à ce que fait vraiment la page, des doublons de traduction pour un même FR, deux risques de mise en page à 360 px, et des états de chargement au néerlandais un peu « traduit ».

## Problèmes systémiques

1. **États de chargement « Je X + infinitif… »** (*Je foto's verwerken…*, *Je persoonlijke routine samenstellen…*, *Je analyse afronden…*). Un lecteur néerlandais les comprend, mais la tournure sonne traduite et se lit d'abord comme une consigne (« termine ton analyse »). Ailleurs, le site utilise déjà le passif (*Je volledige analyse wordt geladen…*, *Je rapport wordt afgerond…*, *Je 28-dagencheck wordt geladen…*). J'aligne sur le passif, ou sur une tournure active naturelle (*Je foto's komen binnen…*). Les états sans « je » (*AI opstarten…*, *Huidzones analyseren…*) restent tels quels : c'est la convention néerlandaise.
   - Gravité **améliore** pour l'indication fixe de /nl/success, affichée en permanence sous le chargeur avec une icône baguette, donc vraiment ambiguë.
   - Gravité **goût** pour les sous-titres qui défilent.
2. **Un même FR traduit de deux façons d'une page à l'autre** :
   - *Reservekopie* / *Kopie per e-mail* ;
   - *Een moment geduld…* / *Nog heel even…* ;
   - *1. Voorkant* / *1. Gezicht (van voren)* ;
   - *Een foto* / *De foto van voren is verplicht* ;
   - *Tips voor een perfecte* / *de beste analyse* ;
   - *Het is drukker dan normaal…* / *Het is erg druk: …* ;
   - le slogan du pied de page de l'attente ronde 2, différent de toutes les autres pages et du glossaire.

   Tout est harmonisé.
3. **Textes qui ne collent pas au comportement réel (JS lu)** :
   - **Formulaire, e-mail** : « De e-mailadressen komen niet overeen » s'affiche aussi quand l'adresse est simplement invalide et identique dans les deux champs (`!emailRegex.test(email) || email !== confirm`). Le client ne comprend pas ce qu'il doit corriger. Nouveau texte : *Controleer je e-mailadres: het is ongeldig of de twee adressen komen niet overeen.*
   - **Formulaire, traitement (objectif « Stabiel houden »)** : « Gebruik je medicijnen… » (présent) apparaît au-dessus du sous-titre « Nu of in het verleden ». Une personne qui a pris de l'isotrétinoïne il y a 2 ans peut répondre « Nee ». Or c'est une donnée de sécurité. Le FR a le même défaut. Nouveau texte : *Medicijnen tegen acne, bijvoorbeeld een crème op recept?*, aligné sur le libellé court de l'autre objectif.
   - **Premium, après « Routine bevestigen »** : le titre disait *Je analyse is klaar!* alors qu'on vient de régénérer la routine. Nouveau texte : *Je routine is aangepast!*
   - **Attente gratuite, échec final** : le titre devient « Oeps! » et le bouton « Analyse opnieuw starten » apparaît, mais l'encadré disait *Dit duurt te lang* (au présent). Nouveau texte : *Dit duurde te lang*.
   - **Attente ronde 2 (étape 6 de second-cycle)** : *Volledig vergelijkend rapport na 56 dagen* s'affiche à côté du badge *Dag 28*, ce qui paraît contradictoire. Le 56 compte ronde 1 + ronde 2 : *… over beide rondes (56 dagen)*.
   - **Premium, erreur de chargement** : le même message couvre un lien expiré. « Probeer het later opnieuw » n'aide pas. On reprend le message de premium-second-cycle (*Vernieuw de pagina of stuur een e-mail naar contact@adermio.com.*).
4. **Erreurs d'upload** : 3 formulations pour le même échec. Le bilan disait seulement « Het uploaden is niet gelukt ». Il est aligné sur second-cycle, qui dit quoi vérifier (connexion).
5. **« Controle aanbevolen »** (modale « peu d'imperfections ») : en néerlandais, *controle* évoque d'abord le contrôle médical (« op controle bij de huisarts »). Remplacé par un titre qui dit quoi faire : *Controleer je foto*.

## Libellés à risque à 360 px — à vérifier visuellement

Estimations faites d'après les classes CSS (largeur utile, taille et graisse de police) et comparées au FR.

| Page | Élément | NL | FR | Risque | Action |
|---|---|---|---|---|---|
| bilan | 3 pastilles du haut (`flex`, sans retour à la ligne, 312 px utiles) | « 28/28 dagen » + « 100% » + « 14 dagen » ≈ 319 px | ≈ 256 px | « 28/28 dagen » passe sur 2 lignes dans sa pastille | **corrigé** : « 28/28 » (icône calendrier, même format que la carte « Afgevinkte dagen ») → ≈ 283 px |
| premium | tuile texture « Au choix » (3 colonnes, ~93 px, 12 px gras) | « Maakt me niet uit » | « Au choix » | +112 %, 2 lignes, tuiles inégales | **corrigé** : « Geen voorkeur » (~90 px). Écart au glossaire : à reporter dans `GLOSSAIRE_NL.md` si validé |
| second-cycle | badges de la frise (carré de 28 px, texte 9 px gras, `Dag&nbsp;N`) | « Dag 14 », « Dag 28 » ≈ 29 px | « J14 » ≈ 16 px | le texte blanc déborde d'~1 px de chaque côté sur fond blanc (bord du D / du 8 rogné) | non corrigé (choix testé par le traducteur). À zoomer sur un vrai 360 px ; repli possible : `Dag<br>28` (2 × 11 px tiennent dans 28 px) |
| second-cycle | boutons verdict produit (grille de 3, ~88 px, 11 px majuscules, sans padding horizontal) | « ⚠️ AANPASSEN » ≈ 88 px | « ⚠️ REVOIR » ≈ 64 px | +38 %, peut passer sur 2 lignes | non corrigé (terme du glossaire). Vérifier ; repli : « ⚠️ TWIJFEL » |
| bilan | colonne « écart » de la trajectoire (9 px majuscules + valeur en `text-lg`) | « VERSCHIL NA 90 DAGEN » / « +12 punten » | « ÉCART À J+90 » / « +12 pts » | +67 % ; tient, mais la ligne pointillée se réduit | vérifier |
| success | tuile de confiance (11 px majuscules, espacement 1 px) | « WETENSCHAPPELIJK ONDERBOUWD » | « MÉTHODE CLINIQUE » | tient en mobile (1 colonne) ; sur 2 lignes en desktop 3 colonnes | vérifier, terme imposé par la décision 4 |
| form | ligne « Ben je ergens allergisch voor? * » + boutons JA/NEE | — | — | le libellé passe sur 2 lignes, comme en FR | OK |
| premium | pied de la modale (`1fr auto 1fr`) | « Annuleren » + « Routine bevestigen » | « Annuler » + « Valider la routine » | calcul : 108 + 175 + 37 = 320 px, ça tient | OK |

## Vérifié, conforme (aucune correction)

- Boutons de navigation du formulaire (*BEGINNEN / VOLGENDE / ANALYSE STARTEN*, *START RONDE 2*) : longueur ≤ FR, formes cohérentes.
- Tuiles photo *Voorkant / Links / Rechts* + *Optioneel* : tiennent à 360 px.
- Bouton *Close-up toevoegen (optioneel)* : tient.
- Tuiles d'étapes de l'attente (2 colonnes) : plus courtes que le FR.
- Barre CTA collante du bilan (*Houd je vooruitgang vast* / *Doorgaan*) : tient sans être tronquée.
- Contact et feedback : erreurs claires, *Versturen / Bezig met versturen… / Feedback versturen* cohérents, étiquettes NPS du glossaire.
- `'Nee, geen'` (second-cycle) : le JS compare bien le libellé NL.

## Remarques hors table (pour information)

- **« Premium » comme palier de budget** (premium, tuile *Voordelig / Standaard / Premium*) : identique en FR, donc absent de la table. Le glossaire réserve *Premium* à l'abonnement de l'app. Si Antoine le souhaite, ajouter une entrée → *Luxe*.
- **Valeurs envoyées au webhook** : la durée part en néerlandais (*3-6 maanden*), comme en DE/ES/IT, tandis que la fréquence et les facteurs restent en FR canonique. À savoir pour le workflow n8n NL (phase 2).
- *Kies eerst: videoscan of foto's uploaden.* n'est jamais affiché : le scan est désactivé et l'import manuel est le mode par défaut. Rien à faire.
- Bilan, bouton *Analyseer je voortgang* : impératif sur une action système. La convention voudrait *Voortgang analyseren*. Je ne l'ai pas proposé, la forme actuelle reste acceptable.
