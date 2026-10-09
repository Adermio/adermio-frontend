#!/usr/bin/env python3
"""Remplace la traduction NL d'une entrée de table, repérée par son littéral FR exact, sans toucher au reste du fichier.

S'appuie sur l'AST (positions exactes de la chaîne NL), donc indifférent au style de guillemets des tables.
Utilisé pour harmoniser et appliquer les corrections de relecture : la correction vit dans la table, la page
se reconstruit (prep_nl + apply_tr_nl), rien n'est édité à la main dans nl/*.html.

En module : set_nl(table, fr, nl_nouveau) -> nombre d'entrées modifiées.
"""
import ast, os
HERE = os.path.dirname(os.path.abspath(__file__))

def _offsets(src):
    lines = src.split('\n'); out = [0]
    for l in lines: out.append(out[-1] + len(l) + 1)
    return out

def set_nl(table, fr, new_nl, expect=1):
    path = os.path.join(HERE, 'tr_nl', table + '.py')
    src = open(path, encoding='utf-8').read()
    tree = ast.parse(src)
    off = _offsets(src)
    spans = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign) and any(getattr(t, 'id', None) == 'TR' for t in node.targets):
            for elt in node.value.elts:
                if isinstance(elt, ast.Tuple) and len(elt.elts) >= 2:
                    f, n = elt.elts[0], elt.elts[1]
                    if isinstance(f, ast.Constant) and f.value == fr:
                        spans.append((off[n.lineno - 1] + n.col_offset, off[n.end_lineno - 1] + n.end_col_offset))
    if len(spans) != expect:
        raise SystemExit(f'{table}: {len(spans)} entrée(s) trouvée(s) pour {fr[:70]!r} (attendu {expect})')
    for a, b in sorted(spans, reverse=True):
        src = src[:a] + repr(new_nl) + src[b:]
    ast.parse(src)
    open(path, 'w', encoding='utf-8').write(src)
    return len(spans)

def get_nl(table, fr):
    path = os.path.join(HERE, 'tr_nl', table + '.py')
    tree = ast.parse(open(path, encoding='utf-8').read())
    for node in ast.walk(tree):
        if isinstance(node, ast.Tuple) and len(node.elts) >= 2 and isinstance(node.elts[0], ast.Constant) and node.elts[0].value == fr:
            return node.elts[1].value
    return None
