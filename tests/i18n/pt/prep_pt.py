#!/usr/bin/env python3
"""Prépare le squelette portugais (Portugal) d'une page à partir de la page FR (dérivé de prep_pl.py).

Applique UNIQUEMENT les transformations non textuelles (lang, canonical, og:url, og:locale, hreflang, carte de liens,
sélecteur de langue, webhooks, lang JS, visuels anglais, liens d'abonnement FR retirés du pied de page).
Le texte reste en français : la traduction se fait ensuite, littéral par littéral (apply_tr_pt.py + tr_pt/).

Depuis la bascule du 19/10 (nouveau site), deux familles de pages :
  - pages devenues le nouveau site (accueil, formulaire, légal, blog…) : la page FR d'origine est dans
    output/site-v2/source-v1/ ; la page PT préparée va dans source-v1/pt/ (source des générateurs build_*_pt.py,
    jamais servie telle quelle) ;
  - pages de parcours restées à l'ancien design (premium, bilan, second-cycle, feedback, processing2…) : FR à la racine
    du site, PT dans adermio-site/pt/ (servies).

Usage : python3 tests/i18n/pt/prep_pt.py              # toutes les pages
        python3 tests/i18n/pt/prep_pt.py index.html   # une page
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'el'))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'pl'))
import prep_el, prep_pl

ROOT = prep_el.ROOT
SRC_V1 = os.path.join(os.path.dirname(ROOT), 'output', 'site-v2', 'source-v1')
clean = prep_el.clean
block_end = prep_el.block_end
VISUALS = prep_el.VISUALS
FR_ONLY_FOOTER = prep_el.FR_ONLY_FOOTER
SEL_BTN = prep_el.SEL_BTN

# Pages de contenu : noms portugais sans diacritiques ; pages de parcours : mêmes noms que les autres langues
# (le backend construit /pt/success, /pt/premium…).
PT_NAMES = {
    'index.html': 'pt/home.html', 'about.html': 'pt/sobre-nos.html', 'formulaire.html': 'pt/form.html',
    'contact.html': 'pt/contacto.html', 'conditions.html': 'pt/termos-de-utilizacao.html',
    'confidentialite.html': 'pt/politica-de-privacidade.html', 'mentions-legales.html': 'pt/informacoes-legais.html',
    'sources.html': 'pt/fontes.html', 'feedback.html': 'pt/feedback.html', 'success.html': 'pt/success.html',
    'premium.html': 'pt/premium.html', 'premium-second-cycle.html': 'pt/premium-second-cycle.html',
    'second-cycle.html': 'pt/second-cycle.html', 'bilan.html': 'pt/bilan.html',
    'analyse-en-cours.html': 'pt/processing.html', 'analyse-en-cours2.html': 'pt/processing2.html',
    'analyse-en-cours-second-cycle.html': 'pt/analysis-in-progress-second-cycle.html',
    'blog/index.html': 'pt/blog/index.html',
    'blog/comment-connaitre-son-type-de-peau.html': 'pt/blog/tipo-de-pele.html',
    'blog/pourquoi-a-t-on-de-l-acne.html': 'pt/blog/porque-temos-acne.html',
    'blog/acne-hormonale.html': 'pt/blog/acne-hormonal.html',
    'blog/ou-apparait-l-acne.html': 'pt/blog/onde-aparece-a-acne.html',
    # Condições de venda (CGV) ; página de cancelamento da subscrição : oculta (noindex), como nas outras línguas
    'cgv.html': 'pt/condicoes-de-venda.html', 'resilier.html': 'pt/cancelar-subscricao.html',
}
# FR source -> (PT cible, jumeau EN, ES, IT, DE, NL, EL, PL)   (jumeaux = sélecteur de langue)
PAGES = {fr: (PT_NAMES[fr], *v[1:], clean(v[0])) for fr, v in prep_pl.PAGES.items()}
assert set(PAGES) == set(PT_NAMES), set(PAGES) ^ set(PT_NAMES)

def fr_path(fr_rel):
    """Page FR d'origine : copie d'avant la bascule si elle existe, sinon la page en place."""
    p = os.path.join(SRC_V1, fr_rel)
    return p if os.path.exists(p) else os.path.join(ROOT, fr_rel)

def pt_path(pt_rel):
    """Fichier PT préparé : source-v1/pt/ pour les pages devenues le nouveau site, adermio-site/pt/ sinon."""
    fr_rel = [k for k, v in PAGES.items() if v[0] == pt_rel][0]
    base = SRC_V1 if os.path.exists(os.path.join(SRC_V1, fr_rel)) else ROOT
    return os.path.join(base, pt_rel)

def pt_exists(p):
    """Une adresse /pt/… existera-t-elle (page préparée ici, ou page du nouveau site) ?"""
    return any(os.path.exists(os.path.join(b, c)) for b in (ROOT, SRC_V1, os.path.join(ROOT, 'v2'))
               for c in (p + '.html', p + '/index.html'))

# Webhooks de l'analyse portugaise : à créer dans n8n (phase 2) avec CES chemins, jamais déduits du FR.
# Tant qu'ils n'existent pas, /pt/ reste caché (noindex, hors sélecteur des autres langues).
PT_FREE_WEBHOOK = 'analyse-gratuite-pt-web'

LINKMAP = {clean(fr) if fr != 'index.html' else '': clean(pt) for fr, (pt, *_rest) in PAGES.items()}
LINKMAP['blog'] = 'pt/blog'
LINKMAP.pop('blog/index', None)
LINKMAP['formulaire2'] = 'pt/form'  # page FR sans jumeau, liée depuis des pages traduites
FR_PATHS = sorted([k for k in LINKMAP if k], key=len, reverse=True)

def rebuild_dropdown(html, twins):
    """Remplace le contenu du <div class="lang-dropdown ..."> : PT courant + EN/ES/IT/DE/NL/EL/PL/FR."""
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
    en, es, it, de, nl, el, pl = twins
    body = (entry('#', 'pt', 'Português', True)
            + entry(f'https://adermio.com/{en}', 'us', 'English', False)
            + entry(f'https://adermio.com/{es}', 'es', 'Español', False)
            + entry(f'https://adermio.com/{it}', 'it', 'Italiano', False)
            + entry(f'https://adermio.com/{de}', 'de', 'Deutsch', False)
            + entry(f'https://adermio.com/{nl}', 'nl', 'Nederlands', False)
            + entry(f'https://adermio.com/{el}', 'gr', 'Ελληνικά', False)
            + entry(f'https://adermio.com/{pl}', 'pl', 'Polski', False)
            + entry('__FR_URL__', 'fr', 'Français', False))
    closing_ind = ind[:-4] if len(ind) >= 4 else ''
    return html[:start] + head + '\n' + body + closing_ind + '</div>' + html[end:], True

def transform(fr_rel):
    pt_rel, *twins = PAGES[fr_rel]
    html = open(fr_path(fr_rel), encoding='utf-8').read()
    fr_clean = '' if fr_rel == 'index.html' else clean(fr_rel)
    fr_url = 'https://adermio.com/' + fr_clean
    pt_url = 'https://adermio.com/' + clean(pt_rel)
    notes = []

    html, n = re.subn(r'<html lang="fr"', '<html lang="pt-PT"', html, count=1)
    if not n: notes.append('!! pas de <html lang="fr">')

    html = html.replace(f'<link rel="canonical" href="{fr_url}">', f'<link rel="canonical" href="{pt_url}">')
    html = html.replace(f'<meta property="og:url" content="{fr_url}">', f'<meta property="og:url" content="{pt_url}">')
    html = html.replace('<meta property="og:locale" content="fr_FR">', '<meta property="og:locale" content="pt_PT">')

    # hreflang « pt » (générique : les lusophones du Brésil aussi y sont envoyés) ; html lang="pt-PT" (texte européen)
    # hreflang : la page PT se déclare elle-même, juste avant x-default (ou après le dernier alternate)
    html = re.sub(r'[ \t]*<link rel="alternate" hreflang="pt(-PT)?" href="[^"]*">\n', '', html)
    alts = list(re.finditer(r'([ \t]*)<link rel="alternate" hreflang="([a-z-]+)" href="[^"]*">\n', html))
    if alts:
        xd = [a for a in alts if a.group(2) == 'x-default']
        if xd: pos, ind = xd[0].start(), xd[0].group(1)
        else: pos, ind = alts[-1].end(), alts[-1].group(1)
        html = html[:pos] + f'{ind}<link rel="alternate" hreflang="pt" href="{pt_url}">\n' + html[pos:]
    else:
        notes.append('pas de bloc hreflang')

    html, ok = rebuild_dropdown(html, twins)
    if not ok: notes.append('pas de lang-dropdown')
    html, n = SEL_BTN.subn(r'\1pt\2PT\3', html)
    if not n and ok: notes.append('bouton sélecteur non trouvé')
    html = html.replace('<span class="font-sans font-medium text-sm">FR</span>', '<span class="font-sans font-medium text-sm">PT</span>')

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
        line = line.replace('href="/"', 'href="/pt/home"')
        line = re.sub(r'(?<=["\'])https://adermio\.com/(?=["\'])', 'https://adermio.com/pt/home', line)
        line = line.replace('href="https://adermio.com/en/"', 'href="https://adermio.com/en/home"')
        out.append(line)
    html = '\n'.join(out).replace('__FR_URL__', fr_url)

    # backend : webhooks FR -> PT (ligne du webhook gratuit ÉPINGLÉE, jamais déduite du FR), lang JS
    html = re.sub(r"const WEBHOOK_URL = '[^']*';[^\n]*",
                  "const WEBHOOK_URL = 'https://n8n.adermio.com/webhook/" + PT_FREE_WEBHOOK
                  + "'; // Analyse gratuite PT : workflow n8n à créer (phase 2) avec ce webhook", html)
    html = re.sub(r'webhook/(form-test-fr[a-z0-9-]*|analyse-gratuite-fr-[a-z0-9-]*)', 'webhook/' + PT_FREE_WEBHOOK, html)
    html = html.replace('webhook/second-cycle-fr', 'webhook/second-cycle-pt')
    html = re.sub(r"lang:\s*'fr'", "lang: 'pt'", html)
    html = html.replace('params.append("lang", "fr")', 'params.append("lang", "pt")')
    html = html.replace('/free-analysis?jobId=${encodeURIComponent(jobId)}`', '/free-analysis?jobId=${encodeURIComponent(jobId)}&lang=pt`')

    # visuels : vidéo et captures anglaises (les écrans portugais sont faits pour le nouveau site)
    html = html.replace('video-finale-prod-fr.mp4', 'adermio-en-video.mp4')
    for fr_img, en_img in VISUALS.items():
        html = html.replace(fr_img, en_img)

    html = re.sub(r'("availableLanguage": \["French", "English", "Spanish", "Italian", "German", "Dutch", "Greek", "Polish")\]',
                  r'\1, "Portuguese"]', html)
    html = re.sub(r'("inLanguage": \["fr", "en", "es", "it", "de", "nl", "el", "pl")\]', r'\1, "pt"]', html)

    dst = pt_path(pt_rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8').write(html)
    return pt_rel, notes, os.path.relpath(dst, os.path.dirname(ROOT))

if __name__ == '__main__':
    for fr in sys.argv[1:] or list(PAGES):
        pt_rel, notes, where = transform(fr)
        print(f'{fr:48s} -> {where:62s} {"; ".join(notes)}')
