#!/usr/bin/env python3
"""Applique une table de traduction (littéraux FR -> EL) à une page EL préparée.

Table = module Python dans tests/i18n/el/tr_el/<nom>.py exposant :
  TARGET = 'el/home.html'
  TR = [(fr, nl), (fr, nl, n), ...]   # n = nombre d'occurrences attendu (défaut : >= 1, toutes remplacées)
  REGEX = [(pattern, repl), ...]      # optionnel, appliqué après TR

Chaque entrée FR absente fait échouer le script : rien n'est écrit tant que
la table n'est pas exacte. Idempotent : relancer sur une page déjà traduite
échoue proprement (les FR ne sont plus trouvés) sans rien casser.

Usage : python3 tests/i18n/el/apply_tr_el.py home [--check]
"""
import importlib.util, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

def load(name):
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tr_el', name + '.py')
    spec = importlib.util.spec_from_file_location('tr_' + name, p)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m

# Grec : une majuscule ne porte pas d'accent (tonos). Le texte des éléments affichés en capitales
# (classe Tailwind « uppercase ») est désaccentué ici, quel que soit le navigateur ; le tréma est gardé,
# et ajouté quand l'accent séparait une diphtongue (« τσάι » -> « ΤΣΑΪ »).
TONOS = str.maketrans('άέήίόύώΆΈΉΊΌΎΏΐΰ', 'αεηιουωΑΕΗΙΟΥΩϊϋ')
DIPHT = re.compile(r'([αεοΑΕΟ])\u0301?([ιυ])')

def destress(text):
    text = re.sub(r'([άέόΆΈΌ])([ιυ])', lambda m: m.group(1) + {'ι': 'ϊ', 'υ': 'ϋ'}[m.group(2)], text)
    return text.translate(TONOS)

CAPS_EL = re.compile(r'(<(\w+)\b[^>]*\bclass="[^"]*\buppercase\b[^"]*"[^>]*>)(.*?)(</\2>)', re.S)

def caps_fix(html):
    def one(m):
        inner = re.sub(r'(^|>)([^<]+)', lambda t: t.group(1) + destress(t.group(2)), m.group(3))
        return m.group(1) + inner + m.group(4)
    return CAPS_EL.sub(one, html)

def main():
    name = sys.argv[1]
    check = '--check' in sys.argv
    m = load(name)
    path = os.path.join(ROOT, m.TARGET)
    html = open(path, encoding='utf-8').read()
    errors = []
    for entry in m.TR:
        fr, nl = entry[0], entry[1]
        want = entry[2] if len(entry) > 2 else None
        n = html.count(fr)
        if nl is None:
            errors.append(f'NON TRADUIT (None) : {fr[:90]!r}')
        elif n == 0:
            errors.append(f'ABSENT ({want or ">=1"}x attendu) : {fr[:90]!r}')
        elif want is not None and n != want:
            errors.append(f'{n}x trouvé, {want}x attendu : {fr[:90]!r}')
        else:
            html = html.replace(fr, nl)
    for pat, repl in getattr(m, 'REGEX', []):
        html, n = re.subn(pat, repl, html)
        if n == 0:
            errors.append(f'REGEX sans effet : {pat!r}')
    if errors:
        print(f'{len(errors)} problème(s) — rien écrit :')
        for e in errors: print('  ', e)
        sys.exit(1)
    if check:
        print(f'OK ({len(m.TR)} entrées, {len(getattr(m, "REGEX", []))} regex) — rien écrit (--check)')
        return
    html = caps_fix(html)
    open(path, 'w', encoding='utf-8').write(html)
    print(f'{m.TARGET} : {len(m.TR)} remplacements + {len(getattr(m, "REGEX", []))} regex appliqués')

if __name__ == '__main__':
    main()
