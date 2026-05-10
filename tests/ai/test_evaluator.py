import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.game.board import Board, CASE_HORS_PLATEAU
from backend.game.rules import CARRES_POSSIBLES
from backend.ai.evaluator import evaluer


class TestEvaluerVide:
    def test_plateau_vide_score_zero(self):
        b = Board()
        assert evaluer(b, 'clair') == 0
        assert evaluer(b, 'fonce') == 0


class TestEvaluerAvecPieces:
    def test_1_piece_dans_carre_score_1(self):
        b = Board()
        r, c = CARRES_POSSIBLES[0][0]
        b.grille[r][c] = 'clair'
        score = evaluer(b, 'clair')
        assert score >= 1

    def test_2_pieces_score_4(self):
        b = Board()
        p1, p2, *_ = CARRES_POSSIBLES[0]
        b.grille[p1[0]][p1[1]] = 'clair'
        b.grille[p2[0]][p2[1]] = 'clair'
        score = evaluer(b, 'clair')
        assert score >= 4

    def test_3_pieces_score_superieur_a_2(self):
        """3 pièces → friendly²=9, toujours supérieur à 2 pièces → 4."""
        b2 = Board()
        b3 = Board()
        p1, p2, p3, _ = CARRES_POSSIBLES[0]
        b2.grille[p1[0]][p1[1]] = 'clair'
        b2.grille[p2[0]][p2[1]] = 'clair'
        b3.grille[p1[0]][p1[1]] = 'clair'
        b3.grille[p2[0]][p2[1]] = 'clair'
        b3.grille[p3[0]][p3[1]] = 'clair'
        assert evaluer(b3, 'clair') > evaluer(b2, 'clair')


class TestEvaluerAvecEnnemi:
    def test_carre_avec_ennemi_score_zero(self):
        """Si un ennemi est dans le carré, ce carré ne rapporte rien."""
        b = Board()
        p1, p2, p3, p4 = CARRES_POSSIBLES[0]
        b.grille[p1[0]][p1[1]] = 'clair'
        b.grille[p2[0]][p2[1]] = 'clair'
        b.grille[p3[0]][p3[1]] = 'fonce'   # ennemi bloque
        score_avant = evaluer(b, 'clair')
        b2 = Board()
        b2.grille[p1[0]][p1[1]] = 'clair'
        b2.grille[p2[0]][p2[1]] = 'clair'
        score_sans_ennemi = evaluer(b2, 'clair')
        assert score_avant < score_sans_ennemi
