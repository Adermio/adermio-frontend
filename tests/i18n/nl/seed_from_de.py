#!/usr/bin/env python3
"""Pré-remplit tr_nl/<page>.py à partir du DÉCOUPAGE FR des tables allemandes (tr_de/), colonne NL vide (None).

Le découpage allemand est prouvé à l'octet près sur le FR actuel (build_de.py --check) : le reprendre garantit
que chaque littéral FR existe dans la page NL préparée, dans le bon ordre, avec le bon compte.
Seule la colonne FR est reprise, JAMAIS l'allemand (la source de la traduction est le français).
Les REGEX allemandes sont recopiées en COMMENTAIRE : la plupart sont propres à l'allemand (Impressum, nombres).
N'écrase jamais une table existante.

Usage : python3 tests/i18n/nl/seed_from_de.py
"""
import importlib.util, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'de'))
sys.path.insert(0, HERE)
import prep_de, prep_nl
# page DE -> page NL (même source FR)
DE2NL = {prep_de.clean(prep_de.PAGES[fr][0]): prep_nl.clean(prep_nl.PAGES[fr][0]) for fr in prep_nl.PAGES}
DE = os.path.join(os.path.dirname(HERE), 'de', 'tr_de')

# table DE -> (table NL, page NL)
MAP = {
    'home': ('home', 'nl/home.html'), 'ueber_uns': ('over_ons', 'nl/over-ons.html'),
    'kontakt': ('contact', 'nl/contact.html'), 'feedback': ('feedback', 'nl/feedback.html'),
    'quellen': ('bronnen', 'nl/bronnen.html'), 'form': ('form', 'nl/form.html'),
    'processing': ('processing', 'nl/processing.html'), 'processing2': ('processing2', 'nl/processing2.html'),
    'success': ('success', 'nl/success.html'), 'premium': ('premium', 'nl/premium.html'),
    'premium_second_cycle': ('premium_second_cycle', 'nl/premium-second-cycle.html'),
    'second_cycle': ('second_cycle', 'nl/second-cycle.html'),
    'processing_second_cycle': ('processing_second_cycle', 'nl/analysis-in-progress-second-cycle.html'),
    'bilan': ('bilan', 'nl/bilan.html'),
    'nutzungsbedingungen': ('gebruiksvoorwaarden', 'nl/gebruiksvoorwaarden.html'),
    'datenschutz': ('privacyverklaring', 'nl/privacyverklaring.html'),
    'impressum': ('juridische_informatie', 'nl/juridische-informatie.html'),
    'blog_index': ('blog_index', 'nl/blog/index.html'), 'blog_hauttyp': ('blog_huidtype', 'nl/blog/huidtype-bepalen.html'),
    'blog_warum_akne': ('blog_waarom_acne', 'nl/blog/waarom-krijg-je-acne.html'),
    'blog_hormonelle_akne': ('blog_hormonale_acne', 'nl/blog/hormonale-acne.html'),
    'blog_wo_akne': ('blog_waar_acne', 'nl/blog/waar-ontstaat-acne.html'),
}

def load(path):
    spec = importlib.util.spec_from_file_location('t', path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

for de_name, (nl_name, target) in MAP.items():
    out = os.path.join(HERE, 'tr_nl', nl_name + '.py')
    if os.path.exists(out): print('existe déjà, ignoré :', out); continue
    m = load(os.path.join(DE, de_name + '.py'))
    src = [k for k in open(os.path.join(DE, de_name + '.py'), encoding='utf-8').read().split('\n') if k.startswith('# Table')]
    lines = [f'# Table de traduction {target} — {src[0][2:] if src else ""}'.rstrip(),
             '# Colonne de gauche = littéral FR EXACT de la page préparée (ne pas modifier) ; à droite : le néerlandais.',
             '# None = pas encore traduit (apply_tr_nl.py refuse). 3e valeur = nombre d\'occurrences attendu.',
             f'TARGET = {target!r}', 'TR = [']
    for e in m.TR:
        n = f', {e[2]}' if len(e) > 2 else ''
        fr = e[0]
        for de_p, nl_p in DE2NL.items():  # liens internes du squelette allemand -> squelette néerlandais
            fr = re.sub(r'/' + re.escape(de_p) + r'(?=["\'#?/])', '/' + nl_p, fr)
        assert '/de/' not in fr, (de_name, fr[:80])
        lines.append(f'    ({fr!r},\n     None{n}),')
    lines += [']', 'REGEX = []']
    rx = getattr(m, 'REGEX', [])
    if rx:
        lines.append('# REGEX de la table allemande, pour information (propres à l\'allemand sauf mention) :')
        for pat, rep in rx:
            lines.append(f'#   ({pat!r}, {rep!r})')
    open(out, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(f'{nl_name:24s} {len(m.TR):4d} entrées  {len(rx)} regex DE en commentaire')
