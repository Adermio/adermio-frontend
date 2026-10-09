# Table de traduction nl/analysis-in-progress-second-cycle.html — Table de traduction de/analysis-in-progress-second-cycle.html (source analyse-en-cours-second-cycle.html).
# Colonne de gauche = littéral FR EXACT de la page préparée (ne pas modifier) ; à droite : le néerlandais.
# None = pas encore traduit (apply_tr_nl.py refuse). 3e valeur = nombre d'occurrences attendu.
# « Cycle 2 » (l'offre) = ronde 2 / tweede ronde — JAMAIS « cyclus ». « protocole » = routine. « diagnostic » = analyse.
# Pourcentage collé (42%) : on garde le JS du FR tel quel (pas de regex d'espace, propre à l'allemand).
TARGET = 'nl/analysis-in-progress-second-cycle.html'
TR = [
    # --- head / SEO
    ('Analyse Cycle 2 en cours — Adermio',
     'Ronde 2: je analyse wordt gemaakt — Adermio', 3),
    ('Votre analyse comparative Cycle 2 est en cours de traitement.',
     'Je vergelijkende analyse van ronde 2 wordt nu gemaakt.', 3),
    # --- nav / menu / footer (glossaire)
    ('>Accueil</a>',
     '>Home</a>', 2),
    (">Faire l'analyse</a>",
     '>Start je analyse</a>', 2),
    ('>&#192; Propos</a>',
     '>Over ons</a>', 2),
    ('>Nous Contacter</a>',
     '>Contact</a>', 2),
    (">Conditions d'utilisation</a>",
     '>Gebruiksvoorwaarden</a>', 1),
    ('>Mentions L&#233;gales</a>',
     '>Juridische informatie</a>', 1),
    ('>Politique de Confidentialit&#233;</a>',
     '>Privacyverklaring</a>', 1),
    ('&#169; 2025 Adermio. Tous droits r&#233;serv&#233;s.',
     '&#169; 2026 Adermio. Alle rechten voorbehouden.', 1),
    # slogan : « dermatologie » évité pour Adermio (titre protégé, décision 2)
    ("La dermatologie r&#233;invent&#233;e par l'intelligence artificielle.",
     'Huidanalyse opnieuw bedacht, met kunstmatige intelligentie.', 1),
    # --- en-tête
    ('<h1 class="main-title">Analyse Cycle 2 en cours</h1>',
     '<h1 class="main-title">Ronde 2 wordt geanalyseerd</h1>', 1),
    ('Votre nouvelle analyse comparative est en pr&#233;paration.',
     'Je nieuwe vergelijkende analyse wordt voorbereid.', 1),
    # --- carte de chargement
    ('G&#233;n&#233;ration du rapport Cycle 2...',
     'Rapport van ronde 2 wordt gemaakt...', 1),
    ("Initialisation de l'IA...",
     'AI opstarten...', 1),
    ('Analyse comparative en cours...',
     'Vergelijkende analyse loopt...', 1),
    ('<strong>Copie de s&#233;curit&#233;</strong><br>',
     '<strong>Kopie per e-mail</strong><br>', 1),
    ('Le rapport sera &#233;galement envoy&#233; sur votre email.',
     'Je ontvangt het rapport ook per e-mail.', 1),
    # --- succès
    ('Votre analyse Cycle 2 est pr&#234;te',
     'Je analyse van ronde 2 is klaar', 1),
    ("L'analyse comparative de votre peau est termin&#233;e. D&#233;couvrez votre &#233;volution et votre nouveau protocole.",
     'De vergelijkende analyse van je huid is klaar. Bekijk hoe je huid is veranderd en wat je nieuwe routine is.', 1),
    ('Ouvrir mon analyse Cycle 2',
     'Bekijk je analyse van ronde 2', 1),
    ('Copie envoy&#233;e par email',
     'Kopie per e-mail verstuurd', 1),
    # --- grille de confiance
    ('>&#201;volution</div>',
     '>Voortgang</div>', 1),
    ('>Comparaison Cycle 1 vs 2</div>',
     '>Ronde 1 en 2 vergeleken</div>', 1),
    ('>Protocole Ajust&#233;</div>',
     '>Aangepaste routine</div>', 1),
    ('>Routine optimis&#233;e</div>',
     '>Afgestemd op je resultaten</div>', 1),
    ('>Donn&#233;es Chiffr&#233;es</div>',
     '>Versleutelde gegevens</div>', 1),
    ('>100% Confidentiel</div>',
     '>100% vertrouwelijk</div>', 1),
    # --- modale timeout
    ('Une petite minute...',
     'Nog heel even...', 1),
    ("L'analyse Cycle 2 prend un peu plus de temps que pr&#233;vu. Pas d'inqui&#233;tude, votre rapport sera envoy&#233; par email d&#232;s qu'il est pr&#234;t. <br>Vous pouvez aussi nous contacter directement.",
     'De analyse van ronde 2 duurt wat langer dan normaal. Geen zorgen: je ontvangt je rapport per e-mail zodra het klaar is. <br>Je kunt ook rechtstreeks contact met ons opnemen.', 1),
    ('Contacter le support',
     'Contact opnemen', 1),
    ("Continuer d'attendre",
     'Verder wachten', 1),
    # --- JS (textes affichés dans le sous-titre ; décision 12 pour l'erreur)
    ('Erreur : identifiant introuvable.',
     'We kunnen je analyse niet vinden. Open de link uit je e-mail opnieuw.', 1),
    ('Connexion au serveur Adermio...',
     'Verbinding maken met de Adermio-server...', 1),
    ('R\\u00e9cup\\u00e9ration des donn\\u00e9es Cycle 1...',
     'Gegevens van ronde 1 ophalen...', 1),
    ('Analyse comparative des photos...',
     "Foto's vergelijken...", 1),
    ('G\\u00e9n\\u00e9ration du diagnostic \\u00e9volutif...',
     'Je voortgang analyseren...', 1),
    ('Construction du protocole Cycle 2...',
     'Routine voor ronde 2 samenstellen...', 1),
    ('\\u00c9valuation des progr\\u00e8s cutanés...',
     'Vooruitgang van je huid beoordelen...', 1),
    ('Finalisation du rapport comparatif...',
     'Vergelijkend rapport afronden...', 1),
    ('Derni\\u00e8res v\\u00e9rifications...',
     'Laatste controles...', 1),
    ('Trafic plus dense que pr\\u00e9vu : finalisation en cours...',
     'Het is erg druk: je rapport wordt afgerond...', 1),
    ('Adermio &#169; 2025</span>',
     'Adermio &#169; 2026</span>', 1),
]
REGEX = [
    (r'alt="(?:Logo Adermio|Adermio Logo)"', 'alt="Adermio-logo"'),
]
# REGEX de la table allemande, pour information (propres à l'allemand sauf mention) :
#   ('alt="(?:Logo Adermio|Adermio Logo)"', 'alt="Adermio-Logo"')
#   ('(progressText\\.textContent = Math\\.floor\\((?:p|progress)\\) \\+ )"%"', '\\1" %"')
