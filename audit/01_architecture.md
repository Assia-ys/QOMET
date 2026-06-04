# Audit de code — QOMET
## Partie 01 — Architecture générale

---

## 1. Vue d'ensemble des couches

QOMET est organisé en **trois couches distinctes** qui communiquent selon des protocoles bien définis :

```
╔══════════════════════════════════════════════════════════════════╗
║                    ELECTRON (conteneur natif)                    ║
║                                                                  ║
║  ┌───────────────────────────────────────────────────────────┐   ║
║  │               FRONTEND  —  React + Vite                  │   ║
║  │                                                           │   ║
║  │   Home   Game   IA   Reseau   Parametres                 │   ║
║  │   └── Zustand store (état global du jeu)                 │   ║
║  │   └── useSocket (singleton Socket.io client)             │   ║
║  └──────────────────────┬────────────────────────────────────┘   ║
║                         │  WebSocket / HTTP                      ║
║  ┌──────────────────────▼────────────────────────────────────┐   ║
║  │               BACKEND  —  Python FastAPI                 │   ║
║  │                                                           │   ║
║  │   Socket.io server   │   REST API   │   Moteur de jeu   │   ║
║  │   (événements temps  │   /parties   │   rules, board,   │   ║
║  │    réel : jouer,     │   /health    │   game, player    │   ║
║  │    pause, fin…)      │   /local     │                   │   ║
║  └───────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║  electron/main.js : spawn backend · UDP broadcast · IPC · scan  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 2. Structure des fichiers

```
QOMET/
│
├── electron/
│   ├── main.js          Point d'entrée Electron : spawn backend, IPC handlers,
│   │                    UDP broadcast, scan réseau ARP/HTTP, pare-feu Windows
│   └── preload.js       Bridge sécurisé contextBridge → window.electronAPI
│
├── frontend/src/
│   ├── pages/
│   │   ├── Home.jsx         Page d'accueil (choix du mode)
│   │   ├── Game.jsx         Page de jeu (plateau, timers, modal fin)
│   │   ├── IA.jsx           Sélection niveau IA + lancement partie IA
│   │   ├── Parametres.jsx   Langue, sons, thème
│   │   └── Reseau/
│   │       ├── index.jsx        Orchestrateur (créer / rejoindre)
│   │       ├── VueAccueil.jsx   Formulaire prénom + code
│   │       ├── SalleAttente.jsx En attente du 2e joueur
│   │       └── EcranErreur.jsx  Erreur de connexion
│   │
│   ├── hooks/
│   │   ├── useSocket.js        Singleton socket · resetSocketToServer · getSocketIA
│   │   ├── useGameActions.js   Emit socket (jouer, pause, reprendre, abandonner)
│   │   ├── useGameTimer.js     Timer de jeu côté client
│   │   ├── useLangue.jsx       Hook internationalisation (FR/EN)
│   │   ├── useIsMobile.js      Détection écran mobile
│   │   └── useSounds.js        Lecture sons (victoire, défaite, coup)
│   │
│   ├── store/
│   │   └── useGameStore.js     État global Zustand : plateau, joueurs,
│   │                           couleur, gagnant, pause, coups valides…
│   │
│   ├── components/
│   │   ├── game/
│   │   │   ├── Board.jsx           Rendu SVG du plateau + pièces
│   │   │   ├── PlayerInfo.jsx      Affichage infos joueur (nom, score, timer)
│   │   │   └── ModalFinPartie.jsx  Modal victoire / défaite / forfait
│   │   ├── layout/
│   │   │   ├── BoutonMenu.jsx
│   │   │   └── BoutonRetour.jsx
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   └── Modal.jsx
│   │   └── ErrorBoundary.jsx
│   │
│   ├── api/
│   │   └── parties.js      creerPartie() · verifierPartie() — appels HTTP REST
│   │
│   ├── config/
│   │   └── config.js       LOCAL_URL · ONLINE_URL · SERVER_URL · IS_ELECTRON
│   │
│   ├── router/
│   │   └── index.jsx       Routes React Router + reset socket au retour de /jeu
│   │
│   ├── i18n/
│   │   └── index.js        Traductions FR / EN
│   │
│   └── styles/             Fichiers de styles JS par composant (Tailwind variants)
│
├── backend/
│   ├── main.py             Serveur principal : Socket.io events, signaling Railway,
│   │                       endpoint UDP, route /health
│   ├── api/
│   │   └── routes.py       Routes REST : POST /parties · GET /parties/{code}
│   ├── game/
│   │   ├── board.py        Plateau 4×4 : état, placement, copie légère
│   │   ├── rules.py        Règles : coups valides, annulation, détection carré gagnant
│   │   ├── game.py         Orchestrateur : tour de jeu, fin de partie, copie pour IA
│   │   └── player.py       Modèle joueur (nom, couleur, pièces restantes)
│   ├── network/
│   │   └── manager.py      CRUD rooms : creer · rejoindre · quitter · supprimer
│   └── ai/
│       ├── minimax.py      Algorithme Minimax avec élagage alpha-bêta
│       └── evaluator.py    Fonction d'évaluation heuristique du plateau
│
├── tests/                  Tests unitaires Python (pytest)
│   ├── game/               test_board · test_rules · test_game · test_player
│   ├── ai/                 test_minimax · test_evaluator · test_ia_temps
│   └── network/            test_manager_routes
│
├── config/
│   └── settings.py         HOST / PORT depuis variables d'environnement
│
├── app.py                  Point d'entrée uvicorn (développement)
└── package.json            Dépendances Node + scripts de build Electron
```

---

## 3. Modes de déploiement

QOMET peut fonctionner dans deux contextes distincts qui partagent le même code source :

### Mode Electron (application de bureau)

```
Machine A                              Machine B
┌────────────────────────────┐         ┌────────────────────────────┐
│  Electron                  │         │  Electron                  │
│  ┌──────────────────────┐  │         │  ┌──────────────────────┐  │
│  │  React (renderer)    │  │         │  │  React (renderer)    │  │
│  └──────────┬───────────┘  │         │  └──────────┬───────────┘  │
│  IPC bridge │              │         │  IPC bridge │              │
│  ┌──────────▼───────────┐  │         │             │              │
│  │  electron/main.js    │  │  UDP    │             │              │
│  │  (Node.js)           │◄─┼─────────┼─────────────┘             │
│  └──────────┬───────────┘  │         │                            │
│      spawn  │              │         │  Socket.io client          │
│  ┌──────────▼───────────┐  │ Socket.io│  (ws://IP_A:7777)        │
│  │  backend Python      │◄─┼──────────┼───────────────────────── │
│  │  (port 7777)         │  │         │                            │
│  └──────────────────────┘  │         └────────────────────────────┘
└────────────────────────────┘
   A = hôte (backend tourne ici)        B = rejoignant
```

- Le backend Python tourne **uniquement sur la machine hôte** (A)
- B se connecte directement à l'IP locale de A via Socket.io
- La découverte de l'IP de A se fait par UDP broadcast ou Railway signaling

### Mode Web (Railway)

```
Navigateur A                  Railway (cloud)              Navigateur B
┌──────────────┐              ┌──────────────────┐         ┌──────────────┐
│ React app    │◄────────────►│ FastAPI + Socket │◄───────►│ React app    │
│ (browser)    │  WebSocket   │ (backend commun) │ WebSocket│ (browser)   │
└──────────────┘              └──────────────────┘         └──────────────┘
```

- Les deux joueurs se connectent au **même backend centralisé** (Railway)
- Pas de découverte réseau locale nécessaire
- Le frontend détecte automatiquement le mode via `IS_ELECTRON` et `SERVER_URL`

---

## 4. Flux de données — Protocoles utilisés

```
┌─────────────────────────────────────────────────────────┐
│  PROTOCOLE      USAGE                        PORT        │
├─────────────────────────────────────────────────────────┤
│  UDP broadcast  Découverte IP hôte (LAN)     7778       │
│  HTTP REST      Créer/vérifier une room      7777       │
│  WebSocket      Événements de jeu temps réel 7777       │
│  HTTPS          Signaling Railway (cloud)    443        │
│  IPC Electron   React ↔ Node.js (interne)   —          │
└─────────────────────────────────────────────────────────┘
```

### Séquence complète d'une partie réseau LAN

```
A (hôte)                    Railway               B (rejoignant)
   │                           │                        │
   │── POST /parties ──────────►│                        │
   │◄─ { code: "ABCD" } ───────│                        │
   │                           │                        │
   │── socket.connect(local) ──►│ (backend local A)      │
   │── emit("rejoindre") ──────►│                        │
   │                           │                        │
   │── UDP broadcast ─────────────────────────────────► │
   │   { ip: "172.x.x.x",      │                        │
   │     port: 7777,            │                        │
   │     code: "ABCD" }        │                        │
   │                           │                        │
   │── POST /local/register ──►│                        │
   │   { ip, port, code }      │                        │
   │                           │                        │
   │                           │◄── GET /local/find/ABCD│
   │                           │─── { ip, port } ──────►│
   │                           │                        │
   │                           │     GET /parties/ABCD  │
   │◄──────────────────────────────────────────────────►│
   │                           │                        │
   │◄── socket.connect(IP_A:7777) ─────────────────────►│
   │◄── emit("rejoindre") ─────────────────────────────►│
   │                           │                        │
   │◄──────── emit("partie_demarree") ─────────────────►│
   │                           │                        │
   │         [JEU EN COURS — WebSocket uniquement]      │
   │◄──────── emit("etat") ────────────────────────────►│
```

---

## 5. Gestion de l'état global

L'état du jeu est centralisé dans un **store Zustand** (`useGameStore.js`) partagé par toutes les pages et tous les composants.

```
useGameStore
├── plateau          Grille 4×4 (état des cases)
├── joueurs[]        [{ nom, couleur, piecesRestantes }]
├── maCouleur        "clair" | "fonce"
├── joueurActif      index du joueur dont c'est le tour
├── prenomJoueur     prénom local (pour affichage)
├── codeRoom         code de la partie en cours
├── etatServeur      dernier snapshot reçu du serveur
├── etatPartie       "en_attente" | "en_cours" | "terminee"
├── gagnant          { nom, forfait? } | null
├── coupsValides     cases cliquables pour la pièce sélectionnée
├── peutEjecter      flag éjection disponible
├── adversaireEnPause  booléen modal pause adverse
└── cellulesGagnantes  cases du carré gagnant (pour animation)
```

Les **mises à jour** viennent exclusivement des événements Socket.io reçus dans `useSocket.js`. Aucune logique de règles n'est dupliquée côté frontend : le plateau affiché est toujours le reflet exact de l'état serveur.

---

## 6. Singleton socket

Le socket client est un **singleton de module** partagé par toute l'application :

```
useSocket.js
│
├── let socket = null          ← instance unique dans toute l'app
│
├── getSocket()                → retourne socket (crée si null)
├── getSocketIA()              → socket séparé pour mode IA
└── resetSocketToServer(url)   → déconnecte l'ancien, crée un nouveau
                                 vers l'URL fournie (IP de l'hôte)
```

**Pourquoi un singleton :** Socket.io maintient une connexion WebSocket persistante. Créer une nouvelle instance à chaque composant provoquerait des dizaines de connexions parallèles. Le singleton garantit qu'une seule connexion est active à tout moment.

**Changement de serveur :** Quand B rejoint la partie de A, `resetSocketToServer("http://IP_A:7777")` coupe la connexion vers le backend local et en crée une nouvelle vers le backend de A. Au retour du jeu, `router/index.jsx` remet automatiquement le socket vers `LOCAL_URL`.

---

## 7. Points forts de l'architecture

| Aspect | Observation |
|--------|-------------|
| **Séparation des couches** | Backend, frontend et couche Electron sont indépendants et interchangeables |
| **Moteur de jeu pur** | `rules.py`, `board.py`, `game.py` ne dépendent d'aucun framework — testables en isolation |
| **Double mode de déploiement** | Le même code source fonctionne en application de bureau (Electron) et en application web (Railway) |
| **Découverte réseau en cascade** | Railway → UDP → ARP → scan HTTP : robuste face aux différentes configurations réseau |
| **État centralisé** | Zustand évite la prop drilling et rend l'état prévisible et debuggable |
| **Aucune logique de jeu côté client** | Le frontend est un pur affichage — toute validation passe par le serveur |

---

*Précédent : [00_introduction.md](00_introduction.md) — Suivant : [02_backend.md](02_backend.md)*
