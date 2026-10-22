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
    {'fr': '',                                      'en': 'en/home',            'es': 'es/home',            'it': 'it/home', 'de': 'de/home', 'nl': 'nl/home', 'xdefault': True, 'el': 'el/home', 'pl': 'pl/home', 'pt': 'pt/home', 'cs': 'cs/home'},
    {'fr': 'about',                                 'en': 'en/about',           'es': 'es/about',           'it': 'it/about', 'de': 'de/ueber-uns', 'nl': 'nl/over-ons', 'el': 'el/schetika-me-emas', 'pl': 'pl/o-nas', 'pt': 'pt/sobre-nos', 'cs': 'cs/o-nas'},
    # formulaires retirés du sitemap (noindex, commit c8c85ec) : plus de groupe 'formulaire'
    {'fr': 'contact',                               'en': 'en/contact',         'es': 'es/contact',         'it': 'it/contact', 'de': 'de/kontakt', 'nl': 'nl/contact', 'el': 'el/epikoinonia', 'pl': 'pl/kontakt', 'pt': 'pt/contacto', 'cs': 'cs/kontakt'},
    {'fr': 'conditions',                            'en': 'en/conditions',      'es': 'es/conditions',      'it': 'it/conditions', 'de': 'de/nutzungsbedingungen', 'nl': 'nl/gebruiksvoorwaarden', 'el': 'el/oroi-chrisis', 'pl': 'pl/regulamin', 'pt': 'pt/termos-de-utilizacao', 'cs': 'cs/podminky-pouzivani'},
    {'fr': 'confidentialite',                       'en': 'en/confidentialite', 'es': 'es/confidentialite', 'it': 'it/confidentialite', 'de': 'de/datenschutz', 'nl': 'nl/privacyverklaring', 'el': 'el/politiki-aporritou', 'pl': 'pl/polityka-prywatnosci', 'pt': 'pt/politica-de-privacidade', 'cs': 'cs/ochrana-osobnich-udaju'},
    {'fr': 'sources',                               'en': 'en/sources',         'es': None,                 'it': 'it/sources', 'de': 'de/quellen', 'nl': 'nl/bronnen', 'el': 'el/piges', 'pl': 'pl/zrodla', 'pt': 'pt/fontes', 'cs': 'cs/zdroje'},
    {'fr': 'cgv',                                   'en': 'en/cgv',             'es': 'es/cgv',             'it': 'it/cgv', 'de': 'de/agb', 'nl': 'nl/algemene-voorwaarden', 'el': 'el/oroi-polisis', 'pl': 'pl/warunki-sprzedazy', 'pt': 'pt/condicoes-de-venda', 'cs': 'cs/obchodni-podminky'},  # CGV v1.1 traduites (11/10/2026)
    {'fr': 'mentions-legales',                      'en': 'en/legal-notice',    'es': 'es/legal-notice',    'it': 'it/legal-notice', 'de': 'de/impressum', 'nl': 'nl/juridische-informatie', 'el': 'el/nomikes-plirofories', 'pl': 'pl/informacje-prawne', 'pt': 'pt/informacoes-legais', 'cs': 'cs/pravni-informace'},
    {'fr': 'blog',                                  'en': 'en/blog',            'es': 'es/blog',            'it': 'it/blog', 'de': 'de/blog', 'nl': 'nl/blog', 'el': 'el/blog', 'pl': 'pl/blog', 'pt': 'pt/blog', 'cs': 'cs/blog'},
    {'fr': 'blog/comment-connaitre-son-type-de-peau','en': 'en/blog/how-to-know-your-skin-type', 'es': 'es/blog/como-conocer-tu-tipo-de-piel', 'it': 'it/blog/come-conoscere-il-tuo-tipo-di-pelle', 'de': 'de/blog/hauttyp-bestimmen', 'nl': 'nl/blog/huidtype-bepalen', 'el': 'el/blog/typos-epidermidas', 'pl': 'pl/blog/typ-skory', 'pt': 'pt/blog/tipo-de-pele', 'cs': 'cs/blog/typ-pleti'},
    {'fr': 'blog/pourquoi-a-t-on-de-l-acne',        'en': 'en/blog/why-do-we-have-acne',        'es': 'es/blog/por-que-tenemos-acne',        'it': 'it/blog/perche-viene-l-acne', 'de': 'de/blog/warum-bekommt-man-akne', 'nl': 'nl/blog/waarom-krijg-je-acne', 'el': 'el/blog/giati-vgazoume-akmi', 'pl': 'pl/blog/skad-sie-bierze-tradzik', 'pt': 'pt/blog/porque-temos-acne', 'cs': 'cs/blog/proc-vznika-akne'},
    {'fr': 'blog/acne-hormonale',                   'en': 'en/blog/hormonal-acne',              'es': 'es/blog/acne-hormonal',               'it': 'it/blog/acne-ormonale', 'de': 'de/blog/hormonelle-akne', 'nl': 'nl/blog/hormonale-acne', 'el': 'el/blog/ormoniki-akmi', 'pl': 'pl/blog/tradzik-hormonalny', 'pt': 'pt/blog/acne-hormonal', 'cs': 'cs/blog/hormonalni-akne'},
    {'fr': 'blog/ou-apparait-l-acne',               'en': 'en/blog/where-acne-appears',         'es': 'es/blog/donde-aparece-el-acne',       'it': 'it/blog/dove-compare-l-acne', 'de': 'de/blog/wo-tritt-akne-auf', 'nl': 'nl/blog/waar-ontstaat-acne', 'el': 'el/blog/pou-emfanizetai-akmi', 'pl': 'pl/blog/gdzie-pojawia-sie-tradzik', 'pt': 'pt/blog/onde-aparece-a-acne', 'cs': 'cs/blog/kde-se-objevuje-akne'},
]
LANGS = ('fr', 'en', 'es', 'it', 'de', 'nl', 'el', 'pl', 'pt', 'cs')
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
            lm, cf, pr = meta[loc] if lg not in ('it', 'de', 'nl', 'el', 'pl') else fr_meta
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
