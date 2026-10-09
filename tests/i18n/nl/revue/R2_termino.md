# R2 — Terminologie peau/soins et conformité publicitaire (relecture native Pays-Bas)

Relecture du 09/10/2026 des 22 tables `tests/i18n/nl/tr_nl/*.py` (1 461 entrées), lues en entier, colonne FR contre colonne NL.
Ce qui a été vérifié : la terminologie de la peau et des soins (glossaire figé), le langage médical côté Adermio, les allégations plus fortes en NL qu'en FR, et les faits (chiffres, durées, prix, noms).
Corrections machine : `revue/R2_corrections.py` (16 entrées ; `apply_corrections.py --dry-run --only R2` → 16 à appliquer, 0 conflit, 0 refusée).
Notation : `table #n` = rang de l'entrée dans `TR` (on compte à partir de 0).

## Verdict

**C'est une bonne traduction, publiable après les 2 corrections bloquantes.** Le néerlandais est naturel et le registre « je » est tenu partout. La terminologie suit le glossaire d'une page à l'autre : puistjes, mee-eters / witte mee-eters, verwijde poriën, roodheid, acnevlekjes, (acne)littekens, gemengde huid, overtollige talg, opflakkering, lichte / matige / ernstige acne, actieve ingrediënten, zonbescherming.

**Aucun mot médical ne s'applique à Adermio.** On ne trouve nulle part diagnose, patiënt, therapie, klinisch, genezen ou prognose. *dermatoloog* ne désigne jamais Adermio. Quand *behandeling* apparaît, c'est toujours le traitement du médecin ou de l'utilisateur. Les points délicats sont bien neutralisés : « dermatologue IA » → *Wat onze AI adviseert*, « Fait dermatologique » → *Goed om te weten*, « Méthode clinique » → *Wetenschappelijk onderbouwd*, repli « Patient » → *welkom bij ronde 2* / chaîne vide.

**Les faits sont justes.** J'ai contrôlé tous les chiffres des blogs (107.840, 78 / 64 / 55 / 42 / 36 %, 60 / 48 %, 85 %, 40 / 20 %, 7-10 jours, 28-40 jours, 6-12 semaines…), les prix (€ 5,99, € 10 → € 5, € 0,18, fourchettes de budget), les durées, les dates, les noms et les identifiants légaux. Aucune erreur n'a été introduite.

## Problèmes systémiques (peu nombreux)

1. **Quelques allégations plus fortes en NL qu'en FR.** Le traducteur a parfois resserré une phrase en supprimant le modalisateur du français :
   - astuce « pores et hydratation » (`processing #50`, `processing2 #54`) : « aide à resserrer leur apparence » est devenu « maakt ze minder zichtbaar ». C'est une promesse d'efficacité cosmétique sans réserve. **Bloquant**, car le NL ne doit jamais promettre plus que le FR ;
   - `bilan #48` : le NL affirme que la peau a besoin de 90 jours pour se renouveler. Les pages d'attente disent « elke 28 dagen ». Le FR ne lie les 90 jours qu'à l'ancrage des résultats ;
   - `blog_waarom_acne #44` : « facteur dominant » est devenu « belangrijkste oorzaak vinden ». L'IA y « trouve la cause », ce qui glisse vers le diagnostic ;
   - `blog_huidtype #19` : une possibilité du FR (« peuvent s'avérer ») est rendue comme une certitude (goût).
2. **Le renvoi vers le médecin n'est pas homogène.** Le site dit *huisarts of dermatoloog* (accueil, Bronnen). Les CGU disent *een dermatoloog* seul (`gebruiksvoorwaarden #4`, `#26`). Or, aux Pays-Bas, on ne voit un dermatologue que sur renvoi du huisarts. J'aligne les deux (améliore). Si le juriste veut une traduction littérale des CGU, il peut refuser ces 2 corrections.
3. **Petites incohérences d'une page à l'autre :**
   - slogan du pied de page différent sur `processing_second_cycle #10` ;
   - cicatrices en relief : *verdikt* (hormonale) contre *verheven* (waarom) ;
   - bouton « Cicatrices / Marques » → *Littekens / vlekjes* au lieu de *acnevlekjes* ;
   - « Purge » : l'ordre des mots est inversé par rapport au glossaire ;
   - *45 s* contre *sec.* ;
   - le pronom de *huid* varie : *hem* (accueil #19), *zijn* (hormonale #64), *haar* (bilan #88, #97). Ce dernier point est sans gravité : *ze/haar* est l'usage des marques de soin néerlandaises, *hem* reste courant aux Pays-Bas. Je ne corrige que le cas où l'on peut éviter le pronom.
4. **Rien à signaler** sur les témoignages : le même avis a le même texte sur home, processing et processing2. Rien non plus sur les noms d'ingrédients (salicylzuur, benzoylperoxide, isotretinoïne, retinoïden, corticosteroïden, spironolacton, ceramiden, niacinamide) ni sur les termes juridiques.

## Corrections proposées (16)

| Gravité | Nb | Entrées |
|---|---|---|
| bloquant | 2 | `processing #50`, `processing2 #54` (« aide à » supprimé) |
| améliore | 6 | `bilan #48` (90 jours), `blog_waarom_acne #44` (oorzaak → factor), `processing_second_cycle #10` (slogan), `gebruiksvoorwaarden #4` et `#26` (huisarts), `second_cycle #22` (acnevlekjes) |
| goût | 8 | `second_cycle #28` (huidstructuur), `#47` (ordre purging), `blog_hormonale_acne #78` (verheven), `#64` (pronom), `#31` (kalender), `home #103` (zwarte mee-eters), `over_ons #33` (sec.), `blog_huidtype #19` (possibilité) |

Points vus mais laissés tels quels, car acceptables :
- *vochtarme huid* pour « peau déshydratée » : c'est le terme courant en NL, à ajouter au glossaire ;
- *vlekjes* seul dans le blog hormonale : le contexte d'acné suffit ;
- *Medische aandachtspunten* (premium #43) : ce sont les informations de santé de l'utilisateur, l'exception du glossaire s'applique ;
- *AI-scan van alle kanten* : le libellé est court et colle à la réalité des 3 photos ;
- *Waar ontstaat acne* : c'est naturel en NL ;
- *Hormonale acne … makkelijkste om aan te pakken* : *aanpakken* rend « gérer » partout sur le site ;
- *microkystes* traduit par *cysten* dans le blog hormonale #33 : le FR emploie « microkystes » à tort pour des lésions profondes. *witte mee-eters* y serait absurde.

## À ajouter au glossaire

- peau déshydratée → *vochtarme huid* ;
- état de peau → *huidconditie* ;
- nodules → *knobbels* ;
- comédon ouvert / fermé → *open / gesloten comedo* ;
- hyperkératinisation → *overmatige verhoorning* ;
- cicatrices creusées / en relief → *ingezonken (ice pick, boxcar) / verheven littekens* ;
- acné mécanique → *mechanische acne* ;
- acné de pommade → *pommade-acne* ;
- phase lutéale → *luteale fase* ;
- SOPK → *PCOS (polycysteus ovariumsyndroom)* ;
- pronom de *huid* → *ze / haar*, ou l'éviter.

## Allégations du FR qui posent un risque aux Pays-Bas

Le NL les traduit fidèlement. Elles sont à trancher par Antoine et par le juriste avant l'ouverture NL/BE.

Cadres de référence :
- Nederlandse Reclame Code (NRC), art. 7 (publicité trompeuse) ;
- BW 6:193b-j (pratiques commerciales déloyales, trompeuses ou agressives) ;
- par analogie, les critères communs des allégations cosmétiques : règlement (UE) 655/2013 et Reclamecode Cosmetica (véracité, preuves, sincérité) ;
- règlement (UE) 2017/745 sur les dispositifs médicaux (intended purpose) ;
- AVG (transparence) ;
- un pré-contrôle KOAG/KAG est envisageable pour les textes à visée santé.

Les points déjà listés dans `POINTS_JURIDIQUES.md` (98,5 %, 4,4/5, avant/après, qualification de dispositif médical, « chat dermato IA ») ne sont repris que s'il y a un élément nouveau.

### Risque élevé

1. **Discours de rétention anxiogène et faux sur le plan scientifique**
   - Où : `bilan #48`, `#60`, `#61`, `#79-81`, page 28-dagencheck.
   - Ce que dit le texte : « sans suivi, les progrès régressent en 2 à 3 semaines » ; « semaines 9-12 : retour quasi complet à l'état initial, 28 jours d'efforts perdus » ; « le renouvellement cellulaire complet prend 90 jours… les couches profondes nécessitent les cycles 2 et 3 ».
   - Pourquoi : le renouvellement de l'épiderme prend environ 28 à 40 jours (c'est ce que dit le blog d'Adermio lui-même, et les pages d'attente disent 28 jours). Le chiffre de 90 jours sert à vendre la ronde 2. C'est une allégation fausse, et une pression par la peur au moment de l'achat : pratique trompeuse, voire agressive (BW 6:193c / 6:193h).
2. **Indicateurs fabriqués présentés comme mesurés**
   - Où : `bilan #86-88`.
   - Ce que dit le texte : « +X % huidstructuur », « +X % egaler », « +X % uitstraling », avec des phrases comme « je huidbarrière wordt sterker ».
   - Pourquoi : ces chiffres sont calculés à partir de la régularité de la routine et des notes données par l'utilisateur, pas à partir d'une mesure de la peau. Les présenter comme une amélioration mesurée est trompeur (NRC art. 7 ; exigence de preuve des allégations d'efficacité).
3. **Contradiction sur l'entraînement de l'IA**
   - Où : `over_ons #17-18`, `#27`, `#30` ; `form #133`.
   - Ce que dit le texte : « chaque analyse rend notre modèle plus intelligent », « contribue à la recherche pour rendre notre IA plus performante », « il apprend en continu », « vos informations contribuent à l'amélioration de notre IA ».
   - Pourquoi : `privacyverklaring #25` et `gebruiksvoorwaarden #18` disent l'inverse (« jamais utilisées pour entraîner des modèles d'IA »). C'est un manquement à la transparence (AVG art. 5 et 12-13) et une communication trompeuse, quelle que soit la version vraie.
4. **« Anonymisées » et « 100 % confidentiel »**
   - Où : `home #99`, `processing #35`, `processing2 #35`, `over_ons #27`, badges `success #29`, `processing_second_cycle #27`.
   - Pourquoi : une photo de visage conservée et rattachée à un compte (« tant que le compte est actif », privacyverklaring §5) n'est pas anonyme au sens de l'AVG. L'allégation absolue est inexacte.
5. **L'IA « trouve la cause » de l'acné**
   - Où : `blog_waar_acne #46` (« vertelt je wat die verdeling zegt over de oorzaak »), `blog_hormonale_acne #37` (« identifier si le facteur hormonal domine »), `blog_waarom_acne #43-44`, `#78`, `blog_huidtype #47` (« identifie précisément »).
   - Pourquoi : établir la cause d'une affection cutanée est une finalité diagnostique. Ces CTA renforcent la qualification de dispositif médical (règle 11) déjà signalée et contredisent « geen medisch advies ».
6. **Témoignage « plus besoin du médecin »**
   - Où : `home #87`, `processing #57`, `processing2 #61`.
   - Ce que dit le témoignage : « Handig als je geen tijd hebt om naar de huidarts te gaan (en veel goedkoper) ».
   - Pourquoi : il présente Adermio comme un substitut à la consultation, à rebours de l'avertissement « vervangt geen bezoek aan je huisarts of dermatoloog ». La décision 10 du glossaire interdit de réécrire un avis : c'est donc à Antoine de choisir (garder, retirer de la version NL, ou ne pas le montrer à côté de la FAQ médecin).

### Risque moyen

7. **Chiffres de précision et de rapidité incohérents**
   - Précision : « 98,5 % » (`home #23`) contre « 98 % précision de détection » (`over_ons #31-32`).
   - Durée de l'analyse, selon les pages : « ~30 sec. » (`home #25`), « 2 min. » (`#40`), « environ 1 minute » (`#101`), « en quelques secondes » (`#35`), « < 45 s » (`over_ons #33`), « en quelques minutes » (meta processing).
   - Pourquoi : des caractéristiques principales contradictoires ne peuvent pas toutes être étayées (BW 6:193c).
8. **« Précision comparable à l'œil d'un expert »**
   - Où : `over_ons #30`.
   - Pourquoi : c'est une comparaison implicite avec un dermatologue, qui exige une étude publiée. Elle renforce aussi le risque de qualification de dispositif médical.
9. **« L'exigence dermatologique »**
   - Où : `over_ons #13` (« de strenge maatstaven van de dermatologie ») et `over_ons #1` (« kennis uit de dermatologie »).
   - Pourquoi : la formule suggère une caution dermatologique. À garder seulement si un dermatologue intervient réellement (relecture, validation des règles) et que c'est documenté.
10. **Neutralité absolue**
    - Où : `over_ons #20`, `#24-25`.
    - Ce que dit le texte : « Adermio ne vend aucun produit cosmétique, n'est affilié à aucune marque, recommandations 100 % neutres », « refusons tout partenariat commercial caché ».
    - Pourquoi : à vérifier contre la pratique réelle, dans l'app comme sur le web (liens affiliés, règles de note ou de mise en avant des produits). Le moindre lien commercial rend l'allégation trompeuse (NRC art. 7, publicité déguisée).
11. **Preuve sociale et prix barré de la ronde 2**
    - Où : `bilan #76` (« 73 % des utilisateurs continuent en Cycle 2 ») et `#71-73` (« € 10 → € 5, -50 % »).
    - Pourquoi : le pourcentage doit être prouvable. Le prix de référence doit avoir été réellement pratiqué, sinon c'est une réduction fictive.
12. **Techniques non étayées**
    - Où : `success #24-26` (« Scan HD », « Analyse pore par pore », badge « Wetenschappelijk onderbouwd »).
    - Pourquoi : « pore par pore » décrit une capacité technique à prouver. Le badge scientifique doit renvoyer à la page Bronnen, ou être retiré.
13. **Superlatif d'exclusivité**
    - Où : `blog_waar_acne #22` (« une ressource que personne d'autre n'a »).
    - Pourquoi : c'est invérifiable (NRC art. 7).

### Exactitude scientifique des blogs (risque de réputation, faible risque juridique)

14. **Chocolat**
    - Où : `blog_waarom_acne #40` et `#48`.
    - Ce que dit le texte : le chocolat noir « n'a jamais été significativement corrélé à l'acné », « aucune étude sérieuse ».
    - Pourquoi : c'est contestable. De petits essais randomisés de 2014-2016 ont rapporté une aggravation avec du chocolat très riche en cacao. Mieux vaut nuancer (« les preuves sont faibles et discutées »).
15. **Lait écrémé**
    - Où : `blog_waarom_acne #39`.
    - Ce que dit le texte : le lait écrémé est « riche en hormones bovines (IGF-1) ».
    - Pourquoi : c'est une simplification. L'association lait écrémé / acné est observationnelle et le mécanisme reste discuté.
16. **Chiffres non sourcés**
    - Où : `blog_waar_acne #41` (« 2 à 5 fois plus de récepteurs aux androgènes »), `blog_waar_acne #40` (attribution de la « zone U » à l'American Academy of Dermatology), `blog_hormonale_acne #35` (« 40 % des femmes de 25-40 ans » ont une acné *hormonale*).
    - Pourquoi : le même 40 % est donné dans `blog_waarom_acne #61` pour l'acné adulte en général. Il faut une source ou une formulation prudente.
17. **Renouvellement de la peau : trois chiffres sur le site**
    - Où : 28 jours (`processing #51`, `processing2 #55`), 28-40 jours (`blog_waarom_acne #76`), 90 jours (`bilan #48`, `#61`).
    - Pourquoi : il faut un seul chiffre exact (voir le point 1).
