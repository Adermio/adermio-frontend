# Table de traduction de/success.html (source success.html).
TARGET = 'de/success.html'
TR = [
    # --- head ---
    ('<title>Paiement confirmé — Adermio Premium</title>', '<title>Zahlung bestätigt — Adermio-Komplettanalyse</title>', 1),
    ('content="Paiement confirmé — Adermio Premium"', 'content="Zahlung bestätigt — Adermio-Komplettanalyse"', 2),
    ('content="Votre paiement a été confirmé. Votre analyse premium Adermio est en cours de préparation."',
     'content="Ihre Zahlung wurde bestätigt. Ihre Adermio-Komplettanalyse wird gerade erstellt."', 3),
    # --- menu / footer ---
    ('transition-colors">Accueil</a>', 'transition-colors">Startseite</a>', 1),
    ('!text-adermio-dark">Accueil</a>', '!text-adermio-dark">Startseite</a>', 1),
    (">Faire l'analyse</a>", '>Analyse starten</a>', 2),
    ('>À Propos</a>', '>Über uns</a>', 2),
    ('>Nous Contacter</a>', '>Kontakt</a>', 2),
    (">Conditions d'utilisation</a>", '>Nutzungsbedingungen</a>', 1),
    ('>Mentions Légales</a>', '>Impressum</a>', 1),
    ('>Politique de Confidentialité</a>', '>Datenschutz</a>', 1),
    ("La dermatologie réinventée par l'intelligence artificielle.",
     'Hautanalyse neu gedacht – mit künstlicher Intelligenz.', 1),
    ('© 2025 Adermio. Tous droits réservés.', '© 2026 Adermio. Alle Rechte vorbehalten.', 1),
    # --- en-tête ---
    ('>Commande validée</h1>', '>Zahlung bestätigt</h1>', 1),
    ('Merci. Votre dossier complet Adermio est en cours de création.',
     'Vielen Dank. Ihre Adermio-Komplettanalyse wird gerade erstellt.', 1),
    ('>Analyse dermatologique en cours...</div>', '>Ihre Hautanalyse läuft …</div>', 1),
    (">Initialisation de l'IA...</div>", '>KI wird gestartet …</div>', 1),
    ('</i> Finalisation du dossier...', '</i> Ihr Bericht wird fertiggestellt …', 1),
    ('<strong>Copie de sécurité</strong>', '<strong>Kopie per E-Mail</strong>', 1),
    ('Le rapport PDF sera envoyé automatiquement sur votre email.',
     'Ihr PDF-Bericht wird automatisch an Ihre E-Mail-Adresse gesendet.', 1),
    # --- succès ---
    ('>Votre dossier est prêt</h2>', '>Ihre Komplettanalyse ist fertig</h2>', 1),
    ("L'analyse complète de votre peau est terminée. Vous pouvez consulter vos résultats dès maintenant.",
     'Die Komplettanalyse Ihrer Haut ist abgeschlossen. Sie können Ihre Ergebnisse ab sofort ansehen.', 1),
    ('Ouvrir mon analyse complète', 'Komplettanalyse öffnen', 1),
    ('</i> Copie PDF envoyée par email', '</i> PDF-Kopie per E-Mail gesendet', 1),
    # --- confiance ---
    ('>Scan HD</div>', '>HD-Scan</div>', 1),
    ('>Analyse pore par pore</div>', '>Analyse Pore für Pore</div>', 1),
    ('>Méthode Clinique</div>', '>Wissenschaftlich fundiert</div>', 1),
    ('>IA Adermio</div>', '>Adermio-KI</div>', 1),
    ('>Données Chiffrées</div>', '>Verschlüsselte Daten</div>', 1),
    ('>100% Confidentiel</div>', '>100 % vertraulich</div>', 1),
    # --- modale d'attente ---
    ('>Une petite minute...</h3>', '>Einen Moment noch …</h3>', 1),
    ("Vous n'avez pas reçu votre analyse ? Aucun problème. Notre serveur est peut-être surchargé. <br>Envoyez-nous un message et nous vous la renverrons immédiatement par mail.",
     'Sie haben Ihre Analyse nicht erhalten? Kein Problem. Unser Server ist möglicherweise gerade überlastet. <br>Schreiben Sie uns eine Nachricht, und wir senden sie Ihnen umgehend erneut per E-Mail zu.', 1),
    ('Contacter le support', 'Support kontaktieren', 1),
    ("Continuer d'attendre", 'Weiter warten', 1),
    # --- JS affiché ---
    ('"Erreur : Commande introuvable."', '"Wir konnten Ihre Bestellung nicht finden. Keine Sorge: Ihr PDF-Bericht wird Ihnen per E-Mail zugeschickt. Bei Fragen hilft Ihnen unser Support."', 1),
    ('"Connexion sécurisée au serveur..."', '"Sichere Verbindung zum Server …"', 1),
    ('"Traitement haute définition des images..."', '"Hochauflösende Bildverarbeitung …"', 1),
    ('"Analyse des imperfections et du grain..."', '"Analyse von Unreinheiten und Hautstruktur …"', 1),
    ('"Génération du protocole sur-mesure..."', '"Ihre persönliche Pflegeroutine wird erstellt …"', 1),
    ('"Construction de l\'interface..."', '"Ihre Ergebnisseite wird aufgebaut …"', 1),
    ('"Finalisation du dossier..."', '"Ihr Bericht wird fertiggestellt …"', 1),
    ('content_name: "Analyse premium Adermio"', 'content_name: "Adermio-Komplettanalyse"', 1),
    ('"Trafic plus dense que prévu : finalisation en cours..."',
     '"Gerade ist viel los – wir stellen Ihre Analyse fertig …"', 1),
]
REGEX = []

# --- Relecture native 30/09 (R1–R5 + arbitrages PDG) : ajouts ---
TR += [
    ('Adermio © 2025</span>', 'Adermio © 2026</span>', 1),   # arbitrage 7
]
REGEX += [
    (r'alt="(?:Logo Adermio|Adermio Logo)"', 'alt="Adermio-Logo"'),   # R4 : ordre allemand, uniformisé
    (r'(progressText\.textContent = Math\.floor\((?:p|progress)\) \+ )"%"', r'\1" %"'),   # R2/R3 : espace avant % (42 %)
]
