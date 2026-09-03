# Table de traduction it/analysis-in-progress-second-cycle.html (source analyse-en-cours-second-cycle.html).
# Le FR utilise des entités HTML (&#233;…) et des échappements JS (é) : les FR sont copiés tels quels (raw strings).
TARGET = 'it/analysis-in-progress-second-cycle.html'
TR = [
    # --- head / SEO
    ("Analyse Cycle 2 en cours — Adermio", "Analisi Ciclo 2 in corso — Adermio", 3),
    ("Votre analyse comparative Cycle 2 est en cours de traitement.", "La tua analisi comparativa del Ciclo 2 è in elaborazione.", 3),
    # --- nav / menu / footer (cohérent avec it/home.html)
    (">Accueil</a>", ">Home</a>", 2),
    (">Faire l'analyse</a>", ">Inizia l'analisi</a>", 2),
    (">&#192; Propos</a>", ">Chi siamo</a>", 2),
    (">Nous Contacter</a>", ">Contattaci</a>", 2),
    (">Conditions d'utilisation</a>", ">Condizioni d'uso</a>", 1),
    (">Mentions L&#233;gales</a>", ">Note legali</a>", 1),
    (">Politique de Confidentialit&#233;</a>", ">Informativa sulla privacy</a>", 1),
    ("&#169; 2025 Adermio. Tous droits r&#233;serv&#233;s.", "&#169; 2025 Adermio. Tutti i diritti riservati.", 1),
    ("La dermatologie r&#233;invent&#233;e par l'intelligence artificielle.", "La dermatologia reinventata dall'intelligenza artificiale.", 1),
    # --- en-tête
    ('<h1 class="main-title">Analyse Cycle 2 en cours</h1>', '<h1 class="main-title">Analisi Ciclo 2 in corso</h1>', 1),
    ("Votre nouvelle analyse comparative est en pr&#233;paration.", "La tua nuova analisi comparativa è in preparazione.", 1),
    # --- carte de chargement
    ("G&#233;n&#233;ration du rapport Cycle 2...", "Generazione del report Ciclo 2...", 1),
    ("Initialisation de l'IA...", "Inizializzazione dell'IA...", 1),
    ("Analyse comparative en cours...", "Analisi comparativa in corso...", 1),
    ("<strong>Copie de s&#233;curit&#233;</strong><br>", "<strong>Copia di sicurezza</strong><br>", 1),
    ("Le rapport sera &#233;galement envoy&#233; sur votre email.", "Il report sarà inviato anche alla tua email.", 1),
    # --- succès
    ("Votre analyse Cycle 2 est pr&#234;te", "La tua analisi Ciclo 2 è pronta", 1),
    ("L'analyse comparative de votre peau est termin&#233;e. D&#233;couvrez votre &#233;volution et votre nouveau protocole.",
     "L'analisi comparativa della tua pelle è terminata. Scopri la tua evoluzione e il tuo nuovo protocollo.", 1),
    ("Ouvrir mon analyse Cycle 2", "Apri la mia analisi Ciclo 2", 1),
    ("Copie envoy&#233;e par email", "Copia inviata via email", 1),
    # --- grille de confiance
    (">&#201;volution</div>", ">Evoluzione</div>", 1),
    (">Comparaison Cycle 1 vs 2</div>", ">Confronto Ciclo 1 vs 2</div>", 1),
    (">Protocole Ajust&#233;</div>", ">Protocollo adattato</div>", 1),
    (">Routine optimis&#233;e</div>", ">Routine ottimizzata</div>", 1),
    (">Donn&#233;es Chiffr&#233;es</div>", ">Dati crittografati</div>", 1),
    (">100% Confidentiel</div>", ">100% riservato</div>", 1),
    # --- modale timeout
    ("Une petite minute...", "Un attimo...", 1),
    ("L'analyse Cycle 2 prend un peu plus de temps que pr&#233;vu. Pas d'inqui&#233;tude, votre rapport sera envoy&#233; par email d&#232;s qu'il est pr&#234;t. <br>Vous pouvez aussi nous contacter directement.",
     "L'analisi Ciclo 2 sta richiedendo un po' più di tempo del previsto. Nessun problema: il report ti sarà inviato via email non appena pronto. <br>Puoi anche contattarci direttamente.", 1),
    ("Contacter le support", "Contatta il supporto", 1),
    ("Continuer d'attendre", "Continua ad aspettare", 1),
    # --- JS
    ("Erreur : identifiant introuvable.", "Errore: identificativo non trovato.", 1),
    ("Connexion au serveur Adermio...", "Connessione al server Adermio...", 1),
    (r"R\u00e9cup\u00e9ration des donn\u00e9es Cycle 1...", "Recupero dei dati del Ciclo 1...", 1),
    ("Analyse comparative des photos...", "Analisi comparativa delle foto...", 1),
    (r"G\u00e9n\u00e9ration du diagnostic \u00e9volutif...", "Generazione dell'analisi evolutiva...", 1),
    ("Construction du protocole Cycle 2...", "Costruzione del protocollo Ciclo 2...", 1),
    (r"\u00c9valuation des progr\u00e8s cutanés...", "Valutazione dei progressi cutanei...", 1),
    ("Finalisation du rapport comparatif...", "Finalizzazione del report comparativo...", 1),
    (r"Derni\u00e8res v\u00e9rifications...", "Ultime verifiche...", 1),
    (r"Trafic plus dense que pr\u00e9vu : finalisation en cours...", "Traffico più intenso del previsto: finalizzazione in corso...", 1),
]
REGEX = []
