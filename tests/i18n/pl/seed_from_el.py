#!/usr/bin/env python3
"""Pré-remplit tr_pl/<page>.py à partir du DÉCOUPAGE FR des tables grecques (tr_el/), colonne PL vide (None).

Seule la colonne FR est reprise, JAMAIS le grec (la source de la traduction est le français).
Chaque littéral FR est vérifié sur la page PL préparée (prep_pl.py) : absent (le FR a changé depuis le 11/10)
-> écarté et listé ; compte différent -> compte corrigé. Le texte FR nouveau sort ensuite dans qa_pl.py.
Les REGEX grecques sont recopiées EN COMMENTAIRE (à réécrire en polonais si besoin).
N'écrase jamais une table existante.

Usage : python3 tests/i18n/pl/seed_from_el.py
"""
import importlib.util, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'el'))
sys.path.insert(0, HERE)
import prep_el, prep_pl, build_el, build_pl

EL2PL = {prep_el.clean(prep_el.PAGES[fr][0]): prep_pl.clean(prep_pl.PAGES[fr][0]) for fr in prep_pl.PAGES}
FR_OF_EL = {v[0]: fr for fr, v in prep_el.PAGES.items()}
EL_DIR = os.path.join(os.path.dirname(HERE), 'el', 'tr_el')

def load(path):
    spec = importlib.util.spec_from_file_location('t', path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

def to_pl(s):
    for el_p, pl_p in sorted(EL2PL.items(), key=lambda kv: -len(kv[0])):
        s = re.sub(r'/' + re.escape(el_p) + r'(?=["\'#?/`)])', '/' + pl_p, s)
    return s.replace('lang=el', 'lang=pl').replace("lang: 'el'", "lang: 'pl'")

os.makedirs(os.path.join(HERE, 'tr_pl'), exist_ok=True)
for el_page, el_name in build_el.TABLES.items():
    fr = FR_OF_EL[el_page]
    pl_page = prep_pl.PAGES[fr][0]
    pl_name = build_pl.TABLES[pl_page]
    out = os.path.join(HERE, 'tr_pl', pl_name + '.py')
    if os.path.exists(out): print('existe déjà, ignoré :', out); continue
    m = load(os.path.join(EL_DIR, el_name + '.py'))
    html = open(os.path.join(prep_pl.ROOT, pl_page), encoding='utf-8').read()
    lines = [f'# Table de traduction {pl_page} (source : {fr})',
             '# Colonne de gauche = littéral FR EXACT de la page préparée (ne pas modifier) ; à droite : le polonais.',
             '# None = pas encore traduit (apply_tr_pl.py refuse). 3e valeur = nombre d\'occurrences attendu.',
             f'TARGET = {pl_page!r}', 'TR = [']
    dropped = []
    for e in m.TR:
        s = to_pl(e[0])
        n = html.count(s)
        if n == 0: dropped.append(s); continue
        cnt = f', {n}' if len(e) > 2 or n > 1 else ''
        lines.append(f'    ({s!r},\n     None{cnt}),')
    lines.append(']')
    regs = getattr(m, 'REGEX', [])
    if regs:
        lines.append('# REGEX de la table grecque (motif FR, remplacement GREC) : à réécrire en polonais, puis décommenter :')
        lines += [f'#   ({to_pl(p)!r}, <polonais>),' for p, _r in regs]
    lines.append('REGEX = []')
    open(out, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(f'{pl_name:36s} {len(m.TR)-len(dropped):4d} entrées  {len(dropped)} écartées' + ''.join(f'\n      écartée : {d[:80]!r}' for d in dropped))
