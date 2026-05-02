# Tickets QOMET — Groupe Triova

Ordre d'exécution : **Phase 1 → Phase 2 → Phase 3**
Chaque membre prend des tickets dans chaque phase pour avoir une vision complète du projet.

---

## PHASE 1 — Frontend complet (données mockées)

> Objectif : avoir une interface complète et navigable avant de brancher le vrai backend.
> Les données sont simulées (hardcodées) — pas besoin du serveur pour cette phase.

---

### F-01 — Setup frontend (base)
**Priorité : HAUTE — à faire en premier**
- Configurer React Router avec toutes les routes (`/`, `/ia`, `/reseau`, `/jeu`, `/parametres`)
- Créer le store Zustand `useGameStore` avec l'état global :
  - plateau, joueur actif, étoiles en main/sur plateau, partie terminée, gagnant
- Définir les données mockées réutilisables par tous les tickets frontend

**Dépendances :** aucune

---

### F-02 — Page Home (menu principal)
- Écran de chargement avec indicateur de progression
- Menu principal avec 4 boutons : Jouer en réseau, Jouer contre IA, Paramètres, Quitter
- Navigation vers les bonnes pages via React Router

**Dépendances :** F-01

---

### F-03 — Page AIMode (jouer contre IA)
- Sélection du niveau de difficulté : Facile / Moyen / Difficile
- Saisie du prénom du joueur
- Bouton "Commencer la partie contre IA"
- Navigation vers la page de jeu

**Dépendances :** F-01

---

### F-04 — Page Lobby (mode réseau)
- Deux options : "Créer une partie" / "Rejoindre une partie"
- Créer : affiche un code à 4 caractères + écran d'attente de l'adversaire
- Rejoindre : saisie du code + prénom + bouton rejoindre
- Écran d'erreur si code invalide (ERR_ROOM_NOT_FOUND)

**Dépendances :** F-01

---

### F-05 — Page Game (plateau de jeu)
- Intégrer `Board.jsx` et `PlayerInfo.jsx` avec les données du store Zustand
- Bandeau "Ton tour" / "Tour de l'adversaire"
- Boutons Retour, Pause, Abandonner en bas de l'écran
- Affichage du plateau en mode "pose" (clic sur case libre = poser une étoile)

**Dépendances :** F-01, F-06

---

### F-06 — Board interactif
- Sélection d'une étoile au clic → surbrillance en bleu
- Affichage des coups valides en vert
- Clic sur coup valide → envoi de l'action au store
- Distinction visuelle : phase de pose vs phase de déplacement

**Dépendances :** F-01

---

### F-07 — Écrans de fin et modales
- Écran Victoire : trophée, 3 étoiles dorées, durée de partie, boutons Rejouer / Menu
- Écran Défaite : durée, boutons Rejouer / Menu
- Modale Pause : boutons Reprendre / Menu principal
- Modale Abandon : confirmation avec avertissement "compté comme défaite"
- Écran Adversaire déconnecté : victoire par forfait

**Dépendances :** F-01

---

### F-08 — Page Paramètres
- Slider volume musique (0–100%)
- Slider volume effets sonores (0–100%)
- Champ port réseau (défaut : 7777)
- Toggle plein écran
- Sélecteur de langue (Français / Anglais)
- Boutons Sauvegarder / Annuler (sauvegarde en JSON local)

**Dépendances :** F-01

---

### F-09 — Animations et transitions
- Transition entre les pages (fade in/out)
- Animation de pose d'une étoile sur le plateau
- Animation d'éjection (étoile qui disparaît)
- Animation carré gagnant (mise en surbrillance des 4 coins)

**Dépendances :** F-05, F-06, F-07

---

## PHASE 2 — Backend Network

> Objectif : serveur FastAPI + Socket.io opérationnel, puis brancher le frontend dessus.

---

### N-01 — Setup backend (requirements + main.py)
- Remplir `requirements.txt` : fastapi, uvicorn, python-socketio, python-multipart
- Configurer `config/settings.py` : HOST, PORT (7777)
- Écrire `backend/main.py` : initialiser FastAPI + Socket.io, monter les routes, démarrer uvicorn

**Dépendances :** aucune

---

### N-02 — Système de rooms (manager.py)
- Générer un code unique à 4 caractères alphanumérique
- Créer une room : instancier `Game()`, stocker dans un dict
- Associer les deux joueurs à la room (hôte = clair, invité = foncé)
- Démarrer la partie automatiquement quand les deux joueurs sont connectés
- Supprimer la room quand la partie est terminée

**Dépendances :** N-01

---

### N-03 — Gestion WebSocket (événements)
Implémenter les événements Socket.io :
- `rejoindre` → associer un joueur à une room
- `jouer` → valider et appliquer le coup, broadcaster le nouvel état
- `etat` → envoyer l'état complet aux deux clients
- `adversaire_deconnecte` → notifier l'autre joueur
- `erreur` → code room invalide, coup illégal, pas ton tour

**Dépendances :** N-02

---

### N-04 — Routes HTTP (api/routes.py)
- `POST /parties` → créer une partie, retourner le code
- `GET /parties/{code}` → vérifier si la room existe
- `GET /parties/{code}/etat` → retourner l'état actuel du jeu

**Dépendances :** N-02

---

### N-05 — Branchement frontend ↔ backend
- Installer `socket.io-client` dans React
- Créer un hook `useSocket.js` pour gérer la connexion
- Remplacer les données mockées du store Zustand par les vraies données Socket.io
- Tester avec deux fenêtres navigateur : Alice crée, Bob rejoint, les deux jouent

**Dépendances :** N-03, F-05

---

## PHASE 3 — Intelligence Artificielle

> Objectif : IA jouable aux 3 niveaux, branchée sur le frontend existant.

---

### IA-01 — Fonction d'évaluation du plateau
- Évaluer la qualité d'une position pour un joueur donné
- Compter pour chaque carré possible : combien de coins sont occupés par le joueur vs l'adversaire
- Retourner un score numérique (positif = bon pour le joueur, négatif = mauvais)

**Dépendances :** aucune (utilise backend/game/)

---

### IA-02 — Niveau Facile
- Récupérer tous les coups valides du joueur IA
- Choisir un coup **aléatoirement** parmi les coups valides
- L'IA ne bloque pas et ne planifie pas

**Dépendances :** IA-01

---

### IA-03 — Niveau Moyen (Minimax profondeur 2)
- Implémenter l'algorithme Minimax
- Explorer l'arbre de jeu jusqu'à une profondeur de 2 demi-coups
- Utiliser la fonction d'évaluation pour choisir le meilleur coup

**Dépendances :** IA-01

---

### IA-04 — Niveau Difficile (Minimax + alpha-bêta profondeur 4)
- Ajouter l'élagage alpha-bêta à l'algorithme Minimax
- Explorer jusqu'à une profondeur de 4 demi-coups
- Garantir un temps de réponse < 2 secondes

**Dépendances :** IA-03

---

### IA-05 — Branchement IA dans le jeu
- Créer un endpoint `POST /ia/coup` qui reçoit l'état et retourne le coup de l'IA
- Brancher sur la page `AIMode` du frontend
- Tester les 3 niveaux en jouant contre l'IA

**Dépendances :** IA-04, N-04

---

## Suggestion de répartition (à adapter)

> Chaque personne touche les 3 phases pour avoir une vision complète.

| Personne | Phase 1 | Phase 2 | Phase 3 |
|---|---|---|---|
| Membre 1 | F-01, F-04, F-09 | N-01, N-02 | IA-01, IA-05 |
| Membre 2 | F-02, F-05, F-06 | N-05 | IA-02, IA-03 |
| Membre 3 | F-03, F-07, F-08 | N-03, N-04 | IA-04 |

---

## Récapitulatif

| Phase | Tickets | Priorité |
|---|---|---|
| Frontend | F-01 → F-09 | Commencer par F-01 |
| Network | N-01 → N-05 | Commencer par N-01 |
| IA | IA-01 → IA-05 | Commencer par IA-01 |
