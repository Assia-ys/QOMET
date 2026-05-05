---
name: Projet QOMET - contexte et transition
description: Historique du travail sur board.py et transition vers le vrai projet GitHub
type: project
originSessionId: 07698644-7780-4f46-a4b1-cef59eccb8ee
---
Le projet principal est sur GitHub : https://github.com/Assia-ys/QOMET (branche assia/main), cloné dans C:\Users\saci\Desktop\QOMET-github\

**Why:** Le dossier C:\Users\saci\Desktop\Qomet\ était un prototype pygame. Le vrai projet est une app React + Vite + Python (Flask backend), avec Docker.

**How to apply:** Travailler dans QOMET-github, pas dans le dossier Qomet original.

## Plateau de jeu (board logic) — à intégrer dans QOMET-github

Forme du plateau : 7×7 avec cases valides en étoile/diamant :
- Ligne 1 (row 0) : cols 0, 3, 6
- Ligne 2 (row 1) : cols 1, 3, 5
- Ligne 3 (row 2) : cols 2, 3, 4
- Ligne 4 (row 3) : cols 0,1,2,3,4,5,6 (toutes — ligne centrale)
- Ligne 5 (row 4) : cols 2, 3, 4
- Ligne 6 (row 5) : cols 1, 3, 5
- Ligne 7 (row 6) : cols 0, 3, 6

Connexions (EDGES) : carrés concentriques + 2 diagonales complètes (↘ r==c, ↙ r+c==6)

La logique complète (VALID, EDGES, NEIGHBORS, Board class) est dans C:\Users\saci\Desktop\Qomet\board.py et C:\Users\saci\Desktop\Qomet\backend\board_logic.py

## Structure QOMET-github
README.md, app/, config/, docker-compose.yml, electron/, src/, vite.config.js, tailwind.config.js, requirements.txt, test_game.py
