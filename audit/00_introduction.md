# Audit de code — QOMET
## Partie 00 — Introduction & Présentation du projet

---

| | |
|---|---|
| **Projet** | QOMET |
| **Version auditée** | 1.0.0 — branche `maissa/main` |
| **Date de l'audit** | Juin 2026 |
| **Périmètre** | Backend Python · Frontend React · Couche Electron |

---

## 1. Présentation du projet

### 1.1 Description

QOMET est une application de jeu de plateau s

Le jeu se décline en trois modes :

| Mode | Description |
|------|-------------|
| **Local (même machine)** | Deux joueurs sur le même ordinateur en alternance |
| **Réseau LAN** | Deux joueurs sur deux machines connectées au même réseau local ou hotspot |
| **IA** | Un joueur contre un adversaire artificiel (niveaux Facile / Moyen / Difficile) |

### 1.2 Contexte de développement

QOMET est un projet étudiant développé dans le cadre d'un module de développement logiciel. L'application est distribuée sous forme d'installateurs natifs pour les trois systèmes d'exploitation principaux :

- **Windows** — installateur NSIS (`.exe`)
- **Linux** — image AppImage (`.AppImage`)
- **macOS** — image disque (`.dmg`)

---

## 2. Stack technologique

### 2.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION QOMET                        │
├──────────────────┬──────────────────┬───────────────────────┤
│   PRÉSENTATION   │    LOGIQUE       │   TRANSPORT           │
│   React 19       │   Python 3       │   Socket.io           │
│   Vite 8         │   FastAPI        │   WebSocket           │
│   Tailwind CSS 4 │   python-socketio│   UDP Broadcast       │
│   Zustand        │   Uvicorn        │   HTTP REST           │
├──────────────────┴──────────────────┴───────────────────────┤
│                  CONTENEUR ELECTRON 36                       │
│     Node.js · Chromium · IPC Bridge · Backend Spawn         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Détail des technologies

#### Backend (Python)

| Technologie | Version | Rôle |
|-------------|---------|------|
| Python | 3.x | Langage principal du serveur |
| FastAPI | 0.115.0 | Framework HTTP REST (routes `/parties`, `/health`, `/local`) |
| python-socketio | 5.11.3 | Serveur WebSocket temps réel (événements de jeu) |
| Uvicorn | 0.30.6 | Serveur ASGI (interface FastAPI ↔ OS) |
| asyncio | stdlib | Gestion des coroutines et concurrence |
| threading | stdlib | Thread démon UDP pour la découverte LAN |

#### Frontend (JavaScript/React)

| Technologie | Version | Rôle |
|-------------|---------|------|
| React | 19.2.4 | Interface utilisateur |
| Vite | 8.0.1 | Bundler et serveur de développement |
| Zustand | 5.0.13 | Gestion de l'état global (store de jeu) |
| socket.io-client | 4.8.3 | Client WebSocket |
| Tailwind CSS | 4.2.2 | Styles utilitaires |
| React Router DOM | 7.15.0 | Navigation entre les pages |

#### Couche applicative (Electron)

| Technologie | Version | Rôle |
|-------------|---------|------|
| Electron | 36.9.5 | Conteneur natif multiplateforme |
| electron-builder | 26.8.1 | Packaging AppImage / NSIS / DMG |
| Node.js | stdlib | APIs réseau (dgram UDP, net, http, os) |

---

## 3. Périmètre de l'audit

### Inclus

- `backend/` — logique serveur, moteur de jeu, IA, gestion des rooms, API REST
- `frontend/src/` — composants React, hooks, store Zustand, pages
- `electron/main.js` et `electron/preload.js` — couche système, IPC, réseau
- `tests/` et `frontend/src/tests/` — suite de tests existante

### Hors périmètre

- Infrastructure Railway (serveur cloud tiers, non modifiable)
- Dépendances tierces (`node_modules`, librairies Python)
- Assets graphiques et sons
- Scripts de packaging et installateurs NSIS

---

## 4. Résumé exécutif

QOMET est une application bien structurée avec une séparation claire des responsabilités entre le serveur de jeu (Python), l'interface (React) et le conteneur système (Electron). Le moteur de jeu est pur, lisible et bien couvert par les tests unitaires.

Les principaux points de vigilance identifiés concernent la **gestion des déconnexions** (rooms non nettoyées, absence de délai de grâce), la **découverte réseau sur Windows** (pare-feu silencieux), et quelques **fuites de ressources** côté frontend (socket IA non fermé). Aucun bug bloquant n'affecte le déroulement nominal d'une partie.

La couverture de tests du moteur de jeu est bonne. En revanche, les couches réseau (Socket.io, Electron IPC) ne sont pas testées automatiquement.

---

*Suite : [01_architecture.md](01_architecture.md)*
