#!/usr/bin/env python3
"""OUVERTURE publique du portugais (/pt/), modèle tests/i18n/pl/expose_pl.py (commit a309b17), adapté au nouveau site
(bascule du 19/10/2026) :
  - pages du nouveau site : menus ajoutés dans les copies adermio-site/v2/** ; hreflang + JSON-LD dans
    output/site-v2/source-v1/seo_prod.json ; puis bascule_v2.py régénère les pages de prod ;
  - pages restées à l'ancien design (processing2, analyse-en-cours-second-cycle, premium, bilan, feedback…) : directement.
Fait :
  1. « Português » dans tous les menus de langues des 8 autres langues (accueil : lang-menu ; pied de page : f-col ;
     formulaires et pages d'attente : lang-dropdown à drapeaux), juste après Polski (sur les pages polonaises, où Polski
     est la langue courante en tête : après Ελληνικά — même ordre que les pages PT). Lien = page PT jumelle, sinon /pt/home.
  2. hreflang « pt » sur les jumelles (FR/EN/ES/IT/DE/NL/EL/PL) qui ont des hreflang (hors pages de résiliation, cachées).
  3. JSON-LD des accueils : Portuguese / pt.
  4. sitemap.xml : URL /pt/ indexables (mêmes pages que le polonais), lastmod du jour, alternates via la colonne « pt » de
     tests/i18n/fix_sitemap_hreflang.py.
  5. js/ttq.js : ViewContent sur /pt/form.
  6. vercel.json : retrait du noindex /pt/(.*) ; /pt/cancelar-subscricao garde un noindex propre.
PAS de suggestion de langue (js/lang-suggest.js) : faite à part.

⚠️ À RELANCER après toute régénération d'une autre langue (build_v2*.py, build_home_*.py, build_flow_*.py…) puis
bascule : les générateurs ne connaissent pas « Português » et le retireraient des menus des copies v2/.
Le script relance lui-même bascule_v2.py quand il a modifié une copie v2/ ou seo_prod.json.
Depuis l'ouverture du tchèque (22/10) : relancer ensuite tests/i18n/cs/expose_cs.py (même règle pour « Čeština »).

Idempotent. Usage : python3 tests/i18n/pt/expose_pt.py [--check]   (--check : rc 1 s'il reste quelque chose à faire)
"""
import datetime, json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from prep_pt import PAGES, ROOT, clean

CHECK = '--check' in sys.argv
HIDDEN = {'resilier.html'}   # pages de résiliation : cachées (noindex) dans toutes les langues, pas de hreflang ajouté
V2 = os.path.join(ROOT, 'v2')
BUILDERS = os.path.join(os.path.dirname(ROOT), 'output', 'site-v2', 'builders')
SEO = os.path.join(os.path.dirname(ROOT), 'output', 'site-v2', 'source-v1', 'seo_prod.json')
OTHER_LANGS = ('fr', 'en', 'es', 'it', 'de', 'nl', 'el', 'pl')
changes = []

def url(rel): return 'https://adermio.com/' + rel
def page_file(t):  # 'en/blog' -> 'en/blog/index.html' ; '' -> 'index.html'
    return 'index.html' if t == '' else (t + '/index.html' if t.endswith('blog') else t + '.html')

# Carte « page de n'importe quelle langue » -> jumelle portugaise (adresses propres, sans .html)
TO_PT = {}
for fr, (pt, en, es, it, de, nl, el, pl) in PAGES.items():
    fr_c = '' if fr == 'index.html' else clean(fr)
    for t in (fr_c, en, es, it, de, nl, el, pl):
        if t == 'es/home' and fr != 'index.html': continue   # repli espagnol (pas de jumelle ES pour sources)
        TO_PT.setdefault(clean(t), clean(pt))

def pt_href(href):
    m = re.match(r'^(https://adermio\.com/|/v2/|/)(.*)$', href)
    if not m: return None
    prefix, path = m.groups()
    path = path.split('#')[0].split('?')[0].rstrip('/')
    return prefix + TO_PT.get(path, 'pt/home')

# ---------------------------------------------------------------------------------------------- 1. menus de langues
def is_current(a): return 'href="#"' in a or 'aria-current' in a or 'bg-teal-50' in a

def insert_simple(block):
    """lang-menu / f-col : ancres d'une ligne <a href="…"( lang="xx")>Nom</a>."""
    if 'Português' in block: return block
    anchors = [m for m in re.finditer(r'<a href="([^"]*)"([^>]*)>(Polski|Ελληνικά)</a>', block) if not is_current(m.group(0))]
    if not anchors: return block
    t = anchors[-1]
    href = pt_href(t.group(1)); assert href, t.group(0)
    extra = re.sub(r'lang="(pl|el)"', 'lang="pt"', t.group(2))
    return block[:t.end()] + f'<a href="{href}"{extra}>Português</a>' + block[t.end():]

def insert_flag(block):
    """lang-dropdown à drapeaux : ancre multiligne <a …><img flagcdn …><span>Nom</span></a>."""
    if 'flagcdn.com/pt.svg' in block: return block
    entries = [m for m in re.finditer(r'[ \t]*<a href="([^"]*)"[^>]*>\s*<img src="https://flagcdn\.com/(pl|gr)\.svg"[^>]*>\s*<span>[^<]*</span>\s*</a>\n?', block)
               if not is_current(m.group(0))]
    if not entries: return block
    t = entries[-1]; a = t.group(0)
    href = pt_href(t.group(1)); assert href, a
    new = a.replace(f'href="{t.group(1)}"', f'href="{href}"', 1)
    new = new.replace(f'flagcdn.com/{t.group(2)}.svg', 'flagcdn.com/pt.svg', 1)
    new = re.sub(r'alt="[^"]*"', 'alt="Português"', new, count=1)
    new = re.sub(r'<span>[^<]*</span>', '<span>Português</span>', new, count=1)
    if not a.endswith('\n'): new = '\n' + new.lstrip('\n')
    return block[:t.end()] + new + block[t.end():]

def div_block_end(s, i):
    depth, pos = 1, s.find('>', i) + 1
    while depth:
        o, c = s.find('<div', pos), s.find('</div>', pos)
        if c < 0: return -1
        if o != -1 and o < c: depth += 1; pos = o + 4
        else: depth -= 1; pos = c + 6
    return pos

def add_menus(s):
    s = re.sub(r'<nav class="lang-menu".*?</nav>', lambda m: insert_simple(m.group(0)), s, flags=re.S)
    s = re.sub(r'<div class="f-col"[^>]*>\s*<h4>[^<]*</h4>(?:\s*<a [^>]*>[^<]*</a>)+\s*</div>',
               lambda m: insert_simple(m.group(0)) if re.search(r'>(Polski|Ελληνικά)</a>', m.group(0)) else m.group(0), s)
    pos = 0
    while True:
        i = s.find('<div class="lang-dropdown', pos)
        if i < 0: break
        j = div_block_end(s, i)
        if j < 0: break
        blk = insert_flag(s[i:j]); s = s[:i] + blk + s[j:]; pos = i + len(blk)
    return s

def menu_files():
    out = []
    for base, dirs, files in os.walk(ROOT):
        rel_base = os.path.relpath(base, ROOT)
        top = rel_base.split(os.sep)[0]
        if top in ('.git', 'node_modules', 'tests', 'docs', '.vercel', 'pt') or rel_base.startswith(os.path.join('v2', 'pt')):
            dirs[:] = []; continue
        for f in files:
            if f.endswith('.html'): out.append(os.path.normpath(os.path.join(rel_base, f)))
    return sorted(out)

V2_PAGES = {os.path.relpath(os.path.join(b, f), V2) for b, _, fs in os.walk(V2) for f in fs if f.endswith('.html')}
v2_touched = False
for rel in menu_files():
    # pages de prod produites par bascule_v2.py : on ne touche que leur copie v2/ (sinon écrasé à la prochaine bascule)
    if not rel.startswith('v2' + os.sep) and rel in V2_PAGES: continue
    p = os.path.join(ROOT, rel); s = open(p, encoding='utf-8').read()
    if 'Polski' not in s and rel != os.path.join('v2', 'formulaire.html'): continue  # FR form : menu sans Polski
    s2 = add_menus(s)
    if s2 != s:
        changes.append(rel); v2_touched |= rel.startswith('v2' + os.sep)
        if not CHECK: open(p, 'w', encoding='utf-8').write(s2)

# ------------------------------------------------------------------------------------- 2-3. hreflang + JSON-LD
HL = r'<link rel="alternate" hreflang="(?:' + '|'.join(OTHER_LANGS) + r')" href="[^"]*"\s*/?>'
seo = json.load(open(SEO, encoding='utf-8')); seo_orig = json.dumps(seo, ensure_ascii=False, indent=1)

def add_hl_list(lst, pt_url):
    if any('hreflang="pt"' in x for x in lst): return lst
    idx = [k for k, x in enumerate(lst) if re.fullmatch(HL, x)]
    if not idx: return lst
    return lst[:idx[-1] + 1] + [f'<link rel="alternate" hreflang="pt" href="{pt_url}">'] + lst[idx[-1] + 1:]

def add_hl_file(s, pt_url):
    if 'hreflang="pt"' in s: return s
    last = None
    for mm in re.finditer(r'([ \t]*)(' + HL + r')\n', s): last = mm
    if not last: return s
    close = ' />' if last.group(2).endswith('/>') else '>'
    return s[:last.end()] + f'{last.group(1)}<link rel="alternate" hreflang="pt" href="{pt_url}"{close}\n' + s[last.end():]

for fr, (pt, en, es, it, de, nl, el, pl) in PAGES.items():
    if fr in HIDDEN: continue
    pt_url = url(clean(pt))
    twins = [fr] + [page_file(t) for t in (en, es, it, de, nl, el, pl) if not (t == 'es/home' and fr != 'index.html')]
    for f in twins:
        if f in seo:
            if f not in V2_PAGES: continue
            seo[f]['hreflang'] = add_hl_list(seo[f]['hreflang'], pt_url)
        elif os.path.exists(os.path.join(ROOT, f)):
            p = os.path.join(ROOT, f); s = open(p, encoding='utf-8').read(); s2 = add_hl_file(s, pt_url)
            if s2 != s:
                changes.append(f)
                if not CHECK: open(p, 'w', encoding='utf-8').write(s2)

for k, e in seo.items():
    if k.startswith('pt/'): continue
    e['ld'] = [ld.replace('"Greek", "Polish"]', '"Greek", "Polish", "Portuguese"]').replace('"el", "pl"]', '"el", "pl", "pt"]') for ld in e['ld']]
if json.dumps(seo, ensure_ascii=False, indent=1) != seo_orig:
    changes.append('output/site-v2/source-v1/seo_prod.json'); v2_touched = True
    if not CHECK: open(SEO, 'w', encoding='utf-8').write(json.dumps(seo, ensure_ascii=False, indent=1))

# ------------------------------------------------------------------------------------------------- 4. sitemap
FIX = os.path.join(ROOT, 'tests', 'i18n', 'fix_sitemap_hreflang.py'); fx = open(FIX, encoding='utf-8').read()
FR2PT = {('' if fr == 'index.html' else clean(fr)): clean(v[0]) for fr, v in PAGES.items() if fr not in HIDDEN}
if "'pt':" not in fx:
    def add_pt(m):
        row = m.group(0); fr = re.search(r"'fr':\s*'([^']*)'", row).group(1)
        ptp = FR2PT.get(fr)
        if ptp is None: return row
        i = row.rfind('}')
        return row[:i] + f", 'pt': '{ptp}'" + row[i:]
    fx2 = re.sub(r"^    \{'fr':.*$", add_pt, fx, flags=re.M)
    fx2 = fx2.replace("LANGS = ('fr', 'en', 'es', 'it', 'de', 'nl', 'el', 'pl')", "LANGS = ('fr', 'en', 'es', 'it', 'de', 'nl', 'el', 'pl', 'pt')")
    assert fx2.count("'pt':") >= 13 and "'pl', 'pt')" in fx2, 'fix_sitemap_hreflang.py : motif introuvable'
    changes.append('tests/i18n/fix_sitemap_hreflang.py')
    if not CHECK: open(FIX, 'w', encoding='utf-8').write(fx2)
    fx = fx2
PT_URLS = re.findall(r"'pt':\s*'([^']+)'", fx)
sm = os.path.join(ROOT, 'sitemap.xml'); s = open(sm, encoding='utf-8').read()
missing = [u for u in PT_URLS if f'<loc>{url(u)}</loc>' not in s]
if missing:
    PT2FR = {v: k for k, v in FR2PT.items()}
    today = datetime.date.today().isoformat()
    def block(u, ind):
        fr_b = re.search(r'<url>\s*<loc>' + re.escape(url(PT2FR[u])) + r'</loc>.*?</url>', s, flags=re.S).group(0)
        g = lambda tag: (re.search(rf'<{tag}>([^<]*)</{tag}>', fr_b) or [None, None])[1]
        body = f'{ind}<url>{ind}  <loc>{url(u)}</loc>{ind}  <lastmod>{today}</lastmod>'
        if g('changefreq'): body += f'{ind}  <changefreq>{g("changefreq")}</changefreq>'
        if g('priority'): body += f'{ind}  <priority>{g("priority")}</priority>'
        return body + f'{ind}</url>'
    m = list(re.finditer(r'(\s*)<url>\s*<loc>https://adermio.com/pl/[^<]*</loc>.*?</url>', s, flags=re.S))[-1]
    ind = m.group(1)
    s = s[:m.end()] + ''.join(block(u, ind) for u in missing) + s[m.end():]
    changes.append('sitemap.xml')
    if not CHECK: open(sm, 'w', encoding='utf-8').write(s)
if not CHECK and ('sitemap.xml' in changes or 'tests/i18n/fix_sitemap_hreflang.py' in changes):
    subprocess.run([sys.executable, FIX], check=True)

# --------------------------------------------------------------------------------------------------- 5. ttq.js
tq = os.path.join(ROOT, 'js', 'ttq.js'); t = open(tq, encoding='utf-8').read()
if "'/pt/form'" not in t:
    t2 = t.replace("'/el/form', '/pl/form'];", "'/el/form', '/pl/form', '/pt/form'];")
    t2 = t2.replace("(/^\\/pl\\//.test(p) ? 'Darmowa analiza skóry Adermio' : 'Analyse gratuite Adermio')",
                    "(/^\\/pl\\//.test(p) ? 'Darmowa analiza skóry Adermio' : (/^\\/pt\\//.test(p) ? 'Análise gratuita da pele Adermio' : 'Analyse gratuite Adermio'))")
    assert t2 != t and "'/pt/form'" in t2 and 'Análise gratuita da pele Adermio' in t2, 'ttq.js : motif introuvable'
    changes.append('js/ttq.js')
    if not CHECK: open(tq, 'w', encoding='utf-8').write(t2)

# ----------------------------------------------------------------------------------------------- 6. vercel.json
vj = os.path.join(ROOT, 'vercel.json'); v = open(vj, encoding='utf-8').read(); v2 = v
NOINDEX = '\n    {\n      "source": "%s",\n      "headers": [\n        {\n          "key": "X-Robots-Tag",\n          "value": "noindex"\n        }\n      ]\n    },'
v2 = v2.replace(NOINDEX % '/pt/(.*)', '')
if '"/pt/cancelar-subscricao"' not in v2:
    anchor = NOINDEX % '/pl/anuluj-subskrypcje'
    assert v2.count(anchor) == 1, 'vercel.json : bloc /pl/anuluj-subskrypcje introuvable'
    v2 = v2.replace(anchor, anchor + NOINDEX % '/pt/cancelar-subscricao')
if v2 != v:
    json.loads(v2); assert '"/pt/(.*)"' not in v2
    changes.append('vercel.json')
    if not CHECK: open(vj, 'w', encoding='utf-8').write(v2)

# ------------------------------------------------------------------------------------------------ bascule
if not CHECK and v2_touched:
    subprocess.run([sys.executable, os.path.join(BUILDERS, 'bascule_v2.py')], check=True)

print(('À modifier' if CHECK else 'Modifiés') + f' ({len(changes)}) :', changes)
if CHECK and changes: sys.exit(1)
