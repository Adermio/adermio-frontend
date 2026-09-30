# Table de traduction de/premium-second-cycle.html (source premium-second-cycle.html).
# « Cycle 2 » = « zweite Runde » (jamais « Zyklus », cf. glossaire).
TARGET = 'de/premium-second-cycle.html'
TR = [
    # --- head / SEO
    ("Analyse Cycle 2 — Suivi d'évolution Adermio", "Zweite Runde: Hautanalyse und Verlauf mit Adermio", 3),
    ("Comparez l'évolution de votre peau avec l'analyse comparative Cycle 2 d'Adermio. Mesurez vos progrès après 28 jours de routine.",
     "Vergleichen Sie die Entwicklung Ihrer Haut mit der Vergleichsanalyse der zweiten Runde von Adermio. Sehen Sie Ihre Fortschritte nach 28 Tagen Routine.", 3),
    ("<title>Adermio - Analyse Cycle 2</title>", "<title>Adermio – Hautanalyse der zweiten Runde</title>", 1),
    # --- chargement / erreurs (messages affichés via e.message)
    ("Chargement de votre analyse Cycle 2...", "Ihre Hautanalyse der zweiten Runde wird geladen …", 1),
    ("Lien invalide : token manquant.", "Dieser Link ist unvollständig. Bitte öffnen Sie den Link aus Ihrer E-Mail erneut.", 1),
    ('Error("Erreur de chargement")', 'Error("Fehler beim Laden")', 1),
    ('"Rapport introuvable"', '"Bericht nicht gefunden"', 1),
    ('"URL du rapport manquante"', '"Bericht nicht verfügbar"', 1),
    ("Erreur de chargement. R\\u00e9essayez plus tard.", "Fehler beim Laden. Bitte versuchen Sie es sp\\u00e4ter erneut.", 1),
    # --- chat IA
    ("Je suis l'IA Adermio &#128075;<br>Des questions sur votre Cycle 2 ? Je suis l&#224; !",
     "Ich bin die KI von Adermio &#128075;<br>Fragen zu Ihrer zweiten Runde? Ich bin f&#252;r Sie da!", 1),
    ('aria-label="Ouvrir le chat Adermio"', 'aria-label="Adermio-Chat &#246;ffnen"', 1),
    (">Adermio Assistant</span>", ">Adermio-Assistent</span>", 1),
    (">En ligne</span>", ">Online</span>", 1),
    ('aria-label="Fermer"', 'aria-label="Schlie&#223;en"', 1),
    ("Bonjour ! Je suis l'IA Adermio. J'ai analys&#233; vos donn&#233;es du Cycle 1 et Cycle 2. Posez-moi vos questions ! &#128071;",
     "Hallo! Ich bin die KI von Adermio. Ich habe Ihre Daten aus der ersten und zweiten Runde ausgewertet. Stellen Sie mir gern Ihre Fragen! &#128071;", 1),
    ('placeholder="Posez votre question..."', 'placeholder="Ihre Frage …"', 1),
    ("Adermio IA peut faire des erreurs.", "Die KI von Adermio kann Fehler machen.", 1),
    ("Impossible d'identifier votre rapport.", "Ihr Bericht konnte nicht zugeordnet werden.", 1),
    ('"Erreur IA"', '"KI-Fehler"', 1),
    ("D\\u00e9sol\\u00e9, je n'ai pas compris.", "Entschuldigung, das habe ich nicht verstanden.", 1),
    ('(err.message || "Erreur.")', '"Die Antwort konnte nicht geladen werden. Bitte versuchen Sie es erneut."', 1),
]
REGEX = []

# --- Relecture native 30/09 (R1–R5 + arbitrages PDG) : ajouts ---
REGEX += [
    # Arbitrage 10 : jamais e.message (jargon « URL des Berichts fehlt » ou « Failed to fetch » du navigateur) -> message fixe
    (r'errorEl\.textContent = e\.message \|\| "Fehler beim Laden\. Bitte versuchen Sie es sp\\u00e4ter erneut\.";',
     'errorEl.textContent = "Ihr Bericht konnte nicht geladen werden. Bitte laden Sie die Seite neu oder schreiben Sie uns an contact@adermio.com.";'),
]
