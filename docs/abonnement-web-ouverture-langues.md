# Ouvrir l'abonnement web (Stripe) dans une nouvelle langue — check-list

État au 11/10/2026 : l'abonnement web (mensuel / trimestriel, Stripe → RevenueCat) n'est vendu **qu'en français**
(page 2 du rapport FR, edge `web-subscription-checkout` qui force `lang = "fr"`). Les CGV v1.1 sont traduites et
publiques dans toutes les langues ; les pages de résiliation traduites existent mais sont **cachées**.

| Langue | CGV (publique) | Page de résiliation | Outillage |
|---|---|---|---|
| FR | `/cgv` | `/resilier` — publique, dans tous les pieds de page FR | source |
| EN | `/en/cgv` | `/en/resilier` — cachée | pages tenues à la main |
| ES | `/es/cgv` | `/es/resilier` — cachée | pages tenues à la main |
| IT | `/it/cgv` | `/it/resilier` — cachée | `prep_it.py` + `tr/cgv.py`, `tr/resilier.py` |
| DE | `/de/agb` | `/de/kuendigen` — cachée | `build_de.py` + `tr_de/agb.py`, `tr_de/kuendigen.py` |
| NL | `/nl/algemene-voorwaarden` | `/nl/opzeggen` — cachée | `build_nl.py` + `tr_nl/algemene_voorwaarden.py`, `tr_nl/opzeggen.py` |
| EL | `/el/oroi-polisis` (site grec caché) | `/el/akyrosi-syndromis` — cachée | `build_el.py` + `tr_el/oroi_polisis.py`, `tr_el/akyrosi_syndromis.py` |

« Cachée » = `X-Robots-Tag: noindex` (`vercel.json`), absente des pieds de page (`FR_ONLY_FOOTER` dans `prep_de/nl/el/it.py` ;
EN/ES : jamais ajoutée), absente du sitemap. Seul le §4.2 des CGV de la langue y renvoie.

Les CGV traduites décrivent déjà la souscription sur adermio.com (§3.2, §4.2) au même mode que le FR (« peut également être
souscrit »). Tant qu'une langue n'est pas ouverte, aucune page de cette langue ne propose l'abonnement : c'est la page 2 du
rapport qui l'ouvre.

## 1. Juridique (avant tout le reste)

- [ ] Relecture des CGV de la langue par un juriste du pays visé (miroir du droit français : la loi du pays de résidence du
      consommateur reste applicable pour ses règles impératives, Rome I art. 6).
- [ ] Points communs à trancher (ils touchent aussi le FR) :
  - **§5 rétractation** : la v1.1 cite l'art. L.221-28 **13°** (contenu numérique sans support) pour un **service** numérique
    par abonnement. Pour un service, l'exception est le 1° (service *pleinement exécuté* avant la fin du délai) : sinon le
    consommateur garde son droit de rétractation et doit payer le service déjà fourni (L.221-25). À faire valider, puis
    aligner le texte de la case Stripe.
  - **Renouvellement trimestriel tacite** (§4.2) : interdit sous cette forme en **Allemagne** (§ 309 Nr. 9 BGB : après la
    1re période, reconduction seulement à durée indéterminée, résiliable avec 1 mois de préavis au plus) et aux
    **Pays-Bas** (art. 6:236 sub j BW, liste noire). Le mensuel passe ; le trimestriel doit devenir « 3 mois puis mensuel
    résiliable » pour DE/NL (et à vérifier BE/IT/ES/EL). En France : information sur la reconduction (L.215-1) à vérifier.
  - **TVA** (§3.1) : les CGV disent « franchise en base, aucune TVA collectée » alors que le checkout d'abonnement a
    `automatic_tax` activé et que Stripe Tax a une immatriculation FR **active** (TVA française calculée sur des prix TTC) ;
    au-delà de 10 000 € de ventes B2C intra-UE, TVA du pays du client via le guichet OSS. Décider avec le comptable, puis
    corriger §3.1/§3.2 et les mentions légales dans toutes les langues.
  - **Plateforme ODR** (§12) : fermée le 20/07/2025 (règlement (UE) 2024/3228) ; lien mort dans toutes les langues.
  - **Médiateur FEVAD** : compétent seulement si Adermio y adhère ; sinon désigner un médiateur (obligation L.612-1).
  - **Plafond de responsabilité** (§9) « toutes causes confondues » : nul en DE pour les dommages corporels et la faute
    lourde (§ 309 Nr. 7 BGB), liste grise NL (6:237 f), à revoir.
- [ ] **Allemagne** (spécifique) :
  - Widerrufsbelehrung + Muster-Widerrufsformular (Art. 246a § 1 Abs. 2 EGBGB) sur support durable avec la confirmation
    du contrat (§ 312f BGB), dont l'accusé de la renonciation.
  - Bouton de commande : libellé sans équivoque « zahlungspflichtig bestellen » ou équivalent (§ 312j Abs. 3 BGB) — vérifier
    le libellé allemand du bouton Stripe Checkout (`submit_type` / texte personnalisé).
  - **Bouton de résiliation** (§ 312k BGB) : sur le site, accessible en permanence **sans connexion**, libellé « Verträge hier
    kündigen », puis page de confirmation (identité, contrat, date) et bouton « jetzt kündigen », accusé de réception
    immédiat sur support durable. Le parcours actuel (lien magique vers le portail Stripe) ne suffit pas : il faut un
    formulaire dédié (ou un parcours validé par le juriste) **avant** d'ouvrir l'abonnement à un consommateur allemand.
  - Impressum déjà présent sur chaque pied de page DE.
- [ ] **Pays-Bas / Belgique** : confirmation de la renonciation sur support durable (6:230t BW), iDEAL / Bancontact,
      bouton « bestelling met betalingsverplichting » ou équivalent (6:230v lid 3 BW).
- [ ] Langue des documents : CGV, mails, factures et portail dans la langue du client (NL : art. 6:230m BW ; ailleurs, à confirmer par le juriste).

## 2. Stripe

- [ ] **Prix par devise** : un prix Stripe par formule et par devise (nouveau prix = nouvel id) ; les prix FR actuels
      (9,99 €/mois, 19,99 €/3 mois) ne valent que pour l'euro. Vérifier le prix affiché dans la langue (page 2 + Checkout).
- [ ] **Checkout** (`web-subscription-checkout`) : `lang` lu dans `free_analysis.lang` (aujourd'hui forcé à `"fr"`),
      `locale` = la langue, `success_url` = `/{lang}/success?...&abonnement=…`, `cancel_url` dans la langue.
- [ ] **Case CGV** (`custom_text.terms_of_service_acceptance`) traduite, lien vers la CGV de la langue, texte **identique** à
      la citation du §5 de cette CGV (ex. DE : « Ich verlange den sofortigen Zugang zu meiner Begleitung: Ich verzichte auf
      mein 14-tägiges Widerrufsrecht »), `consent_collection.terms_of_service = required`.
- [ ] **Mentions au bouton de paiement** (`custom_text.submit`) : prix, périodicité, renouvellement automatique, résiliable
      à tout moment en ligne — dans la langue.
- [ ] **Portail client** (`bpc_1UP6AF0GLtgfLG0axfwCCHDU`) : langue du client (`preferred_locales`) ; vérifier que le libellé
      du bouton d'annulation correspond à la citation du §4.2 et de la page de résiliation (DE « Abo kündigen », NL
      « Abonnement opzeggen », ES « Cancelar suscripción », IT « Annulla abbonamento », EN « Cancel subscription »,
      EL « Ακύρωση συνδρομής ») ; sinon corriger la page de la langue.
- [ ] Reçus / factures Stripe dans la langue.

## 3. Site

- [ ] **Page 2 / paywall web** du rapport (n8n de la langue) : cartes d'offre, prix de la devise, bouton branché sur
      `web-subscription-checkout`, lien vers la CGV de la langue.
- [ ] **/success** de la langue : bloc abonné (`?abonnement=monthly|quarterly`) — porté en DE/NL/EL (tables, 11/10) ;
      **manquant en EN/ES/IT** (à porter depuis `success.html`) ; montants du pixel TikTok (`ABO_PRICES`) dans la devise.
- [ ] **Page de résiliation** : retirer son `X-Robots-Tag: noindex` de `vercel.json` ; ajouter le lien au pied de page de
      toutes les pages de la langue (DE/NL/EL/IT : exclure la langue de `FR_ONLY_FOOTER` dans son `prep_*.py` et ajouter
      le libellé dans les tables ; EN/ES : ligne à ajouter à la main après le lien CGV) ; l'ajouter au sitemap (nouveau
      groupe dans `tests/i18n/fix_sitemap_hreflang.py`) avec hreflang réciproque et le sélecteur de langue de `/resilier`.
- [ ] CGV de la langue : relire §3.2 / §4.2 / §5 / §6 (libellés cités : « J'ai un code Adermio », « Restaurer mes achats »,
      « Annuler l'abonnement », « Gérer ou résilier votre abonnement », case Stripe) contre les vrais écrans. NL et EL citent
      des libellés traduits alors que l'app s'affiche en anglais dans ces pays.
- [ ] Contrôles : `build_xx.py --check` vert, `qa_*` vert, URL en ligne = 200 avec le bon `lang`.

## 4. Backend et mails

- [ ] **Pont Stripe → RevenueCat** (`stripe-subscription-webhook`) : rien de propre à la langue, mais vérifier le compte
      créé, le reçu RC et le rattachement avec un vrai paiement dans la langue.
- [ ] **Mail de bienvenue** (aujourd'hui texte FR via n8n `send-support-reply`) dans la langue, avec le lien
      « Gérer ou résilier votre abonnement » sous le libellé cité au §4.2, et le code personnel.
- [ ] **Dispatcher n8n** `bmh94sW7xkqA6ar9` : un abonnement génère aussi le dossier payant ; le dossier et le mail ADR de la
      langue doivent exister (routage par `metadata.lang`).
- [ ] Mail de confirmation de résiliation, mail d'augmentation de prix (30 jours, §7), rappel avant échéance s'il est
      requis (§1 ci-dessus) : dans la langue.

## 5. App

- [ ] `adermio-app/lib/legal-urls.ts` : `sales` pointe vers la CGV de la langue (fait le 11/10/2026 pour fr/en/es/it/de).
- [ ] Écran « Mon abonnement » (portail Stripe) et parcours « J'ai un code » traduits ; OTA sur ordre d'Antoine.

## 6. Ouverture

- [ ] Test réel dans la langue : paiement (code promo de test), mail de bienvenue, accès app, résiliation en ligne,
      mail de confirmation, plus de prélèvement.
- [ ] Suivi : `web_checkout` / `web_form_funnel` par langue.
