#!/usr/bin/env python3
"""Contre-épreuves des détecteurs de qa_nl.py : chaque piège DOIT sonner, chaque phrase néerlandaise correcte NE DOIT PAS.

Un détecteur qui ne sonne jamais est aussi faux qu'un détecteur qui sonne tout le temps : ce test prouve les deux.

Usage : python3 tests/i18n/nl/test_qa_nl.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import qa_nl as q

def fr(seg):  return bool(q.STRONG.search(seg) or len(q.FR_RE.findall(seg)) >= 3 or q.has_fr_morphology(seg))
def en(seg):  return len(q.EN_RE.findall(seg)) >= 2
def de(seg):  return bool(q.DE_RE.search(seg))
def u(seg):   return bool(q.U_RE.search(seg))
def ban(seg): return bool(q.BANNED_RE.search(seg))
def sty(seg): return bool(q.STYLE_RE.search(seg) or q.DERMA_RE.search(seg) or q.JDAY_RE.search(seg))
def typo(seg): return bool(q.SPACE_PUNCT_RE.search(seg))

MUST_HIT = [
    (fr, 'Recevez votre analyse complète en quelques minutes.'),
    (fr, 'Remplissez le formulaire ci-dessous'),
    (fr, 'Veuillez réessayer plus tard'),
    (en, 'Get your free skin analysis today'),
    (en, 'Please click here to continue'),
    (de, 'Starten Sie Ihre kostenlose Hautanalyse'),
    (de, 'Ihre Haut ist einzigartig und verdient Pflege'),
    (u,  'Start uw gratis huidanalyse'),
    (u,  'Wij helpen u graag verder'),
    (u,  'Vul hier uzelf in'),
    (ban, 'Ontvang een nauwkeurige diagnose van je huid'),
    (ban, 'Onze klinische methode'),
    (ban, 'Beste patiënt, je resultaten zijn klaar'),
    (ban, 'Je huid kan genezen in 28 dagen'),
    (sty, 'Je hebt een gecombineerde huid'),
    (sty, 'Vermijd overtollig talg'),
    (sty, 'Gelieve je e-mailadres in te vullen'),
    (sty, 'Je score op J28'),
    (sty, 'Maximaal 5 Mo per foto'),
    (sty, 'Kies “Openen in browser” of «Openen»'),
    (sty, 'Het advies van onze AI-dermatoloog'),
    (sty, 'Adermio werkt als een dermatoloog in je zak'),
    (typo, 'Klaar ?'),
    (typo, 'Let op : dit is belangrijk'),
    (typo, 'Klaar !'),
]
MUST_PASS = [
    'Start je gratis huidanalyse',
    'De analyse van je huid duurt maar een paar minuten en is helemaal gratis.',
    'Je krijgt pas na 28 dagen een volledig beeld van je routine en de resultaten.',
    'Mensen die acne hebben, hebben er vaak ook last van op de kaaklijn en in de T-zone of U-zone.',
    'Geen abonnement: een eenmalige betaling van € 5,99.',
    'Gebruik je medicijnen tegen acne, bijvoorbeeld van je huisarts of dermatoloog?',
    'Plus: je ochtendroutine en avondroutine op maat, met een serum en SPF 50+.',
    'Was je gezicht met lauw water en dep het droog met een schone handdoek.',
    'Betrouwbaarheid: 87%',
    'Ernst: matig',
    'Hormonale acne: herkennen en aanpakken',
    'Een supplement of het abonnement van de app is niet nodig.',
    'Wist je dat? Je huid vernieuwt zich ongeveer elke 28 dagen.',
]

def main():
    failed = 0
    for det, seg in MUST_HIT:
        if not det(seg):
            failed += 1; print(f'NE SONNE PAS ({det.__name__}) : {seg}')
    for seg in MUST_PASS:
        for det in (fr, en, de, u, ban, sty, typo):
            if det(seg):
                failed += 1; print(f'FAUX POSITIF ({det.__name__}) : {seg}')
    print(f'{len(MUST_HIT)} pièges, {len(MUST_PASS)} phrases correctes : ' + ('OK' if not failed else f'{failed} ÉCHEC(S)'))
    sys.exit(1 if failed else 0)

if __name__ == '__main__':
    main()
