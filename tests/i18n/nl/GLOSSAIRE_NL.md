# Glossaire et guide de style — site Adermio en néerlandais

Référence unique pour toute traduction FR → NL du site adermio.com. Toute décision nouvelle s'écrit ici, section « Décisions du client » ou « Glossaire », AVANT d'être appliquée. Un relecteur ne défait JAMAIS une décision du client.

## Décisions du client (Antoine, 09/10/2026) — non négociables

1. **Registre « je / jij / jouw »** partout (je, jij, jou, jouw — minuscules). **Jamais « u / uw »**. C'est le standard aux Pays-Bas, y compris en dermocosmétique (La Roche-Posay NL, Eucerin NL) et dans l'information médicale officielle (Thuisarts.nl). Chaleureux, jamais familier : pas de « hey », pas de « super », pas d'argot, pas d'émojis ajoutés. Le sérieux vient du contenu, pas du pronom. (`qa_nl.py` refuse tout « u / uw / uzelf ».)
2. **Zéro langage médical.** Adermio n'est pas un service médical. Interdits pour parler d'Adermio ou de ce qu'il fait : *diagnose, diagnosticeren, diagnostisch, patiënt, therapie, therapeut, genezen, genezing, klinisch, kliniek, werkzame stof* (vocabulaire des notices de médicaments → *actieve ingrediënten*), et *behandelen / behandeling / behandelplan* quand c'est Adermio qui agit. On dit : *huidanalyse, analyse, inschatting, advies, aanbevelingen, verzorging, (huidverzorgings)routine*. Quand le FR dit « diagnostic » → *analyse*. Quand le FR dit « traiter l'acné » → *acne gericht aanpakken / onder controle krijgen*. Seule exception : le **traitement médical de l'utilisateur** (ex. « Suivez-vous un traitement ? ») → *Gebruik je medicijnen tegen acne, bijvoorbeeld van je huisarts of dermatoloog?* (aux Pays-Bas l'acné est d'abord suivie par le huisarts ; c'est la réalité de l'utilisateur, pas une promesse d'Adermio).
   - **« dermatoloog » est un titre protégé** (Wet BIG) : jamais *dermatoloog*, *AI-dermatoloog*, *dermatologisch* pour désigner Adermio ou son analyse. « Notre dermatologue IA » → *onze AI* (ex. « L'avis de notre dermatologue IA » → *Wat onze AI adviseert*) ; « analyse dermatologique » → *AI-huidanalyse* ; « expertise dermatologique » (le domaine) → *kennis uit de dermatologie*. *dermatoloog* reste permis pour parler d'un vrai médecin (« demandez l'avis de votre dermatologue »).
   - **Repli quand le prénom manque** (« Cher(e) patient(e) », `'Patient'` en JS) : jamais un nom de remplacement → *Hallo* ou une phrase sans nom.
3. **Jamais « diagnose »**, nulle part, même en négation (« geen medische diagnose » refusé) : on écrit *geen medisch advies* ou *vervangt geen bezoek aan je huisarts of dermatoloog*.
4. **« klinisch / kliniek » interdits côté Adermio** (badge « Méthode clinique » → *Wetenschappelijk onderbouwd*). Dans la bibliographie, « essais cliniques randomisés » → *gerandomiseerde gecontroleerde studies*.
5. **Prix : € 5,99** partout (notation de la Taalunie, NL et BE : signe € devant, **espace insécable**, virgule → en HTML `€&nbsp;5,99`, en JS `€\u00a05,99`, en JSON-LD/meta une espace simple). Jamais « 5,99 € » ; « 5,99 euro » admis dans une phrase. Si le FR dit 4,99 €, écrire **€ 5,99** (le 4,99 € du FR est obsolète).
6. **Source = le français** : ton, structure et sens du FR. Ne jamais partir de l'anglais ni de l'allemand.
7. **Même ton que le FR** : rassurant, clair, précis, chaleureux sans familiarité, jamais alarmiste, jamais « marketing criard ».
8. **Néerlandais standard** (*Algemeen Nederlands*) : naturel aux Pays-Bas, lisible en Flandre. Éviter les tournures trop locales des deux côtés :
   - belgicismes : *gsm, goesting, amai, ingeven* (→ *invullen*), *bijkomend* (→ *extra*), *consultatie* (→ *consult / afspraak*), *kuisen* (→ *reinigen*), *verwittigen* (→ *laten weten*), *gelieve* ;
   - tics hollandais trop familiers pour une marque premium : *even* (« vul even… »), *hoor, hè, gewoon* (adverbe de remplissage), *hartstikke, joh, toppie, Hoi* (salutation : *Hallo* ou rien), *lekker* pour une crème, *gezellig*.
9. **Consentement (case à cocher)** : on accepte les gebruiksvoorwaarden, on a *lu* la privacyverklaring — jamais « akkoord met de privacyverklaring ». Formule figée : « Ik ga akkoord met de <a>gebruiksvoorwaarden</a> en heb de <a>privacyverklaring</a> gelezen. » (liens aux mêmes places que le FR) ; erreur : « Om verder te gaan, ga je akkoord met de gebruiksvoorwaarden en bevestig je dat je de privacyverklaring hebt gelezen. »
10. **Témoignages** : jamais supprimés ni réécrits sur le fond ; prénoms conservés ; traduits comme une vraie cliente néerlandaise l'écrirait. **Un même avis = le même texte néerlandais sur toutes les pages** (référence : `tr_nl/home.py`).
11. **Pied de page** : *© 2026 Adermio. Alle rechten voorbehouden.* sur toutes les pages (si le FR dit © 2025, écrire © 2026). Structure du pied de page = celle du FR (aucun lien ajouté).
12. **Messages d'erreur montrés au client** : jamais de message technique (`err.message`, « Failed to fetch », « Token », « jobId », « URL », « console / F12 »). Toujours une phrase néerlandaise claire qui dit quoi faire (ex. « Deze link is onvolledig. Open de link uit je e-mail opnieuw. »). Si le JS affiche `e.message`, on remplace l'expression par un texte fixe (entrée REGEX de la table), puis `node --check`.
13. **Nombres calculés en JS** : virgule décimale (`3,8/5` via `.replace('.', ',')`), pourcentage collé (`42%`), semaines « week 1 » (« wk 1 » seulement si la place manque), pluriels dag / dagen.
15. **Typographie française à supprimer** (faute visible en néerlandais) : aucune espace (ni `&nbsp;`) avant `! ? : ;` ; guillemets « » → “ ” ; « J1 / J7 / J28 / J+90 » → *dag 1 / dag 7 / dag 28 / na 90 dagen* (badge *Dag 28*, « 0/28j » → *0/28 dagen*) ; « Mo » → *MB* ; « +2000 avis » → *ruim 2000 beoordelingen*. (`qa_nl.py` contrôle les espaces, « », J28 et Mo.)
16. **« je » d'abord** : *je huid, je routine* ; *jouw / jij* seulement pour insister ou opposer (*Jouw huid, jouw routine* dans un titre, une fois). *we* plutôt que *wij* (sauf insistance). « Veuillez / Merci de / N'hésitez pas à » → impératif simple avec *je* (*Vul je e-mailadres in.*) ; jamais *Gelieve…*, *Wij verzoeken je…*, *Aarzel niet om…*.
17. **Textes juridiques** : là où le FR parle de « l'Utilisateur » à la 3e personne, garder **de Gebruiker** (3e personne) ; ne pas passer au « je » au milieu d'une clause.
14. **Visuels** : captures du rapport et vidéo de l'accueil = versions **anglaises** (pas encore de rapport néerlandais). Si un texte annonce la vidéo ou les captures, ne pas promettre qu'elles sont en néerlandais.

## Style néerlandais

- Phrases courtes et directes. Le néerlandais du web est plus direct que le français : couper les phrases longues, supprimer les tournures emphatiques. Pas de calques (« Découvrez… » ≠ *Ontdek…* à chaque phrase ; varier : *Zo werkt het*, *Lees hoe…*, ou une affirmation directe).
- Anglicismes : seulement ceux que le public néerlandais utilise vraiment en beauté (*routine, serum, scan, feedback, blog, online, AI, SPF, exfoliant, make-up, glow*). *Huidverzorging* dans le texte courant ; *skincare* / *skincareroutine* admis quand le FR emploie lui-même « skincare » ou dans un titre marketing court. *ingrediënten* plutôt que *ingredients*, *reiniger* plutôt que *cleanser*. *AI* le plus souvent possible (forme longue *kunstmatige intelligentie* une seule fois).
- Personnes : s'adresser au lecteur (« je ») ou dire *mensen met acne*, *meer dan 10.000 mensen* ; au besoin *gebruikers*.
- Titres : casse de phrase (seul le premier mot et les noms propres prennent la majuscule).
- Boutons **système** à l'infinitif ou nom (*Volgende, Vorige, Terug, Versturen, Opslaan, Annuleren, Kopiëren, Bevestigen*) ; boutons **marketing** à l'impératif avec je (*Start je gratis huidanalyse*, *Download de app*). Toucher l'écran = *Tik* (*Tik om toe te voegen*), jamais *Druk* ni *Klik*. Même longueur que le FR, au pire +30 % : doivent tenir sur mobile (360 px).
- Mots composés : en un mot (*huidverzorgingsroutine*, *acnelittekens*, *ochtendroutine*) — attention à la largeur mobile ; si trop long dans un bouton ou un badge, reformuler (*je routine*).
- Orthographe : Groene Boekje (*foto's*, *e-mail*, *ideeën*, *poriën*, *ingrediënten*, *T-zone*, *28-dagencheck*, *pdf*, trémas : *geüpload, geïrriteerd, isotretinoïne, retinoïden*). Trait d'union pour les composés avec chiffre (*28-dagencheck*, *7-stappenplan*). Dans une chaîne JS entre `'…'`, l'apostrophe de *foto's* doit être échappée (`\'`).
- Guillemets : “…” (apostrophe typographique ’ dans *foto’s* seulement si le FR utilise déjà ’ autour ; sinon `'`).
- Nombres : virgule décimale (`2,5`), point des milliers à partir de 5 chiffres (`10.000` ; `2000` sans point), pourcentage collé (`98%`), prix `€ 5,99` (insécable), dates **`9 oktober 2026`** de préférence (neutre NL/BE), heures `14.30 uur`, abréviations avec point (*sec., min., max.*), tailles de fichier *MB*.

## Glossaire figé

### Navigation et pages
| FR | NL |
|---|---|
| Accueil | Home |
| Faire l'analyse (navigation) | Start je analyse |
| Analyser ma peau / Démarrer mon analyse / Faire mon analyse gratuite (CTA de contenu, bouton mobile) | Start je gratis huidanalyse — au plus 2 formes pour entrer dans le formulaire : *Start je analyse* (navigation) et *Start je gratis huidanalyse* (contenu) |
| À propos | Over ons |
| Nous contacter / Contact | Contact |
| Conditions d'utilisation | Gebruiksvoorwaarden |
| Mentions légales | Juridische informatie |
| Politique de confidentialité | Privacyverklaring (lien court : Privacy) |
| Sources | Bronnen |
| Avis clients / Témoignages | Ervaringen (notes : beoordelingen) |
| Feedback | Feedback |
| Blog | Blog |
| Tous droits réservés | Alle rechten voorbehouden |

### Produit Adermio
| FR | NL |
|---|---|
| analyse (de peau) | huidanalyse / analyse |
| analyse gratuite | gratis huidanalyse |
| dossier complet / analyse complète / service complet / analyse premium (web) | volledige analyse (le PDF : je pdf-rapport) — *Premium* est réservé à l'abonnement de l'app |
| bouton de paiement / débloquer | Ontgrendel voor € 5,99 |
| rapport | rapport |
| résultats | resultaten |
| bilan cutané | huidoverzicht / je huid in één oogopslag |
| paiement unique | eenmalige betaling |
| sans abonnement | geen abonnement |
| satisfait ou remboursé | *Niet tevreden? Geld terug.* — jamais « garantie » (terme juridique) sans conditions écrites |
| routine personnalisée | persoonlijke huidverzorgingsroutine / persoonlijke routine |
| routine matin / soir | ochtendroutine / avondroutine |
| plan d'action | je stappenplan |
| facteurs aggravants | titre : *Wat je acne erger maakt* ; texte : *wat je acne verergert* / *triggers* |
| projection / évolution | verwachting (*Verwachting na 90 dagen*) / verloop — jamais « prognose » ni « vooruitzicht » |
| bilan J28 | 28-dagencheck (texte : *je resultaten na 28 dagen*) ; « Bilan mi-parcours » (J14) → *tussentijdse check* |
| second cycle (l'offre) | tweede ronde ; libellés *Ronde 1 / Ronde 2*, *Start ronde 2*, *Met ronde 2 / Zonder vervolg* — JAMAIS « cyclus » pour l'offre (*menstruatiecyclus* dans le formulaire et le renouvellement de la peau en ~28 jours restent permis) |
| phase de correction / de stabilisation | intensieve fase / stabilisatiefase |
| scan (vidéo) | (video)scan |
| prendre les photos | foto's maken |
| importer manuellement | foto's uploaden |
| photo de face / profil gauche / profil droit | foto van voren / linkerprofiel / rechterprofiel ; tuiles du formulaire (360 px) : *Voorkant / Links / Rechts* |
| gros plan | close-up |
| intelligence artificielle (IA) | kunstmatige intelligentie (AI) ; ensuite *AI* |
| analyse dermatologique par IA (titres, SEO) | AI-huidanalyse (jamais « dermatologische analyse ») |
| diagnostic expert (titres, SEO) | AI-huidanalyse |
| algorithme | algoritme |
| indice de fiabilité | betrouwbaarheid (ex. « Betrouwbaarheid: 87% ») |
| protocole / plan de soins | (huidverzorgings)routine — **jamais « behandelplan »** ; si c'est le plan d'action : *je stappenplan* |
| méthode clinique | Wetenschappelijk onderbouwd |
| analyse comparative | vergelijkende analyse |
| suivi | begeleiding / voortgang bijhouden (juridique : *dagelijkse registratie*) |
| observance | regelmaat |
| score final (bilan J28) | libellé *Eindscore* ; texte *score op dag 28* |
| semaine (axes de graphiques) | week 1, week 2 … (*wk 1* si la place manque) |
| purge (purging) | tijdelijke verergering (purging) |
| J1, J7, J28, J+90 | dag 1, dag 7, dag 28, na 90 dagen |
| Streak Max / Jours validés | Langste reeks / Afgevinkte dagen |
| sexe « Autre » | Anders |
| zone (nom générique) | zone / gebied (*T-zone*, *U-zone*) |
| Avis n°3/10 (carrousel) | Ervaring 3 van 10 |
| Adermio Lab, Adermio AI Core | invariables |

### Peau et imperfections
| FR | NL |
|---|---|
| peau | huid |
| type de peau | huidtype |
| peau mixte / grasse / sèche / normale / sensible | gemengde huid / vette huid / droge huid / normale huid / gevoelige huid (jamais « gecombineerde ») |
| acné | acne |
| acné inflammatoire / rétentionnelle / hormonale | ontstoken acne / acne met vooral mee-eters (blog, une fois : *comedonale acne*) / hormonale acne |
| imperfections | onzuiverheden |
| boutons | puistjes |
| boutons rouges (inflammatoires) | ontstoken puistjes (*rode puistjes* admis) |
| boutons avec pus / pustules | puistjes met pus / pustels |
| papules | ontstoken bultjes (*papels* seulement entre parenthèses) |
| points noirs | mee-eters (*zwarte mee-eters* si opposé aux blancs) |
| points blancs / microkystes | witte mee-eters (précision : *gesloten comedonen*) — jamais « microcysten » |
| pores dilatés | verwijde poriën |
| marques rouges (post-acné) | rode acnevlekjes |
| taches brunes (post-acné) | donkere acnevlekjes / pigmentvlekjes na acne |
| cicatrices (d'acné) | (acne)littekens |
| rougeurs | roodheid |
| brillance / excès de sébum | glans / overtollige talg (*talg* est un mot en *de*) |
| déshydratation | vochttekort |
| inflammation | ontsteking |
| poussée | opflakkering (*als je acne opflakkert* ; *een uitbraak van puistjes*) — jamais « opvlamming » (registre médical) |
| guérison / phase de guérison | herstel / *de huid komt tot rust* (jamais « genezen ») |
| rechute | *als de puistjes terugkomen* / een nieuwe opflakkering |
| sévérité légère / modérée / sévère | badge : *Lichte / Matige / Ernstige acne* ou *Ernst: matig* — **jamais « Matig » seul** (= « médiocre ») ; texte : lichte / matige / ernstige acne ; « sévérité » = ernst |
| zones : front / joues / menton / nez / mâchoire / autour de la bouche / tempes / zone T | voorhoofd / wangen / kin / neus / kaaklijn / rond de mond / slapen / T-zone |

### Termes courants de l'accueil
| FR | NL |
|---|---|
| hygiène de vie | leefstijl |
| facteurs déclencheurs / causes | oorzaken en triggers |
| erreurs fréquentes | veelgemaakte fouten |
| gestes quotidiens | dagelijkse gewoontes |
| données cryptées | versleuteld |
| sans filtre, sans maquillage | zonder filter, zonder make-up |
| Avant / Après ; Transformations | Voor / Na |
| peau à tendance acnéique (produits) | onzuivere huid / acnegevoelige huid |

### Soins
| FR | NL |
|---|---|
| soin(s) | verzorging / verzorgingsproduct(en) |
| nettoyant | reiniger / reinigingsgel |
| hydratant | hydraterende crème |
| sérum | serum |
| crème solaire / SPF | zonnebrandcrème (produit) / zonbescherming (catégorie) ; *SPF 50+* (jamais traduit) |
| exfoliant | exfoliant |
| actifs | actieve ingrediënten (jamais *werkzame stoffen*) |
| ingrédients / INCI | ingrediënten / INCI |
| non comédogène | niet-comedogeen |
| dermatologue (un vrai médecin) | dermatoloog (*huidarts* admis) ; jamais pour Adermio (titre protégé) |
| médecin traitant | huisarts |
| expertise dermatologique (le domaine) | kennis uit de dermatologie |
| pharmacie / parapharmacie | apotheek of drogisterij |

### Juridique (traduction fidèle, droit français inchangé)
| FR | NL |
|---|---|
| RGPD | 1re occurrence : *Algemene Verordening Gegevensbescherming (AVG, in het Engels GDPR)*, ensuite *AVG* |
| CNIL | CNIL (de Franse privacytoezichthouder) — première occurrence explicitée |
| responsable du traitement | verwerkingsverantwoordelijke |
| sous-traitant | verwerker |
| personne concernée | betrokkene |
| données personnelles | persoonsgegevens |
| données de santé | gezondheidsgegevens |
| droit de rétractation | herroepingsrecht |
| conditions générales de vente | algemene verkoopvoorwaarden |
| conditions générales d'utilisation | algemene gebruiksvoorwaarden |
| éditeur du site | uitgever van de website |
| hébergeur | hostingprovider |
| Utilisateur (défini) | Gebruiker |
| licence non exclusive | niet-exclusieve licentie |
| dernière mise à jour / en vigueur depuis | Laatst bijgewerkt: / Van kracht sinds |
| obligations comptables | wettelijke bewaarplichten (boekhouding) |
| données « sensibles » (art. 9) | bijzondere categorieën van persoonsgegevens |
| cookies et traceurs | cookies en vergelijkbare technieken |
| « passible de sanctions » | … kan worden bestraft (possibilité, jamais « wordt bestraft ») |

### Termes complémentaires (relecture native NL + BE, 09/10)
| FR | NL |
|---|---|
| profil de peau / sur-mesure | huidprofiel / op maat |
| Prénom / ans / Femme / Homme | Voornaam / jaar / Vrouw / Man |
| Requis / Optionnel | verplicht / optioneel ; *Dit veld is verplicht.* ; *Maak een keuze.* |
| Confirmez votre email / les emails ne correspondent pas | Herhaal je e-mailadres / *De e-mailadressen komen niet overeen.* |
| Appareil photo ou galerie / lumière naturelle | Camera of galerij / daglicht |
| Objectifs Corriger / Stabiliser | Aanpakken / Stabiel houden |
| facteurs : stress, règles, transpiration (sport), alimentation, manque de sommeil, frottements/rasage, nouveaux produits, rien de particulier | stress, menstruatie, zweten (sporten), voeding, te weinig slaap, wrijving / scheren, nieuwe producten, niets in het bijzonder (libellés visibles seulement ; les `value` restent en FR) |
| allergies / fruits à coque | allergieën / noten |
| enceinte ou allaitante | *Ben je zwanger of geef je borstvoeding?* |
| acide salicylique / hyaluronique, peroxyde de benzoyle, rétinoïdes, isotrétinoïne, spironolactone, corticoïdes, antibiotiques, zinc, huiles essentielles | salicylzuur (BHA), hyaluronzuur, benzoylperoxide, retinoïden, isotretinoïne, spironolacton, corticosteroïden, antibiotica, zink, etherische oliën |
| sébum / glandes sébacées / barrière cutanée / renouvellement cellulaire / grain de peau / teint terne / teint unifié / peau éclatante | talg / talgklieren / huidbarrière / celvernieuwing / huidstructuur / doffe huid / egale teint / stralende huid (glow) |
| sécheresse / irritation / kystes / SOPK / la pilule / contraception / androgènes / produits laitiers / index glycémique / follicule pileux | droogheid / irritatie / cysten / PCOS / de pil / anticonceptie / androgenen / zuivel / glykemische index / haarzakje |
| Le saviez-vous ? / Oups / Forte affluence / plus long que prévu | Wist je dat? / Oeps! / Het is erg druk / Dit duurt langer dan normaal |
| visage non détecté / réessayer / rafraîchir / connexion | Geen gezicht herkend / Probeer het opnieuw / Vernieuw de pagina / Controleer je internetverbinding |
| lien invalide / expiré ; Voir mon analyse | Deze link is ongeldig / verlopen ; Bekijk je analyse |
| Ressenti cutané (Irritée / Sensible / Neutre / Bien / Éclatante) | Hoe voelt je huid? (Geïrriteerd / Gevoelig / Neutraal / Goed / Stralend) |
| notes Décevant … Excellent ; Garder / Revoir / Arrêté | Teleurstellend / Onvoldoende / Redelijk / Goed / Uitstekend ; Houden / Aanpassen / Gestopt |
| L'IA peut faire des erreurs | Adermio AI kan fouten maken. |
| Paiement réussi / Commande confirmée / paiement sécurisé / reçu / facture / spams | Betaling gelukt / Bestelling bevestigd / Veilig betalen via Stripe / aankoopbewijs / factuur / *Kijk ook in je spammap* |
| budget / texture légère, riche / baume / au choix | voordelig / licht, rijk / balsem / *Maakt me niet uit* |
| Télécharger l'app / scans illimités | Download de app / Onbeperkt scannen |
| FAQ / Comment ça marche / Objet / Nom et prénom / au plus vite / Retour au site | Veelgestelde vragen / Zo werkt het / Onderwerp / Voor- en achternaam / zo snel mogelijk / Terug naar de website |
| recommandation (NPS) | *Hoe waarschijnlijk is het dat je Adermio aanraadt aan vrienden of familie?* (Zeer onwaarschijnlijk / Zeer waarschijnlijk) |
| Ne prenez pas de pincettes | Neem geen blad voor de mond |
| Paramètres | Instellingen |

### Juridique — compléments
consentement (explicite) → *(uitdrukkelijke) toestemming* ; retirer son consentement → *toestemming intrekken* ; intérêt légitime → *gerechtvaardigd belang* ; exécution du contrat → *uitvoering van de overeenkomst* ; obligation légale → *wettelijke verplichting* ; durée de conservation → *bewaartermijn* ; transfert hors UE → *doorgifte buiten de EER* ; données biométriques → *biometrische gegevens* ; droits d'accès, de rectification, d'effacement, de limitation, de portabilité, d'opposition → *recht op inzage, rectificatie, wissing, beperking van de verwerking, overdraagbaarheid, bezwaar* ; propriété intellectuelle → *intellectueel eigendom* ; responsabilité → *aansprakelijkheid* ; force majeure → *overmacht* ; mineur / autorité parentale → *minderjarige / ouderlijk gezag* ; médiation → *bemiddeling* (« Médiateur FEVAD » : nom propre, non traduit) ; tribunal compétent → *bevoegde rechter*.

## Ne jamais traduire
Balises, classes, ids, `name`/`value` des champs (valeurs envoyées au serveur = français canonique), clés JS, URLs, webhooks, commentaires de code, marques, noms de produits, INCI, « Adermio ».

## Points signalés au PDG (à valider par un juriste avant l'ouverture NL/BE)
- Allégations chiffrées (« précision 98,5 % », « 4,4/5 »), photos avant/après, « diagnostic précis » : traduites fidèlement (sans « diagnose »), à valider (Reclamecode, ACM).
- Pages légales = droit français traduit fidèlement ; rien d'inventé. Questions ouvertes listées dans `revue/POINTS_JURIDIQUES.md`.

## Points pour la phase 2 (paiement)
- **iDEAL** (orthographe exacte) est le moyen de paiement n°1 aux Pays-Bas (Bancontact en Belgique) : vérifier qu'ils sont activés dans Stripe Checkout avant l'ouverture.

## Historique
- 09/10 : glossaire initial (décisions d'Antoine : périmètre site seul et caché, « je/jouw », source FR).
- 09/10 : relu par 2 natifs indépendants (Pays-Bas, Flandre) : ~45 corrections intégrées (gemengde huid, overtollige talg, typographie FR, J28 → dag 28, Mo → MB, dermatoloog titre protégé, repli « patient », actieve ingrediënten, opflakkering, geen medisch advies, Matig jamais seul, je avant jouw, belgicismes et tics hollandais, termes complémentaires).
