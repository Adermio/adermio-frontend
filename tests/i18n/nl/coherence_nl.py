#!/usr/bin/env python3
"""Cohérence entre tables : un même littéral FR (avis client, pied de page, menu, CTA…) doit avoir la MÊME
traduction néerlandaise dans toutes les tables où il apparaît. Liste les divergences.

Compare aussi les témoignages à la référence tr_nl/home.py en ignorant le balisage autour
(un avis découpé différemment d'une page à l'autre reste comparé sur son texte).

Usage : python3 tests/i18n/nl/coherence_nl.py
"""
import glob, importlib.util, os, re, sys
from collections import defaultdict
HERE = os.path.dirname(os.path.abspath(__file__))

def load(path):
    spec = importlib.util.spec_from_file_location('t', path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

def text(s):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s or '')).strip()

def main():
    by_fr = defaultdict(dict)
    for p in sorted(glob.glob(os.path.join(HERE, 'tr_nl', '*.py'))):
        name = os.path.basename(p)[:-3]
        for e in load(p).TR:
            if e[1] is not None:
                by_fr[e[0]][name] = e[1]
    bad = 0
    for fr, tr in by_fr.items():
        if len(set(tr.values())) > 1:
            # même texte une fois le balisage retiré ? (balises d'origine différentes dans le FR = pas une divergence)
            if len({text(v) for v in tr.values()}) == 1: continue
            bad += 1
            print(f'— FR : {text(fr)[:110]}')
            for t, v in tr.items(): print(f'    {t:24s} {text(v)[:110]}')
    # témoignages et phrases longues : même texte FR (sans balises) => même texte NL (sans balises)
    by_text = defaultdict(dict)
    for fr, tr in by_fr.items():
        k = text(fr)
        if len(k.split()) >= 8:
            for t, v in tr.items(): by_text[k].setdefault(t, set()).add(text(v))
    for k, tr in by_text.items():
        vals = {v for s in tr.values() for v in s}
        if len(tr) > 1 and len(vals) > 1:
            bad += 1
            print(f'— FR (texte) : {k[:110]}')
            for t, s in tr.items():
                for v in s: print(f'    {t:24s} {v[:110]}')
    print('Cohérence : OK' if not bad else f'Cohérence : {bad} divergence(s)')
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main()
