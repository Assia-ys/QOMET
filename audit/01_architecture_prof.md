# Audit de code — QOMET
## Partie 01 — Architecture générale

---

## 1. Les trois couches du projet

QOMET est structuré en trois couches indépendantes. Chaque couche a un rôle unique et ne déborde pas sur les autres.

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   COUCHE 3 — SYSTÈME          Electron + Node.js                 ║
║   ┌─────────────────────────────────────────────────────────┐    ║
║   │  • Lance et surveille le processus backend Python        │    ║
║   │  • Gère le réseau LAN : UDP broadcast, scan ARP/HTTP    │    ║
║   │  • Expose des fonctions système à React via IPC          │    ║
║   │  • Configure le pare-feu Windows au démarrage           │    ║
║   └──────────────────────────┬──────────────────────────────┘    ║
║                              │  IPC (pont sécurisé interne)      ║
║                              ▼                                    ║
║   COUCHE 1 — PRÉSENTATION    React 19 + Vite                     ║
║   ┌─────────────────────────────────────────────────────────┐    ║
║   │  • Affiche le plateau, les joueurs, les modals          │    ║
║   │  • Gère la navigation entre les pages                   │    ║
║   │  • Stocke l'état du jeu dans un store Zustand           │    ║
║   │  • Ne calcule AUCUNE règle — affiche seulement          │    ║
║   └──────────────────────────┬──────────────────────────────┘    ║
║                              │                                    ║
║              ┌───────────────┴────────────────┐                  ║
║              │  WebSocket (temps réel)         │  HTTP REST       ║
║              │  coups · pause · fin · état     │  créer / vérifier║
║              └───────────────┬────────────────┘  une room        ║
║                              │                                    ║
║   COUCHE 2 — LOGIQUE MÉTIER  Python + FastAPI                    ║
║   ┌─────────────────────────────────────────────────────────┐    ║
║   │  • Valide chaque coup selon les règles du jeu           │    ║
║   │  • Calcule les coups légaux et détecte la victoire      │    ║
║   │  • Gère les rooms (créer, rejoindre, supprimer)         │    ║
║   │  • Calcule les coups de l'IA (Minimax + alpha-bêta)     │    ║
║   │  • Diffuse l'état du jeu aux deux joueurs               │    ║
║   └─────────────────────────────────────────────────────────┘    ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

  Règle fondamentale : le frontend ne décide jamais si un coup est
  légal. Il envoie l'action → le serveur valide → renvoie le résultat.
```

---

## 2. Structure du projet

```
QOMET/
├── electron/
│   ├── main.js        Lance le backend Python, gère le réseau LAN et l'IPC
│   └── preload.js     Expose les fonctions Node.js à React (window.electronAPI)
│
├── frontend/src/
│   ├── pages/         Home · Game · IA · Reseau · Parametres
│   ├── hooks/         useSocket · useGameActions · useGameTimer · useSounds
│   ├── store/         useGameStore.js — état global Zustand (plateau, joueurs…)
│   ├── components/    Board · PlayerInfo · ModalFinPartie · Button · Modal
│   ├── api/           parties.js — appels HTTP REST (créer / vérifier une room)
│   └── router/        index.jsx — navigation + reset socket au retour du jeu
│
├── backend/
│   ├── main.py        Serveur Socket.io + FastAPI + signaling Railway + UDP
│   ├── api/routes.py  Routes REST : POST /parties · GET /parties/{code}
│   ├── game/          Moteur de jeu : board · rules · game · player
│   ├── network/       manager.py — gestion du dictionnaire de rooms
│   └── ai/            minimax.py + evaluator.py — IA alpha-bêta
│
└── tests/             Tests unitaires Python (game · ai · network)
```

---

## 3. Protocoles de communication

| Protocole | Entre | Usage |
|-----------|-------|-------|
| WebSocket (Socket.io) | React ↔ Backend Python | Événements de jeu en temps réel |
| HTTP REST (fetch) | React → Backend Python | Créer / vérifier une room |
| IPC Electron | React → Node.js | Appeler les fonctions système (réseau, plein écran) |
| UDP broadcast (port 7778) | Node.js → réseau local | L'hôte annonce son IP toutes les 500ms |
| HTTPS (fetch) | React → Railway | Déposer / récupérer l'IP de l'hôte (signaling cloud) |

---

## 4. Déroulement d'une partie réseau LAN

```
Joueur A (hôte)          Railway (cloud)      Joueur B (rejoignant)
      │                        │                      │
  ① Crée la partie             │                      │
      │── POST /parties ───────────────────────────►  │
      │◄─ { code: "ABCD" } ────────────────────────── │
      │                        │                      │
  ② Annonce son IP             │                      │
      │── UDP broadcast ─────────────────────────────►│ (si même réseau)
      │── POST /local/register ►│                      │ (backup cloud)
      │                        │                      │
  ③ B entre le code et rejoint │                      │
      │                        │◄── GET /local/find ──│
      │                        │──► { ip, port } ────►│
      │◄──────────── socket.connect(IP_A:7777) ───────►│
      │◄──────────── emit("rejoindre") ───────────────►│
      │                        │                      │
  ④ Partie démarre             │                      │
      │◄──── emit("partie_demarree") ─────────────────►│
      │                        │                      │
      │         [JEU — tout passe par WebSocket]       │
      │◄──── emit("etat") après chaque coup ──────────►│
```

---

## 5. Points forts et limites

### Points forts

| Aspect | Détail |
|--------|--------|
| Séparation stricte des couches | Aucune règle de jeu dans le frontend |
| Moteur de jeu pur | `rules.py`, `board.py` testables sans serveur |
| Double déploiement | Même code → Electron (LAN) et navigateur (Railway) |
| Découverte réseau robuste | Railway → UDP → ARP → scan HTTP en cascade |

### Limites

| Aspect | Détail |
|--------|--------|
| Backend non redémarré si crash | L'app reste ouverte mais inopérante |
| Timers côté client | Les chronomètres tournent dans le navigateur |
| Aucun test réseau automatisé | La couche Electron n'est pas couverte par les tests |

---

## 6. Analyse des composants principaux

### Backend — Python


Le backend est le cerveau de l'application. Il est développé en **Python** avec **FastAPI** pour les routes HTTP et **python-socketio** pour la communication en temps réel.

Il est organisé en trois domaines :
- **Moteur de jeu** (`board.py`, `rules.py`, `game.py`, `player.py`) : contient toutes les règles du jeu. Aucune logique de réseau. Entièrement testable en isolation.
- **Intelligence Artificielle** (`minimax.py`, `evaluator.py`) : algorithme Minimax avec élagage alpha-bêta. Tourne dans un thread séparé pour ne pas bloquer le serveur.
- **Réseau** (`main.py`, `manager.py`, `routes.py`) : gère les connexions des joueurs, les rooms et la communication WebSocket.

**Ce qui est bien fait :** séparation claire des responsabilités, moteur de jeu pur et testable, IA non bloquante via `asyncio.to_thread`, 115 tests unitaires couvrant tous les modules.

---

### Frontend — React

Le frontend est développé en **React 19** avec **Vite** comme outil de build. Son rôle est uniquement d'afficher ce que le serveur envoie — il ne contient aucune règle de jeu.

Il est organisé en :
- **Pages** : `Home`, `Game`, `IA`, `Reseau`, `Parametres`
- **Hooks** : logique réutilisable (`useSocket`, `useGameActions`, `useGameTimer`, `useSounds`)
- **Store Zustand** : état global unique partagé par tous les composants (plateau, joueurs, gagnant…)
- **Composants** : `Board` (plateau SVG), `PlayerInfo`, `ModalFinPartie`

**Ce qui est bien fait :** état centralisé dans un store unique, socket.io en singleton (une seule connexion), aucune règle de jeu côté client.

---

### Electron

Electron est le conteneur natif qui transforme l'application web en application de bureau installable sur Windows, macOS et Linux.

Son rôle principal :
- **Lance** le serveur Python au démarrage via `spawn()`
- **Découvre** l'autre joueur sur le réseau local (UDP broadcast, scan ARP/HTTP)
- **Relie** React aux fonctions de l'OS via le pont IPC (`preload.js` → `window.electronAPI`)
- **Configure** le pare-feu Windows au démarrage

Sans Electron, l'application ne serait qu'un site web sans accès au réseau local ni au système.

---

## 7. Bugs rencontrés et corrections

| Bug | Impact | Correction |
|-----|--------|-----------|
| Règles du jeu dupliquées côté client | Désynchronisation entre les deux joueurs | Suppression de `rulesClient.js` — validation uniquement serveur |
| Port 7777 déjà occupé au redémarrage | Backend ne démarrait pas — page blanche | Kill du processus existant avant chaque lancement |
| IP `127.0.0.1` enregistrée sur Railway (Mac) | Joueur B ne pouvait pas se connecter | Retry DHCP jusqu'à 5s au démarrage |
| Déconnexion socket sur minimisation de fenêtre | Partie interrompue par erreur | `setBackgroundThrottling(false)` dans Electron |
| Listeners périmés entre deux parties | 2e partie ne démarrait pas | Recréation systématique du socket à chaque connexion |
| Modal pause bloqué après déconnexion | Interface figée | Réinitialisation du flag pause lors de la déconnexion |
| Pare-feu Windows bloquait le port en hotspot | Impossible d'être hôte sur Windows | Règle pare-feu avec `profile=any` + droits admin |

---

*Précédent : [00_introduction.md](00_introduction.md) — Suivant : [02_backend.md](02_backend.md)*
