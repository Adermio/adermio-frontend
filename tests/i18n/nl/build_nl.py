#!/usr/bin/env python3
"""Reconstruit TOUT le site néerlandais depuis le FR : prep_nl -> tables tr_nl -> qa_nl.

Garantit que /nl/ est reproductible à l'octet près : toute correction doit passer
par une table tr_nl/*.py, jamais par une édition directe d'une page nl/*.html.

Usage : python3 tests/i18n/nl/build_nl.py          # reconstruit + contrôle
        python3 tests/i18n/nl/build_nl.py --check  # vérifie seulement que /nl/ = reconstruction
"""
import os, subprocess, sys, tempfile, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from prep_nl import PAGES, ROOT

# page NL -> table tr_nl/<nom>.py
TABLES = {
    'nl/home.html': 'home', 'nl/over-ons.html': 'over_ons', 'nl/contact.html': 'contact',
    'nl/feedback.html': 'feedback', 'nl/bronnen.html': 'bronnen', 'nl/form.html': 'form',
    'nl/processing.html': 'processing', 'nl/processing2.html': 'processing2', 'nl/success.html': 'success',
    'nl/premium.html': 'premium', 'nl/premium-second-cycle.html': 'premium_second_cycle',
    'nl/second-cycle.html': 'second_cycle', 'nl/analysis-in-progress-second-cycle.html': 'processing_second_cycle',
    'nl/bilan.html': 'bilan', 'nl/gebruiksvoorwaarden.html': 'gebruiksvoorwaarden',
    'nl/privacyverklaring.html': 'privacyverklaring', 'nl/juridische-informatie.html': 'juridische_informatie',
    'nl/blog/index.html': 'blog_index', 'nl/blog/huidtype-bepalen.html': 'blog_huidtype',
    'nl/blog/waarom-krijg-je-acne.html': 'blog_waarom_acne', 'nl/blog/hormonale-acne.html': 'blog_hormonale_acne',
    'nl/blog/waar-ontstaat-acne.html': 'blog_waar_acne',
}

def run(*args):
    r = subprocess.run([sys.executable, *args], cwd=ROOT, capture_output=True, text=True)
    return r.returncode, (r.stdout + r.stderr).strip()

def main():
    check = '--check' in sys.argv
    nl_pages = [v[0] for v in PAGES.values()]
    missing = [p for p in nl_pages if p not in TABLES]
    assert not missing, f'pages sans table : {missing}'
    backup = {}
    if check:
        backup = {p: open(os.path.join(ROOT, p), encoding='utf-8').read() for p in nl_pages}
    rc, out = run(os.path.join(HERE, 'prep_nl.py'))
    if rc: print(out); sys.exit(1)
    failed = 0
    for page in nl_pages:
        rc, out = run(os.path.join(HERE, 'apply_tr_nl.py'), TABLES[page])
        if rc: failed += 1; print(f'ÉCHEC table {TABLES[page]} :\n{out}')
    rc, qa = run(os.path.join(HERE, 'qa_nl.py'))
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
