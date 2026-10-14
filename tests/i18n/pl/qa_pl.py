#!/usr/bin/env python3
"""Contrôle qualité des pages polonaises (dérivé de qa_el.py ; détecteurs de résidus inspirés de qa_nl.py).

Le polonais s'écrit en alphabet latin : on ne peut pas chasser « tout mot latin » comme en grec. Pour chaque page PL :
  1. squelette de balises identique au FR (hors sélecteur, hreflang, lien « Résilier »)
  2. aucun lang="fr", aucun lien /en/ /es/ /it/ /de/ /nl/ /el/ hors sélecteur/hreflang, liens internes existants
  3. résidus : mots-outils FR/EN/DE, morphologie française, segment sans aucun signe polonais, segment identique au FR,
     polonais écrit SANS diacritiques (« skora », « sie »), lettres grecques (tables semées depuis le grec)
  4. décisions PDG : registre « ty » (jamais Pan/Pani/Państwo), possessifs en minuscules hors début de phrase,
     AUCUNE forme genrée adressée à l'utilisateur (-łaś/-łeś/-łabyś/-łbyś, « jesteś gotowa », Drogi/Droga)
  5. vocabulaire médical interdit (diagnoza, pacjent, terapia, kliniczny, leczy…), « dermatolog » à côté d'Adermio/AI
  6. typographie : espace avant ! ? : ;, guillemets « » (polonais : „…”), J28/Mo, milliers à point, prix en euros
     ou à l'ancien montant (l'analyse complète coûte 24,99 zł)

Faux positifs : une ligne `CODE<TAB>sous-chaîne<TAB>raison` dans allow_pl.txt (jamais pour INTERDIT/DERMA/IDENT/PRIX/GREC).

Usage : python3 tests/i18n/pl/qa_pl.py [pl/home.html ...]
"""
import os, re, sys, html as htmlmod
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from prep_pl import PAGES, ROOT

# ── Détecteurs (unité testée par test_qa_pl.py) ───────────────────────────────────────────────
WORD = r"[A-Za-zÀ-ÿĄąĆćĘęŁłŃńÓóŚśŹźŻż]"
# 2e personne au passé / conditionnel = marque le genre de l'utilisateur
GENRE_RE = re.compile(r"\b\w+(łaś|łeś|łabyś|łbyś)\b|\b\w+ł\(a\)ś(?!\w)|\b\w+(łeś/aś|łaś/eś)\b")
# attribut genré SEULEMENT après un verbe à la 2e personne (« bilans jest gotowy » reste permis) ; formules d'appel
ADJ_RE = re.compile(r"(?i:\b(jesteś|będziesz|bądź|(po)?czujesz się|zostaniesz|stajesz się|staniesz się)\s+(\w+\s+){0,2}?"
                    r"(gotow|zadowolon|zainteresowan|zmęczon|przekonan|zaskoczon|zalogowan|zarejestrowan|uprawnion|"
                    r"zobowiązan|zmuszon|świadom|pewn|ciekaw|sam)(a|y)\b)|\b(Drog[ia]|Szanown[ay]|Kochan[ay])\b")
REGISTRE_RE = re.compile(r"\b(Pan|Pani|Pana|Panią|Panu|Państwo|Państwa|Państwu)\b")
MAJ_WORDS = re.compile(r"\b(Twój|Twoja|Twoje|Twojego|Twojej|Twoim|Twoją|Twoich|Twoimi|Ciebie|Cię|Tobie|Tobą)\b")
INTERDIT_RE = re.compile(r"(diagnoz\w*|diagnost\w*|pacjent\w*|terapi\w*|terapeut\w*|klinicz\w*|klinik\w*|wylecz\w*|leczy\w*|lecznicz\w*)", re.I)
DERMA_RE = re.compile(r"\b(AI|Adermio)\b[^.!?]{0,40}\bdermatolog\w*|\bdermatolog\w*[^.!?]{0,20}\b(AI|Adermio)\b")
# Mots-outils français (« nos » retiré : polonais « nos » = nez)
FR_STRONG = re.compile(r"\b(votre|vos|vous|nous|une|pour|avec|dans|sur|peau|gratuite|merci|cliquez|veuillez|réessayer|erreur|"
                       r"chargement|semaine|semaines|jours|mois|très|sans|avant|après|paiement|résultats|conseils|produits|"
                       r"complète|sévérité|boutons|rougeurs|taches|cicatrices|aux|qui|que|mais|tout|tous|toutes|autre|autres|"
                       r"cette|ces|mon|leur|leurs|notre|ici|déjà|encore|toujours|aussi|ainsi|puis|donc|selon|chez|depuis|"
                       r"pendant|parmi|afin|lorsque|quand|comment|pourquoi|combien|quel|quels|quelles|est|sont|et)\b", re.I)
EN_RE = re.compile(r"\b(the|your|you|and|with|for|this|that|our|free|skin|analysis|report|please|click|here|now|today)\b", re.I)
DE_RE = re.compile(r"\b(und|nicht|Sie|Ihre?|Ihnen|für|über|sind|auch|ist|eine|einen|wir|uns|oder|Haut|jetzt|kostenlose?|bitte)\b")
MORPHO_RE = re.compile(r"\b(\w{3,}ez|\w{4,}ement|\w{3,}eux|ci-dessous|ci-dessus|formulaire|veuillez)\b", re.I)
MORPHO_OK = {'przez', 'poprzez', 'element', 'suplement', 'temperament', 'fundament', 'management', 'engagement',
             'treatment', 'development', 'assessment', 'improvement'}
PL_SIGNAL = re.compile(r"[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]|\b(i|w|z|na|do|się|nie|jest|to|że|aby|oraz|dla|po|od|jak|czy|co|o|a|ale|lub|"
                       r"ze|przez|bez|pod|przy|ten|ta|te|są|tak|twoja|twoje|twój|masz|jesteś)\b", re.I)
# Polonais tapé sans diacritiques (mots qui n'existent pas sous cette forme)
ASCII_RE = re.compile(r"\b(sie|skora|skory|skore|skorze|tradzik\w*|moze|mozesz|wiecej|juz|takze|rowniez|byc|ktor\w+|dzieki|"
                      r"prosze|zdjecie|zdjecia|zdjec|bedzie|bedziesz|wazne|jesli|zrob|wyslij|tlust\w*)\b", re.I)
GREC_RE = re.compile(r"[Α-Ωα-ωάέήίόύώ]")
PRIX_RE = re.compile(r"\d,\d\d\s?€|€\s?\d|\b(5,99|4,99|6,99)\b|\d+\.\d\d\s?zł|zł\s?\d|\d,\d\dzł")
TYPO_RE = re.compile(r"\bJ\+?\d{1,3}\b|\b\d+\s?Mo\b|\b\d{1,3}\.\d{3}\b")
GUILL_RE = re.compile(r"[«»]")
ESPACE_RE = re.compile(r"[\wÀ-ž%)”’]\s*[ \u00a0\u202f]+[!?;:](?=\s|$|[“\"’<)„”])")
NEVER_ALLOW = {'INTERDIT', 'DERMA', 'IDENT', 'PRIX', 'GREC'}

SAME_OK_PAGES = {'pl/zrodla.html'}   # références bibliographiques (titres d'études en anglais)

def _load_allow():
    out = []
    p = os.path.join(HERE, 'allow_pl.txt')
    if not os.path.exists(p): return out
    for n, line in enumerate(open(p, encoding='utf-8'), 1):
        line = line.rstrip('\n')
        if not line.strip() or line.startswith('#'): continue
        parts = line.split('\t')
        if len(parts) < 3 or not parts[2].strip():
            raise SystemExit(f'allow_pl.txt L{n} : format CODE<TAB>sous-chaîne<TAB>raison attendu')
        if parts[0] in NEVER_ALLOW:
            raise SystemExit(f'allow_pl.txt L{n} : le code {parts[0]} ne peut pas être autorisé')
        out.append((parts[0], parts[1]))
    return out
ALLOW_LINES = _load_allow()

def allowed(code, seg, page):
    return any(c == code and sub in seg for c, sub in ALLOW_LINES)

def maj_hits(seg):
    out = []
    for m in MAJ_WORDS.finditer(seg):
        before = seg[:m.start()].rstrip()
        if before and before[-1] not in '.!?:„"«(—–-•✓✔>':
            out.append(m.group(0))
    return out

def segment_hits(seg, page):
    """Défauts d'un segment de texte visible : liste de (code, extrait)."""
    hits = []
    ref = page in SAME_OK_PAGES
    s = re.sub(r'https?://\S+|[\w.+-]+@[\w.-]+|\b[\w-]+\.(com|fr|pl|html)\b', ' ', seg)
    for code, rx in (('GENRE', GENRE_RE), ('ADJ', ADJ_RE), ('REGISTRE', REGISTRE_RE)):
        if (m := rx.search(s)): hits.append((code, m.group(0)))
    if (w := maj_hits(s)): hits.append(('MAJ', w[0]))
    if not ref and (m := INTERDIT_RE.search(s)): hits.append(('INTERDIT', m.group(0)))
    if DERMA_RE.search(re.sub(r'\s*[—–|-]\s*Adermio\s*$', '', s)): hits.append(('DERMA', 'dermatolog = Adermio ?'))
    if not ref:
        fr = FR_STRONG.findall(s)
        if len(fr) >= 2 or (fr and not PL_SIGNAL.search(s)): hits.append(('FR', ','.join(fr[:4])))
        en = EN_RE.findall(s)
        if len(en) >= 2: hits.append(('EN', ','.join(en[:4])))
        de = DE_RE.findall(s)
        if len(de) >= 2: hits.append(('DE', ','.join(de[:4])))
        mo = [m.group(0) for m in MORPHO_RE.finditer(s) if m.group(0).lower() not in MORPHO_OK]
        if mo: hits.append(('MORPHO', mo[0]))
        words = re.findall(WORD + r"{2,}", s)
        if len(words) >= 5 and not PL_SIGNAL.search(s): hits.append(('PAS_PL', ' '.join(words[:5])))
    for code, rx in (('ASCII', ASCII_RE), ('GREC', GREC_RE), ('PRIX', PRIX_RE), ('TYPO', TYPO_RE),
                     ('GUILL', GUILL_RE), ('ESPACE', ESPACE_RE)):
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
    if seg.startswith('ATTR:') and not re.match(r'ATTR:[A-ZÀ-ÝĄĆĘŁŃÓŚŹŻ]', seg): return False
    if re.search(r'\$\{|\bfunction\b|=>|\\u[0-9a-f]{4}|[{}=;]|\bclass=', seg) and not re.search(r'[ąćęłńóśźż]', seg): return False
    if CSS_ISH.search(seg) or seg.startswith(('flex ', 'grid ', 'absolute ', 'relative ')): return False
    return bool(re.search(WORD + r'{3}', seg))

SAME_OK = {'Adermio © 2026', '© 2026 Adermio.', 'Adermio AI Core™', 'Adermio © 2025'}
# Valeurs postées au webhook en FR canonique (jamais affichées) + marques
BACKEND_FR = {'autour de la bouche', 'Aucune zone spécifique', 'Manque de sommeil', 'Rien de particulier',
              'Changement de produits', 'Stress élevé', 'Cycle hormonal / Règles', 'Alimentation / Excès',
              'Transpiration (sport)', 'Frottements / Rasage'}
BRANDS = {'The INKEY List', 'La Roche-Posay', "Paula's Choice", 'The Ordinary'}
ALLOW = {'pl/form.html': BACKEND_FR | BRANDS, 'pl/premium.html': BRANDS, 'pl/bilan.html': BRANDS, 'pl/second-cycle.html': BRANDS}

def check(pl_rel):
    fr_rel = [k for k, v in PAGES.items() if v[0] == pl_rel][0]
    fr = open(os.path.join(ROOT, fr_rel), encoding='utf-8').read()
    pl = open(os.path.join(ROOT, pl_rel), encoding='utf-8').read()
    issues = []
    ta, tb = tags(strip_selector(fr)), tags(strip_selector(pl))
    if ta != tb:
        import difflib
        added, removed = [], []
        for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, ta, tb, autojunk=False).get_opcodes():
            if op in ('insert', 'replace'): added += tb[j1:j2]
            if op in ('delete', 'replace'): removed += ta[i1:i2]
        issues.append(f'STRUCTURE: {len(ta)} balises FR vs {len(tb)} PL (ajouts {added[:8]}, retraits {removed[:8]})')
    if '<html lang="pl"' not in pl: issues.append('lang != pl')
    if re.search(r'\slang="fr"', pl): issues.append('lang="fr" résiduel')
    lines = pl.split('\n')
    for m in re.finditer(r'href="([^"]+)"', pl):
        h = m.group(1)
        line = pl[:m.start()].count('\n') + 1
        if re.match(r'^/(en|es|it|de|nl|el)/', h) or re.search(r'adermio\.com/(es|en|it|de|nl|el)/', h):
            if 'hreflang' not in lines[line - 1] and 'flagcdn' not in lines[line]:
                issues.append(f'L{line}: lien autre langue {h}')
        if h.startswith('/') and not h.startswith('//') and '?' not in h and '#' not in h:
            p = h.lstrip('/')
            cand = [os.path.join(ROOT, p), os.path.join(ROOT, p + '.html'), os.path.join(ROOT, p, 'index.html')]
            if p and not any(os.path.exists(c) for c in cand) and not p.startswith(('js/', 'style', 'favicon', 'apple', 'site.web', 'logo', 'android')):
                issues.append(f'L{line}: lien interne cassé {h}')
    for m in re.finditer(r'https://adermio\.com/(pl/[\w/-]+)', pl):
        p = m.group(1)
        if not any(os.path.exists(os.path.join(ROOT, c)) for c in (p + '.html', p + '/index.html')):
            issues.append(f'L{pl[:m.start()].count(chr(10))+1}: lien /pl/ cassé {p}')
    i = pl.find('<div class="lang-dropdown')
    if i >= 0:
        blk = pl[i:i + 4800]
        fr_expected = 'https://adermio.com/' + ('' if fr_rel == 'index.html' else re.sub(r'/index$', '', re.sub(r'\.html$', '', fr_rel)))
        m_fr = re.search(r'<a href="([^"]+)"[^>]*>\s*<img src="https://flagcdn.com/fr.svg', blk)
        if not m_fr or m_fr.group(1) != fr_expected:
            issues.append(f'sélecteur : lien Français = {m_fr.group(1) if m_fr else None!r}, attendu {fr_expected!r}')
        _, *twins = PAGES[fr_rel]
        for flag, twin in zip(('us', 'es', 'it', 'de', 'nl', 'gr'), twins):
            m_ = re.search(r'<a href="([^"]+)"[^>]*>\s*<img src="https://flagcdn.com/' + flag + '.svg', blk)
            if not m_ or m_.group(1) != 'https://adermio.com/' + twin:
                issues.append(f'sélecteur : lien {flag} = {m_.group(1) if m_ else None!r}, attendu /{twin}')
            elif not os.path.exists(os.path.join(ROOT, twin + '.html')) and not os.path.exists(os.path.join(ROOT, twin, 'index.html')):
                issues.append(f'sélecteur : jumeau {twin} inexistant')
    hits = []
    allow = ALLOW.get(pl_rel, set())
    ref = pl_rel in SAME_OK_PAGES
    fr_segs = {t.replace('JS:', '').strip() for _, t in visible_segments(fr)}
    for ln, t in visible_segments(pl):
        seg = t.replace('JS:', '').replace('ATTR:', '').strip()
        if seg in allow or seg in SAME_OK: continue
        if not is_human_text(t.replace('JS:', '').strip()): continue
        for code, ex in segment_hits(seg, pl_rel):
            hits.append((ln, f'{code} ({ex}) : {seg[:90]}'))
        if not ref and len(seg.split()) >= 3 and seg in fr_segs:
            hits.append((ln, 'IDENT (identique au FR) : ' + seg[:90]))
    return issues, hits

if __name__ == '__main__':
    targets = sys.argv[1:] or [v[0] for v in PAGES.values()]
    total = 0
    for pl_rel in targets:
        issues, hits = check(pl_rel)
        status = 'OK' if not issues and not hits else 'XX'
        print(f'{status} {pl_rel}  issues={len(issues)} résidus={len(hits)}')
        for i in issues[:10]: print('     ', i)
        for ln, t in hits[:12]: print(f'      L{ln}: {t}')
        if len(hits) > 12: print(f'      ... +{len(hits)-12}')
        total += len(issues) + len(hits)
    sys.exit(1 if total else 0)
