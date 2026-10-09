# R1 — Relecture copywriting NL (natif Amsterdam)

Périmètre : home, over_ons, form, success, processing, premium, second_cycle, blog_index, contact, feedback.
Question posée : un Néerlandais croirait-il que ce site a été écrit aux Pays-Bas ?

## Verdict : 8,5/10

Oui, la plupart du temps. Le texte est court, direct et chaleureux sans être familier. Le « je » est tenu partout et le vocabulaire est celui d'une marque de soin vendue chez Etos ou Douglas : *onzuiverheden, mee-eters, overtollige talg, dermocosmetica, drogist of apotheek*. Le formulaire, la page premium, le second cycle, le contact et l'index du blog sont à un niveau professionnel. Je n'y ai trouvé aucune faute bloquante.

Ce qui trahit encore la traduction : quelques calques de groupes nominaux français, dans la partie la plus vue du site (hero de l'accueil, FAQ) et sur quelques écrans de formulaire. Ils ne sont pas faux, mais on sent la structure française en dessous. Les 14 corrections proposées (9 « améliore », 5 « goût ») suffisent pour atteindre 9,5/10.

## Les 5 problèmes les plus importants

1. **Hero de l'accueil, la phrase la plus lue du site** : « … direct en privé, *aangedreven door* kunstmatige intelligentie ». *Aangedreven door* est le calque de « propulsée par » ou « powered by ». En néerlandais, ce mot évoque un moteur, pas un service. Proposé : « Een deskundige analyse met AI: direct en privé. » (la forme longue *kunstmatige intelligentie* figure déjà dans le `<title>`).
2. **Écran « peu d'imperfections » (processing)** : le titre « *Controle aanbevolen* » sonne comme un message système traduit. Proposé : « **Klopt deze foto?** », qui fait écho au bouton « Klopt, dit is echt mijn huid ». ⚠️ La même modale existe dans `processing2` (hors de mon périmètre) : il faut y reporter la même correction pour garder les deux parcours identiques.
3. **Formulaire, étape prénom** : « Hallo [prénom] » est suivi de « *Hiermee* stemmen we je analyse nauwkeurig af. » Ici, *Hiermee* (« avec ceci ») ne renvoie à rien, puisque les champs viennent après. Proposé : « Met deze gegevens stemmen we je analyse nauwkeurig af. »
4. **Formulaire, facteurs et en-tête confidentialité** : « Welke van deze factoren *spelen … het meest bij je*? » est bancal (l'idiome est *een rol spelen*), d'où « … spelen de laatste maanden bij je de grootste rol? ». Autre calque du français : « Privacy en *respect voor je gegevens* », remplacé par « Privacy en zorgvuldig gebruik van je gegevens ».
5. **FAQ de l'accueil** : « *Hoe lang* duurt de analyse? » doit s'écrire **Hoelang** (en un mot quand on demande une durée, règle de la Taalunie ; le formulaire l'écrit déjà ainsi). Dans la même FAQ, « Stuur ons een bericht *via* contact@… » devient « Stuur een e-mail *naar* contact@… ».

Également corrigé sur la page feedback : « het kompas *dat ons helpt om* beter te worden » devient « ons kompas om beter te worden ». « … voordat je *verstuurt* » manquait de complément (« voordat je je feedback verstuurt »).

## Remarques transverses

- **Ton** : fidèle au français, rassurant et jamais alarmiste. Les messages d'erreur sont clairs et disent quoi faire (décision 12 bien appliquée). Les témoignages sonnent comme de vrais avis néerlandais. Je n'y ai pas touché (décision 10).
- **Calques à surveiller sur les autres pages** : *aangedreven door*, *in dienst van* (pour « au service de » : préférer *ten goede komen aan* ou *ten dienste van*), *respect voor*, *Precisie van X*. En néerlandais, on préfère le verbe ou le mot composé au groupe nominal « de + de ».
- **Laissé volontairement tel quel, pour une question de largeur mobile (360 px)** : sur « Over ons », *Precisie van detectie* et *< 45 s*. Le bon néerlandais serait *Detectieprecisie* et *< 45 sec.*, mais la carte mesure environ 116 px de large : le composé (en majuscules) et *sec.* en `text-3xl` déborderaient. Il vaut mieux deux mots qui passent à la ligne qu'un mot qui déborde.
- **Examiné et gardé** : « Leer *hem* begrijpen » (*hem* pour *huid* est correct aux Pays-Bas ; un Flamand dirait *haar*, mais la phrase reste lisible). Également gardés : *Voorproefje*, *Reservekopie*, *Zij leerden hun huid begrijpen*, *Hetzelfde als eerst*, *Verdraagbaarheid & reacties*. Ils sont un peu plus marqués, mais idiomatiques.
- **Petites incohérences entre formulaire et second cycle**, alors que le FR est identique : « 1. Voorkant » / « 1. Gezicht (van voren) » et « Tips voor een perfecte analyse » / « Tips voor de beste analyse ». Je ne les ai pas corrigées : le glossaire fixe *Voorkant* pour les tuiles, et le libellé du second cycle est plus clair. À harmoniser dans un sens ou dans l'autre si Antoine le souhaite.
- **« jouw »** : la page feedback l'emploie trois fois (deux titres, plus « Jouw mening… »). Je l'ai gardé : *Jouw mening telt* est une formule figée, et dans le corps du texte il oppose « ta » mesure à « notre » boussole (décision 16 respectée).
