from backend.game.board import CASES_JOUABLES, TAILLE, CASE_HORS_PLATEAU

# Cases du carré extérieur : les seules depuis lesquelles on peut s'éjecter volontairement
CASES_CARRE_EXTERIEUR = {(0,0), (0,3), (0,6), (3,0), (3,6), (6,0), (6,3), (6,6)}

DIRECTIONS_BASE = [
    (0,  1),  # droite
    (0, -1),  # gauche
    (1,  0),  # bas
    (-1, 0),  # haut
]

DIAG_PRINCIPALE  = [(1, 1), (-1, -1)]  # valide seulement si r == c
DIAG_SECONDAIRE  = [(1, -1), (-1, 1)]  # valide seulement si r + c == 6

def _directions_pour(row, col):
    """Retourne les directions accessibles depuis (row, col) selon les lignes du plateau."""
    dirs = list(DIRECTIONS_BASE)
    if row == col:
        dirs += DIAG_PRINCIPALE
    if row + col == 6:
        dirs += DIAG_SECONDAIRE
    return dirs

def _calculer_carres():
    """Pré-calcule les 15 carrés possibles du plateau une seule fois."""
    vus = set()
    carres = []
    cases = list(CASES_JOUABLES)
    for i, (r1, c1) in enumerate(cases):
        for r2, c2 in cases[i+1:]:
            if r1 != r2:
                continue
            hauteur = abs(c2 - c1)
            for sens in [1, -1]:
                r3, r4 = r1 + hauteur * sens, r2 + hauteur * sens
                c3, c4 = c1, c2
                if (r3, c3) in CASES_JOUABLES and (r4, c4) in CASES_JOUABLES:
                    carre = tuple(sorted([(r1,c1),(r1,c2),(r3,c3),(r4,c4)]))
                    if carre not in vus:
                        vus.add(carre)
                        carres.append(((r1,c1),(r1,c2),(r3,c3),(r4,c4)))
    return carres

CARRES_POSSIBLES = _calculer_carres()


class Rules:

    @staticmethod
    def prochaine_case_jouable(board, row, col, dr, dc):
        """
        Depuis (row,col) dans la direction (dr,dc),
        retourne la prochaine case jouable rencontrée.
        Retourne None si on sort du plateau sans en trouver.
        """
        r, c = row + dr, col + dc
        while board.est_valide(r, c):
            if board.est_jouable(r, c):
                return (r, c)
            r += dr
            c += dc
        return None  # sorti du plateau

    @staticmethod
    def deplacements_valides(board, row, col, dernier_coup):
        """
        Retourne tous les déplacements possibles pour l'étoile en (row, col).
        Chaque coup est un tuple décrivant l'action à effectuer.
        """
        resultats = []

        if not board.est_jouable(row, col):
            return []
        if board.get(row, col) is None:
            return []

        for dr, dc in _directions_pour(row, col):
            cible = Rules.prochaine_case_jouable(board, row, col, dr, dc)

            # --- Pas de case jouable dans cette direction → éjection volontaire ---
            if cible is None:
                if (row, col) in CASES_CARRE_EXTERIEUR:
                    coup = ("ejecter", row, col, dr, dc)
                    if not Rules._est_annulation(coup, dernier_coup):
                        resultats.append(coup)
                continue

            r2, c2 = cible

            # --- Case jouable libre → glissement ---
            if board.est_libre(r2, c2):
                coup = ("glisser", row, col, r2, c2, dr, dc)
                if not Rules._est_annulation(coup, dernier_coup):
                    resultats.append(coup)

            # --- Case jouable occupée → tentative de poussée ---
            else:
                cible2 = Rules.prochaine_case_jouable(board, r2, c2, dr, dc)

                if cible2 is not None and board.est_libre(*cible2):
                    # pousse l'étoile sur la case suivante jouable libre
                    coup = ("pousser", row, col, r2, c2, *cible2, dr, dc)
                    if not Rules._est_annulation(coup, dernier_coup):
                        resultats.append(coup)

                elif cible2 is None:
                    # pousser hors plateau uniquement si la case poussée est physiquement au bord
                    if not board.est_valide(r2 + dr, c2 + dc):
                        coup = ("pousser_ejecter", row, col, r2, c2, dr, dc)
                        if not Rules._est_annulation(coup, dernier_coup):
                            resultats.append(coup)

                # si cible2 est occupée → on ne peut pas pousser 2 étoiles

        return resultats

    @staticmethod
    def _est_annulation(coup, dernier_coup):
        """
        Vérifie si le coup annule exactement le coup précédent.
        Ex: glisser A→B puis B→A = annulation interdite.
        Ex: pousser A→B→C puis pousser C→B→A = annulation interdite.
        """
        if dernier_coup is None:
            return False

        # glisser A→B puis B→A
        if coup[0] == "glisser" and dernier_coup[0] == "glisser":
            if (coup[1], coup[2]) == (dernier_coup[3], dernier_coup[4]) and \
               (coup[3], coup[4]) == (dernier_coup[1], dernier_coup[2]):
                return True

        # pousser A→B→C puis pousser C→B→A (remet les deux étoiles à leur place)
        # dernier_coup: ("pousser", r1,c1, r2,c2, r3,c3, dr,dc)
        #   → actif allait de r1,c1 à r2,c2 ; adverse poussé de r2,c2 à r3,c3
        # coup annulant: ("pousser", r3,c3, r2,c2, r1,c1, -dr,-dc)
        if coup[0] == "pousser" and dernier_coup[0] == "pousser":
            if coup[1:3] == dernier_coup[5:7] and \
               coup[3:5] == dernier_coup[3:5] and \
               coup[5:7] == dernier_coup[1:3]:
                return True

        return False

    @staticmethod
    def appliquer_coup(board, coup, joueur_actif, joueur_adverse):
        """
        Applique le coup sur une copie du board.
        Retourne le nouveau board sans modifier l'original.
        """
        b = board.copier()
        type_coup = coup[0]

        if type_coup == "glisser":
            _, r1, c1, r2, c2, dr, dc = coup
            b.set(r2, c2, b.get(r1, c1))
            b.set(r1, c1, None)
            b.dernier_coup = coup

        elif type_coup == "pousser":
            _, r1, c1, r2, c2, r3, c3, dr, dc = coup
            b.set(r3, c3, b.get(r2, c2))  # étoile poussée avance
            b.set(r2, c2, b.get(r1, c1))  # étoile active avance
            b.set(r1, c1, None)
            b.dernier_coup = coup

        elif type_coup == "pousser_ejecter":
            _, r1, c1, r2, c2, dr, dc = coup
            couleur_poussee = b.get(r2, c2)
            if couleur_poussee == joueur_actif.couleur:
                joueur_actif.recuperer_etoile()
            else:
                joueur_adverse.recuperer_etoile()
            b.set(r2, c2, b.get(r1, c1))
            b.set(r1, c1, None)
            b.dernier_coup = coup

        elif type_coup == "ejecter":
            _, r1, c1, dr, dc = coup
            joueur_actif.recuperer_etoile()
            b.set(r1, c1, None)
            b.dernier_coup = coup

        else:
            raise ValueError(f"Type de coup inconnu : '{type_coup}'")

        return b

    @staticmethod
    def verifier_victoire(board):
        """Retourne un set des couleurs gagnantes (peut contenir 0, 1 ou 2)."""
        gagnants = set()
        for (p1, p2, p3, p4) in CARRES_POSSIBLES:
            coins = [board.get(*p) for p in (p1, p2, p3, p4)]
            if None not in coins and CASE_HORS_PLATEAU not in coins and len(set(coins)) == 1:
                gagnants.add(coins[0])
        return gagnants

    @staticmethod
    def trouver_carre_gagnant(board):
        """Retourne { couleur, cellules: [[r,c]×4] } du premier carré gagnant, ou None."""
        for (p1, p2, p3, p4) in CARRES_POSSIBLES:
            coins = [board.get(*p) for p in (p1, p2, p3, p4)]
            if None not in coins and CASE_HORS_PLATEAU not in coins and len(set(coins)) == 1:
                return {
                    "couleur":  coins[0],
                    "cellules": [list(p) for p in (p1, p2, p3, p4)],
                }
        return None