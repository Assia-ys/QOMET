# Explication du code — `Game.jsx` + `useGameStore.js` + `rulesClient.js`

> Ticket F-05 — Page de jeu complète : plateau, panneaux joueurs, phases, modales.

---

## Structure générale

```
useGameStore.js   → état global de la partie (Zustand)
rulesClient.js    → règles mock temporaires (sera supprimé à N-05)
Game.jsx          → page de jeu, orchestre tout
  ├── Board       → plateau interactif (voir EXPLICATION_BOARD.md)
  ├── PlayerInfo  → panneau gauche/droite avec compteurs
  ├── BoutonPhase → switch Poser / Déplacer
  ├── BoutonAction → boutons Retour / Pause / Abandonner
  ├── Modale      → fenêtre de confirmation (Pause, Abandon)
  └── JoueurPause → affichage VS dans la modale Pause
```

---

## `useGameStore.js` — L'état global de la partie

### Pourquoi Zustand ?

`Game.jsx` utilise `Board`, `PlayerInfo` et plusieurs composants internes.
Sans store global, il faudrait passer le plateau et les joueurs en props
à travers plusieurs niveaux. Zustand crée une **boîte centrale** lisible
depuis n'importe quel composant.

### État initial

| Champ | Valeur initiale | Rôle |
|---|---|---|
| `plateau` | `GRILLE_VIDE` (7×7 de null) | Cases du plateau |
| `joueurs` | `[Alice (clair), Bob (foncé)]` | Nom, couleur, étoiles en main et sur plateau |
| `indexJoueurActif` | `0` | Index dans le tableau `joueurs` |
| `etatPartie` | `"en_attente"` | `"en_attente"` / `"en_cours"` / `"terminee"` |
| `gagnant` | `null` | Le joueur gagnant ou `null` |
| `selectionne` | `null` | Case sélectionnée `[r, c]` ou `null` |
| `coupsValides` | `[]` | Destinations surlignées en vert |
| `dernierCoup` | `null` | Dernière case jouée (pour anti-annulation) |

### Actions clés

**`selectionnerCase(row, col)`**
```js
set({ selectionne: row === null ? null : [row, col] })
```
Accepte `(null, null)` pour désélectionner proprement.

**`changerTour()`**
```js
indexJoueurActif: state.indexJoueurActif === 0 ? 1 : 0,
selectionne: null,
coupsValides: [],
dernierCoup: state.selectionne,
```
Bascule le joueur actif et nettoie la sélection en une seule opération atomique.

**`poserEtoile(indexJoueur)`**
Met à jour `en_main - 1` et `sur_plateau + 1` du joueur qui pose.
```js
joueurs: state.joueurs.map((j, i) =>
  i === indexJoueur ? { ...j, en_main: j.en_main - 1, sur_plateau: j.sur_plateau + 1 } : j
)
```
`...j` crée une copie de l'objet joueur avant de modifier — **jamais de mutation directe en React**.

**`recupererEtoile(couleur)`**
Appelée quand une étoile est éjectée du plateau.
Retrouve le joueur par sa couleur (pas son index) car c'est l'adversaire qui peut être éjecté.

**`reinitialiser()`**
```js
set({ ...etatInitial })
```
Remet tout l'état à sa valeur initiale en une ligne grâce au spread de `etatInitial`.

---

## `rulesClient.js` — Règles mock temporaires

> ⚠️ Ce fichier sera **supprimé au ticket N-05** quand le backend sera connecté.
> Il reproduit la logique de `backend/game/rules.py` pour les tests visuels.

### `getCasesAccessibles(plateau, row, col)`

Retourne les destinations valides pour l'étoile en `(row, col)`.
Utilise `NEIGHBORS` de `boardGeometry.js` pour ne scanner que les arêtes réelles.

**3 cas pour chaque voisin `(nr, nc)` dans la direction `(dr, dc)` :**

```
1. (nr, nc) libre         → glissement simple → destination = (nr, nc)
2. (nr, nc) occupé
   + (nr+dr, nc+dc) hors plateau → poussée éjectante → destination = (nr, nc)
   + (nr+dr, nc+dc) libre        → poussée normale  → destination = (nr, nc)
   + (nr+dr, nc+dc) occupé       → impossible (règle C1)
```

**Pourquoi la destination est toujours `(nr, nc)` ?**
Dans tous les cas, l'étoile ACTIVE se déplace vers `(nr, nc)`.
C'est le voisin direct qui change de statut — soit il était vide, soit la pièce qui y était est poussée.

### `appliquerMouvement(plateau, fromR, fromC, toR, toC)`

Applique le mouvement et retourne `{ nouveauPlateau, etoileEjectee }`.

```js
const voisin = NEIGHBORS[`${fromR},${fromC}`]
  .find(({ dest: [nr, nc] }) => nr === toR && nc === toC)
const [dr, dc] = voisin.dir
```

La direction `[dr, dc]` récupérée n'est **pas unitaire** — c'est le vecteur complet
de l'arête. Ex: depuis `(0,6)` vers `(3,6)`, `dr = 3`, `dc = 0`.

La case "derrière" la pièce poussée : `(toR + dr, toC + dc)`.
- `(0,6)` pousse `(3,6)` → derrière = `(3+3, 6+0) = (6,6)` ✓

---

## `Game.jsx` — La page de jeu

### La logique de clic `handleCellClick`

```
Clic reçu (r, c)
│
├── Coup valide sélectionné ?
│   → appliquerMouvement() → setPlateau() → récupérer étoile si éjectée → changerTour()
│
├── Clic sur son étoile en mode déplacement ?
│   → selectionnerCase() → getCasesAccessibles() → setCoupsValides()
│
├── Clic sur case vide en mode pose ?
│   → setPlateau() → poserEtoile() → changerTour()
│
└── Sinon
    → désélectionner
```

### `changerPhase(nouvellePhase)`

Fonction locale qui change la phase ET nettoie la sélection.
```js
function changerPhase(nouvellePhase) {
  setPhase(nouvellePhase)
  selectionnerCase(null, null)
  setCoupsValides([])
}
```
Sans ce nettoyage, une étoile sélectionnée en mode déplacement resterait
surlignée en bleu quand on bascule en mode pose.

### Les modales — état local vs store

Les modales Pause et Abandon sont des états **locaux** (`useState` dans `Game.jsx`).
On n'utilise pas le store pour ça car ces états ne sont utiles qu'à cette page.

**Règle :** utiliser le store uniquement pour l'état qui doit être **partagé** entre composants.
Les modales d'une seule page restent locales.

### `BoutonAction` — hover géré en React

Même pattern que `Home.jsx` et `Reseau.jsx` :
```js
backgroundColor: survol ? couleur : couleur + 'cc'
```
`'cc'` en hexadécimal = opacité à 80%. Au repos = légèrement transparent,
au survol = pleine couleur.

---

## Ce qui manque (quand le backend sera connecté)

| Endroit | Ce qu'il faudra faire |
|---|---|
| `handleCellClick` | Remplacer `appliquerMouvement` par un emit Socket.io `{ type: 'jouer', ... }` |
| `getCasesAccessibles` | Recevoir les coups valides du serveur après sélection |
| `poserEtoile` / `recupererEtoile` | Mettre à jour via l'état reçu du serveur |
| Phase pose/déplacement | Détecter automatiquement selon l'état du jeu (toutes étoiles posées → déplacement) |
| `reinitialiser` | Appeler `POST /parties` pour créer une nouvelle partie |
