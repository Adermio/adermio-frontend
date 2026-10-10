#!/usr/bin/env python3
"""Prépare le squelette allemand d'une page à partir de la page FR (copie de prep_it.py).

Applique UNIQUEMENT les transformations non textuelles (lang, canonical, og:url,
og:locale, hreflang, carte de liens, sélecteur de langue, webhooks, lang JS,
visuels anglais à la place des visuels français). Le texte reste en français :
la traduction se fait ensuite, littéral par littéral (apply_tr_de.py + tr_de/).

Usage : python3 tests/i18n/de/prep_de.py              # toutes les pages
        python3 tests/i18n/de/prep_de.py index.html   # une page
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# FR source -> (DE cible, jumeau EN, jumeau ES, jumeau IT)   (jumeaux = sélecteur de langue)
# Pages de contenu : noms allemands (lus par les visiteurs et Google).
# Pages de parcours : mêmes noms que /it/ (le backend construit /de/success, /de/premium…).
PAGES = {
    'index.html': ('de/home.html', 'en/home', 'es/home', 'it/home'),
    'about.html': ('de/ueber-uns.html', 'en/about', 'es/about', 'it/about'),
    'formulaire.html': ('de/form.html', 'en/form', 'es/form', 'it/form'),
    'contact.html': ('de/kontakt.html', 'en/contact', 'es/contact', 'it/contact'),
    'conditions.html': ('de/nutzungsbedingungen.html', 'en/conditions', 'es/conditions', 'it/conditions'),
    'confidentialite.html': ('de/datenschutz.html', 'en/confidentialite', 'es/confidentialite', 'it/confidentialite'),
    'mentions-legales.html': ('de/impressum.html', 'en/legal-notice', 'es/legal-notice', 'it/legal-notice'),
    'sources.html': ('de/quellen.html', 'en/sources', 'es/home', 'it/sources'),
    'feedback.html': ('de/feedback.html', 'en/feedback', 'es/feedback', 'it/feedback'),
    'success.html': ('de/success.html', 'en/success', 'es/success', 'it/success'),
    'premium.html': ('de/premium.html', 'en/premium', 'es/premium', 'it/premium'),
    'premium-second-cycle.html': ('de/premium-second-cycle.html', 'en/premium-second-cycle', 'es/premium-second-cycle', 'it/premium-second-cycle'),
    'second-cycle.html': ('de/second-cycle.html', 'en/second-cycle', 'es/second-cycle', 'it/second-cycle'),
    'bilan.html': ('de/bilan.html', 'en/bilan', 'es/bilan', 'it/bilan'),
    'analyse-en-cours.html': ('de/processing.html', 'en/processing', 'es/processing', 'it/processing'),
    'analyse-en-cours2.html': ('de/processing2.html', 'en/processing2', 'es/processing2', 'it/processing2'),
    'analyse-en-cours-second-cycle.html': ('de/analysis-in-progress-second-cycle.html', 'en/analysis-in-progress-second-cycle', 'es/analysis-in-progress-second-cycle', 'it/analysis-in-progress-second-cycle'),
    'blog/index.html': ('de/blog/index.html', 'en/blog', 'es/blog', 'it/blog'),
    'blog/comment-connaitre-son-type-de-peau.html': ('de/blog/hauttyp-bestimmen.html', 'en/blog/how-to-know-your-skin-type', 'es/blog/como-conocer-tu-tipo-de-piel', 'it/blog/come-conoscere-il-tuo-tipo-di-pelle'),
    'blog/pourquoi-a-t-on-de-l-acne.html': ('de/blog/warum-bekommt-man-akne.html', 'en/blog/why-do-we-have-acne', 'es/blog/por-que-tenemos-acne', 'it/blog/perche-viene-l-acne'),
    'blog/acne-hormonale.html': ('de/blog/hormonelle-akne.html', 'en/blog/hormonal-acne', 'es/blog/acne-hormonal', 'it/blog/acne-ormonale'),
    'blog/ou-apparait-l-acne.html': ('de/blog/wo-tritt-akne-auf.html', 'en/blog/where-acne-appears', 'es/blog/donde-aparece-el-acne', 'it/blog/dove-compare-l-acne'),
}

# Webhook de l'analyse gratuite allemande : à créer dans n8n (phase n8n) avec CE chemin.
DE_FREE_WEBHOOK = 'analyse-gratuite-de-web'

# Visuels de l'accueil : captures du rapport FRANÇAIS -> captures ANGLAISES (comme /es/ et /en/),
# en attendant des captures du rapport allemand (phase n8n). Clé = URL FR, valeur = URL EN.
S3L = 'https://adermio-locked-pages.s3.eu-north-1.amazonaws.com/'
S3H = 'https://adermio-heatmap.s3.eu-north-1.amazonaws.com/heatmap/'
VISUALS = {
    S3L + 'zip/IMG_4244.jpg': S3H + 'IMG_4498.jpg',
    S3H + 'Screenshot+2026-02-01+at+22.44.07.png': S3H + 'Screenshot+2026-02-11+at+13.22.13.png',
    S3L + 'new_version/Screenshot+2025-12-20+at+10.31.51.png': S3L + 'en/Screenshot+2026-01-20+at+16.53.51.png',
    S3L + 'new_version/Screenshot+2025-12-20+at+10.32.23.png': S3L + 'en/Screenshot+2026-01-20+at+16.54.04.png',
    S3L + 'new_version/Screenshot+2025-12-20+at+10.32.41.png': S3L + 'en/Screenshot+2026-01-20+at+16.54.30.png',
    S3L + 'new_version/Screenshot+2025-12-20+at+10.32.55.png': S3L + 'en/Screenshot+2026-01-20+at+16.54.42.png',
    S3L + 'new_version/Screenshot+2025-12-20+at+10.33.11.png': S3L + 'en/Screenshot+2026-01-20+at+16.54.53.png',
    S3L + 'new_version/Screenshot+2025-12-20+at+10.33.27.png': S3L + 'en/Screenshot+2026-01-20+at+16.55.10.png',
    S3L + 'new_version/Screenshot+2025-12-20+at+10.33.39.png': S3L + 'en/Screenshot+2026-01-20+at+16.55.22.png',
    S3L + 'new_version/Screenshot+2025-12-20+at+10.33.57.png': S3L + 'en/Screenshot+2026-01-20+at+16.55.32.png',
}

def clean(path):
    """'de/home.html' -> 'de/home' ; 'de/blog/index.html' -> 'de/blog' (clean URLs Vercel)."""
    return re.sub(r'/index$', '', re.sub(r'\.html$', '', path))

LINKMAP = {clean(fr) if fr != 'index.html' else '': clean(de) for fr, (de, *_rest) in PAGES.items()}
LINKMAP['blog'] = 'de/blog'
LINKMAP.pop('blog/index', None)
# pages FR sans jumeau allemand, mais liées depuis des pages traduites
LINKMAP['formulaire2'] = 'de/form'
FR_PATHS = sorted([k for k in LINKMAP if k], key=len, reverse=True)

SEL_BTN = re.compile(r'(<img src="https://flagcdn\.com/)fr(\.svg" width="1[0-9]" alt=")FR(")')

def block_end(html, start):
    i = html.find('>', start) + 1
    depth, pos = 1, i
    while depth:
        o, c = html.find('<div', pos), html.find('</div>', pos)
        if c < 0: return -1
        if o != -1 and o < c: depth += 1; pos = o + 4
        else: depth -= 1; pos = c + 6
    return pos

# Jumelles néerlandaises (entrée « Nederlands » du sélecteur, ouverture du 10/10/2026) : lues dans prep_nl, source unique.
def _nl_twins():
    import importlib.util
    spec = importlib.util.spec_from_file_location('prep_nl', os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'nl', 'prep_nl.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return {fr: m.clean(v[0]) for fr, v in m.PAGES.items()}
NL_TWIN = _nl_twins()

def rebuild_dropdown(html, en_twin, es_twin, it_twin, nl_twin=None):
    """Remplace le contenu du <div class="lang-dropdown ..."> : DE courant + EN/ES/IT/FR (+ NL depuis l'ouverture du 10/10/2026)."""
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
    def entry(href, flag, alt, label, current):
        cls = ('flex items-center gap-3 px-4 py-3 text-sm font-medium bg-teal-50/50 text-teal-700' if current
               else 'flex items-center gap-3 px-4 py-3 text-sm font-medium text-adermio-dark hover:bg-gray-50 transition-colors')
        return (f'{ind}<a href="{href}" class="{cls}">\n'
                f'{ind}    <img src="https://flagcdn.com/{flag}.svg" width="{w}" alt="{alt}" class="rounded-sm shadow-sm">\n'
                f'{ind}    <span>{label}</span>\n'
                f'{ind}</a>\n')
    body = (entry('#', 'de', 'Deutsch', 'Deutsch', True)
            + entry(f'https://adermio.com/{en_twin}', 'us', 'English', 'English', False)
            + entry(f'https://adermio.com/{es_twin}', 'es', 'Español', 'Español', False)
            + entry(f'https://adermio.com/{it_twin}', 'it', 'Italiano', 'Italiano', False)
            + entry('__FR_URL__', 'fr', 'Français', 'Français', False)
            + (entry(f'https://adermio.com/{nl_twin}', 'nl', 'Nederlands', 'Nederlands', False) if nl_twin else ''))
    closing_ind = ind[:-4] if len(ind) >= 4 else ''
    return html[:start] + head + '\n' + body + closing_ind + '</div>' + html[end:], True

def transform(fr_rel):
    de_rel, en_twin, es_twin, it_twin = PAGES[fr_rel]
    html = open(os.path.join(ROOT, fr_rel), encoding='utf-8').read()
    fr_clean = '' if fr_rel == 'index.html' else clean(fr_rel)
    fr_url = 'https://adermio.com/' + fr_clean
    de_url = 'https://adermio.com/' + clean(de_rel)
    notes = []

    html, n = re.subn(r'<html lang="fr"', '<html lang="de"', html, count=1)
    if not n: notes.append('!! pas de <html lang="fr">')

    html = html.replace(f'<link rel="canonical" href="{fr_url}">', f'<link rel="canonical" href="{de_url}">')
    html = html.replace(f'<meta property="og:url" content="{fr_url}">', f'<meta property="og:url" content="{de_url}">')
    html = html.replace('<meta property="og:locale" content="fr_FR">', '<meta property="og:locale" content="de_DE">')

    # hreflang : la page DE se déclare elle-même (les autres langues ne la déclarent qu'à l'ouverture)
    html = re.sub(r'[ \t]*<link rel="alternate" hreflang="de" href="[^"]*">\n', '', html)
    m = re.search(r'([ \t]*)<link rel="alternate" hreflang="(it|es)" href="[^"]*">\n(?![ \t]*<link rel="alternate" hreflang="it")', html)
    if m:
        html = html[:m.end()] + f'{m.group(1)}<link rel="alternate" hreflang="de" href="{de_url}">\n' + html[m.end():]
    else:
        notes.append('pas de bloc hreflang')

    html, ok = rebuild_dropdown(html, en_twin, es_twin, it_twin, NL_TWIN.get(fr_rel))
    if not ok: notes.append('pas de lang-dropdown')
    html, n = SEL_BTN.subn(r'\1de\2DE\3', html)
    if not n and ok: notes.append('bouton sélecteur non trouvé')
    html = html.replace('<span class="font-sans font-medium text-sm">FR</span>', '<span class="font-sans font-medium text-sm">DE</span>')

    out = []
    for line in html.split('\n'):
        if 'hreflang=' in line:
            out.append(line); continue
        for p in FR_PATHS:
            t = LINKMAP[p]
            line = re.sub(r'(https://adermio\.com/)' + re.escape(p) + r'(?=["\'#?/]|\.html)', r'\1' + t, line)
            line = re.sub(r'(?<=["\'`(])/' + re.escape(p) + r'(?=["\'#?`)]|\.html)', '/' + t, line)
        line = line.replace('href="/"', 'href="/de/home"')
        line = re.sub(r'(?<=["\'])https://adermio\.com/(?=["\'])', 'https://adermio.com/de/home', line)
        line = line.replace('href="https://adermio.com/en/"', 'href="https://adermio.com/en/home"')
        out.append(line)
    html = '\n'.join(out).replace('__FR_URL__', fr_url)

    # backend : webhooks FR -> DE, lang JS
    # Ligne du webhook gratuit ÉPINGLÉE (le webhook FR change au gré des tests : le 05/10, « form-test-fr-og-pur »
    # donnait « analyse-gratuite-de-web-pur », inexistant). Le motif de secours consomme tout le suffixe.
    html = re.sub(r"const WEBHOOK_URL = '[^']*';[^\n]*",
                  "const WEBHOOK_URL = 'https://n8n.adermio.com/webhook/" + DE_FREE_WEBHOOK
                  + "'; // Analyse gratuite DE : « Analyse Gratuite Allemand web » (4FJGz9wXWJQwYofC)", html)
    html = re.sub(r'webhook/(form-test-fr[a-z0-9-]*|analyse-gratuite-fr-[a-z0-9-]*)', 'webhook/' + DE_FREE_WEBHOOK, html)
    html = html.replace('webhook/second-cycle-fr', 'webhook/second-cycle-de')
    html = re.sub(r"lang:\s*'fr'", "lang: 'de'", html)
    html = html.replace('params.append("lang", "fr")', 'params.append("lang", "de")')
    html = html.replace('/free-analysis?jobId=${encodeURIComponent(jobId)}`', '/free-analysis?jobId=${encodeURIComponent(jobId)}&lang=de`')

    # visuels : vidéo et captures anglaises (pas encore de rapport allemand)
    html = html.replace('video-finale-prod-fr.mp4', 'adermio-en-video.mp4')
    for fr_img, en_img in VISUALS.items():
        html = html.replace(fr_img, en_img)

    html = html.replace('"availableLanguage": ["French", "English", "Spanish", "Italian"]', '"availableLanguage": ["French", "English", "Spanish", "Italian", "German"]')
    html = html.replace('"inLanguage": ["fr", "en", "es", "it"]', '"inLanguage": ["fr", "en", "es", "it", "de"]')

    dst = os.path.join(ROOT, de_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(html)
    return de_rel, notes

if __name__ == '__main__':
    for fr in sys.argv[1:] or list(PAGES):
        de_rel, notes = transform(fr)
        print(f'{fr:48s} -> {de_rel:45s} {"; ".join(notes)}')
