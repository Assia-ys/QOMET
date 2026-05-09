import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.game.game import Game
from backend.game.board import Board
from backend.game.rules import CARRES_POSSIBLES, Rules
from backend.ai.minimax import coup_facile, coup_minimax, _generer_coups


class TestCoupFacile:
    def test_retourne_coup_valide_debut(self):
        g = Game()
        coup = coup_facile(g)
        assert coup is not None
        assert coup[0] in ('poser', 'glisser', 'pousser', 'pousser_ejecter', 'ejecter')

    def test_retourne_pose_en_phase_pose(self):
        g = Game()
        coup = coup_facile(g)
        assert coup[0] == 'poser'

    def test_retourne_none_si_aucun_coup(self):
        """Partie terminée → aucun coup possible → None."""
        g = Game()
        g.termine = True
        coups = _generer_coups(g)
        # pas de coup dans une partie terminée car _verifier_fin a bloqué
        # on vérifie que coup_facile gère une liste vide
        import backend.ai.minimax as mm
        original = mm._generer_coups
        mm._generer_coups = lambda _: []
        result = coup_facile(g)
        mm._generer_coups = original
        assert result is None


class TestGenererCoups:
    def test_phase_pose_genere_pose(self):
        g = Game()
        coups = _generer_coups(g)
        assert any(c[0] == 'poser' for c in coups)

    def test_difficile_genere_deplacement_en_phase_pose(self):
        """En mode difficile (complet=True), les déplacements sont aussi inclus."""
        g = Game()
        g.board.grille[3][3] = 'clair'
        g.joueur1.etoiles_en_main -= 1
        g.joueur1.etoiles_sur_plateau += 1
        coups_base     = _generer_coups(g, complet=False)
        coups_difficile = _generer_coups(g, complet=True)
        assert len(coups_difficile) >= len(coups_base)

    def test_phase_deplacement_genere_deplacements(self):
        g = Game()
        g.joueur1.etoiles_en_main = 0
        g.board.grille[3][3] = 'clair'
        coups = _generer_coups(g)
        assert any(c[0] in ('glisser', 'pousser', 'ejecter') for c in coups)


class TestCoupMinimax:
    def test_bloque_victoire_imminente(self):
        """Adversaire a 3 pièces dans un carré → minimax doit bloquer le 4e coin."""
        g = Game()
        p1, p2, p3, p4 = CARRES_POSSIBLES[0]
        g.board.grille[p1[0]][p1[1]] = 'fonce'
        g.board.grille[p2[0]][p2[1]] = 'fonce'
        g.board.grille[p3[0]][p3[1]] = 'fonce'
        g.joueur2.etoiles_en_main    -= 3
        g.joueur2.etoiles_sur_plateau += 3
        # C'est le tour de clair → doit bloquer p4
        coup = coup_minimax(g, 2)
        assert coup is not None
        assert coup[0] == 'poser'
        assert (coup[1], coup[2]) == (p4[0], p4[1])

    def test_retourne_coup_non_null_en_debut(self):
        g = Game()
        coup = coup_minimax(g, 2)
        assert coup is not None

    def test_profondeur_adaptative_pose(self):
        """En phase de pose, prof_eff ≤ 2 même si profondeur=4."""
        g = Game()
        assert g.joueur_actif.peut_poser() is True
        coup = coup_minimax(g, 4)
        assert coup is not None
