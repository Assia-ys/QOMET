# QOMET

QOMET est une application de jeu de stratégie basée sur un plateau composé de 25
emplacements reliés par des lignes, deux joueurs s’affrontent pour former un carré parfait avec leurs étoiles. Elle propose trois modes de jeu :

---

## Modes de jeu

| Mode | Description |
|------|-------------|
| **Réseau LAN** | Deux joueurs sur le même réseau local ou hotspot |
| **En ligne** | Deux joueurs via le serveur cloud (navigateur) |
| **IA** | Affrontez le moteur de jeu (Facile, Moyen ou Difficile) |

---

## Téléchargement

| Plateforme | Fichier |
|-----------|---------|
| Windows | `QOMET-Setup.exe` |
| Linux | `QOMET.AppImage` |
| macOS | `QOMET.dmg` |

---

## Jouer en réseau local

1. L'hôte lance QOMET et clique **Réseau → Créer**
2. Un code à 4 caractères s'affiche
3. Le rejoignant clique **Réseau → Rejoindre** et entre le code
4. La partie démarre automatiquement

> Les deux machines doivent être sur le même réseau WiFi ou hotspot.

---

## Règles du jeu

Le plateau est composé de **25 cases** reliées par des lignes. Chaque joueur dispose de **7 étoiles**.

**Objectif :** former un carré parfait avec 4 de vos étoiles.

**Actions possibles à chaque tour :**
- **Poser** une étoile depuis votre main sur une case vide
- **Glisser** une de vos étoiles vers une case vide adjacente
- **Pousser** une étoile adverse d'une case (si une case libre est disponible derrière)
- **Éjecter** une étoile hors du plateau depuis le carré extérieur (elle retourne en main)

**Règle d'annulation :** vous ne pouvez pas défaire exactement le coup précédent.

---

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Interface | React 19 · Vite 8 · Zustand · Socket.io client |
| Serveur | Python · FastAPI · python-socketio · Uvicorn |
| Application | Electron 36 · Node.js |
| Déploiement | Railway (cloud) · PyInstaller (binaires natifs) |

---

## Commandes essentielles

```bash
npm run electron:dev        # lancer l'application (dev)
python app.py               # backend seul  →  localhost:7777
cd frontend/src && npm run dev  # frontend seul  →  localhost:5173
npm run electron:build      # build Windows (.exe)
./setup.sh                  # installation + build Mac/Linux (script automatique)
```

---

## Tests

```bash
# Tests Python (backend)
pytest tests/

# Tests JavaScript (frontend)
cd frontend/src && npm test
```

---

## Remarques sur l'utilisation de l'IA

Dans le cadre de ce projet, nous avons eu recours à des outils d'intelligence artificielle à des fins de **montée en compétence** et d'**apprentissage**, dans les domaines suivants :

- **Architecture réseau** : nous avons utilisé l'IA pour comprendre les mécanismes sous-jacents de notre couche réseau — diffusion UDP, table ARP, plages RFC 1918, cascade de découverte, signaling via Railway — afin de maîtriser les concepts avant de les coder et de les expliquer.

- **Frontend React** : l'IA nous a accompagnées dans l'écriture du code React (hooks, Zustand, Socket.IO côté client) et nous a permis d'apprendre React en pratiquant, en comprenant les patterns utilisés plutôt qu'en les copiant.

- **Tests unitaires** : nous avons utilisé l'IA pour apprendre à structurer des tests unitaires Python (`pytest`) et JavaScript (`vitest`), comprendre ce qu'il faut tester et comment isoler les cas limites.

L'IA a été un outil de formation et d'assistance technique, pas un substitut à la compréhension : chaque concept généré a été relu, discuté et intégré dans notre apprentissage collectif.

---

## Auteurs

Assia YOUNSI · Sara AIT OUAHIOUNE · Maissa SACI  
Licence 3 — parcours DANT · Sorbonne Université · 2025–2026