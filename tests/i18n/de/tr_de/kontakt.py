# Table de traduction de/kontakt.html (source contact.html).
TARGET = 'de/kontakt.html'
TR = [
    # --- head / SEO
    ("Contact — Adermio", "Kontakt — Adermio", 3),
    ("Contactez l'équipe Adermio pour toute question sur votre analyse dermatologique, votre compte ou nos services.",
     "Kontaktieren Sie das Adermio-Team bei Fragen zu Ihrer Hautanalyse, Ihrem Konto oder unseren Leistungen.", 3),
    ("Contactez l'équipe Adermio pour toute question sur votre analyse de peau ou le fonctionnement de notre IA.",
     "Kontaktieren Sie das Adermio-Team bei Fragen zu Ihrer Hautanalyse oder dazu, wie unsere KI funktioniert.", 1),
    # --- nav / menu / footer
    (">Accueil</a>", ">Startseite</a>", 2),
    (">Faire l'analyse</a>", ">Analyse starten</a>", 2),
    (">À Propos</a>", ">Über uns</a>", 2),
    (">Nous Contacter</a>", ">Kontakt</a>", 2),
    (">Conditions d'utilisation</a>", ">Nutzungsbedingungen</a>", 1),
    (">Politique de Confidentialité</a>", ">Datenschutz</a>", 1),
    ("© 2025 Adermio. Tous droits réservés.", "© 2026 Adermio. Alle Rechte vorbehalten.", 1),
    ("La dermatologie réinventée par l'intelligence artificielle.", "Hautanalyse neu gedacht – mit künstlicher Intelligenz.", 1),
    # --- hero
    ("<span>Support & Contact</span>", "<span>Support & Kontakt</span>", 1),
    ("Comment pouvons-nous vous aider ?", "Wie können wir Ihnen helfen?", 1),
    ("Une question sur votre analyse ou sur le fonctionnement de l'IA ? Remplissez le formulaire ci-dessous.",
     "Sie haben eine Frage zu Ihrer Hautanalyse oder dazu, wie die KI funktioniert? Schreiben Sie uns über das Formular unten.", 1),
    # --- formulaire
    (">Remplissez le formulaire ci-dessous :</h2>", ">Ihre Nachricht an uns</h2>", 1),
    ('mb-2">Email</label>', 'mb-2">E-Mail</label>', 1),
    ('placeholder="Votre Email"', 'placeholder="Ihre E-Mail-Adresse"', 1),
    ('mb-2">Nom</label>', 'mb-2">Name</label>', 1),
    ('placeholder="Votre Nom Complet"', 'placeholder="Ihr vollständiger Name"', 1),
    (">Objet de la demande</label>", ">Betreff</label>", 1),
    ("Ex : analyse de peau, assistance technique, autre...", "z. B. Hautanalyse, technischer Support, Sonstiges …", 1),
    ('mb-2">Message</label>', 'mb-2">Nachricht</label>', 1),
    (">Consentement RGPD</span>", ">Einwilligung gemäß DSGVO</span>", 1),
    ("J'accepte que mes données soient utilisées uniquement dans le cadre de ma demande de contact, conformément à la <a",
     "Ich bin damit einverstanden, dass meine Daten ausschließlich zur Bearbeitung meiner Kontaktanfrage verwendet werden. Mehr dazu in der <a", 1),
    (">politique de confidentialité</a>", ">Datenschutzerklärung</a>", 1),
    ("\n                        Envoyer\n", "\n                        Senden\n", 1),
    # --- succès / alternative
    (">Message envoyé !</h2>", ">Nachricht gesendet!</h2>", 1),
    ("Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.",
     "Vielen Dank für Ihre Nachricht. Unser Team meldet sich so schnell wie möglich bei Ihnen.", 1),
    ('mb-2">OU</p>', 'mb-2">ODER</p>', 1),
    ("Écrivez-nous directement par mail :", "Schreiben Sie uns direkt per E-Mail:", 1),
    # --- JS (messages affichés)
    ("'Veuillez remplir tous les champs.'", "'Bitte füllen Sie alle Felder aus.'", 1),
    ("'Veuillez entrer une adresse email valide.'", "'Bitte geben Sie eine gültige E-Mail-Adresse ein.'", 1),
    ("'Veuillez accepter le consentement RGPD pour continuer.'", "'Bitte stimmen Sie der Datenverarbeitung gemäß DSGVO zu, um fortzufahren.'", 1),
    ("'Envoi en cours...'", "'Wird gesendet …'", 1),
    ("'Une erreur est survenue. Veuillez réessayer ou nous écrire à contact@adermio.com.'",
     "'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder schreiben Sie uns an contact@adermio.com.'", 1),
    ("submitBtn.textContent = 'Envoyer';", "submitBtn.textContent = 'Senden';", 1),
]

# --- Relecture native 30/09 (R1–R5 + arbitrages PDG) : ajouts ---
TR += [
    ('Adermio © 2025</span>', 'Adermio © 2026</span>', 1),   # arbitrage 7
]
REGEX = []
REGEX += [
    (r'alt="(?:Logo Adermio|Adermio Logo)"', 'alt="Adermio-Logo"'),   # R4 : ordre allemand, uniformisé
    # Impressum obligatoire (§ 5 DDG) : lien absent du pied de page FR de contact.html ; balise <a> copiée du lien voisin
    (r'(\n([ \t]*)<a href="https://adermio\.com/de/nutzungsbedingungen" class="!text-slate-500 hover:!text-adermio-dark transition-colors">Nutzungsbedingungen</a>)',
     r'\1\n\2<a href="https://adermio.com/de/impressum" class="!text-slate-500 hover:!text-adermio-dark transition-colors">Impressum</a>'),
]
