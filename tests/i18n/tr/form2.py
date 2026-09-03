# Table de traduction it/form2.html (source formulaire2.html) = table de form.py adaptée.
# Écarts formulaire.html → formulaire2.html (diff) : écran de choix scan/manuel visible,
# bouton « Démarrer le scan » à la place de « Scan vidéo automatique », commentaires et
# loader MediaPipe (non traduits). Tout le reste est identique.
import importlib.util, os

_p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'form.py')
_spec = importlib.util.spec_from_file_location('tr_form_base', _p)
_base = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_base)

TARGET = 'it/form2.html'

_ONLY_FORM = {
    "Scan vid&eacute;o automatique",                       # bouton BETA absent de form2
}
TR = [e for e in _base.TR if e[0] not in _ONLY_FORM] + [
    ("D&eacute;marrer le scan", "Avvia la scansione", 1),
]
REGEX = []
