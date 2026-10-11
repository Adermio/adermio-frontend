#!/usr/bin/env python3
"""Pré-remplit tr_el/<page>.py à partir du DÉCOUPAGE FR des tables néerlandaises (tr_nl/), colonne EL vide (None).

Seule la colonne FR est reprise, JAMAIS le néerlandais (la source de la traduction est le français).
Chaque littéral FR est vérifié sur la page EL préparée (prep_el.py) : absent (le FR a changé depuis le 09/10)
-> écarté et listé ; compte différent -> compte corrigé. Le texte FR nouveau sort ensuite dans qa_el.py.
N'écrase jamais une table existante.

Usage : python3 tests/i18n/el/seed_from_nl.py
"""
import importlib.util, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'nl'))
sys.path.insert(0, HERE)
import prep_nl, prep_el
NL2EL = {prep_nl.clean(prep_nl.PAGES[fr][0]): prep_el.clean(prep_el.PAGES[fr][0]) for fr in prep_el.PAGES}
NL = os.path.join(os.path.dirname(HERE), 'nl', 'tr_nl')
import build_nl
# table NL -> (table EL, page EL), par la page FR commune
FR_OF_NL = {v[0]: fr for fr, v in prep_nl.PAGES.items()}
NAME = lambda p: re.sub(r'[/-]', '_', prep_el.clean(p)[3:]) or 'home'

def load(path):
    spec = importlib.util.spec_from_file_location('t', path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

TABLES = {}
for nl_page, nl_name in build_nl.TABLES.items():
    fr = FR_OF_NL[nl_page]
    el_page = prep_el.PAGES[fr][0]
    el_name = 'blog_index' if el_page == 'el/blog/index.html' else NAME(el_page)
    TABLES[el_page] = el_name
    out = os.path.join(HERE, 'tr_el', el_name + '.py')
    if os.path.exists(out): print('existe déjà, ignoré :', out); continue
    m = load(os.path.join(NL, nl_name + '.py'))
    html = open(os.path.join(prep_el.ROOT, el_page), encoding='utf-8').read()
    lines = [f'# Table de traduction {el_page} (source : {fr})',
             '# Colonne de gauche = littéral FR EXACT de la page préparée (ne pas modifier) ; à droite : le grec.',
             '# None = pas encore traduit (apply_tr_el.py refuse). 3e valeur = nombre d\'occurrences attendu.',
             f'TARGET = {el_page!r}', 'TR = [']
    dropped = []
    for e in m.TR:
        s = e[0]
        for nl_p, el_p in sorted(NL2EL.items(), key=lambda kv: -len(kv[0])):
            s = re.sub(r'/' + re.escape(nl_p) + r'(?=["\'#?/`)])', '/' + el_p, s)
        s = s.replace('lang=nl', 'lang=el').replace("lang: 'nl'", "lang: 'el'")
        n = html.count(s)
        if n == 0: dropped.append(s); continue
        cnt = f', {n}' if len(e) > 2 or n > 1 else ''
        lines.append(f'    ({s!r},\n     None{cnt}),')
    lines += [']', 'REGEX = []']
    open(out, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(f'{el_name:24s} {len(m.TR)-len(dropped):4d} entrées  {len(dropped)} écartées' + ''.join(f'\n      écartée : {d[:80]!r}' for d in dropped))
print('TABLES =', TABLES)
