# Audit de code — QOMET
## Partie 01 — Architecture générale

---

## 1. Vue d'ensemble : les trois grandes couches

QOMET est découpé en **trois couches** qui ont chacune un rôle bien distinct. Elles ne se mélangent pas : chacune fait une seule chose.

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   COUCHE 1 — PRÉSENTATION  (ce que l'utilisateur voit)              ║
║   ┌──────────────────────────────────────────────────────────────┐  ║
║   │  React 19 + Vite                                             │  ║
║   │  Pages : Home · Game · IA · Reseau · Parametres             │  ║
║   │  État  : Zustand store (plateau, joueurs, tours, gagnant…)  │  ║
║   │  Ne contient AUCUNE règle de jeu — affiche seulement        │  ║
║   └─────────────────────────┬────────────────────────────────────┘  ║
║                             │ WebSocket (Socket.io)                 ║
║                             │ HTTP REST                             ║
║   COUCHE 2 — LOGIQUE MÉTIER (calculs, règles, état du jeu)          ║
║   ┌─────────────────────────▼────────────────────────────────────┐  ║
║   │  Python : FastAPI + python-socketio                          │  ║
║   │  Moteur de jeu : board · rules · game · player              │  ║
║   │  IA       : minimax + alpha-bêta + évaluateur               │  ║
║   │  Réseau   : manager rooms · signaling Railway · UDP         │  ║
║   └──────────────────────────────────────────────────────────────┘  ║
║                                                                      ║
║   COUCHE 3 — SYSTÈME  (pont entre l'app et l'OS)                    ║
║   Electron main.js + Node.js                                        ║
║   Spawn du backend Python · Pare-feu Windows · UDP broadcast        ║
║   IPC bridge (React ↔ Node.js) · Scan réseau ARP/HTTP              ║
╚══════════════════════════════════════════════════════════════════════╝
```

**Règle fondamentale :** le frontend ne calcule jamais un coup légal. Il envoie l'action au serveur, qui renvoie le nouvel état. Le frontend ne fait qu'afficher.

---

## 2. Structure des fichiers commentée

```
QOMET/
│
├── electron/                      ← COUCHE SYSTÈME (Node.js)
│   ├── main.js                    Seul fichier qui a accès à l'OS :
│   │                              - lance le processus Python (spawn)
│   │                              - gère UDP broadcast / écoute réseau
│   │                              - scanne le réseau (ARP + HTTP)
│   │                              - configure le pare-feu Windows
│   │                              - expose les fonctions via IPC
│   └── preload.js                 Pont de sécurité : liste exactement
│                                  quelles fonctions Node.js sont
│                                  accessibles depuis React
│                                  → window.electronAPI.*
│
├── frontend/src/                  ← COUCHE PRÉSENTATION (React)
│   │
│   ├── pages/                     Pages de l'application
│   │   ├── Home.jsx               Menu principal : Réseau · IA · Paramètres
│   │   ├── Game.jsx               Plateau de jeu + timers + modals fin/pause
│   │   ├── IA.jsx                 Choix du niveau IA puis lancement
│   │   ├── Parametres.jsx         Volume sons, plein écran, langue
│   │   └── Reseau/
│   │       ├── index.jsx          Cerveau du mode réseau : créer ou rejoindre
│   │       ├── VueAccueil.jsx     Formulaire (prénom + code)
│   │       ├── SalleAttente.jsx   Écran "en attente du 2e joueur"
│   │       └── EcranErreur.jsx    Affichage erreur de connexion
│   │
│   ├── hooks/                     Logique réutilisable (pas de JSX)
│   │   ├── useSocket.js           Singleton socket.io : une seule connexion
│   │   │                          dans toute l'app + fonction de changement
│   │   │                          de serveur (LOCAL → IP hôte)
│   │   ├── useGameActions.js      Toutes les actions de jeu (jouer un coup,
│   │   │                          pause, reprendre, abandonner) → emit socket
│   │   ├── useGameTimer.js        Timer client (chrono de jeu)
│   │   ├── useLangue.jsx          Langue FR / EN (i18next)
│   │   ├── useIsMobile.js         Détecte si l'écran est mobile
│   │   └── useSounds.js           Joue les sons (victoire, défaite, coup)
│   │
│   ├── store/
│   │   └── useGameStore.js        État global Zustand — source de vérité
│   │                              unique pour tous les composants
│   │
│   ├── components/
│   │   ├── game/
│   │   │   ├── Board.jsx          Rendu visuel du plateau (grille + pièces)
│   │   │   ├── PlayerInfo.jsx     Bandeau joueur (prénom, pièces, timer)
│   │   │   └── ModalFinPartie.jsx Popup victoire / défaite / forfait
│   │   ├── layout/
│   │   │   ├── BoutonMenu.jsx     Bouton hamburger menu
│   │   │   └── BoutonRetour.jsx   Flèche retour
│   │   └── ui/
│   │       ├── Button.jsx         Bouton générique stylisé
│   │       └── Modal.jsx          Fenêtre modale générique
│   │
│   ├── api/
│   │   └── parties.js             Deux fonctions HTTP :
│   │                              - creerPartie()    → POST /parties
│   │                              - verifierPartie() → GET /parties/{code}
│   │
│   ├── config/
│   │   └── config.js              3 URLs + flag IS_ELECTRON :
│   │                              LOCAL_URL  = http://127.0.0.1:7777
│   │                              ONLINE_URL = https://qomet.railway.app
│   │                              SERVER_URL = LOCAL si Electron, ONLINE sinon
│   │
│   ├── router/
│   │   └── index.jsx              Définit les 5 routes + reset socket
│   │                              automatique au retour de /jeu
│   └── i18n/
│       └── index.js               Traductions FR / EN
│
├── backend/                       ← COUCHE LOGIQUE MÉTIER (Python)
│   │
│   ├── main.py                    Point d'entrée du serveur :
│   │                              - démarre Socket.io + FastAPI
│   │                              - écoute les événements WS (jouer, pause…)
│   │                              - expose le signaling Railway (/local/*)
│   │                              - lance le thread UDP de découverte
│   │
│   ├── api/
│   │   └── routes.py              2 routes HTTP :
│   │                              POST /parties        → crée une room
│   │                              GET  /parties/{code} → vérifie si elle existe
│   │
│   ├── game/                      Moteur de jeu — aucune dépendance réseau
│   │   ├── board.py               Grille 4×4 : cases, pièces, copie légère
│   │   ├── rules.py               Règles : coups légaux, carré gagnant,
│   │   │                          annulation de coup
│   │   ├── game.py                Déroulement : tours alternés, fin de partie
│   │   └── player.py              Modèle joueur : nom, couleur, réserve pièces
│   │
│   ├── network/
│   │   └── manager.py             Dictionnaire global `rooms` :
│   │                              creer_room · rejoindre_room · quitter_room
│   │                              supprimer_room · room_est_pleine
│   │                              couleur_du_joueur (sid → code + couleur)
│   │
│   └── ai/
│       ├── minimax.py             Minimax + élagage alpha-bêta
│       │                          depth=2 pose / depth=4 déplacement
│       │                          asyncio.to_thread → ne bloque pas les WS
│       └── evaluator.py           Heuristique : évalue une position du plateau
│
├── tests/                         Tests unitaires Python (pytest)
│   ├── game/                      board · rules · game · player
│   ├── ai/                        minimax · evaluator · temps de calcul
│   └── network/                   manager + routes HTTP
│
└── config/
    └── settings.py                HOST=0.0.0.0 / PORT=7777 (variables d'env)
```

---

## 3. Les cinq canaux de communication

QOMET utilise **cinq protocoles distincts** selon le besoin. Chacun a un rôle précis :

```
┌──────────────────┬────────────────────────────┬──────────────────────────┐
│  CANAL           │  DE → VERS                 │  USAGE                   │
├──────────────────┼────────────────────────────┼──────────────────────────┤
│  IPC Electron    │  React → Node.js           │  Appeler les fonctions   │
│  (ipcRenderer)   │  (renderer → main)         │  OS : broadcast, scan,   │
│                  │                            │  plein écran             │
├──────────────────┼────────────────────────────┼──────────────────────────┤
│  HTTP REST       │  React → Backend Python    │  Créer une room,         │
│  (fetch)         │                            │  vérifier qu'elle existe │
├──────────────────┼────────────────────────────┼──────────────────────────┤
│  WebSocket       │  React ↔ Backend Python    │  Tous les événements     │
│  (Socket.io)     │  bidirectionnel            │  de jeu en temps réel    │
├──────────────────┼────────────────────────────┼──────────────────────────┤
│  UDP broadcast   │  Node.js → réseau local    │  L'hôte annonce son IP   │
│  port 7778       │  255.255.255.255           │  toutes les 500ms        │
├──────────────────┼────────────────────────────┼──────────────────────────┤
│  HTTPS           │  React → Railway (cloud)   │  Déposer / récupérer     │
│  (fetch)         │                            │  l'IP de l'hôte          │
└──────────────────┴────────────────────────────┴──────────────────────────┘
```

---

## 4. Événements Socket.io — contrat client/serveur

Voici l'ensemble des messages échangés entre le frontend (React) et le backend (Python) via Socket.io :

### Client → Serveur (emit depuis React)

| Événement | Données envoyées | Déclencheur |
|-----------|-----------------|-------------|
| `rejoindre` | `{ code, prenom }` | Joueur clique "Créer" ou "Rejoindre" |
| `jouer` | `{ type:"poser", row, col }` ou `{ type:"deplacement", coup:[…] }` | Joueur clique une case |
| `deplacements_valides` | `{ row, col }` | Joueur sélectionne une pièce |
| `pause` | _(vide)_ | Joueur clique "Pause" |
| `reprendre` | _(vide)_ | Joueur clique "Reprendre" |
| `abandonner` | _(vide)_ | Joueur clique "Abandonner" |
| `coup_ia` | `{ niveau: "facile"\|"moyen"\|"difficile" }` | C'est le tour de l'IA |
| `quitter` | _(vide)_ | Joueur annule depuis la salle d'attente |

### Serveur → Client (emit depuis Python)

| Événement | Données reçues | Effet côté React |
|-----------|----------------|-----------------|
| `room_rejointe` | `{ code }` | Confirmation d'entrée dans la room |
| `partie_demarree` | `{ plateau, joueurs, joueurActif, code, … }` | Navigation vers `/jeu`, état initial |
| `etat` | `{ plateau, joueurs, joueurActif, … }` | Mise à jour du store (nouveau tour) |
| `coups_valides` | `{ destinations, peut_ejecter }` | Affichage des cases cliquables |
| `carre_gagnant` | `{ cellules, gagnant }` | Animation du carré gagnant |
| `fin_partie` | `{ gagnant }` | Modal de fin de partie |
| `adversaire_deconnecte` | `{ message }` | Modal forfait, l'autre joueur gagne |
| `adversaire_en_pause` | _(vide)_ | Modal "adversaire en pause" |
| `adversaire_a_repris` | _(vide)_ | Fermeture modal pause |
| `erreur` | `{ code, msg? }` | Affichage erreur (coup illégal, room pleine…) |

---

## 5. Cycle de vie d'une room

Une room est l'objet central du backend. Elle naît à la création de la partie et meurt à sa fin.

```
                    POST /parties
                         │
                         ▼
                 ┌───────────────┐
                 │  creer_room() │  → rooms["ABCD"] = {
                 │               │      game: Game(...),
                 │               │      joueurs: { clair:None, fonce:None },
                 └───────┬───────┘      prenoms: { clair:"Alice", fonce:None }
                         │           }
                         │
              emit("rejoindre") — Joueur A
                         │
                         ▼
                 ┌───────────────┐
                 │ rejoindre_room│  → joueurs["clair"] = sid_A
                 │   (sid_A)     │
                 └───────┬───────┘
                         │
              emit("rejoindre") — Joueur B
                         │
                         ▼
                 ┌───────────────┐
                 │ rejoindre_room│  → joueurs["fonce"] = sid_B
                 │   (sid_B)     │  → room_est_pleine() = True
                 └───────┬───────┘  → emit("partie_demarree") aux deux
                         │
                    [JEU EN COURS]
                         │
           ┌─────────────┴──────────────┐
           │                            │
    Fin normale                  Déconnexion brutale
    game.termine = True          disconnect(sid)
           │                            │
           ▼                            ▼
   emit("fin_partie")         emit("adversaire_deconnecte")
           │                            │
           └──────────┬─────────────────┘
                      │
                      ▼
              supprimer_room("ABCD")
              → del rooms["ABCD"]
```

---

## 6. Découverte réseau — algorithme en cascade

Quand B veut rejoindre la partie de A, il ne connaît pas son IP. Trois méthodes sont tentées dans l'ordre :

```
B entre le code "ABCD" et clique "Rejoindre"
              │
              ▼
   ┌─────────────────────┐
   │  1. Railway         │  GET /local/find/ABCD
   │     (signaling)     │  timeout : 4 secondes
   └──────────┬──────────┘
              │
      IP trouvée ?──── OUI ──► connexion directe vers IP_A:7777
              │
             NON
              │
              ▼
   ┌─────────────────────┐
   │  2. UDP broadcast   │  écoute port 7778
   │     (réseau local)  │  timeout : 4 secondes
   └──────────┬──────────┘  (A broadcaste toutes les 500ms)
              │
      IP trouvée ?──── OUI ──► connexion directe vers IP_A:7777
              │
             NON
              │
              ▼
   ┌─────────────────────┐
   │  3. Scan réseau     │  ARP → liste voisins récents
   │     (fallback)      │  puis scan HTTP /health sur le sous-réseau
   └──────────┬──────────┘  (par lots de 30 IPs, timeout 400ms/IP)
              │
      Serveur trouvé ?── OUI ──► vérifie si code ABCD existe → connexion
              │
             NON
              │
              ▼
      Affiche erreur "serveur introuvable"
```

**Pourquoi cette cascade ?**

| Méthode | Fonctionne quand | Échoue quand |
|---------|-----------------|--------------|
| Railway | Toujours (si internet) | Pas de connexion internet |
| UDP broadcast | Même réseau local, hotspot | AP Isolation activée |
| Scan réseau | Même sous-réseau | Réseaux différents |

---

## 7. Le pont IPC Electron en détail

Electron impose une séparation stricte entre le processus principal (Node.js, accès OS) et le renderer (React, affiché dans Chromium). Pour des raisons de sécurité, React ne peut pas appeler directement les APIs Node.js. Le fichier `preload.js` sert de **liste blanche** : il expose exactement ce que React a le droit d'utiliser.

```
┌──────────────────────────────────────────────────────────────────┐
│              MAIN PROCESS (Node.js)  — electron/main.js          │
│                                                                  │
│  ipcMain.handle('demarrer-broadcast', (_, code) => {...})        │
│  ipcMain.handle('trouver-serveur',    (_, code) => {...})        │
│  ipcMain.handle('set-fullscreen',     (_, val)  => {...})        │
│  ipcMain.handle('get-local-ip',       ()        => {...})        │
│  ...                                                             │
└────────────────────────────┬─────────────────────────────────────┘
                             │  IPC (canal interne sécurisé)
┌────────────────────────────▼─────────────────────────────────────┐
│              PRELOAD  — electron/preload.js                      │
│              (s'exécute en sandbox, accès limité)                │
│                                                                  │
│  contextBridge.exposeInMainWorld('electronAPI', {                │
│    demarrerBroadcast(code) → ipcRenderer.invoke('demarrer-...')  │
│    arreterBroadcast()      → ipcRenderer.invoke('arreter-...')   │
│    trouverServeur(code)    → ipcRenderer.invoke('trouver-...')   │
│    getLocalIP()            → ipcRenderer.invoke('get-local-ip')  │
│    setFullScreen(val)      → ipcRenderer.invoke('set-fullscreen')│
│    getFullScreen()         → ipcRenderer.invoke('get-fullscreen')│
│    closeApp()              → ipcRenderer.send('close-app')       │
│    minimize()              → ipcRenderer.send('minimize')        │
│    maximize()              → ipcRenderer.send('maximize')        │
│  })                                                              │
└────────────────────────────┬─────────────────────────────────────┘
                             │  window.electronAPI.*
┌────────────────────────────▼─────────────────────────────────────┐
│              RENDERER PROCESS (React)                            │
│                                                                  │
│  // Exemple dans Reseau/index.jsx :                              │
│  const ip = await window.electronAPI.demarrerBroadcast(code)    │
│                                                                  │
│  // Exemple dans Parametres.jsx :                                │
│  window.electronAPI.setFullScreen(true)                          │
└──────────────────────────────────────────────────────────────────┘
```

**Si `window.electronAPI` est `undefined`** : l'app tourne dans un navigateur (mode Railway). Toutes les fonctionnalités réseau locales sont désactivées automatiquement.

---

## 8. Flux complet d'une partie réseau LAN

Voici exactement ce qui se passe, de A qui crée jusqu'au premier coup joué :

```
JOUEUR A (hôte)              RAILWAY (cloud)        JOUEUR B (rejoignant)
       │                           │                         │
  ① A clique "Créer"               │                         │
       │── POST /parties ──────────────────────────────────► │
       │        (backend LOCAL : 127.0.0.1:7777)             │
       │◄─ { code: "ABCD" } ──────────────────────────────── │
       │                           │                         │
  ② A rejoint sa propre room       │                         │
       │── socket.connect(127.0.0.1:7777)                    │
       │── emit("rejoindre", { code:"ABCD", prenom:"Alice" })│
       │◄─ emit("room_rejointe", { code:"ABCD" })            │
       │                           │                         │
  ③ A démarre la découverte         │                         │
       │── UDP toutes les 500ms ──────────────────────────►  │
       │   { type:"QOMET_HOST",    │    (si même réseau)     │
       │     ip:"172.20.10.3",     │                         │
       │     port:7777,            │                         │
       │     code:"ABCD" }         │                         │
       │                           │                         │
       │── POST /local/register ──►│  (backup cloud)         │
       │   { ip, port, code }      │                         │
       │                           │                         │
  ④ B entre "ABCD" et clique "Rejoindre"                     │
       │                           │◄── GET /local/find/ABCD │
       │                           │──► { ip, port }─────── ►│
       │                           │                         │
  ⑤ B vérifie que la room existe   │                         │
       │◄─────────────── GET /parties/ABCD ─────────────────►│
       │                { pleine:false }                      │
       │                           │                         │
  ⑥ B se connecte au backend de A  │                         │
       │◄────────── socket.connect("http://172.20.10.3:7777")►│
       │◄────────── emit("rejoindre", { code, prenom:"Bob" })►│
       │◄────────── emit("room_rejointe") ──────────────────► │
       │                           │                         │
  ⑦ Room pleine → partie démarre   │                         │
       │◄── emit("partie_demarree", { plateau, joueurs… }) ──►│
       │                           │                         │
  ══════════════════ JEU EN COURS ══════════════════════════════
       │                           │                         │
  ⑧ A joue un coup                 │                         │
       │── emit("jouer", { type:"poser", row:0, col:0 }) ───►│
       │              (serveur valide le coup)                │
       │◄── emit("etat", { plateau, joueurActif… }) ─────────►│
       │                           │                         │
```

---

## 9. Les deux modes de déploiement

Le même code source fonctionne dans deux contextes radicalement différents :

### Mode Electron — Application de bureau (LAN)

```
  Machine A (hôte)                         Machine B (rejoignant)
  ┌───────────────────────────┐            ┌───────────────────────────┐
  │  ELECTRON                 │            │  ELECTRON                 │
  │  ┌─────────────────────┐  │            │  ┌─────────────────────┐  │
  │  │  React / Chromium   │  │            │  │  React / Chromium   │  │
  │  └──────────┬──────────┘  │            │  └──────────┬──────────┘  │
  │        IPC  │             │            │        IPC  │             │
  │  ┌──────────▼──────────┐  │◄─UDP:7778─►│  ┌──────────▼──────────┐  │
  │  │ electron/main.js    │  │            │  │ electron/main.js    │  │
  │  │ (Node.js)           │  │            │  │ (Node.js)           │  │
  │  └──────────┬──────────┘  │            │  └─────────────────────┘  │
  │       spawn │             │            │                           │
  │  ┌──────────▼──────────┐  │◄WebSocket──┼───────────────────────────│
  │  │  Backend Python     │  │  :7777     │  (B se connecte ici)      │
  │  │  port 7777          │  │            │                           │
  │  └─────────────────────┘  │            └───────────────────────────┘
  └───────────────────────────┘
     Backend actif uniquement ici
```

### Mode Web — Application en ligne (Railway)

```
  Navigateur A               Railway (cloud)            Navigateur B
  ┌───────────────┐          ┌──────────────────┐       ┌───────────────┐
  │  React        │ WebSocket│  FastAPI +       │WebSocket│  React       │
  │  (browser)    │◄────────►│  python-socketio │◄──────►│  (browser)   │
  │               │          │  Backend commun  │       │               │
  │  electronAPI  │          │  (un seul pour   │       │  electronAPI  │
  │  = undefined  │          │   les deux)      │       │  = undefined  │
  └───────────────┘          └──────────────────┘       └───────────────┘
```

**Comment l'app choisit automatiquement le bon mode** :

```js
// config/config.js
export const IS_ELECTRON = typeof window.electronAPI !== 'undefined'

export const SERVER_URL = IS_ELECTRON
  ? 'http://127.0.0.1:7777'     // Electron → backend local
  : window.location.origin       // Navigateur → serveur Railway
```

---

## 10. Gestion de l'état global — Zustand store

Tous les composants React lisent et écrivent dans **un seul objet partagé**. Aucun composant ne garde son propre état de jeu.

```
                     ┌──────────────────────────────────────┐
                     │        useGameStore (Zustand)         │
                     │                                      │
                     │  plateau          grille 4×4         │
                     │  joueurs[]        [{ nom, couleur,   │
                     │                     piecesRestantes}]│
                     │  maCouleur        "clair" | "fonce"  │
                     │  joueurActif      0 ou 1             │
                     │  prenomJoueur     mon prénom         │
                     │  codeRoom         "ABCD"             │
                     │  etatPartie       "en_attente"       │
                     │                   "en_cours"         │
                     │                   "terminee"         │
                     │  gagnant          { nom, forfait? }  │
                     │  coupsValides     cases cliquables   │
                     │  peutEjecter      booléen            │
                     │  adversaireEnPause booléen           │
                     │  cellulesGagnantes carré final       │
                     └──────┬───────────────────────┬───────┘
                            │ LIT                   │ ÉCRIT
              ┌─────────────▼──────┐   ┌────────────▼────────────┐
              │  Composants React  │   │  useSocket.js            │
              │                    │   │                          │
              │  Board.jsx         │   │  Reçoit les événements   │
              │  PlayerInfo.jsx    │   │  Socket.io du serveur    │
              │  Game.jsx          │   │  et met le store à jour: │
              │  ModalFinPartie    │   │                          │
              │                    │   │  setEtatServeur(data)    │
              │  → affichent       │   │  setGagnant(...)         │
              │    seulement       │   │  setAdversaireEnPause()  │
              └────────────────────┘   └──────────────────────────┘
```

**Règle clé :** seul `useSocket.js` écrit dans le store (via les événements serveur). Les composants lisent uniquement. Aucun composant ne "calcule" un état de jeu.

---

## 11. Le singleton socket — pourquoi et comment

```
  ✗ Mauvaise approche (non utilisée)      ✓ Bonne approche (utilisée)
  ──────────────────────────────────      ──────────────────────────────
  Game.jsx       → new io(url)            useSocket.js :
  Board.jsx      → new io(url)              let socket = null
  PlayerInfo.jsx → new io(url)
  useGameActions → new io(url)              export function getSocket() {
  ...                                         if (!socket)
                                               socket = io(url, {...})
  = connexions multiples simultanées !        return socket
    événements reçus en double              }
    comportement imprévisible
                                            = 1 seule connexion partagée
```

**Changement de serveur entre deux parties :**

```
  Avant la partie :                       Après la partie :
  socket → 127.0.0.1:7777                 router/index.jsx détecte
  (backend local)                         la sortie de /jeu
          │                                       │
          │ handleRejoindre() appelle :            ▼
          ▼ resetSocketToServer(IP_A:7777)  resetSocketToServer(LOCAL_URL)
  socket → 172.20.10.3:7777              socket → 127.0.0.1:7777
  (backend de l'hôte A)                  (prêt pour une nouvelle partie)
```

---

## 12. Cycle de vie du backend Python

```
  app.whenReady()
        │
        ▼
  fixerParefeuWindows()    ← ajoute les règles pare-feu (Windows uniquement)
        │
        ▼
  demarrerBackend()        ← spawn du binaire qomet-server (PyInstaller)
        │
        ▼
  attendreBackend()        ← poll GET /health toutes les 500ms (max 15s)
        │
        ▼
  creerFenetre()           ← ouvre la fenêtre Electron
        │
        │  [session en cours — jeu disponible]
        │
        ▼
  win.on('closed')
        │
        ▼
  app.on('window-all-closed')
        │
        ├─ macOS  → arreterBackend() · l'app reste dans le dock (comportement natif)
        └─ autres → arreterBackend() · app.quit()
```

---

## 13. Points forts et limites de l'architecture

### Points forts

| Aspect | Explication |
|--------|-------------|
| **Séparation stricte des couches** | Aucune règle de jeu dans le frontend. Aucun appel réseau dans le moteur de jeu. |
| **Moteur de jeu pur** | `rules.py`, `board.py`, `game.py` — testables sans démarrer le serveur |
| **Double déploiement** | Un seul code source → Electron (LAN) et navigateur (Railway) sans duplication |
| **Découverte réseau en cascade** | Railway → UDP → ARP → scan : 4 méthodes de secours successives |
| **État global prévisible** | Un seul store Zustand, mis à jour uniquement par les événements serveur |
| **Aucune logique côté client** | Le frontend est un pur affichage — toute validation passe par Python |

### Limites identifiées

| Aspect | Explication |
|--------|-------------|
| **Backend non redémarré si crash** | Si le processus Python plante, l'app reste ouverte mais inopérante |
| **Socket IA non fermé** | En mode IA, `getSocketIA()` n'est jamais fermé au retour menu |
| **Pas de test réseau** | La couche Electron (IPC, UDP, scan réseau) n'a aucun test automatisé |
| **Timers côté client** | Les chronomètres de jeu tournent dans le navigateur — manipulables |

---

*Précédent : [00_introduction.md](00_introduction.md) — Suivant : [02_backend.md](02_backend.md)*
