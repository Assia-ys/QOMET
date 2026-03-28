TAILLE = 7

# Les 25 cases jouables du plateau en losange
CASES_JOUABLES = {
    (0,0), (0,3), (0,6),
    (1,1), (1,3), (1,5),
    (2,2), (2,3), (2,4),
    (3,0), (3,1), (3,2), (3,3), (3,4), (3,5), (3,6),
    (4,2), (4,3), (4,4),
    (5,1), (5,3), (5,5),
    (6,0), (6,3), (6,6),
}

class Board:
    def __init__(self):
        # None = case vide, False = case non jouable, sinon "clair" ou "fonce"
        self.grille = [
            [None if (r, c) in CASES_JOUABLES else False
             for c in range(TAILLE)]
            for r in range(TAILLE)
        ]
        self.dernier_coup = None

    def est_jouable(self, row, col):
        """Case existe ET fait partie du plateau"""
        return (row, col) in CASES_JOUABLES

    def est_valide(self, row, col):
        """Case dans les limites du plateau de 7x7"""
        return 0 <= row < TAILLE and 0 <= col < TAILLE

    def est_libre(self, row, col):
        """Case jouable ET vide"""
        return self.est_jouable(row, col) and self.grille[row][col] is None

    def poser(self, row, col, couleur):
        if not self.est_jouable(row, col):
            return False, "Case non jouable"
        if not self.est_libre(row, col):
            return False, "Case occupée"
        self.grille[row][col] = couleur
        self.dernier_coup = ("poser", row, col, couleur)
        return True, "OK"

    def get(self, row, col):
        return self.grille[row][col]

    def set(self, row, col, valeur):
        self.grille[row][col] = valeur

    def afficher(self):
        symboles = {None: "O", False: ".", "clair": "C", "fonce": "F"}
        for r in range(TAILLE):
            ligne = ""
            for c in range(TAILLE):
                ligne += symboles.get(self.grille[r][c], "?") + " "
            print(ligne)
        print()

    def copier(self):
        b = Board()
        b.grille = [row[:] for row in self.grille]
        b.dernier_coup = self.dernier_coup
        return b