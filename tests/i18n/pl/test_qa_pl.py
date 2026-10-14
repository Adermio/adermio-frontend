#!/usr/bin/env python3
"""Contre-épreuves de qa_pl : chaque défaut injecté doit sonner, chaque phrase polonaise propre doit passer."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from qa_pl import segment_hits

P = 'pl/home.html'
def codes(seg, page=P): return {c for c, _ in segment_hits(seg, page)}

BAD = {
    'GENRE': ['Czy kiedykolwiek stosowałaś retinoidy?', 'Czy stosowałeś już ten krem?', 'Czy chciałabyś zacząć?', 'Jeśli zrobił(a)ś zdjęcie, prześlij je.'],
    'ADJ': ['Jesteś gotowa na zmianę?', 'Będziesz zadowolony z wyników.'],
    'REGISTRE': ['Prosimy Pana o przesłanie zdjęć.', 'Dziękujemy, że Pani wybrała Adermio.'],
    'MAJ': ['Oto Twoja analiza skóry.'],
    'INTERDIT': ['Otrzymasz diagnozę swojej skóry.', 'Nasza terapia działa szybko.', 'Wynik kliniczny w 2 minuty.'],
    'DERMA': ['Adermio to twój dermatolog w kieszeni.'],
    'FR': ['Votre analyse de peau est prête maintenant.', 'Merci pour votre confiance.'],
    'EN': ['Your skin analysis is ready, click here.'],
    'PAS_PL': ['Start free skin scan today now'],
    'ASCII': ['Twoja skora jest tlusta i bedzie lepiej.', 'Zrob zdjecie i wyslij sie teraz.'],
    'GREC': ['Η ανάλυση σας jest gotowa.'],
    'PRIX': ['Pełna analiza kosztuje 5,99 €.', 'Cena: € 24,99', 'Pełna analiza za 24.99 zł.'],
    'TYPO': ['Twój bilans J28 jest gotowy do pobrania.'],
    'GUILL': ['Kliknij « Wyślij », aby kontynuować.'],
    'ESPACE': ['Gotowe ! Twoja analiza jest w drodze.'],
}
GOOD = [
    'Twoja analiza skóry jest gotowa.', 'Czy stosujesz obecnie retinoidy?', 'Masz za sobą kurację izotretynoiną?',
    'Pełna analiza kosztuje 24,99 zł.', 'Kliknij „Wyślij”, aby kontynuować.', 'Gotowe! Twoja analiza jest w drodze.',
    'Twój bilans po 28 dniach jest gotowy do pobrania.', 'Zaskórniki otwarte pojawiają się na nosie i brodzie.',
    'Twoja twarz, twoje zdjęcia: przesyłasz je przez bezpieczne połączenie.',
    'Element rutyny, który pomija większość osób: filtr SPF codziennie.',
    'Budżet: < 60 €', 'Ta analiza nie zastępuje wizyty u dermatologa.',
]

def main():
    fails = []
    for code, segs in BAD.items():
        for s in segs:
            if code not in codes(s): fails.append(f'NON DÉTECTÉ {code}: {s!r} -> {sorted(codes(s))}')
    for s in GOOD:
        if codes(s): fails.append(f'FAUX POSITIF: {s!r} -> {sorted(codes(s))}')
    for f in fails: print(f)
    print('OK' if not fails else f'{len(fails)} échec(s)')
    sys.exit(1 if fails else 0)

if __name__ == '__main__':
    main()
