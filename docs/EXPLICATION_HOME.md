# Explication du code — `Home.jsx`

> Objectif : comprendre chaque décision technique prise dans ce fichier pour pouvoir les reproduire seul.

---

## Structure générale du fichier

Le fichier est découpé en **4 blocs indépendants** :

```
Home            → composant racine exporté, gère quel écran afficher
EcranChargement → composant "spinner de démarrage"
MenuPrincipal   → composant "les 4 boutons de navigation"
Bouton          → composant réutilisable pour chaque bouton du menu
styles          → objet de styles inline centralisé
```

La page a **2 états visuels** : chargement pendant 2 secondes, puis menu.

---

## 1. Le composant racine `Home` — bascule entre deux écrans

```js
export default function Home() {
  const [chargement, setChargement] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setChargement(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (chargement) return <EcranChargement />
  return <MenuPrincipal navigate={navigate} />
}
```

### `useState(true)` — l'état qui bascule

`chargement` démarre à `true` (on est en train de charger).
Après 2 secondes, il passe à `false` (on affiche le menu).

```
chargement = true  →  <EcranChargement />
chargement = false →  <MenuPrincipal />
```

C'est le même principe que la **machine à états** de `Reseau.jsx`, mais avec seulement 2 états.

### `useNavigate()` — la navigation React Router

`navigate` est une fonction fournie par React Router.
Elle permet de changer de page **sans recharger le navigateur**.

```js
navigate('/reseau')   // → va sur la page Réseau
navigate('/ia')       // → va sur la page IA
```

On la passe en prop à `MenuPrincipal` pour que les boutons puissent l'utiliser.

---

## 2. `useEffect` — le timer de chargement

```js
useEffect(() => {
  const timer = setTimeout(() => setChargement(false), 2000)
  return () => clearTimeout(timer)
}, [])
```

**Décortiqué :**

```js
useEffect(() => { ... }, [])
```

`useEffect` avec `[]` (tableau vide) = s'exécute **une seule fois**, juste après le premier affichage.
Sans `[]`, il s'exécuterait à chaque re-rendu — le timer repartirait en boucle.

```js
const timer = setTimeout(() => setChargement(false), 2000)
```

`setTimeout` attend 2000 ms (2 secondes) puis exécute la fonction.
Ici : après 2 secondes → `setChargement(false)` → React re-rend → le menu apparaît.

```js
return () => clearTimeout(timer)
```

C'est la fonction de **nettoyage** (cleanup).
Si l'utilisateur quitte la page avant les 2 secondes, React appelle cette fonction
pour annuler le timer. Sans ça, le timer essaierait de mettre à jour un composant
qui n'existe plus → erreur en console.

**Règle à retenir :** tout `setTimeout` dans un `useEffect` doit avoir son `clearTimeout` dans le cleanup.

---

## 3. `EcranChargement` — le spinner

```js
function EcranChargement() {
  return (
    <div style={styles.page}>
      <h1 style={styles.titre}>QOMET</h1>
      <div style={styles.spinner} />
      <p style={styles.texteChargement}>Chargement...</p>
      <p style={styles.sousTexte}>● Initialisation des services...</p>
    </div>
  )
}
```

Composant **sans état** (`useState`) — il reçoit rien, affiche toujours la même chose.
Le spinner est un simple `<div>` rond avec une bordure colorée d'un côté :

```js
spinner: {
  border: '4px solid #334155',      // cercle gris
  borderTop: '4px solid #a78bfa',   // un quart violet
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
}
```

La magie vient du CSS dans `index.css` :
```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

Le `div` tourne en continu sur lui-même grâce à cette animation.
L'inline style référence le nom `'spin'` défini dans le CSS global.

---

## 4. `MenuPrincipal` — les 4 boutons

```js
function MenuPrincipal({ navigate }) {
  return (
    <div style={styles.page}>
      <div style={styles.menuContainer}>
        <h1 style={styles.titre}>QOMET</h1>
        <p style={styles.sousTitre}>Menu Principal</p>
        <div style={styles.boutons}>
          <Bouton icone="📶" label="Jouer en réseau"  couleur="#7c3aed" onClick={() => navigate('/reseau')} />
          <Bouton icone="🤖" label="Jouer contre IA"  couleur="#7c3aed" onClick={() => navigate('/ia')} />
          <Bouton icone="⚙️" label="Paramètres"       couleur="#374151" onClick={() => navigate('/parametres')} />
          <Bouton icone="↩"  label="Quitter"          couleur="#dc2626" onClick={() => window.close()} />
        </div>
      </div>
    </div>
  )
}
```

Chaque bouton reçoit 4 props :
| Prop | Rôle |
|---|---|
| `icone` | Emoji affiché à gauche du texte |
| `label` | Le texte du bouton |
| `couleur` | La couleur de fond (violet, gris, rouge) |
| `onClick` | Ce qui se passe au clic |

**Pourquoi `window.close()` pour Quitter ?**
En mode Electron (desktop), `window.close()` ferme la fenêtre de l'application.
En mode navigateur web classique, ça ferme l'onglet (si celui-ci a été ouvert par script).

---

## 5. `Bouton` — composant réutilisable avec effet hover

```js
function Bouton({ icone, label, couleur, onClick }) {
  const [survol, setSurvol] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      style={{
        ...styles.bouton,
        backgroundColor: survol ? couleur : couleur + 'cc',
        transform: survol ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <span style={styles.icone}>{icone}</span>
      {label}
    </button>
  )
}
```

### L'état `survol` — effet hover en React

En CSS classique, on utilise `:hover`. Ici on utilise des styles inline
(pas de fichier CSS par composant), donc on gère le hover manuellement :

```
onMouseEnter → setSurvol(true)  → bouton plus lumineux + légèrement agrandi
onMouseLeave → setSurvol(false) → bouton revient à son état normal
```

### `couleur + 'cc'`

`'cc'` à la fin d'un code couleur hexadécimal = **opacity à 80%**.
Les 2 derniers chiffres d'un code hex (#RRGGBBAA) représentent l'opacité.
`cc` en hexadécimal = 204 en décimal = 204/255 ≈ 80%.

Résultat :
- Au repos : bouton à 80% d'opacité (légèrement transparent)
- Au survol : bouton à 100% d'opacité (pleine couleur)

### `...styles.bouton`

Le spread `...` copie toutes les propriétés de `styles.bouton` dans le nouvel objet.
On "écrase" ensuite `backgroundColor` et `transform` avec les valeurs dynamiques.

C'est équivalent à :
```js
{ width: '100%', padding: '14px', ...backgroundColor: survol ? ... }
```

---

## 6. L'objet `styles` — styles centralisés

```js
const styles = {
  page: { minHeight: '100vh', display: 'flex', ... },
  titre: { fontSize: '3rem', color: '#a78bfa', ... },
  // ...
}
```

**Pourquoi un objet `styles` plutôt qu'un fichier CSS ?**

- Tout est dans le même fichier : plus facile à lire et modifier
- Les valeurs peuvent être dynamiques (référencer des variables JS)
- Pas de risque de collision de noms de classes CSS

**Inconvénient :** pas de pseudo-classes CSS (`:hover`, `:focus`) → on les gère en JS comme vu avec `survol`.

Pour les projets plus grands, on préfère **Tailwind CSS** ou **CSS Modules**.

---

## Schéma de flux complet

```
Home
│
├─ chargement = true (pendant 2s)
│      → <EcranChargement> (spinner + texte)
│             useEffect → setTimeout 2s → setChargement(false)
│
└─ chargement = false
       → <MenuPrincipal navigate={navigate}>
              ↓ clic "Jouer en réseau"  → navigate('/reseau')
              ↓ clic "Jouer contre IA"  → navigate('/ia')
              ↓ clic "Paramètres"       → navigate('/parametres')
              ↓ clic "Quitter"          → window.close()
```

---

## Ce qui manque (quand le backend sera prêt)

| Endroit | Ce qu'il faudra faire |
|---|---|
| `EcranChargement` | Remplacer le `setTimeout` fixe par une vraie vérification que le serveur FastAPI est démarré (`GET /health`) |
| Bouton "Quitter" | En Electron, utiliser `window.electronAPI.quit()` au lieu de `window.close()` pour une fermeture propre |
| Général | Ajouter un son de démarrage via le système audio (ticket F-08) |
