# Explication du code — `Reseau.jsx`

> Objectif : comprendre chaque décision technique prise dans ce fichier pour pouvoir les reproduire seul.

---

## Structure générale du fichier

Le fichier est découpé en **4 blocs indépendants** :

```
C                → palette de couleurs (constante)
genererCode()    → fonction utilitaire pure
VueAccueil       → composant "écran principal" (les deux cartes)
SalleAttente     → composant "en attente d'un adversaire"
EcranErreur      → composant "code invalide"
Reseau           → composant racine exporté, gère quelle vue afficher
```

La page ne fait **jamais de requête réseau** pour l'instant : tout est simulé en local.

---

## 1. La constante `C` — palette de couleurs

```js
const C = {
  bg: '#0f172a',
  violet: '#7c3aed',
  violetHover: '#6d28d9',
  // ...
}
```

**Pourquoi ?**
Sans ça, la même couleur `#7c3aed` se retrouverait répétée 15 fois dans le fichier.
Si un jour tu veux changer la couleur principale, tu modifies **un seul endroit**.

C'est un **design token** maison, version minimaliste.
Les projets pro utilisent souvent des variables CSS (`--color-primary`) ou un fichier `theme.js` séparé.

---

## 2. `genererCode()` — génération du code de partie

```js
function genererCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
```

**Décortiqué ligne par ligne :**

```js
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
```
L'alphabet utilisé exclut volontairement `I`, `O`, `0`, `1` car ils se ressemblent visuellement.
Un joueur qui lit "I" peut confondre avec "1". On évite les erreurs de saisie.

```js
Array.from({ length: 4 }, () => ...)
```
Crée un tableau de 4 éléments. Pour chacun, on exécute la fonction fléchée.
C'est équivalent à une boucle `for` qui pousse 4 éléments, mais en une ligne.

```js
chars[Math.floor(Math.random() * chars.length)]
```
- `Math.random()` → nombre décimal aléatoire entre 0 et 1 (ex: 0.73)
- `* chars.length` → ramène ça entre 0 et 32 (ex: 23.36)
- `Math.floor()` → arrondit vers le bas → index entier (ex: 23)
- `chars[23]` → le 24ème caractère de la chaîne

```js
.join('')
```
Transforme `['A', '5', 'K', '3']` en `'A5K3'`.

---

## 3. Le composant racine `Reseau` — machine à états

```js
export default function Reseau() {
  const [vue, setVue] = useState('accueil') // 'accueil' | 'attente' | 'erreur'
  const [codePartie, setCodePartie] = useState('')
  const [prenomHote, setPrenomHote] = useState('')
  // ...
  if (vue === 'attente') return <SalleAttente ... />
  if (vue === 'erreur')  return <EcranErreur ... />
  return <VueAccueil ... />
}
```

### Concept : machine à états (state machine)

`vue` est une **variable d'état** qui contrôle ce qu'on affiche.
Elle ne peut avoir que 3 valeurs possibles : `'accueil'`, `'attente'`, `'erreur'`.

```
         onCreer()           onAnnuler()
accueil ──────────→ attente ─────────→ accueil
   │                                      ↑
   │  onRejoindre()    onRetour()          │
   └─────────────→ erreur ────────────────┘
                      │
                      │ onReessayer()
                      └──────────────→ accueil
```

**Pourquoi ne pas faire 3 routes séparées (`/reseau/creer`, `/reseau/attente`...) ?**
Parce que ces vues ne méritent pas d'URL propre.
L'utilisateur ne doit pas pouvoir arriver directement sur la salle d'attente via un lien.
La navigation est **interne** à la page, pas dans le routeur.

### Props-callbacks (les `onCreer`, `onRejoindre`...)

```js
<VueAccueil onCreer={handleCreer} onRejoindre={handleRejoindre} />
```

`VueAccueil` ne sait pas quoi faire quand l'utilisateur clique "Créer".
Elle appelle juste `onCreer(prenom)` et c'est `Reseau` qui décide de changer la vue.

C'est le pattern **"remontée d'événement"** (lifting state up) :
- l'enfant informe le parent via une fonction passée en prop
- le parent détient l'état et prend les décisions

---

## 4. `useState` — les états locaux de `VueAccueil`

```js
const [prenomCreateur, setPrenomCreateur] = useState('')
const [codeInput, setCodeInput] = useState(['', '', '', ''])
const [focusCreer, setFocusCreer] = useState(false)
const [focusCode, setFocusCode] = useState(null)
```

| Variable | Type | Rôle |
|----------|------|------|
| `prenomCreateur` | string | Valeur tapée dans l'input "Créer" |
| `prenomRejoignant` | string | Valeur tapée dans l'input "Rejoindre" |
| `codeInput` | array [4] | Les 4 cases du code (ex: `['A','5','','']`) |
| `focusCreer` | boolean | Est-ce que l'input prénom "Créer" est focusé ? |
| `focusRejoindre` | boolean | Est-ce que l'input prénom "Rejoindre" est focusé ? |
| `focusCode` | number\|null | Index de la case code focusée (0-3) ou null |

Les `focus*` servent uniquement à changer la couleur de la bordure quand l'input est actif.
```js
border: `1px solid ${focusCreer ? C.inputFocus : C.inputBorder}`
```
→ violet si focusé, gris sinon.

---

## 5. `useRef` — accès direct aux éléments DOM

```js
const inputsRef = useRef([])
```

```js
ref={el => inputsRef.current[i] = el}
```

`useRef` permet de garder une référence vers un élément HTML réel.
Ici on construit un tableau de 4 références, une par case de code.

**Pourquoi ne pas utiliser `useState` pour ça ?**
Parce que changer un `ref` ne déclenche **pas de re-rendu**.
On en a besoin uniquement pour appeler `.focus()`, pas pour afficher quelque chose.

```js
inputsRef.current[i + 1]?.focus()
```
`?.` = optional chaining : si `inputsRef.current[i+1]` n'existe pas (cas de i=3), on ne crash pas.

---

## 6. La logique des 4 cases — `handleCodeInput`

```js
function handleCodeInput(i, val) {
  const v = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1)
  const next = [...codeInput]
  next[i] = v
  setCodeInput(next)
  if (v && i < 3) inputsRef.current[i + 1]?.focus()
}
```

**Ligne par ligne :**

```js
val.toUpperCase()
```
Force les majuscules : "a" devient "A".

```js
.replace(/[^A-Z0-9]/g, '')
```
Regex qui **supprime tout ce qui n'est pas** une lettre A-Z ou un chiffre 0-9.
Si l'utilisateur tape "@" ou un espace, ça disparaît.

```js
.slice(-1)
```
Ne garde que le **dernier caractère**. Utile si React envoie 2 caractères dans `val` (cas rares selon le navigateur).

```js
const next = [...codeInput]
next[i] = v
setCodeInput(next)
```
**Jamais de mutation directe en React.**
On crée une copie du tableau avec `[...]` (spread), on modifie la copie, on passe la copie à `setCodeInput`.
Si on faisait `codeInput[i] = v` directement, React ne détecterait pas le changement et ne re-rendrait pas.

```js
if (v && i < 3) inputsRef.current[i + 1]?.focus()
```
Si une lettre a bien été saisie ET qu'on n'est pas à la dernière case → on avance au suivant.

---

## 7. `handleCodeKeyDown` — navigation avec Backspace

```js
function handleCodeKeyDown(i, e) {
  if (e.key === 'Backspace' && !codeInput[i] && i > 0) {
    inputsRef.current[i - 1]?.focus()
  }
}
```

Scénario : l'utilisateur est sur la case 2 (vide) et appuie sur Backspace.
- `e.key === 'Backspace'` → vrai
- `!codeInput[i]` → la case courante est vide (il n'y a rien à effacer ici)
- `i > 0` → on n'est pas déjà sur la première case

→ On recule d'une case. L'`onChange` s'occupera d'effacer la case précédente.

---

## 8. `handlePaste` — coller un code complet

```js
function handlePaste(e) {
  const text = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
  const next = ['', '', '', '']
  text.split('').forEach((c, i) => { next[i] = c })
  setCodeInput(next)
  inputsRef.current[Math.min(text.length, 3)]?.focus()
  e.preventDefault()
}
```

Si l'utilisateur copie "A558" et colle sur la première case :
- on nettoie le texte collé (majuscules, sans caractères invalides, max 4)
- on répartit chaque caractère dans le tableau
- on place le curseur sur la dernière case remplie
- `e.preventDefault()` → annule le comportement natif du navigateur (qui collerait tout dans la case 0)

Ce handler est attaché **uniquement** à la première case (`onPaste={i === 0 ? handlePaste : undefined}`).

---

## 9. Bouton avec état désactivé visuel

```js
<button
  onClick={() => prenomCreateur.trim() && onCreer(prenomCreateur.trim())}
  style={{
    background: prenomCreateur.trim() ? C.violet : '#4c4580',
    cursor: prenomCreateur.trim() ? 'pointer' : 'default',
  }}
  onMouseEnter={e => { if (prenomCreateur.trim()) e.currentTarget.style.background = C.violetHover }}
  onMouseLeave={e => { if (prenomCreateur.trim()) e.currentTarget.style.background = C.violet }}
>
```

**Pourquoi pas `disabled` ?**
L'attribut HTML `disabled` bloque l'événement mais aussi le style hover. Ici on veut :
- visuellement grisé si vide
- hover violet uniquement si rempli
- le click ne fait rien si vide (`prenomCreateur.trim() && onCreer(...)`)

`prenomCreateur.trim()` retourne une chaîne vide (falsy) ou une chaîne non-vide (truthy).
L'opérateur `&&` court-circuite : si la gauche est falsy, la droite n'est pas évaluée → `onCreer` n'est pas appelé.

---

## 10. `SalleAttente` et `EcranErreur` — composants sans état

```js
function SalleAttente({ code, prenom, onAnnuler }) { ... }
function EcranErreur({ onReessayer, onRetour }) { ... }
```

Ces deux composants n'ont **aucun `useState`**. Ils sont **purement déclaratifs** :
ils reçoivent des données via les props et affichent. C'est tout.

C'est l'idéal : réservez `useState` uniquement là où vous avez besoin d'interactivité locale.

Dans `SalleAttente` :
```js
{code.split('').map((c, i) => (
  <span key={i}>{c}</span>
))}
```
On split la chaîne `'A558'` en tableau `['A','5','5','8']` et on crée un `<span>` par caractère.
Le `key={i}` est obligatoire en React quand on fait un `.map()` pour générer des éléments — il aide React à identifier chaque élément.

---

## Schéma de flux complet

```
Reseau (état: vue, codePartie, prenomHote)
│
├─ vue === 'accueil' → <VueAccueil>
│      ↓ onCreer(prenom)
│      └── handleCreer() : génère le code, setVue('attente')
│
├─ vue === 'attente' → <SalleAttente code prenom>
│      ↓ onAnnuler()
│      └── setVue('accueil')
│
└─ vue === 'erreur'  → <EcranErreur>
       ↓ onReessayer() / onRetour()
       └── setVue('accueil')
```

---

## Ce qui manque (quand le backend sera prêt)

| Endroit | Ce qu'il faudra faire |
|---------|----------------------|
| `handleCreer` | Envoyer une requête `POST /api/rooms` → recevoir le code du serveur au lieu de le générer en local |
| `handleRejoindre` | Envoyer `POST /api/rooms/:code/join` → si 404 → `setVue('erreur')`, si 200 → naviguer vers la partie |
| `SalleAttente` | Ouvrir une connexion WebSocket pour détecter quand le joueur 2 rejoint |
