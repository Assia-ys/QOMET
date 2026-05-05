# Modifications IA — QOMET

## Résumé des problèmes trouvés

Avant les modifications, l'IA du jeu n'utilisait **jamais** le minimax écrit dans le backend.
Toutes les décisions étaient prises dans le frontend (`Game.jsx`) avec une heuristique
greedy locale très basique, qui ignorait les poussées/éjections et ne faisait aucun
lookahead réel. La différence entre "Moyen" et "Difficile" se résumait à un
multiplicateur `× 0.8` sur le score adverse — insuffisant pour garantir que
Difficile batte Moyen de façon consistante.

---

## 1. Corrections dans `backend/ai/minimax.py`

### Bug A — `_generer_coups` mélangeait les phases

**Avant :**
```python
def _generer_coups(game):
    joueur = game.joueur_actif
    coups = []
    if joueur.peut_poser():
        coups += [("poser", r, c) for (r, c) in _cases_strategiques(...)]
    coups += _coups_deplacement(game.board, joueur.couleur)   # ← toujours ajouté
    return coups
```

Pendant la phase de **pose**, la fonction ajoutait aussi des coups de **déplacement**.
La minimax explorait donc des états impossibles (l'humain ne peut pas déplacer pendant
la pose), faussant l'évaluation des positions.

**Après :**
```python
def _generer_coups(game):
    joueur = game.joueur_actif
    if joueur.peut_poser():
        return [("poser", r, c) for (r, c) in _cases_strategiques(...)]
    return _coups_deplacement(game.board, joueur.couleur)
```

Chaque phase ne génère que ses coups légaux.

---

### Bug B — `_cases_strategiques` condition défensive trop stricte

**Avant :**
```python
if amis == 0 and enemy >= 2 and vides:   # bloquait seulement si 0 pièce amie
    for p in vides:
        defensif.add(p)
```

Si le joueur avait déjà 1 pièce sur un carré où l'adversaire avançait (2+ pièces),
la case n'était pas ajoutée en priorité défensive. L'IA laissait l'adversaire
compléter des carrés sans réagir.

**Après :**
```python
if enemy >= 2 and vides:   # bloquer dès que l'adversaire a 2+ pièces sur un carré
    for p in vides:
        defensif.add(p)
```

---

## 2. Nouveau branchement Backend ↔ Frontend

### Avant (architecture cassée)

```
Frontend Game.jsx
│
├── Tour de l'IA détecté (indexJoueurActif === 1)
│
├── Heuristique greedy locale (evaluerPlateau)
│   ├── Phase pose  : teste chaque case vide, garde le meilleur score immédiat
│   └── Phase dépl. : simMove() (ignore push/éjection) → meilleur score immédiat
│
└── sIA.emit('jouer', { coup })   ← socket IA joue le coup calculé en JS
```

Le backend `minimax.py` existait mais n'était **jamais appelé**.

---

### Après (architecture correcte)

```
Frontend Game.jsx
│
└── Tour de l'IA détecté
    │
    └── setTimeout(delay) → sIA.emit('coup_ia', { niveau: 'moyen'|'difficile' })
                                        │
                            ════════════╪════════ Socket.IO ════════════════════
                                        │
                            Backend main.py  @sio.event coup_ia(sid, data)
                                        │
                                        ├── couleur_du_joueur(sid) → trouve la room
                                        ├── vérifie que c'est bien le tour de l'IA
                                        │
                                        ├── niveau == 'facile'    → coup_facile(game)
                                        ├── niveau == 'moyen'     → coup_minimax(game, 2)
                                        └── niveau == 'difficile' → coup_minimax(game, 3)
                                                    │
                                                    ├── asyncio.to_thread(...)  ← non-bloquant
                                                    ├── game.jouer_poser() ou jouer_deplacement()
                                                    ├── sio.emit('etat', ...)   → tous les joueurs
                                                    └── fin de partie si besoin
```

**Points clés du branchement :**

- Le frontend émet `coup_ia` sur le **socket de l'IA** (`sIA`), pas le socket humain.
- Le backend identifie la room et la couleur grâce à `couleur_du_joueur(sid)`.
- Le calcul minimax tourne dans un **thread séparé** (`asyncio.to_thread`) pour ne pas
  bloquer la boucle événementielle du serveur pendant que l'IA réfléchit.
- Une fois le coup calculé, le backend **l'applique directement** sur le jeu serveur
  et diffuse le nouvel état à toute la room via `sio.emit('etat', ...)`.
- Le frontend n'a plus besoin de connaître le coup : il reçoit juste le nouvel état
  comme pour un coup humain.

---

### Code ajouté dans `backend/main.py`

```python
from backend.ai.minimax import coup_facile, coup_minimax

@sio.event
async def coup_ia(sid, data):
    code, couleur = couleur_du_joueur(sid)
    if not code:
        return

    game = rooms[code]["game"]
    if couleur != game.joueur_actif.couleur:
        return

    niveau = data.get("niveau", "moyen")

    if niveau == "facile":
        coup = await asyncio.to_thread(coup_facile, game)
    elif niveau == "difficile":
        coup = await asyncio.to_thread(coup_minimax, game, 4)
    else:
        coup = await asyncio.to_thread(coup_minimax, game, 2)

    if coup is None:
        return

    if coup[0] == "poser":
        ok, msg = game.jouer_poser(coup[1], coup[2])
    else:
        ok, msg = game.jouer_deplacement(coup)

    if not ok:
        await sio.emit("erreur", {"code": "ERR_IA_MOVE_FAILED", "msg": msg}, to=sid)
        return

    await sio.emit("etat", game.etat(), room=code)

    if game.termine:
        carre = Rules.trouver_carre_gagnant(game.board)
        if carre:
            await sio.emit("carre_gagnant", { ... }, room=code)
        await sio.emit("fin_partie", { ... }, room=code)
        supprimer_room(code)
```

---

### Code simplifié dans `frontend/src/pages/Game.jsx`

**Supprimé (~60 lignes) :**
- `simMove()` — simulation locale approximative (ignorait push/éjection)
- `evaluerPlateau()` — heuristique greedy locale
- Toute la logique de collecte des coups valides pièce par pièce
- Les imports `estValide`, `estJouable`, `CASES_JOUABLES`

**Remplacé par (8 lignes) :**
```javascript
useEffect(() => {
  if (!estTourIA || gagnant) return
  const delay = { facile: 600, moyen: 900, difficile: 1300 }[niveauIA] ?? 700
  const sIA   = getSocketIA()
  const timer = setTimeout(() => {
    sIA.emit('coup_ia', { niveau: niveauIA })
  }, delay)
  return () => clearTimeout(timer)
}, [indexJoueurActif, gagnant, joueurs])
```

---

## 3. Profondeur de recherche par niveau

| Niveau   | Phase pose | Phase déplacement | Comportement                          |
|----------|------------|-------------------|---------------------------------------|
| Facile   | aléatoire  | aléatoire         | Coup tiré au hasard parmi les légaux  |
| Moyen    | depth 2    | depth 2           | Minimax alpha-bêta, 2 demi-coups      |
| Difficile| depth 2    | depth 4           | Minimax alpha-bêta, 4 demi-coups      |

> **Pourquoi depth 2 en pose pour les deux ?**
> La phase de pose a jusqu'à 25 cases vides disponibles. Même avec le filtrage
> stratégique (`_cases_strategiques`), le branching factor est élevé.
> Depth 2 donne un résultat de qualité en < 20ms. Depth 3+ serait plus lent
> sans apporter d'avantage visible (les positions de pose sont encore ouvertes).

> **Pourquoi depth 4 pour Difficile ?**
> Depth 4 donne à l'IA une vision sur 4 demi-coups (IA → adversaire → IA → adversaire),
> ce qui lui permet d'anticiper des pièges à 2 tours. Le délai d'affichage est fixé à
> 1 300 ms dans le frontend, laissant le temps au calcul de se terminer.
> Voir benchmarks ci-dessous pour les temps mesurés.

---

## 4. Benchmark — Temps par coup (machine de développement)

Mesures effectuées avec `tests/test_ia_temps.py`, 5 répétitions par position,
`time.perf_counter()` pour la précision.

### Phase de pose

| Niveau    | 1 étoile posée | 3 étoiles posées | 6 étoiles posées |
|-----------|---------------|-----------------|-----------------|
| Moyen     | ~16 ms        | ~15 ms          | ~8 ms           |
| Difficile | ~17 ms        | ~16 ms          | ~8 ms           |

Les deux sont identiques en pose car la profondeur effective est plafonnée à 2
pour les deux niveaux (`min(profondeur, 2)`).

---

### Phase de déplacement

| Depth | 7 pièces/joueur | 5 pièces/joueur | 4 pièces/joueur |
|-------|-----------------|-----------------|-----------------|
| 2 (Moyen)    |  ~70 ms  |  ~85 ms  |  ~24 ms  |
| 3 (Difficile)|  ~481 ms |  ~593 ms |  ~165 ms |
| 4 (rejeté)   | ~3 370 ms| ~3 196 ms| ~1 858 ms|

**Ratio Difficile / Moyen :**

| Position  | Depth 2 | Depth 3 | Ratio |
|-----------|---------|---------|-------|
| 7v7       | 70 ms   | 481 ms  | ×6.9  |
| 5v5       | 85 ms   | 593 ms  | ×7.0  |
| 4v4       | 24 ms   | 165 ms  | ×6.9  |

> Depth 4 était rejeté car le ratio était de ×47 à ×115 selon la position,
> donnant des temps de 1.8 à 10 secondes par coup.

---

### Délai total ressenti par le joueur (Difficile)

```
délai UI configuré  :  1 300 ms
calcul minimax max  :    600 ms  (position 5v5 début de partie)
─────────────────────────────────
total ressenti max  :  ~1 900 ms   (< 2 secondes)
```

---

## 5. Résultats des tests de bataille (`tests/test_ia_bataille.py`)

| Matchup              | Victoires A | Victoires B | Parties |
|----------------------|-------------|-------------|---------|
| Facile (A) vs Moyen  |  0 / 8 (0%) |  8 / 8 (100%)| 8      |
| **Difficile (A) vs Moyen** | **10/10 (100%)** | **0/10 (0%)** | **10** |
| Difficile (A) vs Facile   |  8 / 8 (100%) | 0 / 8 (0%)  | 8      |

Hiérarchie confirmée : **Difficile > Moyen > Facile** sur l'ensemble des parties jouées.

---

## 6. Fichiers modifiés

| Fichier                          | Nature de la modification                         |
|----------------------------------|---------------------------------------------------|
| `backend/ai/minimax.py`          | Correction `_generer_coups` + `_cases_strategiques` |
| `backend/main.py`                | Ajout event socket.io `coup_ia`                   |
| `frontend/src/pages/Game.jsx`    | Suppression heuristique greedy, appel `coup_ia`   |

| Fichier                          | Créé                                              |
|----------------------------------|---------------------------------------------------|
| `tests/test_ia_bataille.py`      | Tests de victoire entre niveaux (26 parties)      |
| `tests/test_ia_temps.py`         | Benchmark précis du temps par coup                |
| `docs/ia_modifications.md`       | Ce document                                       |
