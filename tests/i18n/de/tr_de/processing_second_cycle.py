# Table de traduction de/analysis-in-progress-second-cycle.html (source analyse-en-cours-second-cycle.html).
# « Cycle 2 » = « zweite Runde » (jamais « Zyklus »). Échappements JS (é) copiés tels quels.
TARGET = 'de/analysis-in-progress-second-cycle.html'
TR = [
    # --- head / SEO
    ("Analyse Cycle 2 en cours — Adermio", "Zweite Runde: Hautanalyse läuft – Adermio", 3),
    ("Votre analyse comparative Cycle 2 est en cours de traitement.", "Ihre Vergleichsanalyse der zweiten Runde wird gerade erstellt.", 3),
    # --- nav / menu / footer (glossaire)
    (">Accueil</a>", ">Startseite</a>", 2),
    (">Faire l'analyse</a>", ">Analyse starten</a>", 2),
    (">&#192; Propos</a>", ">&#220;ber uns</a>", 2),
    (">Nous Contacter</a>", ">Kontakt</a>", 2),
    (">Conditions d'utilisation</a>", ">Nutzungsbedingungen</a>", 1),
    (">Mentions L&#233;gales</a>", ">Impressum</a>", 1),
    (">Politique de Confidentialit&#233;</a>", ">Datenschutz</a>", 1),
    ("&#169; 2025 Adermio. Tous droits r&#233;serv&#233;s.", "&#169; 2026 Adermio. Alle Rechte vorbehalten.", 1),
    ("La dermatologie r&#233;invent&#233;e par l'intelligence artificielle.", "Hautanalyse neu gedacht – mit k&#252;nstlicher Intelligenz.", 1),
    # --- en-tête
    ('<h1 class="main-title">Analyse Cycle 2 en cours</h1>', '<h1 class="main-title">Ihre zweite Runde wird ausgewertet</h1>', 1),
    ("Votre nouvelle analyse comparative est en pr&#233;paration.", "Ihre neue Vergleichsanalyse wird vorbereitet.", 1),
    # --- carte de chargement
    ("G&#233;n&#233;ration du rapport Cycle 2...", "Bericht der zweiten Runde wird erstellt …", 1),
    ("Initialisation de l'IA...", "KI wird gestartet …", 1),
    ("Analyse comparative en cours...", "Vergleichsanalyse l&#228;uft …", 1),
    ("<strong>Copie de s&#233;curit&#233;</strong><br>", "<strong>Kopie per E-Mail</strong><br>", 1),
    ("Le rapport sera &#233;galement envoy&#233; sur votre email.", "Der Bericht wird Ihnen zus&#228;tzlich per E-Mail zugeschickt.", 1),
    # --- succès
    ("Votre analyse Cycle 2 est pr&#234;te", "Ihre Auswertung der zweiten Runde ist fertig", 1),
    ("L'analyse comparative de votre peau est termin&#233;e. D&#233;couvrez votre &#233;volution et votre nouveau protocole.",
     "Die Vergleichsanalyse Ihrer Haut ist abgeschlossen. Sehen Sie, wie sich Ihre Haut entwickelt hat, und entdecken Sie Ihre neue Pflegeroutine.", 1),
    ("Ouvrir mon analyse Cycle 2", "Bericht &#246;ffnen", 1),
    ("Copie envoy&#233;e par email", "Kopie per E-Mail verschickt", 1),
    # --- grille de confiance
    (">&#201;volution</div>", ">Verlauf</div>", 1),
    (">Comparaison Cycle 1 vs 2</div>", ">Runde 1 und 2 im Vergleich</div>", 1),
    (">Protocole Ajust&#233;</div>", ">Angepasste Pflegeroutine</div>", 1),
    (">Routine optimis&#233;e</div>", ">Optimierte Routine</div>", 1),
    (">Donn&#233;es Chiffr&#233;es</div>", ">Verschl&#252;sselte Daten</div>", 1),
    (">100% Confidentiel</div>", ">100 % vertraulich</div>", 1),
    # --- modale timeout
    ("Une petite minute...", "Einen Moment noch …", 1),
    ("L'analyse Cycle 2 prend un peu plus de temps que pr&#233;vu. Pas d'inqui&#233;tude, votre rapport sera envoy&#233; par email d&#232;s qu'il est pr&#234;t. <br>Vous pouvez aussi nous contacter directement.",
     "Die Auswertung der zweiten Runde dauert etwas l&#228;nger als erwartet. Keine Sorge: Ihr Bericht wird Ihnen per E-Mail zugeschickt, sobald er fertig ist. <br>Sie k&#246;nnen sich auch direkt an uns wenden.", 1),
    ("Contacter le support", "Support kontaktieren", 1),
    ("Continuer d'attendre", "Weiter warten", 1),
    # --- JS (textes affichés dans le sous-titre)
    ("Erreur : identifiant introuvable.", "Wir konnten Ihre Analyse nicht zuordnen. Bitte öffnen Sie den Link aus Ihrer E-Mail erneut.", 1),
    ("Connexion au serveur Adermio...", "Verbindung zum Adermio-Server …", 1),
    ("R\\u00e9cup\\u00e9ration des donn\\u00e9es Cycle 1...", "Daten der ersten Runde werden abgerufen …", 1),
    ("Analyse comparative des photos...", "Fotos werden verglichen …", 1),
    ("G\\u00e9n\\u00e9ration du diagnostic \\u00e9volutif...", "Verlaufsauswertung wird erstellt …", 1),
    ("Construction du protocole Cycle 2...", "Pflegeroutine f\\u00fcr die zweite Runde wird erstellt …", 1),
    ("\\u00c9valuation des progr\\u00e8s cutanés...", "Fortschritte Ihrer Haut werden bewertet …", 1),
    ("Finalisation du rapport comparatif...", "Vergleichsbericht wird fertiggestellt …", 1),
    ("Derni\\u00e8res v\\u00e9rifications...", "Letzte Pr\\u00fcfungen …", 1),
    ("Trafic plus dense que pr\\u00e9vu : finalisation en cours...", "Gerade viel los: Ihr Bericht wird fertiggestellt …", 1),
]
REGEX = []

# --- Relecture native 30/09 (R1–R5 + arbitrages PDG) : ajouts ---
TR += [
    ('Adermio &#169; 2025</span>', 'Adermio &#169; 2026</span>', 1),   # arbitrage 7
]
REGEX += [
    (r'alt="(?:Logo Adermio|Adermio Logo)"', 'alt="Adermio-Logo"'),   # R4 : ordre allemand, uniformisé
    (r'(progressText\.textContent = Math\.floor\((?:p|progress)\) \+ )"%"', r'\1" %"'),   # R2/R3 : espace avant % (42 %)
]
