#!/usr/bin/env python3
"""Contrôle qualité des pages néerlandaises (dérivé de qa_de.py).

Pour chaque page NL :
  1. squelette de balises identique au FR (hors bloc sélecteur de langue et hreflang)
  2. aucun lang="fr", aucun lien /en/ /es/ /it/ /de/ hors sélecteur/hreflang
  3. résidus de français, d'anglais et d'allemand dans le texte visible, les attributs textuels et les chaînes JS
     (détecteurs ADAPTÉS au néerlandais : « de », « en », « die », « pas », « analyse », « routine »,
     « abonnement »… sont des mots néerlandais et ne doivent pas sonner)
  4. registre « je/jouw » (décision du client) : aucun « u / uw / uzelf »
  5. vocabulaire médical interdit
  6. liens internes qui pointent vers un fichier existant

Usage : python3 tests/i18n/nl/qa_nl.py [nl/home.html ...]
"""
import os, re, sys, html as htmlmod
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prep_nl import PAGES, ROOT

# Mots-outils français fréquents (compte >= 3 dans un segment). Retirés car néerlandais aussi :
# analyse, routine, dossier, pas (= pas op, pas na…), plus, les (= les), non (non-comedogeen), mais (= maïs).
FR_WORDS = r"\b(votre|vos|vous|nous|des|une|est|pour|avec|sur|dans|sont|peau|gratuit|gratuite|merci|bonjour|cliquez|envoyer|réessayer|erreur|chargement|veuillez|ans|mois|jour|jours|semaine|semaines|et|ou|ce|cette|ces|aux|au|du|de la|qui|que|très|bien|tout|tous|toutes|sans|avant|après|prix|paiement|retour|suivant|précédent|oui|autre|autres|votre peau|routine personnalisée|résultats|photos|photo|conseils|produits|complet|complète|sévérité|boutons|points noirs|rougeurs|taches|cicatrices|pores)\b"
FR_RE = re.compile(FR_WORDS, re.I)
# Un seul de ces mots suffit. Retirés car néerlandais : vers (= vers, frais), mes (= mes, couteau).
STRONG = re.compile(r"\b(votre|vos|vous|nous|une|pour|avec|dans|sur|peau|gratuite|merci|cliquez|veuillez|réessayer|erreur|chargement|semaine|semaines|jours|mois|très|sans|avant|après|paiement|résultats|conseils|produits|complète|sévérité|boutons|rougeurs|taches|cicatrices|aux|qui|que|mais|tout|tous|toutes|autre|autres|cette|ces|mon|leur|leurs|notre|nos|ici|déjà|encore|toujours|aussi|ainsi|puis|donc|selon|chez|depuis|pendant|entre|parmi|afin|lorsque|quand|comment|pourquoi|combien|quel|quels|quelles)\b")

# Morphologie impossible en néerlandais : verbes FR en -ez, adverbes en -ement, adjectifs en -eux,
# plus quelques mots de formulaire. Attrape les phrases à MOITIÉ traduites.
FR_MORPHO = re.compile(r"\b(\w{3,}ez|\w{4,}ement|\w{3,}eux|ci-dessous|ci-dessus|ci-joint|formulaire|"
                       r"courriel|veuillez|merci d|s'il vous pla)\b", re.I)
FR_MORPHO_OK = {'chez', 'assez', 'nez',
                'management', 'improvement', 'treatment', 'assessment', 'development', 'engagement',  # anglais en -ement
                'abonnement', 'supplement', 'reglement', 'complement', 'temperament', 'fundament',     # néerlandais en -ement
                'departement', 'medicament', 'element', 'testament', 'parlement', 'sentiment'}

# Registre « je / jouw » (décision du client, 09/10) : le vouvoiement néerlandais est interdit.
# « U-zone » / « T-zone » restent permis (lettre suivie d'un tiret).
U_RE = re.compile(r"(?<![-\w])([Uu]|[Uu]w|[Uu]we|[Uu]zelf)(?![-\w])")
# Zéro langage médical (règle Adermio) : Adermio n'établit pas de diagnostic, ne soigne pas, n'a pas de patients,
# pas de vocabulaire clinique côté Adermio (même arbitrage que l'allemand).
BANNED_RE = re.compile(r"\b(diagnos\w*|patiënt\w*|patient\w*|therapie\w*|therapeut\w*|genees\w*|genez\w*|klinisch\w*|kliniek\w*)\b", re.I)
# Mots anglais fréquents (>= 2) : une phrase anglaise restée dans la page.
EN_RE = re.compile(r"\b(the|your|you|and|with|for|this|that|our|free|skin|analysis|report|please|click|here)\b")
# Titres d'études en anglais (page Bronnen) : « patients », « therapeutic »… y sont légitimes.
EN_REF = re.compile(r"\b(the|and|with|for|on|by|an|to|study|trial|randomi[sz]ed|patients|effects?|diet|treatment|therapeutic|review|clinical)\b", re.I)
# Mots allemands sans homographe néerlandais (1 suffit) : une phrase allemande égarée.
# Absents volontairement : die, der, das, werden, ist? (ist n'est pas néerlandais : gardé).
DE_RE = re.compile(r"\b(und|nicht|Sie|Ihre?|Ihnen|Ihrer|für|über|sind|auch|ist|eine|einen|nur|wir|uns|bei|oder|Haut|jetzt|kostenlose?|Hautanalyse|Pickel|bitte)\b")

# Pièges relevés par la relecture native du glossaire (09/10) : mots fautifs, belgicismes, tics, calques.
STYLE_RE = re.compile(r"\b(gecombineerde|overtollig talg|werkzame stof\w*|gelieve|hartstikke|joh|toppie|Hoi|ingeven|kuisen|"
                      r"verwittigen|bijkomende?|opvlamming\w*|AI-dermatoloog\w*|dermatologische analyse|vooruitzicht\w*|"
                      r"Aarzel niet|Wij verzoeken)\b", re.I)
# « dermatoloog » est un titre protégé (Wet BIG) : jamais à côté d'AI / Adermio.
DERMA_RE = re.compile(r"\b(AI|Adermio)\b[^.!?]{0,40}\bdermatolo\w*|\bdermatolo\w*[^.!?]{0,20}\b(AI|Adermio)\b")
# Typographie française : jours « J28 », « Mo », guillemets « ».
JDAY_RE = re.compile(r"\bJ\+?\d{1,3}\b|\b\d+\s?Mo\b|[«»]")
# Espace (normale, insécable, fine) avant ! ? : ; — vérifié sur le texte SANS balises (sinon « </b> : » ferait un faux positif).
SPACE_PUNCT_RE = re.compile(r"[\wÀ-ÿ%)”’]\s*[ \u00a0\u202f]+[!?;:](?=\s|$|[“\"’<)])")

def typo_hits(html):
    body = re.sub(r'<(script|style)\b.*?</\1>', lambda m: '\n' * m.group(0).count('\n'), html, flags=re.S)
    body = re.sub(r'<!--.*?-->', lambda m: '\n' * m.group(0).count('\n'), body, flags=re.S)
    out = []
    for ln, line in enumerate(body.split('\n'), 1):
        if 'hreflang=' in line: continue
        t = htmlmod.unescape(re.sub(r'<[^>]+>', '', line))
        if (m := SPACE_PUNCT_RE.search(t)):
            out.append((ln, 'ESPACE AVANT PONCTUATION : ' + t.strip()[:90]))
    return out

def has_fr_morphology(seg):
    for m in FR_MORPHO.finditer(seg):
        if m.group(0).lower() not in FR_MORPHO_OK: return m.group(0)
    return None

def strip_selector(s):
    s = '\n'.join(l for l in s.split('\n') if 'hreflang=' not in l)
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

# Écarts de structure VOULUS vs le FR : balises ajoutées, avec leur justification.
# Toute autre différence reste une erreur.
STRUCT_ALLOWED = {}

def visible_segments(s):
    """Retourne (ligne, texte) pour le texte visible, les attributs textuels et les chaînes JS."""
    segs = []
    body = re.sub(r'<style.*?</style>', lambda m: '\n' * m.group(0).count('\n'), s, flags=re.S)
    body = re.sub(r'<!--.*?-->', lambda m: '\n' * m.group(0).count('\n'), body, flags=re.S)
    # scripts : chaînes littérales seulement
    def js_strings(m):
        out = []
        code = re.sub(r'^\s*//.*$', '', m.group(0), flags=re.M)  # commentaires de code ignorés
        code = re.sub(r'console\.(log|warn|error|info|debug)\([^;]{0,400}?\)', '', code, flags=re.S)  # logs : jamais affichés
        code = re.sub(r'new Error\([^;]{0,200}?\)', '', code, flags=re.S)  # messages d'exception internes
        for q in re.finditer(r"(['\"`])((?:\\.|(?!\1).)*)\1", code):
            v = q.group(2)
            if len(v) >= 6 and re.search(r'[a-zA-Zàéèëïöü]{3,}\s+[a-zA-Zàéèëïöü]{2,}', v) and not re.match(r'^[\w./:#?=&%+-]+$', v):
                out.append('JS:' + v)
        return '\n' + '\n'.join(out) + '\n' * (m.group(0).count('\n') - len(out))
    body = re.sub(r'<script.*?</script>', js_strings, body, flags=re.S)
    # attributs textuels
    for m in re.finditer(r'\b(title|alt|placeholder|aria-label|content|data-label)="([^"]{4,})"', body):  # value= exclu : valeurs backend canoniques FR
        if m.group(1) == 'content' and re.match(r'^[\w./:#?=&%+, -]+$', m.group(2)) and 'adermio' in m.group(2).lower():
            continue
        segs.append((body[:m.start()].count('\n') + 1, 'ATTR:' + htmlmod.unescape(m.group(2))))
    # texte visible
    text = re.sub(r'<[^>]+>', ' ', body)
    for ln, line in enumerate(text.split('\n'), 1):
        t = htmlmod.unescape(line).strip()
        if len(t) >= 3:
            segs.append((ln, t))
    return segs

# pages dont des segments sont légitimement identiques au FR (références bibliographiques)
SAME_OK_PAGES = {'nl/bronnen.html'}

CSS_ISH = re.compile(r'\b\d+(\.\d+)?(s|ms|px|rem|em|vh|vw)\b|\b(ease|infinite|linear|alternate|translate|opacity)\b'
                     r'|\b(flex|grid|items|justify|gap|mb|mt|px|py|text|bg|border|rounded|hover|w|h)-')

def is_human_text(seg):
    """Écarte ce qui n'est pas une phrase destinée au lecteur : attributs techniques, classes CSS,
    gabarits JS, messages console anglais. Sinon le test « identique au FR » crie pour rien."""
    if seg.startswith('ATTR:') and not re.match(r'ATTR:[A-ZÀ-Ý]', seg): return False
    if re.search(r'\$\{|\bfunction\b|=>|\\u[0-9a-f]{4}|[{}=;]|\bclass=', seg): return False
    if CSS_ISH.search(seg) or seg.startswith(('flex ', 'grid ', 'absolute ', 'relative ')): return False
    return bool(re.search(r'[A-Za-zÀ-ÿ]{3}', seg))

SAME_OK = {'Adermio © 2026', '© 2026 Adermio.',
           'Adermio AI Core™', 'Adermio © 2025'}  # marques et mentions identiques dans les deux langues

# chaînes JS jamais affichées (clés/labels backend en FR canonique), acceptées page par page
BACKEND_FR = {'autour de la bouche', 'Aucune zone spécifique', 'Manque de sommeil', 'Rien de particulier',
              'Changement de produits', 'Stress élevé', 'Cycle hormonal / Règles', 'Alimentation / Excès',
              'Transpiration (sport)', 'Frottements / Rasage'}  # valeurs postées au webhook : restent en FR
BRANDS = {'The INKEY List', 'La Roche-Posay', "Paula's Choice", 'The Ordinary'}
ALLOW = {'nl/form.html': BACKEND_FR | BRANDS,
         'nl/premium.html': BRANDS, 'nl/bilan.html': BRANDS, 'nl/second-cycle.html': BRANDS}

def check(nl_rel):
    fr_rel = [k for k, v in PAGES.items() if v[0] == nl_rel][0]
    fr = open(os.path.join(ROOT, fr_rel), encoding='utf-8').read()
    nl = open(os.path.join(ROOT, nl_rel), encoding='utf-8').read()
    issues = []
    ta, tb = tags(strip_selector(fr)), tags(strip_selector(nl))
    if ta != tb:
        import difflib
        added, removed = [], []
        for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, ta, tb, autojunk=False).get_opcodes():
            if op in ('insert', 'replace'): added += tb[j1:j2]
            if op in ('delete', 'replace'): removed += ta[i1:i2]
        if removed or sorted(added) != sorted(STRUCT_ALLOWED.get(nl_rel, [])):
            issues.append(f'STRUCTURE: {len(ta)} balises FR vs {len(tb)} NL (ajouts {added}, retraits {removed})')
    if '<html lang="nl"' not in nl: issues.append('lang != nl')
    if re.search(r'\slang="fr"', nl): issues.append('lang="fr" résiduel')
    for m in re.finditer(r'href="([^"]+)"', nl):
        h = m.group(1)
        if re.match(r'^/(en|es|it|de)/', h) or re.search(r'adermio\.com/(es|en|it|de)/', h):
            line = nl[:m.start()].count('\n') + 1
            ctx = nl.split('\n')[line - 1]
            if 'hreflang' not in ctx and 'flagcdn' not in nl.split('\n')[line]:
                issues.append(f'L{line}: lien autre langue {h}')
        if h.startswith('/') and not h.startswith('//') and '?' not in h and '#' not in h:
            p = h.lstrip('/')
            cand = [os.path.join(ROOT, p), os.path.join(ROOT, p + '.html'), os.path.join(ROOT, p, 'index.html')]
            if p and not any(os.path.exists(c) for c in cand) and not p.startswith(('js/', 'style', 'favicon', 'apple', 'site.web', 'logo', 'android')):
                issues.append(f'L{nl[:m.start()].count(chr(10))+1}: lien interne cassé {h}')
    for m in re.finditer(r'https://adermio\.com/(nl/[\w/-]+)', nl):
        p = m.group(1)
        if not any(os.path.exists(os.path.join(ROOT, c)) for c in (p + '.html', p + '/index.html')):
            issues.append(f'L{nl[:m.start()].count(chr(10))+1}: lien /nl/ cassé {p}')
    # sélecteur de langue : Français -> page FR, English/Español/Italiano/Deutsch -> jumeaux
    i = nl.find('<div class="lang-dropdown')
    if i >= 0:
        blk = nl[i:i + 3600]
        fr_expected = 'https://adermio.com/' + ('' if fr_rel == 'index.html' else re.sub(r'/index$', '', re.sub(r'\.html$', '', fr_rel)))
        m_fr = re.search(r'<a href="([^"]+)"[^>]*>\s*<img src="https://flagcdn.com/fr.svg', blk)
        if not m_fr or m_fr.group(1) != fr_expected:
            issues.append(f'sélecteur : lien Français = {m_fr.group(1) if m_fr else None!r}, attendu {fr_expected!r}')
        _, en_twin, es_twin, it_twin, de_twin = PAGES[fr_rel]
        for flag, twin in (('us', en_twin), ('es', es_twin), ('it', it_twin), ('de', de_twin)):
            m_ = re.search(r'<a href="([^"]+)"[^>]*>\s*<img src="https://flagcdn.com/' + flag + '.svg', blk)
            if not m_ or m_.group(1) != 'https://adermio.com/' + twin:
                issues.append(f'sélecteur : lien {flag} = {m_.group(1) if m_ else None!r}, attendu /{twin}')
            elif not os.path.exists(os.path.join(ROOT, twin + '.html')) and not os.path.exists(os.path.join(ROOT, twin, 'index.html')):
                issues.append(f'sélecteur : jumeau {twin} inexistant')
    hits = []
    allow = ALLOW.get(nl_rel, set())
    # (a) mots-outils français (attrape les phrases à moitié traduites)
    for ln, t in visible_segments(nl):
        if t.replace('JS:', '') in allow: continue
        if STRONG.search(t) or len(FR_RE.findall(t)) >= 3:
            hits.append((ln, 'FR : ' + t[:100]))
        elif is_human_text(t.replace('JS:', '').strip()) and (mm := has_fr_morphology(t)):
            hits.append((ln, f'morphologie FR ({mm}) : ' + t[:90]))
    # (b) segment visible resté IDENTIQUE au FR : le test qui attrape tout le reste
    fr_segs = {t.replace('JS:', '').strip() for _, t in visible_segments(fr)}
    for ln, t in visible_segments(nl):
        seg = t.replace('JS:', '').strip()
        if seg in allow or seg in SAME_OK or nl_rel in SAME_OK_PAGES: continue
        if not is_human_text(seg): continue
        if len(seg.split()) >= 3 and seg in fr_segs:
            hits.append((ln, 'IDENTIQUE AU FR: ' + seg[:90]))
    # (c) registre, vocabulaire interdit, anglais, allemand
    for ln, t in visible_segments(nl):
        seg = t.replace('JS:', '').replace('ATTR:', '')
        if not is_human_text(seg): continue
        if (mm := U_RE.search(seg)) and nl_rel not in SAME_OK_PAGES:
            hits.append((ln, f'VOUVOIEMENT ({mm.group(0)}) : ' + seg[:90]))
        if (mm := BANNED_RE.search(seg)) and not (nl_rel in SAME_OK_PAGES and len(EN_REF.findall(seg)) >= 2):  # titres d'études anglais
            hits.append((ln, f'VOCABULAIRE INTERDIT ({mm.group(0)}) : ' + seg[:90]))
        if nl_rel in SAME_OK_PAGES: continue  # références scientifiques en anglais
        if len(EN_RE.findall(seg)) >= 2 and not any(b in seg for b in BRANDS):
            hits.append((ln, 'ANGLAIS ? : ' + seg[:90]))
        if (mm := DE_RE.search(seg)):
            hits.append((ln, f'ALLEMAND ? ({mm.group(0)}) : ' + seg[:90]))
        if (mm := STYLE_RE.search(seg)):
            hits.append((ln, f'GLOSSAIRE ({mm.group(0)}) : ' + seg[:90]))
        if (mm := DERMA_RE.search(seg)):
            hits.append((ln, f'DERMATOLOOG = ADERMIO ? ({mm.group(0)[:40]}) : ' + seg[:90]))
        if (mm := JDAY_RE.search(seg)):
            hits.append((ln, f'TYPO FR ({mm.group(0)}) : ' + seg[:90]))
        if seg.strip() in ('Matig', 'matig'):
            hits.append((ln, 'BADGE « Matig » SEUL (= médiocre) : ' + seg[:90]))
        if t.startswith(('JS:', 'ATTR:')) and SPACE_PUNCT_RE.search(seg):
            hits.append((ln, 'ESPACE AVANT PONCTUATION (JS/attribut) : ' + seg[:90]))
    hits += typo_hits(nl)
    return issues, hits

if __name__ == '__main__':
    targets = sys.argv[1:] or [v[0] for v in PAGES.values()]
    total = 0
    for nl_rel in targets:
        issues, hits = check(nl_rel)
        status = 'OK' if not issues and not hits else 'XX'
        print(f'{status} {nl_rel}  issues={len(issues)} résidus={len(hits)}')
        for i in issues[:10]: print('     ', i)
        for ln, t in hits[:12]: print(f'      L{ln}: {t}')
        if len(hits) > 12: print(f'      ... +{len(hits)-12}')
        total += len(issues) + len(hits)
    sys.exit(1 if total else 0)
