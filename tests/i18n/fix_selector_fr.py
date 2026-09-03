#!/usr/bin/env python3
"""Répare le lien « Français » du sélecteur de langue des pages IT (bug de la 1re génération : réécrit vers /it/)."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prep_it import PAGES, ROOT
targets = sys.argv[1:] or [v[0] for v in PAGES.values()]
for it_rel in targets:
    fr_rel = [k for k, v in PAGES.items() if v[0] == it_rel][0]
    fr_url = 'https://adermio.com/' + ('' if fr_rel == 'index.html' else re.sub(r'/index$', '', re.sub(r'\.html$', '', fr_rel)))
    p = os.path.join(ROOT, it_rel); s = open(p, encoding='utf-8').read()
    i = s.find('<div class="lang-dropdown')
    if i < 0: print('skip (pas de sélecteur)', it_rel); continue
    blk = s[i:i+3000]
    new, n = re.subn(r'<a href="[^"]+"([^>]*>\s*<img src="https://flagcdn.com/fr.svg)', r'<a href="' + fr_url + r'"\1', blk, count=1)
    if n: open(p, 'w', encoding='utf-8').write(s[:i] + new + s[i+3000:]); print('fixé', it_rel, '->', fr_url)
    else: print('!! non trouvé', it_rel)
