import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.game.board import Board
from backend.game.rules import Rules, CARRES_POSSIBLES, CASES_CARRE_EXTERIEUR
from backend.game.player import Player


# ── Constantes ────────────────────────────────────────────────────────────────

class TestConstantes:
    def test_15_carres_possibles(self):
        assert len(CARRES_POSSIBLES) == 15

    def test_carres_sans_doublons(self):
        vus = set()
        for carre in CARRES_POSSIBLES:
            key = tuple(sorted(carre))
            assert key not in vus, f"Carré dupliqué : {key}"
            vus.add(key)

    def test_8_cases_carre_exterieur(self):
        assert len(CASES_CARRE_EXTERIEUR) == 8

    def test_cases_exterieur_exactes(self):
        attendu = {(0,0),(0,3),(0,6),(3,0),(3,6),(6,0),(6,3),(6,6)}
        assert CASES_CARRE_EXTERIEUR == attendu


# ── Éjection volontaire ───────────────────────────────────────────────────────

class TestEjection:
    def _board_avec(self, r, c, couleur='clair'):
        b = Board()
        b.grille[r][c] = couleur
        return b

    def test_ejecter_depuis_carre_exterieur(self):
        for r, c in CASES_CARRE_EXTERIEUR:
            b = self._board_avec(r, c)
            coups = Rules.deplacements_valides(b, r, c, None)
            assert any(coup[0] == 'ejecter' for coup in coups), \
                f"Éjection attendue depuis ({r},{c})"

    def test_pas_ejecter_case_interieure(self):
        cases_interieures = [(1,3),(2,3),(3,1),(3,2),(3,3),(3,4),(3,5),(4,3),(5,3)]
        for r, c in cases_interieures:
            b = self._board_avec(r, c)
            coups = Rules.deplacements_valides(b, r, c, None)
            assert not any(coup[0] == 'ejecter' for coup in coups), \
                f"Éjection inattendue depuis ({r},{c})"


# ── Pousser éjecter ───────────────────────────────────────────────────────────

class TestPousserEjecter:
    def test_pousser_ejecter_depuis_bord_physique(self):
        b = Board()
        b.grille[1][1] = 'clair'
        b.grille[0][0] = 'fonce'
        coups = Rules.deplacements_valides(b, 1, 1, None)
        pe = [c for c in coups if c[0] == 'pousser_ejecter']
        assert len(pe) > 0

    def test_pas_pousser_ejecter_case_non_bord(self):
        b = Board()
        b.grille[1][3] = 'clair'
        b.grille[1][1] = 'fonce'
        coups = Rules.deplacements_valides(b, 1, 3, None)
        pe = [c for c in coups if c[0] == 'pousser_ejecter']
        assert len(pe) == 0, "pousser_ejecter ne devrait pas être possible vers (1,1)"


# ── Anti-annulation ───────────────────────────────────────────────────────────

class TestAntiAnnulation:
    def test_glisser_annulation_detectee(self):
        dernier = ('glisser', 0, 0, 1, 1, 0, 1)
        coup    = ('glisser', 1, 1, 0, 0, 0, -1)
        assert Rules._est_annulation(coup, dernier) is True

    def test_glisser_non_annulation(self):
        dernier = ('glisser', 0, 0, 1, 1, 0, 1)
        coup    = ('glisser', 1, 1, 2, 2, 0, 1)
        assert Rules._est_annulation(coup, dernier) is False

    def test_pousser_annulation_detectee(self):
        dernier = ('pousser', 1, 1, 2, 2, 3, 3, 1, 1)
        coup    = ('pousser', 3, 3, 2, 2, 1, 1, -1, -1)
        assert Rules._est_annulation(coup, dernier) is True

    def test_sans_dernier_coup(self):
        coup = ('glisser', 0, 0, 1, 1, 0, 1)
        assert Rules._est_annulation(coup, None) is False


# ── Déplacements valides ──────────────────────────────────────────────────────

class TestDeplacementsValides:
    def test_case_vide_retourne_vide(self):
        b = Board()
        coups = Rules.deplacements_valides(b, 3, 3, None)
        assert coups == []

    def test_case_non_jouable_retourne_vide(self):
        b = Board()
        coups = Rules.deplacements_valides(b, 0, 1, None)
        assert coups == []

    def test_glisser_vers_case_libre(self):
        b = Board()
        b.grille[3][3] = 'clair'
        coups = Rules.deplacements_valides(b, 3, 3, None)
        glissers = [c for c in coups if c[0] == 'glisser']
        assert len(glissers) > 0

    def test_pousser_si_case_suivante_libre(self):
        b = Board()
        b.grille[3][3] = 'clair'
        b.grille[3][4] = 'fonce'
        coups = Rules.deplacements_valides(b, 3, 3, None)
        poussers = [c for c in coups if c[0] == 'pousser']
        assert any(c[3] == 3 and c[4] == 4 for c in poussers)


# ── Vérification victoire ─────────────────────────────────────────────────────

class TestVerifierVictoire:
    def test_pas_de_gagnant_plateau_vide(self):
        b = Board()
        assert Rules.verifier_victoire(b) == set()

    def test_victoire_clair(self):
        b = Board()
        p1, p2, p3, p4 = CARRES_POSSIBLES[0]
        for r, c in (p1, p2, p3, p4):
            b.grille[r][c] = 'clair'
        assert 'clair' in Rules.verifier_victoire(b)

    def test_victoire_fonce(self):
        b = Board()
        p1, p2, p3, p4 = CARRES_POSSIBLES[0]
        for r, c in (p1, p2, p3, p4):
            b.grille[r][c] = 'fonce'
        assert 'fonce' in Rules.verifier_victoire(b)

    def test_carre_mixte_pas_victoire(self):
        b = Board()
        p1, p2, p3, p4 = CARRES_POSSIBLES[0]
        b.grille[p1[0]][p1[1]] = 'clair'
        b.grille[p2[0]][p2[1]] = 'clair'
        b.grille[p3[0]][p3[1]] = 'clair'
        b.grille[p4[0]][p4[1]] = 'fonce'
        assert Rules.verifier_victoire(b) == set()

    def test_victoire_simultanee(self):
        """Deux carrés non-chevauchants formés simultanément → les deux couleurs gagnantes"""
        b = Board()
        # Carrés 0 et 4 ne partagent aucune case
        p1, p2, p3, p4 = CARRES_POSSIBLES[0]
        q1, q2, q3, q4 = CARRES_POSSIBLES[4]
        for r, c in (p1, p2, p3, p4):
            b.grille[r][c] = 'clair'
        for r, c in (q1, q2, q3, q4):
            b.grille[r][c] = 'fonce'
        gagnants = Rules.verifier_victoire(b)
        assert 'clair' in gagnants
        assert 'fonce' in gagnants


# ── Appliquer coup ────────────────────────────────────────────────────────────

class TestAppliquerCoup:
    def _joueurs(self):
        from backend.game.player import Player
        j1 = Player('Alice', 'clair')
        j2 = Player('Bob',   'fonce')
        j1.etoiles_en_main -= 3; j1.etoiles_sur_plateau += 3
        j2.etoiles_en_main -= 2; j2.etoiles_sur_plateau += 2
        return j1, j2

    def test_glisser_deplace_etoile(self):
        b = Board(); j1, j2 = self._joueurs()
        b.grille[3][3] = 'clair'
        coup = ('glisser', 3, 3, 3, 4, 0, 1)
        b2 = Rules.appliquer_coup(b, coup, j1, j2)
        assert b2.get(3, 3) is None
        assert b2.get(3, 4) == 'clair'

    def test_glisser_ne_modifie_pas_original(self):
        b = Board(); j1, j2 = self._joueurs()
        b.grille[3][3] = 'clair'
        Rules.appliquer_coup(b, ('glisser', 3, 3, 3, 4, 0, 1), j1, j2)
        assert b.get(3, 3) == 'clair'  # original inchangé

    def test_pousser_deplace_deux_etoiles(self):
        b = Board(); j1, j2 = self._joueurs()
        b.grille[3][3] = 'clair'; b.grille[3][4] = 'fonce'
        coup = ('pousser', 3, 3, 3, 4, 3, 5, 0, 1)
        b2 = Rules.appliquer_coup(b, coup, j1, j2)
        assert b2.get(3, 3) is None
        assert b2.get(3, 4) == 'clair'
        assert b2.get(3, 5) == 'fonce'

    def test_pousser_ejecter_retourne_etoile_joueur(self):
        b = Board(); j1, j2 = self._joueurs()
        b.grille[3][0] = 'clair'; b.grille[3][1] = 'fonce'
        coup = ('pousser_ejecter', 3, 1, 3, 0, 0, -1)
        j1_avant = j1.etoiles_en_main
        Rules.appliquer_coup(b, coup, j2, j1)  # j2 pousse clair hors
        assert j1.etoiles_en_main == j1_avant + 1

    def test_ejecter_retire_etoile_et_retourne_en_main(self):
        b = Board(); j1, j2 = self._joueurs()
        b.grille[0][0] = 'clair'
        coup = ('ejecter', 0, 0, -1, 0)
        j1_avant = j1.etoiles_en_main
        b2 = Rules.appliquer_coup(b, coup, j1, j2)
        assert b2.get(0, 0) is None
        assert j1.etoiles_en_main == j1_avant + 1


# ── Trouver carré gagnant ─────────────────────────────────────────────────────

class TestTrouverCarreGagnant:
    def test_retourne_none_si_pas_de_carre(self):
        b = Board()
        assert Rules.trouver_carre_gagnant(b) is None

    def test_retourne_carre_et_couleur(self):
        b = Board()
        p1, p2, p3, p4 = CARRES_POSSIBLES[0]
        for r, c in (p1, p2, p3, p4):
            b.grille[r][c] = 'clair'
        result = Rules.trouver_carre_gagnant(b)
        assert result is not None
        assert result['couleur'] == 'clair'
        assert len(result['cellules']) == 4


# ── Mouvements diagonaux ──────────────────────────────────────────────────────

class TestMouvementsDiagonaux:
    def test_diagonale_principale_sur_r_egal_c(self):
        """Case (1,1) : r==c → diagonale (1,1)/(-1,-1) disponible."""
        b = Board(); b.grille[1][1] = 'clair'
        coups = Rules.deplacements_valides(b, 1, 1, None)
        dirs = {(c[5], c[6]) if c[0] == 'glisser' else None for c in coups}
        dirs.discard(None)
        assert (1, 1) in dirs or (-1, -1) in dirs

    def test_diagonale_secondaire_sur_r_plus_c_egal_6(self):
        """Case (1,5) : r+c==6 → diagonale (1,-1)/(-1,1) disponible."""
        b = Board(); b.grille[1][5] = 'clair'
        coups = Rules.deplacements_valides(b, 1, 5, None)
        dirs = {(c[5], c[6]) if c[0] == 'glisser' else None for c in coups}
        dirs.discard(None)
        assert (1, -1) in dirs or (-1, 1) in dirs

    def test_pas_diagonale_sur_case_normale(self):
        """Case (1,3) : r!=c et r+c!=6 → pas de diagonale."""
        b = Board(); b.grille[1][3] = 'clair'
        coups = Rules.deplacements_valides(b, 1, 3, None)
        dirs = {(c[5], c[6]) if c[0] == 'glisser' else None for c in coups}
        dirs.discard(None)
        assert (1, 1) not in dirs
        assert (1, -1) not in dirs


# ── Impossible pousser 2 étoiles ──────────────────────────────────────────────

class TestPousserDeuxEtoiles:
    def test_ne_peut_pas_pousser_si_cible2_occupee(self):
        """A→B→C : si C est occupé, le coup pousser A→B ne doit pas exister."""
        b = Board()
        b.grille[3][3] = 'clair'  # A
        b.grille[3][4] = 'fonce'  # B
        b.grille[3][5] = 'clair'  # C occupé
        coups = Rules.deplacements_valides(b, 3, 3, None)
        # Aucun coup pousser vers (3,4) car (3,5) est occupé
        poussers = [c for c in coups if c[0] == 'pousser' and c[3] == 3 and c[4] == 4]
        assert len(poussers) == 0
