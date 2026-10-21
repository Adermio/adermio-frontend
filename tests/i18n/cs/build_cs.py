#!/usr/bin/env python3
"""Reconstruit TOUT le site tchèque depuis le FR : prep_cs -> tables tr_cs -> qa_cs.

Garantit que /cs/ est reproductible à l'octet près : toute correction doit passer
par une table tr_cs/*.py, jamais par une édition directe d'une page tchèque.

Usage : python3 tests/i18n/cs/build_cs.py          # reconstruit + contrôle
        python3 tests/i18n/cs/build_cs.py --check  # vérifie seulement que /cs/ = reconstruction
"""
import os, re, subprocess, sys, tempfile, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from prep_cs import PAGES, ROOT, clean, cs_path

# page CS -> table tr_cs/<nom>.py (nom dérivé du chemin, jamais écrit à la main)
NAME = lambda p: 'blog_index' if p == 'cs/blog/index.html' else re.sub(r'[/-]', '_', clean(p)[3:]) or 'home'
TABLES = {v[0]: NAME(v[0]) for v in PAGES.values()}

def run(*args):
    r = subprocess.run([sys.executable, *args], cwd=ROOT, capture_output=True, text=True)
    return r.returncode, (r.stdout + r.stderr).strip()

def main():
    check = '--check' in sys.argv
    cs_pages = [v[0] for v in PAGES.values()]
    missing = [p for p in cs_pages if p not in TABLES]
    assert not missing, f'pages sans table : {missing}'
    backup = {}
    if check:
        backup = {p: open(cs_path(p), encoding='utf-8').read() for p in cs_pages}
    rc, out = run(os.path.join(HERE, 'prep_cs.py'))
    if rc: print(out); sys.exit(1)
    failed = 0
    for page in cs_pages:
        rc, out = run(os.path.join(HERE, 'apply_tr_cs.py'), TABLES[page])
        if rc: failed += 1; print(f'ÉCHEC table {TABLES[page]} :\n{out}')
    rc, qa = run(os.path.join(HERE, 'qa_cs.py'))
    print(qa)
    drift = []
    if check:
        for p, before in backup.items():
            if open(cs_path(p), encoding='utf-8').read() != before: drift.append(p)
            open(cs_path(p), 'w', encoding='utf-8').write(before)
        print('Reconstruction identique aux pages en place' if not drift else f'DÉRIVE (page ≠ prep + table) : {drift}')
    sys.exit(1 if failed or rc or drift else 0)

if __name__ == '__main__':
    main()
