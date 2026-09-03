# Table de traduction it/sources.html (source sources.html). Chaque FR doit exister tel quel.
# Les titres d'articles, revues, auteurs, DOI et URLs sont des références bibliographiques : jamais traduits.
TARGET = 'it/sources.html'
TR = [
    # --- head / SEO
    ("Sources scientifiques — Adermio", "Fonti scientifiche — Adermio", 3),
    ("Bibliographie scientifique d'Adermio — recommandations de sociétés savantes, essais cliniques et méta-analyses qui fondent les analyses et recommandations de l'app.",
     "Bibliografia scientifica di Adermio — linee guida delle società scientifiche, studi clinici e meta-analisi su cui si basano le analisi e i consigli dell'app.", 3),
    # --- nav / menu / footer (identiques à it/home.html)
    (">Accueil</a>", ">Home</a>", 2),
    (">Faire l'analyse</a>", ">Inizia l'analisi</a>", 2),
    (">À Propos</a>", ">Chi siamo</a>", 2),
    (">Nous Contacter</a>", ">Contattaci</a>", 2),
    (">Conditions d'utilisation</a>", ">Condizioni d'uso</a>", 1),
    (">Conditions de vente</a>", ">Condizioni di vendita</a>", 1),
    (">Mentions Légales</a>", ">Note legali</a>", 1),
    (">Politique de Confidentialité</a>", ">Informativa sulla privacy</a>", 1),
    ("© 2026 Adermio. Tous droits réservés.", "© 2026 Adermio. Tutti i diritti riservati.", 1),
    ("La dermatologie réinventée par l'intelligence artificielle.", "La dermatologia reinventata dall'intelligenza artificiale.", 1),
    # --- header
    ("<span>Science</span>", "<span>Scienza</span>", 1),
    ("Sources scientifiques\n            </h1>", "Fonti scientifiche\n            </h1>", 1),
    # --- intro
    ("Les analyses, scores et recommandations d&#x27;Adermio s&#x27;appuient sur la littérature dermatologique et nutritionnelle publiée : recommandations de sociétés savantes, essais cliniques randomisés, revues systématiques et méta-analyses. Touchez une référence pour la consulter.",
     "Le analisi, i punteggi e i consigli di Adermio si basano sulla letteratura dermatologica e nutrizionale pubblicata: linee guida delle società scientifiche, studi clinici randomizzati, revisioni sistematiche e meta-analisi. Tocca un riferimento per consultarlo.", 1),
    ("Adermio fournit une information cosmétique et de bien-être. L&#x27;application n&#x27;établit aucun diagnostic médical et ne remplace pas la consultation d&#x27;un professionnel de santé.",
     "Adermio fornisce informazioni di natura cosmetica e di benessere. L&#x27;applicazione non effettua alcuna valutazione medica e non sostituisce il consulto di un professionista sanitario.", 1),
    # --- rubriques
    (">Acné — compréhension &amp; prise en charge</h2>", ">Acne — comprensione &amp; gestione</h2>", 1),
    (">Actifs cosmétiques</h2>", ">Attivi cosmetici</h2>", 1),
    (">Comédogénicité des ingrédients</h2>", ">Comedogenicità degli ingredienti</h2>", 1),
    (">Photoprotection</h2>", ">Fotoprotezione</h2>", 1),
    (">Hydratation &amp; barrière cutanée</h2>", ">Idratazione &amp; barriera cutanea</h2>", 1),
    (">Grossesse &amp; sécurité des soins</h2>", ">Gravidanza &amp; sicurezza dei prodotti</h2>", 1),
    (">Alimentation &amp; peau</h2>", ">Alimentazione &amp; pelle</h2>", 1),
    (">Sommeil, stress &amp; peau</h2>", ">Sonno, stress &amp; pelle</h2>", 1),
    # --- note de bas de page (avant la date d'en-tête : contient la même chaîne de date)
    ("Bibliographie vérifiée — chaque lien pointe vers l&#x27;article original (PubMed ou éditeur). Mise à jour : juillet 2026.",
     "Bibliografia verificata — ogni link rimanda all&#x27;articolo originale (PubMed o editore). Aggiornamento: luglio 2026.", 1),
    ("Mise à jour : juillet 2026", "Aggiornamento: luglio 2026", 1),
]
REGEX = []
