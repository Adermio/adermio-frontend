# Glossaire et guide de style — site Adermio en portugais (Portugal)

Référence unique pour toute traduction FR → PT du site adermio.com. Toute décision nouvelle s'écrit ici AVANT d'être
appliquée. Un relecteur ne défait JAMAIS une décision du client ni du PDG.

## Décisions (PDG + client, 21/10/2026) — non négociables

1. **Portugais du PORTUGAL (pt-PT)**, orthographe de l'Accord de 1990 telle qu'appliquée au Portugal (*ação, atual,
   ótimo* ; mais *contacto, facto, receção, perspetiva* ; *-génico / -ónico* avec accent aigu : *comedogénico,
   fenómeno, económico*). **Aucune forme brésilienne** (voir la liste « Interdits pt-BR » plus bas).
2. **Vouvoiement neutre, sans pronom** (équivalent du « vous » FR) : 3e personne de politesse, possessifs *o seu /
   a sua / os seus / as suas* en **minuscules** hors début de phrase ; impératif de politesse (*Comece, Envie, Faça,
   Descubra, Carregue*). **Jamais *você*** (perçu comme impoli au Portugal et marqueur brésilien) ; **jamais *tu / teu /
   tua / te / contigo***. Si un pronom est indispensable : reformuler (*Para si*, *a sua pele*), ou 1re personne du
   pluriel côté Adermio (*Analisamos…*, *Enviamos-lhe…* — *lhe* est neutre en genre).
3. **Aucune forme marquée en genre adressée à l'utilisateur** (le site ne connaît pas son genre).
   - Interdits : *Bem-vindo / Bem-vinda / Bem-vindo(a)* → **Boas-vindas** ; *Está pronto/pronta?* → *Tudo pronto?* /
     *Vamos começar?* ; *satisfeito/a*, *interessado/a*, *preparado/a*, *registado/a*, *seguro/a* appliqués au lecteur ;
     formules d'appel *Caro / Cara / Prezado / Querida* ; pronoms objets genrés *-o / -a / -lo / -la* qui désignent le
     lecteur (*ajudá-lo* → *ajudar* + reformulation, ou *ajudamos-lhe a…*) ; graphies *o(a)*, *pronto/a*.
   - « Satisfait ou remboursé » → **Garantia de reembolso**.
   - Côté Adermio, *Obrigado* (l'entreprise parle) est correct.
   - Les **témoignages** gardent le genre de leur auteur (une cliente écrit *experimentei, fiquei surpreendida*).
4. **Zéro langage médical côté Adermio.** Interdits pour parler d'Adermio ou de ce qu'il fait : *diagnóstico /
   diagnosticar* (même en négation : « não constitui um diagnóstico » refusé → *não substitui o aconselhamento médico* /
   *não substitui uma consulta de dermatologia*), *paciente*, *terapia / terapêutico*, *clínico / clínica*, *curar / cura*,
   *tratar* (Adermio ne traite pas). On dit : *análise, avaliação, conselhos, recomendações, cuidados, rotina*.
   « traiter l'acné » → *combater a acne / controlar a acne*.
   - **Traitement médical DE L'UTILISATEUR** (« Suivez-vous un traitement ? ») → *medicação / tratamento prescrito pelo
     médico* (« Toma alguma medicação para a acne? ») : c'est sa réalité, pas une promesse d'Adermio.
   - **« dermatologista » = un vrai médecin seulement.** Jamais pour Adermio : « notre dermatologue IA » → *a nossa IA* ;
     « analyse dermatologique » → *análise da pele com IA* ; « expertise dermatologique » (le domaine) → *conhecimento em
     dermatologia* ; badge « Méthode clinique » → *Base científica*. Repli sans prénom (`'Patient'`) → *Olá*.
5. **Prix : 5,99 €** (`5,99&nbsp;€` en HTML, `5,99 €` en JS, espace simple en JSON-LD/meta). Si le FR dit 4,99 € ou
   6,99 €, écrire **5,99 €**. Les budgets produits du rapport restent en euros : *< 60 €*, *60–110 €*, *> 110 €*.
6. **Source = le français** : ton, structure et sens du FR. Jamais l'anglais ni le polonais (les tables ont été
   découpées sur le polonais, mais seule la colonne FR a été reprise).
7. **Même ton que le FR** : rassurant, clair, précis, chaleureux sans familiarité, jamais alarmiste ni criard.
   Portugais européen contemporain, naturel, comme un site écrit à Lisbonne.
8. **Témoignages** : jamais supprimés ni réécrits sur le fond ; **prénoms gardés tels quels** ; traduits comme une vraie
   cliente portugaise l'écrirait. Un même avis = le même texte sur toutes les pages (référence : `tr_pt/home.py`).
9. **Pied de page** : *© 2026 Adermio. Todos os direitos reservados.* (FR © 2025 → © 2026). « Conditions de vente » →
   *Condições de venda* (`/pt/condicoes-de-venda`) ; la page de résiliation `/pt/cancelar-subscricao` existe mais reste
   cachée.
10. **Messages d'erreur** : jamais techniques (`err.message`, « Failed to fetch », « Token », « jobId », « console / F12 »).
    Toujours une phrase portugaise claire qui dit quoi faire. Si le JS affiche `e.message`, remplacer l'expression par un
    texte fixe (entrée REGEX de la table).
11. **Visuels** : la **vidéo** reste en anglais avec la mention *(vídeo em inglês)* ; les **écrans de l'app** montrés sur
    l'accueil du nouveau site sont **traduits en portugais** au pixel (comme le polonais ; l'app n'existe pas encore en
    portugais). Sur les anciennes pages, les captures restent celles de l'anglais : ne jamais promettre qu'elles sont en
    portugais.
12. **App** : l'app n'existe pas en portugais : aucun bandeau, aucun code d'accès à l'app sur les pages portugaises.
13. **Juridique** : « l'Utilisateur » → *o Utilizador* (terme défini, majuscule) ; RGPD → **RGPD** (Regulamento Geral
    sobre a Proteção de Dados) ; responsable de traitement → *responsável pelo tratamento* ; sous-traitant →
    *subcontratante* ; CNIL : garder « CNIL » et citer la *Comissão Nacional de Proteção de Dados (CNPD)* seulement si le
    FR parle de « l'autorité de contrôle de votre pays ». Droit de rétractation → *direito de livre resolução*. Résilier
    → *cancelar a subscrição*. Franchise en base de TVA → *isenção de IVA ao abrigo do regime de franquia francês*.
    Ne rien inventer de juridique. (« tratamento de dados » est le terme juridique correct : il n'est pas médical.)
14. **Point Repère** (fonction Premium de l'app) → *Ponto de Referência* ; « enquête » → *análise das causas*,
    « pistes » → *hipóteses*, « verdicts » → *conclusões*, « dossier » → *processo*.
15. **Pluriels** : 2 formes comme le français (*1 dia / 2 dias*) ; attention, *0* prend le pluriel en portugais
    (*0 dias*). Accorder en genre les adjectifs calculés en JS si le FR les accorde (*a pele / o relatório*).

16. **Harmonisation (21/10, après traduction)** : la marque prend l'article féminin **a Adermio** (*a Adermio analisa…,
    Tudo sobre a Adermio*, contraction *da / na / pela Adermio*), y compris dans les pages juridiques ; logo → *Logótipo
    da Adermio* ; slogan → *O cuidado da pele reinventado com IA.* ; « Cycle » → *Ciclo* ; « Bilan » (page bilan) →
    *Avaliação* ; « protocole » → *rotina* ; « lien » → *ligação* ; « Le saviez-vous ? » → *Sabia que…?* ; « cellulaire »
    → *das células* (le QA confond *celular* avec le brésilien).

## Décisions du client

- 21/10/2026 : portugais du Portugal (pas du Brésil) ; vouvoiement neutre ; 5,99 € ; MB WAY + Multibanco activés par
  Antoine dans Stripe ; vidéo en anglais ; écrans de l'app traduits au pixel ; adresses traduites.

## Interdits pt-BR (le QA les signale)

| Brésil (interdit) | Portugal (à écrire) |
|---|---|
| você, vocês | (3e personne sans pronom) / *si* |
| tela | ecrã |
| celular | telemóvel |
| equipe / time | equipa |
| contato | contacto |
| registro, cadastro, cadastrar | registo, registar-se |
| usuário | utilizador |
| arquivo | ficheiro |
| baixar (un fichier) | descarregar / transferir |
| aplicativo | aplicação / app |
| acessar | aceder |
| estresse / esporte | stress / desporto |
| espinhas / cravos | borbulhas / pontos negros |
| cisto | quisto |
| maquiagem | maquilhagem |
| café da manhã / banheiro | pequeno-almoço / casa de banho |
| planejar | planear |
| Oi / Tchau | Olá / Até breve |
| estou fazendo, está ficando (gérondif) | estou a fazer, está a ficar |
| -ênico, -ômeno, -ômico (*comedogênico, fenômeno, econômico, gênero, glicêmico*) | *comedogénico, fenómeno, económico, género, glicémico* |
| peróxido de benzoila | peróxido de benzoílo |
| me diga (pronom en tête de phrase) | diga-me (enclise en phrase affirmative) |

## Typographie portugaise

- Guillemets **« … »** sans espace intérieure (*«texto»*). Aucune espace avant `! ? : ;`. Tiret d'incise : *–* entouré
  d'espaces.
- Nombres : virgule décimale (*2,5*), milliers à espace insécable à partir de 5 chiffres (*10 000*, mais *2000*),
  pourcentage collé (*98%*), dates *21 de outubro de 2026* (mois en minuscules), heures *14h30*, *MB* pour « Mo ».
- Jours : « J1 / J7 / J28 / J+90 » → *dia 1 / dia 7 / dia 28 / após 90 dias* (badge court : *Dia 28*) ; « 0/28j » →
  *0/28 dias* ; « +2000 avis » → *mais de 2000 avaliações*.
- Majuscules : casse de phrase dans les titres (pas de Majuscule À Chaque Mot). Mois et jours en minuscules.
- Mots étrangers admis : marques, *Adermio*, *IA*, *FPS / SPF*, *PDF*, *e-mail*, *Blog*, *Premium* (abonnement de
  l'app), *App Store / Google Play*, *stress*, *online*, noms INCI.

## Glossaire figé

### Navigation et pages
| FR | PT |
|---|---|
| Accueil | Início |
| Faire l'analyse (navigation) | Fazer a análise |
| Analyser ma peau / Démarrer mon analyse / Faire mon analyse gratuite (CTA) | Fazer a minha análise gratuita |
| À propos | Sobre nós |
| Nous contacter / Contact | Contacte-nos / Contactos |
| Conditions d'utilisation | Termos de utilização |
| Conditions de vente / CGV | Condições de venda |
| Mentions légales | Informações legais |
| Politique de confidentialité | Política de privacidade |
| Sources | Fontes |
| Avis / Témoignages | Opiniões / O que dizem os nossos utilizadores |
| Feedback / Envoyer le feedback | Opinião / Enviar opinião |
| Blog | Blog |
| Tous droits réservés | Todos os direitos reservados |
| slogan « La dermatologie réinventée par l'IA » | O cuidado da pele reinventado com IA. (jamais « dermatologia » à côté d'IA) |
| Suivant / Précédent / Retour / Envoyer / Valider | Seguinte / Anterior / Voltar / Enviar / Confirmar |
| Chargement… / Envoi en cours… | A carregar… / A enviar… |
| Réessayer | Tentar novamente |

### Produit Adermio
| FR | PT |
|---|---|
| analyse (de peau) | análise da pele / análise |
| analyse gratuite | análise gratuita |
| analyse complète / dossier complet / analyse premium (web) | análise completa — *Premium* est réservé à l'abonnement de l'app |
| débloquer (bouton de paiement) | Desbloquear por 5,99 € |
| rapport | relatório (en PDF : o seu relatório em PDF) |
| résultats | resultados |
| bilan cutané | avaliação da pele |
| paiement unique / sans abonnement | pagamento único / sem subscrição |
| abonnement | subscrição |
| satisfait ou remboursé | Garantia de reembolso |
| routine personnalisée | rotina personalizada |
| routine du matin / du soir | rotina da manhã / rotina da noite |
| second cycle / 2e cycle | segundo ciclo |
| bilan J28 / suivi | avaliação ao dia 28 / acompanhamento |
| photo de face / profil gauche / profil droit | foto de frente / perfil esquerdo / perfil direito |
| questionnaire / formulaire | questionário |
| IA | IA (forme longue *inteligência artificial* une fois par page au plus) |
| conseils / recommandations | conselhos / recomendações |
| plan alimentaire / alimentation | alimentação / conselhos alimentares |
| facteurs aggravants | fatores agravantes |

### Peau
| FR | PT |
|---|---|
| peau (du visage) | pele ; **type de peau → *tipo de pele*** (*oleosa / mista / seca / sensível / normal*) |
| acné / acné hormonale | acne (féminin : *a acne*) / acne hormonal |
| boutons | borbulhas |
| points noirs / points blancs (microkystes) | pontos negros / pontos brancos |
| papules / pustules / nodules / kystes | pápulas / pústulas / nódulos / quistos |
| comédons | comedões |
| rougeurs | vermelhidão |
| cicatrices | cicatrizes de acne |
| taches (post-inflammatoires) | manchas (pós-inflamatórias) |
| pores dilatés | poros dilatados |
| sébum / excès de sébum | sebo / excesso de sebo |
| zone T / zone U | zona T / zona U |
| front / joues / menton / mâchoire / autour de la bouche | testa / bochechas / queixo / maxilar / à volta da boca |
| sévérité légère / modérée / sévère | ligeira / moderada / intensa |
| actifs / ingrédients | ativos / ingredientes |
| nettoyant / crème hydratante / sérum / écran solaire | gel de limpeza / creme hidratante / sérum / protetor solar (FPS) |
| exfoliant | esfoliante |
| acide salicylique / peroxyde de benzoyle / niacinamide | ácido salicílico / peróxido de benzoílo / niacinamida |
| rétinoïdes / rétinol / adapalène / isotrétinoïne | retinoides / retinol / adapaleno / isotretinoína |
| acide azélaïque / zinc / AHA / BHA | ácido azelaico / zinco / AHA / BHA |
| (non) comédogène | (não) comedogénico |
| grossesse / allaitement | gravidez / amamentação |
| cycle menstruel / règles | ciclo menstrual / menstruação |
| stress / sommeil / sport, transpiration | stress / sono / desporto, transpiração |
| produits laitiers / sucre / index glycémique | laticínios / açúcar / índice glicémico |
| médecin / dermatologue (un vrai) | médico / dermatologista |
| maquillage | maquilhagem |

## Style portugais

- Phrases claires, pas plus longues que le FR. Pas de calques du français (« Découvrez… » → varier : *Descubra…*,
  *Veja…*, ou une affirmation directe ; « Afin de… » → *Para…*).
- Enclise dans la phrase affirmative (*Inscreva-se, Envie-nos*), proclise après négation, relatif ou adverbe (*não se
  preocupe, que lhe enviamos*).
- Anglicismes : seulement ceux que le public portugais emploie vraiment (*sérum, IA, FPS, blog, online, stress*). Sinon
  le mot portugais (*cuidados de pele* plutôt que *skincare*).
- Boutons système : infinitif court (*Seguinte, Voltar, Enviar*) ; boutons marketing : impératif de politesse ou
  formule « Fazer a minha… ». Toucher l'écran = *Toque* ; cliquer = *Clique*. Le portugais est ~10 % plus long que le
  français : reformuler si un bouton ou un badge déborde à 360 px.
- Genre grammatical : *pele, análise, rotina, acne* (fém.), *relatório, resultado, sérum* (masc.) ; accorder les
  adjectifs calculés en JS si le FR les accorde.
