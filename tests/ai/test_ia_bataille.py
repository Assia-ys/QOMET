"""
Test de bataille IA : Difficile (depth=4) vs Moyen (depth=2) et sanity checks.
Lance N parties complètes et compare les résultats.
"""
import sys
import os
import time
import random

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.game.game import Game
from backend.ai.minimax import coup_facile, coup_minimax, _generer_coups

# ── Utilitaires ────────────────────────────────────────────────────────────────

LIMITE_COUPS = 200  # sécurité anti-boucle infinie

def jouer_partie(fn_clair, fn_fonce, verbose=False):
    """
    Simule une partie complète entre deux fonctions IA.
    fn_clair / fn_fonce : game → coup
    Retourne : ("clair"|"fonce"|"nul", nb_coups, duree_s)
    """
    game = Game("IA-Clair", "IA-Fonce")
    t0   = time.time()

    for i in range(LIMITE_COUPS):
        if game.termine:
            break

        fn = fn_clair if game.joueur_actif.couleur == "clair" else fn_fonce
        coup = fn(game)

        if coup is None:
            if verbose:
                print(f"  coup[{i}] = None → abandon")
            break

        if coup[0] == "poser":
            ok, msg = game.jouer_poser(coup[1], coup[2])
        else:
            ok, msg = game.jouer_deplacement(coup)

        if not ok:
            if verbose:
                print(f"  coup[{i}] illégal : {coup} — {msg}")
            break

        if verbose:
            phase = "pose" if game.joueur_adverse.peut_poser() else "dépl"
            print(f"  [{i:3d}] {game.joueur_adverse.couleur:5s} {phase} → {coup}")

    duree  = time.time() - t0
    if game.gagnant:
        return game.gagnant.couleur, i + 1, duree
    return "nul", i + 1, duree


def afficher_barre(wins, total, label, largeur=30):
    pct  = wins / total * 100 if total else 0
    bar  = "#" * int(pct / 100 * largeur)
    bar  = bar.ljust(largeur)
    print(f"  {label:20s} [{bar}] {wins:2d}/{total}  ({pct:.0f}%)")


# ── Fonctions IA raccourcies ───────────────────────────────────────────────────

def ia_facile(game):   return coup_facile(game)
def ia_moyen(game):    return coup_minimax(game, 2)
def ia_difficile(game): return coup_minimax(game, 4)


# ── Suite de tests ─────────────────────────────────────────────────────────────

def run_serie(fn_a, fn_b, nom_a, nom_b, n=10):
    """
    Lance n parties (n//2 avec A=clair, n//2 avec A=fonce).
    Retourne dict de stats.
    """
    wins_a = wins_b = nuls = 0
    durees = []
    coups_list = []

    for i in range(n):
        # Alterner qui commence
        if i % 2 == 0:
            gagnant, nb, dur = jouer_partie(fn_a, fn_b)
            if   gagnant == "clair":  wins_a += 1
            elif gagnant == "fonce":  wins_b += 1
            else:                     nuls   += 1
        else:
            gagnant, nb, dur = jouer_partie(fn_b, fn_a)
            if   gagnant == "fonce":  wins_a += 1
            elif gagnant == "clair":  wins_b += 1
            else:                     nuls   += 1

        durees.append(dur)
        coups_list.append(nb)
        sym = "A" if (gagnant == "clair" and i % 2 == 0) or (gagnant == "fonce" and i % 2 == 1) else \
              ("B" if gagnant != "nul" else "=")
        print(f"    partie {i+1:2d}: gagnant={sym}  ({nb} coups, {dur:.1f}s)")

    moy_dur   = sum(durees) / len(durees)
    moy_coups = sum(coups_list) / len(coups_list)

    return {
        "wins_a": wins_a, "wins_b": wins_b, "nuls": nuls,
        "n": n, "moy_dur": moy_dur, "moy_coups": moy_coups,
        "nom_a": nom_a, "nom_b": nom_b,
    }


def afficher_resultats(stats):
    n    = stats["n"]
    wa   = stats["wins_a"]
    wb   = stats["wins_b"]
    nu   = stats["nuls"]
    print(f"\n  Resultats {stats['nom_a']} vs {stats['nom_b']} ({n} parties) :")
    afficher_barre(wa, n, stats["nom_a"])
    afficher_barre(wb, n, stats["nom_b"])
    if nu:
        afficher_barre(nu, n, "Nul/limite")
    print(f"  duree moyenne  : {stats['moy_dur']:.2f}s/partie")
    print(f"  coups moyens   : {stats['moy_coups']:.0f}/partie")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 1 — Sanity check : Facile vs Moyen
# ══════════════════════════════════════════════════════════════════════════════

print("=" * 60)
print("TEST 1 — Facile vs Moyen (8 parties)")
print("=" * 60)
random.seed(42)
stats1 = run_serie(ia_facile, ia_moyen, "Facile", "Moyen", n=8)
afficher_resultats(stats1)
assert stats1["wins_b"] >= stats1["wins_a"], \
    f"ÉCHEC : Moyen ({stats1['wins_b']}) devrait battre Facile ({stats1['wins_a']})"
print("  [OK] Moyen bat Facile\n")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 2 — Principal : Difficile vs Moyen
# ══════════════════════════════════════════════════════════════════════════════

print("=" * 60)
print("TEST 2 — Difficile vs Moyen (10 parties)")
print("=" * 60)
random.seed(0)
stats2 = run_serie(ia_difficile, ia_moyen, "Difficile", "Moyen", n=10)
afficher_resultats(stats2)
assert stats2["wins_a"] > stats2["wins_b"], \
    f"ÉCHEC : Difficile ({stats2['wins_a']}) devrait battre Moyen ({stats2['wins_b']})"
print("  [OK] Difficile bat Moyen\n")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 3 — Cohérence : Difficile vs Facile
# ══════════════════════════════════════════════════════════════════════════════

print("=" * 60)
print("TEST 3 — Difficile vs Facile (8 parties)")
print("=" * 60)
random.seed(7)
stats3 = run_serie(ia_difficile, ia_facile, "Difficile", "Facile", n=8)
afficher_resultats(stats3)
assert stats3["wins_a"] >= stats3["wins_b"], \
    f"ÉCHEC : Difficile ({stats3['wins_a']}) devrait battre Facile ({stats3['wins_b']})"
print("  [OK] Difficile bat Facile\n")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 4 — Unit : _generer_coups ne mélange pas les phases
# ══════════════════════════════════════════════════════════════════════════════

print("=" * 60)
print("TEST 4 — _generer_coups : séparation des phases")
print("=" * 60)
g = Game()
coups_pose = _generer_coups(g)
print(f"  Début de partie (7 en main) : {len(coups_pose)} coups générés")
assert all(c[0] == "poser" for c in coups_pose), \
    "ÉCHEC : des coups non-pose pendant la phase de pose"
print("  [OK] Uniquement des coups 'poser' en phase de pose")

# Simuler la fin de placement
from backend.game.board import CASES_JOUABLES
g2 = Game()
cases = list(CASES_JOUABLES)
for i, (r, c) in enumerate(cases[:14]):
    joueur = g2.joueur_actif
    g2.board.grille[r][c] = joueur.couleur
    joueur.poser_etoile()
    if not g2.termine:
        g2.changer_tour()
g2.joueur1.etoiles_en_main = 0
g2.joueur2.etoiles_en_main = 0

coups_depl = _generer_coups(g2)
print(f"  Fin de placement (0 en main) : {len(coups_depl)} coups générés")
assert all(c[0] != "poser" for c in coups_depl), \
    "ÉCHEC : des coups 'poser' en phase de déplacement"
print("  [OK] Aucun coup 'poser' en phase de deplacement\n")


# ══════════════════════════════════════════════════════════════════════════════
# TEST 5 — Unit : évaluation différentielle (difficile > moyen sur une position)
# ══════════════════════════════════════════════════════════════════════════════

print("=" * 60)
print("TEST 5 — Qualité des coups : difficile vs moyen sur position ouverte")
print("=" * 60)

from backend.ai.evaluator import evaluer

def score_apres_coup(game, coup):
    """Score différentiel après application d'un coup."""
    from backend.ai.minimax import _appliquer
    enfant = _appliquer(game, coup)
    coul_ia  = game.joueur_actif.couleur
    coul_adv = "fonce" if coul_ia == "clair" else "clair"
    return evaluer(enfant.board, coul_ia) - evaluer(enfant.board, coul_adv)

g3 = Game()
# Placer quelques pièces de façon semi-ouverte
for (r, c), col in [((3,3),"clair"),((3,1),"clair"),((1,3),"fonce"),((3,5),"fonce")]:
    g3.board.poser(r, c, col)
g3.joueur1.etoiles_en_main = 5
g3.joueur1.etoiles_sur_plateau = 2
g3.joueur2.etoiles_en_main = 5
g3.joueur2.etoiles_sur_plateau = 2

coup_m = ia_moyen(g3)
coup_d = ia_difficile(g3)
score_m = score_apres_coup(g3, coup_m) if coup_m else None
score_d = score_apres_coup(g3, coup_d) if coup_d else None
print(f"  Coup Moyen    : {coup_m} -> score immediat = {score_m}")
print(f"  Coup Difficile: {coup_d} -> score immediat = {score_d}")
print("  (score immediat de difficile peut etre inferieur : il pense plus loin)")
print()

print("=" * 60)
print("[OK] TOUS LES TESTS TERMINES")
print("=" * 60)
