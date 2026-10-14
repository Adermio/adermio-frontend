#!/usr/bin/env python3
"""Prépare le squelette polonais d'une page à partir de la page FR (dérivé de prep_el.py).

Applique UNIQUEMENT les transformations non textuelles (lang, canonical, og:url,
og:locale, hreflang, carte de liens, sélecteur de langue, webhooks, lang JS,
visuels anglais, liens d'abonnement FR retirés du pied de page).
Le texte reste en français : la traduction se fait ensuite, littéral par littéral
(apply_tr_pl.py + tr_pl/).
Polices : inchangées (DM Sans, Playfair, Inter couvrent ą ę ł ś ź ż ć ń ó).

Usage : python3 tests/i18n/pl/prep_pl.py              # toutes les pages
        python3 tests/i18n/pl/prep_pl.py index.html   # une page
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'el'))
import prep_el

ROOT = prep_el.ROOT
clean = prep_el.clean
block_end = prep_el.block_end
VISUALS = prep_el.VISUALS
FR_ONLY_FOOTER = prep_el.FR_ONLY_FOOTER
SEL_BTN = prep_el.SEL_BTN

# Pages de contenu : noms polonais sans diacritiques ; pages de parcours : mêmes noms que les autres langues
# (le backend construit /pl/success, /pl/premium…).
PL_NAMES = {
    'index.html': 'pl/home.html', 'about.html': 'pl/o-nas.html', 'formulaire.html': 'pl/form.html',
    'contact.html': 'pl/kontakt.html', 'conditions.html': 'pl/regulamin.html',
    'confidentialite.html': 'pl/polityka-prywatnosci.html', 'mentions-legales.html': 'pl/informacje-prawne.html',
    'sources.html': 'pl/zrodla.html', 'feedback.html': 'pl/feedback.html', 'success.html': 'pl/success.html',
    'premium.html': 'pl/premium.html', 'premium-second-cycle.html': 'pl/premium-second-cycle.html',
    'second-cycle.html': 'pl/second-cycle.html', 'bilan.html': 'pl/bilan.html',
    'analyse-en-cours.html': 'pl/processing.html', 'analyse-en-cours2.html': 'pl/processing2.html',
    'analyse-en-cours-second-cycle.html': 'pl/analysis-in-progress-second-cycle.html',
    'blog/index.html': 'pl/blog/index.html',
    'blog/comment-connaitre-son-type-de-peau.html': 'pl/blog/typ-skory.html',
    'blog/pourquoi-a-t-on-de-l-acne.html': 'pl/blog/skad-sie-bierze-tradzik.html',
    'blog/acne-hormonale.html': 'pl/blog/tradzik-hormonalny.html',
    'blog/ou-apparait-l-acne.html': 'pl/blog/gdzie-pojawia-sie-tradzik.html',
    # Warunki sprzedaży (CGV) ; strona anulowania subskrypcji : ukryta (noindex), jak w innych językach
    'cgv.html': 'pl/warunki-sprzedazy.html', 'resilier.html': 'pl/anuluj-subskrypcje.html',
}
# FR source -> (PL cible, jumeau EN, ES, IT, DE, NL, EL)   (jumeaux = sélecteur de langue)
PAGES = {fr: (PL_NAMES[fr], *v[1:], clean(v[0])) for fr, v in prep_el.PAGES.items()}
assert set(PAGES) == set(PL_NAMES), set(PAGES) ^ set(PL_NAMES)

# Webhooks de l'analyse polonaise : à créer dans n8n (phase 2) avec CES chemins, jamais déduits du FR.
# Tant qu'ils n'existent pas, /pl/ reste caché (noindex, hors sélecteur des autres langues).
PL_FREE_WEBHOOK = 'analyse-gratuite-pl-web'

LINKMAP = {clean(fr) if fr != 'index.html' else '': clean(pl) for fr, (pl, *_rest) in PAGES.items()}
LINKMAP['blog'] = 'pl/blog'
LINKMAP.pop('blog/index', None)
LINKMAP['formulaire2'] = 'pl/form'  # page FR sans jumeau, liée depuis des pages traduites
FR_PATHS = sorted([k for k in LINKMAP if k], key=len, reverse=True)

def rebuild_dropdown(html, twins):
    """Remplace le contenu du <div class="lang-dropdown ..."> : PL courant + EN/ES/IT/DE/NL/EL/FR."""
    start = html.find('<div class="lang-dropdown')
    if start < 0: return html, False
    end = block_end(html, start)
    if end < 0: return html, False
    block = html[start:end]
    m = re.search(r'\n([ \t]*)<a ', block)
    ind = m.group(1) if m else '                        '
    wm = re.search(r'flagcdn\.com/[a-z]+\.svg" width="(\d+)"', block)
    w = wm.group(1) if wm else '20'
    head = block[:block.find('>') + 1]
    def entry(href, flag, label, current):
        cls = ('flex items-center gap-3 px-4 py-3 text-sm font-medium bg-teal-50/50 text-teal-700' if current
               else 'flex items-center gap-3 px-4 py-3 text-sm font-medium text-adermio-dark hover:bg-gray-50 transition-colors')
        return (f'{ind}<a href="{href}" class="{cls}">\n'
                f'{ind}    <img src="https://flagcdn.com/{flag}.svg" width="{w}" alt="{label}" class="rounded-sm shadow-sm">\n'
                f'{ind}    <span>{label}</span>\n'
                f'{ind}</a>\n')
    en, es, it, de, nl, el = twins
    body = (entry('#', 'pl', 'Polski', True)
            + entry(f'https://adermio.com/{en}', 'us', 'English', False)
            + entry(f'https://adermio.com/{es}', 'es', 'Español', False)
            + entry(f'https://adermio.com/{it}', 'it', 'Italiano', False)
            + entry(f'https://adermio.com/{de}', 'de', 'Deutsch', False)
            + entry(f'https://adermio.com/{nl}', 'nl', 'Nederlands', False)
            + entry(f'https://adermio.com/{el}', 'gr', 'Ελληνικά', False)
            + entry('__FR_URL__', 'fr', 'Français', False))
    closing_ind = ind[:-4] if len(ind) >= 4 else ''
    return html[:start] + head + '\n' + body + closing_ind + '</div>' + html[end:], True

def transform(fr_rel):
    pl_rel, *twins = PAGES[fr_rel]
    html = open(os.path.join(ROOT, fr_rel), encoding='utf-8').read()
    fr_clean = '' if fr_rel == 'index.html' else clean(fr_rel)
    fr_url = 'https://adermio.com/' + fr_clean
    pl_url = 'https://adermio.com/' + clean(pl_rel)
    notes = []

    html, n = re.subn(r'<html lang="fr"', '<html lang="pl"', html, count=1)
    if not n: notes.append('!! pas de <html lang="fr">')

    html = html.replace(f'<link rel="canonical" href="{fr_url}">', f'<link rel="canonical" href="{pl_url}">')
    html = html.replace(f'<meta property="og:url" content="{fr_url}">', f'<meta property="og:url" content="{pl_url}">')
    html = html.replace('<meta property="og:locale" content="fr_FR">', '<meta property="og:locale" content="pl_PL">')

    # hreflang : la page PL se déclare elle-même, juste avant x-default (ou après le dernier alternate)
    html = re.sub(r'[ \t]*<link rel="alternate" hreflang="pl" href="[^"]*">\n', '', html)
    alts = list(re.finditer(r'([ \t]*)<link rel="alternate" hreflang="([a-z-]+)" href="[^"]*">\n', html))
    if alts:
        xd = [a for a in alts if a.group(2) == 'x-default']
        if xd: pos, ind = xd[0].start(), xd[0].group(1)
        else: pos, ind = alts[-1].end(), alts[-1].group(1)
        html = html[:pos] + f'{ind}<link rel="alternate" hreflang="pl" href="{pl_url}">\n' + html[pos:]
    else:
        notes.append('pas de bloc hreflang')

    html, ok = rebuild_dropdown(html, twins)
    if not ok: notes.append('pas de lang-dropdown')
    html, n = SEL_BTN.subn(r'\1pl\2PL\3', html)
    if not n and ok: notes.append('bouton sélecteur non trouvé')
    html = html.replace('<span class="font-sans font-medium text-sm">FR</span>', '<span class="font-sans font-medium text-sm">PL</span>')

    html, n = FR_ONLY_FOOTER.subn('', html)
    if n: notes.append('lien Résilier retiré')

    out = []
    for line in html.split('\n'):
        if 'hreflang=' in line:
            out.append(line); continue
        for p in FR_PATHS:
            t = LINKMAP[p]
            line = re.sub(r'(https://adermio\.com/)' + re.escape(p) + r'(?=["\'#?/]|\.html)', r'\1' + t, line)
            line = re.sub(r'(?<=["\'`(])/' + re.escape(p) + r'(?=["\'#?`)]|\.html)', '/' + t, line)
        line = line.replace('href="/"', 'href="/pl/home"')
        line = re.sub(r'(?<=["\'])https://adermio\.com/(?=["\'])', 'https://adermio.com/pl/home', line)
        line = line.replace('href="https://adermio.com/en/"', 'href="https://adermio.com/en/home"')
        out.append(line)
    html = '\n'.join(out).replace('__FR_URL__', fr_url)

    # backend : webhooks FR -> PL (ligne du webhook gratuit ÉPINGLÉE, jamais déduite du FR), lang JS
    html = re.sub(r"const WEBHOOK_URL = '[^']*';[^\n]*",
                  "const WEBHOOK_URL = 'https://n8n.adermio.com/webhook/" + PL_FREE_WEBHOOK
                  + "'; // Analyse gratuite PL : workflow n8n à créer (phase 2) avec ce webhook", html)
    html = re.sub(r'webhook/(form-test-fr[a-z0-9-]*|analyse-gratuite-fr-[a-z0-9-]*)', 'webhook/' + PL_FREE_WEBHOOK, html)
    html = html.replace('webhook/second-cycle-fr', 'webhook/second-cycle-pl')
    html = re.sub(r"lang:\s*'fr'", "lang: 'pl'", html)
    html = html.replace('params.append("lang", "fr")', 'params.append("lang", "pl")')
    html = html.replace('/free-analysis?jobId=${encodeURIComponent(jobId)}`', '/free-analysis?jobId=${encodeURIComponent(jobId)}&lang=pl`')

    # visuels : vidéo et captures anglaises (pas encore de rapport polonais)
    html = html.replace('video-finale-prod-fr.mp4', 'adermio-en-video.mp4')
    for fr_img, en_img in VISUALS.items():
        html = html.replace(fr_img, en_img)

    html = html.replace('"availableLanguage": ["French", "English", "Spanish", "Italian", "German", "Dutch", "Greek"]',
                        '"availableLanguage": ["French", "English", "Spanish", "Italian", "German", "Dutch", "Greek", "Polish"]')
    html = html.replace('"inLanguage": ["fr", "en", "es", "it", "de", "nl", "el"]', '"inLanguage": ["fr", "en", "es", "it", "de", "nl", "el", "pl"]')

    dst = os.path.join(ROOT, pl_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(html)
    return pl_rel, notes

if __name__ == '__main__':
    for fr in sys.argv[1:] or list(PAGES):
        pl_rel, notes = transform(fr)
        print(f'{fr:48s} -> {pl_rel:45s} {"; ".join(notes)}')
