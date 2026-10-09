#!/usr/bin/env python3
"""Applique les corrections des relecteurs (tests/i18n/nl/revue/R*_corrections.py) aux tables tr_nl/.

Format d'un fichier de corrections :
    CORR = [
        # (table, littéral FR EXACT de la table, NL actuel EXACT, NL proposé, raison courte, gravité)
        ('home', 'Analyse gratuite de votre peau', 'Gratis analyse van je huid', 'Gratis huidanalyse', 'glossaire', 'améliore'),
    ]
Gravité : 'bloquant' | 'améliore' | 'goût'.

Contrôles : la table existe, l'entrée existe, le NL actuel est bien celui de la table (sinon la correction a été
écrite sur une version périmée → refusée), et deux relecteurs qui proposent des textes DIFFÉRENTS pour la même
entrée sont signalés en CONFLIT (rien n'est appliqué pour cette entrée ; arbitrage à faire à la main).

Arbitrages : revue/ARBITRAGE.py (OVERRIDE = {(table, fr): nl} prime sur toute proposition ; EXCLUDE = {(relecteur, table, fr)}).

Usage : python3 tests/i18n/nl/apply_corrections.py [--dry-run] [--only R1,R3] [--skip-gout]
"""
import glob, importlib.util, os, sys
from collections import defaultdict
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from set_nl import set_nl, get_nl

def load(p):
    spec = importlib.util.spec_from_file_location('c', p)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m.CORR

def main():
    dry = '--dry-run' in sys.argv
    skip_gout = '--skip-gout' in sys.argv
    only = None
    if '--only' in sys.argv:
        only = set(sys.argv[sys.argv.index('--only') + 1].split(','))
    by_entry = defaultdict(list)
    refused = []
    arb = os.path.join(HERE, 'revue', 'ARBITRAGE.py')
    OVERRIDE, EXCLUDE = {}, set()
    if os.path.exists(arb):
        spec = importlib.util.spec_from_file_location('arb', arb)
        a = importlib.util.module_from_spec(spec); spec.loader.exec_module(a)
        OVERRIDE, EXCLUDE = getattr(a, 'OVERRIDE', {}), set(getattr(a, 'EXCLUDE', set()))
    for p in sorted(glob.glob(os.path.join(HERE, 'revue', 'R*_corrections.py'))):
        rid = os.path.basename(p).split('_')[0]
        if only and rid not in only: continue
        for c in load(p):
            table, fr, cur, new, why, sev = c
            if skip_gout and sev == 'goût': continue
            if (rid, table, fr) in EXCLUDE or (table, fr) in OVERRIDE: continue
            if not os.path.exists(os.path.join(HERE, 'tr_nl', table + '.py')):
                refused.append((rid, table, fr, 'table inconnue')); continue
            actual = get_nl(table, fr)
            if actual is None:
                refused.append((rid, table, fr, 'littéral FR introuvable')); continue
            if actual != cur and actual != new:
                refused.append((rid, table, fr, f'NL actuel différent : {actual[:60]!r}')); continue
            by_entry[(table, fr)].append((rid, new, why, sev, actual == new))
    for (table, fr), new in OVERRIDE.items():  # arbitrages du PDG / de Claude : priment sur toute proposition
        actual = get_nl(table, fr)
        if actual is None:
            refused.append(('ARB', table, fr, 'littéral FR introuvable')); continue
        if actual != new: by_entry[(table, fr)] = [('ARB', new, 'arbitrage', 'arbitrage', False)]
    applied = conflicts = 0
    for (table, fr), props in by_entry.items():
        texts = {n for _, n, *_ in props}
        if len(texts) > 1:
            conflicts += 1
            print(f'CONFLIT {table} : {fr[:70]!r}')
            for rid, n, why, sev, _ in props: print(f'    {rid} [{sev}] {n[:90]!r} — {why}')
            continue
        rid, new, why, sev, done = props[0]
        if done: continue
        if not dry: set_nl(table, fr, new)
        applied += 1
    for rid, table, fr, why in refused:
        print(f'REFUSÉ {rid} {table} : {fr[:70]!r} — {why}')
    print(f'{applied} correction(s) {"à appliquer" if dry else "appliquée(s)"}, {conflicts} conflit(s), {len(refused)} refusée(s)')
    sys.exit(1 if refused or conflicts else 0)

if __name__ == '__main__':
    main()
