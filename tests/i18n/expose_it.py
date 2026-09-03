#!/usr/bin/env python3
"""Expose la version italienne : hreflang + entrée « Italiano » du sélecteur sur les pages FR/EN/ES,
JSON-LD des homes, sitemap.xml, js/ttq.js. Idempotent (ne fait rien si déjà fait).
Usage : python3 tests/i18n/expose_it.py [--check]
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prep_it import PAGES, ROOT, clean

CHECK = '--check' in sys.argv
changes = []

def url(rel):  # 'en/home' -> https://adermio.com/en/home ; '' -> https://adermio.com/
    return 'https://adermio.com/' + rel

def add_hreflang(html, it_url):
    if 'hreflang="it"' in html: return html
    m = re.search(r'([ \t]*)<link rel="alternate" hreflang="(?:es|en)" href="[^"]*">\n', html)
    if not m: return html
    # insère après la DERNIÈRE ligne hreflang es/en (avant x-default si présent)
    last = None
    for mm in re.finditer(r'([ \t]*)<link rel="alternate" hreflang="(?:es|en|fr)" href="[^"]*">\n', html): last = mm
    return html[:last.end()] + f'{last.group(1)}<link rel="alternate" hreflang="it" href="{it_url}">\n' + html[last.end():]

def add_dropdown_entry(html, it_url):
    i = html.find('<div class="lang-dropdown')
    if i < 0 or 'flagcdn.com/it.svg' in html: return html
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
    # reprend la classe "non courante" d'une entrée existante si elle diffère (pages avec brand-dark, etc.)
    for e in entries:
        if 'bg-teal-50' not in e.group(2): cls = e.group(2); break
    entry = f'{ind}<a href="{it_url}" class="{cls}">\n{ind}    <img src="https://flagcdn.com/it.svg" width="{w}" alt="Italiano" class="rounded-sm shadow-sm">\n{ind}    <span>Italiano</span>\n{ind}</a>\n'
    new_block = block[:last.end()] + entry + block[last.end():]
    return html[:i] + new_block + html[pos:]

def process(rel_path, it_rel):
    p = os.path.join(ROOT, rel_path)
    if not os.path.exists(p): return
    html = open(p, encoding='utf-8').read(); orig = html
    it_url = url(clean(it_rel))
    html = add_hreflang(html, it_url)
    html = add_dropdown_entry(html, it_url)
    html = html.replace('"availableLanguage": ["French", "English", "Spanish"]', '"availableLanguage": ["French", "English", "Spanish", "Italian"]')
    html = html.replace('"inLanguage": ["fr", "en", "es"]', '"inLanguage": ["fr", "en", "es", "it"]')
    if html != orig:
        changes.append(rel_path)
        if not CHECK: open(p, 'w', encoding='utf-8').write(html)

for fr_rel, (it_rel, en_twin, es_twin) in PAGES.items():
    process(fr_rel, it_rel)
    process(en_twin + '.html' if not en_twin.endswith('blog') else en_twin + '/index.html', it_rel)
    if es_twin != 'es/home' or fr_rel == 'index.html':
        process(es_twin + '.html' if not es_twin.endswith('blog') else es_twin + '/index.html', it_rel)

# sitemap
sm = os.path.join(ROOT, 'sitemap.xml'); s = open(sm, encoding='utf-8').read()
if 'adermio.com/it/' not in s:
    it_urls = ['it/home', 'it/about', 'it/form', 'it/contact', 'it/conditions', 'it/confidentialite', 'it/sources', 'it/legal-notice', 'it/blog',
               'it/blog/come-conoscere-il-tuo-tipo-di-pelle', 'it/blog/perche-viene-l-acne', 'it/blog/acne-ormonale', 'it/blog/dove-compare-l-acne']
    m = re.search(r'(\s*)<url>\s*<loc>https://adermio.com/es/legal-notice</loc>.*?</url>', s, flags=re.S)
    tpl = m.group(0); ind = m.group(1)
    block = ''.join(tpl.replace('https://adermio.com/es/legal-notice', url(u)) for u in it_urls)
    s = s[:m.end()] + block + s[m.end():]
    changes.append('sitemap.xml')
    if not CHECK: open(sm, 'w', encoding='utf-8').write(s)

# ttq.js : ViewContent sur les formulaires IT (pixel FR par défaut, comme l'ES)
tq = os.path.join(ROOT, 'js', 'ttq.js'); t = open(tq, encoding='utf-8').read()
if "'/it/form'" not in t:
    t = t.replace("'/en/form', '/en/form2', '/en/form3']", "'/en/form', '/en/form2', '/en/form3', '/it/form', '/it/form2']")
    t = t.replace("content_name: isEN ? 'Adermio free skin analysis' : 'Analyse gratuite Adermio'", "content_name: isEN ? 'Adermio free skin analysis' : (/^\\/it\\//.test(p) ? 'Analisi gratuita Adermio' : 'Analyse gratuite Adermio')")
    changes.append('js/ttq.js')
    if not CHECK: open(tq, 'w', encoding='utf-8').write(t)

print(('À modifier' if CHECK else 'Modifiés') + f' ({len(changes)}) :', changes)
