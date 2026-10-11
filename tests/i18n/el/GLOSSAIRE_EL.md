# Glossaire et guide de style — site Adermio en grec

Référence unique pour toute traduction FR → EL du site adermio.com. Toute décision nouvelle s'écrit ici AVANT d'être appliquée. Un relecteur ne défait JAMAIS une décision du client.

## Décisions (PDG, 11/10/2026) — non négociables

1. **Registre « εσείς »** (pluriel de politesse) partout : impératifs au pluriel (*Ξεκινήστε, Ανεβάστε, Συμπληρώστε*), possessif *σας* (minuscule, jamais « Σας » en milieu de phrase). **Jamais de tutoiement** (*εσύ, σου, σένα*, impératif singulier) : `qa_el.py` le refuse. Raison : même registre que le FR (« vous »), et c'est l'usage des pharmacies et de la dermocosmétique en Grèce. Chaleureux sans familiarité : pas d'argot, pas d'émojis ajoutés.
2. **Zéro langage médical côté Adermio.** Interdits pour parler d'Adermio ou de ce qu'il fait : *διάγνωση* (même en négation : « δεν αποτελεί ιατρική διάγνωση » refusé → « δεν αποτελεί ιατρική συμβουλή » / « δεν αντικαθιστά την επίσκεψη σε δερματολόγο »), *ασθενής*, *θεραπεία / θεραπεύω / θεραπευτικός*, *κλινικός / κλινική*, *ίαση*. On dit : *ανάλυση, εκτίμηση, συμβουλές, προτάσεις, περιποίηση, φροντίδα, ρουτίνα*. « traiter l'acné » → *αντιμετωπίσετε την ακμή / βάλετε την ακμή υπό έλεγχο*.
   - **Traitement médical DE L'UTILISATEUR** (« Suivez-vous un traitement ? ») → *φαρμακευτική αγωγή* (« Ακολουθείτε κάποια φαρμακευτική αγωγή για την ακμή; ») : c'est sa réalité, pas une promesse d'Adermio.
   - **« δερματολόγος » = un vrai médecin seulement.** Jamais pour Adermio : « notre dermatologue IA » → *η AI μας* ; « analyse dermatologique » → *ανάλυση επιδερμίδας με AI* ; « expertise dermatologique » (le domaine) → *γνώσεις από τη δερματολογία*. Badge « Méthode clinique » → *Επιστημονική τεκμηρίωση*.
   - Repli quand le prénom manque (« Cher(e) patient(e) », `'Patient'` en JS) → *Γεια σας* ou une phrase sans nom.
3. **Prix : 5,99 €** (montant, espace insécable, € : `5,99&nbsp;€` en HTML, `5,99 €` en JS, espace simple en JSON-LD/meta). Si le FR dit 4,99 €, écrire **5,99 €** (le 4,99 € du FR est obsolète).
4. **Source = le français** : ton, structure et sens du FR. Jamais l'anglais ni le néerlandais.
5. **Même ton que le FR** : rassurant, clair, précis, chaleureux sans familiarité, jamais alarmiste ni « marketing criard ». Grec standard (Grèce et Chypre), naturel, *δημοτική* moderne, pas de tournures archaïsantes (*καθαρεύουσα*).
6. **Témoignages** : jamais supprimés ni réécrits sur le fond ; **prénoms gardés tels quels en alphabet latin** (vrais clients) ; traduits comme une vraie cliente grecque l'écrirait. Un même avis = le même texte grec sur toutes les pages (référence : `tr_el/home.py`, harmonisé à la fin).
7. **Pied de page** : *© 2026 Adermio. Με την επιφύλαξη παντός δικαιώματος.* (si le FR dit © 2025 → © 2026). Lien « Conditions de vente » → *Όροι πώλησης* (pointe vers `/el/oroi-polisis`, CGV traduites le 11/10/2026 ; la page de résiliation `/el/akyrosi-syndromis` existe mais reste cachée).
8. **Messages d'erreur** : jamais de message technique (`err.message`, « Failed to fetch », « Token », « jobId », « console / F12 »). Toujours une phrase grecque claire qui dit quoi faire. Si le JS affiche `e.message`, remplacer l'expression par un texte fixe (entrée REGEX de la table).
9. **Visuels** de l'accueil (captures, vidéo) = versions **anglaises** : ne jamais promettre qu'ils sont en grec (« (βίντεο στα αγγλικά) »).
10. **Textes juridiques** : là où le FR parle de « l'Utilisateur » à la 3e personne, garder **ο Χρήστης** (3e personne) ; RGPD → **ΓΚΠΔ** (Γενικός Κανονισμός για την Προστασία Δεδομένων) ; CNIL : garder « CNIL » et ajouter l'autorité grecque seulement si le FR cite « l'autorité de contrôle de votre pays » (Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα). Ne rien inventer de juridique.

11. **Point Repère** (fonction Premium de l'app) → *Σημείο Αναφοράς* ; « enquête » → *διερεύνηση*, « pistes » → *υποθέσεις*, « verdicts » → *συμπεράσματα*, « dossier » → *φάκελος* (fixé le 11/10 avec la politique de confidentialité v2.4).

## Typographie grecque

- **Point d'interrogation = « ; »** (point-virgule latin U+003B). « · » (άνω τελεία, U+00B7) avec parcimonie. Aucune espace avant `! ; : ·`.
- Guillemets **« »** sans espace intérieure.
- **Capitales sans accent** : un mot écrit TOUT en capitales ne prend pas de tonos (*ΟΡΟΙ*, jamais *ΌΡΟΙ*). Le texte des éléments mis en capitales par le CSS (classe `uppercase`) s'écrit normalement : le build retire les accents tout seul. Les titres sont en casse de phrase.
- Nombres : virgule décimale (`2,5`), point des milliers (`10.000`), pourcentage collé (`98%`), dates *11 Οκτωβρίου 2026*, heures *14:30*, *MB* pour « Mo ».
- Jours : « J1 / J7 / J28 / J+90 » → *Ημέρα 1 / Ημέρα 7 / Ημέρα 28 / μετά από 90 ημέρες* (badge court : *Ημ. 28*) ; « 0/28j » → *0/28 ημέρες*. « +2000 avis » → *πάνω από 2.000 κριτικές*.
- Mots latins admis : marques, *Adermio*, *AI*, *SPF*, *PDF*, *e-mail*, *Blog*, *Premium* (abonnement de l'app), *App Store / Google Play*. Tout autre mot latin dans le texte = résidu (`qa_el.py`). Un prénom ou une marque nouvelle → une ligne dans `latin_ok.txt`.
- Chaîne JS entre `'…'` : pas de problème d'apostrophe en grec, mais attention aux guillemets droits.

## Glossaire figé

### Navigation et pages
| FR | EL |
|---|---|
| Accueil | Αρχική |
| Faire l'analyse (navigation) | Κάντε την ανάλυση |
| Analyser ma peau / Démarrer mon analyse / Faire mon analyse gratuite (CTA) | Ξεκινήστε τη δωρεάν ανάλυση |
| À propos | Σχετικά με εμάς |
| Nous contacter / Contact | Επικοινωνία |
| Conditions d'utilisation | Όροι χρήσης |
| Conditions de vente / CGV | Όροι πώλησης |
| Mentions légales | Νομικές πληροφορίες |
| Politique de confidentialité | Πολιτική απορρήτου |
| Sources | Πηγές |
| Avis / Témoignages | Κριτικές / Τι λένε οι χρήστες μας |
| Feedback / Envoyer le feedback | Σχόλια / Αποστολή σχολίων |
| Blog | Blog |
| Tous droits réservés | Με την επιφύλαξη παντός δικαιώματος |
| slogan « La dermatologie réinventée par l'IA » | Η φροντίδα της επιδερμίδας, ξανασκεμμένη με AI. (jamais « δερματολογία » à côté d'AI) |
| Suivant / Précédent / Retour / Envoyer / Valider | Επόμενο / Προηγούμενο / Πίσω / Αποστολή / Επιβεβαίωση |
| Chargement… / Envoi en cours… | Φόρτωση… / Αποστολή… |
| Réessayer | Δοκιμάστε ξανά |

### Produit Adermio
| FR | EL |
|---|---|
| analyse (de peau) | ανάλυση επιδερμίδας / ανάλυση |
| analyse gratuite | δωρεάν ανάλυση |
| analyse complète / dossier complet / analyse premium (web) | πλήρης ανάλυση — *Premium* est réservé à l'abonnement de l'app |
| débloquer (bouton de paiement) | Ξεκλειδώστε την με 5,99 € |
| rapport | αναφορά (en PDF : η αναφορά σας σε PDF) |
| résultats | αποτελέσματα |
| bilan cutané | συνολική εικόνα της επιδερμίδας σας |
| paiement unique / sans abonnement | εφάπαξ πληρωμή / χωρίς συνδρομή |
| satisfait ou remboursé | Δεν μείνατε ικανοποιημένοι; Σας επιστρέφουμε τα χρήματα. |
| routine personnalisée | εξατομικευμένη ρουτίνα περιποίησης |
| routine du matin / du soir | πρωινή / βραδινή ρουτίνα |
| second cycle / 2e cycle | δεύτερος κύκλος |
| bilan J28 / suivi | έλεγχος της 28ης ημέρας / παρακολούθηση |
| photo de face / profil gauche / profil droit | φωτογραφία από μπροστά / αριστερό προφίλ / δεξί προφίλ |
| questionnaire / formulaire | ερωτηματολόγιο |
| IA | AI (forme longue *τεχνητή νοημοσύνη* une fois par page au plus) |
| conseils / recommandations | συμβουλές / προτάσεις |
| plan alimentaire / alimentation | διατροφή / διατροφικές συμβουλές |
| facteurs aggravants | παράγοντες που επιδεινώνουν την ακμή |

### Peau
| FR | EL |
|---|---|
| peau (du visage) | επιδερμίδα (δέρμα en contexte corporel ou médical) |
| acné / acné hormonale | ακμή / ορμονική ακμή |
| boutons | σπυράκια |
| points noirs / points blancs (microkystes) | μαύρα στίγματα / λευκά στίγματα |
| papules / pustules / nodules / kystes | βλατίδες / φλύκταινες / οζίδια / κύστεις |
| comédons | φαγέσωρες |
| rougeurs | κοκκινίλες (ερυθρότητα dans un texte technique) |
| cicatrices | ουλές ακμής |
| taches (post-inflammatoires) | κηλίδες (μετά την ακμή) / σημάδια |
| pores dilatés | διεσταλμένοι πόροι |
| sébum / excès de sébum | σμήγμα / υπερέκκριση σμήγματος |
| peau grasse / mixte / sèche / sensible / normale | λιπαρή / μικτή / ξηρή / ευαίσθητη / κανονική επιδερμίδα |
| zone T / zone U | ζώνη Τ / ζώνη U |
| front / joues / menton / mâchoire / autour de la bouche | μέτωπο / μάγουλα / πηγούνι / γνάθος (γραμμή της γνάθου) / γύρω από το στόμα |
| sévérité légère / modérée / sévère | ήπια / μέτρια / σοβαρή |
| actifs / ingrédients | δραστικά συστατικά / συστατικά |
| nettoyant / crème hydratante / sérum / écran solaire | καθαριστικό / ενυδατική κρέμα / ορός (serum) / αντηλιακό (SPF) |
| exfoliant | απολεπιστικό |
| acide salicylique / peroxyde de benzoyle / niacinamide | σαλικυλικό οξύ / υπεροξείδιο του βενζοϋλίου / νιασιναμίδη |
| rétinoïdes / rétinol / adapalène / isotrétinoïne | ρετινοειδή / ρετινόλη / αδαπαλένιο / ισοτρετινοΐνη |
| acide azélaïque / zinc / AHA / BHA | αζελαϊκό οξύ / ψευδάργυρος / AHA / BHA |
| (non) comédogène | (μη) φαγεσωρογόνο — ou *δεν φράζει τους πόρους* |
| grossesse / allaitement | εγκυμοσύνη / θηλασμός |
| cycle menstruel / règles | εμμηνορρυσιακός κύκλος / περίοδος |
| stress / sommeil / sport, transpiration | άγχος / ύπνος / άθληση, εφίδρωση |
| produits laitiers / sucre / index glycémique | γαλακτοκομικά / ζάχαρη / γλυκαιμικός δείκτης |
| médecin / dermatologue (un vrai) | γιατρός / δερματολόγος |

## Style grec

- Phrases claires, pas plus longues que le FR. Pas de calques du français (« Découvrez… » → varier : *Δείτε…*, *Μάθετε…*, ou une affirmation directe).
- Anglicismes : seulement ceux que le public grec emploie vraiment en beauté (*serum, skincare* dans un titre court, *online, blog, AI, SPF*). Sinon le mot grec.
- Boutons système : nom ou impératif court (*Επόμενο, Πίσω, Αποστολή*) ; boutons marketing : impératif pluriel (*Ξεκινήστε τη δωρεάν ανάλυση*). Toucher l'écran = *Πατήστε*. Longueur proche du FR (le grec est ~15 % plus long : reformuler si un bouton ou un badge déborde à 360 px).
- Genre : *η επιδερμίδα* (fém.), *η ανάλυση* (fém.), *η αναφορά* (fém.), *η ρουτίνα* (fém.), *ο ορός* (masc.) ; accorder les adjectifs calculés en JS si le FR les accorde.

## Juridique — Όροι πώλησης (11/10/2026)
- CGV → *Όροι πώλησης* (terme défini : οι «Όροι πώλησης»), page `/el/oroi-polisis` ; résilier / résiliation → *ακυρώνω / ακύρωση* (bouton iOS : *Ακύρωση συνδρομής*) ; droit de rétractation → *δικαίωμα υπαναχώρησης* ; renoncer expressément → *ρητή παραίτηση* ; formule → *πρόγραμμα* ; paywall → *σελίδα συνδρομής* ; franchise en base de TVA → *γαλλικό καθεστώς απαλλαγής μικρών επιχειρήσεων από τον ΦΠΑ* (sans le terme français : `qa_el.py`) ; sous-traitant (RGPD) → *εκτελούσα την επεξεργασία*.
- Libellés de l'app cités en grec (*Επαναφορά αγορών*, *Έχω κωδικό Adermio*) : l'app s'affiche aujourd'hui en anglais en Grèce, à aligner à l'ouverture de l'abonnement.
