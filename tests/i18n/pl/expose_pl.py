#!/usr/bin/env python3
"""Expose la version polonaise (copie de el/expose_el.py, 14/10/2026) : hreflang « pl » + entrée « Polski » du sélecteur sur les
pages FR/EN/ES/IT/DE/NL/EL jumelles, JSON-LD des homes (Polish / pl), sitemap.xml (URL /pl/ + colonne « pl » de
fix_sitemap_hreflang.py, qui réécrit les alternates), js/ttq.js (ViewContent sur /pl/form), js/lang-suggest.js (PL → /pl),
retrait du noindex /pl/(.*) (vercel.json ; la page de résiliation /pl/anuluj-subskrypcje garde son noindex propre).
Les pages de résiliation (cachées dans toutes les langues) ne sont pas exposées.
Idempotent (ne fait rien si déjà fait).
Usage : python3 tests/i18n/pl/expose_pl.py [--check]   (--check : rc 1 s'il reste quelque chose à faire)
"""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from prep_pl import PAGES, ROOT, clean

CHECK = '--check' in sys.argv
HIDDEN = {'resilier.html'}   # pages cachées (noindex) dans toutes les langues
changes = []

def url(rel):
    return 'https://adermio.com/' + rel

def add_hreflang(html, pl_url):
    if 'hreflang="pl"' in html: return html
    last = None
    for mm in re.finditer(r'([ \t]*)<link rel="alternate" hreflang="(?:fr|en|es|it|de|nl|el)" href="[^"]*">\n', html): last = mm
    if not last: return html
    return html[:last.end()] + f'{last.group(1)}<link rel="alternate" hreflang="pl" href="{pl_url}">\n' + html[last.end():]

def add_dropdown_entry(html, pl_url):
    i = html.find('<div class="lang-dropdown')
    if i < 0 or 'flagcdn.com/pl.svg' in html: return html
    depth, pos = 1, html.find('>', i) + 1
    while depth:
        o, c = html.find('<div', pos), html.find('</div>', pos)
        if c < 0: return html
        if o != -1 and o < c: depth += 1; pos = o + 4
        else: depth -= 1; pos = c + 6
    block = html[i:pos]
    entries = list(re.finditer(r'([ \t]*)<a href="[^"]*" class="([^"]*)">\s*<img src="https://flagcdn\.com/[a-z]+\.svg" width="(\d+)"[^>]*>\s*<span>[^<]*</span>\s*</a>\n?', block))
    if not entries: return html
    last = entries[-1]; ind = last.group(1); w = last.group(3)
    cls = 'flex items-center gap-3 px-4 py-3 text-sm font-medium text-adermio-dark hover:bg-gray-50 transition-colors'
    for e in entries:
        if 'bg-teal-50' not in e.group(2): cls = e.group(2); break
    entry = f'{ind}<a href="{pl_url}" class="{cls}">\n{ind}    <img src="https://flagcdn.com/pl.svg" width="{w}" alt="Polski" class="rounded-sm shadow-sm">\n{ind}    <span>Polski</span>\n{ind}</a>\n'
    return html[:i] + block[:last.end()] + entry + block[last.end():] + html[pos:]

def process(rel_path, pl_rel):
    p = os.path.join(ROOT, rel_path)
    if not os.path.exists(p): return
    html = open(p, encoding='utf-8').read(); orig = html
    pl_url = url(clean(pl_rel))
    html = add_hreflang(html, pl_url)
    html = add_dropdown_entry(html, pl_url)
    html = html.replace('"availableLanguage": ["French", "English", "Spanish", "Italian", "German", "Dutch", "Greek"]', '"availableLanguage": ["French", "English", "Spanish", "Italian", "German", "Dutch", "Greek", "Polish"]')
    html = html.replace('"inLanguage": ["fr", "en", "es", "it", "de", "nl", "el"]', '"inLanguage": ["fr", "en", "es", "it", "de", "nl", "el", "pl"]')
    if html != orig:
        changes.append(rel_path)
        if not CHECK: open(p, 'w', encoding='utf-8').write(html)

def twin_file(t):
    return t + '/index.html' if t.endswith('blog') else t + '.html'

seen = set()
for fr_rel, (pl_rel, en_twin, es_twin, it_twin, de_twin, nl_twin, el_twin) in PAGES.items():
    if fr_rel in HIDDEN: continue
    twins = [en_twin, it_twin, de_twin, nl_twin, el_twin] + ([es_twin] if es_twin != 'es/home' or fr_rel == 'index.html' else [])
    for f in [fr_rel] + [twin_file(t) for t in twins]:
        if f in seen: continue
        seen.add(f); process(f, pl_rel)

# sitemap : colonne « pl » dans la table de fix_sitemap_hreflang.py, blocs /pl/ SANS alternates, puis réécriture par le script
FIX = os.path.join(ROOT, 'tests', 'i18n', 'fix_sitemap_hreflang.py'); fx = open(FIX, encoding='utf-8').read()
FR2PL = {('' if fr == 'index.html' else clean(fr)): clean(v[0]) for fr, v in PAGES.items() if fr not in HIDDEN}
if "'pl':" not in fx:
    def add_pl(m):
        row = m.group(0); fr = re.search(r"'fr':\s*'([^']*)'", row).group(1)
        pl = FR2PL.get(fr)
        if pl is None: return row
        i = row.rfind('}')
        return row[:i] + f", 'pl': '{pl}'" + row[i:]
    fx2 = re.sub(r"^    \{'fr':.*$", add_pl, fx, flags=re.M)
    fx2 = fx2.replace("LANGS = ('fr', 'en', 'es', 'it', 'de', 'nl', 'el')", "LANGS = ('fr', 'en', 'es', 'it', 'de', 'nl', 'el', 'pl')")
    fx2 = fx2.replace("if lg not in ('it', 'de', 'nl', 'el') else fr_meta", "if lg not in ('it', 'de', 'nl', 'el', 'pl') else fr_meta")
    assert fx2.count("'pl':") >= 13 and "'el', 'pl')" in fx2, 'fix_sitemap_hreflang.py : motif introuvable'
    changes.append('tests/i18n/fix_sitemap_hreflang.py')
    if not CHECK: open(FIX, 'w', encoding='utf-8').write(fx2)
    fx = fx2
PL_URLS = re.findall(r"'pl':\s*'([^']+)'", fx)
sm = os.path.join(ROOT, 'sitemap.xml'); s = open(sm, encoding='utf-8').read()
missing = [u for u in PL_URLS if f'<loc>{url(u)}</loc>' not in s]
if missing:
    m = list(re.finditer(r'(\s*)<url>\s*<loc>https://adermio.com/el/[^<]*</loc>.*?</url>', s, flags=re.S))[-1]
    ind = m.group(1)
    block = ''.join(f'{ind}<url>{ind}  <loc>{url(u)}</loc>{ind}</url>' for u in missing)
    s = s[:m.end()] + block + s[m.end():]
    changes.append('sitemap.xml')
    if not CHECK: open(sm, 'w', encoding='utf-8').write(s)
if not CHECK and ('sitemap.xml' in changes or 'tests/i18n/fix_sitemap_hreflang.py' in changes):
    subprocess.run([sys.executable, FIX], check=True)

# ttq.js : ViewContent sur le formulaire polonais (pixel FR par défaut, comme IT/DE/NL/EL)
tq = os.path.join(ROOT, 'js', 'ttq.js'); t = open(tq, encoding='utf-8').read()
if "'/pl/form'" not in t:
    t2 = t.replace("'/nl/form', '/el/form'];", "'/nl/form', '/el/form', '/pl/form'];")
    t2 = t2.replace("(/^\\/el\\//.test(p) ? 'Δωρεάν ανάλυση επιδερμίδας Adermio' : 'Analyse gratuite Adermio')",
                    "(/^\\/el\\//.test(p) ? 'Δωρεάν ανάλυση επιδερμίδας Adermio' : (/^\\/pl\\//.test(p) ? 'Darmowa analiza skóry Adermio' : 'Analyse gratuite Adermio'))")
    assert t2 != t and "'/pl/form'" in t2 and 'Darmowa analiza skóry Adermio' in t2, 'ttq.js : motif introuvable'
    changes.append('js/ttq.js')
    if not CHECK: open(tq, 'w', encoding='utf-8').write(t2)

# lang-suggest.js : visiteurs situés en Pologne sur /en ou les pages FR → « Kontynuuj po polsku » (jamais de redirection automatique)
ls = os.path.join(ROOT, 'js', 'lang-suggest.js'); l = open(ls, encoding='utf-8').read()
if "adermio_lang_choice_pl" not in l:
    anchor = "      cta: 'Weiter auf Deutsch'\n    }\n  };"
    assert l.count(anchor) == 1, 'lang-suggest.js : ancre introuvable'
    entry = """      cta: 'Weiter auf Deutsch'
    },
    pl: {
      countries: ['PL'],
      choiceKey: 'adermio_lang_choice_pl',
      targets: {
        '/en/form': '/pl/form', '/en/home': '/pl/home',
        '/formulaire': '/pl/form', '/': '/pl/home'
      },
      flag: 'pl',
      label: 'Polski',
      title: 'Adermio jest dostępne po polsku',
      text: 'Twoja darmowa analiza skóry i pełny raport – w całości po polsku.',
      cta: 'Kontynuuj po polsku'
    }
  };"""
    l2 = l.replace(anchor, entry)
    changes.append('js/lang-suggest.js')
    if not CHECK: open(ls, 'w', encoding='utf-8').write(l2)

# vercel.json : retrait du noindex /pl/(.*) (la redirection /pl -> /pl/home reste ; /pl/anuluj-subskrypcje garde le sien)
vj = os.path.join(ROOT, 'vercel.json'); v = open(vj, encoding='utf-8').read()
blk = re.search(r'\n    \{\n      "source": "/pl/\(\.\*\)",\n      "headers": \[\n        \{\n          "key": "X-Robots-Tag",\n          "value": "noindex"\n        \}\n      \]\n    \},', v)
if blk:
    v2 = v[:blk.start()] + v[blk.end():]
    json.loads(v2)
    assert '"/pl/anuluj-subskrypcje"' in v2
    changes.append('vercel.json')
    if not CHECK: open(vj, 'w', encoding='utf-8').write(v2)

print(('À modifier' if CHECK else 'Modifiés') + f' ({len(changes)}) :', changes)
if CHECK and changes: sys.exit(1)
