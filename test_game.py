import sys
sys.path.insert(0, '/home/claude/QOMET')

from app.game.game import Game
from app.game.rules import Rules

print("=== TEST 1 : Poser des étoiles ===")
g = Game("Alice", "Bob")
g.jouer_poser(0, 0)  # Alice pose
g.jouer_poser(1, 1)  # Bob pose
g.jouer_poser(0, 2)  # Alice pose
g.jouer_poser(1, 3)  # Bob pose
g.board.afficher()
print("Joueurs:", g.etat()["j1"])
print("Joueurs:", g.etat()["j2"])
print()

print("=== TEST 2 : Détection victoire ===")
g2 = Game("Alice", "Bob")
# Alice forme un carré (0,0)(0,2)(2,0)(2,2)
g2.board.poser(0, 0, "clair")
g2.board.poser(0, 2, "clair")
g2.board.poser(2, 0, "clair")
g2.board.poser(2, 2, "clair")
g2.board.afficher()
gagnants = Rules.verifier_victoire(g2.board)
print("Gagnant détecté:", gagnants)
assert "clair" in gagnants, "ERREUR: victoire non détectée"
print("OK - Victoire détectée correctement")
print()

print("=== TEST 3 : Déplacements valides ===")
g3 = Game()
g3.board.poser(2, 2, "clair")
deplacements = Rules.deplacements_valides(g3.board, 2, 2, None)
print(f"Nombre de déplacements possibles depuis (2,2): {len(deplacements)}")
assert len(deplacements) > 0, "ERREUR: aucun déplacement trouvé"
print("Déplacements:", [d[0] for d in deplacements])
print()

print("=== TEST 4 : Règle anti-annulation ===")
g4 = Game()
g4.board.poser(2, 2, "clair")
coup_aller = ("glisser", 2, 2, 2, 3, 0, 1)
coup_retour = ("glisser", 2, 3, 2, 2, 0, -1)
annule = Rules._est_annulation(coup_retour, coup_aller)
assert annule == True, "ERREUR: anti-annulation non détectée"
print("OK - Anti-annulation fonctionne")
print()

print("=== TOUS LES TESTS PASSÉS ===")
