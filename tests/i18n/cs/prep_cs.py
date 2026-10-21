#!/usr/bin/env python3
"""Prépare le squelette tchèque d'une page à partir de la page FR (dérivé de prep_pt.py, lui-même dérivé de prep_pl.py).

Applique UNIQUEMENT les transformations non textuelles (lang, canonical, og:url, og:locale, hreflang, carte de liens,
sélecteur de langue, webhooks, lang JS, visuels anglais, liens d'abonnement FR retirés du pied de page).
Le texte reste en français : la traduction se fait ensuite, littéral par littéral (apply_tr_cs.py + tr_cs/).

Depuis la bascule du 19/10 (nouveau site), deux familles de pages :
  - pages devenues le nouveau site (accueil, formulaire, légal, blog…) : la page FR d'origine est dans
    output/site-v2/source-v1/ ; la page CS préparée va dans source-v1/cs/ (source des générateurs build_*_cs.py,
    jamais servie telle quelle) ;
  - pages de parcours restées à l'ancien design (premium, bilan, second-cycle, feedback, processing2…) : FR à la racine
    du site, CS dans adermio-site/cs/ (servies).

Usage : python3 tests/i18n/cs/prep_cs.py              # toutes les pages
        python3 tests/i18n/cs/prep_cs.py index.html   # une page
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'el'))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'pl'))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'pt'))
import prep_el, prep_pt

ROOT = prep_el.ROOT
SRC_V1 = os.path.join(os.path.dirname(ROOT), 'output', 'site-v2', 'source-v1')
clean = prep_el.clean
block_end = prep_el.block_end
VISUALS = prep_el.VISUALS
FR_ONLY_FOOTER = prep_el.FR_ONLY_FOOTER
SEL_BTN = prep_el.SEL_BTN

# Pages de contenu : noms tchèques SANS diacritiques ; pages de parcours : mêmes noms que les autres langues
# (le backend construit /cs/success, /cs/premium…).
CS_NAMES = {
    'index.html': 'cs/home.html', 'about.html': 'cs/o-nas.html', 'formulaire.html': 'cs/form.html',
    'contact.html': 'cs/kontakt.html', 'conditions.html': 'cs/podminky-pouzivani.html',
    'confidentialite.html': 'cs/ochrana-osobnich-udaju.html', 'mentions-legales.html': 'cs/pravni-informace.html',
    'sources.html': 'cs/zdroje.html', 'feedback.html': 'cs/feedback.html', 'success.html': 'cs/success.html',
    'premium.html': 'cs/premium.html', 'premium-second-cycle.html': 'cs/premium-second-cycle.html',
    'second-cycle.html': 'cs/second-cycle.html', 'bilan.html': 'cs/bilan.html',
    'analyse-en-cours.html': 'cs/processing.html', 'analyse-en-cours2.html': 'cs/processing2.html',
    'analyse-en-cours-second-cycle.html': 'cs/analysis-in-progress-second-cycle.html',
    'blog/index.html': 'cs/blog/index.html',
    'blog/comment-connaitre-son-type-de-peau.html': 'cs/blog/typ-pleti.html',
    'blog/pourquoi-a-t-on-de-l-acne.html': 'cs/blog/proc-vznika-akne.html',
    'blog/acne-hormonale.html': 'cs/blog/hormonalni-akne.html',
    'blog/ou-apparait-l-acne.html': 'cs/blog/kde-se-objevuje-akne.html',
    # Obchodní podmínky (CGV) ; stránka zrušení předplatného : skrytá (noindex), jako v ostatních jazycích
    'cgv.html': 'cs/obchodni-podminky.html', 'resilier.html': 'cs/zruseni-predplatneho.html',
}
# FR source -> (CS cible, jumeau EN, ES, IT, DE, NL, EL, PL, PT)   (jumeaux = sélecteur de langue)
PAGES = {fr: (CS_NAMES[fr], *v[1:], clean(v[0])) for fr, v in prep_pt.PAGES.items()}
assert set(PAGES) == set(CS_NAMES), set(PAGES) ^ set(CS_NAMES)

def fr_path(fr_rel):
    """Page FR d'origine : copie d'avant la bascule si elle existe, sinon la page en place."""
    p = os.path.join(SRC_V1, fr_rel)
    return p if os.path.exists(p) else os.path.join(ROOT, fr_rel)

def cs_path(cs_rel):
    """Fichier CS préparé : source-v1/cs/ pour les pages devenues le nouveau site, adermio-site/cs/ sinon."""
    fr_rel = [k for k, v in PAGES.items() if v[0] == cs_rel][0]
    base = SRC_V1 if os.path.exists(os.path.join(SRC_V1, fr_rel)) else ROOT
    return os.path.join(base, cs_rel)

def cs_exists(p):
    """Une adresse /cs/… existera-t-elle (page préparée ici, ou page du nouveau site) ?"""
    return any(os.path.exists(os.path.join(b, c)) for b in (ROOT, SRC_V1, os.path.join(ROOT, 'v2'))
               for c in (p + '.html', p + '/index.html'))

# Webhooks de l'analyse tchèque : à créer dans n8n (phase 2) avec CES chemins, jamais déduits du FR.
# Tant qu'ils n'existent pas, /cs/ reste caché (noindex, hors sélecteur des autres langues).
CS_FREE_WEBHOOK = 'analyse-gratuite-cs-web'
CS_SECOND_CYCLE_WEBHOOK = 'second-cycle-cs'

LINKMAP = {clean(fr) if fr != 'index.html' else '': clean(cs) for fr, (cs, *_rest) in PAGES.items()}
LINKMAP['blog'] = 'cs/blog'
LINKMAP.pop('blog/index', None)
LINKMAP['formulaire2'] = 'cs/form'  # page FR sans jumeau, liée depuis des pages traduites
FR_PATHS = sorted([k for k in LINKMAP if k], key=len, reverse=True)

def rebuild_dropdown(html, twins):
    """Remplace le contenu du <div class="lang-dropdown ..."> : CS courant + EN/ES/IT/DE/NL/EL/PL/PT/FR."""
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
    en, es, it, de, nl, el, pl, pt = twins
    body = (entry('#', 'cz', 'Čeština', True)
            + entry(f'https://adermio.com/{en}', 'us', 'English', False)
            + entry(f'https://adermio.com/{es}', 'es', 'Español', False)
            + entry(f'https://adermio.com/{it}', 'it', 'Italiano', False)
            + entry(f'https://adermio.com/{de}', 'de', 'Deutsch', False)
            + entry(f'https://adermio.com/{nl}', 'nl', 'Nederlands', False)
            + entry(f'https://adermio.com/{el}', 'gr', 'Ελληνικά', False)
            + entry(f'https://adermio.com/{pl}', 'pl', 'Polski', False)
            + entry(f'https://adermio.com/{pt}', 'pt', 'Português', False)
            + entry('__FR_URL__', 'fr', 'Français', False))
    closing_ind = ind[:-4] if len(ind) >= 4 else ''
    return html[:start] + head + '\n' + body + closing_ind + '</div>' + html[end:], True

def transform(fr_rel):
    cs_rel, *twins = PAGES[fr_rel]
    html = open(fr_path(fr_rel), encoding='utf-8').read()
    fr_clean = '' if fr_rel == 'index.html' else clean(fr_rel)
    fr_url = 'https://adermio.com/' + fr_clean
    cs_url = 'https://adermio.com/' + clean(cs_rel)
    notes = []

    html, n = re.subn(r'<html lang="fr"', '<html lang="cs"', html, count=1)
    if not n: notes.append('!! pas de <html lang="fr">')

    html = html.replace(f'<link rel="canonical" href="{fr_url}">', f'<link rel="canonical" href="{cs_url}">')
    html = html.replace(f'<meta property="og:url" content="{fr_url}">', f'<meta property="og:url" content="{cs_url}">')
    html = html.replace('<meta property="og:locale" content="fr_FR">', '<meta property="og:locale" content="cs_CZ">')

    # hreflang « cs » : la page CS se déclare elle-même, juste avant x-default (ou après le dernier alternate)
    html = re.sub(r'[ \t]*<link rel="alternate" hreflang="cs(-CZ)?" href="[^"]*">\n', '', html)
    alts = list(re.finditer(r'([ \t]*)<link rel="alternate" hreflang="([a-z-]+)" href="[^"]*">\n', html))
    if alts:
        xd = [a for a in alts if a.group(2) == 'x-default']
        if xd: pos, ind = xd[0].start(), xd[0].group(1)
        else: pos, ind = alts[-1].end(), alts[-1].group(1)
        html = html[:pos] + f'{ind}<link rel="alternate" hreflang="cs" href="{cs_url}">\n' + html[pos:]
    else:
        notes.append('pas de bloc hreflang')

    html, ok = rebuild_dropdown(html, twins)
    if not ok: notes.append('pas de lang-dropdown')
    html, n = SEL_BTN.subn(r'\1cz\2CS\3', html)
    if not n and ok: notes.append('bouton sélecteur non trouvé')
    html = html.replace('<span class="font-sans font-medium text-sm">FR</span>', '<span class="font-sans font-medium text-sm">CS</span>')

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
        line = line.replace('href="/"', 'href="/cs/home"')
        line = re.sub(r'(?<=["\'])https://adermio\.com/(?=["\'])', 'https://adermio.com/cs/home', line)
        line = line.replace('href="https://adermio.com/en/"', 'href="https://adermio.com/en/home"')
        out.append(line)
    html = '\n'.join(out).replace('__FR_URL__', fr_url)

    # backend : webhooks FR -> CS (ligne du webhook gratuit ÉPINGLÉE, jamais déduite du FR), lang JS
    html = re.sub(r"const WEBHOOK_URL = '[^']*';[^\n]*",
                  "const WEBHOOK_URL = 'https://n8n.adermio.com/webhook/" + CS_FREE_WEBHOOK
                  + "'; // Analyse gratuite CS : workflow n8n à créer (phase 2) avec ce webhook", html)
    html = re.sub(r'webhook/(form-test-fr[a-z0-9-]*|analyse-gratuite-fr-[a-z0-9-]*)', 'webhook/' + CS_FREE_WEBHOOK, html)
    html = html.replace('webhook/second-cycle-fr', 'webhook/' + CS_SECOND_CYCLE_WEBHOOK)
    html = re.sub(r"lang:\s*'fr'", "lang: 'cs'", html)
    html = html.replace('params.append("lang", "fr")', 'params.append("lang", "cs")')
    html = html.replace('/free-analysis?jobId=${encodeURIComponent(jobId)}`', '/free-analysis?jobId=${encodeURIComponent(jobId)}&lang=cs`')

    # visuels : vidéo et captures anglaises (les écrans tchèques sont faits pour le nouveau site)
    html = html.replace('video-finale-prod-fr.mp4', 'adermio-en-video.mp4')
    for fr_img, en_img in VISUALS.items():
        html = html.replace(fr_img, en_img)

    # JSON-LD : la source FR s'arrête à Polish (copie d'avant la bascule) ou à Portuguese (page en place)
    html = re.sub(r'("availableLanguage": \["French", "English", "Spanish", "Italian", "German", "Dutch", "Greek", "Polish")(, "Portuguese")?\]',
                  r'\1, "Portuguese", "Czech"]', html)
    html = re.sub(r'("inLanguage": \["fr", "en", "es", "it", "de", "nl", "el", "pl")(, "pt")?\]', r'\1, "pt", "cs"]', html)

    dst = cs_path(cs_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(html)
    return cs_rel, notes, os.path.relpath(dst, os.path.dirname(ROOT))

if __name__ == '__main__':
    for fr in sys.argv[1:] or list(PAGES):
        cs_rel, notes, where = transform(fr)
        print(f'{fr:48s} -> {where:62s} {"; ".join(notes)}')
