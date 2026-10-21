#!/usr/bin/env python3
"""Pré-remplit tr_cs/<page>.py à partir du DÉCOUPAGE FR des tables portugaises (tr_pt/), colonne CS vide (None).

Seule la colonne FR est reprise, JAMAIS le portugais (la source de la traduction est le français).
Chaque littéral FR est cherché sur la page CS préparée (prep_cs.py) EN SIMULANT l'application dans l'ordre de la table
(un littéral déjà consommé par une entrée précédente ne compte plus) : absent (le FR a changé depuis le 21/10) ->
écarté et listé ; compte différent -> compte corrigé. Le texte FR nouveau sort ensuite dans qa_cs.py.
Les REGEX portugaises sont recopiées EN COMMENTAIRE (à réécrire en tchèque) ; une REGEX sans texte portugais
(ex. `errorEl.textContent = e.message || "` -> texte fixe) est recopiée telle quelle.
N'écrase jamais une table existante.

Usage : python3 tests/i18n/cs/seed_from_pt.py
"""
import importlib.util, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'pt'))
sys.path.insert(0, HERE)
import prep_pt, prep_cs, build_pt, build_cs

PT2CS = {prep_pt.clean(prep_pt.PAGES[fr][0]): prep_cs.clean(prep_cs.PAGES[fr][0]) for fr in prep_cs.PAGES}
PT2CS['pt/blog'] = 'cs/blog'
FR_OF_PT = {v[0]: fr for fr, v in prep_pt.PAGES.items()}
PT_DIR = os.path.join(os.path.dirname(HERE), 'pt', 'tr_pt')

def load(path):
    spec = importlib.util.spec_from_file_location('t', path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

def to_cs(s):
    for pt_p, cs_p in sorted(PT2CS.items(), key=lambda kv: -len(kv[0])):
        s = re.sub(r'/' + re.escape(pt_p) + r'(?=["\'#?/`)]|$)', '/' + cs_p, s)
    return (s.replace('lang=pt', 'lang=cs').replace("lang: 'pt'", "lang: 'cs'")
             .replace('"lang", "pt"', '"lang", "cs"')
             .replace('analyse-gratuite-pt-web', prep_cs.CS_FREE_WEBHOOK)
             .replace('second-cycle-pt', prep_cs.CS_SECOND_CYCLE_WEBHOOK))

def neutral(repl):
    """Remplacement sans texte portugais (identifiants JS seulement) ?"""
    rest = re.sub(r'[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)+|\\\d', ' ', repl)
    return not re.search(r'[A-Za-zÀ-ÿ]{3,}', rest)

os.makedirs(os.path.join(HERE, 'tr_cs'), exist_ok=True)
total = 0
for pt_page, pt_name in build_pt.TABLES.items():
    fr = FR_OF_PT[pt_page]
    cs_page = prep_cs.PAGES[fr][0]
    cs_name = build_cs.TABLES[cs_page]
    out = os.path.join(HERE, 'tr_cs', cs_name + '.py')
    if os.path.exists(out): print('existe déjà, ignoré :', out); continue
    m = load(os.path.join(PT_DIR, pt_name + '.py'))
    html = open(prep_cs.cs_path(cs_page), encoding='utf-8').read()
    lines = [f'# Table de traduction {cs_page} (source : {fr})',
             '# Colonne de gauche = littéral FR EXACT de la page préparée (ne pas modifier) ; à droite : le tchèque.',
             '# None = pas encore traduit (apply_tr_cs.py refuse). 3e valeur = nombre d\'occurrences attendu.',
             f'TARGET = {cs_page!r}', 'TR = [']
    dropped, seen, kept = [], set(), 0
    for i, e in enumerate(m.TR):
        s = to_cs(e[0])
        if s in seen: continue
        seen.add(s)
        n = html.count(s)
        if n == 0: dropped.append(s); continue
        html = html.replace(s, f'\x00{i}\x00')   # simulation : ce littéral est consommé
        kept += 1
        cnt = f', {n}' if len(e) > 2 or n > 1 else ''
        lines.append(f'    ({s!r},\n     None{cnt}),')
    lines.append(']')
    regs = getattr(m, 'REGEX', [])
    active = [(p, r) for p, r in regs if neutral(r)]
    todo = [(p, r) for p, r in regs if not neutral(r)]
    if todo:
        lines.append('# REGEX de la table portugaise (motif FR ; remplacement PORTUGAIS montré pour le sens) : à réécrire en tchèque, puis décommenter :')
        lines += [f'#   ({to_cs(p)!r}, {r!r}),' for p, r in todo]
    if active:
        lines.append('# REGEX sans texte (reprise telle quelle de la table portugaise) :')
        lines.append('REGEX = [')
        lines += [f'    ({to_cs(p)!r}, {r!r}),' for p, r in active]
        lines.append(']')
    else:
        lines.append('REGEX = []')
    open(out, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    total += kept
    print(f'{cs_name:36s} {kept:4d} entrées  {len(dropped)} écartées  REGEX {len(active)} active(s) / {len(todo)} à réécrire'
          + ''.join(f'\n      écartée : {d[:80]!r}' for d in dropped))
print(f'TOTAL {total} entrées')
