#!/usr/bin/env python3
"""Contre-épreuves de qa_cs : chaque défaut injecté doit sonner, chaque phrase tchèque propre doit passer."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from qa_cs import segment_hits

P = 'cs/home.html'
def codes(seg, page=P): return {c for c, _ in segment_hits(seg, page)}

BAD = {
    'GENRE': ['Už jste někdy použil retinoidy?', 'Použila jste už tento krém?', 'Pokud jste ji nikdy nepoužívali, začněte pomalu.',
              'Chtěl byste začít hned?', 'Abyste mohla nahrát fotky, povolte fotoaparát.', 'Jste připravena začít?',
              'Budete spokojen s výsledky.', 'Pokud jste udělal/a fotku, nahrajte ji.', 'Jste připraven(a)?',
              'Vážená zákaznice, děkujeme.', 'Budete informováni e-mailem.'],
    'REGISTRE': ['Tvoje pleť si zaslouží to nejlepší.', 'Pošli nám tři fotky.', 'Jsi připravený?', 'Můžeš začít hned teď.',
                 'Nezapomeň na opalovací krém.', 'Pošleme ti výsledky na tebe e-mail.'],
    'MAJ': ['Tady je Vaše analýza pleti.', 'Děkujeme Vám za důvěru.'],
    'ADERMIO': ['Vše o Adermiu.', 'Tým Adermia vám odpoví.'],
    'INTERDIT': ['Získejte diagnózu své pleti.', 'Naše terapie funguje rychle.', 'Klinický výsledek za 2 minuty.',
                 'Adermio vyléčí vaše akné.', 'Pomůžeme vám léčit akné.', 'Nabízíme léčbu akné na míru.',
                 'Rychlá diagnostika pleti.', 'Každý pacient je jiný.'],
    'DERMA': ['Adermio je váš kapesní dermatolog.', 'Dermatologická analýza pleti za pár minut.'],
    'FR': ['Votre analyse de peau est prête maintenant.', 'Merci pour votre confiance.'],
    'EN': ['Your skin analysis is ready, click here.'],
    'ES': ['Su análisis de piel está listo, gracias.'],
    'PT': ['A sua análise da pele está pronta.', 'Obrigado pela sua confiança.'],
    'PL': ['Twoja skóra jest wyjątkowa.', 'Analiza kosztuje 24,99 zł.'],
    'SK': ['Ďakujeme za vašu dôveru.', 'Môžete začať hneď teraz.', 'Výsledky sú pripravené, alebo nie.'],
    'ASCII': ['Muzete zacit hned, dekujeme.', 'Vase analyza pleti je hotova a vysledky jsou pripravene.'],
    'PAS_CS': ['Start free skin scan today now'],
    'GREC': ['Η ανάλυση je hotová.'],
    'PRIX': ['Kompletní analýza stojí 5,99 €.', 'Cena: € 6', 'Kompletní analýza za 149Kč.', 'Kompletní analýza za 199 Kč.',
             'Cena: 149 CZK', 'Kompletní analýza za 149,00 Kč.'],
    'TYPO': ['Vaše zhodnocení J28 je připraveno.', 'Spokojenost 98% uživatelů.', 'Aktualizováno 21 října 2026.',
             'Soubor má 2 Mo.'],
    'GUILL': ['Klikněte na « Odeslat ».', 'Klikněte na „Odeslat”.'],
    'ESPACE': ['Hotovo ! Vaše analýza je na cestě.', 'Typ pleti : mastná.'],
    'PLURIEL': ['Analýza trvá 5 minuty.', 'Výsledky za 2 minut uvidíte hned.', 'Sledování trvá 28 dny.', 'Máme 3 přípravků.'],
}
GOOD = [
    'Vaše analýza pleti je připravena.', 'Používáte retinoidy nyní nebo v minulosti?', 'Máte za sebou léčbu izotretinoinem?',
    'Užíváte nějaké léky na akné předepsané lékařem?', 'Kompletní analýza stojí 149 Kč.', 'Kompletní analýza za 149 Kč.',
    'Klikněte na „Odeslat“ a pokračujte.', 'Hotovo! Vaše analýza je na cestě.', 'Vaše zhodnocení po 28 dnech je připraveno ke stažení.',
    'Otevřené komedony se objevují na nose a na bradě.', 'Vaše tvář, vaše fotky: odesíláte je přes zabezpečené připojení.',
    'Rozpočet: < 60 €', 'Tato analýza nenahrazuje návštěvu dermatologa.', 'Vítejte v aplikaci Adermio.',
    'Děkujeme za vaši důvěru.', 'Stáhněte si svou zprávu v PDF.', 'Přes 2000 recenzí od uživatelů.',
    'Ranní a večerní rutina péče o pleť.', 'Spokojenost 98 % uživatelů.', 'Aktualizováno 21. října 2026.',
    'Analýza trvá 2 minuty.', 'Výsledky do 3 dnů.', 'Výsledek uvidíte za 5 dní.',
    'Sledování trvá 28 dní.', 'Typ pleti: mastná, smíšená, suchá, citlivá nebo normální.',
    'V těhotenství a při kojení některé složky vynecháme.',
    'Tým Adermio vám odpoví do 48 hodin.', 'Vy rozhodujete, my analyzujeme.', 'Nezapomeňte na opalovací krém s SPF.',
    'Jestli vás akné trápí dlouho, začněte analýzou.',
    'Zcela zdarma a bez registrace.', 'Akné je nejčastější kožní problém dospívajících i dospělých.',
    'Nemusíte se registrovat ani nic platit.', 'Pupínky, zarudnutí a jizvy po akné hodnotíme zvlášť.',
    'Výsledky vás potěší.', 'Přejete si začít?', 'Zjistěte svůj typ pleti.', 'Pomůžeme vám akné zvládnout.',
    'Hormonální akné se často objevuje na bradě a linii čelisti.', 'Uživatelé hodnotí aplikaci 4,8 z 5.',
    'Jsem moc spokojená, výsledky jsou skvělé.', 'Ať jste kdekoli, analýzu uděláte z mobilu.', 'Jste těhotná nebo kojíte?',
    'Uživatel souhlasí s obchodními podmínkami.', 'Správcem osobních údajů je Adermio.', 'Máte otázky? Napište nám.',
    'Obsahuje niacinamid, zinek a kyselinu salicylovou.', 'Ochrana osobních údajů (GDPR)', 'Dejte nám vědět, co si myslíte.',
    'Recenze: „Moje pleť se za měsíc zlepšila, vyzkoušela jsem toho hodně.“ – Camille, 24 let',
]

def main():
    fails = []
    n_bad = 0
    for code, segs in BAD.items():
        for s in segs:
            n_bad += 1
            if code not in codes(s): fails.append(f'NON DÉTECTÉ {code}: {s!r} -> {sorted(codes(s))}')
    for s in GOOD:
        if codes(s): fails.append(f'FAUX POSITIF: {s!r} -> {sorted(codes(s))}')
    for f in fails: print(f)
    print(f'{n_bad} défauts injectés, {len(GOOD)} phrases propres : ' + ('OK' if not fails else f'{len(fails)} échec(s)'))
    sys.exit(1 if fails else 0)

if __name__ == '__main__':
    main()
