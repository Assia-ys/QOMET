# Documentation — Package `backend/game`
⚠️‼️: Pour visualiser le fichier DOC lisiblement je vous invite a tapper ctr+shift+v
---

# `board.py`

---

## Constantes globales

### `TAILLE = 7`
La grille est une matrice de 7 lignes × 7 colonnes (indices 0 à 6).
Même si seulement 25 cases sont jouables, on a besoin de 7 colonnes car les coins
du plateau sont en (0,0), (0,6), (6,0), (6,6) — soit une distance de 6.

### `CASE_HORS_PLATEAU = "hors_plateau"`
Valeur sentinelle pour les cases qui n'appartiennent pas au plateau de jeu.
On utilise une chaîne explicite (et non `False`) pour éviter toute confusion
avec `None` — les deux étant "falsy" en Python, un `if not valeur` serait
ambigu. Avec cette constante, la distinction est toujours claire :
- `None` → case jouable, vide
- `"hors_plateau"` → case hors du plateau (inexistante pour le jeu)
- `"clair"` / `"fonce"` → case occupée par une étoile

### `CASES_JOUABLES`
Un **set** de 25 tuples `(row, col)` représentant les emplacements valides
du plateau en forme de losange/étoile :

```
Col:  0  1  2  3  4  5  6
Row 0: ●  .  .  ●  .  .  ●
Row 1: .  ●  .  ●  .  ●  .
Row 2: .  .  ●  ●  ●  .  .
Row 3: ●  ●  ●  ●  ●  ●  ●   ← ligne centrale complète
Row 4: .  .  ●  ●  ●  .  .
Row 5: .  ●  .  ●  .  ●  .
Row 6: ●  .  .  ●  .  .  ●
```
`●` = case jouable (25 au total) / `.` = hors plateau

On utilise un **set** (et non une liste) pour que la vérification
`(r, c) in CASES_JOUABLES` soit en O(1) au lieu de O(n).

---

## Classe `Board`

### `__init__(self)`
Initialise le plateau vide.

```python
self.grille = [
    [None if (r, c) in CASES_JOUABLES else CASE_HORS_PLATEAU
     for c in range(TAILLE)]
    for r in range(TAILLE)
]
```
C'est une **liste de compréhension imbriquée** qui construit la grille 7×7 :
pour chaque cellule, si elle est dans CASES_JOUABLES → `None` (vide),
sinon → `"hors_plateau"`.

`self.dernier_coup` mémorise le dernier coup joué (utilisé par la règle
anti-annulation dans `rules.py`).

---

### `est_jouable(self, row, col)` → bool
Vérifie si la case `(row, col)` fait partie des 25 emplacements du plateau.
```python
return (row, col) in CASES_JOUABLES
```
Ne vérifie **pas** si la case est dans les limites de la grille 7×7 —
pour ça il y a `est_valide`.

---

### `est_valide(self, row, col)` → bool
Vérifie si les coordonnées sont dans les limites de la grille 7×7.
```python
return 0 <= row < TAILLE and 0 <= col < TAILLE
```
Utilisé dans `rules.py` pour parcourir les directions sans sortir
de la matrice (évite un `IndexError`).

> **Différence avec `est_jouable` :**
> `est_valide(3, 6)` → True (dans la grille)
> `est_jouable(3, 6)` → True (case du plateau)
> `est_valide(0, 1)` → True (dans la grille)
> `est_jouable(0, 1)` → False (hors plateau)

---

### `est_libre(self, row, col)` → bool
Vérifie qu'une case est à la fois jouable ET vide (aucune étoile dessus).
```python
return self.est_jouable(row, col) and self.grille[row][col] is None
```
On utilise `is None` (et non `== None`) pour la comparaison d'identité
stricte — plus sûr et plus rapide en Python.

---

### `poser(self, row, col, couleur)` → (bool, str)
Pose une étoile de la couleur donnée sur la case `(row, col)`.

Retourne un tuple `(succès, message)` :
- `(False, "Case non jouable")` si la case n'est pas sur le plateau
- `(False, "Case occupée")` si la case est déjà prise
- `(True, "OK")` si la pose réussit

Met à jour `dernier_coup` avec le tuple `("poser", row, col, couleur)`.

> C'est la seule méthode qui valide avant d'écrire.
> `set()` est réservé aux déplacements internes (depuis `rules.py`).

---

### `get(self, row, col)` → valeur
Lecture brute de la grille. Retourne :
- `None` → case vide
- `"hors_plateau"` → case hors jeu
- `"clair"` ou `"fonce"` → étoile posée

Pas de validation — usage interne uniquement sur des coordonnées
déjà vérifiées par `est_jouable` ou `est_valide`.

---

### `set(self, row, col, valeur)`
Écriture directe dans la grille, réservée à `rules.py` pour les
déplacements (glisser, pousser).

Protégée par un `assert` :
```python
assert self.est_jouable(row, col), f"Tentative d'écriture sur case non jouable ({row},{col})"
```
Si par bug on essaie d'écrire sur une case hors plateau, le programme
s'arrête immédiatement avec un message clair plutôt que de corrompre
la grille silencieusement.

---

### `afficher(self)`
Affiche le plateau dans le terminal, utile pour le debug.

```
C . . O . . O
. F . C . O .
...
```
- `O` = case jouable vide
- `.` = hors plateau
- `C` = étoile clair
- `F` = étoile foncé

---

### `copier(self)` → Board
Crée une copie indépendante du plateau.

```python
b.grille = [row[:] for row in self.grille]
```
`row[:]` fait une copie de chaque ligne (shallow copy).
C'est suffisant car les valeurs sont des chaînes ou `None`
(types immuables) — il n'y a pas d'objets imbriqués à copier en profondeur.

Utilisé dans `rules.py` : `appliquer_coup` travaille toujours sur une
copie pour ne jamais modifier l'état original.

---

# `player.py`

## Classe `Player`

Représente un joueur avec son nom, sa couleur et le suivi de ses étoiles.
Chaque joueur commence avec **7 étoiles en main** et **0 sur le plateau**.
La règle du jeu garantit que `etoiles_en_main + etoiles_sur_plateau = 7` en permanence.

---

### `__init__(self, nom, couleur)`
Initialise le joueur.

| Attribut | Valeur initiale | Rôle |
|---|---|---|
| `self.nom` | nom passé en paramètre | Identifiant du joueur |
| `self.couleur` | `"clair"` ou `"fonce"` | Couleur des étoiles |
| `self.etoiles_en_main` | `7` | Étoiles pas encore posées |
| `self.etoiles_sur_plateau` | `0` | Étoiles posées sur le plateau |

Les deux seules couleurs valides sont `"clair"` et `"fonce"`, utilisées
comme valeurs dans la grille du `Board`.

---

### `peut_poser(self)` → bool
Indique si le joueur peut encore poser une étoile (il lui en reste en main).

```python
return self.etoiles_en_main > 0
```

Appelé dans `game.py` avant `jouer_poser()` pour vérifier que l'action
est légale selon les règles.

---

### `poser_etoile(self)` → bool
Transfère une étoile de la main vers le plateau.

```python
self.etoiles_en_main -= 1
self.etoiles_sur_plateau += 1
```

Retourne `False` si plus d'étoiles en main (garde de sécurité),
même si `game.py` vérifie déjà via `peut_poser()` avant d'appeler
cette méthode.

> **Invariant maintenu :** `etoiles_en_main + etoiles_sur_plateau = 7`

---

### `recuperer_etoile(self)`
Récupère une étoile éjectée du plateau vers la main du joueur.

```python
assert self.etoiles_sur_plateau > 0, f"{self.nom} n'a aucune étoile sur le plateau à récupérer"
self.etoiles_en_main += 1
self.etoiles_sur_plateau -= 1
```

Appelée depuis `rules.py` dans deux cas :
- `"pousser_ejecter"` — une étoile est poussée hors du plateau
- `"ejecter"` — une étoile glisse hors du plateau

**Pourquoi l'assert ?**
Sans garde, si cette méthode était appelée par erreur alors que
`etoiles_sur_plateau == 0`, les compteurs passeraient à des valeurs
impossibles (`etoiles_en_main = 8`, `etoiles_sur_plateau = -1`).
L'assert stoppe le programme immédiatement avec un message clair
plutôt que laisser le bug se propager silencieusement.

> **Invariant maintenu :** `etoiles_en_main + etoiles_sur_plateau = 7`

---

### `__str__(self)` → str
Représentation textuelle du joueur, utilisée pour le debug et `game.etat()`.

```
Alice (clair) — en main: 5 | sur plateau: 2
```

--------------------------------------------

# `rules.py`

## Constante `DIRECTIONS`

Liste des 8 directions de déplacement possibles sous forme de vecteurs `(dr, dc)` :

```python
(0, 1)   # droite
(0, -1)  # gauche
(1, 0)   # bas
(-1, 0)  # haut
(1, 1)   # diagonale bas-droite
(-1, -1) # diagonale haut-gauche
(1, -1)  # diagonale bas-gauche
(-1, 1)  # diagonale haut-droite
```

Conforme aux règles : déplacement possible sur toute ligne horizontale, verticale ou diagonale.

-----------------------------------------

## Classe `Rules`

Toutes les méthodes sont des `@staticmethod` — la classe `Rules` ne stocke aucun état,
elle ne fait que calculer. On l'utilise directement : `Rules.deplacements_valides(...)`.

---

### `prochaine_case_jouable(board, row, col, dr, dc)` → tuple | None

Depuis la case `(row, col)`, avance case par case dans la direction `(dr, dc)`
jusqu'à trouver une case jouable ou sortir de la grille 7×7.

```python
r, c = row + dr, col + dc
while board.est_valide(r, c):
    if board.est_jouable(r, c):
        return (r, c)
    r += dr
    c += dc
return None
```

Retourne :
- `(r, c)` — la prochaine case du plateau dans cette direction
- `None` — si on sort de la grille sans en trouver (éjection possible)

> Utilisée par `deplacements_valides` pour trouver la cible d'un glissement
> et par `deplacements_valides` à nouveau pour trouver la case derrière une pièce poussée.

---

### `deplacements_valides(board, row, col, dernier_coup)` → list

Retourne la liste de tous les coups légaux pour la pièce en `(row, col)`.
Chaque coup est un **tuple** décrivant l'action complète.

**Gardes d'entrée :**
```python
if not board.est_jouable(row, col): return []  # case hors plateau
if board.get(row, col) is None: return []       # case vide, rien à déplacer
```

**4 types de coups générés selon la direction :**

| Situation | Type de coup | Tuple généré |
|---|---|---|
| Aucune case jouable dans la direction | `ejecter` | `("ejecter", r1, c1, dr, dc)` |
| Case jouable libre | `glisser` | `("glisser", r1, c1, r2, c2, dr, dc)` |
| Case jouable occupée + case derrière libre | `pousser` | `("pousser", r1, c1, r2, c2, r3, c3, dr, dc)` |
| Case jouable occupée + rien derrière | `pousser_ejecter` | `("pousser_ejecter", r1, c1, r2, c2, dr, dc)` |
| Case jouable occupée + case derrière occupée | rien | interdit (règle C1 : max 1 poussée) |

Chaque coup est filtré par `_est_annulation` avant d'être ajouté.

---

### `_est_annulation(coup, dernier_coup)` → bool

Vérifie si le coup proposé annule exactement le coup précédent (règle C2).

**Cas géré — `glisser` A→B puis B→A :**
```python
if coup[0] == "glisser" and dernier_coup[0] == "glisser":
    if départ_actuel == arrivée_précédente and arrivée_actuelle == départ_précédent:
        return True  # annulation interdite
```

Retourne `False` si `dernier_coup` est `None` (premier tour) ou si le coup
n'est pas une annulation.

> Les cas `ejecter` et `pousser_ejecter` ne nécessitent pas de vérification :
> une fois éjectée, la pièce est en main et ne peut pas reproduire le même coup.

---

### `appliquer_coup(board, coup, joueur_actif, joueur_adverse)` → Board

Applique un coup sur une **copie** du board. Ne modifie jamais le board original.

```python
b = board.copier()  # travaille toujours sur une copie
```

**Traitement par type :**

| Type | Actions |
|---|---|
| `glisser` | déplace la pièce de (r1,c1) vers (r2,c2), vide (r1,c1) |
| `pousser` | avance la pièce poussée en (r3,c3), avance l'active en (r2,c2), vide (r1,c1) |
| `pousser_ejecter` | identifie le propriétaire de la pièce éjectée → `recuperer_etoile()`, avance l'active en (r2,c2), vide (r1,c1) |
| `ejecter` | joueur actif récupère sa pièce → `recuperer_etoile()`, vide (r1,c1) |

Un `raise ValueError` est levé si le type de coup est inconnu — évite tout
échec silencieux qui retournerait un board inchangé.

---

### `verifier_victoire(board)` → set

Recherche si un carré parfait de 4 étoiles de même couleur est formé.
Retourne un `set` de couleurs gagnantes (peut contenir 0, 1 ou 2 éléments).

**Algorithme :**
1. Prend toutes les paires de cases sur la **même ligne** (r1 == r2) → côté supérieur du carré
2. `hauteur = abs(c2 - c1)` → un carré a largeur = hauteur
3. Vérifie les 2 coins inférieurs : `(r1 ± hauteur, c1)` et `(r1 ± hauteur, c2)`
4. Si les 4 coins sont dans `CASES_JOUABLES` et ont la même couleur → victoire

**Le plateau contient 15 carrés possibles :**

| Taille du côté | Nombre de carrés |
|---|---|
| 1 | 4 |
| 2 | 5 |
| 3 | 4 |
| 4 | 1 |
| 6 | 1 |

Le plus grand carré possible utilise les 4 coins extrêmes du plateau :
`(0,0) (0,6) (6,0) (6,6)`.
