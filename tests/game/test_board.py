import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.game.board import Board, CASES_JOUABLES, TAILLE, CASE_HORS_PLATEAU


class TestCasesJouables:
    def test_25_cases(self):
        assert len(CASES_JOUABLES) == 25

    def test_toutes_dans_grille(self):
        for r, c in CASES_JOUABLES:
            assert 0 <= r < TAILLE
            assert 0 <= c < TAILLE


class TestBoardInit:
    def test_cases_jouables_vides(self):
        b = Board()
        for r, c in CASES_JOUABLES:
            assert b.get(r, c) is None

    def test_cases_non_jouables_hors_plateau(self):
        b = Board()
        assert b.get(0, 1) == CASE_HORS_PLATEAU

    def test_dernier_coup_none(self):
        assert Board().dernier_coup is None


class TestBoardEtats:
    def test_est_jouable_vrai(self):
        b = Board()
        assert b.est_jouable(0, 0) is True

    def test_est_jouable_faux(self):
        b = Board()
        assert b.est_jouable(0, 1) is False

    def test_est_valide_dans_grille(self):
        b = Board()
        assert b.est_valide(0, 0) is True
        assert b.est_valide(6, 6) is True

    def test_est_valide_hors_grille(self):
        b = Board()
        assert b.est_valide(-1, 0) is False
        assert b.est_valide(0, 7)  is False

    def test_est_libre_vide(self):
        b = Board()
        assert b.est_libre(0, 0) is True

    def test_est_libre_occupe(self):
        b = Board()
        b.set(0, 0, 'clair')
        assert b.est_libre(0, 0) is False


class TestBoardGetSet:
    def test_set_get(self):
        b = Board()
        b.set(3, 3, 'fonce')
        assert b.get(3, 3) == 'fonce'

    def test_set_non_jouable_leve_erreur(self):
        b = Board()
        with pytest.raises(AssertionError):
            b.set(0, 1, 'clair')

    def test_get_hors_grille_leve_erreur(self):
        b = Board()
        with pytest.raises(IndexError):
            b.get(0, 7)


class TestBoardPoser:
    def test_poser_case_libre(self):
        b = Board()
        ok, msg = b.poser(0, 0, 'clair')
        assert ok is True
        assert b.get(0, 0) == 'clair'

    def test_poser_case_occupee(self):
        b = Board()
        b.poser(0, 0, 'clair')
        ok, msg = b.poser(0, 0, 'fonce')
        assert ok is False

    def test_poser_case_non_jouable(self):
        b = Board()
        ok, msg = b.poser(0, 1, 'clair')
        assert ok is False


class TestBoardCopier:
    def test_copie_independante(self):
        b = Board()
        b.set(3, 3, 'clair')
        copie = b.copier()
        copie.set(3, 3, 'fonce')
        assert b.get(3, 3) == 'clair'

    def test_copie_dernier_coup(self):
        b = Board()
        b.dernier_coup = ('glisser', 0, 0, 1, 1, 0, 1)
        copie = b.copier()
        assert copie.dernier_coup == b.dernier_coup
