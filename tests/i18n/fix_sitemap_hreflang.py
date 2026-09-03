#!/usr/bin/env python3
"""Réécrit les alternates hreflang du sitemap à partir d'une table de groupes explicite.

Pourquoi : les entrées italiennes avaient été produites en clonant le bloc `/es/legal-notice` et en
n'y remplaçant que le `<loc>`. Résultat : chaque page italienne se déclarait comme la version
ESPAGNOLE d'elle-même, et annonçait les mentions légales comme équivalent français et anglais.
Un hreflang non réciproque est ignoré par Google, un hreflang faux l'induit en erreur.

Le script ne touche ni aux `<loc>`, ni aux `<lastmod>/<changefreq>/<priority>` déjà en place, sauf
pour les entrées italiennes, qui héritent de la cadence de leur jumelle française. Idempotent.

Usage : python3 tests/i18n/fix_sitemap_hreflang.py [--check]
"""
import os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHECK = '--check' in sys.argv
BASE = 'https://adermio.com/'

# Un groupe = la même page dans chaque langue. None = cette langue n'a pas la page.
GROUPS = [
    {'fr': '',                                      'en': 'en/home',            'es': 'es/home',            'it': 'it/home', 'xdefault': True},
    {'fr': 'about',                                 'en': 'en/about',           'es': 'es/about',           'it': 'it/about'},
    {'fr': 'formulaire',                            'en': 'en/form',            'es': 'es/form',            'it': 'it/form'},
    {'fr': 'contact',                               'en': 'en/contact',         'es': 'es/contact',         'it': 'it/contact'},
    {'fr': 'conditions',                            'en': 'en/conditions',      'es': 'es/conditions',      'it': 'it/conditions'},
    {'fr': 'confidentialite',                       'en': 'en/confidentialite', 'es': 'es/confidentialite', 'it': 'it/confidentialite'},
    {'fr': 'sources',                               'en': 'en/sources',         'es': None,                 'it': 'it/sources'},
    {'fr': 'mentions-legales',                      'en': 'en/legal-notice',    'es': 'es/legal-notice',    'it': 'it/legal-notice'},
    {'fr': 'blog',                                  'en': 'en/blog',            'es': 'es/blog',            'it': 'it/blog'},
    {'fr': 'blog/comment-connaitre-son-type-de-peau','en': 'en/blog/how-to-know-your-skin-type', 'es': 'es/blog/como-conocer-tu-tipo-de-piel', 'it': 'it/blog/come-conoscere-il-tuo-tipo-di-pelle'},
    {'fr': 'blog/pourquoi-a-t-on-de-l-acne',        'en': 'en/blog/why-do-we-have-acne',        'es': 'es/blog/por-que-tenemos-acne',        'it': 'it/blog/perche-viene-l-acne'},
    {'fr': 'blog/acne-hormonale',                   'en': 'en/blog/hormonal-acne',              'es': 'es/blog/acne-hormonal',               'it': 'it/blog/acne-ormonale'},
    {'fr': 'blog/ou-apparait-l-acne',               'en': 'en/blog/where-acne-appears',         'es': 'es/blog/donde-aparece-el-acne',       'it': 'it/blog/dove-compare-l-acne'},
]
LANGS = ('fr', 'en', 'es', 'it')
url = lambda p: BASE + p

def alternates(group, indent):
    out = []
    for lg in LANGS:
        p = group.get(lg)
        if p is None: continue
        out.append(f'{indent}<xhtml:link rel="alternate" hreflang="{lg}" href="{url(p)}"/>')
    if group.get('xdefault'):
        out.append(f'{indent}<xhtml:link rel="alternate" hreflang="x-default" href="{url(group["fr"])}"/>')
    return '\n'.join(out)

def main():
    sm = os.path.join(ROOT, 'sitemap.xml')
    s = open(sm, encoding='utf-8').read()
    blocks = list(re.finditer(r'[ \t]*<url>.*?</url>', s, re.S))
    by_loc = {re.search(r'<loc>([^<]+)</loc>', b.group(0)).group(1): b for b in blocks}
    meta = {}   # loc -> (lastmod, changefreq, priority)
    for loc, b in by_loc.items():
        g = lambda tag: (re.search(rf'<{tag}>([^<]*)</{tag}>', b.group(0)) or [None, None])[1]
        meta[loc] = (g('lastmod'), g('changefreq'), g('priority'))

    manquantes = [url(g[lg]) for g in GROUPS for lg in LANGS if g.get(lg) is not None and url(g[lg]) not in by_loc]
    if manquantes:
        print('❌ URL de la table absentes du sitemap :', manquantes); return 1

    new = s
    for g in GROUPS:
        fr_meta = meta[url(g['fr'])]
        for lg in LANGS:
            p = g.get(lg)
            if p is None: continue
            loc = url(p); b = by_loc[loc]; old = b.group(0)
            indent = re.match(r'[ \t]*', old).group(0) + '  '
            lm, cf, pr = meta[loc] if lg != 'it' else fr_meta
            body = [f'{indent[:-2]}<url>', f'{indent}<loc>{loc}</loc>', alternates(g, indent)]
            if lm: body.append(f'{indent}<lastmod>{lm}</lastmod>')
            if cf: body.append(f'{indent}<changefreq>{cf}</changefreq>')
            if pr: body.append(f'{indent}<priority>{pr}</priority>')
            body.append(f'{indent[:-2]}</url>')
            new = new.replace(old, '\n'.join(body), 1)

    if new == s:
        print('sitemap.xml : déjà correct, rien à faire'); return 0
    if CHECK:
        print('sitemap.xml : à corriger'); return 1
    open(sm, 'w', encoding='utf-8').write(new)
    print(f'sitemap.xml corrigé : {sum(1 for g in GROUPS for lg in LANGS if g.get(lg) is not None)} entrées, '
          f'alternates réciproques sur {len(GROUPS)} groupes')
    return 0

if __name__ == '__main__':
    sys.exit(main())
