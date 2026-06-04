# Audit de code — QOMET
## Partie 02 — Backend Python

---

## Vue d'ensemble

Le backend est composé de **cinq modules** indépendants qui communiquent uniquement par appels de fonctions Python. Aucune dépendance circulaire n'existe entre eux.

```
backend/
│
├── main.py          Serveur principal — Socket.io + FastAPI + signaling + UDP
├── api/routes.py    Routes HTTP REST (/parties)
├── network/
│   └── manager.py   Gestion des rooms (CRUD + état)
├── game/
│   ├── board.py     Plateau de jeu (grille 7×7, 25 cases jouables)
│   ├── rules.py     Règles du jeu (coups légaux, victoire, annulation)
│   ├── game.py      Orchestrateur de partie (tours, fin, copie Minimax)
│   └── player.py    Modèle joueur (nom, couleur, réserve d'étoiles)
└── ai/
    ├── minimax.py   Algorithme Minimax + alpha-bêta
    └── evaluator.py Fonction heuristique d'évaluation du plateau
```

**Dépendances entre modules :**

```
main.py
  └── manager.py  ──► game.py
  └── routes.py   ──►     └── board.py ◄── rules.py ◄── evaluator.py
                              player.py
                          minimax.py ──► rules.py
                                     ──► evaluator.py
                                     ──► game.py
```

---

## 1. `backend/main.py` — Serveur principal

### Rôle

C'est le point d'entrée du serveur. Il regroupe trois responsabilités :
1. Les **événements Socket.io** (logique temps réel du jeu)
2. Le **signaling Railway** (routes `/local/register` et `/local/find`)
3. Le **thread UDP** (réponse aux broadcasts de découverte)

### Points forts

- Séparation claire entre les événements WS et les routes REST (inclus via `app.include_router`)
- `asyncio.to_thread` utilisé correctement pour l'IA — ne bloque jamais la boucle événements
- `skip_sid=sid` sur `adversaire_en_pause` et `adversaire_deconnecte` — le joueur concerné ne reçoit pas son propre événement
- Purge opportuniste du `_local_registry` à chaque écriture

### Bugs identifiés

| Sévérité | Localisation | Description |
|----------|-------------|-------------|
| 🔴 Élevée | `disconnect()` — branche `else` | Si l'hôte crée une partie et ferme l'app avant qu'un 2e joueur rejoigne, `quitter_room(sid)` est appelé mais la room reste dans `rooms` indéfiniment. La room ne sera jamais supprimée. |
| 🟡 Moyenne | `_udp_server_thread()` | Le thread UDP daemon lit le dictionnaire `rooms` depuis un thread OS différent du thread asyncio. Pas de `threading.Lock`. Race condition théorique si une room est supprimée pendant la lecture. |
| 🟡 Moyenne | `_local_registry` | La purge des entrées expirées ne se fait qu'à l'écriture (`POST /local/register`). Si aucune nouvelle partie n'est créée pendant 10 minutes, les entrées périmées restent en mémoire indéfiniment. |
| 🟢 Faible | `POST /local/register` | Aucune validation du format de l'IP. N'importe quelle chaîne est acceptée (ex: `"pas_une_ip"`). |
| 🟢 Faible | CORS `allow_origins=["*"]` | Acceptable pour un usage local, mais dangereux si l'API Railway est exposée publiquement. |

### Bug critique — Fuite de room en salle d'attente

```python
# Code actuel (backend/main.py)
@sio.event
async def disconnect(sid):
    code, _ = couleur_du_joueur(sid)
    if not code:
        return
    game = rooms[code]["game"]
    if room_est_pleine(code) or game.termine:
        await sio.emit("adversaire_deconnecte", {...}, room=code, skip_sid=sid)
        supprimer_room(code)
    else:
        quitter_room(sid)   # ← libère le slot mais ne supprime pas la room
                             #   si elle devient vide → fuite mémoire

# Correction proposée
    else:
        quitter_room(sid)
        if code in rooms:
            r = rooms[code]
            if r["joueurs"]["clair"] is None and r["joueurs"]["fonce"] is None:
                supprimer_room(code)   # supprime la room si plus aucun joueur
```

### Bug moyen — Thread-safety du dictionnaire rooms

```python
# Correction proposée (backend/main.py)
import threading
_rooms_lock = threading.Lock()

# Dans _udp_server_thread() :
with _rooms_lock:
    if code in rooms and not room_est_pleine(code):
        resp = json.dumps({'type': 'found', 'code': code}).encode()
        sock.sendto(resp, addr)

# Dans les fonctions asyncio, rooms est accédé en single-thread → pas de lock nécessaire
```

---

## 2. `backend/api/routes.py` — Routes HTTP REST

### Rôle

Expose quatre routes HTTP pour la gestion des rooms :

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/parties` | Crée une nouvelle room, retourne le code à 4 caractères |
| `GET` | `/parties/{code}` | Vérifie si une room existe et si elle est pleine |
| `GET` | `/parties/{code}/etat` | Retourne l'état complet du jeu (debug) |
| `DELETE` | `/parties/{code}` | Supprime une room (admin / debug) |

### Points forts

- Validation automatique des entrées via Pydantic (`CreerPartieBody`)
- Codes HTTP corrects : 404 si room inexistante, 200 sinon
- Normalisation du code en majuscules (`code.upper()`) avant recherche

### Bugs identifiés

| Sévérité | Localisation | Description |
|----------|-------------|-------------|
| 🟡 Moyenne | `POST /parties` | Aucun rate-limiting — un script malveillant peut créer des milliers de rooms et saturer la mémoire du serveur |
| 🟢 Faible | `DELETE /parties/{code}` | Route de debug laissée accessible en production — n'importe qui connaissant le code peut supprimer une room en cours |
| 🟢 Faible | `GET /parties/{code}/etat` | Expose l'état complet du jeu à n'importe qui connaissant le code — un joueur adverse peut lire le board côté serveur |

---

## 3. `backend/network/manager.py` — Gestion des rooms

### Rôle

Contient le dictionnaire global `rooms` et toutes les fonctions qui le manipulent.

```python
rooms = {
    "ABCD": {
        "game":    Game(...),
        "joueurs": { "clair": sid_A, "fonce": sid_B },
        "prenoms": { "clair": "Alice", "fonce": "Bob" }
    }
}
```

### Points forts

- Code court et lisible (80 lignes)
- `rejoindre_room` appelle `quitter_room(sid)` en début pour éviter qu'un même sid soit dans deux rooms simultanément
- `couleur_du_joueur(sid)` retourne `(code, couleur)` en une seule passe — utilisé partout dans `main.py`
- Génération du code à 4 caractères sans collision (boucle `while True` avec vérification)

### Bugs identifiés

| Sévérité | Localisation | Description |
|----------|-------------|-------------|
| 🟡 Moyenne | `rooms` (dict global) | Accédé depuis le thread asyncio ET depuis le thread UDP daemon sans verrou (`Lock`). Risque théorique de corruption lors d'une suppression concurrente. |
| 🟢 Faible | `prenoms` dans la room | Redondant avec `game.joueur1.nom` / `game.joueur2.nom`. Les deux sont mis à jour séparément dans `rejoindre_room`, risque de désynchronisation. |

---

## 4. `backend/game/board.py` — Plateau de jeu

### Rôle

Représente la grille 7×7 dont seulement **25 cases sont jouables** (disposition en losange). Les autres cases contiennent la valeur `"hors_plateau"`.

```
Représentation du plateau (O = jouable, . = hors plateau) :

    0   1   2   3   4   5   6
0 [ O   .   .   O   .   .   O ]
1 [ .   O   .   O   .   O   . ]
2 [ .   .   O   O   O   .   . ]
3 [ O   O   O   O   O   O   O ]
4 [ .   .   O   O   O   .   . ]
5 [ .   O   .   O   .   O   . ]
6 [ O   .   .   O   .   .   O ]
```

### Points forts

- `CASES_JOUABLES` est un `set` Python → membership test en O(1)
- `copier()` utilise une list comprehension (`[row[:] for row in self.grille]`) — copie superficielle efficace, suffisante car la grille ne contient que des valeurs primitives
- `set()` dans `Board.__init__` génère la grille en compréhension sans boucle explicite
- `assert` dans `set()` protège contre les écritures sur des cases invalides en développement

### Bugs identifiés

| Sévérité | Localisation | Description |
|----------|-------------|-------------|
| 🟢 Faible | `Board.set()` | Le `assert` est désactivé en production Python (`python -O`). En production, une écriture sur une case hors plateau passerait silencieusement. |

---

## 5. `backend/game/rules.py` — Règles du jeu

### Rôle

Contient toute la logique des règles : quels coups sont légaux, comment les appliquer, comment détecter la victoire.

### Fonctions principales

| Fonction | Description |
|----------|-------------|
| `deplacements_valides(board, row, col, dernier_coup)` | Retourne la liste de tous les coups légaux depuis une case |
| `appliquer_coup(board, coup, joueur_actif, joueur_adverse)` | Applique un coup sur une copie du board |
| `verifier_victoire(board)` | Retourne les couleurs gagnantes (0, 1 ou 2) |
| `trouver_carre_gagnant(board)` | Retourne les coordonnées du carré gagnant pour l'animation |
| `_est_annulation(coup, dernier_coup)` | Vérifie si un coup annule exactement le précédent |

### Types de coups

```
"poser"          → place une étoile de la main sur une case vide
"glisser"        → déplace une étoile vers une case vide (glissement)
"pousser"        → pousse une étoile adverse vers une case libre
"pousser_ejecter"→ pousse une étoile hors du plateau (éjection forcée)
"ejecter"        → éjecte volontairement sa propre étoile d'un coin
```

### Points forts

- `CARRES_POSSIBLES` pré-calculé **une seule fois** au chargement du module → pas de recalcul à chaque coup
- `_directions_pour(row, col)` ajoute les diagonales seulement sur les cases concernées (diagonale principale si `r==c`, secondaire si `r+c==6`) — logique élégante
- `appliquer_coup` crée toujours une **copie du board** sans modifier l'original — immutabilité garantie
- `verifier_victoire` gère le cas rare d'un **double carré simultané** (les deux couleurs dans `gagnants`)

### Bugs identifiés

| Sévérité | Localisation | Description |
|----------|-------------|-------------|
| 🟡 Moyenne | `_est_annulation()` | Ne couvre pas le cas `pousser_ejecter`. Un coup `pousser_ejecter` suivi de son "inverse" théorique n'est pas bloqué — mais ce cas est quasi-impossible en pratique car l'étoile éjectée quitte le plateau. Impact réel : nul. |
| 🟢 Faible | `_calculer_carres()` | Itère en O(n²) sur les paires de cases jouables pour trouver les 15 carrés. Correct mais verbeux — une liste codée en dur serait plus lisible, même si la performance est identique (exécuté une seule fois). |

---

## 6. `backend/game/game.py` — Orchestrateur de partie

### Rôle

Coordonne le déroulement d'une partie : gestion des tours, validation des coups, détection de fin, copie pour le Minimax.

### Points forts

- `copier()` crée une copie **manuelle** des champs Player au lieu de `deepcopy` — gain de performance significatif pour le Minimax qui copie des centaines de fois
- `_verifier_fin()` gère correctement le cas du **carré involontaire** : si l'adversaire a complété un carré, c'est l'adversaire qui gagne
- `etat()` sérialise le plateau dans un format directement utilisable par le frontend (`"r,c": couleur`)
- `jouer_deplacement()` re-valide le coup via `Rules.deplacements_valides()` — double vérification serveur

### Bugs identifiés

| Sévérité | Localisation | Description |
|----------|-------------|-------------|
| 🟢 Faible | `etat()` | `joueur_actif` est retourné comme `nom` (string). Si deux joueurs ont le même prénom, le frontend ne peut pas distinguer lequel est actif. `couleur_active` est déjà retourné — le frontend devrait se baser sur ça plutôt que sur le nom. |

---

## 7. `backend/ai/minimax.py` — Intelligence artificielle

### Rôle

Implémente l'algorithme **Minimax avec élagage alpha-bêta** pour les niveaux Moyen et Difficile. Le niveau Facile tire un coup aléatoire.

### Fonctionnement

```
Niveau Facile    → coup_facile()    : coup aléatoire parmi les coups légaux
Niveau Moyen     → coup_minimax(profondeur=2) : Minimax depth 2
Niveau Difficile → coup_minimax(profondeur=4) : Minimax depth 4

Profondeur adaptative :
  Phase de pose      → profondeur limitée à 2 (branching factor élevé)
  Phase de déplacement → profondeur complète (branching factor réduit)
```

### Points forts

- **Alpha-bêta** bien implémenté — réduit l'espace de recherche de O(b^d) à O(b^(d/2))
- **Move ordering** : les coups sont triés par score superficiel avant exploration — améliore les coupures alpha-bêta
- **`asyncio.to_thread`** dans `main.py` : le calcul Minimax tourne dans un thread séparé et ne bloque jamais les autres événements WebSocket
- **`_cases_strategiques()`** filtre les cases de pose pertinentes : coins de carrés offensifs ou défensifs — réduit le branching factor en phase de pose
- Fallback sur `coups[0]` si `meilleur_coup` reste `None` — pas de plantage même en cas dégénéré

### Bugs identifiés

| Sévérité | Localisation | Description |
|----------|-------------|-------------|
| 🟡 Moyenne | `_appliquer_board()` | Cette fonction copie le board sans mettre à jour `dernier_coup`. Les coups légaux calculés dessus pour le tri (`_trier_coups`) ignorent donc la règle d'annulation. L'IA peut inclure dans son tri des coups qu'elle n'aurait pas le droit de jouer. L'impact est limité (c'est le tri, pas la vraie validation) mais introduit une légère incohérence. |
| 🟢 Faible | `coup_minimax()` | En phase de pose niveau Difficile, la profondeur effective est plafonnée à 2 même si `profondeur=4`. C'est un choix délibéré (branching trop élevé) mais non documenté dans le code. |

### Illustration de l'élagage alpha-bêta

```
                   MAX (IA)
                  /    \
               MIN      MIN
              / \       / \
           MAX  MAX   MAX  MAX
           3    5     2    9

Sans alpha-bêta : évalue 8 nœuds
Avec alpha-bêta : évalue 5 nœuds (économie de ~40%)
À profondeur 4 avec 10+ coups par nœud : économie de ~75%
```

---

## 8. `backend/ai/evaluator.py` — Heuristique

### Rôle

Évalue une position du plateau pour une couleur donnée. Utilisée par le Minimax pour estimer la valeur d'un état non terminal.

### Formule

```
Pour chacun des 15 carrés possibles :
  Si aucun coin adverse → score += (nombre de coins amis)²
  Si au moins 1 coin adverse → carré mort, score += 0

Exemples :
  1 coin ami, 0 adverse → +1
  2 coins amis, 0 adverse → +4
  3 coins amis, 0 adverse → +9
  4 coins amis (victoire) → +16
  1 coin ami, 1 adverse → +0 (carré mort)
```

### Points forts

- Fonction **pure** (pas d'état global, pas d'effets de bord) — testable et prévisible
- La progression quadratique (`friendly²`) récompense davantage les carrés presque complets
- Différence `evaluer(board, ia) - evaluer(board, adverse)` dans le Minimax → vision relative, pas absolue

### Bugs identifiés

| Sévérité | Localisation | Description |
|----------|-------------|-------------|
| 🟢 Faible | `evaluer()` | Ne tient pas compte des étoiles en main des joueurs. Un joueur avec 6 étoiles posées est évalué de la même façon qu'un joueur avec 0 étoile posée si les carrés sont identiques. L'heuristique est fonctionnelle mais perfectible. |

---

## 9. Synthèse des problèmes backend

| ID | Sévérité | Fichier | Description | Statut |
|----|----------|---------|-------------|--------|
| B-01 | 🔴 Élevée | `main.py` | Room non supprimée quand l'hôte déconnecte seul en salle d'attente | À corriger |
| B-02 | 🟡 Moyenne | `main.py` + `manager.py` | Accès au dict `rooms` sans `Lock` depuis le thread UDP | À corriger |
| B-03 | 🟡 Moyenne | `main.py` | `_local_registry` non purgé si aucune partie créée pendant 10 min | À corriger |
| B-04 | 🟡 Moyenne | `minimax.py` | `_appliquer_board()` ignore `dernier_coup` → tri des coups légèrement incohérent | À corriger |
| B-05 | 🟡 Moyenne | `routes.py` | Pas de rate-limiting sur `POST /parties` | À corriger |
| B-06 | 🟢 Faible | `routes.py` | Route `DELETE /parties/{code}` accessible sans authentification | Optionnel |
| B-07 | 🟢 Faible | `routes.py` | Route `GET /parties/{code}/etat` expose le board à tous | Optionnel |
| B-08 | 🟢 Faible | `main.py` | `POST /local/register` accepte n'importe quel format d'IP | Optionnel |
| B-09 | 🟢 Faible | `board.py` | `assert` dans `set()` désactivé avec `python -O` | Optionnel |
| B-10 | 🟢 Faible | `evaluator.py` | Heuristique ne prend pas en compte les étoiles en main | Optionnel |

---

*Précédent : [01_architecture.md](01_architecture.md) — Suivant : [03_frontend.md](03_frontend.md)*
