# R4 — Relecture blog + pages juridiques (relecteur natif flamand, Antwerpen)

Date : 09/10/2026. Périmètre : `blog_index`, `blog_huidtype`, `blog_waarom_acne`, `blog_hormonale_acne`, `blog_waar_acne`, `gebruiksvoorwaarden`, `privacyverklaring`, `juridische_informatie`, `bronnen`. Lu entrée par entrée, FR à gauche et NL à droite, d'après le glossaire (décisions client 1 à 17).

Corrections machine : `revue/R4_corrections.py`, soit **27 corrections : 0 bloquante, 16 « améliore », 11 « goût »**. Contrôle `apply_corrections.py --dry-run --only R4` : 27 à appliquer, 0 conflit, 0 refusée.

## Verdict global

La traduction est de très bon niveau. Le néerlandais est naturel, sans calque visible du français, avec des phrases courtes et le bon registre « je ». Le glossaire est respecté : aucune « diagnose », aucun « dermatoloog » pour désigner Adermio, aucun « behandelen » quand c'est Adermio qui agit, et « opflakkering », « mee-eters » et « actieve ingrediënten » sont bien employés. Les pages juridiques sont fidèles : je n'ai trouvé ni ajout, ni omission, ni clause adoucie ou durcie. La terminologie AVG est juste.

Je n'ai rien trouvé de bloquant. Les corrections portent sur un contresens léger, quelques images ou expressions maladroites, trois tournures qui gênent un lecteur flamand, et une ambiguïté de vocabulaire dans la privacyverklaring.

## Blog

### `blog_index` — bon
- Titres des cartes et accroches justes, cohérents avec les articles.
- Goût : la description JSON-LD a perdu « par Adermio ».

### `blog_huidtype` (Welk huidtype heb je?) — bon, 4 retouches
- **Image malvenue** : « een gemengde huid … heeft twee gezichten ». En néerlandais, *twee gezichten hebben* veut dire être hypocrite. Proposé : *combineert twee soorten huid*.
- **Calque illogique** : « Die indeling is genetisch » (une classification n'est pas génétique). Proposé : *Je huidtype is genetisch bepaald en grotendeels erfelijk…*
- **SEO** : la requête néerlandaise et flamande la plus courante est « huidtype bepalen ». C'est le slug de la page, mais elle manque dans le `<title>`. Proposé : *Huidtype bepalen: welk huidtype heb je? De complete gids*. Le H1 ne change pas.
- Goût : *talgregulerende* plutôt que *regulerende* (« actifs régulateurs »).
- Bien vu : *tissuetest*, *huidtype vs. huidconditie*, *vochtarme huid*, *rijpere huid* sont les termes en usage dans la beauté néerlandophone.

### `blog_waarom_acne` (Waarom krijg je acne?) — très bon, 1 contresens léger
- **Contresens léger** : « Mais la cause initiale, elle, reste presque toujours la même » est traduit par « het begint bijna altijd op dezelfde plek » (« au même endroit »). Proposé : *Maar de eerste oorzaak is bijna altijd dezelfde*.
- **Flandre** : *tentamenperiode* est néerlandais (Pays-Bas) ; en Flandre on dit *examens*, et le texte écrit d'ailleurs « examens » deux lignes plus haut. Proposé : *examenperiode*, compris partout.
- **Expression** : *in rondjes draaien* sonne fautif. Proposé : *in kringetjes ronddraaien*.
- Goût : « Pourtant » est rendu par « namelijk » (la logique de la phrase change) → *Toch* ; « Niet waar, althans niet zo gesteld » est raide → *Zo gesteld klopt het niet*.
- Santé : les termes sont exacts (*overmatige verhoorning*, *open/gesloten comedo*, *ice pick/boxcar*, *corticosteroïden*, *isotretinoïne*). Les traitements médicaux sont bien attribués au médecin, jamais à Adermio. Le titre « Wanneer ga je naar de huisarts of dermatoloog? » est bien adapté à la réalité NL et BE.

### `blog_hormonale_acne` (Hormonale acne: herkennen en aanpakken) — très bon, 3 remarques flamandes
- **Belgicisme** : « maak je beter zo snel mogelijk een afspraak » suit la construction belge (*je doet/neemt beter…*). En néerlandais standard : *kun je beter … een afspraak maken*.
- **Huisarts seul** : aux Pays-Bas, l'acné passe d'abord par le huisarts. En Belgique, on va souvent directement chez le dermatologue. L'article « Waarom krijg je acne? » dit d'ailleurs *huisarts of dermatoloog*. J'ai harmonisé le H2 et la phrase d'introduction de la liste.
- **Verloskundige** : c'est le terme néerlandais (en Flandre : *vroedvrouw*, et la grossesse y est surtout suivie par le gynécologue). Le FR dit « un professionnel de santé ». Proposé : *een arts of andere zorgverlener*, neutre des deux côtés.
- **« de huid… zijn talgproductie »** : en Flandre, *huid* est féminin (*haar*). J'ai reformulé sans pronom.
- Goût : *aan de hand van de kalender* plutôt que *agenda* ; *onderste derde* plutôt que *onderste derde deel* ; *verheven* plutôt que *verdikt* pour les cicatrices (même FR que dans l'autre article, qui dit *verheven*).
- Écart voulu, à garder : le FR dit « nodules ou microkystes douloureux, sous la peau ». Le glossaire traduit *microkystes* par *witte mee-eters*, ce qui serait faux ici : le FR utilise le mot au sens de lésions profondes. *knobbels of cysten* rend le vrai sens.
- Omission acceptable : « (la fameuse « ligne mandibulaire ») ». En néerlandais, *kaaklijn* est déjà le mot courant, donc la parenthèse serait redondante.

### `blog_waar_acne` (Waar ontstaat acne…) — très bon
- **Exactitude** : « Dit heet “mechanische” acne: puistjes **op de wangen** die… » laisse croire que l'acné mécanique est propre aux joues, ce que le FR ne dit pas. J'ai supprimé « op de wangen ».
- Goût : le paragraphe « Voorhoofd » commence par une phrase alambiquée (« Acne op je voorhoofd ontstaat in een vette zone… »). Je propose de suivre le FR, comme pour les autres zones.
- Remarque, sans correction : l'intertitre et la barre de graphique **« Slapen »** (tempes) peuvent se lire « dormir » quand ils sont isolés. Dans la liste des zones, le sens reste clair. Le terme fixé par le glossaire est gardé.

## Pages juridiques

### `gebruiksvoorwaarden` — fidèle, terminologie juste
- Les termes sont corrects : *handelingsbekwaamheid*, *ouderlijk gezag*, *opzegging / opschorting / beëindiging*, *spant zich naar beste vermogen in* (obligation de moyens), *verveelvoudiging*, *dwingende bepalingen*, *Franse rechter*, *Europees Frankrijk*, *in de zin van*.
- **Décision 17** : au §12, « La poursuite de l'utilisation … vaut acceptation » est traduit par *Wie de dienst blijft gebruiken…, aanvaardt die versie*. Il faut *de Gebruiker* et la formule juridique de l'acceptation présumée. Proposé : *Blijft de Gebruiker de dienst gebruiken …, dan geldt dat als aanvaarding van die versie.*
- **Fidélité** : au §8, « modifier, suspendre ou supprimer **toute** fonctionnalité » devient *functies te wijzigen*. J'ai rétabli *elke functie*, pour garder la portée exacte de la clause, signalée à part dans POINTS_JURIDIQUES.
- Goût : *rechten en verplichtingen* (terme juridique) plutôt que *rechten en plichten* (registre moral), dans la meta-description.
- Le reste est fidèle, y compris les incohérences du FR que la traduction reproduit volontairement (« sans préavis » suivi de « notification 30 jours avant », plafond de responsabilité). Elles figurent dans POINTS_JURIDIQUES.

### `privacyverklaring` — fidèle, 1 ambiguïté à lever
- Les termes AVG sont justes : *verwerkingsverantwoordelijke*, *verwerker(sovereenkomst)*, *bijzondere categorieën van persoonsgegevens*, *uitdrukkelijke toestemming*, *gerechtvaardigd belang*, *adequaatheidsbesluit*, *standaardcontractbepalingen*, *inzage / rectificatie / wissing / beperking / overdraagbaarheid / bezwaar*, *datalek* (le terme de l'Autoriteit Persoonsgegevens). La CNIL est bien explicitée à la première occurrence.
- **Ambiguïté** : chez Adermio, *productanalyse(s)* se lit « analyse de produits cosmétiques », alors que le FR désigne l'analytique d'usage (PostHog). Le §5 dit déjà *PostHog-gebruiksstatistieken*. J'ai harmonisé en *gebruiksstatistieken* au §3 (finalités) et au §4 (tableau des verwerkers), et fait de même dans `juridische_informatie`.
- Goût : *Sessie-ID's* (FR « identifiants de session ») plutôt que *Sessiegegevens* ; *de artikelen 6 en 9*.
- À arbitrer, sans correction : le FR dit « pas de transfert **hors UE** » et le NL dit *buiten de **EER***, conformément au glossaire. L'EEE est un peu plus large que l'UE, donc la promesse est légèrement moins forte que l'original. C'est juridiquement le bon cadre (le RGPD raisonne en EEE), mais la traduction n'est pas strictement littérale. À trancher avec le juriste, sans urgence.

### `juridische_informatie` — fidèle
- Les libellés sont justes : *Verantwoordelijk voor de inhoud* (le Belge connaît *verantwoordelijke uitgever*, mais la forme choisie est neutre), *Btw-identificatienummer*, *openbaarmaking*, *kennelijk onrechtmatige inhoud*, *Fotoverantwoording*.
- J'ai aligné *Productanalyse* sur *Gebruiksstatistieken*, comme dans la privacyverklaring.

### `bronnen` — bon
- Les décisions 3 et 4 sont bien appliquées : *gerandomiseerde gecontroleerde studies* ; *geeft geen medisch advies en vervangt geen bezoek aan je huisarts of dermatoloog*. Aucune correction.

## Remarques flamandes sans correction (acceptables en néerlandais standard)
- *Art. 6 lid 1 sub b* : notation néerlandaise. Un juriste belge écrirait *art. 6.1, b)*, mais il la comprend sans peine.
- *gedoogd* (CGU §2), *mondkapje* (BE : *mondmasker*), *pony* (BE familier : *frou*), *pure chocolade* : tous compris en Flandre.
- Le pronom *het* pour reprendre « (hormonale) acne » (« Bij vrouwen wordt het vaak erger ») passe à l'écrit grand public aux Pays-Bas comme en Flandre.
