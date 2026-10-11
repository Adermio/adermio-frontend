#!/usr/bin/env python3
"""Reconstruit TOUT le site grec depuis le FR : prep_el -> tables tr_el -> qa_el.

Garantit que /el/ est reproductible à l'octet près : toute correction doit passer
par une table tr_el/*.py, jamais par une édition directe d'une page el/*.html.

Usage : python3 tests/i18n/el/build_el.py          # reconstruit + contrôle
        python3 tests/i18n/el/build_el.py --check  # vérifie seulement que /el/ = reconstruction
"""
import os, subprocess, sys, tempfile, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from prep_el import PAGES, ROOT

# page EL -> table tr_el/<nom>.py
TABLES = {'el/home.html': 'home', 'el/schetika-me-emas.html': 'schetika_me_emas', 'el/epikoinonia.html': 'epikoinonia', 'el/feedback.html': 'feedback', 'el/piges.html': 'piges', 'el/form.html': 'form', 'el/processing.html': 'processing', 'el/processing2.html': 'processing2', 'el/success.html': 'success', 'el/premium.html': 'premium', 'el/premium-second-cycle.html': 'premium_second_cycle', 'el/second-cycle.html': 'second_cycle', 'el/analysis-in-progress-second-cycle.html': 'analysis_in_progress_second_cycle', 'el/bilan.html': 'bilan', 'el/oroi-chrisis.html': 'oroi_chrisis', 'el/politiki-aporritou.html': 'politiki_aporritou', 'el/nomikes-plirofories.html': 'nomikes_plirofories', 'el/blog/index.html': 'blog_index', 'el/blog/typos-epidermidas.html': 'blog_typos_epidermidas', 'el/blog/giati-vgazoume-akmi.html': 'blog_giati_vgazoume_akmi', 'el/blog/ormoniki-akmi.html': 'blog_ormoniki_akmi', 'el/blog/pou-emfanizetai-akmi.html': 'blog_pou_emfanizetai_akmi'}

def run(*args):
    r = subprocess.run([sys.executable, *args], cwd=ROOT, capture_output=True, text=True)
    return r.returncode, (r.stdout + r.stderr).strip()

def main():
    check = '--check' in sys.argv
    el_pages = [v[0] for v in PAGES.values()]
    missing = [p for p in el_pages if p not in TABLES]
    assert not missing, f'pages sans table : {missing}'
    backup = {}
    if check:
        backup = {p: open(os.path.join(ROOT, p), encoding='utf-8').read() for p in el_pages}
    rc, out = run(os.path.join(HERE, 'prep_el.py'))
    if rc: print(out); sys.exit(1)
    failed = 0
    for page in el_pages:
        rc, out = run(os.path.join(HERE, 'apply_tr_el.py'), TABLES[page])
        if rc: failed += 1; print(f'ÉCHEC table {TABLES[page]} :\n{out}')
    rc, qa = run(os.path.join(HERE, 'qa_el.py'))
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
