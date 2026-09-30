# R3 — Revue UX writing (microcopies) — site DE

Relecteur : UX writer natif DE. Date : 30/09/2026. Aucun fichier modifié.
Périmètre : `de/form.html`, `de/premium.html`, `de/premium-second-cycle.html`, `de/second-cycle.html`, `de/analysis-in-progress-second-cycle.html`, `de/bilan.html`, `de/feedback.html`, `de/success.html`, `de/processing.html`, `de/processing2.html`, bloc `de:` de `T` dans `facescan.js`.
Référence : `tests/i18n/de/GLOSSAIRE_DE.md`.

Bilan général : la traduction est de bonne qualité. « Sie » est tenu partout (0 tutoiement), aucun texte français ou anglais écrit en dur n'est visible dans les pages DE, les pluriels « Tag/Tage » sont gérés dans `bilan.html` et les nombres sont au format allemand (`98 %`, `0,18 €`, `2.000`). Les problèmes restants sont surtout des **messages d'erreur techniques ou peu utiles** (souvent hérités du FR), quelques **libellés trop longs ou ambigus sur mobile**, et deux **textes affichés depuis le serveur ou le navigateur** qui peuvent sortir en anglais ou en français.

Gravité : **bloquant** = à corriger avant la mise en ligne ; **important** = gêne réelle pour l'utilisateur ou écart avec le glossaire ; **confort** = finition.

## 1. Constats bloquants et importants

| page | texte allemand actuel (exact) | proposition | raison | gravité |
|---|---|---|---|---|
| feedback.html (JS l. 508) | Fehler beim Senden. Öffnen Sie die Konsole (F12) und prüfen Sie den Network-/CORS-Fehler. | Ihr Feedback konnte nicht gesendet werden. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut. | Message de développeur affiché au client (déjà présent dans le FR : « Ouvre la console… », avec un tutoiement). Aucun client ne doit lire « F12 / CORS ». | bloquant |
| feedback.html (JS l. 469) | Bitte wählen Sie vor dem Absenden eine Bewertung (Sterne) &#x1F642; | Bitte vergeben Sie vor dem Absenden eine Sternebewertung. | `setError()` écrit avec `textContent` : l'entité s'affiche **en clair** « &#x1F642; » à l'écran (même bug en FR et en EN). Retirer l'entité ou mettre le caractère 🙂 lui-même. | important |
| feedback.html (JS l. 468) | Ungültiger Link: jobId fehlt. | Dieser Link ist unvollständig. Bitte öffnen Sie den Link aus Ihrer E-Mail erneut. | Terme technique « jobId » visible par le client. | important |
| premium.html (JS l. 709) / premium-second-cycle.html (JS l. 131) | Ungültiger Link: Token fehlt. | Dieser Link ist unvollständig. Bitte öffnen Sie den Link aus Ihrer E-Mail erneut. | « Token » = jargon ; le message ne dit pas quoi faire. | important |
| premium-second-cycle.html (l. 147-177) | Fehler beim Laden / Bericht nicht gefunden / URL des Berichts fehlt (via `e.message`) | Toujours afficher : « Ihr Bericht konnte nicht geladen werden. Bitte laden Sie die Seite neu oder schreiben Sie uns an support@… » | Le bloc `catch` affiche `e.message` : « URL des Berichts fehlt » (jargon) et, en cas de coupure réseau, le message **anglais** du navigateur (« Failed to fetch », « Load failed »). Dans premium.html, le même bloc affiche heureusement un texte fixe. | important |
| premium.html (JS l. 1408) / premium-second-cycle.html (JS l. 485) | "&#9888; " + (err.message \|\| "Fehler.") | &#9888; Die Antwort konnte nicht geladen werden. Bitte versuchen Sie es erneut. | Le chat affiche `err.message` : erreur réseau = **anglais** du navigateur ; `data.error` renvoyé par l'API (FR/EN ?) ; repli « Fehler. » qui n'aide pas. | important |
| premium.html (l. 854, `prod-cat`) | `${fixEncoding(item.type)}` (valeur du webhook `get-form-context`) | Faire traduire le type par le webhook, ou traduire côté page (Reinigung, Serum, Feuchtigkeitspflege, Sonnenschutz…) | À VÉRIFIER : le webhook est commun à toutes les langues et reçoit seulement le token, sans la langue. Si la routine est stockée en FR, le client allemand verra « Nettoyant », « Hydratant »… dans la fenêtre « Ihre Adermio-Routine ». | important |
| analysis-in-progress-second-cycle.html (JS l. 660) | Fehler: Kennung nicht gefunden. | Wir konnten Ihre Analyse nicht zuordnen. Bitte öffnen Sie den Link aus Ihrer E-Mail erneut. | « Kennung » est technique et vague ; aucune action proposée. | important |
| success.html (JS l. 690) | Fehler: Bestellung nicht gefunden. | Wir konnten Ihre Bestellung nicht finden. Keine Sorge: Ihr PDF-Bericht wird Ihnen per E-Mail zugeschickt. Bei Fragen hilft Ihnen unser Support. | Juste après un paiement, un message sec comme « Fehler » inquiète le client. Il faut le rassurer (même ton que le FR). | important |
| success.html (l. 352) | Klinische Methode | Fundierte Methode (ou : Wissenschaftliche Methode) | Glossaire, règle 2 : zéro langage médical. « Klinisch » renvoie à l'hôpital et aux essais cliniques (le FR dit « Méthode Clinique »). | important |
| second-cycle.html (JS l. 596, étoiles) | Enttäuschend / Ungenügend / In Ordnung / Zufriedenstellend / Ausgezeichnet | Schlecht / Mäßig / In Ordnung / Gut / Ausgezeichnet | En allemand, « ungenügend » est la pire note scolaire (6) : il est plus négatif qu'« enttäuschend », or il est placé à 2 étoiles. L'échelle semble donc à l'envers entre 1 et 2. « Zufriedenstellend » (4 étoiles) sonne plus faible que « gut ». | important |
| second-cycle.html (JS l. 731, boutons produit) | ✅ Behalten / ⚠️ Überprüfen / ❌ Abgesetzt | ✅ Behalten / ⚠️ Unsicher / ❌ Abgesetzt | 3 boutons côte à côte (grid-cols-3), 11 px, majuscules, espacement élargi, emoji en plus : « ⚠️ ÜBERPRÜFEN » tient mal sur un tiers d'écran de 360 px. « Unsicher » est plus court et plus clair. | important |
| facescan.js `binSemiR`, `binRight`, `binWideR`, `binSemiL`, `binLeft`, `binWideL` | Halb R / Profil R / Weit R / Halb L / Profil L / Weit L | Leicht re. / Profil re. / Weit re. / Leicht li. / Profil li. / Weit li. | Un Allemand ne lit pas R et L seuls (on abrège « re. / li. »). « Halb R » ne veut rien dire. Ces libellés s'affichent dans la grille d'aperçu et dans le badge « NEUAUFNAHME · … ». | important |
| form.html (l. 368 / 393) | Linke Seite / Rechte Seite | Linkes Profil / Rechtes Profil | Glossaire (« profil gauche / droit » = linkes / rechtes Profil). second-cycle.html utilise déjà « Linkes Profil / Rechtes Profil » : les deux formulaires ne concordent pas. | important |
| form.html (l. 680) | Bitte akzeptieren Sie die Datenschutzerklärung. | Bitte bestätigen Sie die Nutzungsbedingungen und die Datenschutzerklärung. | La case couvre les **deux** documents, mais l'erreur n'en nomme qu'un. En Allemagne, on « prend connaissance » d'une politique de confidentialité, on ne l'« accepte » pas : « bestätigen » est plus juste (à faire valider sur le plan juridique). | important |
| form.html (JS l. 983 + l. 666) | Verwenden Sie ein Medikament (z. B. eine verschreibungspflichtige Creme)? * — sous-titre : Früher oder aktuell | Verwenden Sie ein Medikament gegen Unreinheiten (z. B. eine verschreibungspflichtige Creme) – aktuell oder früher? * | La question est au présent (« Verwenden Sie ») alors que le sous-titre dit « Früher oder aktuell » : les temps ne concordent pas. | important |
| form.html (l. 665 / JS l. 979) | Behandlung gegen Akne? * | Wurde Ihre Akne schon behandelt (aktuell oder früher)? * | Formule télégraphique, sans verbe. Le glossaire autorise « Behandlung » pour le traitement de l'utilisateur. | important |
| bilan.html (JS l. 936) | W1 … W13 (axe du graphique de trajectoire) ; `W${s.week}` (graphique des scores) | Wo. 1 … Wo. 13 (ou « Woche 1 » dans l'infobulle) | « W » = Week (anglais). Un Allemand abrège « Wo. ». « KW » est à éviter : il désigne la semaine du calendrier. | important |

## 2. Constats de confort

| page | texte allemand actuel (exact) | proposition | raison | gravité |
|---|---|---|---|---|
| form.html (l. 464-465) | 1–2-mal im Monat / 1-mal pro Woche | 1- bis 2-mal im Monat / Einmal pro Woche | Graphie allemande standard ; « 1-mal » fait brouillon. | confort |
| form.html (TX483) | Ihre Antwort hilft der KI, Ihr eigenes Empfinden und Dinge zu verstehen, die auf Fotos kaum sichtbar sind. | So versteht die KI auch, was Sie selbst empfinden und was auf Fotos kaum zu sehen ist. | Phrase lourde (« … und Dinge zu verstehen »), calquée sur le FR. | confort |
| form.html (placeholders) | z. B.: Ich habe kleine rote Pickel … / z. B.: Meine Haut ist okay … | z. B. Ich habe kleine rote Pickel … | Pas de deux-points après « z. B. » en allemand (idem second-cycle « z. B.: Ich habe morgens … », « z. B.: CeraVe-Reinigung … », premium « z. B.: Meine Feuchtigkeitscreme … »). | confort |
| form.html (l. 603 / JS l. 978) | Welche dieser Faktoren betreffen Sie in den letzten Monaten am meisten? | Was hat Sie in den letzten Monaten am meisten beeinflusst? | Présent + « in den letzten Monaten » : les temps ne concordent pas. | confort |
| form.html (TX583) | Ernährung / Exzesse (Zucker, Alkohol) | Ernährung (viel Zucker, Alkohol) | « Exzesse » sonne moralisateur et peu naturel. | confort |
| form.html (JS l. 1028) | Wählen Sie zuerst den Scan oder das Hochladen von Fotos. | Bitte wählen Sie zuerst: Video-Scan oder Fotos hochladen. | Nominalisation lourde ; il vaut mieux reprendre les libellés exacts des deux boutons. | confort |
| form.html (JS l. 1746) | Die Bilder sind zu groß (maximale Dateigröße überschritten). Bitte wählen Sie kleinere Fotos. | Die Fotos sind zu groß. Bitte wählen Sie kleinere Fotos. | La parenthèse répète la phrase qui précède ; « Bilder » puis « Fotos » dans la même phrase. | confort |
| form.html (JS l. 1748) | Beim Senden ist ein Fehler aufgetreten. Bitte prüfen Sie Ihre Verbindung. | … Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut. | Ajouter l'action à faire. | confort |
| form.html (meta l. 8) | Fortschrittliche KI-Hautanalyse mit künstlicher Intelligenz. | Fortschrittliche Hautanalyse mit künstlicher Intelligenz. | Pléonasme (KI = künstliche Intelligenz). | confort |
| form.html (title) | Experten-Hautanalyse — Adermio | Ihre Hautanalyse — Adermio | « Experten- » est un calque de « Diagnostic Expert » et sonne comme une promesse d'expertise. | confort |
| second-cycle.html (JS l. 674) / bilan.html (JS l. 735) | Foto zu groß (max. 25 MB) / Foto zu groß (max. 5 MB) | Das Foto ist zu groß (max. 25 MB). Bitte wählen Sie ein kleineres Foto. | Ajouter l'action (form.html le fait déjà). | confort |
| second-cycle.html (TX255-257) | • Gesicht mittig und gut ausgeleuchtet. (points finaux) | sans point final, comme dans form.html | Ponctuation différente d'une page à l'autre pour la même liste. | confort |
| second-cycle.html (TX194) | Sagen Sie uns bei jedem Produkt, ob es gut funktioniert. | Sagen Sie uns bei jedem Produkt, wie es bei Ihnen gewirkt hat. | La question porte sur la première runde, qui est terminée. | confort |
| second-cycle.html (TX224) | Anhaltendes Purging (> 2 Wochen) | Anhaltende Erstverschlechterung (> 2 Wochen) | « Purging » n'est compris que des initiés ; « Erstverschlechterung » est le terme courant en Allemagne. | confort |
| second-cycle.html (TX367 / TX385) | direkt in Ihrem Bereich abrufbar / direkt in Ihrem Adermio-Bereich abrufbar | direkt in Ihrem Adermio-Bereich abrufbar (partout) | « Ihrem Bereich » seul est ambigu. | confort |
| analysis-in-progress-second-cycle.html (TX331) | Zweite Runde öffnen | Bericht öffnen | On ouvre un rapport, pas une « runde ». | confort |
| processing.html (TX227) | Vielleicht klappt es diesmal! | (supprimer) ou « Meist klappt es beim zweiten Versuch. » | Ton trop familier et incertain, juste après un échec. | confort |
| processing.html / processing2.html (JS l. 777) | Bewertung #3/10 | Bewertung 3 von 10 | « # » pour un numéro n'est pas naturel en allemand. | confort |
| processing, processing2, success, analysis-in-progress (JS progressText) | Math.floor(p) + "%" → « 42% », « 100% » | `+ " %"` → « 42 % » | Glossaire : espace avant % (le reste du site le respecte déjà). | confort |
| processing.html vs analysis-in-progress-second-cycle.html (pied de page) | Hautanalyse neu gedacht – mit künstlicher Intelligenz. / Hautanalyse, neu gedacht mit künstlicher Intelligenz. | Choisir une seule version (la première) | Même slogan écrit de deux façons. | confort |
| processing2.html (JS) | Die rechte Gesichtshälfte wird ausgewertet (3 Winkel) … | … (3 Blickwinkel) … | Même terme que le scan (« Blickwinkel »). | confort |
| facescan.js `uploadFail` | Fehler beim Senden, bitte erneut versuchen | Senden fehlgeschlagen. Bitte versuchen Sie es erneut. | Registre (infinitif + « Sie » ailleurs) et ponctuation. | confort |
| facescan.js `ok` | Okay | Ausreichend | Pour un badge de qualité, « Okay » fait familier ; « Ausreichend » se place bien entre « Gut » et « Fehlt ». | confort |
| facescan.js `initializingSubSlow` | Erkennung wird heruntergeladen … | Gesichtserkennung wird geladen … | « Erkennung » seul est vague. | confort |
| facescan.js `comeBackCenterSub` | Schauen Sie in das Objektiv | Schauen Sie in die Kamera | Plus courant (le mot « Objektiv » vient de la photo). | confort |
| bilan.html (JS l. 1360) | „Liebe Leserin, lieber Leser, diese Auswertung ist erst der Anfang …“ | sans prénom : „Diese Auswertung ist erst der Anfang …“ | Dans un rapport personnel, « Liebe Leserin, lieber Leser » fait circulaire publicitaire. | confort |
| bilan.html (JS l. 660) | Anna, Ihr 28-Tage-Check | Ihr 28-Tage-Check, Anna | Ordre plus naturel en allemand pour un titre. | confort |
| bilan.html (TX233) | End-Score | Abschluss-Score | « End-Score » est un anglicisme bancal. | confort |
| bilan.html (JS l. 969) | Abstand an Tag 90 | Unterschied an Tag 90 | « Abstand » = distance ; « Unterschied » est le mot attendu pour un écart de score. | confort |
| bilan.html (TX411) | -50 % RUNDE 2 | −50 % auf Runde 2 | Ajouter la préposition ; utiliser un vrai signe moins. | confort |
| bilan.html (TX183 ×3) | Laden Sie Ihre 2 Fotos hoch, um dies freizuschalten | Laden Sie beide Fotos hoch, um diesen Punkt freizuschalten | « dies » ne renvoie à rien de précis. | confort |
| bilan.html (TX459 / TX374) | Die Mühe der 28 Tage ist verloren. / Lassen Sie Ihre Haut nicht zurückfallen | Ohne Pflege kann die Haut in den Ausgangszustand zurückkehren. | Glossaire, règle 5 : « jamais alarmiste ». C'est déjà le ton du FR (décision produit) : à signaler seulement. | confort |
| bilan.html (l. 450-454) | 10 € barré → 5 € ; « also nur 0,18 € pro Tag » | (à confirmer) | Glossaire, règle 3 : « 5,99 € partout ». Il faut vérifier si cette règle s'applique aussi au prix de la runde 2 (5 € en FR), et que le prix réellement facturé par Stripe correspond. | confort |
| feedback.html (JS l. 320) | Verbesserungswürdig / Ausbaufähig / Gut / Sehr gut / Ausgezeichnet! | Schlecht / Ausbaufähig / Gut / Sehr gut / Ausgezeichnet | « Verbesserungswürdig » (1 étoile) et « Ausbaufähig » (2 étoiles) ont presque le même sens : l'écart entre 1 et 2 étoiles ne se lit pas. | confort |

## 3. Vérifié, sans problème

- « Sie » : 0 occurrence de « du / dein / dir » dans les 10 pages et dans le bloc `de:`.
- Langage médical : aucune occurrence de « Diagnose / Befund / Patient / Therapie / heilen » dans le texte visible. Les variables `patient_*` et `mode_diagnostic` sont des noms internes, jamais affichés.
- Valeurs françaises : les correspondances FR (`genderMap`, `zoneLabel`, `factorLabel`, « Oui/Non », « Matin/Soir/Hebdo ») servent uniquement à la charge envoyée au serveur. Seule exception : « Matin/Soir/Hebdo » s'affiche, mais il est bien traduit à l'écran (« Morgens / Abends / Wöchentlich »).
- Pluriels : `Tag / Tage` est géré dans le héros et dans les statistiques de bilan.html. « Blickwinkel erfasst » est invariable, donc correct au singulier comme au pluriel.
- Points de suspension : « … » avec espace insécable, partout.
- Boutons (START / WEITER / ANALYSE STARTEN / ZWEITE RUNDE STARTEN) : longueurs acceptables sur mobile.
- Guillemets „…“ utilisés correctement.
- Hors périmètre UI, à noter : dans bilan.html, le prénom est extrait par l'expression régulière FR `Routine donnée au patient` (l. 1343). Pour un rapport en allemand, le prénom ne sera probablement pas trouvé : le titre et la citation retombent alors sur les versions sans prénom.
