from backend.game.board import CASE_HORS_PLATEAU
from backend.game.rules import CARRES_POSSIBLES


def evaluer(board, couleur):
    """
    Retourne un score à la position actuelle pour 'couleur'.
    Pour chaque carré possible: si l'adversaire y est présent, le carré est mort (0 point).
    Sinon, score += (pièces amies)² , ce qui favorise les carrés presque complets.
    """
    score = 0

    for coins in CARRES_POSSIBLES:
        friendly = 0
        enemy    = 0

        for (r, c) in coins:
            valeur = board.get(r, c)
            if valeur == couleur:
                friendly += 1
            elif valeur is not None and valeur != CASE_HORS_PLATEAU:
                enemy += 1

        if enemy == 0 and friendly > 0:
            score += friendly * friendly

    return score