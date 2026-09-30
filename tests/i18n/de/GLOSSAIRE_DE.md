# Glossaire et guide de style — site Adermio en allemand

Référence unique pour toute traduction FR → DE du site adermio.com. Toute décision nouvelle s'écrit ici, section « Décisions du client » ou « Glossaire », AVANT d'être appliquée.

## Décisions du client (Antoine, 30/09/2026) — non négociables

1. **Registre « Sie »** partout (Sie, Ihr, Ihnen, Ihre — avec majuscule). Jamais « du ». Cohérent avec « vous » en FR, « Lei » en IT, « usted » en ES : Adermio est sérieux, professionnel.
2. **Zéro langage médical.** Adermio n'est pas un service médical. Interdits pour parler d'Adermio ou de ce qu'il fait : *Diagnose, diagnostizieren, Befund, Patient/Patientin, Therapie, heilen, Heilung, behandeln (au sens soigner)*. On dit : *Hautanalyse, Analyse, Auswertung, Einschätzung, Empfehlungen, Pflege, Pflegeroutine*. Quand le FR dit « diagnostic » → *Analyse*. Quand le FR dit « traiter l'acné » → *Akne gezielt pflegen / in den Griff bekommen*. Seule exception : parler du **traitement médical de l'utilisateur** (ex. « Suivez-vous un traitement ? ») → *Nehmen Sie Medikamente ein oder sind Sie in hautärztlicher Behandlung?* (c'est la réalité de l'utilisateur, pas une promesse d'Adermio).
3. **Prix : 5,99 €** partout (si le FR dit 4,99 €, écrire 5,99 €).
4. **Source = le français** : ton, structure et sens du FR. Ne pas partir de l'anglais ni de l'italien.
5. **Même ton que le FR** : rassurant, clair, précis, chaleureux sans familiarité, jamais alarmiste, jamais « marketing criard ».
6. **Jamais « Diagnose »**, nulle part, même en négation (« keine medizinische Diagnose » refusé) : on écrit *keine medizinische Beurteilung*. (Arbitrage PDG 30/09.)
7. **« klinisch / Klinik » interdits côté Adermio** (badge « Méthode clinique » → *Wissenschaftlich fundiert*). Dans la bibliographie, « essais cliniques randomisés » → *randomisierte kontrollierte Studien*. Contrôlé par `qa_de.py` (BANNED_RE).
8. **Consentement (case à cocher)** : on *akzeptiert* les Nutzungsbedingungen, on *nimmt* la Datenschutzerklärung *zur Kenntnis* — jamais « die Datenschutzerklärung akzeptieren ». Formule figée : « Ich akzeptiere die <a>Nutzungsbedingungen</a> und habe die <a>Datenschutzerklärung</a> zur Kenntnis genommen. » (liens aux mêmes places que le FR) ; erreur : « Bitte bestätigen Sie die Nutzungsbedingungen und die Datenschutzerklärung. »
9. **Témoignages** : jamais supprimés ni réécrits sur le fond (y compris « keine Zeit für den Hautarzt ») ; **un même avis = le même texte allemand sur toutes les pages** (référence : `home.py`).
10. **Pied de page** : © 2026 sur toutes les pages DE ; **lien Impressum obligatoire sur chaque page qui a un pied de page** (§ 5 DDG). S'il manque dans le FR (ex. `contact.html`), on l'ajoute par une entrée REGEX de la table (balise `<a>` copiée d'un lien voisin) et on déclare l'ajout dans `STRUCT_ALLOWED` de `qa_de.py`. Le lien « AGB » reste vers `/cgv` (pas d'AGB allemandes pour l'instant).
11. **Messages d'erreur montrés au client** : jamais de message technique (`err.message`, « Failed to fetch », « Token », « jobId », « URL », « Kennung », « Konsole/F12 »). Toujours une phrase allemande claire qui dit quoi faire (ex. « Dieser Link ist unvollständig. Bitte öffnen Sie den Link aus Ihrer E-Mail erneut. »). Si le JS affiche `e.message`, on remplace l'expression par un texte fixe (REGEX), puis `node --check`.
12. **Nombres calculés en JS** : virgule décimale (`3,8/5` via `.replace('.', ',')`), espace avant % (`42 %`), semaines « Wo. 1 », pluriels Tag/Tage.

## Style allemand

- Phrases courtes et directes. Un Allemand doit lire un site écrit par des Allemands : pas de calques du français (« Découvrez… » ≠ *Entdecken Sie…* systématique ; varier : *Erfahren Sie*, *So funktioniert's*, ou une affirmation directe).
- Anglicismes : seulement ceux que le public allemand utilise vraiment dans la beauté (*Routine, Serum, Feedback, Blog, Scan, Online*). Préférer *Hautpflege* à *Skincare*, *Inhaltsstoffe* à *Ingredients*.
- Personnes : s'adresser au lecteur (« Sie ») ou dire *Menschen mit Akne*, *über 10.000 Menschen* ; au besoin *Nutzerinnen und Nutzer*. Jamais *Nutzende*, pas d'astérisque de genre (Gendersternchen), pas de « :innen ».
- Titres : casse de phrase (seuls le premier mot et les noms prennent la majuscule, comme toujours en allemand).
- Boutons : infinitif ou impératif « Sie » court (*Analyse starten*, *Weiter*, *Zurück*, *Jetzt analysieren*). Doivent tenir sur mobile : viser la même longueur que le FR, au pire +30 %.
- Guillemets allemands : „…“. Apostrophe : seulement là où l'allemand l'exige (*So funktioniert's*).
- Nombres : virgule décimale (`2,5`), point des milliers (`10.000`), espace avant % (`98 %`), prix `5,99 €`. Dates : `30. September 2026` ou `30.09.2026`. Heures : `14:30 Uhr`.
- Mots composés allemands : attention à la largeur mobile (*Hautanalyse*, *Unreinheiten*, *Datenschutzerklärung*). Si un libellé de bouton ou de badge dépasse nettement le FR, chercher plus court.
- Témoignages : prénoms conservés, texte traduit naturellement (comme une vraie cliente allemande l'écrirait).

## Glossaire figé

### Navigation et pages
| FR | DE |
|---|---|
| Accueil | Startseite |
| Faire l'analyse | Analyse starten |
| Analyser ma peau / Démarrer mon analyse / Faire mon analyse gratuite (CTA dans le contenu, bouton mobile) | Kostenlose Hautanalyse starten — au plus 2 formes pour entrer dans le formulaire : *Analyse starten* (navigation) et *Kostenlose Hautanalyse starten* (contenu) |
| À propos | Über uns |
| Nous contacter / Contact | Kontakt |
| Conditions d'utilisation | Nutzungsbedingungen |
| Mentions légales | Impressum |
| Politique de confidentialité | Datenschutzerklärung (lien court : Datenschutz) |
| Sources | Quellen |
| Avis clients / Témoignages | Erfahrungen (notes : Bewertungen) |
| Page « Feedback » (formulaire de retour) | Feedback |
| Blog | Blog |
| Tous droits réservés | Alle Rechte vorbehalten |

### Produit Adermio
| FR | DE |
|---|---|
| analyse (de peau) | Hautanalyse / Analyse |
| analyse gratuite | kostenlose Hautanalyse |
| dossier complet / analyse complète / service complet / analyse premium | Komplettanalyse (le PDF : Ihr PDF-Bericht) |
| bouton de paiement / débloquer | Für 5,99 € freischalten |
| rapport | Bericht |
| résultats | Ergebnisse |
| bilan cutané | Hautauswertung / Ihre Haut im Überblick (« Hautbild » = seulement l'aspect de la peau, le teint) |
| paiement unique | Einmalzahlung |
| sans abonnement | kein Abo |
| satisfait ou remboursé | Geld-zurück-Garantie — seulement avec des conditions écrites validées par un juriste (« Garantie » = terme juridique, § 443/479 BGB) ; sinon : *Geld zurück, wenn Sie nicht zufrieden sind* |
| routine personnalisée | persönliche Pflegeroutine |
| routine matin / soir | Morgenroutine / Abendroutine |
| plan d'action | Ihr Fahrplan |
| facteurs aggravants | Titre : Was Ihre Akne verschlimmert ; texte : begünstigende Faktoren / Faktoren, die Akne begünstigen |
| projection / évolution | Ausblick (voraussichtlicher Verlauf) / Verlauf — jamais « Prognose » (médical) |
| bilan J28 | 28-Tage-Check (texte : Zwischenstand nach 28 Tagen) |
| second cycle | zweite Runde — JAMAIS « Zyklus » (= cycle menstruel en allemand) |
| phase de correction / de stabilisation | Intensivphase / Stabilisierungsphase |
| scan (vidéo) | (Video-)Scan |
| prendre les photos | Fotos aufnehmen |
| importer manuellement | Fotos hochladen |
| photo de face / profil gauche / profil droit | Foto von vorne / linkes Profil / rechtes Profil. **Exception `de/form.html`** : libellés « Linke Seite / Rechte Seite » (décision de mise en page du PDG : « Rechtes Profil » passait sur 2 lignes à 360 px et décalait les vignettes). Ailleurs : *Linkes / Rechtes Profil*. |
| angles du scan (`facescan.js`) | Vorne / Leicht re. / Profil re. / Weit re. / Leicht li. / Profil li. / Weit li. (jamais « R / L » seuls) |
| gros plan | Nahaufnahme |
| intelligence artificielle (IA) | künstliche Intelligenz (KI) |
| analyse dermatologique par IA (titres, SEO) | KI-Hautanalyse (jamais « dermatologische Analyse ») |
| algorithme | Algorithmus |
| indice de fiabilité | Zuverlässigkeit (ex. « Zuverlässigkeit: 87 % ») |
| protocole / plan de soins | Pflegeroutine (ou *Routine*) — **jamais « Pflegeplan »** ; si c'est le plan d'action : *Ihr Fahrplan* |
| Premium (analyse web payante, titres compris) | Komplettanalyse — *Premium* est réservé à l'abonnement de l'app |
| diagnostic expert (titres, SEO) | KI-Hautanalyse (jamais « Experten-Hautanalyse ») |
| méthode clinique | Wissenschaftlich fundiert |
| analyse comparative | Vergleichsanalyse |
| suivi | Begleitung (jamais « Tracking » dans le texte courant ; juridique : *tägliche Erfassung / Aufzeichnungen*) |
| observance | Regelmäßigkeit |
| score final (bilan J28) | Score an Tag 28 |
| semaine (axes de graphiques) | Wo. 1, Wo. 2 … (jamais « W1 », jamais « KW ») |
| purge (purging) | Erstverschlimmerung |
| sexe « Autre » | Divers (terme légal allemand) |
| zone (nom générique) | Bereich ; *Zone* seulement dans *T-Zone*, *U-Zone*, *Zone für Zone* |
| Avis n°3/10 (carrousel d'avis) | Kundenstimme 3 von 10 (jamais « Bewertung #3/10 », lu comme une note) |
| Adermio Lab, Adermio AI Core | invariables |

### Peau et imperfections
| FR | DE |
|---|---|
| peau | Haut |
| type de peau | Hauttyp |
| peau mixte / grasse / sèche / normale / sensible | Mischhaut / fettige Haut / trockene Haut / normale Haut / empfindliche Haut |
| acné | Akne |
| acné inflammatoire / rétentionnelle / hormonale | entzündliche Akne / Mitesser-Akne (texte : nicht entzündliche Akne, vor allem Mitesser ; dans les blogs, préciser une fois « (komedonale Akne) ») / hormonelle Akne |
| imperfections | Unreinheiten |
| boutons | Pickel |
| boutons rouges (inflammatoires) | entzündete Pickel (« rote Pickel » admis dans le texte courant) |
| boutons avec pus / pustules | eitrige Pickel / Pusteln |
| papules | entzündete Knötchen (« Papeln » seulement entre parenthèses) |
| points noirs | schwarze Mitesser (« Mitesser » seul = noirs ET blancs) |
| points blancs / microkystes | weiße Mitesser (précision : geschlossene Mitesser) — jamais « Mikrozysten » |
| pores dilatés | vergrößerte Poren |
| marques rouges (post-acné) | rote Pickelmale |
| taches brunes (post-acné) | dunkle Pickelmale (« Pigmentflecken » seulement au sens général) |
| cicatrices (d'acné) | (Akne-)Narben |
| rougeurs | Rötungen |
| brillance / excès de sébum | Glanz / überschüssiger Talg |
| déshydratation | Feuchtigkeitsmangel |
| inflammation | Entzündung |
| poussée | Schub (Akne-Schub) |
| guérison / phase de guérison | Erholungsphase / die Haut beruhigt sich (jamais « heilen ») |
| rechute | erneuter Schub / wenn die Pickel wiederkommen — jamais « Rückfall » |
| sévérité légère / modérée / sévère | badge : leicht / mittel / stark ; texte : leichte / mittelschwere / stark ausgeprägte Akne ; « sévérité » = Ausprägung |
| zones : front / joues / menton / nez / mâchoire / autour de la bouche / tempes / zone T | Stirn / Wangen / Kinn / Nase / Kieferbereich / rund um den Mund / Schläfen / T-Zone (« Kinn- und Kieferbereich » seulement dans les textes sur l'acné hormonale, jamais à côté d'un bouton « Kinn ») — **jamais « Kieferpartie »** |

### Termes courants de la page d'accueil
| FR | DE |
|---|---|
| hygiène de vie | Lebensstil / Alltag |
| facteurs déclencheurs / causes | Ursachen und Auslöser |
| erreurs fréquentes | häufige Fehler |
| gestes quotidiens | tägliche Schritte |
| données cryptées | verschlüsselt |
| sans filtre, sans maquillage | ohne Filter, ungeschminkt |
| épiderme | Haut |
| Avant / Après ; Transformations | Vorher / Nachher |
| peau à tendance acnéique (produits) | unreine, zu Akne neigende Haut |

### Soins
| FR | DE |
|---|---|
| soin(s) | Pflege / Pflegeprodukt(e) |
| nettoyant | Reinigung / Reinigungsgel |
| hydratant | Feuchtigkeitspflege / Feuchtigkeitscreme |
| sérum | Serum |
| crème solaire / SPF | Sonnencreme (produit) / Sonnenschutz (catégorie) ; toujours « LSF », jamais « SPF » (ex. LSF 50+) |
| exfoliant | Peeling |
| actifs | Wirkstoffe |
| ingrédients / INCI | Inhaltsstoffe / INCI |
| non comédogène | nicht komedogen |
| dermatologue | Hautarzt (formel : Dermatologe) ; préférer l'adjectif « hautärztlich » (hautärztlicher Rat) |
| expertise dermatologique | dermatologisches Fachwissen |
| pharmacie / parapharmacie | Apotheke (par défaut, « auch online ») / Drogerie seulement si la marque y est réellement vendue |

### Juridique (traduction fidèle, droit français inchangé)
| FR | DE |
|---|---|
| RGPD | DSGVO |
| CNIL | CNIL (französische Datenschutzbehörde) — première occurrence explicitée |
| responsable du traitement | Verantwortlicher |
| sous-traitant | Auftragsverarbeiter |
| personne concernée | betroffene Person |
| données personnelles | personenbezogene Daten |
| données de santé | Gesundheitsdaten |
| droit de rétractation | Widerrufsrecht |
| conditions générales de vente | Allgemeine Geschäftsbedingungen (AGB) |
| éditeur du site | Anbieter / Betreiber der Website |
| hébergeur | Hosting-Anbieter |
| Utilisateur (défini) | Nutzer (défini, masculin générique admis dans les définitions juridiques) |
| licence non exclusive | einfaches Nutzungsrecht |
| dernière mise à jour / en vigueur depuis | Stand: TT.MM.JJJJ |
| obligations comptables | gesetzliche Aufbewahrungspflichten nach Handels- und Steuerrecht |
| données « sensibles » (art. 9) | besondere Kategorien personenbezogener Daten |
| cookies et traceurs | Cookies und ähnliche Technologien |
| Sentry (raison sociale) | Functional Software GmbH (Sentry) — même libellé partout |
| « passible de sanctions » | … kann … geahndet werden (possibilité, jamais « wird geahndet ») |

## Ne jamais traduire
Balises, classes, ids, `name`/`value` des champs (valeurs envoyées au serveur = français canonique), clés JS, URLs, webhooks, commentaires de code, marques, noms de produits, INCI, « Adermio ».

## Points signalés au PDG (risque juridique allemand, Abmahnung)
- Allégations chiffrées (« précision 98,5 % »), photos avant/après, « diagnostic précis » : traduites fidèlement (sans « Diagnose »), mais à faire valider par un juriste avant l'ouverture publique en Allemagne.

## Historique
- 30/09 : glossaire relu par un relecteur natif indépendant ; 25 corrections intégrées (Komplettanalyse, schwarze/weiße Mitesser, zweite Runde, Fahrplan, 28-Tage-Check, LSF…).
- 30/09 (soir) : 5 relectures natives (R1 copywriting, R2 terminologie/conformité, R3 UX, R4 blog + juridique, R5 rétro-traduction) appliquées dans les tables + arbitrages PDG (Diagnose/klinisch, consentement, titre d'accueil, profils du formulaire, Pflegeroutine, témoignages unifiés, © 2026, Impressum sur chaque pied de page, messages d'erreur, nombres JS, `facescan.js`).
