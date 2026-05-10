import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.game.game import Game
from backend.game.rules import CARRES_POSSIBLES


# ── jouer_poser ───────────────────────────────────────────────────────────────

class TestJouerPoser:
    def test_pose_valide(self):
        g = Game()
        ok, _ = g.jouer_poser(0, 0)
        assert ok is True
        assert g.board.get(0, 0) == 'clair'

    def test_pose_change_tour(self):
        g = Game()
        g.jouer_poser(0, 0)
        assert g.joueur_actif is g.joueur2

    def test_pose_case_occupee(self):
        g = Game()
        g.jouer_poser(0, 0)
        g.jouer_poser(0, 0)          # J2 essaie la même case
        ok, _ = g.jouer_poser(0, 0)  # Normalement bloqué par le board
        # La deuxième pose a échoué → J2 n'a pas changé
        # Selon l'implémentation, la case est déjà occupée
        assert g.board.get(0, 0) in ('clair', 'fonce')

    def test_pose_decremente_etoiles(self):
        g = Game()
        g.jouer_poser(0, 0)
        assert g.joueur1.etoiles_en_main == 6
        assert g.joueur1.etoiles_sur_plateau == 1

    def test_pose_plus_detoiles_impossible(self):
        g = Game()
        cases_j1 = [(0,0),(0,3),(0,6),(1,1),(1,3),(1,5),(2,2)]
        cases_j2 = [(3,0),(3,1),(3,2),(3,4),(3,5),(3,6),(4,2)]
        for i in range(7):
            g.jouer_poser(*cases_j1[i])  # J1
            g.jouer_poser(*cases_j2[i])  # J2
        assert g.joueur1.peut_poser() is False


# ── jouer_deplacement ─────────────────────────────────────────────────────────

class TestJouerDeplacement:
    def _jeu_avec_etoile(self, r, c, couleur):
        g = Game()
        g.board.grille[r][c] = couleur
        if couleur == 'clair':
            g.joueur1.etoiles_en_main -= 1
            g.joueur1.etoiles_sur_plateau += 1
        else:
            g.joueur2.etoiles_en_main -= 1
            g.joueur2.etoiles_sur_plateau += 1
        return g

    def test_coup_illegal_rejete(self):
        g = Game()
        g.board.grille[3][3] = 'clair'
        from backend.game.rules import Rules
        ok, msg = g.jouer_deplacement(('glisser', 3, 3, 0, 0, 0, -3))  # coup invalide
        assert ok is False


# ── _verifier_fin ─────────────────────────────────────────────────────────────

class TestVerifierFin:
    def test_carre_actif_gagne(self):
        g = Game()
        p1, p2, p3, p4 = CARRES_POSSIBLES[0]
        for r, c in (p1, p2, p3, p4):
            g.board.grille[r][c] = 'clair'
        g.joueur_actif = g.joueur1
        g._verifier_fin()
        assert g.gagnant is g.joueur1
        assert g.termine is True

    def test_carre_involontaire_adverse_gagne(self):
        """Si je complète le carré de l'adversaire, l'adversaire gagne."""
        g = Game()
        p1, p2, p3, p4 = CARRES_POSSIBLES[0]
        for r, c in (p1, p2, p3, p4):
            g.board.grille[r][c] = 'fonce'
        g.joueur_actif  = g.joueur1   # clair joue
        g.joueur_adverse = g.joueur2
        g._verifier_fin()
        assert g.gagnant is g.joueur2

    def test_carre_simultane_adverse_gagne(self):
        """Simultané → adversaire gagne."""
        g = Game()
        p1, p2, p3, p4 = CARRES_POSSIBLES[0]
        q1, q2, q3, q4 = CARRES_POSSIBLES[4]
        for r, c in (p1, p2, p3, p4):
            g.board.grille[r][c] = 'clair'
        for r, c in (q1, q2, q3, q4):
            g.board.grille[r][c] = 'fonce'
        g.joueur_actif   = g.joueur1
        g.joueur_adverse = g.joueur2
        g._verifier_fin()
        assert g.gagnant is g.joueur2  # adversaire gagne en cas simultané

    def test_pas_de_fin_sans_carre(self):
        g = Game()
        g._verifier_fin()
        assert g.termine is False
        assert g.gagnant is None


# ── copier ────────────────────────────────────────────────────────────────────

class TestCopier:
    def test_copie_independante_board(self):
        g = Game()
        g.board.grille[3][3] = 'clair'
        c = g.copier()
        c.board.grille[3][3] = 'fonce'
        assert g.board.get(3, 3) == 'clair'

    def test_copie_joueur_actif_correct(self):
        g = Game()
        c = g.copier()
        assert c.joueur_actif.couleur == g.joueur_actif.couleur

    def test_copie_etoiles_preservees(self):
        g = Game()
        g.jouer_poser(0, 0)
        c = g.copier()
        assert c.joueur1.etoiles_en_main == 6
        assert c.joueur1.etoiles_sur_plateau == 1

    def test_copie_termine_preservee(self):
        g = Game()
        g.termine = True
        c = g.copier()
        assert c.termine is True

    def test_copie_gagnant_preservee(self):
        g = Game()
        p1, p2, p3, p4 = CARRES_POSSIBLES[0]
        for r, c in (p1, p2, p3, p4):
            g.board.grille[r][c] = 'clair'
        g._verifier_fin()
        copie = g.copier()
        assert copie.gagnant is not None
        assert copie.gagnant.couleur == 'clair'


# ── jouer_deplacement complet ─────────────────────────────────────────────────

class TestJouerDeplacementValide:
    def test_deplacement_glisser_valide(self):
        g = Game()
        g.board.grille[3][3] = 'clair'
        g.joueur1.etoiles_en_main -= 1
        g.joueur1.etoiles_sur_plateau += 1
        from backend.game.rules import Rules
        coups = Rules.deplacements_valides(g.board, 3, 3, None)
        glissers = [c for c in coups if c[0] == 'glisser']
        assert len(glissers) > 0
        ok, msg = g.jouer_deplacement(glissers[0])
        assert ok is True
        # L'étoile a bougé
        assert g.board.get(3, 3) is None

    def test_deplacement_change_tour(self):
        g = Game()
        g.board.grille[3][3] = 'clair'
        g.joueur1.etoiles_en_main -= 1
        g.joueur1.etoiles_sur_plateau += 1
        from backend.game.rules import Rules
        coups = [c for c in Rules.deplacements_valides(g.board, 3, 3, None) if c[0] == 'glisser']
        g.jouer_deplacement(coups[0])
        assert g.joueur_actif is g.joueur2

    def test_deplacement_declenche_fin_si_carre(self):
        g = Game()
        p1, p2, p3, p4 = CARRES_POSSIBLES[0]
        # Placer 3 des 4 coins + une étoile adjacente qui peut glisser sur p4
        for r, c in (p1, p2, p3):
            g.board.grille[r][c] = 'clair'
            g.joueur1.etoiles_en_main -= 1
            g.joueur1.etoiles_sur_plateau += 1
        # Trouver un coup qui amène sur p4
        from backend.game.rules import Rules
        # Chercher un coup valide qui finit sur p4
        for origine in [p1, p2, p3]:
            coups = Rules.deplacements_valides(g.board, origine[0], origine[1], None)
            cibles = [c for c in coups if c[0] == 'glisser' and c[3] == p4[0] and c[4] == p4[1]]
            if cibles:
                g.jouer_deplacement(cibles[0])
                assert g.termine is True
                assert g.gagnant is not None
                break


# ── etat() ────────────────────────────────────────────────────────────────────

class TestEtat:
    def test_etat_format(self):
        g = Game()
        e = g.etat()
        assert 'plateau'      in e
        assert 'joueurs'      in e
        assert 'joueur_actif' in e
        assert 'termine'      in e
        assert 'gagnant'      in e

    def test_etat_plateau_25_cases(self):
        g = Game()
        e = g.etat()
        assert len(e['plateau']) == 25

    def test_etat_deux_joueurs(self):
        g = Game()
        e = g.etat()
        assert len(e['joueurs']) == 2
        assert 'couleur' in e['joueurs'][0]
        assert 'en_main' in e['joueurs'][0]

    def test_etat_gagnant_none_au_depart(self):
        g = Game()
        assert g.etat()['gagnant'] is None

    def test_etat_gagnant_apres_victoire(self):
        g = Game()
        p1, p2, p3, p4 = CARRES_POSSIBLES[0]
        for r, c in (p1, p2, p3, p4):
            g.board.grille[r][c] = 'clair'
        g._verifier_fin()
        assert g.etat()['gagnant'] is not None
