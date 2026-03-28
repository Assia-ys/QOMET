from app.game.board import CASES_JOUABLES, TAILLE

DIRECTIONS = [
    (0, 1),   # droite
    (0, -1),  # gauche
    (1, 0),   # bas
    (-1, 0),  # haut
    (1, 1),   # diagonale bas-droite
    (-1, -1), # diagonale haut-gauche
    (1, -1),  # diagonale bas-gauche
    (-1, 1),  # diagonale haut-droite
]

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

        for dr, dc in DIRECTIONS:
            cible = Rules.prochaine_case_jouable(board, row, col, dr, dc)

            # --- Pas de case jouable dans cette direction → éjection ---
            if cible is None:
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
                    # pousse l'étoile hors du plateau
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
        """
        if dernier_coup is None:
            return False
        if coup[0] == "glisser" and dernier_coup[0] == "glisser":
            # coup[1:3] = départ actuel, coup[3:5] = arrivée actuelle
            # dernier_coup[1:3] = départ précédent, dernier_coup[3:5] = arrivée précédente
            if (coup[1], coup[2]) == (dernier_coup[3], dernier_coup[4]) and \
               (coup[3], coup[4]) == (dernier_coup[1], dernier_coup[2]):
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

        return b

    @staticmethod
    def verifier_victoire(board):
        """
        Cherche si un carré parfait est formé par 4 étoiles de même couleur.
        Un carré = 4 cases jouables aux coins d'un carré (lignes droites).
        Retourne un set des couleurs gagnantes (peut contenir 0, 1 ou 2).
        """
        gagnants = set()

        cases = list(CASES_JOUABLES)

        for i, (r1, c1) in enumerate(cases):
            for r2, c2 in cases[i+1:]:
                # On cherche des paires sur la même ligne horizontale
                if r1 != r2:
                    continue
                # Les 2 autres coins du carré
                hauteur = abs(c2 - c1)
                # carré vers le bas
                for sens in [1, -1]:
                    r3, r4 = r1 + hauteur * sens, r2 + hauteur * sens
                    c3, c4 = c1, c2
                    if (r3, c3) in CASES_JOUABLES and (r4, c4) in CASES_JOUABLES:
                        coins = [
                            board.get(r1, c1),
                            board.get(r1, c2),
                            board.get(r3, c3),
                            board.get(r4, c4),
                        ]
                        if (None not in coins and
                            False not in coins and
                            len(set(coins)) == 1):
                            gagnants.add(coins[0])

        return gagnants