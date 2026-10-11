#!/usr/bin/env python3
"""Prépare le squelette grec d'une page à partir de la page FR (dérivé de prep_nl.py).

Applique UNIQUEMENT les transformations non textuelles (lang, canonical, og:url,
og:locale, hreflang, carte de liens, sélecteur de langue, webhooks, lang JS,
visuels anglais, polices à glyphes grecs, liens d'abonnement FR retirés du pied de page).
Le texte reste en français : la traduction se fait ensuite, littéral par littéral
(apply_tr_el.py + tr_el/).

Usage : python3 tests/i18n/el/prep_el.py              # toutes les pages
        python3 tests/i18n/el/prep_el.py index.html   # une page
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# FR source -> (EL cible, jumeau EN, ES, IT, DE, NL)   (jumeaux = sélecteur de langue)
# Pages de contenu : noms en grec translittéré (greeklish, usage des sites grecs).
# Pages de parcours : mêmes noms que /it/, /de/, /nl/ (le backend construit /el/success, /el/premium…).
PAGES = {
    'index.html': ('el/home.html', 'en/home', 'es/home', 'it/home', 'de/home', 'nl/home'),
    'about.html': ('el/schetika-me-emas.html', 'en/about', 'es/about', 'it/about', 'de/ueber-uns', 'nl/over-ons'),
    'formulaire.html': ('el/form.html', 'en/form', 'es/form', 'it/form', 'de/form', 'nl/form'),
    'contact.html': ('el/epikoinonia.html', 'en/contact', 'es/contact', 'it/contact', 'de/kontakt', 'nl/contact'),
    'conditions.html': ('el/oroi-chrisis.html', 'en/conditions', 'es/conditions', 'it/conditions', 'de/nutzungsbedingungen', 'nl/gebruiksvoorwaarden'),
    'confidentialite.html': ('el/politiki-aporritou.html', 'en/confidentialite', 'es/confidentialite', 'it/confidentialite', 'de/datenschutz', 'nl/privacyverklaring'),
    'mentions-legales.html': ('el/nomikes-plirofories.html', 'en/legal-notice', 'es/legal-notice', 'it/legal-notice', 'de/impressum', 'nl/juridische-informatie'),
    'sources.html': ('el/piges.html', 'en/sources', 'es/home', 'it/sources', 'de/quellen', 'nl/bronnen'),
    'feedback.html': ('el/feedback.html', 'en/feedback', 'es/feedback', 'it/feedback', 'de/feedback', 'nl/feedback'),
    'success.html': ('el/success.html', 'en/success', 'es/success', 'it/success', 'de/success', 'nl/success'),
    'premium.html': ('el/premium.html', 'en/premium', 'es/premium', 'it/premium', 'de/premium', 'nl/premium'),
    'premium-second-cycle.html': ('el/premium-second-cycle.html', 'en/premium-second-cycle', 'es/premium-second-cycle', 'it/premium-second-cycle', 'de/premium-second-cycle', 'nl/premium-second-cycle'),
    'second-cycle.html': ('el/second-cycle.html', 'en/second-cycle', 'es/second-cycle', 'it/second-cycle', 'de/second-cycle', 'nl/second-cycle'),
    'bilan.html': ('el/bilan.html', 'en/bilan', 'es/bilan', 'it/bilan', 'de/bilan', 'nl/bilan'),
    'analyse-en-cours.html': ('el/processing.html', 'en/processing', 'es/processing', 'it/processing', 'de/processing', 'nl/processing'),
    'analyse-en-cours2.html': ('el/processing2.html', 'en/processing2', 'es/processing2', 'it/processing2', 'de/processing2', 'nl/processing2'),
    'analyse-en-cours-second-cycle.html': ('el/analysis-in-progress-second-cycle.html', 'en/analysis-in-progress-second-cycle', 'es/analysis-in-progress-second-cycle', 'it/analysis-in-progress-second-cycle', 'de/analysis-in-progress-second-cycle', 'nl/analysis-in-progress-second-cycle'),
    'blog/index.html': ('el/blog/index.html', 'en/blog', 'es/blog', 'it/blog', 'de/blog', 'nl/blog'),
    'blog/comment-connaitre-son-type-de-peau.html': ('el/blog/typos-epidermidas.html', 'en/blog/how-to-know-your-skin-type', 'es/blog/como-conocer-tu-tipo-de-piel', 'it/blog/come-conoscere-il-tuo-tipo-di-pelle', 'de/blog/hauttyp-bestimmen', 'nl/blog/huidtype-bepalen'),
    'blog/pourquoi-a-t-on-de-l-acne.html': ('el/blog/giati-vgazoume-akmi.html', 'en/blog/why-do-we-have-acne', 'es/blog/por-que-tenemos-acne', 'it/blog/perche-viene-l-acne', 'de/blog/warum-bekommt-man-akne', 'nl/blog/waarom-krijg-je-acne'),
    'blog/acne-hormonale.html': ('el/blog/ormoniki-akmi.html', 'en/blog/hormonal-acne', 'es/blog/acne-hormonal', 'it/blog/acne-ormonale', 'de/blog/hormonelle-akne', 'nl/blog/hormonale-acne'),
    'blog/ou-apparait-l-acne.html': ('el/blog/pou-emfanizetai-akmi.html', 'en/blog/where-acne-appears', 'es/blog/donde-aparece-el-acne', 'it/blog/dove-compare-l-acne', 'de/blog/wo-tritt-akne-auf', 'nl/blog/waar-ontstaat-acne'),
}

# Webhooks de l'analyse grecque : à créer dans n8n (phase 2) avec CES chemins.
# Tant qu'ils n'existent pas, /el/ reste caché (noindex, hors sélecteur des autres langues).
EL_FREE_WEBHOOK = 'analyse-gratuite-el-web'

# Visuels de l'accueil : captures du rapport FRANÇAIS -> captures ANGLAISES (comme /de/ et /nl/).
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

# Polices : DM Sans et Playfair Display n'ont AUCUN glyphe grec (le navigateur retomberait sur Arial/Times).
# Grec : Manrope (sans, déjà utilisée par le site) et Noto Serif Display (serif à fort contraste, proche de Playfair).
GREEK_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Noto+Serif+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap'
GREEK_STYLE = ("    <style>/* Grec : DM Sans et Playfair Display n'ont pas de glyphes grecs */"
               "html,body,.font-sans,button,input,select,textarea{font-family:'Manrope','DM Sans',sans-serif}"
               ".font-serif{font-family:'Noto Serif Display','Playfair Display',serif}</style>\n")

# Lien « Résilier mon abonnement » : abonnement web FRANÇAIS seulement (absent des autres langues).
# Les CGV (/cgv, en français) restent liées : elles régissent aussi l'achat de l'analyse complète.
FR_ONLY_FOOTER = re.compile(r'[ \t]*<a href="https://adermio\.com/resilier" class="!text-slate-500[^"]*">[^<]*</a>\n')

def clean(path):
    """'el/home.html' -> 'el/home' ; 'el/blog/index.html' -> 'el/blog' (clean URLs Vercel)."""
    return re.sub(r'/index$', '', re.sub(r'\.html$', '', path))

LINKMAP = {clean(fr) if fr != 'index.html' else '': clean(el) for fr, (el, *_rest) in PAGES.items()}
LINKMAP['blog'] = 'el/blog'
LINKMAP.pop('blog/index', None)
LINKMAP['formulaire2'] = 'el/form'  # page FR sans jumeau, liée depuis des pages traduites
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

def rebuild_dropdown(html, twins):
    """Remplace le contenu du <div class="lang-dropdown ..."> : EL courant + EN/ES/IT/DE/NL/FR."""
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
    en, es, it, de, nl = twins
    body = (entry('#', 'gr', 'Ελληνικά', True)
            + entry(f'https://adermio.com/{en}', 'us', 'English', False)
            + entry(f'https://adermio.com/{es}', 'es', 'Español', False)
            + entry(f'https://adermio.com/{it}', 'it', 'Italiano', False)
            + entry(f'https://adermio.com/{de}', 'de', 'Deutsch', False)
            + entry(f'https://adermio.com/{nl}', 'nl', 'Nederlands', False)
            + entry('__FR_URL__', 'fr', 'Français', False))
    closing_ind = ind[:-4] if len(ind) >= 4 else ''
    return html[:start] + head + '\n' + body + closing_ind + '</div>' + html[end:], True

def transform(fr_rel):
    el_rel, *twins = PAGES[fr_rel]
    html = open(os.path.join(ROOT, fr_rel), encoding='utf-8').read()
    fr_clean = '' if fr_rel == 'index.html' else clean(fr_rel)
    fr_url = 'https://adermio.com/' + fr_clean
    el_url = 'https://adermio.com/' + clean(el_rel)
    notes = []

    html, n = re.subn(r'<html lang="fr"', '<html lang="el"', html, count=1)
    if not n: notes.append('!! pas de <html lang="fr">')

    html = html.replace(f'<link rel="canonical" href="{fr_url}">', f'<link rel="canonical" href="{el_url}">')
    html = html.replace(f'<meta property="og:url" content="{fr_url}">', f'<meta property="og:url" content="{el_url}">')
    html = html.replace('<meta property="og:locale" content="fr_FR">', '<meta property="og:locale" content="el_GR">')

    # hreflang : la page EL se déclare elle-même, juste avant x-default (ou après le dernier alternate)
    html = re.sub(r'[ \t]*<link rel="alternate" hreflang="el" href="[^"]*">\n', '', html)
    alts = list(re.finditer(r'([ \t]*)<link rel="alternate" hreflang="([a-z-]+)" href="[^"]*">\n', html))
    if alts:
        xd = [a for a in alts if a.group(2) == 'x-default']
        if xd: pos, ind = xd[0].start(), xd[0].group(1)
        else: pos, ind = alts[-1].end(), alts[-1].group(1)
        html = html[:pos] + f'{ind}<link rel="alternate" hreflang="el" href="{el_url}">\n' + html[pos:]
    else:
        notes.append('pas de bloc hreflang')

    html, ok = rebuild_dropdown(html, twins)
    if not ok: notes.append('pas de lang-dropdown')
    html, n = SEL_BTN.subn(r'\1gr\2EL\3', html)
    if not n and ok: notes.append('bouton sélecteur non trouvé')
    html = html.replace('<span class="font-sans font-medium text-sm">FR</span>', '<span class="font-sans font-medium text-sm">EL</span>')

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
        line = line.replace('href="/"', 'href="/el/home"')
        line = re.sub(r'(?<=["\'])https://adermio\.com/(?=["\'])', 'https://adermio.com/el/home', line)
        line = line.replace('href="https://adermio.com/en/"', 'href="https://adermio.com/en/home"')
        out.append(line)
    html = '\n'.join(out).replace('__FR_URL__', fr_url)

    # backend : webhooks FR -> EL (ligne du webhook gratuit ÉPINGLÉE, jamais déduite du FR), lang JS
    html = re.sub(r"const WEBHOOK_URL = '[^']*';[^\n]*",
                  "const WEBHOOK_URL = 'https://n8n.adermio.com/webhook/" + EL_FREE_WEBHOOK
                  + "'; // Analyse gratuite EL : workflow n8n à créer (phase 2) avec ce webhook", html)
    html = re.sub(r'webhook/(form-test-fr[a-z0-9-]*|analyse-gratuite-fr-[a-z0-9-]*)', 'webhook/' + EL_FREE_WEBHOOK, html)
    html = html.replace('webhook/second-cycle-fr', 'webhook/second-cycle-el')
    html = re.sub(r"lang:\s*'fr'", "lang: 'el'", html)
    html = html.replace('params.append("lang", "fr")', 'params.append("lang", "el")')
    html = html.replace('/free-analysis?jobId=${encodeURIComponent(jobId)}`', '/free-analysis?jobId=${encodeURIComponent(jobId)}&lang=el`')

    # visuels : vidéo et captures anglaises (pas encore de rapport grec)
    html = html.replace('video-finale-prod-fr.mp4', 'adermio-en-video.mp4')
    for fr_img, en_img in VISUALS.items():
        html = html.replace(fr_img, en_img)

    html = html.replace('"availableLanguage": ["French", "English", "Spanish", "Italian", "German", "Dutch"]',
                        '"availableLanguage": ["French", "English", "Spanish", "Italian", "German", "Dutch", "Greek"]')
    html = html.replace('"inLanguage": ["fr", "en", "es", "it", "de", "nl"]', '"inLanguage": ["fr", "en", "es", "it", "de", "nl", "el"]')

    # polices à glyphes grecs : le lien Google Fonts « DM Sans + Playfair » est REMPLACÉ par Manrope + Noto Serif Display
    # (le lien FR « opsz,wght@9..40,300;400;… » est mal formé : Google répond 400 et le FR s'affiche en polices système).
    # Les liens Inter (premium) restent tels quels : Inter a le grec.
    html, n = re.subn(r'https://fonts\.googleapis\.com/css2\?family=DM\+Sans[^"\'\s)]*', GREEK_FONTS_URL, html)
    if n:
        html = re.sub(r"(['\"]?)DM Sans\1\s*,\s*sans-serif", r"'Manrope','DM Sans',sans-serif", html)
        html = html.replace('</head>', GREEK_STYLE + '</head>', 1)

    dst = os.path.join(ROOT, el_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(html)
    return el_rel, notes

if __name__ == '__main__':
    for fr in sys.argv[1:] or list(PAGES):
        el_rel, notes = transform(fr)
        print(f'{fr:48s} -> {el_rel:45s} {"; ".join(notes)}')
