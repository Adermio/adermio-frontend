# R1 — Relecture copywriting DE (natif, Allemagne) — 30/09/2026

Pages relues : de/home.html, de/form.html (HTML + JS), de/processing.html, de/processing2.html, de/success.html, de/ueber-uns.html, de/kontakt.html — comparées au FR source.
Base : QA technique OK sur les 7 pages (issues=0, résidus=0). Ici, uniquement le naturel, le ton, les calques et les fautes.
Rappel : les corrections passent par les tables `tests/i18n/de/tr_de/*.py` (prep + table), jamais par édition directe du HTML. Les balises (`<br>`, `<span>`, `<b>`, `<a>`) des propositions respectent la séquence existante.

## Corrections

| page | texte allemand actuel (exact) | proposition | raison courte | gravité |
|---|---|---|---|---|
| success | `Klinische Methode` (badge de confiance) | `Fundierte Methode` (ou `Wissenschaftliche Methode`) | « klinisch » = vocabulaire médical ; contraire à la décision n° 2 (zéro langage médical) et risque HWG/UWG en Allemagne | bloquant |
| form | `Ich habe die <a>Nutzungsbedingungen</a> und die <a>Datenschutzerklärung</a> gelesen und akzeptiere sie.` | `Ich akzeptiere die <a>Nutzungsbedingungen</a> und habe die <a>Datenschutzerklärung</a> zur Kenntnis genommen.` | En droit allemand on n'« accepte » pas une Datenschutzerklärung (c'est une information, pas un contrat) ; formulation standard des sites allemands, évite une Abmahnung. Même séquence de liens | bloquant |
| form | `Bitte akzeptieren Sie die Datenschutzerklärung.` | `Bitte bestätigen Sie die Nutzungsbedingungen und die Datenschutzerklärung.` | Aligné sur la case à cocher corrigée ci-dessus | important |
| home | `Zweifeln Sie nicht länger <br class="hidden md:block"> an Ihrer Haut. <br>` + `Verstehen Sie sie.` (titre d'accueil) | Recommandé : `Ihre Haut. <br class="hidden md:block"> <br>` + italique `Endlich verstanden.` (3 lignes à 360 px). Plus proche du FR : `Schluss mit dem Rätselraten. <br>` + italique `Verstehen Sie Ihre Haut.` (4 lignes) | Actuel = 5 lignes sur mobile, et « Verstehen Sie sie » (Sie sie) accroche à l'oreille. Les deux options sont courtes, fortes, idiomatiques | important |
| home | `Zweifeln Sie nicht länger <br>` + `an Ihrer Hautpflege.` (bloc CTA) | `Hautpflege <br>` + italique `ohne Rätselraten.` | Même lourdeur que le titre ; version courte et publicitaire, garde le sens « ne doutez plus de votre skincare » | important |
| home | `Akne ist kompliziert. Sie zu verstehen, sollte es nicht sein.` | `Akne ist komplex – sie zu verstehen, muss es nicht sein.` | « Sie » majuscule en début de phrase se lit comme le vouvoiement (« Vous comprendre ») ; le tiret remet « sie » en minuscule, sans ambiguïté | important |
| home | `Diese Menschen verstehen jetzt ihre Haut` | `Endlich verstehen sie ihre Haut` | « Diese Menschen » est lourd et sonne traduit ; « sie » en milieu de phrase évite la confusion avec « Sie » | important |
| home | `Wie viele andere bekommen auch Sie Ihre Haut wieder in den Griff – dank Wissenschaft und Technologie.` | `Viele haben ihre Haut dank Wissenschaft und Technologie wieder in den Griff bekommen. Jetzt sind Sie dran.` | L'actuel promet un résultat au lecteur (« vous allez y arriver ») alors que le FR parle des autres (« Rejoignez ceux qui ont… ») ; promesse risquée en droit allemand | important |
| home | `Ihre von der KI erstellte Komplettanalyse enthält all diese Inhalte.` | `Das steckt in Ihrer Komplettanalyse:` | Phrase administrative, participe étendu typique de la traduction ; l'intertitre allemand naturel est court | important |
| home | `und nennen Sie uns Ihren Namen sowie einen Kaufnachweis.` | `und schicken Sie uns Ihren Namen und einen Kaufnachweis.` | On ne « nennt » pas un justificatif (collocation fausse) | important |
| form | `Welche dieser Faktoren betreffen Sie in den letzten Monaten am meisten?` (HTML + JS, 2 occ.) | `Welche dieser Faktoren haben in den letzten Monaten bei Ihnen die größte Rolle gespielt?` | « in den letzten Monaten » appelle le parfait ; « betreffen Sie » est raide | important |
| form | `Ernährung / Exzesse (Zucker, Alkohol)` | `Ernährung (viel Zucker, Alkohol)` | « Exzesse » évoque la débauche/l'orgie, ton jugeant ; « viel Zucker » garde l'idée d'excès | important |
| form | `„Ich habe Akne (regelmäßig oder hartnäckig) und möchte sie loswerden.“` | `„Ich habe immer wieder oder hartnäckig Akne und möchte sie loswerden.“` | « regelmäßige Akne » ne se dit pas ; « immer wieder » = récurrente | important |
| form | `Ihre Antwort hilft der KI, Ihr eigenes Empfinden und Dinge zu verstehen, die auf Fotos kaum sichtbar sind.` | `So versteht die KI, wie Sie Ihre Haut selbst empfinden – und was auf Fotos kaum zu sehen ist.` | Zeugme bancale (« Empfinden und Dinge ») ; plus fluide | important |
| form | `Linke Seite` / `Rechte Seite` | `Linkes Profil` / `Rechtes Profil` | Glossaire figé (profil gauche/droit) ; cohérent avec le rapport et les autres pages | important |
| form | meta : `Der Adermio-Fragebogen für Ihre Experten-Hautanalyse. Fortschrittliche KI-Hautanalyse mit künstlicher Intelligenz.` | `Der Adermio-Fragebogen für Ihre Hautanalyse – fortschrittlich und KI-gestützt.` | Pléonasme « KI … mit künstlicher Intelligenz » (visible dans les aperçus de partage) | important |
| processing, processing2 | `Bewertung #${currentReviewIdx + 1}/10` | `Kundenstimme ${currentReviewIdx + 1} von 10` | Sous des avis, « Bewertung 3/10 » se lit comme une NOTE de 3 sur 10 ; « # » n'est pas un usage allemand | important |
| processing, processing2 | `Das ist möglich, wenn Ihre Haut makellos ist (Glückwunsch!), passiert aber oft, wenn das Foto <b>unscharf</b> ist oder zu wenig <b>Licht</b> hat.` | `Das kann bei makelloser Haut vorkommen (Glückwunsch!), passiert aber oft, wenn das Foto <b>unscharf</b> oder zu <b>dunkel</b> ist.` | Double « wenn » lourd ; une photo « hat » pas de lumière, elle est « zu dunkel ». Même séquence `<b>` | important |
| success | `Höheres Aufkommen als erwartet – Fertigstellung läuft …` | `Gerade ist viel los – wir stellen Ihre Analyse fertig …` | « Aufkommen » seul = jargon logistique ; ton du FR plus humain | important |
| success | `Sicherheitskopie` | `Kopie per E-Mail` | « Sicherheitskopie » = sauvegarde informatique (backup) ; ici il s'agit du PDF envoyé par mail | important |
| processing | `label: "Sicherer Empfang"` | `label: "Fotos sicher empfangen"` | « Sicherer Empfang » seul ne veut rien dire (réception radio ?) | important |
| home | `Technologie für Hautanalyse` (badge) | `Hautanalyse-Technologie` | Sans article, la tournure sonne incomplète | confort |
| home | `Pflegen Sie Ihre Haut nicht länger aufs Geratewohl.` | `Pflegen Sie Ihre Haut nicht länger ins Blaue hinein.` | « aufs Geratewohl » vieilli pour les 18-35 ans | confort |
| home | `Sofortige Ergebnisse (2 Min.)` | `Ergebnisse in 2 Minuten` | « Sofortig » + « 2 Min. » se contredisent | confort |
| home | `Unser Algorithmus erkennt die betroffenen Zonen und bewertet, wie stark Ihre Akne ausgeprägt ist.` | `Unser Algorithmus erkennt die betroffenen Bereiche und bewertet, wie stark Ihre Akne ausgeprägt ist.` | « Bereiche » = terme du formulaire (cohérence) ; « Zonen » plus technique | confort |
| home | `Gewohnheiten, die Sie besser ablegen, damit sich nichts verschlimmert.` | `Gewohnheiten, die Sie besser ablegen, damit sich Ihre Haut nicht verschlechtert.` | « damit sich nichts verschlimmert » est vague | confort |
| home | `Unsere KI erkennt verschiedene Formen von Akne (entzündliche Akne, Mitesser, geschlossene Mitesser …)` | `Unsere KI erkennt verschiedene Formen von Akne (entzündliche Akne, offene und geschlossene Mitesser …)` | Évite la répétition « Mitesser, geschlossene Mitesser » | confort |
| home | `ersetzt aber keine ärztliche Beratung durch medizinisches Fachpersonal.` | `ersetzt aber keinen Besuch beim Arzt oder Hautarzt.` | « ärztliche … medizinisches Fachpersonal » redondant | confort |
| home | `Ich habe bezahlt, aber keine E-Mail mit meiner Komplettanalyse erhalten. Was nun?` | `… erhalten. Was kann ich tun?` | « Was nun? » sonne abrupt / familier pour une FAQ | confort |
| home | `läuft die Hautanalyse automatisch und dauert etwa <b>1 Minute</b>.` | `läuft die Hautanalyse automatisch und dauert etwa <b>eine Minute</b>.` | Les nombres de un à douze s'écrivent en lettres dans un texte courant | confort |
| home, processing, processing2 | témoignages divergents : home `echt nicht teuer` / processing `wirklich nicht teuer` ; home `Übersichtliches PDF. Die empfohlenen Produkte bekommt man in der Apotheke.` / processing `Klares PDF. Die empfohlenen Produkte gibt es in der Apotheke.` ; processing `Präzise und hilfreich, es geht mir viel besser` | Unifier sur la version de l'accueil (`echt nicht teuer`, `Übersichtliches PDF…`, `Präzise und hilfreich, meiner Haut geht es viel besser`) | Même avis, deux textes : se voit si l'on passe d'une page à l'autre ; « es geht mir viel besser » sonne « guérison » | confort |
| form | `Ihre Angaben dienen der Erstellung Ihrer Analyse und helfen uns – streng anonymisiert –, unsere KI zu verbessern. Sie bleiben vertraulich.` | `Mit Ihren Angaben erstellen wir Ihre Analyse. Streng anonymisiert helfen sie uns außerdem, unsere KI zu verbessern. Sie bleiben vertraulich.` | Style nominal administratif (« dienen der Erstellung ») | confort |
| form | `Behandlung gegen Akne?` | `Hatten oder haben Sie eine Behandlung gegen Akne?` | Fragment sec ; question complète plus naturelle (sous-titre « Früher oder aktuell » conservé) | confort |
| form | `1-mal pro Woche` (à côté de `1–2-mal im Monat`) | `Einmal pro Woche` | « 1-mal » écrit en chiffre est laid ; en lettres pour un seul | confort |
| form | `z. B.: Ich habe kleine rote Pickel …` / `z. B.: Meine Haut ist okay …` (placeholders) | `z. B. Ich habe kleine rote Pickel …` / `z. B. Meine Haut ist okay …` | Pas de deux-points après « z. B. » en allemand | confort |
| form | `Wählen Sie zuerst den Scan oder das Hochladen von Fotos.` | `Bitte wählen Sie zuerst: Video-Scan oder Fotos hochladen.` | Plus clair, reprend les libellés des deux boutons | confort |
| form | `Das Foto konnte nicht gesendet werden.` / `Ihr Foto von vorne wurde noch nicht vollständig gesendet.` | `Das Foto konnte nicht hochgeladen werden.` / `Ihr Foto von vorne ist noch nicht vollständig hochgeladen.` | Pour une photo, on dit « hochladen » (terme du bouton « Fotos hochladen ») | confort |
| form | `Ihre Haut hat <br>` + `eine Geschichte.` | `Ihre Haut erzählt <br>` + `eine Geschichte.` | Tournure idiomatique plus vivante | confort |
| processing, processing2 | `Zeitüberschreitung` | `Das hat leider zu lange gedauert` | Jargon informatique (« timeout ») ; ton plus humain comme le FR | confort |
| processing, processing2 | `Vielleicht klappt es diesmal!` | `Vielleicht klappt es ja diesmal!` | Le « ja » rend la phrase naturelle et encourageante | confort |
| processing, processing2 | `Überprüfung empfohlen` | `Bitte kurz prüfen` | Plus direct, moins administratif | confort |
| processing, processing2 | `Ich bestätige: Das ist meine Haut` | `Passt so – das ist meine Haut` | « Ich bestätige » sonne formulaire juridique pour un simple bouton | confort |
| processing, processing2 | `Damit Ihre Pflegeroutine zuverlässig ist, empfehlen wir Ihnen, das Foto neu aufzunehmen.` | `Damit Ihre Pflegeroutine wirklich zu Ihrer Haut passt, empfehlen wir, das Foto neu aufzunehmen.` | Une routine n'est pas « zuverlässig » ; garde l'idée de fiabilité | confort |
| processing | `"Scan von Unreinheiten und Hautstruktur …"` | `"Unreinheiten und Hautstruktur werden gescannt …"` | Même forme que les autres étapes (« … wird/werden … ») | confort |
| processing, processing2 | `Wer die Haut zu oft reinigt, schädigt ihre Schutzbarriere` | `Wer die Haut zu oft reinigt, schädigt die Hautbarriere` | « Hautbarriere » = le terme courant en cosmétique allemande | confort |
| processing | `label: "Bericht wird erstellt"` (dans une liste de noms : `KI-Hautscan`, `Analyse der Unreinheiten`) | `label: "Berichterstellung"` | Homogénéité de la liste (noms, pas de phrase) — idem processing2 | confort |
| processing2 | `(3 Winkel) …` (×2) / `label: "KI-Scan aus mehreren Winkeln"` | `(3 Blickwinkel) …` / `label: "KI-Scan aus mehreren Blickwinkeln"` | « Winkel » seul = angle géométrique ; « Blickwinkel » déjà employé ailleurs | confort |
| processing2 | `"Erkennung Zone für Zone …"` | `"Zone für Zone wird analysiert …"` | Même forme que les autres étapes | confort |
| ueber-uns | titre/og : `Über Adermio — unsere Mission für KI-Hautanalyse` | `Über Adermio — unsere Mission: Hautanalyse mit KI` | « Mission für KI-Hautanalyse » est bancal | confort |
| ueber-uns | `Einfühlsamkeit` (valeur) | `Empathie` | Intertitre de valeur plus naturel et plus court | confort |
| ueber-uns | `und helfen gleichzeitig der Forschung, unsere KI weiter zu verbessern.` | `und fließen zugleich in die Forschung ein, mit der wir unsere KI weiter verbessern.` | « helfen der Forschung, unsere KI zu verbessern » : rection maladroite | confort |

## Hors copywriting, vu en passant (à arbitrer par Antoine)

- **kontakt** : le pied de page n'a pas de lien « Impressum » (le FR n'a pas « Mentions légales » sur contact). En Allemagne l'Impressum doit être accessible depuis chaque page (§ 5 DDG) : risque d'Abmahnung, à ajouter côté gabarit (pas une traduction).
- **processing / processing2 / success / kontakt** : `© 2025` et `Adermio © 2025` alors que home et ueber-uns ont `2026` (déjà ainsi en FR).
- **home** : durées incohérentes entre elles (héros `~30 Sek.`, liste `2 Min.`, FAQ `1 Minute`) — déjà ainsi en FR ; un Allemand le remarque.
- **processing** : `Ausgezeichnet 4,4/5 • Über 2.000 Bewertungen` et `98,5 %` sont des allégations chiffrées : déjà dans la liste « juriste » du glossaire, je confirme.

## Remarques sur le glossaire

- **« Datenschutzerklärung » dans les consentements** : ajouter une règle — on *akzeptiert* les Nutzungsbedingungen, on *nimmt* la Datenschutzerklärung *zur Kenntnis* (jamais « akzeptieren »).
- **« Méthode clinique », « clinique »** : ajouter *klinisch* à la liste des mots interdits (décision n° 2) ; équivalent : *fundiert / wissenschaftlich*.
- **« Autre » (sexe)** : figer *Divers* (bon choix, c'est le terme légal allemand).
- **« acné rétentionnelle » → « Mitesser-Akne »** : compréhensible mais peu usité ; *Komedonen-Akne* est le terme que les Allemands trouvent en ligne. Garder « Mitesser-Akne » dans le texte grand public est défendable ; à trancher.
- **« profil gauche / droit »** : l'entrée est bonne ; le formulaire ne la respecte pas (voir tableau).
