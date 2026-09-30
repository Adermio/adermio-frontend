#!/usr/bin/env python3
"""Reconstruit TOUT le site allemand depuis le FR : prep_de -> tables tr_de -> qa_de.

Garantit que /de/ est reproductible à l'octet près : toute correction doit passer
par une table tr_de/*.py, jamais par une édition directe d'une page de/*.html.

Usage : python3 tests/i18n/de/build_de.py          # reconstruit + contrôle
        python3 tests/i18n/de/build_de.py --check  # vérifie seulement que /de/ = reconstruction
"""
import os, subprocess, sys, tempfile, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from prep_de import PAGES, ROOT

# page DE -> table tr_de/<nom>.py
TABLES = {
    'de/home.html': 'home', 'de/ueber-uns.html': 'ueber_uns', 'de/kontakt.html': 'kontakt',
    'de/feedback.html': 'feedback', 'de/quellen.html': 'quellen', 'de/form.html': 'form',
    'de/processing.html': 'processing', 'de/processing2.html': 'processing2', 'de/success.html': 'success',
    'de/premium.html': 'premium', 'de/premium-second-cycle.html': 'premium_second_cycle',
    'de/second-cycle.html': 'second_cycle', 'de/analysis-in-progress-second-cycle.html': 'processing_second_cycle',
    'de/bilan.html': 'bilan', 'de/nutzungsbedingungen.html': 'nutzungsbedingungen',
    'de/datenschutz.html': 'datenschutz', 'de/impressum.html': 'impressum',
    'de/blog/index.html': 'blog_index', 'de/blog/hauttyp-bestimmen.html': 'blog_hauttyp',
    'de/blog/warum-bekommt-man-akne.html': 'blog_warum_akne', 'de/blog/hormonelle-akne.html': 'blog_hormonelle_akne',
    'de/blog/wo-tritt-akne-auf.html': 'blog_wo_akne',
}

def run(*args):
    r = subprocess.run([sys.executable, *args], cwd=ROOT, capture_output=True, text=True)
    return r.returncode, (r.stdout + r.stderr).strip()

def main():
    check = '--check' in sys.argv
    de_pages = [v[0] for v in PAGES.values()]
    missing = [p for p in de_pages if p not in TABLES]
    assert not missing, f'pages sans table : {missing}'
    backup = {}
    if check:
        backup = {p: open(os.path.join(ROOT, p), encoding='utf-8').read() for p in de_pages}
    rc, out = run(os.path.join(HERE, 'prep_de.py'))
    if rc: print(out); sys.exit(1)
    failed = 0
    for page in de_pages:
        rc, out = run(os.path.join(HERE, 'apply_tr_de.py'), TABLES[page])
        if rc: failed += 1; print(f'ÉCHEC table {TABLES[page]} :\n{out}')
    rc, qa = run(os.path.join(HERE, 'qa_de.py'))
    print(qa)
    drift = []
    if check:
        for p, before in backup.items():
            if open(os.path.join(ROOT, p), encoding='utf-8').read() != before: drift.append(p)
            open(os.path.join(ROOT, p), 'w', encoding='utf-8').write(before)
        print('Reconstruction identique aux pages en place' if not drift else f'DÉRIVE (page ≠ prep + table) : {drift}')
    sys.exit(1 if failed or rc or drift else 0)

if __name__ == '__main__':
    main()
