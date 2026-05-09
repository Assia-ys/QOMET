"""
Benchmark precis : temps par coup pour Moyen (depth=2) et Difficile (depth=4).
Mesure en phase de pose ET en phase de deplacement.
"""
import sys, os, time, statistics
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.game.game import Game
from backend.ai.minimax import coup_minimax, _appliquer

def mesurer(fn, game, n=5):
    """Appelle fn(game) n fois et retourne (min, max, moyenne, mediane) en ms."""
    temps = []
    for _ in range(n):
        t0 = time.perf_counter()
        fn(game)
        temps.append((time.perf_counter() - t0) * 1000)
    return min(temps), max(temps), statistics.mean(temps), statistics.median(temps)

def ligne(label, min_ms, max_ms, moy_ms, med_ms):
    print(f"  {label:35s}  min={min_ms:7.1f}ms  max={max_ms:7.1f}ms  moy={moy_ms:7.1f}ms  med={med_ms:7.1f}ms")

# ── Constructeurs de positions ──────────────────────────────────────────────

def partie_apres_n_coups(n_pose_clair, n_pose_fonce):
    """Partie avec n etoiles posees par chaque joueur, tour du joueur1."""
    from backend.game.board import CASES_JOUABLES
    cases = list(CASES_JOUABLES)
    g = Game()
    idx = 0
    total = n_pose_clair + n_pose_fonce
    for i in range(total):
        couleur = "clair" if i % 2 == 0 else "fonce"
        r, c = cases[idx]; idx += 1
        g.board.grille[r][c] = couleur
        if couleur == "clair":
            g.joueur1.etoiles_en_main -= 1
            g.joueur1.etoiles_sur_plateau += 1
        else:
            g.joueur2.etoiles_en_main -= 1
            g.joueur2.etoiles_sur_plateau += 1
    # Assure que c'est le tour de clair
    g.joueur_actif   = g.joueur1
    g.joueur_adverse = g.joueur2
    return g

def partie_mouvement_debut():
    """Toutes les etoiles posees, debut de phase deplacement."""
    g = partie_apres_n_coups(7, 7)
    g.joueur1.etoiles_en_main = 0
    g.joueur2.etoiles_en_main = 0
    return g

def partie_mouvement_milieu():
    """Phase de deplacement, quelques etoiles ejectees (5 vs 5)."""
    from backend.game.board import CASES_JOUABLES
    cases = list(CASES_JOUABLES)
    g = Game()
    positions_clair = cases[:5]
    positions_fonce = cases[10:15]
    for r, c in positions_clair:
        g.board.grille[r][c] = "clair"
    for r, c in positions_fonce:
        g.board.grille[r][c] = "fonce"
    g.joueur1.etoiles_en_main    = 0
    g.joueur1.etoiles_sur_plateau = 5
    g.joueur2.etoiles_en_main    = 0
    g.joueur2.etoiles_sur_plateau = 5
    g.joueur_actif   = g.joueur1
    g.joueur_adverse = g.joueur2
    return g

# ── Benchmarks ──────────────────────────────────────────────────────────────

N_REPS = 5  # repetitions par mesure (minimax est deterministe)

print("=" * 75)
print("BENCHMARK TEMPS PAR COUP")
print("=" * 75)

# --- Phase de POSE ---
print("\n[PHASE DE POSE]")
print("-" * 75)

for nb in [1, 3, 6]:
    g = partie_apres_n_coups(nb, nb - 1 if nb > 0 else 0)
    # s'assure que clair a encore des etoiles
    if g.joueur1.etoiles_en_main <= 0:
        continue
    m = mesurer(lambda game=g: coup_minimax(game, 2), g, N_REPS)
    ligne(f"Moyen  (pose, {nb} etoiles deja posees)", *m)
    m = mesurer(lambda game=g: coup_minimax(game, 4), g, N_REPS)
    ligne(f"Difficile (pose, {nb} etoiles deja posees)", *m)
    print()

# --- Phase de DEPLACEMENT : debut (7 vs 7) ---
print("[PHASE DE DEPLACEMENT - debut (7 vs 7)]")
print("-" * 75)
g_full = partie_mouvement_debut()
m = mesurer(lambda game=g_full: coup_minimax(game, 2), g_full, N_REPS)
ligne("Moyen     (7 vs 7)", *m)
m = mesurer(lambda game=g_full: coup_minimax(game, 4), g_full, N_REPS)
ligne("Difficile (7 vs 7)", *m)
print()

# --- Phase de DEPLACEMENT : milieu (5 vs 5) ---
print("[PHASE DE DEPLACEMENT - milieu (5 vs 5)]")
print("-" * 75)
g_mid = partie_mouvement_milieu()
m = mesurer(lambda game=g_mid: coup_minimax(game, 2), g_mid, N_REPS)
ligne("Moyen     (5 vs 5)", *m)
m = mesurer(lambda game=g_mid: coup_minimax(game, 4), g_mid, N_REPS)
ligne("Difficile (5 vs 5)", *m)
print()

# --- Ratio difficile / moyen ---
print("[RATIO DIFFICILE / MOYEN]")
print("-" * 75)
for label, g in [("pose (6 posees)", partie_apres_n_coups(3, 2)),
                  ("deplacement 7v7", partie_mouvement_debut()),
                  ("deplacement 5v5", partie_mouvement_milieu())]:
    t_moyen     = mesurer(lambda game=g: coup_minimax(game, 2), g, 3)[2]
    t_difficile = mesurer(lambda game=g: coup_minimax(game, 4), g, 3)[2]
    ratio = t_difficile / t_moyen if t_moyen > 0 else float('inf')
    print(f"  {label:25s}  Moyen={t_moyen:7.1f}ms  Difficile={t_difficile:7.1f}ms  ratio x{ratio:.1f}")

print()
print("=" * 75)
print("FIN DU BENCHMARK")
print("=" * 75)
