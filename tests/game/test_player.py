import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.game.player import Player


class TestPeutPoser:
    def test_peut_poser_debut(self):
        p = Player('Alice', 'clair')
        assert p.peut_poser() is True

    def test_ne_peut_plus_poser_apres_7(self):
        p = Player('Alice', 'clair')
        for _ in range(7):
            p.poser_etoile()
        assert p.peut_poser() is False


class TestPoserEtoile:
    def test_decrement_en_main(self):
        p = Player('Alice', 'clair')
        p.poser_etoile()
        assert p.etoiles_en_main == 6
        assert p.etoiles_sur_plateau == 1

    def test_poser_etoile_silencieux_si_vide(self):
        """poser_etoile ne lève pas d'erreur — la garde est dans Game.jouer_poser via peut_poser()"""
        p = Player('Alice', 'clair')
        for _ in range(7):
            p.poser_etoile()
        p.poser_etoile()  # silencieux
        assert p.etoiles_en_main == 0  # reste à 0


class TestRecupererEtoile:
    def test_recuperer_incremente_en_main(self):
        p = Player('Alice', 'clair')
        p.poser_etoile()
        p.recuperer_etoile()
        assert p.etoiles_en_main == 7
        assert p.etoiles_sur_plateau == 0

    def test_erreur_si_aucune_sur_plateau(self):
        p = Player('Alice', 'clair')
        with pytest.raises(AssertionError):
            p.recuperer_etoile()
