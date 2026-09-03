#!/usr/bin/env python3
"""Prépare le squelette italien d'une page à partir de la page FR.

Applique UNIQUEMENT les transformations non textuelles observées FR→ES
(lang, canonical, og:url, og:locale, hreflang, carte de liens, sélecteur de
langue, webhook, lang JS). Le texte reste en français : la traduction se fait
ensuite, littéral par littéral, sans toucher aux balises.

Usage : python3 tests/i18n/prep_it.py            # toutes les pages
        python3 tests/i18n/prep_it.py index.html # une page
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# FR source -> (IT target, EN twin, ES twin)   (twins = pour le sélecteur de langue)
PAGES = {
    'index.html': ('it/home.html', 'en/home', 'es/home'),
    'about.html': ('it/about.html', 'en/about', 'es/about'),
    'formulaire.html': ('it/form.html', 'en/form', 'es/form'),
    'formulaire2.html': ('it/form2.html', 'en/form2', 'es/form2'),
    'contact.html': ('it/contact.html', 'en/contact', 'es/contact'),
    'conditions.html': ('it/conditions.html', 'en/conditions', 'es/conditions'),
    'confidentialite.html': ('it/confidentialite.html', 'en/confidentialite', 'es/confidentialite'),
    'mentions-legales.html': ('it/legal-notice.html', 'en/legal-notice', 'es/legal-notice'),
    'sources.html': ('it/sources.html', 'en/sources', 'es/home'),
    'feedback.html': ('it/feedback.html', 'en/feedback', 'es/feedback'),
    'success.html': ('it/success.html', 'en/success', 'es/success'),
    'premium.html': ('it/premium.html', 'en/premium', 'es/premium'),
    'premium-second-cycle.html': ('it/premium-second-cycle.html', 'en/premium-second-cycle', 'es/premium-second-cycle'),
    'second-cycle.html': ('it/second-cycle.html', 'en/second-cycle', 'es/second-cycle'),
    'bilan.html': ('it/bilan.html', 'en/bilan', 'es/bilan'),
    'analyse-en-cours.html': ('it/processing.html', 'en/processing', 'es/processing'),
    'analyse-en-cours2.html': ('it/processing2.html', 'en/processing2', 'es/processing2'),
    'analyse-en-cours-second-cycle.html': ('it/analysis-in-progress-second-cycle.html', 'en/analysis-in-progress-second-cycle', 'es/analysis-in-progress-second-cycle'),
    'blog/index.html': ('it/blog/index.html', 'en/blog', 'es/blog'),
    'blog/comment-connaitre-son-type-de-peau.html': ('it/blog/come-conoscere-il-tuo-tipo-di-pelle.html', 'en/blog/how-to-know-your-skin-type', 'es/blog/como-conocer-tu-tipo-de-piel'),
    'blog/pourquoi-a-t-on-de-l-acne.html': ('it/blog/perche-viene-l-acne.html', 'en/blog/why-do-we-have-acne', 'es/blog/por-que-tenemos-acne'),
    'blog/acne-hormonale.html': ('it/blog/acne-ormonale.html', 'en/blog/hormonal-acne', 'es/blog/acne-hormonal'),
    'blog/ou-apparait-l-acne.html': ('it/blog/dove-compare-l-acne.html', 'en/blog/where-acne-appears', 'es/blog/donde-aparece-el-acne'),
}

def clean(path):
    """'it/home.html' -> 'it/home' ; 'it/blog/index.html' -> 'it/blog' (clean URLs Vercel)."""
    return re.sub(r'/index$', '', re.sub(r'\.html$', '', path))

# Carte des chemins FR (sans .html) -> IT (sans .html)
LINKMAP = {clean(fr) if fr != 'index.html' else '': clean(it) for fr, (it, _, _) in PAGES.items()}
LINKMAP['blog'] = 'it/blog'   # blog/index.html -> it/blog
LINKMAP.pop('blog/index', None)

# Chemins FR à réécrire, du plus long au plus court (évite /formulaire -> /formulaire2 partiel)
FR_PATHS = sorted([k for k in LINKMAP if k], key=len, reverse=True)

SEL_BTN = re.compile(r'(<img src="https://flagcdn\.com/)fr(\.svg" width="1[0-9]" alt=")FR(")')

def rebuild_dropdown(html, en_twin, es_twin, fr_url):
    """Remplace le contenu du <div class="lang-dropdown ..."> par 4 entrées (IT courant + EN/ES/FR)."""
    start = html.find('<div class="lang-dropdown')
    if start < 0:
        return html, False
    # trouve la fin du bloc en comptant les <div
    i = html.find('>', start) + 1
    depth = 1
    pos = i
    while depth:
        nxt_open = html.find('<div', pos)
        nxt_close = html.find('</div>', pos)
        if nxt_close < 0:
            return html, False
        if nxt_open != -1 and nxt_open < nxt_close:
            depth += 1; pos = nxt_open + 4
        else:
            depth -= 1; pos = nxt_close + 6
    end = pos
    block = html[start:end]
    # indentation de la première entrée
    m = re.search(r'\n([ \t]*)<a ', block)
    ind = m.group(1) if m else '                        '
    # largeur de drapeau utilisée dans la page
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
    body = (entry('#', 'it', 'Italiano', 'Italiano', True)
            + entry(f'https://adermio.com/{en_twin}', 'us', 'English', 'English', False)
            + entry(f'https://adermio.com/{es_twin}', 'es', 'Español', 'Español', False)
            + entry('__FR_URL__', 'fr', 'Français', 'Français', False))  # placeholder : protégé de la carte de liens
    closing_ind = ind[:-4] if len(ind) >= 4 else ''
    new_block = head + '\n' + body + closing_ind + '</div>'
    return html[:start] + new_block + html[end:], True

def transform(fr_rel):
    it_rel, en_twin, es_twin = PAGES[fr_rel]
    src = os.path.join(ROOT, fr_rel)
    dst = os.path.join(ROOT, it_rel)
    html = open(src, encoding='utf-8').read()
    fr_clean = '' if fr_rel == 'index.html' else clean(fr_rel)
    it_clean = clean(it_rel)
    fr_url = 'https://adermio.com/' + fr_clean
    it_url = 'https://adermio.com/' + it_clean
    notes = []

    # 1. lang
    html, n = re.subn(r'<html lang="fr"', '<html lang="it"', html, count=1)
    if not n: notes.append('!! pas de <html lang="fr">')

    # 2. canonical / og:url (avant la carte de liens)
    html = html.replace(f'<link rel="canonical" href="{fr_url}">', f'<link rel="canonical" href="{it_url}">')
    html = html.replace(f'<meta property="og:url" content="{fr_url}">', f'<meta property="og:url" content="{it_url}">')
    html = html.replace('<meta property="og:locale" content="fr_FR">', '<meta property="og:locale" content="it_IT">')

    # 3. hreflang : ajoute la ligne it après la ligne es (si le bloc existe)
    m = re.search(r'([ \t]*)<link rel="alternate" hreflang="es" href="[^"]*">\n', html)
    if 'hreflang="it"' in html:  # hérité du FR depuis expose_it.py : on repart d'une base propre
        html = re.sub(r'[ \t]*<link rel="alternate" hreflang="it" href="[^"]*">\n', '', html)
    if m:
        html = html[:m.end()] + f'{m.group(1)}<link rel="alternate" hreflang="it" href="{it_url}">\n' + html[m.end():]
    else:
        notes.append('pas de bloc hreflang')

    # 4. sélecteur de langue
    html, ok = rebuild_dropdown(html, en_twin, es_twin, fr_url)
    if not ok: notes.append('pas de lang-dropdown')
    html, n = SEL_BTN.subn(r'\1it\2IT\3', html)
    if not n and ok: notes.append('bouton sélecteur non trouvé')
    html = html.replace('<span class="font-sans font-medium text-sm">FR</span>', '<span class="font-sans font-medium text-sm">IT</span>')

    # 5. carte de liens, ligne par ligne, en protégeant les hreflang
    out = []
    for line in html.split('\n'):
        if 'hreflang=' in line:
            out.append(line); continue
        for p in FR_PATHS:
            t = LINKMAP[p]
            # https://adermio.com/<p> et /<p> suivis d'une fin de chemin
            line = re.sub(r'(https://adermio\.com/)' + re.escape(p) + r'(?=["\'#?/]|\.html)', r'\1' + t, line)
            line = re.sub(r'(?<=["\'`(])/' + re.escape(p) + r'(?=["\'#?`)]|\.html)', '/' + t, line)
        # accueil : href="/" et https://adermio.com/ exact
        line = line.replace('href="/"', 'href="/it/home"')
        line = re.sub(r'(?<=["\'])https://adermio\.com/(?=["\'])', 'https://adermio.com/it/home', line)
        line = line.replace('href="https://adermio.com/en/"', 'href="https://adermio.com/en/home"')
        out.append(line)
    html = '\n'.join(out).replace('__FR_URL__', fr_url)

    # 6. backend : webhook gratuit, second cycle, lang JS, iframe universelle
    html = html.replace('webhook/analyse-gratuite-fr-web', 'webhook/analyse-gratuite-it-web')
    html = html.replace('webhook/analyse-gratuite-fr-test', 'webhook/analyse-gratuite-it-web')
    html = html.replace('webhook/second-cycle-fr', 'webhook/second-cycle-it')
    html = re.sub(r"lang:\s*'fr'", "lang: 'it'", html)
    html = html.replace('params.append("lang", "fr")', 'params.append("lang", "it")')
    html = html.replace('/free-analysis?jobId=${encodeURIComponent(jobId)}`', '/free-analysis?jobId=${encodeURIComponent(jobId)}&lang=it`')

    # 6b. vidéo démo : pas d'asset italien -> vidéo anglaise (comme ES/EN)
    html = html.replace('video-finale-prod-fr.mp4', 'adermio-en-video.mp4')

    # 7. JSON-LD langues (home)
    html = html.replace('"availableLanguage": ["French", "English", "Spanish"]', '"availableLanguage": ["French", "English", "Spanish", "Italian"]')
    html = html.replace('"inLanguage": ["fr", "en", "es"]', '"inLanguage": ["fr", "en", "es", "it"]')

    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(html)
    return it_rel, notes

if __name__ == '__main__':
    targets = sys.argv[1:] or list(PAGES)
    for fr in targets:
        it_rel, notes = transform(fr)
        print(f'{fr:48s} -> {it_rel:55s} {"; ".join(notes)}')
