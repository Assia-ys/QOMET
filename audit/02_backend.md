# Audit de code — QOMET
## Partie 02 — Backend Python

---

## 1. Vue d'ensemble

Le backend est structuré en trois domaines fonctionnels indépendants :

```
backend/
│
├── MOTEUR DE JEU          board.py · rules.py · game.py · player.py
├── INTELLIGENCE ARTIFICIELLE   minimax.py · evaluator.py
└── RÉSEAU & SERVEUR       main.py · manager.py · api/routes.py
```

---

## 2. Moteur de jeu

Le moteur de jeu est la partie la plus pure du backend : **aucune dépendance réseau**, aucun appel socket. Il peut être exécuté et testé en totale isolation.

### `board.py` — Le plateau

Représente la grille 7×7 dont seulement **25 cases sont jouables**, disposées en forme de losange.

**Fonctions importantes :**

| Fonction | Rôle |
|----------|------|
| `est_jouable(r, c)` | Vérifie qu'une case fait partie du plateau jouable |
| `est_libre(r, c)` | Vérifie qu'une case est jouable ET vide |
| `poser(r, c, couleur)` | Place une étoile sur une case, met à jour `dernier_coup` |
| `copier()` | Crée une copie indépendante du plateau (utilisée par le Minimax) |

**Points forts :**
- `CASES_JOUABLES` est un `set` Python → test d'appartenance en O(1), optimal pour les vérifications répétées dans le Minimax
- `copier()` utilise `[row[:] for row in self.grille]` — copie légère et suffisante car la grille ne contient que des valeurs primitives

**Problème identifié :**

| Sévérité | Description |
|----------|-------------|
| 🟢 Faible | `Board.set()` utilise un `assert` désactivé en production (`python -O`) — une écriture invalide passerait silencieusement |

---

### `rules.py` — Les règles

Module le plus critique du projet. Calcule tous les coups légaux, applique les déplacements et détecte la victoire.

**Fonctions importantes :**

| Fonction | Rôle |
|----------|------|
| `deplacements_valides(board, r, c, dernier_coup)` | Retourne tous les coups légaux depuis une case (glisser, pousser, éjecter) |
| `appliquer_coup(board, coup, j_actif, j_adverse)` | Applique un coup sur une **copie** du board sans modifier l'original |
| `verifier_victoire(board)` | Retourne les couleurs gagnantes en vérifiant les 15 carrés possibles |
| `_est_annulation(coup, dernier_coup)` | Bloque les coups qui annulent exactement le coup précédent |
| `_calculer_carres()` | Pré-calcule les 15 carrés possibles au chargement du module |

**Types de coups gérés :**
```
glisser        → déplace une étoile vers une case vide
pousser        → pousse une étoile adverse vers une case libre
pousser_ejecter→ pousse une étoile hors du plateau
ejecter        → éjecte volontairement sa propre étoile d'un coin
```

**Points forts :**
- `CARRES_POSSIBLES` pré-calculé une seule fois au chargement — jamais recalculé pendant une partie
- `appliquer_coup()` retourne toujours une copie du board — immutabilité garantie, essentielle pour la sécurité du Minimax
- Gestion du double carré simultané : si les deux joueurs complètent un carré au même coup, c'est l'adversaire qui gagne

**Problème identifié :**

| Sévérité | Description |
|----------|-------------|
| 🟡 Moyenne | `_est_annulation()` couvre `glisser` et `pousser` mais pas `pousser_ejecter` — cas théoriquement possible mais sans impact réel |

---

### `game.py` — L'orchestrateur

Coordonne le déroulement d'une partie : alternance des tours, validation des coups, détection de fin de partie.

**Fonctions importantes :**

| Fonction | Rôle |
|----------|------|
| `jouer_poser(r, c)` | Le joueur pose une étoile depuis sa main |
| `jouer_deplacement(coup)` | Le joueur déplace une étoile — re-valide côté serveur |
| `_verifier_fin()` | Détecte si la partie est terminée après chaque coup |
| `copier()` | Copie complète et légère du jeu pour le Minimax |
| `etat()` | Sérialise l'état complet pour l'envoyer au frontend |

**Points forts :**
- `copier()` copie manuellement les champs `Player` sans `deepcopy` — décision de performance critique pour le Minimax
- `jouer_deplacement()` re-valide le coup via `Rules.deplacements_valides()` — le client ne peut pas envoyer un coup illégal
- `_verifier_fin()` gère le carré involontaire : si le coup du joueur actif crée un carré pour l'adversaire, c'est l'adversaire qui gagne

**Problème identifié :**

| Sévérité | Description |
|----------|-------------|
| 🟢 Faible | `etat()` identifie le joueur actif par son nom — ambigu si deux joueurs ont le même prénom. `couleur_active` est plus fiable |

---

### `player.py` — Le joueur

Modèle simple qui représente un joueur : son nom, sa couleur et sa réserve d'étoiles.

**Informations importantes :**
- Chaque joueur commence avec **8 étoiles en main**
- `peut_poser()` retourne `True` tant qu'il reste des étoiles en main
- `recuperer_etoile()` est appelé lors d'une éjection — l'étoile retourne en main

---

## 3. Intelligence Artificielle

L'IA est implémentée avec l'algorithme **Minimax** et l'élagage **alpha-bêta**. Elle tourne dans un thread séparé pour ne jamais bloquer le serveur.

### `minimax.py` — L'algorithme

**Niveaux de difficulté :**

| Niveau | Algorithme | Profondeur |
|--------|-----------|-----------|
| Facile | Coup aléatoire parmi les coups légaux | — |
| Moyen | Minimax + alpha-bêta | 2 |
| Difficile | Minimax + alpha-bêta + coups de déplacement en pose | 4 (limitée à 2 en phase de pose) |

**Fonctions importantes :**

| Fonction | Rôle |
|----------|------|
| `coup_facile(game)` | Tire un coup aléatoire parmi les coups légaux |
| `coup_minimax(game, profondeur)` | Choisit le meilleur coup selon le Minimax |
| `_minimax(game, prof, maximise, alpha, beta, couleur)` | Cœur de l'algorithme — exploration récursive avec coupures |
| `_trier_coups(game, coups, maximise, couleur)` | Trie les coups par score superficiel avant exploration |
| `_cases_strategiques(board, couleur)` | Filtre les cases de pose offensives et défensives |
| `_appliquer_board(board, coup, couleur)` | Copie légère du board pour le tri — sans overhead Player/Game |

**Comment fonctionne l'élagage alpha-bêta :**
```
Sans alpha-bêta : explore tous les nœuds → lent
Avec alpha-bêta : abandonne les branches perdantes → ~75% de nœuds en moins

Exemple à profondeur 4 avec 10 coups par nœud :
  Sans → 10 000 nœuds explorés
  Avec →  ~320 nœuds explorés
```

**Points forts :**
- Le move ordering (`_trier_coups`) trie les coups du meilleur au moins bon avant de les explorer — maximise les coupures alpha-bêta
- `_cases_strategiques()` réduit le branching factor en phase de pose en ne gardant que les cases offensives et défensives pertinentes
- Profondeur adaptative : limitée à 2 en phase de pose (trop de combinaisons) et étendue à 4 en phase de déplacement

**Problème identifié :**

| Sévérité | Description |
|----------|-------------|
| 🟡 Moyenne | `_appliquer_board()` ne met pas à jour `dernier_coup` — le tri des coups ignore la règle d'anti-annulation, sans affecter la validation finale |

---

### `evaluator.py` — L'heuristique

Évalue la valeur d'une position pour une couleur donnée. Utilisée par le Minimax pour estimer les états non terminaux.

**Formule :**
```
Pour chacun des 15 carrés possibles :
  Si aucun coin adverse → score += (coins amis)²
  Si au moins 1 coin adverse → carré mort → +0

Exemples :
  1 coin ami  → +1       3 coins amis → +9
  2 coins amis → +4      4 coins amis → victoire → +16
```

**Points forts :**
- Fonction pure sans effet de bord — testable et prévisible
- La progression quadratique récompense davantage les carrés presque complets
- Utilisée en différentiel (`evaluer(ia) - evaluer(adverse)`) — vision relative, pas absolue

**Problème identifié :**

| Sévérité | Description |
|----------|-------------|
| 🟢 Faible | Ne prend pas en compte les étoiles restantes en main — évaluation partielle en tout début de partie |

---

## 4. Réseau & Serveur

### `main.py` — Fonctions importantes

`main.py` est le point d'entrée du serveur. Il gère trois responsabilités : les événements Socket.io temps réel, le signaling Railway et le thread UDP de découverte réseau.

**Événements Socket.io (fonctions clés) :**

| Événement | Rôle |
|-----------|------|
| `connect(sid)` | Enregistre la connexion d'un nouveau client |
| `disconnect(sid)` | Détecte qu'un joueur a quitté — notifie l'adversaire ou libère la room |
| `rejoindre(sid, data)` | Fait entrer un joueur dans une room et démarre la partie si pleine |
| `jouer(sid, data)` | Reçoit un coup, vérifie que c'est le bon tour, l'applique et diffuse le nouvel état |
| `pause(sid)` / `reprendre(sid)` | Met en pause ou reprend la partie |
| `abandonner(sid)` | Le joueur abandonne — l'adversaire gagne par forfait |
| `coup_ia(sid, data)` | Calcule et joue le meilleur coup IA via `asyncio.to_thread` |

**Signaling Railway (routes locales) :**

| Route | Rôle |
|-------|------|
| `POST /local/register` | L'hôte dépose son IP sur le cloud Railway |
| `GET /local/find/{code}` | Le rejoignant récupère l'IP de l'hôte |

**Thread UDP :**
Lance un serveur UDP sur le port 7778 qui répond aux broadcasts de découverte des rejoignants sur le réseau local.

**Points forts :**
- `asyncio.to_thread` pour l'IA — le serveur reste réactif pendant le calcul
- `skip_sid=sid` sur les émissions ciblées — le joueur concerné ne reçoit pas son propre événement

**Problèmes identifiés :**

| Sévérité | Description |
|----------|-------------|
| 🔴 Élevée | Room non supprimée quand l'hôte quitte seul la salle d'attente — fuite mémoire |
| 🟡 Moyenne | Thread UDP accède à `rooms` sans `threading.Lock` — risque de race condition |
| 🟡 Moyenne | `_local_registry` non purgé si aucune nouvelle partie créée pendant 10 min |

---

### `manager.py` — Gestion des rooms

Contient le dictionnaire global `rooms` et toutes les fonctions qui le manipulent.

**Fonctions importantes :**

| Fonction | Rôle |
|----------|------|
| `creer_room(prenom)` | Crée une room avec un code unique à 4 caractères |
| `rejoindre_room(sid, code, prenom)` | Ajoute un joueur dans la room |
| `quitter_room(sid)` | Libère le slot d'un joueur sans supprimer la room |
| `supprimer_room(code)` | Supprime définitivement une room |
| `room_est_pleine(code)` | Retourne `True` si les deux slots sont occupés |
| `couleur_du_joueur(sid)` | Retourne `(code, couleur)` du joueur identifié par son sid |

**Points forts :**
- Code court, sans logique superflue
- `rejoindre_room()` appelle `quitter_room(sid)` en entrée — évite qu'un même client soit dans deux rooms en même temps

---

### `routes.py` — API REST

| Route | Méthode | Rôle |
|-------|---------|------|
| `/parties` | `POST` | Crée une room, retourne le code à 4 caractères |
| `/parties/{code}` | `GET` | Vérifie si une room existe et si elle est pleine |
| `/parties/{code}/etat` | `GET` | Retourne l'état complet du jeu *(debug)* |
| `/parties/{code}` | `DELETE` | Supprime une room *(debug)* |

**Problèmes identifiés :**

| Sévérité | Description |
|----------|-------------|
| 🟡 Moyenne | Routes de debug (`DELETE`, `GET /etat`) accessibles sans authentification en production |
| 🟡 Moyenne | Aucun rate-limiting sur `POST /parties` |

---

## 5. Sécurité

| Sévérité | Risque | Fichier |
|----------|--------|---------|
| 🟡 Moyenne | Routes de debug accessibles sans auth en production | `routes.py` |
| 🟡 Moyenne | Pas de rate-limiting sur la création de rooms | `routes.py` |
| 🟡 Moyenne | CORS `allow_origins=["*"]` — risqué si l'API est exposée publiquement | `main.py` |
| 🟢 Faible | `POST /local/register` accepte n'importe quelle chaîne comme IP | `main.py` |

---

## 6. Couverture des tests

Les tests sont dans `tests/` à la racine du projet et couvrent l'ensemble du backend via **pytest**.

| Fichier | Module testé | Tests |
|---------|-------------|-------|
| `test_board.py` | `board.py` | 19 |
| `test_rules.py` | `rules.py` | 32 |
| `test_game.py` | `game.py` | 23 |
| `test_player.py` | `player.py` | 6 |
| `test_minimax.py` | `minimax.py` | 14 |
| `test_evaluator.py` | `evaluator.py` | 5 |
| `test_manager_routes.py` | `manager.py` + routes | 16 |
| `test_ia_bataille.py` | Scénarios de parties IA | — |
| `test_ia_temps.py` | Performance IA | — |
| **Total** | | **115 tests** |

**Ce qui n'est pas testé :** les événements Socket.io de `main.py` (`jouer`, `disconnect`, `rejoindre`). Un bug dans la gestion des rooms WebSocket ne serait détecté qu'à l'exécution.

---

## 7. Récapitulatif

### Bugs corrigés

| Commit | Description | Correction |
|--------|-------------|-----------|
| `af78b37` | Règles dupliquées côté client | Suppression de `rulesClient.js` — validation uniquement serveur |
| `abe7b56` | Port 7777 déjà occupé au redémarrage | Kill du processus existant avant chaque lancement |
| `7fc310c` | IP `127.0.0.1` enregistrée sur Railway | Retry DHCP 5s + suppression filtre `192.168.100.x` |
| `87d4994` | Déconnexion socket sur minimisation fenêtre | `setBackgroundThrottling(false)` + `skip_sid` |
| `960fa7a` | 2e partie ne démarrait pas (listeners périmés) | `resetSocketToServer()` systématique à chaque connexion |
| `5beb5cb` | Modal pause bloqué après déconnexion | `setAdversaireEnPause(false)` dans `onAdversaireDeconnecte` |
| `e6e2569` | Modals superposés à la fin de partie | Fermeture de tous les modals avant affichage du résultat |
| `eab285b` `e541639` | Pare-feu Windows bloquait le port en hotspot | `profile=any` + `perMachine=true` |

### Points restants

| Sévérité | Fichier | Description |
|----------|---------|-------------|
| 🔴 Élevée | `main.py` | Room non supprimée quand l'hôte quitte seul la salle d'attente |
| 🟡 Moyenne | `main.py` | Thread UDP accède à `rooms` sans `Lock` |
| 🟡 Moyenne | `main.py` | `_local_registry` non purgé si aucune partie créée |
| 🟡 Moyenne | `routes.py` | Routes de debug accessibles en production |
| 🟡 Moyenne | `routes.py` | Pas de rate-limiting sur `POST /parties` |
| 🟡 Moyenne | `rules.py` | `_est_annulation` ne couvre pas `pousser_ejecter` |
| 🟡 Moyenne | `minimax.py` | Move ordering ignore la règle d'anti-annulation |
| 🟢 Faible | `board.py` | `assert` inactif en production |
| 🟢 Faible | `evaluator.py` | Heuristique ignore les étoiles en main |

---

*Précédent : [01_architecture.md](01_architecture.md) — Suivant : [03_frontend.md](03_frontend.md)*
