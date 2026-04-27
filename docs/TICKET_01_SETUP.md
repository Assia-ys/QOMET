# Ticket 01 — Setup React Router, Store Zustand, Mock Data

> Ce document explique tout ce qui a été mis en place dans ce ticket.
> Aucune connaissance préalable en React n'est supposée.

---

## Contexte

Avant ce ticket, l'application n'avait qu'une seule page statique (`App.jsx`)
avec des données codées en dur. Il n'y avait ni navigation, ni état global partagé.

Ce ticket pose les fondations communes à toute l'équipe :
- Un **routeur** pour naviguer entre les pages
- Un **store** pour partager les données du jeu entre toutes les pages
- Des **données mock** pour développer sans avoir besoin du backend Python

---

## Ce qui a été créé ou modifié

```
src/
├── router/
│   └── index.jsx            ← NOUVEAU  : toutes les routes centralisées
├── store/
│   └── useGameStore.js      ← NOUVEAU  : état global du jeu (Zustand)
├── data/
│   └── mockData.js          ← NOUVEAU  : données réutilisables par tous
├── components/
│   └── PagePlaceholder.jsx  ← NOUVEAU  : composant placeholder partagé
├── pages/
│   ├── Home.jsx             ← NOUVEAU  : shell vide (route /)
│   ├── Game.jsx             ← NOUVEAU  : shell vide (route /jeu)
│   ├── IA.jsx               ← NOUVEAU  : shell vide (route /ia)
│   ├── Reseau.jsx           ← NOUVEAU  : shell vide (route /reseau)
│   └── Parametres.jsx       ← NOUVEAU  : shell vide (route /parametres)
├── App.jsx                  ← MODIFIÉ  : délègue tout au router
├── main.jsx                 ← MODIFIÉ  : ajout du HashRouter
├── index.css                ← MODIFIÉ  : style global propre
└── vite.config.js           ← MODIFIÉ  : serveur forcé sur IPv4
```

---

## Détail de chaque fichier

---

### `src/router/index.jsx` — Les routes

C'est **le seul fichier** où les routes sont définies.
Si une route change ou est ajoutée, on ne touche qu'ici.

```jsx
<Route path="/"           element={<Home />} />
<Route path="/jeu"        element={<Game />} />
<Route path="/ia"         element={<IA />} />
<Route path="/reseau"     element={<Reseau />} />
<Route path="/parametres" element={<Parametres />} />
```

Chaque ligne dit : *"quand l'URL est `/jeu`, affiche le composant `Game`"*.

---

### `src/store/useGameStore.js` — L'état global (Zustand)

**C'est quoi Zustand ?**
En React, chaque composant a ses propres données locales.
Le problème : deux pages éloignées ne peuvent pas facilement se partager des données.
Zustand crée un **store** — une boîte centrale lisible et modifiable depuis n'importe quelle page.

#### Données disponibles dans le store

| Donnée | Type | Description |
|---|---|---|
| `plateau` | tableau 7×7 | La grille de jeu. `null` = vide, `"clair"` ou `"fonce"` = étoile posée |
| `joueurs` | tableau de 2 objets | Les deux joueurs : nom, couleur, étoiles en main, étoiles sur le plateau |
| `indexJoueurActif` | `0` ou `1` | Indice du joueur dont c'est le tour |
| `etatPartie` | texte | `"en_attente"`, `"en_cours"` ou `"terminee"` |
| `gagnant` | objet ou `null` | Le joueur gagnant, `null` si la partie n'est pas terminée |
| `selectionne` | `[row, col]` | La case actuellement sélectionnée sur le plateau |
| `coupsValides` | tableau de cases | Les cases jouables après une sélection |
| `dernierCoup` | `[row, col]` | La dernière case jouée |

#### Actions disponibles (fonctions pour modifier le store)

| Fonction | Ce qu'elle fait |
|---|---|
| `joueurActif()` | Retourne le joueur dont c'est le tour |
| `selectionnerCase(row, col)` | Enregistre la case cliquée |
| `setCoupsValides(coups)` | Met à jour la liste des coups possibles |
| `setPlateau(plateau)` | Remplace le plateau entier |
| `setEtatPartie(etat)` | Change l'état de la partie |
| `setGagnant(joueur)` | Désigne le gagnant et passe l'état à `"terminee"` |
| `changerTour()` | Passe au joueur suivant, réinitialise sélection et coups valides |
| `reinitialiser()` | Remet tout à zéro pour une nouvelle partie |

#### Comment l'utiliser dans une page

```jsx
import useGameStore from '../store/useGameStore'

export default function MaPage() {
  const { joueurs, indexJoueurActif, changerTour } = useGameStore()

  return (
    <div>
      <p>C'est au tour de : {joueurs[indexJoueurActif].nom}</p>
      <button onClick={changerTour}>Passer le tour</button>
    </div>
  )
}
```

Tu n'importes que ce dont tu as besoin.
Le store se met à jour automatiquement dans toutes les pages qui l'utilisent.

---

### `src/data/mockData.js` — Les données mock

Ce fichier contient des données de test prêtes à l'emploi.
Elles permettent de développer et tester visuellement sans toucher au backend Python.

#### Ce qu'il exporte

| Export | Description |
|---|---|
| `CASES_JOUABLES` | Les 25 cases valides du plateau QOMET (coordonnées `[row, col]`) |
| `GRILLE_VIDE` | Un plateau 7×7 entièrement vide (toutes les cases à `null`) |
| `GRILLE_TEST` | Un plateau avec quelques étoiles déjà placées (pour tests visuels) |
| `JOUEUR_1_MOCK` | `{ nom: "Alice", couleur: "clair", en_main: 5, sur_plateau: 2 }` |
| `JOUEUR_2_MOCK` | `{ nom: "Bob", couleur: "fonce", en_main: 6, sur_plateau: 1 }` |

#### Comment l'utiliser

```jsx
import { GRILLE_TEST, JOUEUR_1_MOCK } from '../data/mockData'
```

---

### `src/pages/` — Les pages (shells vides)

Cinq fichiers créés, un par route. Chacun est **volontairement minimal** :
les pages seront implémentées par chaque membre de l'équipe dans les tickets suivants.

```jsx
// Exemple : src/pages/Game.jsx
import PagePlaceholder from '../components/PagePlaceholder'

export default function Game() {
  return <PagePlaceholder nom="Jeu" route="/jeu" />
}
```

Le composant `PagePlaceholder` affiche le nom de la page et sa route
avec un badge "En cours de développement" — juste pour confirmer que le routeur fonctionne.

**Règle** : chaque collègue n'implémente que la page qui lui est assignée.
On ne touche pas aux autres fichiers.

---

### `src/App.jsx` — Point d'entrée simplifié

`App.jsx` ne fait plus qu'une chose : appeler le router.

```jsx
import AppRouter from './router'

export default function App() {
  return <AppRouter />
}
```

---

### `src/main.jsx` — Racine de l'application

C'est le tout premier fichier exécuté. Il enveloppe l'app dans `HashRouter`.

```jsx
<HashRouter>
  <App />
</HashRouter>
```

**Pourquoi `HashRouter` et pas `BrowserRouter` ?**
Le projet tourne sous Electron (protocole `file://`).
`BrowserRouter` a besoin d'un vrai serveur web — il ne fonctionne pas avec `file://`.
`HashRouter` ajoute un `#` dans l'URL (`/#/jeu`) et fonctionne dans tous les contextes.

---

## Librairies utilisées

| Librairie | Version | Rôle |
|---|---|---|
| `react-router-dom` | `^7.13.2` | Navigation entre les pages |
| `zustand` | `^5.0.12` | Gestion de l'état global |

Les deux étaient déjà dans `package.json`. Un `npm install` suffit.

---

## Pour lancer le projet

Voir le fichier **[INSTALLATION.md](./INSTALLATION.md)** pour le guide complet.

Résumé rapide :

```bash
cd src
npm install   # une seule fois
npm run dev   # à chaque session de travail
```

Puis ouvrir `http://127.0.0.1:5173/` dans le navigateur.
