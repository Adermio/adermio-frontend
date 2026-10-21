#!/usr/bin/env python3
"""Contre-épreuves de qa_pt : chaque défaut injecté doit sonner, chaque phrase portugaise (Portugal) propre doit passer."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from qa_pt import segment_hits

P = 'pt/home.html'
def codes(seg, page=P): return {c for c, _ in segment_hits(seg, page)}

BAD = {
    'GENRE': ['Bem-vindo à Adermio!', 'Bem-vinda ao seu espaço.', 'Está pronta para começar?', 'Fique tranquilo(a), a análise é gratuita.',
              'Caro cliente, obrigado.', 'Sente-se preparado para mudar?'],
    'REGISTRE': ['Você vai receber o seu relatório.', 'A tua pele merece o melhor.', 'Enviamos-te um e-mail.'],
    'BR': ['Toque na tela para continuar.', 'Use o seu celular para tirar a foto.', 'A nossa equipe responde rapidamente.',
           'Entre em contato connosco.', 'Estamos analisando as suas fotos.', 'Este creme é comedogênico.',
           'O estresse agrava as espinhas.', 'Faça o seu cadastro em 2 minutos.'],
    'MAJ': ['Eis a Sua análise da pele.'],
    'INTERDIT': ['Receba o diagnóstico da sua pele.', 'A nossa terapia funciona depressa.', 'Resultado clínico em 2 minutos.',
                 'A Adermio vai curar a sua acne.', 'Ajudamos a tratar a acne.'],
    'DERMA': ['A Adermio é o seu dermatologista de bolso.'],
    'FR': ['Votre analyse de peau est prête maintenant.', 'Merci pour votre confiance.'],
    'EN': ['Your skin analysis is ready, click here.'],
    'ES': ['Su análisis de piel está listo, gracias.', 'Usted recibirá el informe y los consejos.'],
    'PAS_PT': ['Start free skin scan today now'],
    'ASCII': ['A sua analise nao demora.', 'O relatorio tambem inclui a rotina.'],
    'GREC': ['Η ανάλυση está pronta.'],
    'PL': ['A análise custa 24,99 zł.', 'Twoja skóra é única.'],
    'PRIX': ['A análise completa custa 4,99 €.', 'Preço: € 5,99', 'Análise completa por 5.99 €.'],
    'TYPO': ['A sua avaliação J28 está disponível.'],
    'GUILL': ['Clique em „Enviar” para continuar.', 'Clique em « Enviar » para continuar.'],
    'ESPACE': ['Pronto ! A sua análise está a caminho.'],
}
GOOD = [
    'A sua análise da pele está pronta.', 'Toma alguma medicação para a acne?', 'Já fez um tratamento com isotretinoína?',
    'A análise completa custa 5,99 €.', 'Clique em «Enviar» para continuar.', 'Tudo pronto! A sua análise está a caminho.',
    'A sua avaliação ao dia 28 está pronta para descarregar.', 'Os pontos negros aparecem no nariz e no queixo.',
    'O seu rosto, as suas fotos: são enviadas através de uma ligação segura.', 'Boas-vindas à Adermio.',
    'Orçamento: < 60 €', 'Esta análise não substitui uma consulta de dermatologia.', 'Estamos a analisar as suas fotos.',
    'O relatório está pronto.', 'Este creme não é comedogénico.', 'O stress agrava as borbulhas.',
    'Entre em contacto connosco pelo formulário.', 'Trata-se de uma análise da pele, não de um aconselhamento médico.',
    'A gravidez muda a pele: por isso perguntamos.', 'Obrigado pela sua confiança.', 'Descarregue o seu relatório em PDF.',
    'Mais de 2000 avaliações de utilizadores.', 'Plano de cuidados, rotina da manhã e da noite.',
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
