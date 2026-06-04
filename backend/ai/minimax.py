import random
from backend.game.board import CASES_JOUABLES
from backend.game.rules import Rules, CARRES_POSSIBLES
from backend.ai.evaluator import evaluer

INF = float('inf')

def _cases_vides(board):
    return [(r, c) for (r, c) in CASES_JOUABLES if board.est_libre(r, c)]

def _cases_strategiques(board, couleur):
    """
    Cases vides pour la phase de pose :
    - Offensif : coins de carrés sans adversaire
    - Défensif : coins de carrés où l'adversaire a 2+ pièces (bloquer même si on y est déjà)
    Si aucune case trouvée, retourne toutes les cases vides 
    """
    if couleur == "clair":
        couleur_adverse = "fonce"
    else:
        couleur_adverse = "clair"

    offensif  = set()
    defensif  = set()

    for coins in CARRES_POSSIBLES:
        enemy = sum(1 for p in coins if board.get(*p) == couleur_adverse)
        vides = [p for p in coins if board.est_libre(*p)]

        if enemy == 0 and vides:
            for p in vides:
                offensif.add(p)

        if enemy >= 2 and vides:
            for p in vides:
                defensif.add(p)

    interessantes = offensif | defensif
    return list(interessantes) if interessantes else _cases_vides(board)

def _coups_deplacement(board, couleur):
    coups = []
    for (r, c) in CASES_JOUABLES:
        if board.get(r, c) == couleur:
            coups += Rules.deplacements_valides(board, r, c, board.dernier_coup)
    return coups

def _generer_coups(game, complet=False):
    """
    Génère les coups possibles pour le joueur actif.
    si complet=False (Moyen) : pose ou déplacement selon la phase en cours.
    si complet=True (Difficile) : les deux combinés pour détecter les victoires
    par déplacement même pendant la phase de pose.
    """
    joueur = game.joueur_actif
    if joueur.peut_poser():
        coups = [("poser", r, c) for (r, c) in _cases_strategiques(game.board, joueur.couleur)]
        if complet:
            coups += _coups_deplacement(game.board, joueur.couleur)
        return coups
    return _coups_deplacement(game.board, joueur.couleur)

def _appliquer(game, coup):
    """Applique un coup sur une copie du jeu et retourne la copie."""
    copie = game.copier()
    if coup[0] == "poser":
        copie.jouer_poser(coup[1], coup[2])
    else:
        copie.jouer_deplacement(coup)
    return copie

def _score_terminal(game, couleur_ia):
    """Score quand la partie est finie : +inf si IA gagne, -inf si elle perd."""
    if game.gagnant and game.gagnant.couleur == couleur_ia:
        return INF
    return -INF

# Niveau facile 

def coup_facile(game):
    """Coup entièrement aléatoire."""
    coups = _generer_coups(game)
    return random.choice(coups) if coups else None

# Niveaux Moyen et Difficile (Minimax + alpha-bêta)
def _appliquer_board(board, coup, couleur_actif):
    """Applique un coup sur une copie légère du board seul """
    b = board.copier()
    t = coup[0]
    if t == "poser":
        b.grille[coup[1]][coup[2]] = couleur_actif
    elif t == "glisser":
        _, r1, c1, r2, c2, *_ = coup
        b.grille[r2][c2] = b.grille[r1][c1]
        b.grille[r1][c1] = None
    elif t == "pousser":
        _, r1, c1, r2, c2, r3, c3, *_ = coup
        b.grille[r3][c3] = b.grille[r2][c2]
        b.grille[r2][c2] = b.grille[r1][c1]
        b.grille[r1][c1] = None
    elif t == "pousser_ejecter":
        _, r1, c1, r2, c2, *_ = coup
        b.grille[r2][c2] = b.grille[r1][c1]
        b.grille[r1][c1] = None
    elif t == "ejecter":
        _, r1, c1, *_ = coup
        b.grille[r1][c1] = None
    return b

def _trier_coups(game, coups, maximise, couleur_ia):
    """Trie les coups du meilleur au moins bon avant de les explorer(meilleurs en tête)"""
    adv = "fonce" if couleur_ia == "clair" else "clair"
    actif = game.joueur_actif.couleur
    def score(coup):
        b = _appliquer_board(game.board, coup, actif)
        return evaluer(b, couleur_ia) - evaluer(b, adv)
    return sorted(coups, key=score, reverse=maximise)

def _minimax(game, profondeur, maximise, alpha, beta, couleur_ia, complet=False):
    """
    Minimax avec élagage alpha-bêta + tri des coups
    utilisé pour Moyen (profondeur=2) et Difficile (profondeur=4).
    """
    if game.termine:
        return _score_terminal(game, couleur_ia)

    if profondeur <= 0:
        adv = "fonce" if couleur_ia == "clair" else "clair"
        return evaluer(game.board, couleur_ia) - evaluer(game.board, adv)

    coups = _generer_coups(game, complet)
    if not coups:
        return 0

    # Tri pour maximiser les coupures alpha-bêta
    if profondeur >= 2:
        coups = _trier_coups(game, coups, maximise, couleur_ia)

    if maximise:
        valeur = -INF
        for coup in coups:
            enfant = _appliquer(game, coup)
            valeur = max(valeur, _minimax(enfant, profondeur - 1, False, alpha, beta, couleur_ia, complet))
            alpha  = max(alpha, valeur)
            if beta <= alpha:
                break  # coupure bêta
        return valeur
    else:
        valeur = INF
        for coup in coups:
            enfant = _appliquer(game, coup)
            valeur = min(valeur, _minimax(enfant, profondeur - 1, True, alpha, beta, couleur_ia, complet))
            beta   = min(beta, valeur)
            if beta <= alpha:
                break  # coupure alpha
        return valeur

def coup_minimax(game, profondeur):
    """
    Retourne le meilleur coup trouvé par le Minimax.
    en phase de pose, la profondeur est limitée à 2 même en Difficile
    car le nombre de coups possibles est trop élevé.
    """
    couleur_ia = game.joueur_actif.couleur
    complet    = (profondeur >= 4)
    prof_eff   = min(profondeur, 2) if game.joueur_actif.peut_poser() else profondeur

    coups = _generer_coups(game, complet)
    if not coups:
        return None

    meilleur_coup  = None
    meilleur_score = -INF

    for coup in coups:
        enfant = _appliquer(game, coup)
        score  = _minimax(enfant, prof_eff - 1, False, -INF, INF, couleur_ia, complet)
        if score > meilleur_score:
            meilleur_score = score
            meilleur_coup  = coup

    return meilleur_coup if meilleur_coup is not None else coups[0]
