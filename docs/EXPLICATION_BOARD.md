# Explication du code — `Board.jsx` + `boardGeometry.js`

> Ticket F-06 — Board interactif : sélection, surbrillance des coups valides, connexions visuelles.

---

## Structure générale

```
boardGeometry.js   → source unique : cases jouables, arêtes, voisins
Board.jsx          → affichage du plateau (grille + lignes SVG + étoiles)
  ├── Cellule      → une case cliquable avec effets visuels
  └── EtoileSVG    → composant étoile réutilisable (exporté)
```

---

## `boardGeometry.js` — La géométrie du plateau

Ce fichier est la **source de vérité** pour toute la géométrie du plateau.
Il est utilisé par `Board.jsx` (pour les lignes) et `rulesClient.js` (pour les règles).

### `SET_JOUABLES`

```js
export const SET_JOUABLES = new Set(CASES_JOUABLES.map(([r, c]) => `${r},${c}`))
```

Transforme le tableau `CASES_JOUABLES` en `Set` de clés `"r,c"`.
**Pourquoi un Set ?**
Vérifier `SET_JOUABLES.has("3,4")` est en **O(1)** contre O(n) pour `.some()` sur un tableau.
Avec 25 cases et des rendus fréquents, ce gain est mesurable.

### `buildEdgesAndNeighbors()` — La construction unique

Les arêtes et voisins sont construits **une seule fois** au chargement du module.
Quatre types de connexions, exactement comme le backend Python (`_compute_edges`) :

| Type | Règle | Exemple |
|---|---|---|
| Horizontal | Cases adjacentes sur la même ligne | (3,2)↔(3,3) |
| Vertical | Cases adjacentes dans la même colonne | (0,3)↔(3,3) |
| Diagonale ↘ | r == c | (0,0)↔(1,1)↔(2,2)... |
| Diagonale ↙ | r + c == 6 | (0,6)↔(1,5)↔(2,4)... |

```js
export const { EDGES, NEIGHBORS } = (() => {
  const { edges, neighbors } = buildEdgesAndNeighbors()
  return { EDGES: edges, NEIGHBORS: neighbors }
})()
```

Le `(() => { ... })()` est une **IIFE** (Immediately Invoked Function Expression).
Elle appelle `buildEdgesAndNeighbors()` immédiatement et en expose le résultat.
Cela permet d'utiliser des variables locales temporaires (`edges`, `neighbors`)
sans les polluer dans le module.

### `EDGES` vs `NEIGHBORS`

| Constante | Format | Utilisé par |
|---|---|---|
| `EDGES` | `[ [[r1,c1],[r2,c2]], ... ]` | `Board.jsx` pour tracer les lignes SVG |
| `NEIGHBORS` | `{ "r,c": [{dest, dir}, ...] }` | `rulesClient.js` pour calculer les mouvements |

`NEIGHBORS` stocke pour chaque case ses voisins avec la direction complète (non unitaire).
Ex : depuis `(0,6)` vers `(3,6)`, la direction est `[3,0]` (pas `[1,0]`).
Cela est nécessaire pour le calcul de poussée (voir `rulesClient.js`).

---

## `Board.jsx` — Le composant d'affichage

### Constantes de mise en page

```js
const CELL = 54    // taille d'une case en pixels
const GAP = 14     // espace entre les cases
const PADDING = 36 // marge intérieure du plateau
const SVG_SIZE = PADDING * 2 + TAILLE * CELL + (TAILLE - 1) * GAP  // = 526px
```

Ces constantes définissent la taille du plateau.
`SVG_SIZE` est calculé pour que le SVG des lignes couvre exactement toute la zone.

### Props du composant `Board`

| Prop | Type | Rôle |
|---|---|---|
| `plateau` | tableau 7×7 | État de chaque case (`null`, `"clair"`, `"fonce"`) |
| `selectionne` | `[r, c]` ou `null` | Case actuellement sélectionnée |
| `coupsValides` | `[[r,c], ...]` | Cases destinations surlignées en vert |
| `onCellClick` | fonction | Appelée avec `(r, c)` au clic |
| `phase` | `"pose"` ou `"deplacement"` | Change le curseur et la couleur hover |

### Les lignes SVG — superposition sur la grille

```jsx
<svg width={SVG_SIZE} height={SVG_SIZE} style={styles.svg}>
  {EDGES.map(([[r1, c1], [r2, c2]], i) => { ... })}
</svg>
```

Le SVG est positionné en **absolute** sur le board avec `pointerEvents: none`
pour que les clics passent à travers vers les cellules.

```js
const actif = selectionne &&
  ((selectionne[0] === r1 && selectionne[1] === c1) ||
   (selectionne[0] === r2 && selectionne[1] === c2))
```

Les lignes reliées à la case sélectionnée passent en violet vif (`#a78bfa`)
pour guider visuellement le joueur sur les directions possibles.

### `Cellule` — état hover en React

Comme dans `Reseau.jsx`, on gère le hover manuellement avec `useState` :

```js
const [survol, setSurvol] = useState(false)
```

Les états visuels sont calculés par `getConfig` qui retourne `fill`, `stroke`, `glow`, `cursor`.

### `EtoileSVG` — étoile réutilisable

```jsx
export function EtoileSVG({ fill, stroke, strokeWidth = 1.5, innerFill, size = 54 })
```

Exportée pour être réutilisée dans `PlayerInfo.jsx`.
La prop `size` permet de l'afficher en 54px (plateau) ou 20-28px (panneaux joueurs).

Le SVG contient 2 polygones :
- **Étoile principale** : les 10 points du contour
- **Reflet intérieur** (optionnel) : polygone intérieur semi-transparent pour l'effet 3D

### `getConfig` — logique de couleur centralisée

```js
function getConfig(valeur, selectionne, coupValide, phase, survol) { ... }
```

Priorité des états (du plus prioritaire au moins) :
1. `selectionne` → violet avec glow
2. `coupValide` → vert avec glow
3. `valeur === 'clair'` → jaune
4. `valeur === 'fonce'` → rouge
5. Case vide + survol + pose → violet foncé (feedback de pose)
6. Case vide → bleu foncé discret

---

## Ce qui manque (quand le backend sera connecté)

| Endroit | Ce qu'il faudra faire |
|---|---|
| `coupsValides` | Recevoir les coups depuis le serveur via Socket.io au lieu de `rulesClient.js` |
| `plateau` | Recevoir l'état du plateau depuis le store mis à jour par Socket.io |
| `EtoileSVG` dans `Cellule` | Ajouter animation de déplacement (CSS transition) |
