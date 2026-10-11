#!/usr/bin/env python3
"""Contrôle qualité des pages grecques (dérivé de qa_nl.py).

Le grec s'écrit dans un autre alphabet : tout mot LATIN restant dans le texte lu par le visiteur est suspect.
Pour chaque page EL :
  1. squelette de balises identique au FR (hors sélecteur, hreflang, lien « Résilier », style des polices grecques)
  2. aucun lang="fr", aucun lien /en/ /es/ /it/ /de/ /nl/ hors sélecteur/hreflang, liens internes existants
  3. résidus : mot latin de 3 lettres ou plus hors liste blanche (marques, sigles, INCI…), segment identique au FR
  4. registre « εσείς » (décision PDG) : aucun « εσύ / σου / σένα »
  5. vocabulaire médical interdit (διάγνωση, ασθενής, θεραπεία, κλινικός…), « δερματολόγος » à côté d'Adermio/AI
  6. typographie : espace avant ! ; : ? , capitales accentuées (ΌΡΟΙ), J28, prix « € 5,99 »

Usage : python3 tests/i18n/el/qa_el.py [el/home.html ...]
"""
import os, re, sys, html as htmlmod
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prep_el import PAGES, ROOT, GREEK_STYLE

# Mots latins admis dans un texte grec (marques, sigles, termes que les Grecs écrivent en latin).
LATIN_OK = {
    'adermio', 'core', 'app', 'store', 'apple', 'google', 'play', 'android', 'ios', 'iphone', 'stripe', 'tiktok',
    'instagram', 'facebook', 'clarity', 'microsoft', 'vercel', 'amazon', 'aws', 'supabase', 'openai', 'gemini',
    'n8n', 'gmail', 'whatsapp', 'apple pay', 'visa', 'mastercard', 'paypal', 'klarna', 'cookie', 'cookies',
    'spf', 'pdf', 'inci', 'gdpr', 'rgpd', 'url', 'email', 'e-mail', 'blog', 'online', 'premium', 'skincare',
    'the', 'inkey', 'list', 'ordinary', 'roche', 'posay', 'paula', 'choice', 'cerave', 'avène', 'avene', 'bioderma',
    'vichy', 'eucerin', 'nuxe', 'uriage', 'ducray', 'svr', 'caudalie', 'garnier', 'nivea', 'neutrogena',
    'roaccutane', 'isotretinoin', 'pubmed', 'jama', 'jaad', 'bmj', 'dermatology', 'nature', 'lancet',
    'contact', 'adermio.com', 'www', 'https', 'http', 'com', 'sas', 'siren', 'siret', 'rcs', 'tva', 'paris',
    'france', 'cnil', 'dpo', 'cgv', 'cgu', 'gags', 'ia', 'ai', 'ok', 'faq', 'jpg', 'png', 'heic', 'jpeg', 'webp',
    'mo', 'mb', 'kb', 'gb', 'cm', 'ml', 'mg',
}
# Noms propres ajoutés pendant la traduction (prénoms des avis, marques, INCI latins) : un par ligne.
_extra = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'latin_ok.txt')
if os.path.exists(_extra):
    LATIN_OK |= {l.strip().lower() for l in open(_extra, encoding='utf-8') if l.strip() and not l.startswith('#')}
LATIN_WORD = re.compile(r"(?<![\w@./-])[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’-]{2,}(?![\w@/])")
# Registre « εσείς » (décision PDG, 11/10) : le tutoiement est interdit.
TU_RE = re.compile(r"(?<![\w])(εσύ|Εσύ|σου|Σου|σένα|εσένα|Εσένα)(?![\w])")
# Zéro langage médical côté Adermio (règle maison). « αγωγή » (traitement de l'utilisateur) reste permis.
BANNED_RE = re.compile(r"(διάγνωσ\w*|διαγνωσ\w*|διαγνωστικ\w*|ασθεν[ήε]\w*|θεραπε[ίυ]\w*|θεραπευτ\w*|κλινικ\w*|κλινική|(?<![Α-ώ])ίαση\w*)", re.I)
DERMA_RE = re.compile(r"(Adermio|AI|τεχνητή νοημοσύνη)[^.!;·]{0,40}δερματολόγ\w*|δερματολόγ\w*[^.!;·]{0,20}(Adermio|AI)")
JDAY_RE = re.compile(r"\bJ\+?\d{1,3}\b|\b\d+\s?Mo\b")
EURO_BEFORE = re.compile(r"€\s?\d")          # grec : 5,99 € (montant puis espace puis €)
GREEK_WORD = re.compile(r"[Α-Ωα-ωΆΈΉΊΌΎΏάέήίόύώΪΫϊϋΐΰς]+")
def caps_tonos(seg):
    """Mot grec tout en capitales qui porte un accent (faute : ΌΡΟΙ -> ΟΡΟΙ)."""
    for w in GREEK_WORD.findall(seg):
        if len(w) >= 2 and w.upper() == w and any(c in 'ΆΈΉΊΌΎΏ' for c in w): return w
    return None
SPACE_PUNCT_RE = re.compile(r"[\wΑ-ώ%)”’»]\s*[   ]+[!?;:·](?=\s|$|[“\"’<)«»])")

def strip_selector(s):
    s = '\n'.join(l for l in s.split('\n') if 'hreflang=' not in l and 'adermio.com/resilier" class="!text-slate-500' not in l)
    s = s.replace(GREEK_STYLE, '')
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
            if v in ('use strict',): continue  # directive JS
            if len(v) >= 6 and re.search(r'[a-zA-Zà-ÿΑ-ώ]{3,}\s+[a-zA-Zà-ÿΑ-ώ]{2,}', v) and not re.match(r'^[\w./:#?=&%+-]+$', v):
                out.append('JS:' + v)
        return '\n' + '\n'.join(out) + '\n' * (m.group(0).count('\n') - len(out))
    body = re.sub(r'<script.*?</script>', js_strings, body, flags=re.S)
    for m in re.finditer(r'\b(title|alt|placeholder|aria-label|content|data-label)="([^"]{4,})"', body):
        if m.group(1) == 'content' and re.match(r'^[\w./:#?=&%+, -]+$', m.group(2)) and 'adermio' in m.group(2).lower():
            continue
        segs.append((body[:m.start()].count('\n') + 1, 'ATTR:' + htmlmod.unescape(m.group(2))))
    body = re.sub(r'</(strong|b|em|i|span|a|u)>', '', body)  # fin de balise en ligne : pas d'espace (« </strong>: » n'est pas « : » précédé d'une espace)
    text = re.sub(r'<[^>]+>', ' ', body)
    for ln, line in enumerate(text.split('\n'), 1):
        t = htmlmod.unescape(line).strip()
        if len(t) >= 3:
            segs.append((ln, t))
    return segs

CSS_ISH = re.compile(r'\b\d+(\.\d+)?(s|ms|px|rem|em|vh|vw)\b|\b(ease|infinite|linear|alternate|translate|opacity)\b'
                     r'|\b(flex|grid|items|justify|gap|mb|mt|px|py|text|bg|border|rounded|hover|w|h)-')

def is_human_text(seg):
    if seg.startswith('ATTR:') and not re.match(r'ATTR:[A-ZÀ-ÝΑ-ΩΆΈΉΊΌΎΏ]', seg): return False
    if re.search(r'\$\{|\bfunction\b|=>|\\u[0-9a-f]{4}|[{}=;]|\bclass=', seg) and not re.search(r'[Α-ώ]{3}', seg): return False
    if CSS_ISH.search(seg) or seg.startswith(('flex ', 'grid ', 'absolute ', 'relative ')): return False
    return bool(re.search(r'[A-Za-zÀ-ÿΑ-ώ]{3}', seg))

SAME_OK = {'Adermio © 2026', '© 2026 Adermio.', 'Adermio AI Core™', 'Adermio © 2025'}
SAME_OK_PAGES = {'el/piges.html'}   # références bibliographiques (titres d'études en anglais)
# Valeurs postées au webhook en FR canonique (jamais affichées) + marques
BACKEND_FR = {'autour de la bouche', 'Aucune zone spécifique', 'Manque de sommeil', 'Rien de particulier',
              'Changement de produits', 'Stress élevé', 'Cycle hormonal / Règles', 'Alimentation / Excès',
              'Transpiration (sport)', 'Frottements / Rasage'}
BRANDS = {'The INKEY List', 'La Roche-Posay', "Paula's Choice", 'The Ordinary'}
ALLOW = {'el/form.html': BACKEND_FR | BRANDS, 'el/premium.html': BRANDS, 'el/bilan.html': BRANDS, 'el/second-cycle.html': BRANDS}

FR_HINT = re.compile(r"\b(le|la|les|des|du|une|et|pour|avec|sur|dans|votre|vos|nous|est|sont|chaque|vers|mise à jour|à|où|été|études?)\b", re.I)

def latin_hits(seg):
    seg = re.sub(r'https?://\S+|[\w.+-]+@[\w.-]+|\b[\w-]+\.(com|fr|gr|html)\b', ' ', seg)
    bad = []
    for m in LATIN_WORD.finditer(seg):
        w = m.group(0).strip("'’-")
        if w.lower() in LATIN_OK or w.isupper() and len(w) <= 5: continue
        if any(w in b for b in BRANDS): continue
        bad.append(w)
    return bad

def check(el_rel):
    fr_rel = [k for k, v in PAGES.items() if v[0] == el_rel][0]
    fr = open(os.path.join(ROOT, fr_rel), encoding='utf-8').read()
    el = open(os.path.join(ROOT, el_rel), encoding='utf-8').read()
    issues = []
    ta, tb = tags(strip_selector(fr)), tags(strip_selector(el))
    if ta != tb:
        import difflib
        added, removed = [], []
        for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, ta, tb, autojunk=False).get_opcodes():
            if op in ('insert', 'replace'): added += tb[j1:j2]
            if op in ('delete', 'replace'): removed += ta[i1:i2]
        issues.append(f'STRUCTURE: {len(ta)} balises FR vs {len(tb)} EL (ajouts {added[:8]}, retraits {removed[:8]})')
    if '<html lang="el"' not in el: issues.append('lang != el')
    if re.search(r'\slang="fr"', el): issues.append('lang="fr" résiduel')
    if 'family=DM+Sans' in el: issues.append('lien DM Sans restant (pas de glyphes grecs, lien FR en erreur 400)')
    lines = el.split('\n')
    for m in re.finditer(r'href="([^"]+)"', el):
        h = m.group(1)
        line = el[:m.start()].count('\n') + 1
        if re.match(r'^/(en|es|it|de|nl)/', h) or re.search(r'adermio\.com/(es|en|it|de|nl)/', h):
            if 'hreflang' not in lines[line - 1] and 'flagcdn' not in lines[line]:
                issues.append(f'L{line}: lien autre langue {h}')
        if h.startswith('/') and not h.startswith('//') and '?' not in h and '#' not in h:
            p = h.lstrip('/')
            cand = [os.path.join(ROOT, p), os.path.join(ROOT, p + '.html'), os.path.join(ROOT, p, 'index.html')]
            if p and not any(os.path.exists(c) for c in cand) and not p.startswith(('js/', 'style', 'favicon', 'apple', 'site.web', 'logo', 'android')):
                issues.append(f'L{line}: lien interne cassé {h}')
    for m in re.finditer(r'https://adermio\.com/(el/[\w/-]+)', el):
        p = m.group(1)
        if not any(os.path.exists(os.path.join(ROOT, c)) for c in (p + '.html', p + '/index.html')):
            issues.append(f'L{el[:m.start()].count(chr(10))+1}: lien /el/ cassé {p}')
    i = el.find('<div class="lang-dropdown')
    if i >= 0:
        blk = el[i:i + 4200]
        fr_expected = 'https://adermio.com/' + ('' if fr_rel == 'index.html' else re.sub(r'/index$', '', re.sub(r'\.html$', '', fr_rel)))
        m_fr = re.search(r'<a href="([^"]+)"[^>]*>\s*<img src="https://flagcdn.com/fr.svg', blk)
        if not m_fr or m_fr.group(1) != fr_expected:
            issues.append(f'sélecteur : lien Français = {m_fr.group(1) if m_fr else None!r}, attendu {fr_expected!r}')
        _, *twins = PAGES[fr_rel]
        for flag, twin in zip(('us', 'es', 'it', 'de', 'nl'), twins):
            m_ = re.search(r'<a href="([^"]+)"[^>]*>\s*<img src="https://flagcdn.com/' + flag + '.svg', blk)
            if not m_ or m_.group(1) != 'https://adermio.com/' + twin:
                issues.append(f'sélecteur : lien {flag} = {m_.group(1) if m_ else None!r}, attendu /{twin}')
            elif not os.path.exists(os.path.join(ROOT, twin + '.html')) and not os.path.exists(os.path.join(ROOT, twin, 'index.html')):
                issues.append(f'sélecteur : jumeau {twin} inexistant')
    hits = []
    allow = ALLOW.get(el_rel, set())
    fr_segs = {t.replace('JS:', '').strip() for _, t in visible_segments(fr)}
    for ln, t in visible_segments(el):
        seg = t.replace('JS:', '').replace('ATTR:', '').strip()
        if seg in allow or seg in SAME_OK: continue
        if not is_human_text(t.replace('JS:', '').strip()): continue
        ref = el_rel in SAME_OK_PAGES
        if ref and FR_HINT.search(seg):  # page des sources : titres d'études anglais admis, français non
            hits.append((ln, 'FR (page des sources) : ' + seg[:90]))
        if not ref and (bad := latin_hits(seg)):
            hits.append((ln, f'LATIN {bad[:4]} : ' + seg[:90]))
        elif not ref and len(seg.split()) >= 3 and seg in fr_segs:
            hits.append((ln, 'IDENTIQUE AU FR: ' + seg[:90]))
        if (mm := TU_RE.search(seg)):
            hits.append((ln, f'TUTOIEMENT ({mm.group(0)}) : ' + seg[:90]))
        if (mm := BANNED_RE.search(seg)) and not ref:
            hits.append((ln, f'VOCABULAIRE INTERDIT ({mm.group(0)}) : ' + seg[:90]))
        if (mm := DERMA_RE.search(re.sub(r'\s*[—–|-]\s*Adermio\s*$', '', seg))):
            hits.append((ln, f'DERMATOLOGUE = ADERMIO ? : ' + seg[:90]))
        if (mm := JDAY_RE.search(seg)):
            hits.append((ln, f'TYPO FR ({mm.group(0)}) : ' + seg[:90]))
        if EURO_BEFORE.search(seg):
            hits.append((ln, 'PRIX « € 5,99 » (grec : 5,99 €) : ' + seg[:90]))
        if (w := caps_tonos(seg)):
            hits.append((ln, f'CAPITALES ACCENTUÉES ({w}) : ' + seg[:90]))
        if SPACE_PUNCT_RE.search(seg):
            hits.append((ln, 'ESPACE AVANT PONCTUATION : ' + seg[:90]))
    return issues, hits

if __name__ == '__main__':
    targets = sys.argv[1:] or [v[0] for v in PAGES.values()]
    total = 0
    for el_rel in targets:
        issues, hits = check(el_rel)
        status = 'OK' if not issues and not hits else 'XX'
        print(f'{status} {el_rel}  issues={len(issues)} résidus={len(hits)}')
        for i in issues[:10]: print('     ', i)
        for ln, t in hits[:12]: print(f'      L{ln}: {t}')
        if len(hits) > 12: print(f'      ... +{len(hits)-12}')
        total += len(issues) + len(hits)
    sys.exit(1 if total else 0)
