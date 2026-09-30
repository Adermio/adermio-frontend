#!/usr/bin/env python3
"""Contrôle qualité des pages allemandes (dérivé de qa_it.py).

Pour chaque page DE :
  1. squelette de balises identique au FR (hors bloc sélecteur de langue et hreflang)
  2. aucun lang="fr", aucun lien /es/ ou /en/ hors sélecteur/hreflang
  3. résidus de français dans le texte visible, les attributs textuels et les chaînes JS
  4. liens internes qui pointent vers un fichier existant

Usage : python3 tests/i18n/de/qa_de.py [de/home.html ...]
"""
import os, re, sys, html as htmlmod
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prep_de import PAGES, ROOT

# mots-outils français très fréquents, improbables en italien correct
FR_WORDS = r"\b(votre|vos|vous|nous|les|des|une|est|pour|avec|sur|dans|pas|plus|sont|peau|analyse|gratuit|gratuite|merci|bonjour|cliquez|envoyer|réessayer|erreur|chargement|veuillez|ans|mois|jour|jours|semaine|semaines|et|ou|ce|cette|ces|aux|au|du|de la|qui|que|mais|très|bien|tout|tous|toutes|sans|avant|après|prix|paiement|retour|suivant|précédent|oui|non|autre|autres|votre peau|routine personnalisée|résultats|photos|photo|conseils|produits|dossier|complet|complète|sévérité|boutons|points noirs|rougeurs|taches|cicatrices|pores)\b"
FR_RE = re.compile(FR_WORDS, re.I)
# mots italiens/anglais homographes à ignorer (faux positifs)
IGNORE = {'qui', 'non', 'ou', 'et', 'ce', 'des', 'les', 'pas', 'plus', 'est', 'au', 'du', 'ans', 'photo', 'photos', 'routine', 'ca', 'pores', 'sont'}
# "non" est italien ; "plus", "est", "et" apparaissent dans du code ; on les garde seulement en contexte de phrase
STRONG = re.compile(r"\b(votre|vos|vous|nous|une|pour|avec|dans|sur|peau|gratuite|merci|cliquez|veuillez|réessayer|erreur|chargement|semaine|semaines|jours|mois|très|sans|avant|après|paiement|résultats|conseils|produits|dossier|complète|sévérité|boutons|rougeurs|taches|cicatrices|aux|qui|que|mais|tout|tous|toutes|autre|autres|cette|ces|mon|mes|leur|leurs|notre|nos|ici|déjà|encore|toujours|aussi|ainsi|puis|donc|selon|chez|depuis|pendant|vers|entre|parmi|afin|lorsque|quand|comment|pourquoi|combien|quel|quels|quelles)\b")

# Morphologie impossible en italien : verbes FR en -ez, adverbes en -ement, adjectifs en -eux,
# plus quelques mots de formulaire. Attrape les phrases à MOITIÉ traduites, que les deux autres
# tests laissaient passer (ex. « Remplissez le formulaire ci-dessous » au milieu d'un texte italien).
FR_MORPHO = re.compile(r"\b(\w{3,}ez|\w{4,}ement|\w{3,}eux|ci-dessous|ci-dessus|ci-joint|formulaire|"
                       r"courriel|veuillez|merci d|s'il vous pla)\b", re.I)
FR_MORPHO_OK = {'chez', 'assez', 'nez',
                'management', 'improvement', 'treatment', 'assessment', 'development', 'engagement'}  # anglais en -ement


# Registre « Sie » (décision PDG, cohérente avec « vous » FR) : tutoiement interdit.
DU_RE = re.compile(r"\b([Dd]u|[Dd]ich|[Dd]ir|[Dd]ein(e|en|em|er|es)?)\b")
# Zéro langage médical (règle Adermio) : Adermio n'établit pas de diagnostic, ne soigne pas, n'a pas de patients.
# « klinisch / Klinik » ajoutés le 30/09 (arbitrage PDG : pas de vocabulaire clinique côté Adermio).
BANNED_RE = re.compile(r"\b(Diagnose\w*|diagnostizier\w*|Patient\w*|heil(en|t|ung)\w*|Heilung\w*|Therapie\w*|klinisch\w*|Klinik\w*)\b", re.I)
# Mots anglais fréquents : une phrase anglaise restée dans la page (ex. copiée d'une page EN).
EN_RE = re.compile(r"\b(the|your|you|and|with|for|this|that|our|free|skin|analysis|report|please|click|here)\b")

def has_fr_morphology(seg):
    for m in FR_MORPHO.finditer(seg):
        if m.group(0).lower() not in FR_MORPHO_OK: return m.group(0)
    return None

def strip_selector(s):
    s = '\n'.join(l for l in s.split('\n') if 'hreflang=' not in l)
    i = s.find('<div class="lang-dropdown')
    if i >= 0:
        j = s.find('</div>', i)
        # fin du bloc : compte les div
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
STRUCT_ALLOWED = {
    'de/kontakt.html': ['a', '/a'],   # Impressum obligatoire (§ 5 DDG) : lien ajouté au pied de page (absent du FR contact.html)
}

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
            if len(v) >= 6 and re.search(r'[a-zA-Zàéèìòù]{3,}\s+[a-zA-Zàéèìòù]{2,}', v) and not re.match(r'^[\w./:#?=&%+-]+$', v):
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

# segments légitimement identiques en FR et en IT (marques, mentions, unités)
# pages dont des segments sont légitimement identiques au FR (références bibliographiques)
SAME_OK_PAGES = {'de/quellen.html'}

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
ALLOW = {'de/form.html': BACKEND_FR | BRANDS,
         'de/premium.html': BRANDS, 'de/bilan.html': BRANDS, 'de/second-cycle.html': BRANDS}

def check(it_rel):  # it_rel = chemin de la page DE (nom hérité de qa_it)
    fr_rel = [k for k, v in PAGES.items() if v[0] == it_rel][0]
    fr = open(os.path.join(ROOT, fr_rel), encoding='utf-8').read()
    it = open(os.path.join(ROOT, it_rel), encoding='utf-8').read()
    issues = []
    ta, tb = tags(strip_selector(fr)), tags(strip_selector(it))
    if ta != tb:
        import difflib
        added, removed = [], []
        for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, ta, tb, autojunk=False).get_opcodes():
            if op in ('insert', 'replace'): added += tb[j1:j2]
            if op in ('delete', 'replace'): removed += ta[i1:i2]
        if removed or sorted(added) != sorted(STRUCT_ALLOWED.get(it_rel, [])):
            issues.append(f'STRUCTURE: {len(ta)} balises FR vs {len(tb)} IT (ajouts {added}, retraits {removed})')
    if '<html lang="de"' not in it: issues.append('lang != de')
    if re.search(r'\slang="fr"', it): issues.append('lang="fr" résiduel')
    for m in re.finditer(r'href="([^"]+)"', it):
        h = m.group(1)
        if re.match(r'^/(en|es|it)/', h) or re.search(r'adermio\.com/(es|en|it)/', h):
            line = it[:m.start()].count('\n') + 1
            ctx = it.split('\n')[line - 1]
            if 'hreflang' not in ctx and 'flagcdn' not in it.split('\n')[line]:
                issues.append(f'L{line}: lien autre langue {h}')
        if h.startswith('/') and not h.startswith('//') and '?' not in h and '#' not in h:
            p = h.lstrip('/')
            cand = [os.path.join(ROOT, p), os.path.join(ROOT, p + '.html'), os.path.join(ROOT, p, 'index.html')]
            if p and not any(os.path.exists(c) for c in cand) and not p.startswith(('js/', 'style', 'favicon', 'apple', 'site.web', 'logo', 'android')):
                issues.append(f'L{it[:m.start()].count(chr(10))+1}: lien interne cassé {h}')
    # sélecteur de langue : Français -> page FR, English/Español -> jumeaux
    i = it.find('<div class="lang-dropdown')
    if i >= 0:
        blk = it[i:i + 3000]
        fr_expected = 'https://adermio.com/' + ('' if fr_rel == 'index.html' else re.sub(r'/index$', '', re.sub(r'\.html$', '', fr_rel)))
        m_fr = re.search(r'<a href="([^"]+)"[^>]*>\s*<img src="https://flagcdn.com/fr.svg', blk)
        if not m_fr or m_fr.group(1) != fr_expected:
            issues.append(f'sélecteur : lien Français = {m_fr.group(1) if m_fr else None!r}, attendu {fr_expected!r}')
        _, en_twin, es_twin, it_twin = PAGES[fr_rel]
        for flag, twin in (('us', en_twin), ('es', es_twin), ('it', it_twin)):
            m_ = re.search(r'<a href="([^"]+)"[^>]*>\s*<img src="https://flagcdn.com/' + flag + '.svg', blk)
            if not m_ or m_.group(1) != 'https://adermio.com/' + twin:
                issues.append(f'sélecteur : lien {flag} = {m_.group(1) if m_ else None!r}, attendu /{twin}')
    fr_hits = []
    allow = ALLOW.get(it_rel, set())
    # (a) mots-outils français (attrape les phrases à moitié traduites)
    for ln, t in visible_segments(it):
        if t.replace('JS:', '') in allow: continue
        if STRONG.search(t) or len(FR_RE.findall(t)) >= 3:
            fr_hits.append((ln, t[:100]))
        elif is_human_text(t.replace('JS:', '').strip()) and (mm := has_fr_morphology(t)):
            fr_hits.append((ln, f'morphologie FR ({mm}) : ' + t[:90]))
    # (b) segment visible resté IDENTIQUE au FR : le test qui attrape tout le reste
    #     (une phrase française sans mot-outil de la liste passait sinon inaperçue)
    fr_segs = {t.replace('JS:', '').strip() for _, t in visible_segments(fr)}
    for ln, t in visible_segments(it):
        seg = t.replace('JS:', '').strip()
        if seg in allow or seg in SAME_OK or it_rel in SAME_OK_PAGES: continue
        if not is_human_text(seg): continue
        if len(seg.split()) >= 3 and seg in fr_segs:
            fr_hits.append((ln, 'IDENTIQUE AU FR: ' + seg[:90]))

    # (c) registre « Sie » : aucun tutoiement dans le texte lu par le visiteur
    for ln, t in visible_segments(it):
        seg = t.replace('JS:', '').replace('ATTR:', '')
        if not is_human_text(seg): continue
        if it_rel in SAME_OK_PAGES and not DU_RE.search(seg): continue  # références scientifiques en anglais
        if (mm := DU_RE.search(seg)):
            fr_hits.append((ln, f'TUTOIEMENT ({mm.group(0)}) : ' + seg[:90]))
        if (mm := BANNED_RE.search(seg)):
            fr_hits.append((ln, f'VOCABULAIRE INTERDIT ({mm.group(0)}) : ' + seg[:90]))
        if len(EN_RE.findall(seg)) >= 2 and not any(b in seg for b in BRANDS):
            fr_hits.append((ln, 'ANGLAIS ? : ' + seg[:90]))
    return issues, fr_hits

if __name__ == '__main__':
    targets = sys.argv[1:] or [v[0] for v in PAGES.values()]
    total = 0
    for it_rel in targets:
        issues, fr_hits = check(it_rel)
        status = 'OK' if not issues and not fr_hits else 'XX'
        print(f'{status} {it_rel}  issues={len(issues)} résidus={len(fr_hits)}')
        for i in issues[:10]: print('     ', i)
        for ln, t in fr_hits[:12]: print(f'      L{ln}: {t}')
        if len(fr_hits) > 12: print(f'      ... +{len(fr_hits)-12}')
        total += len(issues) + len(fr_hits)
    sys.exit(1 if total else 0)
