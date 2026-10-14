# Glossaire et guide de style — site Adermio en polonais

Référence unique pour toute traduction FR → PL du site adermio.com. Toute décision nouvelle s'écrit ici AVANT d'être
appliquée. Un relecteur ne défait JAMAIS une décision du client ni du PDG.

## Décisions (PDG + client, 14/10/2026) — non négociables

1. **Registre « ty »** (usage des marques de soin polonaises) : impératif singulier (*Rozpocznij, Prześlij, Zrób, Sprawdź*),
   possessifs et pronoms **en minuscules** hors début de phrase (*twoja skóra, dla ciebie*). Jamais *Pan / Pani / Państwo*.
   Chaleureux sans familiarité : pas d'argot, pas d'émojis ajoutés. Salutation : *Cześć* (ou une phrase sans formule d'appel).
2. **Aucune forme marquée en genre adressée à l'utilisateur** (le public est mixte ; le site ne connaît pas le genre).
   - Interdits : passé à la 2e personne (*stosowałaś / stosowałeś*, *zrobił(a)ś*), conditionnel (*chciałabyś / chciałbyś*),
     attribut genré après un verbe à la 2e personne (*jesteś gotowa*, *będziesz zadowolony*), formules d'appel
     (*Drogi / Droga / Szanowna*).
   - Tournures à utiliser : présent (*Czy stosujesz…?*, *Czy przyjmujesz leki…?*), futur imperfectif
     (*będziesz stosować*), *masz za sobą…* (« as-tu déjà eu… »), noms (*Wcześniejsze kuracje*, *Gotowość: 100%*),
     impersonnel (*Jeśli zdjęcie jest nieostre…*, *Można…*), 1re personne du pluriel côté Adermio (*Przeanalizujemy…*).
     « Prêt(e) ? » → *Zaczynamy?* ; « Satisfait ou remboursé » → *Gwarancja zwrotu pieniędzy*.
   - Les **témoignages** gardent le genre de leur auteur (une cliente écrit *próbowałam*) : ce n'est pas l'utilisateur.
3. **Zéro langage médical côté Adermio.** Interdits pour parler d'Adermio ou de ce qu'il fait : *diagnoza / diagnozować /
   diagnostyka* (même en négation : « nie stanowi diagnozy » refusé → *nie stanowi porady lekarskiej* / *nie zastępuje
   wizyty u dermatologa*), *pacjent*, *terapia / terapeutyczny*, *kliniczny / klinika*, *leczy / wyleczy / leczniczy*.
   On dit : *analiza, ocena, porady, wskazówki, pielęgnacja, rutyna*. « traiter l'acné » → *walczyć z trądzikiem /
   opanować trądzik*.
   - **Traitement médical DE L'UTILISATEUR** (« Suivez-vous un traitement ? ») → *leki / kuracja / leczenie zalecone przez
     lekarza* (« Czy przyjmujesz leki na trądzik? ») : c'est sa réalité, pas une promesse d'Adermio.
   - **« dermatolog » = un vrai médecin seulement.** Jamais pour Adermio : « notre dermatologue IA » → *nasza AI* ;
     « analyse dermatologique » → *analiza skóry z AI* ; « expertise dermatologique » (le domaine) → *wiedza z dermatologii* ;
     badge « Méthode clinique » → *Podstawy naukowe*. Repli sans prénom (« Cher(e) patient(e) », `'Patient'`) → *Cześć*.
4. **Prix : 24,99 zł** (`24,99&nbsp;zł` en HTML, `24,99 zł` en JS, espace simple en JSON-LD/meta). Si le FR dit 4,99 € ou
   5,99 €, écrire **24,99 zł**. Les **budgets produits** du rapport restent en euros (les produits sont vendus en euros) :
   *< 60 €*, *60–110 €*, *> 110 €* (montant, espace insécable, €).
5. **Source = le français** : ton, structure et sens du FR. Jamais l'anglais ni le grec (les tables ont été découpées sur
   le grec, mais seule la colonne FR a été reprise).
6. **Même ton que le FR** : rassurant, clair, précis, chaleureux sans familiarité, jamais alarmiste ni criard.
   Polonais standard contemporain, naturel, comme un site écrit à Varsovie.
7. **Témoignages** : jamais supprimés ni réécrits sur le fond ; **prénoms gardés tels quels** ; traduits comme une vraie
   cliente polonaise l'écrirait. Un même avis = le même texte sur toutes les pages (référence : `tr_pl/home.py`).
8. **Pied de page** : *© 2026 Adermio. Wszelkie prawa zastrzeżone.* (FR © 2025 → © 2026). « Conditions de vente » →
   *Warunki sprzedaży* (`/pl/warunki-sprzedazy`) ; la page de résiliation `/pl/anuluj-subskrypcje` existe mais reste cachée.
9. **Messages d'erreur** : jamais techniques (`err.message`, « Failed to fetch », « Token », « jobId », « console / F12 »).
   Toujours une phrase polonaise claire qui dit quoi faire. Si le JS affiche `e.message`, remplacer l'expression par un
   texte fixe (entrée REGEX de la table).
10. **Visuels** de l'accueil (captures, vidéo) = versions **anglaises** : ne jamais promettre qu'ils sont en polonais
    (*(wideo w języku angielskim)*).
11. **Juridique** : « l'Utilisateur » → *Użytkownik* (3e personne, majuscule de terme défini) ; RGPD → **RODO** ;
    responsable de traitement → *administrator danych* ; sous-traitant → *podmiot przetwarzający* ; CNIL : garder « CNIL »
    et citer *Prezes Urzędu Ochrony Danych Osobowych (UODO)* seulement si le FR parle de « l'autorité de contrôle de votre
    pays ». Droit de rétractation → *prawo odstąpienia od umowy*. Résilier → *anulować subskrypcję*. Franchise en base de
    TVA → *zwolnienie podmiotowe z VAT na podstawie prawa francuskiego*. Ne rien inventer de juridique.
12. **Point Repère** (fonction Premium de l'app) → *Punkt Odniesienia* ; « enquête » → *analiza przyczyn*, « pistes » →
    *hipotezy*, « verdicts » → *wnioski*, « dossier » → *teczka*.
13. **Pluriels** : le polonais a trois formes (1 *dzień* / 2–4 *dni* / 5+ *dni* ; 1 *zmiana* / 2–4 *zmiany* / 5+ *zmian*).
    Une chaîne JS qui colle un nombre à un nom doit produire la bonne forme (petite expression JS permise dans la chaîne
    traduite, vérifiée par `jscheck_pl.py`).

## Décisions du client

(aucune pour l'instant — toute décision d'Antoine s'écrit ici, datée)

## Typographie polonaise

- Guillemets **„…”** (jamais « » ni "…"). Aucune espace avant `! ? : ;`. Tiret d'incise : *–* entouré d'espaces.
- Nombres : virgule décimale (*2,5*), milliers à espace insécable à partir de 5 chiffres (*10 000*, mais *2000*),
  pourcentage collé (*98%*), dates *14 października 2026*, heures *14:30*, *MB* pour « Mo ».
- Jours : « J1 / J7 / J28 / J+90 » → *dzień 1 / dzień 7 / dzień 28 / po 90 dniach* (badge court : *Dzień 28*) ;
  « 0/28j » → *0/28 dni* ; « +2000 avis » → *ponad 2000 opinii*.
- Majuscules : casse de phrase dans les titres (pas de Majuscule À Chaque Mot).
- Mots étrangers admis : marques, *Adermio*, *AI*, *SPF*, *PDF*, *e-mail*, *Blog*, *Premium* (abonnement de l'app),
  *App Store / Google Play*, noms INCI.

## Glossaire figé

### Navigation et pages
| FR | PL |
|---|---|
| Accueil | Strona główna |
| Faire l'analyse (navigation) | Zrób analizę |
| Analyser ma peau / Démarrer mon analyse / Faire mon analyse gratuite (CTA) | Rozpocznij darmową analizę |
| À propos | O nas |
| Nous contacter / Contact | Kontakt |
| Conditions d'utilisation | Regulamin |
| Conditions de vente / CGV | Warunki sprzedaży |
| Mentions légales | Informacje prawne |
| Politique de confidentialité | Polityka prywatności |
| Sources | Źródła |
| Avis / Témoignages | Opinie / Co mówią nasi użytkownicy |
| Feedback / Envoyer le feedback | Opinia / Wyślij opinię |
| Blog | Blog |
| Tous droits réservés | Wszelkie prawa zastrzeżone |
| slogan « La dermatologie réinventée par l'IA » | Pielęgnacja skóry na nowo – dzięki AI. (jamais « dermatologia » à côté d'AI) |
| Suivant / Précédent / Retour / Envoyer / Valider | Dalej / Wstecz / Powrót / Wyślij / Zatwierdź |
| Chargement… / Envoi en cours… | Ładowanie… / Wysyłanie… |
| Réessayer | Spróbuj ponownie |

### Produit Adermio
| FR | PL |
|---|---|
| analyse (de peau) | analiza skóry / analiza |
| analyse gratuite | darmowa analiza |
| analyse complète / dossier complet / analyse premium (web) | pełna analiza — *Premium* est réservé à l'abonnement de l'app |
| débloquer (bouton de paiement) | Odblokuj za 24,99 zł |
| rapport | raport (en PDF : twój raport w PDF) |
| résultats | wyniki |
| bilan cutané | podsumowanie stanu skóry |
| paiement unique / sans abonnement | jednorazowa płatność / bez subskrypcji |
| satisfait ou remboursé | Gwarancja zwrotu pieniędzy |
| routine personnalisée | spersonalizowana rutyna pielęgnacyjna |
| routine du matin / du soir | poranna / wieczorna rutyna |
| second cycle / 2e cycle | druga runda |
| bilan J28 / suivi | bilans po 28 dniach / śledzenie postępów |
| photo de face / profil gauche / profil droit | zdjęcie en face / lewy profil / prawy profil |
| questionnaire / formulaire | kwestionariusz |
| IA | AI (forme longue *sztuczna inteligencja* une fois par page au plus) |
| conseils / recommandations | porady / wskazówki |
| plan alimentaire / alimentation | dieta / wskazówki żywieniowe |
| facteurs aggravants | czynniki nasilające trądzik |

### Peau
| FR | PL |
|---|---|
| peau (du visage) | skóra ; **type de peau → *typ cery*** (*cera tłusta / mieszana / sucha / wrażliwa / normalna*) |
| acné / acné hormonale | trądzik / trądzik hormonalny |
| boutons | wypryski |
| points noirs / points blancs (microkystes) | zaskórniki otwarte / zaskórniki zamknięte |
| papules / pustules / nodules / kystes | grudki / krostki / guzki / torbiele |
| comédons | zaskórniki |
| rougeurs | zaczerwienienia |
| cicatrices | blizny potrądzikowe |
| taches (post-inflammatoires) | przebarwienia (potrądzikowe) |
| pores dilatés | rozszerzone pory |
| sébum / excès de sébum | sebum / nadmiar sebum |
| zone T / zone U | strefa T / strefa U |
| front / joues / menton / mâchoire / autour de la bouche | czoło / policzki / broda / linia żuchwy / okolice ust |
| sévérité légère / modérée / sévère | łagodny / umiarkowany / nasilony (trądzik) |
| actifs / ingrédients | składniki aktywne / składniki |
| nettoyant / crème hydratante / sérum / écran solaire | żel do mycia twarzy (preparat oczyszczający) / krem nawilżający / serum / krem z filtrem (SPF) |
| exfoliant | preparat złuszczający |
| acide salicylique / peroxyde de benzoyle / niacinamide | kwas salicylowy / nadtlenek benzoilu / niacynamid |
| rétinoïdes / rétinol / adapalène / isotrétinoïne | retinoidy / retinol / adapalen / izotretynoina |
| acide azélaïque / zinc / AHA / BHA | kwas azelainowy / cynk / AHA / BHA |
| (non) comédogène | (nie)komedogenny |
| grossesse / allaitement | ciąża / karmienie piersią |
| cycle menstruel / règles | cykl menstruacyjny / miesiączka |
| stress / sommeil / sport, transpiration | stres / sen / sport, pocenie się |
| produits laitiers / sucre / index glycémique | nabiał / cukier / indeks glikemiczny |
| médecin / dermatologue (un vrai) | lekarz / dermatolog |

## Style polonais

- Phrases claires, pas plus longues que le FR. Pas de calques du français (« Découvrez… » → varier : *Sprawdź…*,
  *Zobacz…*, ou une affirmation directe ; « Afin de… » → *Aby…*).
- Anglicismes : seulement ceux que le public polonais emploie vraiment (*serum, AI, SPF, blog, online*). Sinon le mot
  polonais (*pielęgnacja* plutôt que *skincare*).
- Boutons système : impératif court ou nom (*Dalej, Wstecz, Wyślij*) ; boutons marketing : impératif singulier
  (*Rozpocznij darmową analizę*). Toucher l'écran = *Dotknij* ; cliquer = *Kliknij*. Le polonais est ~15 % plus long :
  reformuler si un bouton ou un badge déborde à 360 px.
- Genre grammatical : *skóra, cera, analiza, rutyna* (fém.), *raport, wynik* (masc.), *serum* (neutre) ; accorder les
  adjectifs calculés en JS si le FR les accorde.
