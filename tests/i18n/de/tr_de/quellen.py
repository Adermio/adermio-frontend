# Table de traduction de/quellen.html (source sources.html).
# Les références bibliographiques (titres d'articles, auteurs, revues) restent telles quelles.
TARGET = 'de/quellen.html'
TR = [
    # --- head / SEO
    ("Sources scientifiques — Adermio", "Wissenschaftliche Quellen — Adermio", 3),
    ("Bibliographie scientifique d'Adermio — recommandations de sociétés savantes, essais cliniques et méta-analyses qui fondent les analyses et recommandations de l'app.",
     "Die wissenschaftlichen Quellen von Adermio – Leitlinien von Fachgesellschaften, kontrollierte Studien und Metaanalysen, auf denen die Auswertungen und Empfehlungen der App beruhen.", 3),
    # --- nav / menu / footer
    (">Accueil</a>", ">Startseite</a>", 2),
    (">Faire l'analyse</a>", ">Analyse starten</a>", 2),
    (">À Propos</a>", ">Über uns</a>", 2),
    (">Nous Contacter</a>", ">Kontakt</a>", 2),
    (">Conditions d'utilisation</a>", ">Nutzungsbedingungen</a>", 1),
    (">Conditions de vente</a>", ">AGB</a>", 1),
    (">Mentions Légales</a>", ">Impressum</a>", 1),
    (">Politique de Confidentialité</a>", ">Datenschutz</a>", 1),
    ("© 2026 Adermio. Tous droits réservés.", "© 2026 Adermio. Alle Rechte vorbehalten.", 1),
    ("La dermatologie réinventée par l'intelligence artificielle.", "Hautanalyse neu gedacht – mit künstlicher Intelligenz.", 1),
    # --- en-tête
    ("<span>Science</span>", "<span>Wissenschaft</span>", 1),
    ("\n                Sources scientifiques\n", "\n                Wissenschaftliche Quellen\n", 1),
    ("Mise à jour : juillet 2026\n", "Stand: Juli 2026\n", 1),
    # --- introduction
    ("Les analyses, scores et recommandations d&#x27;Adermio s&#x27;appuient sur la littérature dermatologique et nutritionnelle publiée : recommandations de sociétés savantes, essais cliniques randomisés, revues systématiques et méta-analyses. Touchez une référence pour la consulter.",
     "Die Auswertungen, Scores und Empfehlungen von Adermio stützen sich auf veröffentlichte Fachliteratur aus Dermatologie und Ernährungswissenschaft: Leitlinien von Fachgesellschaften, randomisierte kontrollierte Studien, systematische Übersichtsarbeiten und Metaanalysen. Klicken oder tippen Sie auf einen Eintrag, um den Artikel aufzurufen.", 1),
    ("Adermio fournit une information cosmétique et de bien-être. L&#x27;application n&#x27;établit aucun diagnostic médical et ne remplace pas la consultation d&#x27;un professionnel de santé.",
     "Adermio bietet Informationen rund um Kosmetik und Wohlbefinden. Die App nimmt keine medizinische Beurteilung vor und ersetzt keine ärztliche Beratung.", 1),
    # --- rubriques
    (">Acné — compréhension &amp; prise en charge</h2>", ">Akne – verstehen &amp; gezielt pflegen</h2>", 1),
    (">Actifs cosmétiques</h2>", ">Kosmetische Wirkstoffe</h2>", 1),
    (">Comédogénicité des ingrédients</h2>", ">Komedogenität von Inhaltsstoffen</h2>", 1),
    (">Photoprotection</h2>", ">Sonnenschutz</h2>", 1),
    (">Hydratation &amp; barrière cutanée</h2>", ">Feuchtigkeit &amp; Hautbarriere</h2>", 1),
    (">Grossesse &amp; sécurité des soins</h2>", ">Schwangerschaft &amp; sichere Pflege</h2>", 1),
    (">Alimentation &amp; peau</h2>", ">Ernährung &amp; Haut</h2>", 1),
    (">Sommeil, stress &amp; peau</h2>", ">Schlaf, Stress &amp; Haut</h2>", 1),
    # --- pied de bibliographie
    ("Bibliographie vérifiée — chaque lien pointe vers l&#x27;article original (PubMed ou éditeur). Mise à jour : juillet 2026.",
     "Geprüfte Quellenangaben – jeder Link führt zum Originalartikel (PubMed oder Verlag). Stand: Juli 2026.", 1),
]

# --- Relecture native 30/09 (R1–R5 + arbitrages PDG) : ajouts ---
REGEX = []
REGEX += [
    (r'alt="(?:Logo Adermio|Adermio Logo)"', 'alt="Adermio-Logo"'),   # R4 : ordre allemand, uniformisé
]
