# R6 — Audit final de la version néerlandaise (eindredacteur, Utrecht) — 09/10/2026

Profil : néerlandais natif, 27 ans, eindredacteur dans une marque de soin premium, ancien UX-copywriter de webshop, ancien acnéique. Je découvre le site comme un visiteur : les 22 pages `nl/*.html` lues en entier, dans l'ordre du parcours (titres d'onglet, meta, texte visible, alt, placeholders, messages JS affichés). Ensuite seulement : glossaire, tables, relectures R1 à R5, ARBITRAGE et POINTS_JURIDIQUES (pour ne pas refaire un débat déjà tranché).

Question posée : *est-ce que je crois, à chaque ligne, que ce site a été écrit par des Néerlandais pour des Néerlandais ? Est-ce que je confierais mes photos et € 5,99 à cette marque ?*

## Verdict

**Note globale : 9,2/10 (9,4 une fois les 12 corrections appliquées).**

**Prêt pour un public néerlandais, sur la langue.** Le néerlandais est naturel, direct et cohérent. Le « je » est tenu partout, sans un seul « u ». Le vocabulaire est celui d'un rayon Etos ou Kruidvat : *onzuiverheden, mee-eters, overtollige talg, acnevlekjes, drogist of apotheek*. Les blogs se lisent comme de vrais articles néerlandais. Le parcours payant est clair. Je n'ai trouvé ni faute d'orthographe, ni reste de français, d'anglais ou d'allemand dans le texte visible, ni erreur d/t, de trema ou de mot composé. Les contrôles le confirment : `qa_nl.py` OK sur les 22 pages, et les recherches regex que j'ai faites en plus (d/t, *als/dan*, trema's, mots composés coupés, *hun/hen*, résidus FR/EN/DE, mots en double) ne trouvent rien.

Ce qui reste relève de la finition : un texte d'aide désinvolte au mauvais moment, deux « zie hoe » calqués du français, une meta peu naturelle, un titre d'onglet au mauvais format, et quelques détails de ponctuation ou de répétition.

**La langue n'est plus le problème. Le fond l'est** (voir la dernière partie). Un Néerlandais méfiant ne bloquera pas sur une phrase, mais sur trois choses :
- après la page d'attente, le parcours passe à l'anglais ;
- la FAQ promet « nooit met derden », alors que la privacyverklaring cite Google et OpenAI aux États-Unis ;
- la page 28-dagencheck joue sur la peur.

## Notes par page (« sonne néerlandais »)

| Page | Note | En une ligne |
|---|---|---|
| home | 9 | Hero et FAQ naturels. Le slogan du pied de page reste un peu « traduit », mais il est fixé par le glossaire. |
| over-ons | 8,5 | Correct mais emphatique : *Huidexpertise, binnen ieders bereik*, *strenge maatstaven*, *Je privacy is heilig*. Le ton d'un manifeste français traduit. C'est du fond, donc pas corrigé. |
| form | 9,5 | Très bon UX writing. Seuls défauts : « wat **jouw** huid » et « 3 hoeken ». |
| processing | 9,5 | États de chargement idiomatiques. *Klopt deze foto?* est excellent. |
| processing2 | 9,5 | Identique à processing. |
| success | 9 | « Geen probleem » au moment où le client s'inquiète de son achat. |
| premium | 9 | Bonne modale. « Bijv. **M**ijn » ; « Gel, fluid, water » est acceptable. |
| premium-second-cycle | 8,5 | Titre d'onglet « Adermio - Analyse ronde 2 » et meta calquée (« Zie hoe… van ronde 2 van Adermio »). |
| bilan | 9 | La langue est bonne (« Vergelijk … en zie je vooruitgang » est à corriger). Le ton est un problème de fond, voir plus bas. |
| second-cycle | 9 | Fluide. Meta « zie hoe », « Bijv. **I**k ». |
| analysis-in-progress-second-cycle | 9,5 | Rien à signaler. |
| contact | 9,5 | Rien à signaler sur la langue. Il y a deux meta descriptions, une structure héritée du FR. |
| feedback | 9 | *Neem geen blad voor de mond* est très juste. *ons kompas* est un peu pompeux, mais c'est le FR. |
| blog/index | 9 | Meta « …, van Adermio » ; « echt » trois fois sur la carte acné. |
| blog/huidtype-bepalen | 9,5 | Très bon. Il reste « zelfs … zelfs » dans la phrase d'ouverture (non intégré : conflit avec R2, voir plus bas). |
| blog/waarom-krijg-je-acne | 9,5 | Très bon. Une seule tournure parlée. |
| blog/hormonale-acne | 9,5 | Le meilleur texte du site. |
| blog/waar-ontstaat-acne | 9,5 | Très bon, chiffres bien typographiés (107.840). |
| gebruiksvoorwaarden | 9 | Traduction fidèle d'un droit français. Elle se lit comme telle, ce qui est voulu (décision 17). |
| privacyverklaring | 9 | Terminologie AVG juste (*verwerker, rechtsgrond, datalek*). |
| juridische-informatie | 9 | Fidèle, rien à signaler. |
| bronnen | 9,5 | Rien à signaler. |

## Problèmes restants, par gravité

Machine : `revue/R6_corrections.py`, **12 corrections : 0 bloquante, 5 « améliore », 7 « goût »**. `apply_corrections.py --dry-run --only R6` donne 12 à appliquer, 0 conflit, 0 refusée. Le `--dry-run` complet (R1 à R6 + ARBITRAGE) donne 12 à appliquer, 0 conflit, 0 refusée. J'ai aussi tout appliqué sur une **copie** du site : `build_nl.py`, `qa_nl.py`, `jscheck_nl.py` et `coherence_nl.py` passent, et les 12 textes apparaissent dans les bonnes pages. Le dépôt n'a pas été modifié.

### Bloquant : aucun

### Améliore (5)

1. **success, modale « Nog heel even… »** : *Nog geen analyse ontvangen? **Geen probleem.*** → ***Geen zorgen.*** Le client vient de payer et n'a rien reçu. *Geen probleem* est la réponse à un « merci » et sonne désinvolte. *Geen zorgen* est la formule déjà employée par la FAQ de l'accueil pour la même situation.
2. **form, étape 1** : « Onze technologie analyseert wat **jouw** huid nodig heeft en stelt een routine op maat voor je samen » → **je huid**. C'est la décision 16 : *jouw* seulement pour insister. Le mélange *jouw … voor je* dans la même phrase sonne bancal.
3. **bilan, avant/après** : « Vergelijk dag 1 **en** dag 28 en **zie je** vooruitgang » → « Vergelijk dag 1 **met** dag 28 en **bekijk** je vooruitgang ». La préposition est *vergelijken met*. *Zie je* se lit aussi « tu vois » et calque « voyez ».
4. **premium-second-cycle, meta, og et twitter** (aperçu quand on partage le lien) : « Zie hoe je huid is veranderd met de vergelijkende analyse van ronde 2 van Adermio. Meet je vooruitgang na 28 dagen met je routine. » → « Bekijk met de vergelijkende analyse van Adermio hoe je huid in ronde 2 is veranderd. Meet je vooruitgang na 28 dagen routine. » Cela supprime le calque, le double *van* et la lourdeur.
5. **blog/index, meta description** (extrait affiché par Google) : « Deskundig advies dat iedereen begrijpt, **van Adermio**. » → « Deskundig advies van Adermio, helder voor iedereen. » Le « van Adermio » rejeté en fin de phrase est un calque de « par Adermio ».

### Goût (7)

6. **premium-second-cycle, `<title>`** : « Adermio - Analyse ronde 2 » → « Analyse ronde 2 — Adermio ». C'est le seul onglet du site au format « Adermio - X ».
7. **second-cycle, meta** : « zie hoe je huid is veranderd » → « bekijk hoe… », même raison que le point 4.
8. **blog/index, carte « Waarom krijg je acne? »** : « …om de **echte** oorzaken te herkennen » → « om de oorzaken te herkennen ». Le mot *echt* apparaît trois fois en deux lignes avec le titre.
9. **blog/waarom-krijg-je-acne, mythe du soleil** : « vaak heftiger dan **hoe je huid ervoor was** » → « vaak heftiger dan **je acne daarvoor was** ». La version actuelle est une tournure parlée, et c'est l'acné qu'on compare.
10. **form, bouton photos** : « Camera of galerij · 3 hoeken » → « … · **vanuit** 3 hoeken ». *3 hoeken* seul se lit d'abord « 3 coins ». La longueur reste celle du FR.
11. **premium, placeholder** : « Bijv. **M**ijn hydraterende crème… » → « Bijv. **m**ijn… ». Après l'abréviation, la phrase continue : minuscule, comme « (bijv. aspirine…) » dans le formulaire.
12. **second-cycle, placeholder** : « Bijv. **I**k gebruik sinds kort… » → « Bijv. **i**k… », même règle.

### Non intégré : à arbitrer (conflit avec R2)

- **blog/huidtype-bepalen, première phrase** : « Zonder dat antwoord kunnen **zelfs** de beste producten weinig uithalen, of **zelfs** averechts werken. » Le double *zelfs* se remarque. R2 a déjà réécrit cette entrée (pour garder le modal *kunnen*), et toute autre proposition y crée un conflit dans `apply_corrections.py`. Si Antoine est d'accord, il faut ajouter dans `ARBITRAGE.py` (OVERRIDE) la valeur suivante, qui garde le *kunnen* de R2 : « … Zonder dat antwoord kunnen **ook** de beste producten weinig uithalen, of zelfs averechts werken. … » (le reste de l'entrée est inchangé).

### Hors table (impossible à corriger par une entrée NL)

- **premium, tuile budget « Premium »** : le texte est identique en FR, il n'y a donc pas d'entrée dans la table. Le glossaire réserve *Premium* à l'abonnement de l'app (R3 l'a déjà noté). Si on veut le changer, il faut ajouter une entrée (*Luxe*).
- **contact** : deux `<meta name="description">` différentes (héritées du FR), et un pied de page sans « Juridische informatie » (structure du FR, décision 11). C'est invisible pour le visiteur, mais propre à corriger côté FR.
- **Libellés d'erreur d'upload** : « kon niet worden **verstuurd** » dans le formulaire, « kon niet worden **geüpload** » dans second-cycle et bilan. L'incohérence est mineure et les deux formes sont correctes.

### Examiné et gardé (pour ne pas rouvrir le débat)

- Décisions du client respectées, donc rien proposé : formule d'erreur de consentement (décision 9), étoiles *Moet beter / Kan beter…*, slogan *Huidverzorging, opnieuw uitgevonden met AI*, *Geen voorkeur*, *Voorkant / Links / Rechts*, prénoms des témoignages, « Tik » même sur ordinateur (bronnen).
- *Leer hem begrijpen* : déjà tranché par R1, correct aux Pays-Bas.
- *Twijfel niet langer **over** je huid* : c'est juste. *Twijfelen aan* voudrait dire « se méfier de sa peau ».
- *Medische aandachtspunten* : ce sont les données médicales de l'utilisateur, c'est l'exception de la décision 2.
- Autres formes correctes ou idiomatiques, gardées : *Hetzelfde als eerst*, *Gel, fluid, water*, *Goed om te weten: Volledige…* (majuscule possible quand plusieurs phrases suivent), *huidarts* dans un témoignage (voix d'une cliente), *Log in met Apple* et *Inloggen met Google* (libellés officiels), *fridge-to-plate / food insights* (déjà en anglais dans le FR).

## Points de FOND qui choqueraient un Néerlandais (signalés, pas réécrits)

R2 (`R2_termino.md`) et `POINTS_JURIDIQUES.md` en détaillent déjà la plupart. Ici, seulement l'ordre de gravité vu par un client néerlandais. Les points **nouveaux** sont marqués comme tels.

1. **Le parcours passe à l'anglais juste avant le paiement (nouveau)**. `processing` envoie vers `/free-analysis?…&lang=nl`. Cette page ne connaît pas `nl` et retombe sur l'anglais (`UX[lang] || UX.en`). Le résultat gratuit, le bouton de paiement à € 5,99, le rapport payant (décision 14 : « pas encore de rapport néerlandais »), les e-mails et l'app sont donc en anglais. Le site ne l'annonce que pour la vidéo et les captures. Pour un Néerlandais, c'est la rupture de confiance numéro un, au pire moment. Il faut soit une mention claire avant le paiement (« je rapport is (nog) in het Engels »), soit attendre la phase 2.
2. **Promesses de confidentialité contradictoires (en partie nouveau)**. La FAQ de l'accueil dit « Je foto's worden … direct geanalyseerd **op onze beveiligde servers. We delen ze nooit met derden.** » La privacyverklaring dit que les photos partent chez **Google (Gemini) et OpenAI, aux États-Unis**. Le visiteur néerlandais lit la privacyverklaring, et l'Autoriteit Persoonsgegevens aussi. À cela s'ajoutent des points déjà relevés : « geanonimiseerd » et « 100% vertrouwelijk » alors que les photos sont liées au compte (R2 n° 4), et « elke analyse maakt onze AI slimmer » alors que la privacyverklaring dit « nooit gebruikt om AI-modellen te trainen » (R2 n° 3).
3. **Page 28-dagencheck anxiogène** : « De moeite van 28 dagen gaat verloren », « Je resultaten zijn nog kwetsbaar », « 90 dagen celvernieuwing » (le blog dit 28 à 40 jours), « 73% gaat door », € 10 barré → € 5. Aux Pays-Bas, on se méfie très vite du marketing par la peur (R2 n° 1 et 11 ; NL : BW 6:193h).
4. **Chiffres incohérents d'une page à l'autre**. Précision : 98,5% sur l'accueil, 98% sur over-ons. Durée de l'analyse : « binnen enkele seconden », « ~30 sec. », « < 45 sec. », « ongeveer 1 minuut », « 2 min. », « binnen een paar minuten ». Le Néerlandais attentif le remarque (R2 n° 7).
5. **Preuve sociale sans source** : « Uitstekend 4,4/5 • ruim 2000 beoordelingen », sans lien ni plateforme (Omnibus, Reclamecode). Voir POINTS_JURIDIQUES.
6. **Témoignages et avant/après (en partie nouveau)**. Tous les prénoms sont français (Camille, Léa, Chloé, Nassim, Élise…), les « 107.840 analyses » du blog sont des données francophones, et la carte d'**Élise M. (42 jaar) n'a que des étoiles, sans texte** (même chose en FR). Une carte vide fait « faux avis ». Il y a aussi un avis d'une personne de 17 ans, et l'avis « geen tijd voor de huidarts » contredit la FAQ (R2 n° 6). La décision 10 interdit d'y toucher, mais il vaut mieux assumer « marque française » que donner l'impression de le cacher.
7. **Bandeau app sur premium (nouveau)** : « Je analyse staat klaar in de Adermio-app ». L'app n'existe pas en néerlandais et seulement sur l'App Store (CGU §6). Il faut la même transparence que pour la vidéo.
8. **Cookies et traceurs** : « alleen strikt noodzakelijke cookies », alors que le pixel TikTok et Clarity se chargent sans bannière (POINTS_JURIDIQUES, risque élevé : l'AP contrôle activement).
9. **Paiement** : sans iDEAL, un Néerlandais hésite, voire abandonne (phase 2 du glossaire). Les CGV n'existent qu'en français (POINTS_JURIDIQUES).
