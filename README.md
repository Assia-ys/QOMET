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

## Lancer en développement

```bash
# Installer les dépendances
npm install
cd frontend/src && npm install && cd ../..
pip install -r requirements.txt

# Lancer (Electron + Vite + backend Python)
npm run electron:dev
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

## Auteurs

Assia YOUNSI · Sara AIT OUAHIOUNE · Maissa SACI  
Licence 3 — parcours DANT · Sorbonne Université · 2025–2026