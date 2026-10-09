#!/usr/bin/env python3
"""Vérifie la syntaxe des scripts inline des pages NL (node --check), script par script, contre le FR.

Une casse n'est signalée que si le script FR correspondant passe (sinon le défaut est hérité du FR).
Les blocs JSON-LD sont vérifiés avec json.loads.

Usage : python3 tests/i18n/nl/jscheck_nl.py [nl/home.html ...]
"""
import json, os, re, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prep_nl import PAGES, ROOT

SCRIPT = re.compile(r'<script(?P<attrs>[^>]*)>(?P<body>.*?)</script>', re.S)

def scripts(html):
    out = []
    for m in SCRIPT.finditer(html):
        a = m.group('attrs')
        if 'src=' in a: continue
        kind = 'json' if 'ld+json' in a else ('module' if 'module' in a else 'js')
        out.append((kind, m.group('body')))
    return out

def node_ok(code, module=False):
    with tempfile.NamedTemporaryFile('w', suffix='.mjs' if module else '.js', delete=False, encoding='utf-8') as f:
        f.write(code); p = f.name
    try:
        r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
        return r.returncode == 0, (r.stderr.strip().split('\n') or [''])[0:5]
    finally:
        os.unlink(p)

def check(nl_rel):
    fr_rel = [k for k, v in PAGES.items() if v[0] == nl_rel][0]
    fr = scripts(open(os.path.join(ROOT, fr_rel), encoding='utf-8').read())
    nl = scripts(open(os.path.join(ROOT, nl_rel), encoding='utf-8').read())
    errs = []
    if len(fr) != len(nl): errs.append(f'{len(fr)} scripts FR vs {len(nl)} NL')
    for i, ((kf, cf), (kn, cn)) in enumerate(zip(fr, nl)):
        if kn == 'json':
            try: json.loads(cn)
            except Exception as e:
                try: json.loads(cf); errs.append(f'JSON-LD #{i} invalide : {e}')
                except Exception: pass
            continue
        ok, msg = node_ok(cn, kn == 'module')
        if not ok and node_ok(cf, kf == 'module')[0]:
            errs.append(f'script #{i} cassé : ' + ' | '.join(msg))
    return errs

if __name__ == '__main__':
    targets = sys.argv[1:] or [v[0] for v in PAGES.values()]
    bad = 0
    for t in targets:
        e = check(t)
        print(('OK ' if not e else 'XX ') + t + ('' if not e else '\n      ' + '\n      '.join(e)))
        bad += len(e)
    sys.exit(1 if bad else 0)
