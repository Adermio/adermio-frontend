# Traduction italienne du site adermio.com — design et guide de style

Date : 2026-09-03. Décision Antoine : front d'abord, puis workflows n8n gratuit + payant. Pas de second cycle. Stripe géré à la main par Antoine.

## Périmètre front

Dossier `it/` calqué sur `es/` (22 fichiers) :

| FR source | IT cible |
|---|---|
| `index.html` | `it/home.html` |
| `about.html` | `it/about.html` |
| `formulaire.html` | `it/form.html` |
| `formulaire2.html` | `it/form2.html` |
| `contact.html` | `it/contact.html` |
| `conditions.html` | `it/conditions.html` |
| `confidentialite.html` | `it/confidentialite.html` |
| `mentions-legales.html` | `it/legal-notice.html` |
| `sources.html` | `it/sources.html` |
| `feedback.html` | `it/feedback.html` |
| `success.html` | `it/success.html` |
| `premium.html` | `it/premium.html` |
| `premium-second-cycle.html` | `it/premium-second-cycle.html` |
| `second-cycle.html` | `it/second-cycle.html` |
| `bilan.html` | `it/bilan.html` |
| `analyse-en-cours.html` | `it/processing.html` |
| `analyse-en-cours2.html` | `it/processing2.html` |
| `analyse-en-cours-second-cycle.html` | `it/analysis-in-progress-second-cycle.html` |
| `blog/index.html` | `it/blog/index.html` |
| `blog/comment-connaitre-son-type-de-peau.html` | `it/blog/come-conoscere-il-tuo-tipo-di-pelle.html` |
| `blog/pourquoi-a-t-on-de-l-acne.html` | `it/blog/perche-viene-l-acne.html` |
| `blog/acne-hormonale.html` | `it/blog/acne-ormonale.html` |
| `blog/ou-apparait-l-acne.html` | `it/blog/dove-compare-l-acne.html` |

Les pages second-cycle sont traduites (elles font partie du site) mais aucun workflow `second-cycle-it` n'est prévu.

Hors périmètre de cette phase, à faire à la fin de la phase n8n : `hreflang` + sélecteur de langue IT dans les pages FR/EN/ES, `sitemap.xml`, `js/ttq.js` (`FORM_PAGES`), JSON-LD `availableLanguage`.
Fait dès cette phase : `vercel.json` (`/it` → `/it/home`).

## Mécanique

1. Source de texte = fichier FR (référence de ton). Le fichier ES sert de contrôle de structure.
2. Un script `prep_it.py` copie le FR vers la cible IT et applique les transformations non textuelles observées FR→ES : `lang="it"`, `canonical`/`og:url` en `/it/...`, `og:locale` `it_IT`, carte de liens (`/formulaire`→`/it/form`, `/mentions-legales`→`/it/legal-notice`, etc.), sélecteur de langue (courant = IT, liens FR/EN/ES), webhook du formulaire → `analyse-gratuite-it-web`, `lang: 'fr'` → `'it'` dans les corps JS, `&lang=it`.
3. La traduction ne touche que les littéraux : texte visible, `title`, `meta description`, OG/Twitter, `alt`, `aria-label`, `placeholder`, chaînes JS affichées, JSON-LD. Jamais les balises, classes, ids, clés de formulaire, logique JS.
4. Contrôle : séquence de balises identique au FR, aucun `/es/`, aucun `lang="fr"`, détection de résidus français, liens internes existants.

## Guide de style italien (décision PDG)

- **Registre : « tu »**, ton professionnel et chaleureux. Le « vous » français n'a pas d'équivalent naturel sur un site grand public italien : le « Lei » y sonne bancaire ; les marques dermocosmétiques italiennes s'adressent en « tu ». La crédibilité vient du lexique précis, pas de la forme d'adresse. Pages légales : « tu » conservé, lexique juridique, « l'Utente » admis dans les définitions.
- **Zéro langage médical** : jamais « diagnosi », « diagnostico », « cura », « trattamento medico », « prescrizione ». Toujours « analisi », « valutazione », « routine », « consigli ».
- **Glossaire figé** :
  - analyse (gratuite) → *analisi*, *analisi gratuita* ; dossier complet / analyse premium → *report completo* (jamais *dossier*, jamais *fascicolo*)
  - Faire l'analyse → *Inizia l'analisi* ; Analyser ma peau → *Analizza la mia pelle*
  - type de peau → *tipo di pelle* ; peau mixte/grasse/sèche/sensible → *mista/grassa/secca/sensibile*
  - imperfections → *imperfezioni* ; boutons rouges → *brufoli rossi* ; points noirs → *punti neri* ; points blancs → *punti bianchi* ; microkystes → *microcisti* ; pores dilatés → *pori dilatati* ; taches → *macchie* ; marques & cicatrices → *segni e cicatrici* ; rougeurs → *rossori* ; brillance → *lucidità* ; déshydratation → *disidratazione*
  - routine → *routine* (invariable) ; matin/soir → *mattina/sera* ; nettoyant → *detergente* ; hydratant → *idratante* ; crème solaire / SPF → *protezione solare / SPF* ; sérum → *siero* ; actifs → *attivi* ; ingrédients → *ingredienti*
  - stabiliser / rééquilibrer / prévenir → *stabilizzare / riequilibrare / prevenire* ; phase de stabilisation → *fase di stabilizzazione*
  - sévérité légère / modérée / sévère → *lieve / moderata / severa* (féminin, s'accorde avec *severità*)
  - rechutes → *ricadute* ; poussées → *sfoghi* ; inflammation → *infiammazione*
  - dermatologue → *dermatologo* ; expertise dermatologique → *competenza dermatologica* ; intelligence artificielle → *intelligenza artificiale* (IA)
  - bilan J28 / second cycle → *bilancio del giorno 28* / *secondo ciclo*
  - scan / prendre des photos → *scansione* / *scattare le foto* ; import manuel → *caricamento manuale*
  - Accueil → *Home* ; À propos → *Chi siamo* ; Nous contacter → *Contattaci* ; Conditions d'utilisation → *Condizioni d'uso* ; Mentions légales → *Note legali* ; Politique de confidentialité → *Informativa sulla privacy* ; Sources → *Fonti* ; Avis → *Feedback*
  - paiement unique → *pagamento unico* ; sans abonnement → *senza abbonamento* ; garantie satisfait ou remboursé → *soddisfatti o rimborsati*
- Prix : `5,99 €` (virgule décimale, espace insécable avant €). Dates : `3 settembre 2026`.
- Typographie : apostrophes droites ou typographiques selon le FR, guillemets « » remplacés par “ ” (usage italien). Majuscule seulement au premier mot des titres.
- Marque : *Adermio* invariable, jamais traduit. Noms de produits et INCI inchangés.
- Ce qui n'existe pas en italien (vidéo démo) : on garde la vidéo anglaise `adermio-en-video.mp4` avec la mention *Video in inglese*, comme l'ES.
