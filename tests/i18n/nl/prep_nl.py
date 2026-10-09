#!/usr/bin/env python3
"""Prépare le squelette néerlandais d'une page à partir de la page FR (copie de prep_de.py).

Applique UNIQUEMENT les transformations non textuelles (lang, canonical, og:url,
og:locale, hreflang, carte de liens, sélecteur de langue, webhooks, lang JS,
visuels anglais à la place des visuels français). Le texte reste en français :
la traduction se fait ensuite, littéral par littéral (apply_tr_nl.py + tr_nl/).

Usage : python3 tests/i18n/nl/prep_nl.py              # toutes les pages
        python3 tests/i18n/nl/prep_nl.py index.html   # une page
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# FR source -> (NL cible, jumeau EN, jumeau ES, jumeau IT, jumeau DE)   (jumeaux = sélecteur de langue)
# Pages de contenu : noms néerlandais (lus par les visiteurs et Google).
# Pages de parcours : mêmes noms que /it/ et /de/ (le backend construit /nl/success, /nl/premium…).
PAGES = {
    'index.html': ('nl/home.html', 'en/home', 'es/home', 'it/home', 'de/home'),
    'about.html': ('nl/over-ons.html', 'en/about', 'es/about', 'it/about', 'de/ueber-uns'),
    'formulaire.html': ('nl/form.html', 'en/form', 'es/form', 'it/form', 'de/form'),
    'contact.html': ('nl/contact.html', 'en/contact', 'es/contact', 'it/contact', 'de/kontakt'),
    'conditions.html': ('nl/gebruiksvoorwaarden.html', 'en/conditions', 'es/conditions', 'it/conditions', 'de/nutzungsbedingungen'),
    'confidentialite.html': ('nl/privacyverklaring.html', 'en/confidentialite', 'es/confidentialite', 'it/confidentialite', 'de/datenschutz'),
    'mentions-legales.html': ('nl/juridische-informatie.html', 'en/legal-notice', 'es/legal-notice', 'it/legal-notice', 'de/impressum'),
    'sources.html': ('nl/bronnen.html', 'en/sources', 'es/home', 'it/sources', 'de/quellen'),
    'feedback.html': ('nl/feedback.html', 'en/feedback', 'es/feedback', 'it/feedback', 'de/feedback'),
    'success.html': ('nl/success.html', 'en/success', 'es/success', 'it/success', 'de/success'),
    'premium.html': ('nl/premium.html', 'en/premium', 'es/premium', 'it/premium', 'de/premium'),
    'premium-second-cycle.html': ('nl/premium-second-cycle.html', 'en/premium-second-cycle', 'es/premium-second-cycle', 'it/premium-second-cycle', 'de/premium-second-cycle'),
    'second-cycle.html': ('nl/second-cycle.html', 'en/second-cycle', 'es/second-cycle', 'it/second-cycle', 'de/second-cycle'),
    'bilan.html': ('nl/bilan.html', 'en/bilan', 'es/bilan', 'it/bilan', 'de/bilan'),
    'analyse-en-cours.html': ('nl/processing.html', 'en/processing', 'es/processing', 'it/processing', 'de/processing'),
    'analyse-en-cours2.html': ('nl/processing2.html', 'en/processing2', 'es/processing2', 'it/processing2', 'de/processing2'),
    'analyse-en-cours-second-cycle.html': ('nl/analysis-in-progress-second-cycle.html', 'en/analysis-in-progress-second-cycle', 'es/analysis-in-progress-second-cycle', 'it/analysis-in-progress-second-cycle', 'de/analysis-in-progress-second-cycle'),
    'blog/index.html': ('nl/blog/index.html', 'en/blog', 'es/blog', 'it/blog', 'de/blog'),
    'blog/comment-connaitre-son-type-de-peau.html': ('nl/blog/huidtype-bepalen.html', 'en/blog/how-to-know-your-skin-type', 'es/blog/como-conocer-tu-tipo-de-piel', 'it/blog/come-conoscere-il-tuo-tipo-di-pelle', 'de/blog/hauttyp-bestimmen'),
    'blog/pourquoi-a-t-on-de-l-acne.html': ('nl/blog/waarom-krijg-je-acne.html', 'en/blog/why-do-we-have-acne', 'es/blog/por-que-tenemos-acne', 'it/blog/perche-viene-l-acne', 'de/blog/warum-bekommt-man-akne'),
    'blog/acne-hormonale.html': ('nl/blog/hormonale-acne.html', 'en/blog/hormonal-acne', 'es/blog/acne-hormonal', 'it/blog/acne-ormonale', 'de/blog/hormonelle-akne'),
    'blog/ou-apparait-l-acne.html': ('nl/blog/waar-ontstaat-acne.html', 'en/blog/where-acne-appears', 'es/blog/donde-aparece-el-acne', 'it/blog/dove-compare-l-acne', 'de/blog/wo-tritt-akne-auf'),
}

# Webhook de l'analyse gratuite néerlandaise : à créer dans n8n (phase 2) avec CE chemin.
# Tant qu'il n'existe pas, un envoi du formulaire /nl/form échoue : /nl/ reste caché (noindex, hors sélecteur).
NL_FREE_WEBHOOK = 'analyse-gratuite-nl-web'

# Visuels de l'accueil : captures du rapport FRANÇAIS -> captures ANGLAISES (comme /de/, /es/ et /en/),
# en attendant des captures d'un rapport néerlandais (phase 2). Clé = URL FR, valeur = URL EN.
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
    """'nl/home.html' -> 'nl/home' ; 'nl/blog/index.html' -> 'nl/blog' (clean URLs Vercel)."""
    return re.sub(r'/index$', '', re.sub(r'\.html$', '', path))

LINKMAP = {clean(fr) if fr != 'index.html' else '': clean(nl) for fr, (nl, *_rest) in PAGES.items()}
LINKMAP['blog'] = 'nl/blog'
LINKMAP.pop('blog/index', None)
# pages FR sans jumeau néerlandais, mais liées depuis des pages traduites
LINKMAP['formulaire2'] = 'nl/form'
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

def rebuild_dropdown(html, en_twin, es_twin, it_twin, de_twin):
    """Remplace le contenu du <div class="lang-dropdown ..."> : NL courant + EN/ES/IT/DE/FR."""
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
    body = (entry('#', 'nl', 'Nederlands', 'Nederlands', True)
            + entry(f'https://adermio.com/{en_twin}', 'us', 'English', 'English', False)
            + entry(f'https://adermio.com/{es_twin}', 'es', 'Español', 'Español', False)
            + entry(f'https://adermio.com/{it_twin}', 'it', 'Italiano', 'Italiano', False)
            + entry(f'https://adermio.com/{de_twin}', 'de', 'Deutsch', 'Deutsch', False)
            + entry('__FR_URL__', 'fr', 'Français', 'Français', False))
    closing_ind = ind[:-4] if len(ind) >= 4 else ''
    return html[:start] + head + '\n' + body + closing_ind + '</div>' + html[end:], True

def transform(fr_rel):
    nl_rel, en_twin, es_twin, it_twin, de_twin = PAGES[fr_rel]
    html = open(os.path.join(ROOT, fr_rel), encoding='utf-8').read()
    fr_clean = '' if fr_rel == 'index.html' else clean(fr_rel)
    fr_url = 'https://adermio.com/' + fr_clean
    nl_url = 'https://adermio.com/' + clean(nl_rel)
    notes = []

    html, n = re.subn(r'<html lang="fr"', '<html lang="nl"', html, count=1)
    if not n: notes.append('!! pas de <html lang="fr">')

    html = html.replace(f'<link rel="canonical" href="{fr_url}">', f'<link rel="canonical" href="{nl_url}">')
    html = html.replace(f'<meta property="og:url" content="{fr_url}">', f'<meta property="og:url" content="{nl_url}">')
    html = html.replace('<meta property="og:locale" content="fr_FR">', '<meta property="og:locale" content="nl_NL">')

    # hreflang : la page NL se déclare elle-même (les autres langues ne la déclarent qu'à l'ouverture)
    html = re.sub(r'[ \t]*<link rel="alternate" hreflang="nl" href="[^"]*">\n', '', html)
    m = re.search(r'([ \t]*)<link rel="alternate" hreflang="(de|it|es)" href="[^"]*">\n(?![ \t]*<link rel="alternate" hreflang="(it|de)")', html)
    if m:
        html = html[:m.end()] + f'{m.group(1)}<link rel="alternate" hreflang="nl" href="{nl_url}">\n' + html[m.end():]
    else:
        notes.append('pas de bloc hreflang')

    html, ok = rebuild_dropdown(html, en_twin, es_twin, it_twin, de_twin)
    if not ok: notes.append('pas de lang-dropdown')
    html, n = SEL_BTN.subn(r'\1nl\2NL\3', html)
    if not n and ok: notes.append('bouton sélecteur non trouvé')
    html = html.replace('<span class="font-sans font-medium text-sm">FR</span>', '<span class="font-sans font-medium text-sm">NL</span>')

    out = []
    for line in html.split('\n'):
        if 'hreflang=' in line:
            out.append(line); continue
        for p in FR_PATHS:
            t = LINKMAP[p]
            line = re.sub(r'(https://adermio\.com/)' + re.escape(p) + r'(?=["\'#?/]|\.html)', r'\1' + t, line)
            line = re.sub(r'(?<=["\'`(])/' + re.escape(p) + r'(?=["\'#?`)]|\.html)', '/' + t, line)
        line = line.replace('href="/"', 'href="/nl/home"')
        line = re.sub(r'(?<=["\'])https://adermio\.com/(?=["\'])', 'https://adermio.com/nl/home', line)
        line = line.replace('href="https://adermio.com/en/"', 'href="https://adermio.com/en/home"')
        out.append(line)
    html = '\n'.join(out).replace('__FR_URL__', fr_url)

    # backend : webhooks FR -> NL, lang JS
    # Ligne du webhook gratuit ÉPINGLÉE (le webhook FR change au gré des tests ; le déduire du FR par motif
    # a déjà laissé passer un suffixe en DE). Le motif de secours consomme tout le suffixe.
    html = re.sub(r"const WEBHOOK_URL = '[^']*';[^\n]*",
                  "const WEBHOOK_URL = 'https://n8n.adermio.com/webhook/" + NL_FREE_WEBHOOK
                  + "'; // Analyse gratuite NL : workflow n8n à créer (phase 2) avec ce webhook", html)
    html = re.sub(r'webhook/(form-test-fr[a-z0-9-]*|analyse-gratuite-fr-[a-z0-9-]*)', 'webhook/' + NL_FREE_WEBHOOK, html)
    html = html.replace('webhook/second-cycle-fr', 'webhook/second-cycle-nl')
    html = re.sub(r"lang:\s*'fr'", "lang: 'nl'", html)
    html = html.replace('params.append("lang", "fr")', 'params.append("lang", "nl")')
    html = html.replace('/free-analysis?jobId=${encodeURIComponent(jobId)}`', '/free-analysis?jobId=${encodeURIComponent(jobId)}&lang=nl`')

    # visuels : vidéo et captures anglaises (pas encore de rapport néerlandais)
    html = html.replace('video-finale-prod-fr.mp4', 'adermio-en-video.mp4')
    for fr_img, en_img in VISUALS.items():
        html = html.replace(fr_img, en_img)

    html = html.replace('"availableLanguage": ["French", "English", "Spanish", "Italian", "German"]',
                        '"availableLanguage": ["French", "English", "Spanish", "Italian", "German", "Dutch"]')
    html = html.replace('"inLanguage": ["fr", "en", "es", "it", "de"]', '"inLanguage": ["fr", "en", "es", "it", "de", "nl"]')

    dst = os.path.join(ROOT, nl_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(html)
    return nl_rel, notes

if __name__ == '__main__':
    for fr in sys.argv[1:] or list(PAGES):
        nl_rel, notes = transform(fr)
        print(f'{fr:48s} -> {nl_rel:45s} {"; ".join(notes)}')
