# Table de traduction de/processing.html (source analyse-en-cours.html).
TARGET = 'de/processing.html'
TR = [
    # --- head ---
    ('<title>Analyse en cours — Adermio</title>', '<title>Analyse läuft — Adermio</title>', 1),
    ('<title>Analyse en cours - Adermio</title>', '<title>Analyse läuft — Adermio</title>', 1),
    ('content="Analyse en cours — Adermio"', 'content="Analyse läuft — Adermio"', 2),
    ('content="Votre analyse dermatologique Adermio est en cours de traitement. Résultats disponibles sous quelques minutes."',
     'content="Ihre Adermio-Hautanalyse wird gerade ausgewertet. Die Ergebnisse liegen in wenigen Minuten vor."', 3),
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
    # --- statut ---
    ('Votre analyse est en cours...', 'Ihre Analyse läuft …', 1),
    ("Initialisation de l'IA...", 'KI wird gestartet …', 1),
    ('<b>Forte demande en cours</b><br>', '<b>Hohe Nachfrage</b><br>', 1),
    ('Tentative de finalisation ...', 'Wir versuchen, die Analyse abzuschließen …', 1),
    ('<b>Délai dépassé</b><br>', '<b>Das hat leider zu lange gedauert</b><br>', 1),
    ("L'analyse n'a pas pu être traitée en raison d'une trop forte demande. Merci de réessayer.",
     'Die Analyse konnte wegen zu hoher Nachfrage nicht abgeschlossen werden. Bitte versuchen Sie es erneut.', 1),
    ("Recommencer l'analyse", 'Analyse neu starten', 1),
    ('Cette fois-ci sera peut-être la bonne !', 'Vielleicht klappt es ja diesmal!', 1),
    ('>Analyse terminée avec succès !</p>', '>Analyse erfolgreich abgeschlossen!</p>', 1),
    ('Ouvrir mon analyse\n', 'Meine Analyse öffnen\n', 1),
    # --- pop-up visage ---
    ('>Aucun visage détecté</h2>', '>Kein Gesicht erkannt</h2>', 1),
    ('Veuillez prendre une photo nette de votre visage et recommencer votre analyse.',
     'Bitte nehmen Sie ein scharfes Foto Ihres Gesichts auf und starten Sie die Analyse erneut.', 1),
    ('>Recommencer</a>', '>Neu starten</a>', 1),
    # --- pop-up qualité ---
    ('Vérification conseillée', 'Bitte kurz prüfen', 1),
    ("Notre IA a détecté <b>peu d'imperfections</b> sur cette photo. <br><br>",
     'Unsere KI hat auf diesem Foto <b>kaum Unreinheiten</b> erkannt. <br><br>', 1),
    ("C'est possible si vous avez une peau parfaite (bravo !), mais cela arrive souvent si la photo est <b>floue</b> ou manque de <b>lumière</b>.",
     'Das kann bei makelloser Haut vorkommen (Glückwunsch!), passiert aber oft, wenn das Foto <b>unscharf</b> oder zu <b>dunkel</b> ist.', 1),
    ('Pour garantir la fiabilité de votre routine, nous vous conseillons de reprendre une photo.',
     'Damit Ihre Pflegeroutine wirklich zu Ihrer Haut passt, empfehlen wir, das Foto neu aufzunehmen.', 1),
    ('Reprendre une photo\n', 'Foto neu aufnehmen\n', 1),
    ("Je confirme, c'est bien ma peau <span", 'Passt so – das ist meine Haut <span', 1),
    # --- cartes ---
    ('>Le saviez-vous ?</h3>', '>Schon gewusst?</h3>', 1),
    ('>Données protégées</h3>', '>Geschützte Daten</h3>', 1),
    ('Votre photo est analysée par IA puis <span class="font-medium text-blue-700">anonymisée</span>. Votre identité reste 100% confidentielle.',
     'Ihr Foto wird per KI analysiert und anschließend <span class="font-medium text-blue-700">anonymisiert</span>. Ihre Identität bleibt zu 100 % vertraulich.', 1),
    ('>Excellent 4.4/5</span>', '>Ausgezeichnet 4,4/5</span>', 1),
    ('• Basé sur +2000 avis</span>', '• Über 2.000 Bewertungen</span>', 1),
    ('>+2000 avis</span>', '>2.000+ Bewertungen</span>', 1),
    # --- JS : étapes de chargement ---
    ('"Connexion sécurisée à l\'IA..."', '"Sichere Verbindung zur KI …"', 1),
    ('"Traitement de vos captures..."', '"Ihre Aufnahmen werden verarbeitet …"', 1),
    ('"Scan des imperfections et du grain de peau..."', '"Unreinheiten und Hautstruktur werden gescannt …"', 1),
    ('"Analyse dermatologique des zones..."', '"Die Gesichtsbereiche werden ausgewertet …"', 1),
    ('"Calcul de votre score de sévérité..."', '"Die Ausprägung Ihrer Akne wird berechnet …"', 1),
    ('"Génération de votre routine personnalisée..."', '"Ihre persönliche Pflegeroutine wird erstellt …"', 1),
    ('"Finalisation du rapport..."', '"Ihr Bericht wird fertiggestellt …"', 1),
    ('"Traitement prolongé en cours..."', '"Die Auswertung dauert etwas länger …"', 1),
    ('title.innerHTML = "Oups !";', 'title.innerHTML = "Hoppla!";', 1),
    ('"Votre Analyse est prête !"', '"Ihre Analyse ist fertig!"', 1),
    ('"Reprise de l\'analyse..."', '"Die Analyse wird fortgesetzt …"', 1),
    # --- JS : le saviez-vous ---
    ('{ title: "Les pores et l\'hydratation", text: "Les pores visibles ne sont pas forcément sales. Une bonne hydratation aide à resserrer leur apparence en régulant le sébum." }',
     '{ title: "Poren und Feuchtigkeit", text: "Sichtbare Poren sind nicht unbedingt verschmutzt. Ausreichend Feuchtigkeit reguliert den Talg und lässt sie feiner wirken." }', 1),
    ('{ title: "Le cycle de 28 jours", text: "Votre peau se renouvelle entièrement environ tous les 28 jours. La patience et la régularité sont les clés du succès." }',
     '{ title: "Die 28-Tage-Erneuerung", text: "Ihre Haut erneuert sich etwa alle 28 Tage vollständig. Geduld und Regelmäßigkeit sind der Schlüssel zum Erfolg." }', 1),
    ('{ title: "Le mythe du \'trop propre\'", text: "Nettoyer sa peau trop souvent détruit la barrière cutanée et peut paradoxalement causer plus d\'acné." }',
     '{ title: "Der Mythos „zu sauber“", text: "Wer die Haut zu oft reinigt, schädigt die Hautbarriere – und bekommt paradoxerweise oft mehr Akne." }', 1),
    ('{ title: "L\'impact du stress", text: "Le cortisol (hormone du stress) stimule la production de sébum. La relaxation fait partie intégrante du soin de la peau." }',
     '{ title: "Stress und Haut", text: "Cortisol (das Stresshormon) regt die Talgproduktion an. Entspannung gehört deshalb fest zur Hautpflege dazu." }', 1),
    # --- JS : avis ---
    ('text: "Top merci ! Ma peau commence être de mieux en mieux"', 'text: "Super, danke! Meine Haut wird langsam immer besser"', 1),
    ('text: "c\'est vraiment pas cher"', 'text: "echt nicht teuer"', 1),
    ('text: "Très contente de ma routine"', 'text: "Sehr zufrieden mit meiner Routine"', 1),
    ('text: "Pratique si on a pas le temps d\'aller chez un dermatho (et beaucoup moins cher)"',
     'text: "Praktisch, wenn man keine Zeit für den Hautarzt hat (und viel günstiger)"', 1),
    ('text: "J\'étais sceptique sur l\'analyse par photo, mais le diagnostic correspond exactement à mon cas, merci."',
     'text: "Ich war skeptisch, ob eine Hautanalyse per Foto funktioniert, aber die Auswertung trifft genau auf mich zu. Danke!"', 1),
    ('text: "enfin une routine qui correspond à mon acné, ma peau va beaucoup mieux !!"',
     'text: "endlich eine Routine, die zu meiner Akne passt, meiner Haut geht es viel besser!!"', 1),
    ('text: "PDF clair. Les recommandations sont accessibles en pharmacie."',
     'text: "Übersichtliches PDF. Die empfohlenen Produkte bekommt man in der Apotheke."', 1),
    ('text: "Précis et utile, ça va beaucoup mieux"', 'text: "Präzise und hilfreich, meiner Haut geht es viel besser"', 1),
    ('text: "Très clair et rassurant."', 'text: "Sehr klar und beruhigend."', 1),
    ('text: "je recommande"', 'text: "kann ich nur empfehlen"', 1),
    ('${r.age} ans</span>', '${r.age} Jahre</span>', 1),
    ('>Avis #${currentReviewIdx + 1}/10</div>', '>Kundenstimme ${currentReviewIdx + 1} von 10</div>', 1),
    # --- JS : étapes ---
    ('label: "Réception sécurisée"', 'label: "Fotos sicher empfangen"', 1),
    ('label: "Scan dermatologique IA"', 'label: "KI-Hautscan"', 1),
    ('label: "Analyse des imperfections"', 'label: "Analyse der Unreinheiten"', 1),
    ('label: "Génération du rapport"', 'label: "Berichterstellung"', 1),
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
