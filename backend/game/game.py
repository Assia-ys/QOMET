from backend.game.board import Board, CASES_JOUABLES
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

    def copier(self):
        """Crée une copie indépendante du jeu pour le Minimax."""
        g = Game.__new__(Game)
        g.board = self.board.copier()
        g.joueur1 = Player(self.joueur1.nom, self.joueur1.couleur)
        g.joueur1.etoiles_en_main    = self.joueur1.etoiles_en_main
        g.joueur1.etoiles_sur_plateau = self.joueur1.etoiles_sur_plateau
        g.joueur2 = Player(self.joueur2.nom, self.joueur2.couleur)
        g.joueur2.etoiles_en_main    = self.joueur2.etoiles_en_main
        g.joueur2.etoiles_sur_plateau = self.joueur2.etoiles_sur_plateau
        g.joueur_actif   = g.joueur1 if self.joueur_actif  is self.joueur1 else g.joueur2
        g.joueur_adverse = g.joueur2 if self.joueur_actif  is self.joueur1 else g.joueur1
        g.termine = self.termine
        g.gagnant = (g.joueur1 if self.gagnant is self.joueur1 else g.joueur2) if self.gagnant else None
        return g

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
        """Le joueur déplace une étoile"""
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

        # Carré involontaire ou simultané => adversaire gagne
        if couleur_adverse in gagnants:
            self.gagnant = self.joueur_adverse
        elif couleur_actif in gagnants:
            self.gagnant = self.joueur_actif

        self.termine = True

    def etat(self):
        plateau = {
            f"{r},{c}": self.board.get(r, c)
            for (r, c) in CASES_JOUABLES
        }
        return {
            "plateau":        plateau,
            "joueur_actif":   self.joueur_actif.nom,
            "couleur_active": self.joueur_actif.couleur,
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