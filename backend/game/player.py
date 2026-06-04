class Player:
    def __init__(self, nom, couleur):
        self.nom = nom
        self.couleur = couleur  # "clair" ou "fonce"
        self.etoiles_en_main = 7  # étoiles pas encore posées
        self.etoiles_sur_plateau = 0

    def peut_poser(self):
        return self.etoiles_en_main > 0

    def poser_etoile(self):
        if self.etoiles_en_main <= 0:
            return False
        self.etoiles_en_main -= 1
        self.etoiles_sur_plateau += 1
        return True

    def recuperer_etoile(self):
        assert self.etoiles_sur_plateau > 0, f"{self.nom} n'a aucune étoile sur le plateau à récupérer"
        self.etoiles_en_main += 1
        self.etoiles_sur_plateau -= 1

    def __str__(self):
        return (f"{self.nom} ({self.couleur}) — "
                f"en main: {self.etoiles_en_main} | "
                f"sur plateau: {self.etoiles_sur_plateau}")