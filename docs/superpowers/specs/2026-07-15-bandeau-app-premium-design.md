# Bandeau « app disponible » — rapport payant web (FR/EN)

Validé par Antoine le 2026-07-15 (brainstorm en session).

## Objectif

Chaque client payant qui revisite son analyse web (`adermio.com/premium?token=…`)
voit un bandeau fermable : l'app Adermio existe, et son code personnel lui
permet d'y retrouver son analyse.

## Où

Dans la **coquille** `premium.html` + `en/premium.html` (Vercel), PAS dans le
HTML S3 figé ni dans les workflows n8n (« NE PAS TOUCHER ») :
- rétroactif pour tous les clients existants ;
- déploiement/rollback = un push ;
- le rapport S3 est dans un iframe cross-origin → inatteignable de toute façon.

Périmètre : FR + EN. Exclus : ES, pages second-cycle (<1 % des clients).

## Contenu (2 variantes)

- **Éligible** (sa ligne `free_analysis` a un `diagnosis_json`, i.e. scan
  ≥ 2026-07-13 — exactement le test 410 de l'edge `redeem-web-analysis`) :
  titre « Votre analyse vous attend dans l'app Adermio », **code personnel**
  `ADR-` + 8 premiers caractères du `?token=` en majuscules (formule vérifiée
  empiriquement 12/12 contre `paid_reports.app_redeem_code` — c'est LE MÊME
  code que l'encart mail), bouton « Copier le code », lien App Store.
- **Non éligible / doute** (vieille analyse, requête d'éligibilité en échec,
  token absent) : « L'app Adermio est disponible » + lien store, **sans code
  ni promesse de reprise** — jamais de promesse qu'on ne peut pas tenir.

Lien store : `https://apps.apple.com/app/adermio/id6768772221` (vérifié live,
v1.0.1). Langage : « analyse », jamais « diagnostic ».

## Comportement

- Apparaît à **chaque visite** (slide-down discret), overlay fixed en haut —
  aucun impact sur la mise en page existante (`fit()` non modifié).
- **Croix** → masqué pour la visite (`sessionStorage`), revient au retour.
- **Copier le code / clic store** → message considéré reçu, ne revient plus
  (`localStorage adermio_app_banner_done`).
- **Fail-safe absolu** : tout le code du bandeau est enveloppé — la moindre
  erreur laisse le bandeau caché et n'affecte JAMAIS l'affichage du rapport
  (chemin de l'argent).

## Branchements techniques

- `init()` : 1 ligne gardée après le chargement du rapport —
  `try { window.__showAppBanner(data.job_id) } catch {}` (le `job_id` vient de
  la réponse `get_report`, vérifié).
- Éligibilité : REST anon `free_analysis?jobId=eq.X&diagnosis_json=not.is.null`
  (clé anon déjà présente dans la page). ⚠️ Dépend de l'accès anon actuel —
  si le chantier RLS le ferme, le bandeau retombe sur la variante sans code
  (dégradation propre, prévue).

## Hors périmètre (assumé)

Détection « code déjà utilisé dans l'app » (endpoint dédié requis) ; analytics
de clic ; bandeau ES/second-cycle.

## Risque connu au déploiement

L'app publique (1.0.1) n'embarque PAS encore l'écran « J'ai un code »
(commits `687245e`+ en attente de build). Même fenêtre déjà acceptée pour
l'encart mail : les clients qui téléchargent aujourd'hui verront le code
utilisable à la prochaine release. → Pousser le build est la vraie urgence.
