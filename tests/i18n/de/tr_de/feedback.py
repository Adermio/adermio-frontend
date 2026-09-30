# Table de traduction de/feedback.html (source feedback.html).
# NB : le FR tutoie par endroits (« évalues-tu », « Choisis », « Ouvre ») ; en allemand, « Sie » partout.
TARGET = 'de/feedback.html'
TR = [
    # --- head / SEO
    ("Votre avis — Adermio", "Feedback — Adermio", 3),
    ("Partagez votre expérience avec Adermio. Votre retour nous aide à améliorer notre service d'analyse dermatologique.",
     "Teilen Sie Ihre Erfahrungen mit Adermio. Ihr Feedback hilft uns, unsere KI-Hautanalyse zu verbessern.", 3),
    ("<title>Votre avis compte pour Adermio</title>", "<title>Feedback — Adermio</title>", 1),
    # --- en-tête
    (">Adermio &amp; Vous</h1>", ">Adermio &amp; Sie</h1>", 1),
    ("&quot;Merci d'avoir testé notre analyse complète. Adermio est encore jeune et en pleine expansion.",
     "„Danke, dass Sie unsere Komplettanalyse ausprobiert haben. Adermio ist noch jung und wächst stetig.", 1),
    ("Votre avis est la boussole qui nous guide pour nous améliorer. Soyez sincère, c'est le meilleur cadeau",
     "Ihre Meinung ist unser Kompass, um besser zu werden. Seien Sie ehrlich – das ist das schönste Geschenk,", 1),
    ("que vous puissiez nous faire.&quot;", "das Sie uns machen können.“", 1),
    ("Oups — lien invalide. Merci de passer par le lien reçu par email.",
     "Hoppla – ungültiger Link. Bitte nutzen Sie den Link aus Ihrer E-Mail.", 1),
    # --- note
    ("Globalement, comment évalues-tu ton analyse Adermio ?", "Wie bewerten Sie Ihre Adermio-Hautanalyse insgesamt?", 1),
    ('aria-label="Note globale 1 à 5"', 'aria-label="Gesamtbewertung von 1 bis 5"', 1),
    # --- bugs
    ("Avez-vous rencontré des bugs sur notre site ou lors de l'analyse ?",
     "Gab es technische Probleme auf unserer Website oder während der Hautanalyse?", 1),
    ("</i>Non, tout était fluide", "</i>Nein, alles lief reibungslos", 1),
    ("</i>Oui, j'ai eu un souci", "</i>Ja, es gab ein Problem", 1),
    ("Mince ! Pouvez-vous nous dire ce qui s'est passé ? (ex: chargement infini, erreur 404...)",
     "Schade! Können Sie uns sagen, was passiert ist? (z. B. endloses Laden, Fehler 404 …)", 1),
    # --- amélioration (HTML + JS)
    ("Comment pourrions-nous nous améliorer ?", "Was können wir besser machen?", 2),
    ("C'est la question la plus importante pour nous. Ne prenez pas de pincettes !",
     "Das ist für uns die wichtigste Frage. Seien Sie ruhig schonungslos!", 1),
    ("C\\'est la question la plus importante pour nous. Ne prenez pas de pincettes !",
     "Das ist für uns die wichtigste Frage. Seien Sie ruhig schonungslos!", 1),
    ("Idées de fonctionnalités, clarté des résultats, prix... Dites-nous tout.",
     "Ideen für Funktionen, Verständlichkeit der Ergebnisse, Preis … Erzählen Sie uns alles.", 2),
    # --- NPS
    ("Sur une échelle de 1 à 10, recommanderiez-vous Adermio à un proche ?",
     "Auf einer Skala von 1 bis 10: Würden Sie Adermio Freunden oder Familie empfehlen?", 1),
    ("<span>Pas du tout</span>", "<span>Auf keinen Fall</span>", 1),
    ("<span>Absolument</span>", "<span>Auf jeden Fall</span>", 1),
    # --- témoignage
    ("<strong>Vous nous aimez ? &#x1F60D;</strong> J'autorise Adermio à utiliser mon commentaire comme témoignage anonyme sur le site.",
     "<strong>Sie mögen uns? &#x1F60D;</strong> Ich erlaube Adermio, meinen Kommentar anonym als Erfahrungsbericht auf der Website zu verwenden.", 1),
    # --- envoi (HTML + JS)
    ("Envoyer mes retours", "Feedback senden", 2),
    # --- succès
    (">Merci infiniment !</h2>", ">Vielen herzlichen Dank!</h2>", 1),
    ("Vos retours ont bien été enregistrés.", "Ihr Feedback ist bei uns angekommen.", 1),
    ("Grâce à vous, Adermio grandit un peu plus aujourd'hui.", "Dank Ihnen wird Adermio heute wieder ein Stück besser.", 1),
    (">Retour au site</button>", ">Zurück zur Website</button>", 1),
    # --- JS (textes affichés)
    ('btn.innerHTML = "Lien invalide";', 'btn.innerHTML = "Ungültiger Link";', 1),
    ('["À améliorer", "Peut mieux faire", "Bien", "Très bien", "Excellent !"]',
     '["Schlecht", "Ausbaufähig", "Gut", "Sehr gut", "Ausgezeichnet"]', 1),
    ("'Qu’est-ce qui t’a plu... et que devrions-nous améliorer ?'", "'Was hat Ihnen gefallen … und was sollten wir verbessern?'", 1),
    ("Même si c\\'est top, dites-nous ce qui manque pour atteindre la perfection !",
     "Auch wenn alles top war: Sagen Sie uns, was noch zur Perfektion fehlt!", 1),
    ("\"J'ai adoré l'analyse détaillée, mais j'aurais aimé avoir plus de conseils sur...\"",
     "\"Die ausführliche Auswertung hat mir sehr gefallen, aber ich hätte mir mehr Tipps gewünscht zu …\"", 1),
    ('"Lien invalide : jobId absent."', '"Dieser Link ist unvollständig. Bitte öffnen Sie den Link aus Ihrer E-Mail erneut."', 1),
    ('"Choisis une note (étoiles) avant d’envoyer &#x1F642;"', '"Bitte vergeben Sie vor dem Absenden eine Sternebewertung."', 1),
    ("</i> Envoi en cours...'", "</i> Wird gesendet …'", 1),
    ('"Erreur d’envoi. Ouvre la console (F12) et regarde l’erreur Network/CORS."',
     '"Senden fehlgeschlagen. Bitte versuchen Sie es in einem Moment erneut."', 1),
]
