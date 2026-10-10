#!/usr/bin/env python3
"""Expose la version néerlandaise (copie de de/expose_de.py) : hreflang « nl » + entrée « Nederlands » du
sélecteur sur les pages FR/EN/ES/IT/DE jumelles, JSON-LD des homes, sitemap.xml (alternates réécrits
par fix_sitemap_hreflang.py), js/ttq.js. Le retrait du noindex se fait dans vercel.json.
Idempotent (ne fait rien si déjà fait).
Usage : python3 tests/i18n/nl/expose_nl.py [--check]   (--check : rc 1 s'il reste quelque chose à faire)
"""
import os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from prep_nl import PAGES, ROOT, clean

CHECK = '--check' in sys.argv
changes = []

def url(rel):
    return 'https://adermio.com/' + rel

def add_hreflang(html, nl_url):
    if 'hreflang="nl"' in html: return html
    last = None
    for mm in re.finditer(r'([ \t]*)<link rel="alternate" hreflang="(?:fr|en|es|it|de)" href="[^"]*">\n', html): last = mm
    if not last: return html
    return html[:last.end()] + f'{last.group(1)}<link rel="alternate" hreflang="nl" href="{nl_url}">\n' + html[last.end():]

def add_dropdown_entry(html, nl_url):
    i = html.find('<div class="lang-dropdown')
    if i < 0 or 'flagcdn.com/nl.svg' in html: return html
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
    entry = f'{ind}<a href="{nl_url}" class="{cls}">\n{ind}    <img src="https://flagcdn.com/nl.svg" width="{w}" alt="Nederlands" class="rounded-sm shadow-sm">\n{ind}    <span>Nederlands</span>\n{ind}</a>\n'
    return html[:i] + block[:last.end()] + entry + block[last.end():] + html[pos:]

def process(rel_path, nl_rel):
    p = os.path.join(ROOT, rel_path)
    if not os.path.exists(p): return
    html = open(p, encoding='utf-8').read(); orig = html
    nl_url = url(clean(nl_rel))
    html = add_hreflang(html, nl_url)
    html = add_dropdown_entry(html, nl_url)
    html = html.replace('"availableLanguage": ["French", "English", "Spanish", "Italian", "German"]', '"availableLanguage": ["French", "English", "Spanish", "Italian", "German", "Dutch"]')
    html = html.replace('"inLanguage": ["fr", "en", "es", "it", "de"]', '"inLanguage": ["fr", "en", "es", "it", "de", "nl"]')
    if html != orig:
        changes.append(rel_path)
        if not CHECK: open(p, 'w', encoding='utf-8').write(html)

def twin_file(t):
    return t + '/index.html' if t.endswith('blog') else t + '.html'

seen = set()
for fr_rel, (nl_rel, en_twin, es_twin, it_twin, de_twin) in PAGES.items():
    for f in [fr_rel, twin_file(en_twin), twin_file(it_twin), twin_file(de_twin)] + ([twin_file(es_twin)] if es_twin != 'es/home' or fr_rel == 'index.html' else []):
        if f in seen: continue
        seen.add(f); process(f, nl_rel)

# sitemap : blocs NL SANS alternates, puis fix_sitemap_hreflang.py les réécrit depuis sa table
sm = os.path.join(ROOT, 'sitemap.xml'); s = open(sm, encoding='utf-8').read()
NL_URLS = ['nl/home', 'nl/over-ons', 'nl/form', 'nl/contact', 'nl/gebruiksvoorwaarden', 'nl/privacyverklaring', 'nl/bronnen',
           'nl/juridische-informatie', 'nl/blog', 'nl/blog/huidtype-bepalen', 'nl/blog/waarom-krijg-je-acne',
           'nl/blog/hormonale-acne', 'nl/blog/waar-ontstaat-acne']
if 'adermio.com/nl/' not in s:
    m = list(re.finditer(r'(\s*)<url>\s*<loc>https://adermio.com/de/[^<]*</loc>.*?</url>', s, flags=re.S))[-1]
    ind = m.group(1)
    block = ''.join(f'{ind}<url>{ind}  <loc>{url(u)}</loc>{ind}</url>' for u in NL_URLS)
    s = s[:m.end()] + block + s[m.end():]
    changes.append('sitemap.xml')
    if not CHECK:
        open(sm, 'w', encoding='utf-8').write(s)
        subprocess.run([sys.executable, os.path.join(ROOT, 'tests', 'i18n', 'fix_sitemap_hreflang.py')], check=True)

# ttq.js : ViewContent sur le formulaire néerlandais (pixel FR par défaut, comme l'IT/DE)
tq = os.path.join(ROOT, 'js', 'ttq.js'); t = open(tq, encoding='utf-8').read()
if "'/nl/form'" not in t:
    t2 = t.replace("'/it/form', '/it/form2', '/de/form'];", "'/it/form', '/it/form2', '/de/form', '/nl/form'];")
    t2 = t2.replace("(/^\\/de\\//.test(p) ? 'Kostenlose Hautanalyse Adermio' : 'Analyse gratuite Adermio')",
                    "(/^\\/de\\//.test(p) ? 'Kostenlose Hautanalyse Adermio' : (/^\\/nl\\//.test(p) ? 'Gratis Adermio-huidanalyse' : 'Analyse gratuite Adermio'))")
    assert t2 != t and "'/nl/form'" in t2 and 'Gratis Adermio-huidanalyse' in t2, 'ttq.js : motif introuvable'
    changes.append('js/ttq.js')
    if not CHECK: open(tq, 'w', encoding='utf-8').write(t2)

print(('À modifier' if CHECK else 'Modifiés') + f' ({len(changes)}) :', changes)
if CHECK and changes: sys.exit(1)
