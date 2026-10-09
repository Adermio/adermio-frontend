# Table de traduction nl/premium-second-cycle.html — Table de traduction de/premium-second-cycle.html (source premium-second-cycle.html).
# Colonne de gauche = littéral FR EXACT de la page préparée (ne pas modifier) ; à droite : le néerlandais.
# None = pas encore traduit (apply_tr_nl.py refuse). 3e valeur = nombre d'occurrences attendu.
# « Cycle 2 » (l'offre) = ronde 2 / tweede ronde — JAMAIS « cyclus » (glossaire).
TARGET = 'nl/premium-second-cycle.html'
TR = [
    # --- head / SEO (title, og:title, twitter:title)
    ("Analyse Cycle 2 — Suivi d'évolution Adermio",
     'Analyse ronde 2 — Je voortgang bijhouden met Adermio', 3),
    ("Comparez l'évolution de votre peau avec l'analyse comparative Cycle 2 d'Adermio. Mesurez vos progrès après 28 jours de routine.",
     'Bekijk met de vergelijkende analyse van Adermio hoe je huid in ronde 2 is veranderd. Meet je vooruitgang na 28 dagen routine.', 3),
    ('<title>Adermio - Analyse Cycle 2</title>',
     '<title>Analyse ronde 2 — Adermio</title>', 1),
    # --- chargement / erreurs
    ('Chargement de votre analyse Cycle 2...',
     'Je analyse van ronde 2 wordt geladen...', 1),
    ('Lien invalide : token manquant.',
     'Deze link is onvolledig. Open de link uit je e-mail opnieuw.', 1),
    # messages d'exception : plus affichés (REGEX ci-dessous), traduits par sécurité
    ('Error("Erreur de chargement")',
     'Error("Laden mislukt")', 1),
    ('"Rapport introuvable"',
     '"Rapport niet gevonden"', 1),
    ('"URL du rapport manquante"',
     '"Rapport niet beschikbaar"', 1),
    # décision 12 : texte fixe affiché à la place de e.message (voir REGEX)
    ('Erreur de chargement. R\\u00e9essayez plus tard.',
     'Je rapport kon niet worden geladen. Vernieuw de pagina of stuur een e-mail naar contact@adermio.com.', 1),
    # --- chat IA
    ("Je suis l'IA Adermio &#128075;<br>Des questions sur votre Cycle 2 ? Je suis l&#224; !",
     'Ik ben Adermio AI &#128075;<br>Vragen over je tweede ronde? Ik help je graag!', 1),
    ('aria-label="Ouvrir le chat Adermio"',
     'aria-label="Adermio-chat openen"', 1),
    ('>Adermio Assistant</span>',
     '>Adermio-assistent</span>', 1),
    ('>En ligne</span>',
     '>Online</span>', 1),
    ('aria-label="Fermer"',
     'aria-label="Sluiten"', 1),
    ("Bonjour ! Je suis l'IA Adermio. J'ai analys&#233; vos donn&#233;es du Cycle 1 et Cycle 2. Posez-moi vos questions ! &#128071;",
     'Hallo! Ik ben Adermio AI. Ik heb je gegevens van ronde 1 en ronde 2 geanalyseerd. Stel gerust je vragen! &#128071;', 1),
    ('placeholder="Posez votre question..."',
     'placeholder="Stel je vraag..."', 1),
    ('Adermio IA peut faire des erreurs.',
     'Adermio AI kan fouten maken.', 1),
    ("Impossible d'identifier votre rapport.",
     'We kunnen je rapport niet vinden.', 1),
    ('"Erreur IA"',
     '"Er ging iets mis"', 1),
    ("D\\u00e9sol\\u00e9, je n'ai pas compris.",
     'Sorry, dat heb ik niet begrepen.', 1),
    # décision 12 : plus d'err.message (technique) affiché dans le chat
    ('(err.message || "Erreur.")',
     '"Het antwoord kon niet worden geladen. Probeer het opnieuw."', 1),
]
# Décision 12 : jamais e.message (« Failed to fetch », « Rapport niet beschikbaar »…) -> message fixe (déjà traduit par TR).
REGEX = [
    (r'errorEl\.textContent = e\.message \|\| "Je rapport kon niet worden geladen\.',
     'errorEl.textContent = "Je rapport kon niet worden geladen.'),
]
# REGEX de la table allemande, pour information (propres à l'allemand sauf mention) :
#   ('errorEl\\.textContent = e\\.message \\|\\| "Fehler beim Laden\\. Bitte versuchen Sie es sp\\\\u00e4ter erneut\\.";', 'errorEl.textContent = "Ihr Bericht konnte nicht geladen werden. Bitte laden Sie die Seite neu oder schreiben Sie uns an contact@adermio.com.";')
