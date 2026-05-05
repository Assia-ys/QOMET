import random
from backend.game.board import CASES_JOUABLES
from backend.game.rules import Rules
from backend.ai.evaluator import evaluer


# ── Utilitaires partagés ───────────────────────────────────────────────────────

def _cases_vides(board):
    """Cases jouables vides — utilise board.est_libre() existant."""
    return [(r, c) for (r, c) in CASES_JOUABLES if board.est_libre(r, c)]


def _coups_deplacement(board, couleur):
    """Tous les coups de déplacement valides pour 'couleur' — utilise Rules.deplacements_valides()."""
    coups = []
    for (r, c) in CASES_JOUABLES:
        if board.get(r, c) == couleur:
            coups += Rules.deplacements_valides(board, r, c, board.dernier_coup)
    return coups


# ── Niveau Facile ──────────────────────────────────────────────────────────────

def coup_facile(game):
    """
    Niveau Facile : coup entièrement aléatoire.
    - Si peut poser   → case vide au hasard
    - Sinon           → coup de déplacement au hasard
    Retourne ("poser", r, c) ou un tuple coup complet, ou None.
    """
    joueur = game.joueur_actif

    if joueur.peut_poser():
        vides = _cases_vides(game.board)
        if vides:
            r, c = random.choice(vides)
            return ("poser", r, c)

    coups = _coups_deplacement(game.board, joueur.couleur)
    return random.choice(coups) if coups else None
