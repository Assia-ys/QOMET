# Audit de code — QOMET
## Partie 01 — Architecture générale

---

## 1. Les trois couches du projet

```
╔══════════════════════════════════════════════════════════╗
║  COUCHE 1 — PRÉSENTATION                                 ║
║  React 19 · Vite · Zustand · Socket.io client           ║
║  Pages : Home · Game · IA · Reseau · Parametres         ║
║  → N'affiche que ce que le serveur envoie               ║
╠══════════════════════════════════════════════════════════╣
║              ↕ WebSocket (Socket.io) + HTTP REST         ║
╠══════════════════════════════════════════════════════════╣
║  COUCHE 2 — LOGIQUE MÉTIER                               ║
║  Python · FastAPI · python-socketio                      ║
║  Moteur de jeu · IA Minimax · Gestion des rooms         ║
║  → Toutes les règles, tous les calculs sont ici         ║
╠══════════════════════════════════════════════════════════╣
║  COUCHE 3 — SYSTÈME                                      ║
║  Electron · Node.js                                      ║
║  Lance le backend · IPC bridge · Scan réseau · UDP      ║
╚══════════════════════════════════════════════════════════╝
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

*Précédent : [00_introduction.md](00_introduction.md) — Suivant : [02_backend.md](02_backend.md)*
