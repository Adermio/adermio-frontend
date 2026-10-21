#!/usr/bin/env python3
"""Contrôle qualité des pages portugaises (Portugal) — dérivé de qa_pl.py.

Pour chaque page PT :
  1. squelette de balises identique au FR (hors sélecteur, hreflang, lien « Résilier »)
  2. aucun lang="fr", aucun lien /en/ /es/ /it/ /de/ /nl/ /el/ /pl/ hors sélecteur/hreflang, liens internes existants
  3. résidus : mots-outils FR/EN/ES, morphologie française, segment sans aucun signe portugais, segment identique au FR,
     portugais écrit SANS accents (« nao », « analise »), lettres polonaises ou grecques (tables semées depuis le polonais)
  4. décisions PDG : portugais du PORTUGAL (aucune forme brésilienne : você, tela, celular, equipe, contato, usuário,
     gérondif « estou fazendo », -ênico/-ômico), vouvoiement neutre (jamais você/tu/teu), possessifs en minuscules hors
     début de phrase, AUCUNE forme genrée adressée à l'utilisateur (Bem-vindo/a, « Está pronta? », o(a), pronto/a)
  5. vocabulaire médical interdit (diagnóstico, paciente, terapia, clínico, curar, tratar), « dermatologista » à côté
     d'Adermio/IA
  6. typographie : espace avant ! ? : ;, guillemets « » sans espace intérieure, J28/Mo, milliers à point, prix
     (l'analyse complète coûte 5,99 € ; jamais zł ni les anciens montants)

Faux positifs : une ligne `CODE<TAB>sous-chaîne<TAB>raison` dans allow_pt.txt (jamais pour INTERDIT/DERMA/IDENT/PRIX/
GREC/PL/BR).

Usage : python3 tests/i18n/pt/qa_pt.py [pt/home.html ...]
"""
import os, re, sys, html as htmlmod
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from prep_pt import PAGES, ROOT, fr_path, pt_path, pt_exists

# ── Détecteurs (unité testée par test_qa_pt.py) ───────────────────────────────────────────────
WORD = r"[A-Za-zÀ-ÿ]"
# Forme genrée adressée au lecteur : accueil, appel, graphies doubles, « Está pronta? » (verbe en tête = le lecteur)
GENRE_RE = re.compile(r"\b(Bem-vind[oa]s?|Car[oa]|Prezad[oa]s?|Querid[oa]s?)\b|\b\w+[oa]\((a|o|as|os)\)|\b\w+[oa]s?/[ao]s?\b(?!\d)"
                      r"|(?:^|[.!?]\s+|[>:]\s*)(?:Já\s+)?(Está|Estará|Esteja|Fica|Ficará|Fique|Sente-se|Sinta-se|Ficou)\s+(\w+\s+){0,2}?"
                      r"(pront|satisfeit|interessad|preparad|registad|convencid|surpreendid|cansad|preocupad|habituad)[oa]s?\b")
REGISTRE_RE = re.compile(r"\b(você|vocês|Você|Vocês|tu|Tu|teu|tua|teus|tuas|Teu|Tua|contigo|te)\b")
MAJ_WORDS = re.compile(r"\b(Seu|Sua|Seus|Suas)\b")
INTERDIT_RE = re.compile(r"(diagnóstic\w*|diagnostic\w*|pacient\w*|terap\w*|clínic\w*|\bcur(a|ar|ará|am|ou)\b|\btrat(a|ar|amos|ará|e)\b(?!-se))", re.I)
DERMA_RE = re.compile(r"\b(IA|Adermio)\b[^.!?]{0,40}\bdermatolog\w*|\bdermatolog\w*[^.!?]{0,20}\b(IA|Adermio)\b")
# Mots-outils français (« que », « mais », « vos » retirés : ce sont aussi des mots portugais)
FR_STRONG = re.compile(r"\b(votre|vous|nous|une|pour|avec|dans|sur|peau|gratuite|merci|cliquez|veuillez|réessayer|erreur|"
                       r"chargement|semaine|semaines|jours|mois|très|sans|avant|après|paiement|résultats|conseils|produits|"
                       r"complète|sévérité|boutons|rougeurs|taches|aux|qui|tout|tous|toutes|autre|autres|"
                       r"cette|ces|mon|leur|leurs|notre|ici|déjà|encore|toujours|aussi|ainsi|puis|donc|selon|chez|depuis|"
                       r"pendant|parmi|afin|lorsque|quand|comment|pourquoi|combien|quel|quels|quelles|est|sont|et)\b", re.I)
EN_RE = re.compile(r"\b(the|your|you|and|with|this|that|our|free|skin|analysis|report|please|click|here|now|today)\b", re.I)
ES_RE = re.compile(r"\b(usted|ustedes|piel|también|ahora|gracias|muy|una|los|las|del|y|el|con|pero|hoy|aquí|cuando|hasta|análisis gratuito)\b")
MORPHO_RE = re.compile(r"\b(\w{4,}ement|\w{3,}eux|ci-dessous|ci-dessus|formulaire|veuillez)\b", re.I)
MORPHO_OK = {'element', 'suplement', 'temperament', 'fundament', 'management', 'engagement',
             'treatment', 'development', 'assessment', 'improvement'}
PT_SIGNAL = re.compile(r"[ãõçáéíóúâêôà]|\b(e|o|a|os|as|de|do|da|dos|das|em|no|na|nos|nas|um|uma|para|com|por|que|não|se|"
                       r"ao|aos|é|seu|sua|mais|como|ou|mas|pele|até)\b", re.I)
# Portugais du Brésil (lexique, gérondif progressif, accent circonflexe de -ênico/-ômico)
BR_RE = re.compile(r"\b(tela|telas|celular|celulares|equipe|equipes|contato|contatos|registro|registros|cadastr\w*|usuári\w*|"
                   r"arquivo|arquivos|baixar|aplicativo\w*|acess(ar|e|em|ou)|estresse|esporte\w*|espinhas?|cravos|cisto\w*|"
                   r"maquiagem|banheiro|planej\w*|Oi|tchau|ônibus|de fato|recepção|café da manhã)\b"
                   r"|\b(est(ou|á|ás|amos|ão|ava|avam|eja|ar|ará)|fic(a|ar|ou|ará)|continu(a|e|ar|ará)|and(a|ar))\s+\w+(ando|endo|indo)\b"
                   r"|\b\w*[êô][mn][aeiouáéíóú]\w*", re.I)
# Portugais tapé sans accents (mots qui n'existent pas sous cette forme)
ASCII_RE = re.compile(r"\b(nao|analise|analises|tambem|sao|apos|informacao|informacoes|acao|acoes|saude|agua|ja|relatorio|"
                      r"relatorios|sensivel|facil|area|areas|unico|unica|proximo|proxima|codigo|numero|pagina|politica|"
                      r"utilizacao|subscricao|condicoes|protecao|gratis|voce)\b", re.I)
GREC_RE = re.compile(r"[Α-Ωα-ωάέήίόύώ]")
PL_RE = re.compile(r"[ąćęłńśźżĄĆĘŁŃŚŹŻ]|\bzł\b|\b(twoj\w*|Twoj\w*|skór\w*|się|jest|oraz)\b")
PRIX_RE = re.compile(r"zł|\d+\.\d\d\s?€|€\s?\d|\$\s?\d|\b(4,99|6,99|24,99)\b")
TYPO_RE = re.compile(r"\bJ\+?\d{1,3}\b|\b\d+\s?Mo\b|\b\d{1,3}\.\d{3}\b")
GUILL_RE = re.compile(r"„|«[   ]|[   ]»")
ESPACE_RE = re.compile(r"[\wÀ-ž%)”’»]\s*[   ]+[!?;:](?=\s|$|[“\"’<)„”»])")
NEVER_ALLOW = {'INTERDIT', 'DERMA', 'IDENT', 'PRIX', 'GREC', 'PL', 'BR'}

SAME_OK_PAGES = {'pt/fontes.html'}   # références bibliographiques (titres d'études en anglais)

def _load_allow():
    out = []
    p = os.path.join(HERE, 'allow_pt.txt')
    if not os.path.exists(p): return out
    for n, line in enumerate(open(p, encoding='utf-8'), 1):
        line = line.rstrip('\n')
        if not line.strip() or line.startswith('#'): continue
        parts = line.split('\t')
        if len(parts) < 3 or not parts[2].strip():
            raise SystemExit(f'allow_pt.txt L{n} : format CODE<TAB>sous-chaîne<TAB>raison attendu')
        if parts[0] in NEVER_ALLOW:
            raise SystemExit(f'allow_pt.txt L{n} : le code {parts[0]} ne peut pas être autorisé')
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
    s = re.sub(r'https?://\S+|[\w.+-]+@[\w.-]+|\b[\w-]+\.(com|fr|pt|html)\b', ' ', seg)
    for code, rx in (('GENRE', GENRE_RE), ('REGISTRE', REGISTRE_RE), ('BR', BR_RE)):
        if (m := rx.search(s)): hits.append((code, m.group(0)))
    if (w := maj_hits(s)): hits.append(('MAJ', w[0]))
    if not ref and (m := INTERDIT_RE.search(s)): hits.append(('INTERDIT', m.group(0)))
    if DERMA_RE.search(re.sub(r'\s*[—–|-]\s*Adermio\s*$', '', s)): hits.append(('DERMA', 'dermatolog = Adermio ?'))
    if not ref:
        fr = FR_STRONG.findall(s)
        if len(fr) >= 2 or (fr and not PT_SIGNAL.search(s)): hits.append(('FR', ','.join(fr[:4])))
        en = EN_RE.findall(s)
        if len(en) >= 2: hits.append(('EN', ','.join(en[:4])))
        es = ES_RE.findall(s)
        if len(es) >= 2: hits.append(('ES', ','.join(es[:4])))
        mo = [m.group(0) for m in MORPHO_RE.finditer(s) if m.group(0).lower() not in MORPHO_OK]
        if mo: hits.append(('MORPHO', mo[0]))
        words = re.findall(WORD + r"{2,}", s)
        if len(words) >= 5 and not PT_SIGNAL.search(s): hits.append(('PAS_PT', ' '.join(words[:5])))
    for code, rx in (('ASCII', ASCII_RE), ('GREC', GREC_RE), ('PL', PL_RE), ('PRIX', PRIX_RE), ('TYPO', TYPO_RE),
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
    if seg.startswith('ATTR:') and not re.match(r'ATTR:[A-ZÀ-Ý]', seg): return False
    if re.search(r'\$\{|\bfunction\b|=>|\\u[0-9a-f]{4}|[{}=;]|\bclass=', seg) and not re.search(r'[ãõçáéíóúâêô]', seg): return False
    if CSS_ISH.search(seg) or seg.startswith(('flex ', 'grid ', 'absolute ', 'relative ')): return False
    return bool(re.search(WORD + r'{3}', seg))

SAME_OK = {'Adermio © 2026', '© 2026 Adermio.', 'Adermio AI Core™', 'Adermio © 2025'}
# Valeurs postées au webhook en FR canonique (jamais affichées) + marques
BACKEND_FR = {'autour de la bouche', 'Aucune zone spécifique', 'Manque de sommeil', 'Rien de particulier',
              'Changement de produits', 'Stress élevé', 'Cycle hormonal / Règles', 'Alimentation / Excès',
              'Transpiration (sport)', 'Frottements / Rasage'}
BRANDS = {'The INKEY List', 'La Roche-Posay', "Paula's Choice", 'The Ordinary'}
ALLOW = {'pt/form.html': BACKEND_FR | BRANDS, 'pt/premium.html': BRANDS, 'pt/bilan.html': BRANDS, 'pt/second-cycle.html': BRANDS}

def check(pl_rel):
    fr_rel = [k for k, v in PAGES.items() if v[0] == pl_rel][0]
    fr = open(fr_path(fr_rel), encoding='utf-8').read()
    pl = open(pt_path(pl_rel), encoding='utf-8').read()
    issues = []
    ta, tb = tags(strip_selector(fr)), tags(strip_selector(pl))
    if ta != tb:
        import difflib
        added, removed = [], []
        for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, ta, tb, autojunk=False).get_opcodes():
            if op in ('insert', 'replace'): added += tb[j1:j2]
            if op in ('delete', 'replace'): removed += ta[i1:i2]
        issues.append(f'STRUCTURE: {len(ta)} balises FR vs {len(tb)} PL (ajouts {added[:8]}, retraits {removed[:8]})')
    if '<html lang="pt-PT"' not in pl: issues.append('lang != pt-PT')
    if re.search(r'\slang="fr"', pl): issues.append('lang="fr" résiduel')
    lines = pl.split('\n')
    for m in re.finditer(r'href="([^"]+)"', pl):
        h = m.group(1)
        line = pl[:m.start()].count('\n') + 1
        if re.match(r'^/(en|es|it|de|nl|el|pl)/', h) or re.search(r'adermio\.com/(es|en|it|de|nl|el|pl)/', h):
            if 'hreflang' not in lines[line - 1] and 'flagcdn' not in lines[line]:
                issues.append(f'L{line}: lien autre langue {h}')
        if h.startswith('/') and not h.startswith('//') and '?' not in h and '#' not in h:
            p = h.lstrip('/')
            cand = [os.path.join(ROOT, p), os.path.join(ROOT, p + '.html'), os.path.join(ROOT, p, 'index.html')]
            if p and not any(os.path.exists(c) for c in cand) and not (p.startswith('pt/') and pt_exists(p)) and not p.startswith(('js/', 'style', 'favicon', 'apple', 'site.web', 'logo', 'android')):
                issues.append(f'L{line}: lien interne cassé {h}')
    for m in re.finditer(r'https://adermio\.com/(pt/[\w/-]+)', pl):
        p = m.group(1)
        if not pt_exists(p):
            issues.append(f'L{pl[:m.start()].count(chr(10))+1}: lien /pt/ cassé {p}')
    i = pl.find('<div class="lang-dropdown')
    if i >= 0:
        blk = pl[i:i + 4800]
        fr_expected = 'https://adermio.com/' + ('' if fr_rel == 'index.html' else re.sub(r'/index$', '', re.sub(r'\.html$', '', fr_rel)))
        m_fr = re.search(r'<a href="([^"]+)"[^>]*>\s*<img src="https://flagcdn.com/fr.svg', blk)
        if not m_fr or m_fr.group(1) != fr_expected:
            issues.append(f'sélecteur : lien Français = {m_fr.group(1) if m_fr else None!r}, attendu {fr_expected!r}')
        _, *twins = PAGES[fr_rel]
        for flag, twin in zip(('us', 'es', 'it', 'de', 'nl', 'gr', 'pl'), twins):
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
