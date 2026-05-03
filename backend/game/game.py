from backend.game.board import Board
from backend.game.player import Player
from backend.game.rules import Rules

class Game:
    def __init__(self, nom_j1="Joueur 1", nom_j2="Joueur 2"):
        self.board = Board()
        self.joueur1 = Player(nom_j1, "clair")
        self.joueur2 = Player(nom_j2, "fonce")
        self.joueur_actif = self.joueur1
        self.joueur_adverse = self.joueur2
        self.termine = False
        self.gagnant = None

    def changer_tour(self):
        self.joueur_actif, self.joueur_adverse = (
            self.joueur_adverse, self.joueur_actif
        )

    def jouer_poser(self, row, col):
        """Le joueur pose une étoile"""
        if not self.joueur_actif.peut_poser():
            return False, "Plus d'étoiles en main"

        ok, msg = self.board.poser(row, col, self.joueur_actif.couleur)
        if not ok:
            return False, msg

        self.joueur_actif.poser_etoile()
        self._verifier_fin()
        if not self.termine:
            self.changer_tour()
        return True, "OK"

    def jouer_deplacement(self, coup):
        """Le joueur déplace une étoile (coup validé par Rules)"""
        coups_legaux = Rules.deplacements_valides(
            self.board, coup[1], coup[2], self.board.dernier_coup
        )
        if coup not in coups_legaux:
            return False, "Coup illégal"

        self.board = Rules.appliquer_coup(
            self.board, coup, self.joueur_actif, self.joueur_adverse
        )
        self._verifier_fin()
        if not self.termine:
            self.changer_tour()
        return True, "OK"

    def _verifier_fin(self):
        gagnants = Rules.verifier_victoire(self.board)
        if not gagnants:
            return

        couleur_actif = self.joueur_actif.couleur
        couleur_adverse = self.joueur_adverse.couleur

        # Carré involontaire ou simultané → adversaire gagne
        if couleur_adverse in gagnants:
            self.gagnant = self.joueur_adverse
        elif couleur_actif in gagnants:
            self.gagnant = self.joueur_actif

        self.termine = True

    def etat(self):
        from backend.game.board import CASES_JOUABLES
        plateau = {
            f"{r},{c}": self.board.get(r, c)
            for (r, c) in CASES_JOUABLES
        }
        return {
            "plateau":      plateau,
            "joueur_actif": self.joueur_actif.nom,
            "j1":           str(self.joueur1),
            "j2":           str(self.joueur2),
            "joueurs": [
                {
                    "nom":         self.joueur1.nom,
                    "couleur":     self.joueur1.couleur,
                    "en_main":     self.joueur1.etoiles_en_main,
                    "sur_plateau": self.joueur1.etoiles_sur_plateau,
                },
                {
                    "nom":         self.joueur2.nom,
                    "couleur":     self.joueur2.couleur,
                    "en_main":     self.joueur2.etoiles_en_main,
                    "sur_plateau": self.joueur2.etoiles_sur_plateau,
                },
            ],
            "termine": self.termine,
            "gagnant": self.gagnant.nom if self.gagnant else None,
        }
