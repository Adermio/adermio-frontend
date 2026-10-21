#!/usr/bin/env python3
"""Fixe la traduction tchèque d'un littéral FR dans TOUTES les tables où il apparaît (harmonisation, corrections
de relecture). Réécrit seulement la valeur tchèque du tuple (repérée par l'AST), le reste du fichier est intact.

Usage : python3 tests/i18n/cs/set_cs.py corrections.json [--dry-run]
  corrections.json = [{"fr": "<littéral FR exact>", "cs": "<nouveau tchèque>", "tables": ["home", ...]}]
  « tables » est facultatif (défaut : toutes les tables où le littéral FR existe).
Puis : python3 tests/i18n/cs/build_cs.py
"""
import ast, glob, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))

def entries(src):
    """(fr, nœud de la valeur CS) pour chaque tuple de TR."""
    tree = ast.parse(src)
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(t, 'id', None) == 'TR' for t in node.targets):
            for elt in node.value.elts:
                if isinstance(elt, ast.Tuple) and len(elt.elts) >= 2 and isinstance(elt.elts[0], ast.Constant):
                    yield elt.elts[0].value, elt.elts[1]

def offset(src, lineno, col):
    """Position en OCTETS UTF-8 (col_offset de l'AST est en octets)."""
    lines = src.split('\n')
    return sum(len(l.encode('utf-8')) + 1 for l in lines[:lineno - 1]) + col

def apply(fr, cs, tables, dry):
    done = []
    for path in sorted(glob.glob(os.path.join(HERE, 'tr_cs', '*.py'))):
        name = os.path.basename(path)[:-3]
        if tables and name not in tables: continue
        raw = open(path, 'rb').read()
        src = raw.decode('utf-8')
        spans = [(n.lineno, n.col_offset, n.end_lineno, n.end_col_offset) for f, n in entries(src) if f == fr]
        if not spans: continue
        for (l1, c1, l2, c2) in sorted(spans, reverse=True):   # offsets AST = octets UTF-8
            a, b = offset(src, l1, c1), offset(src, l2, c2)
            raw = raw[:a] + repr(cs).encode('utf-8') + raw[b:]
        if not dry: open(path, 'wb').write(raw)
        done.append(f'{name}({len(spans)})')
    return done

if __name__ == '__main__':
    dry = '--dry-run' in sys.argv
    fixes = json.load(open([a for a in sys.argv[1:] if not a.startswith('--')][0], encoding='utf-8'))
    missing = 0
    for f in fixes:
        done = apply(f['fr'], f["cs"], f.get('tables'), dry)
        if not done: missing += 1
        print(('OK   ' if done else 'ABSENT ') + f['fr'][:70] + ' -> ' + ', '.join(done))
    sys.exit(1 if missing else 0)
