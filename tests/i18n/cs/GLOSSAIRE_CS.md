# Glossaire et guide de style — site Adermio en tchèque

Référence unique pour toute traduction FR → CS du site adermio.com (`/cs/…`). Toute décision nouvelle s'écrit ici AVANT
d'être appliquée. Un relecteur ne défait JAMAIS une décision du client ni du PDG.

## Décisions (PDG + client, 21/10/2026) — non négociables

1. **Tchèque standard (spisovná čeština)**, contemporain, naturel, comme un site écrit à Prague. Jamais de slovaque
   (voir « Interdits slovaques »), jamais de tchèque familier (*obecná čeština* : *dobrý*, *ňáký*, *bysme*, *-ej*).
2. **Registre « vy » (vykání)**, comme les marques de soin tchèques grand public : impératif pluriel de politesse
   (*Začněte, Nahrajte, Zjistěte, Vyzkoušejte*), pronoms et possessifs **en minuscules** hors début de phrase (*vaše pleť,
   pro vás, vám pošleme*). **Jamais de tykání** (*ty, tvůj, tobě, tě, jsi*, verbes en *-š*, impératifs singuliers
   *pošli, klikni, zkus*). Possessif réfléchi quand le possesseur est le sujet : *Nahrajte **své** fotky*, *Zjistěte **svůj**
   typ pleti* (pas *váš*) ; *vaše* quand il ne l'est pas : *Vaše fotky jsou v bezpečí*.
3. **AUCUNE forme genrée adressée au visiteur.** En tchèque, le passé, le conditionnel et les formes courtes d'adjectif
   s'accordent au genre **même au vouvoiement** (*udělal jste* / *udělala jste*). Le site ne connaît pas le genre du
   visiteur ; les graphies doubles sont laides et interdites aussi.
   - **Interdits** : passé + *jste* (*Už jste někdy použil/a…?*, *Použila jste…*, *Pokud jste ji nepoužívali…*), conditionnel
     (*Chtěl(a) byste…*, *abyste mohl/mohla/mohli…*), adjectif court ou long après *jste / budete / buďte / cítíte se*
     (*jste připraven(a)*, *budete spokojen/á*, *budete informováni*, *jste si jistý/á*, *jste nový/á*), graphies
     *udělal/a, připraven(a), Vážený/á*, formules d'appel *Vážený zákazníku / Vážená zákaznice / Milá Petro*.
   - **Tournures sûres** : présent (*Používáte retinoidy?*, *Užíváte léky na akné?*), futur perfectif ou *budete* + infinitif
     (*Získáte…*, *Budete dostávat…*), *mít za sebou* (*Máte za sebou léčbu izotretinoinem?* = « avez-vous déjà suivi… »),
     *mít zkušenost s* (*Máte zkušenost s retinoidy?*), noms (*Předchozí léčba*, *Připravenost: 100 %*), impersonnel
     (*Pokud je fotka rozmazaná…*, *Je možné…*), passif à la 3e personne d'un objet (*Vaše analýza je připravena*),
     **1re personne du pluriel côté Adermio** (*Analyzujeme…*, *Pošleme vám e-mail*, *Děkujeme*).
   - Exemples : « Êtes-vous prêt(e) ? » → *Můžeme začít?* ; « Bienvenue » → *Vítejte* (neutre) ; « Vous serez ravi(e) » →
     *Výsledky vás potěší* ; « Souhaitez-vous… ? » → *Přejete si…?* ; « Avez-vous déjà essayé… ? » → *Máte zkušenost s…?* ;
     « Merci, vous êtes inscrit(e) » → *Děkujeme, registrace proběhla úspěšně* ; « Vous avez oublié… ? » → *Nezapomeňte…* ;
     « Vous recevrez un e-mail » → *Pošleme vám e-mail* ; « Satisfait ou remboursé » → *Garance vrácení peněz* ;
     « Cher(e) patient(e) » / repli `'Patient'` → *Dobrý den*.
   - Côté Adermio, la 1re personne du pluriel au passé (*analyzovali jsme*, *jsme rádi*) est permise : c'est l'équipe qui
     parle, pas le visiteur.
   - **Grossesse / allaitement** : *těhotná, kojíte* ne désignent que des femmes — *Jste těhotná nebo kojíte?* est correct.
   - Les **témoignages** gardent le genre de leur auteur (une cliente écrit *vyzkoušela jsem, jsem spokojená*) : ce n'est
     pas le visiteur.
4. **Zéro langage médical côté Adermio.** Interdits pour parler d'Adermio ou de ce qu'il fait : *diagnóza / diagnostika /
   diagnostikovat* (même en négation : « ne constitue pas un diagnostic » → *nenahrazuje lékařskou konzultaci* /
   *nenahrazuje návštěvu dermatologa*), *pacient*, *terapie / terapeutický*, *klinický / klinika / klinicky*, *léčit /
   léčí / vyléčit / léčebný / uzdravit*. On dit : *analýza, vyhodnocení, posouzení, rady, doporučení, péče, rutina*.
   « diagnostiquer » → *vyhodnotit / posoudit* ; « traiter l'acné » → *bojovat s akné / zvládnout akné / zklidnit pleť* ;
   « soigner » → *pečovat* ; badge « Méthode clinique » → *Vědecký základ* ; « cliniquement prouvé » → *vědecky podložené*.
   - **Traitement médical DE L'UTILISATEUR** (« Suivez-vous un traitement ? ») → *léky / léčba předepsaná lékařem*
     (*Užíváte nějaké léky na akné?*, *léčba předepsaná dermatologem*) : c'est sa réalité, pas une promesse d'Adermio.
     *léčba / léčení / léčivo* ne sont permis qu'avec un mot de ce contexte dans la phrase (*lékař, předepsaný, užíváte,
     izotretinoin, antikoncepce…*) — le QA le vérifie.
   - **« dermatolog » = un vrai médecin seulement.** Jamais pour Adermio : « notre dermatologue IA » → *naše AI* ;
     « analyse dermatologique » → *analýza pleti pomocí AI* (jamais *dermatologická analýza*) ; « expertise
     dermatologique » (le domaine) → *poznatky z dermatologie*.
5. **Prix : 149 Kč** (`149&nbsp;Kč` en HTML, `149 Kč` ou `149 Kč` en JS, espace simple en JSON-LD/meta) partout où
   le FR donne un prix d'analyse en euros (4,99 €, 5,99 €, 6,99 €…). Jamais *Kč 149*, *149Kč*, *149,- Kč*, *149,00 Kč*,
   *149 CZK* (QA PRIX).
   - **Budgets produits** du rapport : restent en **euros** (les produits recommandés sont vendus en euros ; même choix que
     PL/PT) : *< 60 €*, *60–110 €*, *> 110 €*, *< 40 €*, *40–70 €*, *> 70 €* (espace insécable, tiret demi-cadratin).
   - **Offre du 2e cycle** (page bilan : *10 €* barré, *5 €*, *0,18 € denně*) : reste en **euros** comme PL/PT (le paiement
     du 2e cycle n'est pas localisé) — à revoir avec Antoine si le 2e cycle passe en CZK.
   - JSON-LD `"price": "0", "priceCurrency": "EUR"` (application gratuite) : inchangé.
6. **« Adermio » : sans article, INVARIABLE, neutre.** Le tchèque n'a pas d'article : « a Adermio » (PT) n'a pas
   d'équivalent. **Jamais décliné** (*Adermia, Adermiu, Adermiem* interdits — QA ADERMIO). Sujet : accords au **neutre**
   et de préférence au présent/futur (*Adermio je zdarma*, *Adermio analyzuje…*, *Adermio vám pomůže*) ; au passé,
   préférer *my* (*Analyzovali jsme…*). Quand la phrase exige un cas oblique : **apposition** déclinée devant le nom —
   *aplikace Adermio* (f. : *v aplikaci Adermio, s aplikací Adermio*), *tým Adermio* (m. : *tým Adermio vám odpoví*),
   *služba Adermio* (f., pour le service web). « Tout sur Adermio » → *Vše o aplikaci Adermio* ; « Bienvenue sur
   Adermio » → *Vítejte v Adermio* ✗ → *Vítejte v aplikaci Adermio* ✓ ; « Logo Adermio » → *Logo Adermio*.
7. **Source = le français** : ton, structure et sens du FR. Jamais l'anglais ni le portugais (les tables ont été découpées
   sur le portugais, mais seule la colonne FR a été reprise).
8. **Même ton que le FR** : rassurant, clair, précis, chaleureux sans familiarité, jamais alarmiste ni criard.
9. **Témoignages** : jamais supprimés ni réécrits sur le fond ; **prénoms gardés tels quels** (pas de tchéquisation) ;
   âge → *24 let* ; traduits comme une vraie cliente tchèque l'écrirait (genre de l'auteur). Un même avis = le même texte
   sur toutes les pages (référence : `tr_cs/home.py`).
10. **Pied de page** : *© 2026 Adermio. Všechna práva vyhrazena.* (FR © 2025 → © 2026). « Conditions de vente » →
    *Obchodní podmínky* (`/cs/obchodni-podminky`) ; la page de résiliation `/cs/zruseni-predplatneho` existe mais reste
    cachée.
11. **Messages d'erreur** : jamais techniques (`err.message`, « Failed to fetch », « Token », « jobId », « console / F12 »).
    Toujours une phrase tchèque claire qui dit quoi faire. Si le JS affiche `e.message`, remplacer l'expression par un
    texte fixe (entrée REGEX de la table).
12. **Visuels** : la **vidéo** reste en anglais avec la mention ***(video v angličtině)*** ; les **écrans de l'app** montrés
    sur l'accueil du nouveau site sont **traduits en tchèque au pixel** (comme PL/PT ; `ecrans_cs.py`). Sur les anciennes
    pages, les captures restent celles de l'anglais : ne jamais promettre qu'elles sont en tchèque.
13. **App** : l'app **n'existe pas en tchèque** : aucun bandeau, aucun code d'accès à l'app, aucune promesse « disponible
    dans l'App Store en tchèque » (`appDispo()` exclut déjà `cs`). Le FAQ du nouveau site qui cite les prix de l'app
    (7,99 € / 14,99 €) n'a pas d'objet en tchèque : à décider au moment de `build_home_cs.py`.
14. **Juridique** : « l'Utilisateur » → *Uživatel* (terme défini, majuscule) ; RGPD → **GDPR** (*obecné nařízení o ochraně
    osobních údajů (GDPR)* à la 1re occurrence) ; responsable de traitement → *správce osobních údajů* ; sous-traitant →
    *zpracovatel* ; traitement des données → *zpracování osobních údajů* (terme juridique, pas médical) ; CNIL : garder
    « CNIL » et citer le *Úřad pro ochranu osobních údajů (ÚOOÚ)* seulement si le FR parle de « l'autorité de contrôle de
    votre pays ». Droit de rétractation → *právo odstoupit od smlouvy* ; résilier → *zrušit předplatné* ; TVA → *DPH* ;
    franchise en base de TVA → *osvobození od DPH v rámci francouzského režimu „franchise en base de TVA“*. Ne rien
    inventer de juridique.
15. **Point Repère** (fonction Premium de l'app) → *Referenční bod* ; « enquête » → *analýza příčin*, « pistes » →
    *hypotézy*, « verdicts » → *závěry*, « dossier » → *složka*.
16. **Pluriels : trois formes** (1 / 2–4 / 5 et plus, **0** prend la forme 5+) — voir « Pluriels » plus bas. Une chaîne JS
    qui colle un nombre à un nom doit produire la bonne forme (petite expression JS permise, vérifiée par `jscheck_cs.py`).
17. **IA → *AI*** (usage tchèque courant ; jamais *UI*, ambigu avec « interface utilisateur ») ; forme longue *umělá
    inteligence* une fois par page au plus. Slogan « La dermatologie réinventée par l'IA » → ***Péče o pleť v novém pojetí
    díky AI.*** (jamais « dermatologie » à côté d'AI).


## Harmonisation (21/10, après traduction) — s'applique à toutes les pages

- Logo : `alt="Logo Adermio"` partout (aussi pour `alt="Logo"`).
- Catégorie du blog « Acné & Dermatologie » → *Akné a dermatologie* (et « Data & … » → *Data a …*) : « a », jamais « & ».
- « Vos données ont été transmises avec succès » → *Vaše údaje byly úspěšně odeslány.* ; « Analyse en cours, veuillez patienter pour la redirection » →
  *Probíhá analýza, chvíli strpení – za okamžik vás přesměrujeme…*
- Chemin iOS de résiliation : *Nastavení iOS → [vaše jméno] → Předplatná → Adermio Premium → Zrušit předplatné*.
- « Nous contacter » (menu, pied de page, boutons) → *Napište nám* partout ; « Contact » (titre de page) → *Kontakt*.
- Témoignages : texte IDENTIQUE à `tr_cs/home.py` (référence ; « diagnostic » de Julie → *výsledek*).
- « Le saviez-vous ? » → *Zajímavost* ; « score » → *hodnocení* (le QA prend *skóre* pour du polonais) ; « Oups ! » → *Jejda!*
- Prénom absent : *Dobrý den* sauf dans un titre de félicitations (« Gratulujeme, skvělá volba »).

## Décisions du client

- **21/10/2026** (plan validé « OK pour tout ton plan… GO », puis « même principe, site seul puis retour à Antoine ») :
  tchèque (`cs`, adresses `/cs/…` traduites sans diacritiques) ; registre **« vy »** en minuscules ; **aucune forme genrée
  adressée au visiteur** ; **149 Kč TTC** (prix Stripe CZK à créer sur accord d'Antoine) ; paiement carte + Apple/Google
  Pay ; **vidéo en anglais** « (video v angličtině) » ; **écrans de l'app traduits au pixel** ; l'app n'existe pas en
  tchèque (aucun bandeau ni code app) ; `html lang="cs"`, hreflang `cs`, og:locale `cs_CZ`. Site d'abord, caché (noindex),
  puis n8n et ouverture sur ordre d'Antoine.

## Interdits slovaques (le QA SK les signale)

| Slovaque (interdit) | Tchèque (à écrire) |
|---|---|
| ktorý, ktorá, ktoré | který, která, které |
| alebo | nebo |
| sú, sme | jsou, jsme |
| môžete | můžete |
| ďakujeme | děkujeme |
| vaša, vašu | vaše, vaši |
| tiež, aj | také, i |
| keď, ako, teraz | když, jako, teď / nyní |
| veľmi, zadarmo | velmi, zdarma |
| ďalší, deň, týždeň, mesiac | další, den, týden, měsíc |
| lettres *ä ô ľ ĺ ŕ* | (n'existent pas en tchèque) |

## Calques et pièges à éviter

- *Objevte…* à chaque titre (calque de « Découvrez ») → varier : *Zjistěte*, *Podívejte se*, *Vyzkoušejte*, ou une
  affirmation directe.
- « Afin de » → *aby / pro* ; « Grâce à » → *díky* ; « Ne… plus » → *už ne*.
- *Váš* au lieu du réfléchi *svůj* quand le possesseur est le sujet (*Nahrajte své fotky*).
- Tchèque sans diacritiques (*muzete, prosim, dekujeme*) : faute grave (QA ASCII).
- *Vy / Váš / Vám* en majuscule en milieu de phrase (QA MAJ).
- Anglicismes de mode (*skincare, glow, routine* en anglais) → *péče o pleť, rozjasnění, rutina*. Admis : *sérum, SPF,
  AI, PDF, e-mail, blog, online, stres, make-up, Premium*, marques, noms INCI.

## Typographie tchèque

- Guillemets **„…“** (bas-haut : U+201E … U+201C ; jamais « » ni „…” à la polonaise) ; guillemets secondaires ‚…‘.
  Apostrophe ’. Points de suspension « … ».
- **Aucune espace avant `! ? : ;`.** Tiret d'incise : *–* entouré d'espaces ; intervalles sans espaces (*60–110 €*,
  *2–4 týdny*).
- Nombres : **virgule décimale** (*2,5*, *98,5 %*), milliers à espace insécable à partir de 5 chiffres (*10 000*, mais
  *2000*), **pourcentage séparé** par une espace insécable (*98 %* ; *98%* = faute, QA TYPO), heures *14:30*, *MB* pour
  « Mo ».
- Dates : ***21. října 2026*** (point après le jour, mois au génitif en minuscules ; QA TYPO si le point manque) ; jours
  et mois en minuscules.
- Jours : « J1 / J7 / J28 / J+90 » → *1. den / 7. den / 28. den / po 90 dnech* (badge court : *Den 28*) ; « 0/28j » →
  *0/28 dní* ; « +2000 avis » → *přes 2000 recenzí* ; « 30 sec » → *30 s*.
- Espace insécable après les prépositions et conjonctions d'une lettre (*v, s, z, k, o, u, a, i*) : **facultative** ;
  si utilisée, `&nbsp;` en HTML seulement (dans une chaîne JS : ` `, jamais `&nbsp;` qui s'afficherait tel quel
  via `textContent`).
- Majuscules : casse de phrase dans les titres (pas de Majuscule À Chaque Mot) ; *vy / váš* en minuscules.

## Pluriels

| 1 | 2–4 | 5+ (et 0) |
|---|---|---|
| 1 den | 2 dny | 5 dní |
| 1 týden | 2 týdny | 5 týdnů |
| 1 měsíc | 2 měsíce | 5 měsíců |
| 1 rok | 2 roky | 5 let |
| 1 minuta | 2 minuty | 5 minut |
| 1 fotka | 2 fotky | 5 fotek |
| 1 krok | 2 kroky | 5 kroků |
| 1 přípravek | 2 přípravky | 5 přípravků |
| 1 uživatel | 2 uživatelé | 5 uživatelů |
| 1 recenze | 2 recenze | 5 recenzí |

- Nombres décimaux → génitif singulier (*1,5 dne*, *2,5 roku*). Après une préposition, le cas de la préposition
  (*po 28 dnech*, *do 3 dnů*, *před 2 týdny*). 21–24 : forme 5+ avec chiffres (*22 dní*, *24 let*). Âges : toujours
  *N let* pour 5 et plus (REGEX de l'accueil : `>(\d{1,2}) ans<` → `>\1 let<`).
- En JS (expression permise dans la chaîne traduite) :
  `const csPlural = (n, one, few, many) => (n === 1 ? one : (n >= 2 && n <= 4 ? few : many));`
  ou en ligne : `${n} ${n === 1 ? 'den' : (n >= 2 && n <= 4 ? 'dny' : 'dní')}`.

## Glossaire figé

### Navigation et pages
| FR | CS |
|---|---|
| Accueil | Domů |
| Faire l'analyse (navigation) | Analýza pleti |
| Analyser ma peau / Démarrer mon analyse / Faire mon analyse gratuite (CTA) | Spustit analýzu zdarma |
| Commencer l'analyse | Začít analýzu |
| À propos | O nás |
| Nous contacter / Contact | Napište nám / Kontakt |
| Conditions d'utilisation | Podmínky používání |
| Conditions de vente / CGV | Obchodní podmínky |
| Mentions légales | Právní informace |
| Politique de confidentialité | Ochrana osobních údajů |
| Sources | Zdroje |
| Avis / Témoignages | Recenze / Co říkají naši uživatelé |
| Feedback / Envoyer le feedback | Zpětná vazba / Odeslat zpětnou vazbu |
| Blog | Blog |
| FAQ / Questions fréquentes | Časté dotazy |
| Comment ça marche ? | Jak to funguje? |
| Tous droits réservés | Všechna práva vyhrazena |
| Suivant / Précédent / Retour / Envoyer / Valider | Další / Předchozí / Zpět / Odeslat / Potvrdit |
| Continuer / Fermer / Télécharger / Partager | Pokračovat / Zavřít / Stáhnout / Sdílet |
| Oui / Non | Ano / Ne |
| Chargement… / Envoi en cours… / Analyse en cours… | Načítání… / Odesílání… / Probíhá analýza… |
| Réessayer | Zkusit znovu |
| Aperçu | Náhled |

### Produit Adermio
| FR | CS |
|---|---|
| analyse (de peau) | analýza pleti / analýza (f.) |
| analyse gratuite | analýza zdarma / bezplatná analýza |
| analyse complète / dossier complet / analyse premium (web) | kompletní analýza — *Premium* est réservé à l'abonnement de l'app |
| débloquer (bouton de paiement) | Odemknout za 149 Kč |
| rapport | zpráva (en PDF : *zpráva v PDF*) |
| résultats | výsledky |
| bilan cutané / bilan (page bilan) | zhodnocení pleti / Zhodnocení |
| paiement unique / sans abonnement | jednorázová platba / bez předplatného |
| abonnement | předplatné |
| paiement sécurisé | zabezpečená platba |
| satisfait ou remboursé | Garance vrácení peněz |
| routine personnalisée | personalizovaná rutina péče |
| routine du matin / du soir | ranní / večerní rutina |
| protocole | rutina |
| second cycle / 2e cycle / Cycle 2 | druhý cyklus / Cyklus 2 |
| bilan J28 / suivi | zhodnocení po 28 dnech / sledování pokroku |
| photo de face / profil gauche / profil droit | fotka zepředu / levý profil / pravý profil |
| questionnaire / formulaire | dotazník |
| IA / intelligence artificielle | AI / umělá inteligence |
| conseils / recommandations | rady / doporučení |
| plan alimentaire / alimentation | tipy ke stravování / strava |
| facteurs aggravants | zhoršující faktory |
| données cryptées / sécurisées | šifrovaná / zabezpečená data |
| lien (URL) | odkaz |
| Le saviez-vous ? | Věděli jste…? ✗ (genré) → *Zajímavost:* / *Víte, že…?* |
| imperfections | nedokonalosti pleti |

### Peau
| FR | CS |
|---|---|
| peau (du visage) | pleť (f.) ; peau en général *kůže / pokožka* ; **type de peau → *typ pleti*** |
| peau grasse / mixte / sèche / sensible / normale | mastná / smíšená / suchá / citlivá / normální pleť |
| acné / acné hormonale | akné (n., invariable) / hormonální akné |
| boutons | pupínky |
| points noirs / points blancs (microkystes) | otevřené komedony (černé tečky) / uzavřené komedony (bílé tečky) |
| comédons | komedony |
| papules / pustules / nodules / kystes | papuly / pustuly / uzly / cysty |
| rougeurs | zarudnutí |
| cicatrices | jizvy po akné |
| taches (post-inflammatoires) | pigmentové skvrny (pozánětlivé) |
| pores dilatés | rozšířené póry |
| sébum / excès de sébum | kožní maz / nadměrná tvorba kožního mazu |
| inflammation / inflammatoire | zánět / zánětlivý |
| barrière cutanée / hydratation | kožní bariéra / hydratace |
| zone T / zone U | T-zóna / U-zóna |
| front / joues / menton / mâchoire / autour de la bouche / nez / tempes | čelo / tváře / brada / linie čelisti / okolí úst / nos / spánky |
| dos / décolleté / cou | záda / dekolt / krk |
| sévérité légère / modérée / sévère (libellés) | lehká / střední / výrazná ; avec akné : *lehké akné / akné střední intenzity / výrazné akné* |
| actifs / ingrédients / INCI | účinné látky / složky / složení (INCI) |
| nettoyant / crème hydratante / sérum / écran solaire | čisticí gel (přípravek) / hydratační krém / sérum / krém s SPF (ochrana proti slunci) |
| exfoliant | exfoliační přípravek |
| acide salicylique / peroxyde de benzoyle / niacinamide | kyselina salicylová / benzoylperoxid / niacinamid |
| rétinoïdes / rétinol / adapalène / isotrétinoïne | retinoidy / retinol / adapalen / izotretinoin |
| acide azélaïque / acide hyaluronique / céramides / zinc / AHA / BHA | kyselina azelaová / kyselina hyaluronová / ceramidy / zinek / AHA / BHA |
| (non) comédogène | (ne)komedogenní |
| grossesse / allaitement | těhotenství / kojení |
| pilule / contraception hormonale | antikoncepční pilulky / hormonální antikoncepce |
| cycle menstruel / règles / SOPK | menstruační cyklus / menstruace / syndrom polycystických ovarií (PCOS) |
| stress / sommeil / sport, transpiration | stres / spánek / sport, pocení |
| frottements / rasage | tření / holení |
| produits laitiers / sucre / index glycémique | mléčné výrobky / cukr / glykemický index |
| médecin / dermatologue (un vrai) | lékař / dermatolog |
| traitement (de l'utilisateur, prescrit) | léky / léčba předepsaná lékařem |
| maquillage | make-up / líčení |

## Contrôles automatiques (qa_cs.py)

GENRE, REGISTRE, MAJ, ADERMIO, INTERDIT, DERMA, FR, EN, ES, PT, PL, SK, ASCII, PAS_CS, GREC, MORPHO, IDENT, PRIX,
PLURIEL (cas simples, nominatif/accusatif), TYPO, GUILL, ESPACE. Codes jamais autorisables dans `allow_cs.txt` :
INTERDIT, DERMA, IDENT, PRIX, GREC, PL, PT, SK, GENRE, REGISTRE, ADERMIO.

## Style tchèque

- Phrases claires, pas plus longues que le FR ; ordre des mots naturel (l'information nouvelle en fin de phrase).
- Boutons système : infinitif court (*Odeslat, Pokračovat, Zpět*) ; boutons marketing : infinitif (*Spustit analýzu
  zdarma*) ou impératif de politesse (*Začněte*). Toucher l'écran = *Klepněte* ; cliquer = *Klikněte*. Le tchèque est
  ~10 % plus long que le français : reformuler si un bouton ou un badge déborde à 360 px.
- Genre grammatical : *pleť, analýza, rutina, zpráva, péče* (f.), *výsledek, krém, přípravek* (m.), *akné, sérum,
  Adermio* (n.) ; accorder les adjectifs calculés en JS si le FR les accorde.
