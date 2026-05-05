from backend.game.board import CASE_HORS_PLATEAU
from backend.game.rules import CARRES_POSSIBLES


def evaluer(board, couleur):
    """
    Évalue la position du plateau pour le joueur 'couleur'.

    Pour chacun des 15 carrés possibles :
    - Si aucun coin adversaire → score += friendly²
    - Si au moins 1 coin adversaire → carré mort, score += 0

    Retourne un entier positif ou nul.
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