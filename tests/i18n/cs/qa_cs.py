#!/usr/bin/env python3
"""Contrôle qualité des pages tchèques — dérivé de qa_pt.py (structure, liens, sélecteur) et de qa_pl.py (détecteurs slaves).

Pour chaque page CS :
  1. squelette de balises identique au FR (hors sélecteur, hreflang, lien « Résilier »)
  2. html lang="cs", aucun lang="fr", aucun lien /en/ /es/ /it/ /de/ /nl/ /el/ /pl/ /pt/ hors sélecteur/hreflang,
     liens internes existants, sélecteur (Čeština + 9 jumeaux)
  3. résidus : mots-outils FR/EN/ES/PT/PL, morphologie française, segment sans aucun signe tchèque, segment identique au FR,
     slovaque (SK), tchèque tapé SANS diacritiques (ASCII), lettres grecques
  4. décisions PDG : registre « vy » (jamais de tykání : ty-possessifs, jsi, 2e pers. sg., impératifs sg.), vous de
     politesse en minuscules hors début de phrase (MAJ), AUCUNE forme genrée adressée au visiteur (GENRE : participe
     passé -l/-la/-li avec « jste / byste », « jste připraven(a) / spokojen(á) », graphies « /a », « (a) », Vážený/á),
     « Adermio » jamais décliné (ADERMIO : Adermia / Adermiu / Adermiem…)
  5. vocabulaire médical interdit (INTERDIT : diagnóza, pacient, terapie, klinický, léčit / vyléčit… ; « léčba / léčení /
     léčivo » permis seulement pour le traitement prescrit À L'UTILISATEUR, avec un mot de contexte : lékař, předepsaný,
     užíváte…), « dermatolog » à côté d'Adermio/AI (DERMA)
  6. typographie : espace avant ! ? : ; (ESPACE), guillemets „…“ (GUILL), J28 / Mo / 1.000 / 98% collé / date sans point
     (TYPO), prix (PRIX : l'analyse complète coûte 149 Kč ; jamais d'euros pour l'analyse, ni zł, ni Kč mal formé),
     accord du nom avec le nombre 1 / 2–4 / 5+ (PLURIEL, cas simples)

Faux positifs : une ligne `CODE<TAB>sous-chaîne<TAB>raison` dans allow_cs.txt (jamais pour INTERDIT/DERMA/IDENT/PRIX/
GREC/PL/PT/SK/GENRE/REGISTRE/ADERMIO).

Usage : python3 tests/i18n/cs/qa_cs.py [cs/home.html ...]
"""
import os, re, sys, html as htmlmod
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from prep_cs import PAGES, ROOT, fr_path, cs_path, cs_exists

# ── Détecteurs (unité testée par test_qa_cs.py) ───────────────────────────────────────────────
WORD = r"[A-Za-zÀ-ž]"
CS_DIA = "áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ"

# GENRE ── le passé, le conditionnel et les formes courtes d'adjectif s'accordent au genre même au vouvoiement
#   « udělal jste », « jste udělala », « Použili jste », « chtěl byste », « abyste mohl », « jste připraven(a) »
PART = r"\w+(?:l|la|li|ly)"
NOT_PART = {'zcela', 'docela', 'dál', 'cíl', 'styl', 'gel', 'olej', 'chvíli', 'jestli', 'pokud', 'zdali', 'kdyby',
            'mezi', 'kdekoli', 'kdykoli', 'cokoli', 'jakkoli', 'kdokoli', 'kamkoli', 'ideál', 'materiál', 'potenciál', 'detail', 'e-mail', 'email', 'profil', 'účel', 'stále', 'vždycky',
            'ráno', 'večer', 'zítra', 'dnes', 'brzy', 'kapli', 'kapky', 'zvlášť', 'dobu', 'nyní', 'tehdy', 'celý',
            'čtvrtletí', 'víkendy', 'týdny', 'roky', 'dny', 'fotky', 'kroky', 'přípravky', 'produkty', 'krémy',
            'oleje', 'jizvy', 'skvrny', 'vlasy', 'póry', 'látky', 'složky'}
GENRE_PAST = re.compile(r"\b(" + PART + r")\s+(?:jste|byste)\b|\b(?:jste|(?:a|kdy)?byste)\s+(?:(?:si|se|už|již|někdy|"
                        r"dříve|předtím|nikdy|ještě|také|taky|to|ho|ji|je|mi|nám|nás|o|tom|s|tím|v|na|po|za)\s+){0,3}("
                        + PART + r")\b", re.I)
ADJ_STEMS = (r"připraven|spokojen|přihlášen|zaregistrován|registrován|přesvědčen|unaven|překvapen|nadšen|informován|"
             r"pozván|vítán|ochoten|ochotn|zvědav|jist|sám|sama|sami|nov|rád|ráda|rádi|vděčn|schopen|schopn|"
             r"zvyklý|zvykl|zklamán|zklaman|odhodlán|motivován|připravenější")
GENRE_ADJ = re.compile(r"\b(?:jste|budete|buďte|zůstanete|zůstaňte|cítíte\s+se|budete\s+se\s+cítit)\s+(?:\w+\s+){0,2}?"
                       r"(?:" + ADJ_STEMS + r")[aáeéiíyý]?\b", re.I)
GENRE_SLASH = re.compile(r"\b\w+(?:\((?:a|á|i|y|o|la|li)\)|/(?:a|á|i|y|la|li))(?!\w)")
GENRE_ADDR = re.compile(r"(?:^|[.!?]\s+)(Vážen[ýáíé]|Mil[ýáíé])\s+(?:zákazn\w*|uživatel\w*|klient\w*|čtenář\w*|[A-ZČŘŠŽ]\w*)")

def genre_hits(s):
    for m in GENRE_PAST.finditer(s):
        w = (m.group(1) or m.group(2) or '').lower()
        if w and w not in NOT_PART:
            return m.group(0)
    for rx in (GENRE_ADJ, GENRE_SLASH, GENRE_ADDR):
        if (m := rx.search(s)): return m.group(0)
    return None

# REGISTRE ── tykání : possessifs/pronoms de 2e pers. sg., « jsi », verbe en -š, impératifs sg. fréquents
REGISTRE_RE = re.compile(r"\b(tvůj|tvoje|tvá|tvé|tvého|tvému|tvém|tvým|tvou|tvých|tvými|tobě|tebe|tebou|tě|jsi|sis|ses|"
                         r"udělej|pošli|odešli|klikni|klepni|začni|zjisti|vyzkoušej|zkus|nahraj|vyplň|stáhni|podívej|"
                         r"přidej|napiš|vyfoť|vyfotografuj|získej|používej|sleduj|pokračuj|zadej|vyber|zvol|potvrď|"
                         r"otevři|nanes|přečti|kontaktuj|zaregistruj|přihlas|nezapomeň|dopřej|objednej)\b", re.I)
VERB_2SG = re.compile(r"\b\w{2,}(?:áš|íš|eš|ješ)\b", re.I)
NOT_2SG = {'náš', 'váš', 'spíš', 'tomáš', 'lukáš', 'aleš', 'matyáš', 'ondráš', 'jiříš', 'peš', 'příliš', 'též', 'dneš'}

def registre_hit(s):
    if (m := REGISTRE_RE.search(s)): return m.group(0)
    for m in VERB_2SG.finditer(s):
        if m.group(0).lower() not in NOT_2SG: return m.group(0)
    return None

MAJ_WORDS = re.compile(r"\b(Vy|Váš|Vaše|Vašeho|Vašemu|Vašem|Vaším|Vaši|Vaší|Vašich|Vašim|Vašimi|Vás|Vám|Vámi)\b")
# Adermio est invariable (pas d'article, pas de déclinaison) : « s aplikací Adermio », « tým Adermio »
ADERMIO_RE = re.compile(r"\bAdermi(?:a|u|em|ích|ovi|ího|ím)\b")
INTERDIT_RE = re.compile(r"(diagnóz\w*|diagnos\w*|diagnost\w*|pacient\w*|terapi\w*|terapeut\w*|klinick\w*|klinik\w*|"
                         r"vyléč\w*|uzdrav\w*|\bléč(?:it|í|íme|íte|ila|il|ili|ebn\w*)\b)", re.I)
LECBA_RE = re.compile(r"\bléč(?:b\w*|en\w*|iv\w*)\b", re.I)
MED_CTX = re.compile(r"lékař|předeps|dermatolog|užív|podstup|izotretin|isotretin|antibiotik|antikoncep|hormon|retinoid|"
                     r"roaccutan|aknenormin|kúr|lék", re.I)
DERMA_RE = re.compile(r"\b(AI|UI|Adermio)\b[^.!?]{0,40}\bdermatolog\w*|\bdermatolog\w*[^.!?]{0,20}\b(AI|UI|Adermio)\b"
                      r"|\bdermatologick\w+\s+(?:analýz\w*|vyšetř\w*|posouzen\w*|hodnocen\w*|diagnos\w*)", re.I)
# Mots-outils français (« nos » retiré : tchèque « nos » = nez)
FR_STRONG = re.compile(r"\b(votre|vos|vous|nous|une|pour|avec|dans|sur|peau|gratuite|merci|cliquez|veuillez|réessayer|erreur|"
                       r"chargement|semaine|semaines|jours|mois|très|sans|avant|après|paiement|résultats|conseils|produits|"
                       r"complète|sévérité|boutons|rougeurs|taches|cicatrices|aux|qui|que|mais|tout|tous|toutes|autre|autres|"
                       r"cette|ces|mon|leur|leurs|notre|ici|déjà|encore|toujours|aussi|ainsi|puis|donc|selon|chez|depuis|"
                       r"pendant|parmi|afin|lorsque|quand|comment|pourquoi|combien|quel|quels|quelles|est|sont|et)\b", re.I)
EN_RE = re.compile(r"\b(the|your|you|and|with|for|this|that|our|free|skin|analysis|report|please|click|here|now|today)\b", re.I)
ES_RE = re.compile(r"\b(usted|ustedes|piel|también|ahora|gracias|muy|una|los|las|del|y|el|con|pero|hoy|aquí|cuando|hasta)\b")
# Portugais (tables semées depuis le portugais) : lettres ã õ ç, ou 2 mots-outils portugais
PT_LETTERS = re.compile(r"[ãõçÃÕÇ]")
PT_WORDS = re.compile(r"\b(você|seu|sua|seus|suas|não|análise|pele|para|com|uma|também|obrigad\w*|relatório|rotina|gratuita|"
                      r"está|são|mais|pelo|pela|nas|dos|das|da|ao)\b")   # « do », « já », « nos » : aussi tchèques
PL_RE = re.compile(r"[ąćęłńśźżĄĆĘŁŃŚŹŻ]|\bzł\b|\b(twoj\w*|Twoj\w*|skór\w*|się|jest|oraz|cera|trądzik\w*)\b")
# Slovaque : lettres propres (ä ô ľ ĺ ŕ) ou mots qui n'existent pas en tchèque
SK_RE = re.compile(r"[äôľĺŕÄÔĽĹŔ]|\b(ktor[ýáéíú]\w*|alebo|sú|môž\w*|ďakuj\w*|vaša|vašu|tiež|keď|ako|teraz|veľmi|zadarmo|"
                   r"ďalš\w*|mesiac\w*|týžd\w*|deň|sme|aj|lebo|hneď|práve|pleťou|vám\s+ďakujeme)\b", re.I)
MORPHO_RE = re.compile(r"\b(\w{4,}ement|\w{3,}eux|ci-dessous|ci-dessus|formulaire|veuillez)\b", re.I)
MORPHO_OK = {'element', 'suplement', 'temperament', 'fundament', 'management', 'engagement', 'cement', 'pigment',
             'treatment', 'development', 'assessment', 'improvement', 'sediment', 'segment', 'moment', 'argument',
             'experiment', 'fragment', 'parlament', 'dokument', 'instrument', 'komplement'}
CS_SIGNAL = re.compile(r"[" + CS_DIA + r"]|\b(a|i|v|ve|na|do|se|si|je|jsou|to|že|pro|s|z|ze|k|ke|o|od|po|za|u|jak|jako|"
                       r"nebo|ale|aby|při|pod|nad|bez|než|jen|už|již|co|kdo|kde|který|která|které|vaše|vám|vás|není|jste)\b",
                       re.I)
# Tchèque tapé sans diacritiques (formes qui n'existent pas sans háček/čárka)
ASCII_RE = re.compile(r"\b(muzete|muzes|muze|prosim|dekujeme|dekuji|vas|vase|vasi|vasich|vam|nas|nase|akne|analyza|analyzu|"
                      r"analyzy|pece|pokozka|pokozky|pokozku|uplne|jeste|vice|mesic|mesice|mesicu|tyden|tydny|tydnu|"
                      r"zacnete|ziskate|vysledky|vysledek|vysledku|pri|pres|ktery|ktera|ktere|kteri|protoze|uz|jiz|nez|"
                      r"pripravek|pripravky|doporuceni|doporucujeme|reseni|rozsirene|cerne|tecky|mastna|smisena|citliva|"
                      r"normalni|zarudnuti|pupinky|otevrene|uzavrene|pigmentove|slozeni|slozky|zdravi|lekar|lekare|"
                      r"lekarem|tehotenstvi|kojeni|spanek|davkovani|cistici|hydratacni|ranni|vecerni|zpravu|predplatne|"
                      r"predplatneho|zruseni|podminky|udaju|osobnich|pravni|dekujeme|zdarma\s+analyza)\b", re.I)
GREC_RE = re.compile(r"[Α-Ωα-ωάέήίόύώ]")

def ascii_hit(s):
    if (m := ASCII_RE.search(s)): return m.group(0)
    words = re.findall(WORD + r"{2,}", s)
    if len(words) >= 8 and CS_SIGNAL.search(s) and not re.search(r"[" + CS_DIA + r"]", s) \
            and not FR_STRONG.search(s) and not EN_RE.search(s):
        return 'aucun diacritique sur ' + str(len(words)) + ' mots'
    return None

# PRIX ── analyse complète = 149 Kč (`149&nbsp;Kč`) ; budgets produits en euros (« < 60 € ») permis
PRIX_RE = re.compile(r"\bzł\b|zł|\d+\.\d\d\s?(?:€|Kč)|€\s?\d|\$\s?\d|\b(?:4,99|5,99|6,99|7,99|14,99|24,99)\b|"
                     r"Kč\s?\d|\d(?:Kč|Kc)\b|\d+,\d\d?\s?Kč|\d+,-\s?Kč|\b\d+\s?(?:kč|KČ|Kc|kc|CZK)\b")
KC_AMOUNT = re.compile(r"(\d[\d   ]*)[   ]Kč\b")

def prix_hit(s):
    if (m := PRIX_RE.search(s)): return m.group(0)
    for m in KC_AMOUNT.finditer(s):
        if re.sub(r'\s', '', m.group(1)) != '149': return m.group(0)
    return None

MONTHS = r"(?:ledna|února|března|dubna|května|června|července|srpna|září|října|listopadu|prosince)"
TYPO_RE = re.compile(r"\bJ\+?\d{1,3}\b|\b\d+\s?Mo\b|\b\d{1,3}\.\d{3}\b|\d%|\b\d{1,2}\s" + MONTHS + r"\b"
                     r"|\b\d{1,2}\.\s?(?:Ledna|Února|Března|Dubna|Května|Června|Července|Srpna|Září|Října|Listopadu|Prosince)\b")
GUILL_RE = re.compile(r"[«»”]")
ESPACE_RE = re.compile(r"[\wÀ-ž%)“’]\s*[   ]+[!?;:](?=\s|$|[“\"’<)„”])")

# PLURIEL ── 1 / 2–4 / 5+ (et 0) : nominatif-accusatif seulement ; après une préposition qui régit un autre cas
# (do 3 dnů, před 5 dny, po 28 dnech…), on ne contrôle pas.
NOUNS = {  # forme : (catégorie)
    'den': 'one', 'dny': 'few', 'dní': 'many', 'dnů': 'many',
    'týden': 'one', 'týdny': 'few', 'týdnů': 'many',
    'měsíc': 'one', 'měsíce': 'few', 'měsíců': 'many',
    'rok': 'one', 'roky': 'few', 'let': 'many',
    'minuta': 'one', 'minuty': 'few', 'minut': 'many',
    'hodina': 'one', 'hodiny': 'few', 'hodin': 'many',
    'krok': 'one', 'kroky': 'few', 'kroků': 'many',
    'produkt': 'one', 'produkty': 'few', 'produktů': 'many',
    'přípravek': 'one', 'přípravky': 'few', 'přípravků': 'many',
    'fotka': 'one', 'fotky': 'few', 'fotek': 'many',
    'fotografie': 'onefew', 'fotografií': 'many',
    'uživatel': 'one', 'uživatelé': 'few', 'uživatelů': 'many',
    'recenze': 'onefew', 'recenzí': 'many',
    'otázka': 'one', 'otázky': 'few', 'otázek': 'many',
}
OTHER_CASE_PREP = {'do', 'od', 'z', 'ze', 'během', 'kolem', 'okolo', 'u', 'bez', 'místo', 'podle', 'dle', 'kromě',
                   'před', 's', 'se', 'mezi', 'nad', 'pod', 'po', 'při', 'v', 've', 'o', 'k', 'ke',
                   'více', 'méně', 'víc', 'míň', 'nejméně', 'nejvíce', 'každých', 'posledních', 'prvních', 'dalších',
                   'několik'}   # « za », « na », « přes », « až », « alespoň »… : nominatif/accusatif => contrôlé
PLURAL_RE = re.compile(r"(?:(\w+)\s+)?\b(\d+)[   ](\w+)")

def cat(n):
    return 'one' if n == 1 else ('few' if 2 <= n <= 4 else 'many')

def pluriel_hit(s):
    for m in PLURAL_RE.finditer(s):
        prev, num, noun = (m.group(1) or '').lower(), int(m.group(2)), m.group(3).lower()
        if noun not in NOUNS or prev in OTHER_CASE_PREP: continue
        if m.start(2) and s[m.start(2) - 1] in ',.–-/': continue   # 1,5 dne ; 2–4 ; 0/28
        want, got = cat(num), NOUNS[noun]
        if got == 'onefew' and want in ('one', 'few'): continue
        if got != want: return m.group(0)
    return None

NEVER_ALLOW = {'INTERDIT', 'DERMA', 'IDENT', 'PRIX', 'GREC', 'PL', 'PT', 'SK', 'GENRE', 'REGISTRE', 'ADERMIO'}

SAME_OK_PAGES = {'cs/zdroje.html'}   # références bibliographiques (titres d'études en anglais)

def _load_allow():
    out = []
    p = os.path.join(HERE, 'allow_cs.txt')
    if not os.path.exists(p): return out
    for n, line in enumerate(open(p, encoding='utf-8'), 1):
        line = line.rstrip('\n')
        if not line.strip() or line.startswith('#'): continue
        parts = line.split('\t')
        if len(parts) < 3 or not parts[2].strip():
            raise SystemExit(f'allow_cs.txt L{n} : format CODE<TAB>sous-chaîne<TAB>raison attendu')
        if parts[0] in NEVER_ALLOW:
            raise SystemExit(f'allow_cs.txt L{n} : le code {parts[0]} ne peut pas être autorisé')
        out.append((parts[0], parts[1]))
    return out
ALLOW_LINES = _load_allow()

def allowed(code, seg, page):
    return any(c == code and sub in seg for c, sub in ALLOW_LINES)

def maj_hits(seg):
    out = []
    for m in MAJ_WORDS.finditer(seg):
        before = seg[:m.start()].rstrip()
        if before and before[-1] not in '.!?:„“"«(—–-•✓✔>':
            out.append(m.group(0))
    return out

def segment_hits(seg, page):
    """Défauts d'un segment de texte visible : liste de (code, extrait)."""
    hits = []
    ref = page in SAME_OK_PAGES
    s = re.sub(r'https?://\S+|[\w.+-]+@[\w.-]+|\b[\w-]+\.(com|fr|cz|html)\b', ' ', seg)
    if (g := genre_hits(s)): hits.append(('GENRE', g))
    if (r := registre_hit(s)): hits.append(('REGISTRE', r))
    if (w := maj_hits(s)): hits.append(('MAJ', w[0]))
    if (m := ADERMIO_RE.search(s)): hits.append(('ADERMIO', m.group(0)))
    if not ref:
        if (m := INTERDIT_RE.search(s)): hits.append(('INTERDIT', m.group(0)))
        elif (m := LECBA_RE.search(s)) and not MED_CTX.search(s): hits.append(('INTERDIT', m.group(0) + ' (sans contexte lékař/předepsaný)'))
    if DERMA_RE.search(re.sub(r'\s*[—–|-]\s*Adermio\s*$', '', s)): hits.append(('DERMA', 'dermatolog = Adermio ?'))
    if not ref:
        fr = FR_STRONG.findall(s)
        if len(fr) >= 2 or (fr and not CS_SIGNAL.search(s)): hits.append(('FR', ','.join(fr[:4])))
        en = EN_RE.findall(s)
        if len(en) >= 2: hits.append(('EN', ','.join(en[:4])))
        es = ES_RE.findall(s)
        if len(es) >= 2: hits.append(('ES', ','.join(es[:4])))
        ptw = PT_WORDS.findall(s)
        if PT_LETTERS.search(s) or len(ptw) >= 2: hits.append(('PT', PT_LETTERS.search(s).group(0) if PT_LETTERS.search(s) else ','.join(ptw[:4])))
        mo = [m.group(0) for m in MORPHO_RE.finditer(s) if m.group(0).lower() not in MORPHO_OK]
        if mo: hits.append(('MORPHO', mo[0]))
        words = re.findall(WORD + r"{2,}", s)
        if len(words) >= 5 and not CS_SIGNAL.search(s): hits.append(('PAS_CS', ' '.join(words[:5])))
        if (m := SK_RE.search(s)): hits.append(('SK', m.group(0)))
        if (a := ascii_hit(s)): hits.append(('ASCII', a))
    if (m := PL_RE.search(s)): hits.append(('PL', m.group(0)))
    if (m := GREC_RE.search(s)): hits.append(('GREC', m.group(0)))
    if (p := prix_hit(s)): hits.append(('PRIX', p))
    if (p := pluriel_hit(s)): hits.append(('PLURIEL', p))
    for code, rx in (('TYPO', TYPO_RE), ('GUILL', GUILL_RE), ('ESPACE', ESPACE_RE)):
        if (m := rx.search(s)): hits.append((code, m.group(0)))
    return [h for h in hits if h[0] in NEVER_ALLOW or not allowed(h[0], seg, page)]

# ── Contrôle d'une page (structure, liens, sélecteur, segments) ──────────────────────────────────
def strip_selector(s):
    s = '\n'.join(l for l in s.split('\n') if 'hreflang=' not in l and 'adermio.com/resilier" class="!text-slate-500' not in l)
    i = s.find('<div class="lang-dropdown')
    if i >= 0:
        depth, pos = 1, s.find('>', i) + 1
        while depth:
            o, c = s.find('<div', pos), s.find('</div>', pos)
            if c < 0: break
            if o != -1 and o < c: depth += 1; pos = o + 4
            else: depth -= 1; pos = c + 6
        s = s[:i] + s[pos:]
    return s

def tags(s): return re.findall(r'<(/?[a-zA-Z0-9]+)', s)

def visible_segments(s):
    """(ligne, texte) pour le texte visible, les attributs textuels et les chaînes JS affichables."""
    segs = []
    body = re.sub(r'<style.*?</style>', lambda m: '\n' * m.group(0).count('\n'), s, flags=re.S)
    body = re.sub(r'<!--.*?-->', lambda m: '\n' * m.group(0).count('\n'), body, flags=re.S)
    def js_strings(m):
        out = []
        code = re.sub(r'^\s*//.*$', '', m.group(0), flags=re.M)
        code = re.sub(r'console\.(log|warn|error|info|debug)\([^;]{0,400}?\)', '', code, flags=re.S)
        code = re.sub(r'new Error\([^;]{0,200}?\)', '', code, flags=re.S)
        for q in re.finditer(r"(['\"`])((?:\\.|(?!\1).)*)\1", code):
            v = q.group(2)
            if v in ('use strict',): continue
            if len(v) >= 6 and re.search(WORD + r'{3,}\s+' + WORD + r'{2,}', v) and not re.match(r'^[\w./:#?=&%+-]+$', v):
                out.append('JS:' + v)
        return '\n' + '\n'.join(out) + '\n' * (m.group(0).count('\n') - len(out))
    body = re.sub(r'<script.*?</script>', js_strings, body, flags=re.S)
    for m in re.finditer(r'\b(title|alt|placeholder|aria-label|content|data-label)="([^"]{4,})"', body):
        if m.group(1) == 'content' and re.match(r'^[\w./:#?=&%+, -]+$', m.group(2)) and 'adermio' in m.group(2).lower():
            continue
        segs.append((body[:m.start()].count('\n') + 1, 'ATTR:' + htmlmod.unescape(m.group(2))))
    body = re.sub(r'</(strong|b|em|i|span|a|u)>', '', body)
    text = re.sub(r'<[^>]+>', ' ', body)
    for ln, line in enumerate(text.split('\n'), 1):
        t = htmlmod.unescape(line).strip()
        if len(t) >= 3:
            segs.append((ln, t))
    return segs

CSS_ISH = re.compile(r'\b\d+(\.\d+)?(s|ms|px|rem|em|vh|vw)\b|\b(ease|infinite|linear|alternate|translate|opacity)\b'
                     r'|\b(flex|grid|items|justify|gap|mb|mt|px|py|text|bg|border|rounded|hover|w|h)-')

def is_human_text(seg):
    if seg.startswith('ATTR:') and not re.match(r'ATTR:[A-ZÀ-ÝČĎĚŇŘŠŤŮŽ]', seg): return False
    if re.search(r'\$\{|\bfunction\b|=>|\\u[0-9a-f]{4}|[{}=;]|\bclass=', seg) and not re.search(r'[' + CS_DIA + r']', seg): return False
    if CSS_ISH.search(seg) or seg.startswith(('flex ', 'grid ', 'absolute ', 'relative ')): return False
    return bool(re.search(WORD + r'{3}', seg))

SAME_OK = {'Adermio © 2026', '© 2026 Adermio.', 'Adermio AI Core™', 'Adermio © 2025',
           # noms des langues du sélecteur (chacune dans sa langue)
           'Čeština', 'English', 'Español', 'Italiano', 'Deutsch', 'Nederlands', 'Ελληνικά', 'Polski', 'Português', 'Français'}
# Valeurs postées au webhook en FR canonique (jamais affichées) + marques
BACKEND_FR = {'autour de la bouche', 'Aucune zone spécifique', 'Manque de sommeil', 'Rien de particulier',
              'Changement de produits', 'Stress élevé', 'Cycle hormonal / Règles', 'Alimentation / Excès',
              'Transpiration (sport)', 'Frottements / Rasage'}
BRANDS = {'The INKEY List', 'La Roche-Posay', "Paula's Choice", 'The Ordinary'}
ALLOW = {'cs/form.html': BACKEND_FR | BRANDS, 'cs/premium.html': BRANDS, 'cs/bilan.html': BRANDS, 'cs/second-cycle.html': BRANDS}
TWIN_FLAGS = ('us', 'es', 'it', 'de', 'nl', 'gr', 'pl', 'pt')

def check(cs_rel):
    fr_rel = [k for k, v in PAGES.items() if v[0] == cs_rel][0]
    fr = open(fr_path(fr_rel), encoding='utf-8').read()
    cs = open(cs_path(cs_rel), encoding='utf-8').read()
    issues = []
    ta, tb = tags(strip_selector(fr)), tags(strip_selector(cs))
    if ta != tb:
        import difflib
        added, removed = [], []
        for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, ta, tb, autojunk=False).get_opcodes():
            if op in ('insert', 'replace'): added += tb[j1:j2]
            if op in ('delete', 'replace'): removed += ta[i1:i2]
        issues.append(f'STRUCTURE: {len(ta)} balises FR vs {len(tb)} CS (ajouts {added[:8]}, retraits {removed[:8]})')
    if '<html lang="cs"' not in cs: issues.append('lang != cs')
    if re.search(r'\slang="fr"', cs): issues.append('lang="fr" résiduel')
    lines = cs.split('\n')
    for m in re.finditer(r'href="([^"]+)"', cs):
        h = m.group(1)
        line = cs[:m.start()].count('\n') + 1
        if re.match(r'^/(en|es|it|de|nl|el|pl|pt)/', h) or re.search(r'adermio\.com/(es|en|it|de|nl|el|pl|pt)/', h):
            if 'hreflang' not in lines[line - 1] and 'flagcdn' not in lines[line]:
                issues.append(f'L{line}: lien autre langue {h}')
        if h.startswith('/') and not h.startswith('//') and '?' not in h and '#' not in h:
            p = h.lstrip('/')
            cand = [os.path.join(ROOT, p), os.path.join(ROOT, p + '.html'), os.path.join(ROOT, p, 'index.html')]
            if p and not any(os.path.exists(c) for c in cand) and not (p.startswith('cs/') and cs_exists(p)) and not p.startswith(('js/', 'style', 'favicon', 'apple', 'site.web', 'logo', 'android')):
                issues.append(f'L{line}: lien interne cassé {h}')
    for m in re.finditer(r'https://adermio\.com/(cs/[\w/-]+)', cs):
        p = m.group(1)
        if not cs_exists(p):
            issues.append(f'L{cs[:m.start()].count(chr(10))+1}: lien /cs/ cassé {p}')
    i = cs.find('<div class="lang-dropdown')
    if i >= 0:
        blk = cs[i:i + 5400]
        fr_expected = 'https://adermio.com/' + ('' if fr_rel == 'index.html' else re.sub(r'/index$', '', re.sub(r'\.html$', '', fr_rel)))
        m_fr = re.search(r'<a href="([^"]+)"[^>]*>\s*<img src="https://flagcdn.com/fr.svg', blk)
        if not m_fr or m_fr.group(1) != fr_expected:
            issues.append(f'sélecteur : lien Français = {m_fr.group(1) if m_fr else None!r}, attendu {fr_expected!r}')
        _, *twins = PAGES[fr_rel]
        for flag, twin in zip(TWIN_FLAGS, twins):
            m_ = re.search(r'<a href="([^"]+)"[^>]*>\s*<img src="https://flagcdn.com/' + flag + '.svg', blk)
            if not m_ or m_.group(1) != 'https://adermio.com/' + twin:
                issues.append(f'sélecteur : lien {flag} = {m_.group(1) if m_ else None!r}, attendu /{twin}')
            elif not os.path.exists(os.path.join(ROOT, twin + '.html')) and not os.path.exists(os.path.join(ROOT, twin, 'index.html')):
                issues.append(f'sélecteur : jumeau {twin} inexistant')
        if 'flagcdn.com/cz.svg' not in blk: issues.append('sélecteur : Čeština absente')
    hits = []
    allow = ALLOW.get(cs_rel, set())
    ref = cs_rel in SAME_OK_PAGES
    fr_segs = {t.replace('JS:', '').strip() for _, t in visible_segments(fr)}
    for ln, t in visible_segments(cs):
        seg = t.replace('JS:', '').replace('ATTR:', '').strip()
        if seg in allow or seg in SAME_OK: continue
        if not is_human_text(t.replace('JS:', '').strip()): continue
        for code, ex in segment_hits(seg, cs_rel):
            hits.append((ln, f'{code} ({ex}) : {seg[:90]}'))
        if not ref and len(seg.split()) >= 3 and seg in fr_segs:
            hits.append((ln, 'IDENT (identique au FR) : ' + seg[:90]))
    return issues, hits

if __name__ == '__main__':
    targets = sys.argv[1:] or [v[0] for v in PAGES.values()]
    total = 0
    for cs_rel in targets:
        issues, hits = check(cs_rel)
        status = 'OK' if not issues and not hits else 'XX'
        print(f'{status} {cs_rel}  issues={len(issues)} résidus={len(hits)}')
        for i in issues[:10]: print('     ', i)
        for ln, t in hits[:12]: print(f'      L{ln}: {t}')
        if len(hits) > 12: print(f'      ... +{len(hits)-12}')
        total += len(issues) + len(hits)
    sys.exit(1 if total else 0)
