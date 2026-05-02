# Animations — QOMET

Ce document explique les animations ajoutées dans le ticket F-animations.

---

## 1. Transitions entre pages

**Fichier modifié :** `frontend/src/router/index.jsx`

### Ce qui se passe
Chaque fois que tu navigues vers une nouvelle page (ex : Menu → IA), la page apparaît avec un léger fondu accompagné d'un glissement vers le haut.

### Comment ça marche
```jsx
const location = useLocation()

<div key={location.key} style={{ animation: 'pageEnter 0.3s ease forwards' }}>
  <Routes location={location}>
    ...
  </Routes>
</div>
```

- `useLocation()` donne la route courante.
- `key={location.key}` est la clé du trick : React démonte et remonte le `<div>` à chaque changement de route, ce qui relance l'animation CSS depuis le début.
- L'animation `pageEnter` est définie dans `index.css` :

```css
@keyframes pageEnter {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## 2. Animation de pose d'étoile

**Fichier modifié :** `frontend/src/components/Board.jsx`

### Ce qui se passe
Quand un joueur pose une étoile sur une case vide, l'étoile apparaît avec un effet de "pop" : elle surgit de rien en grandissant légèrement puis revient à taille normale.

### Comment ça marche

**Dans `Board` (composant parent) :**

Un `useEffect` surveille le prop `plateau`. À chaque changement, il compare l'ancien plateau (stocké dans un `useRef`) avec le nouveau :

```js
for (const key of SET_JOUABLES) {
  const prevVal = prev?.[r]?.[c] ?? null
  const currVal = plateau?.[r]?.[c] ?? null
  if (prevVal === null && currVal !== null) newIn.add(key)  // case vide → occupée
}
```

Les clés des nouvelles cases occupées sont mises dans l'état `animIn` (un `Set`), puis effacées après 400 ms.

**Dans `Cellule` (composant enfant) :**

Si la cellule est dans `animIn`, un wrapper autour de l'étoile SVG reçoit l'animation :

```jsx
<div style={{ animation: 'starPop 0.35s ease-out forwards' }}>
  <EtoileSVG ... />
</div>
```

```css
@keyframes starPop {
  0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
  60%  { transform: scale(1.25) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
```

L'étoile part de scale 0 avec une légère rotation, dépasse légèrement la taille normale (1.25) avant de se stabiliser à 1.

---

## 3. Animation d'éjection d'étoile

**Fichier modifié :** `frontend/src/components/Board.jsx`

### Ce qui se passe
Quand une étoile quitte une case (déplacement ou éjection hors plateau), un "fantôme" de cette étoile reste visible une fraction de seconde et disparaît en tournant sur elle-même.

### Comment ça marche

Le même `useEffect` qui détecte les poses détecte aussi les départs :

```js
if (prevVal !== null && currVal === null) newGhosts[key] = prevVal  // case occupée → vide
```

`newGhosts` est un objet `{ "r,c": "clair" | "fonce" }` stocké dans l'état `ghostStars`.

**Rendu :** Pour chaque fantôme, un `<div>` est positionné **en absolu** sur le board à la position exacte de la cellule (calculée depuis `PADDING`, `CELL`, `GAP`), avec l'animation `starOut` :

```jsx
<div style={{
  position: 'absolute',
  top:  PADDING + r * (CELL + GAP),
  left: PADDING + c * (CELL + GAP),
  animation: 'starOut 0.4s ease-out forwards',
  pointerEvents: 'none',
  zIndex: 10,
}}>
  <EtoileSVG ... />
</div>
```

```css
@keyframes starOut {
  0%   { transform: scale(1) rotate(0deg); opacity: 1; }
  100% { transform: scale(0) rotate(45deg); opacity: 0; }
}
```

Le `pointerEvents: none` est important : le fantôme ne doit pas intercepter les clics.

---

## 4. Surbrillance du carré gagnant

**Fichiers modifiés :**
- `frontend/src/utils/rulesClient.js` — détection
- `frontend/src/pages/Game.jsx` — appel de la détection
- `frontend/src/components/Board.jsx` — rendu de la surbrillance

### Ce qui se passe
Dès que 4 étoiles de la même couleur forment un carré sur le plateau, elles se mettent à pulser avec un halo doré.

### Comment ça marche — détection géométrique

La fonction `detecterCarreGagnant(plateau)` dans `rulesClient.js` utilise une propriété mathématique des carrés : si deux points A et B sont deux sommets adjacents d'un carré, les deux autres sommets C et D s'obtiennent par rotation de 90° du vecteur AB.

```js
const dr = r2 - r1, dc = c2 - c1   // vecteur A→B
const r3 = r1 + dc, c3 = c1 - dr   // C = A + vecteur pivoté
const r4 = r2 + dc, c4 = c2 - dr   // D = B + vecteur pivoté
```

L'algorithme teste toutes les paires de cases jouables de la même couleur et vérifie si les deux coins calculés sont aussi des cases jouables occupées par la même couleur. Il détecte **tous les carrés** : droits, inclinés à 45°, de n'importe quelle taille.

Exemple de carré détecté : `[1,1]`, `[1,3]`, `[3,1]`, `[3,3]`
- vecteur : `dr=0, dc=2`
- coins calculés : `(1+2, 1-0) = (3,1)` et `(1+2, 3-0) = (3,3)` ✓

### Comment ça marche — appel dans Game.jsx

```js
function mettreAJourVictoire(nouvPlateau) {
  const resultat = detecterCarreGagnant(nouvPlateau)
  setCellulesGagnantes(resultat
    ? new Set(resultat.cellules.map(([r, c]) => `${r},${c}`))
    : new Set()
  )
}
```

Appelé après chaque pose et après chaque déplacement. Le `Set` résultant (`cellulesGagnantes`) est passé en prop à `Board`.

### Comment ça marche — animation dans Board/Cellule

Si une cellule est dans `cellulesGagnantes` ET qu'elle a une étoile, le wrapper interne reçoit l'animation `winPulse` (infinie) :

```jsx
const innerAnim =
  animIn                  ? 'starPop 0.35s ease-out forwards' :
  (estGagnante && valeur) ? 'winPulse 1.2s ease-in-out infinite' :
  undefined
```

`starPop` a la priorité sur `winPulse` : si l'étoile vient juste d'être posée ET qu'elle complète un carré, elle fait d'abord son pop-in, puis passe au pulse doré après 400 ms.

```css
@keyframes winPulse {
  0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 6px #fbbf24); }
  50%       { transform: scale(1.1); filter: drop-shadow(0 0 16px #fde68a) drop-shadow(0 0 28px #f59e0b); }
}
```

Le filtre externe de la cellule est désactivé quand `winPulse` est actif (`filter: none` sur le div parent) pour éviter un double-glow.

---

## Récapitulatif des fichiers touchés

| Fichier | Ce qui a changé |
|---|---|
| `frontend/src/index.css` | +4 keyframes : `pageEnter`, `starPop`, `starOut`, `winPulse` |
| `frontend/src/router/index.jsx` | Wrapper avec `key={location.key}` pour les transitions de page |
| `frontend/src/utils/rulesClient.js` | Nouvelle fonction `detecterCarreGagnant` exportée |
| `frontend/src/components/Board.jsx` | `useEffect` de diff plateau, ghost stars, props `animIn`/`estGagnante` |
| `frontend/src/pages/Game.jsx` | Import + appel de `detecterCarreGagnant`, état `cellulesGagnantes`, prop vers `Board` |
