#!/usr/bin/env python3
"""Pré-remplit tr_pt/<page>.py à partir du DÉCOUPAGE FR des tables polonaises (tr_pl/), colonne PT vide (None).

Seule la colonne FR est reprise, JAMAIS le polonais (la source de la traduction est le français).
Chaque littéral FR est vérifié sur la page PT préparée (prep_pt.py) : absent (le FR a changé depuis le 14/10)
-> écarté et listé ; compte différent -> compte corrigé. Le texte FR nouveau sort ensuite dans qa_pt.py.
Les REGEX polonaises sont recopiées EN COMMENTAIRE (à réécrire en portugais si besoin).
N'écrase jamais une table existante.

Usage : python3 tests/i18n/pt/seed_from_pl.py
"""
import importlib.util, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'pl'))
sys.path.insert(0, HERE)
import prep_pl, prep_pt, build_pl, build_pt

PL2PT = {prep_pl.clean(prep_pl.PAGES[fr][0]): prep_pt.clean(prep_pt.PAGES[fr][0]) for fr in prep_pt.PAGES}
PL2PT['pl/blog'] = 'pt/blog'
FR_OF_PL = {v[0]: fr for fr, v in prep_pl.PAGES.items()}
PL_DIR = os.path.join(os.path.dirname(HERE), 'pl', 'tr_pl')

def load(path):
    spec = importlib.util.spec_from_file_location('t', path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

def to_pt(s):
    for pl_p, pt_p in sorted(PL2PT.items(), key=lambda kv: -len(kv[0])):
        s = re.sub(r'/' + re.escape(pl_p) + r'(?=["\'#?/`)]|$)', '/' + pt_p, s)
    return (s.replace('lang=pl', 'lang=pt').replace("lang: 'pl'", "lang: 'pt'")
             .replace('analyse-gratuite-pl-web', 'analyse-gratuite-pt-web').replace('second-cycle-pl', 'second-cycle-pt'))

os.makedirs(os.path.join(HERE, 'tr_pt'), exist_ok=True)
for pl_page, pl_name in build_pl.TABLES.items():
    fr = FR_OF_PL[pl_page]
    pt_page = prep_pt.PAGES[fr][0]
    pt_name = build_pt.TABLES[pt_page]
    out = os.path.join(HERE, 'tr_pt', pt_name + '.py')
    if os.path.exists(out): print('existe déjà, ignoré :', out); continue
    m = load(os.path.join(PL_DIR, pl_name + '.py'))
    html = open(prep_pt.pt_path(pt_page), encoding='utf-8').read()
    lines = [f'# Table de traduction {pt_page} (source : {fr})',
             '# Colonne de gauche = littéral FR EXACT de la page préparée (ne pas modifier) ; à droite : le portugais (Portugal).',
             '# None = pas encore traduit (apply_tr_pt.py refuse). 3e valeur = nombre d\'occurrences attendu.',
             f'TARGET = {pt_page!r}', 'TR = [']
    dropped, seen = [], set()
    for e in m.TR:
        s = to_pt(e[0])
        if s in seen: continue
        seen.add(s)
        n = html.count(s)
        if n == 0: dropped.append(s); continue
        cnt = f', {n}' if len(e) > 2 or n > 1 else ''
        lines.append(f'    ({s!r},\n     None{cnt}),')
    lines.append(']')
    regs = getattr(m, 'REGEX', [])
    if regs:
        lines.append('# REGEX de la table polonaise (motif FR ; remplacement POLONAIS montré pour le sens) : à réécrire en portugais, puis décommenter :')
        lines += [f'#   ({to_pt(p)!r}, {r!r}),' for p, r in regs]
    lines.append('REGEX = []')
    open(out, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(f'{pt_name:36s} {len(m.TR)-len(dropped):4d} entrées  {len(dropped)} écartées' + ''.join(f'\n      écartée : {d[:80]!r}' for d in dropped))
