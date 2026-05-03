# Architecture Réseau QOMET — Vision complète des tickets N-01 à N-05

> Document de référence pour l'audit et la compréhension de la couche réseau.
> Groupe Triova — Sorbonne L3 DANT 2025/2026

---

## Pourquoi une couche réseau ?

Le jeu QOMET doit permettre à deux joueurs sur deux machines différentes de jouer
en temps réel sur le même réseau local (WiFi). Pour ça, il faut un **serveur**
qui reçoit les coups, valide les règles, et synchronise les deux écrans.

### Le problème du HTTP classique

HTTP fonctionne en mode "question/réponse" :
```
Client → demande → Serveur → réponse → Client
```
Le serveur ne peut jamais initier une communication. Impossible d'envoyer
"Alice vient de jouer" à Bob spontanément.

### La solution : WebSocket (Socket.io)

WebSocket ouvre une **connexion persistante bidirectionnelle** :
```
Alice ←──── connexion ouverte en permanence ────→ Serveur
Bob   ←──── connexion ouverte en permanence ────→ Serveur
```
Le serveur peut envoyer des messages aux clients à tout moment.
C'est indispensable pour un jeu en temps réel.

### Architecture choisie : serveur autoritaire

```
Alice (React)              Serveur Python              Bob (React)
     │                          │                          │
     │── joue (3,3) ───────────→│                          │
     │                    valide le coup                   │
     │                    rules.py Python                  │
     │                    met à jour Game()                │
     │←── nouvel état ──────────│──── nouvel état ────────→│
```

**Le serveur a toujours le dernier mot** — il valide chaque coup côté Python.
Même si un joueur triche côté client, le serveur rejette le coup.

### Support multi-parties simultanées

Le serveur gère un dictionnaire de rooms :
```python
rooms = {
    "AS58": { "game": Game(), "joueurs": {...} },  # Alice vs Bob
    "KL23": { "game": Game(), "joueurs": {...} },  # Sara vs Prof
    "XP91": { "game": Game(), "joueurs": {...} },  # Maissa vs Assia
}
```
Plusieurs parties peuvent tourner en parallèle sur le même serveur.
Chaque coup est isolé dans sa room grâce au paramètre `room=` de Socket.io.

---

## N-01 — Setup du serveur ✅ TERMINÉ

### Rôle
Mettre en place l'infrastructure de base. Sans N-01, rien d'autre n'existe.

### Fichiers produits
```
requirements.txt    → dépendances Python
config/settings.py  → HOST="0.0.0.0", PORT=7777
backend/main.py     → serveur FastAPI + Socket.io
```

### Choix techniques

**FastAPI** — framework Python moderne et performant.
Supporte l'asynchrone (`async/await`) natif — indispensable pour gérer
plusieurs joueurs simultanément sans bloquer.

**python-socketio** — implémentation Python de Socket.io.
Gère les connexions WebSocket, les rooms, les broadcasts.

**uvicorn** — serveur ASGI qui fait tourner FastAPI.
C'est le processus qui écoute réellement sur le port 7777.

**HOST = "0.0.0.0"** — le serveur est accessible depuis tout le réseau local.
Avec `127.0.0.1`, seule la machine hôte pourrait se connecter.

**PORT = 7777** — numéro arbitraire libre et mémorisable.
Les ports 0-1023 sont réservés au système.

### La fusion FastAPI + Socket.io
```python
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
```
Les deux applications fusionnent sur le même port :
```
Port 7777
├── /health, /parties  → FastAPI (HTTP classique)
└── /socket.io/        → Socket.io (WebSocket)
```

### Comment démarrer le serveur
```bash
python -m backend.main
# → Application startup complete ✅
# → Uvicorn running on http://0.0.0.0:7777
```

### Vérification
```bash
curl http://127.0.0.1:7777/health
# → {"status": "ok", "port": 7777}
```

---

## N-02 — Système de rooms

### Rôle
Gérer la création, le stockage et la suppression des parties en mémoire.
C'est le **carnet de réservations** du serveur.

### Fichier produit
```
backend/network/manager.py
```

### Structure d'une room
```python
rooms = {
    "AS58": {
        "game":        Game("Alice", "Bob"),  # instance du jeu QOMET
        "joueurs": {
            "clair":   "sid_alice",  # identifiant Socket.io d'Alice
            "fonce":   None,         # None tant que Bob n'a pas rejoint
        },
        "prenom_hote": "Alice",
    }
}
```

### Génération du code à 4 caractères
```python
import random
CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
# Caractères exclus : I, O, 0, 1 → trop ressemblants visuellement
code = ''.join(random.choices(CHARS, k=4))  # → "AS58"
```

### Les 4 fonctions clés
```python
creer_room(sid, prenom)
# → Génère un code unique
# → Crée l'entrée dans rooms{}
# → Associe Alice (clair) avec son sid
# → Retourne le code "AS58"

rejoindre_room(sid, code, prenom)
# → Vérifie que le code existe
# → Vérifie que la room n'est pas déjà pleine
# → Associe Bob (fonce) avec son sid
# → Retourne (True, "OK") ou (False, "ERR_ROOM_NOT_FOUND")

room_est_pleine(code)
# → Retourne True si les 2 joueurs sont connectés
# → Déclenche le démarrage de la partie dans N-03

supprimer_room(code)
# → Supprime la room du dictionnaire
# → Appelé quand la partie se termine ou qu'un joueur quitte
```

### Ce que N-02 ne fait PAS
N-02 gère uniquement les données. Il n'envoie aucun message Socket.io.
Les événements réseau sont gérés par N-03.

---

## N-03 — Gestion WebSocket (le plus important)

### Rôle
Brancher les événements Socket.io sur la logique de jeu.
C'est ici que `backend/game/rules.py` est utilisé en conditions réelles.

### Les 5 événements Socket.io

#### 1. `connect` / `disconnect` (automatiques)
```python
@sio.event
async def connect(sid, environ):
    # sid = identifiant unique généré automatiquement par Socket.io
    # Exemple : sid = "abc123def456"
    print(f"Client connecté : {sid}")

@sio.event
async def disconnect(sid):
    # Trouve dans quelle room était ce joueur
    # Notifie l'adversaire
    # Supprime la room
    code = trouver_room_par_sid(sid)
    if code:
        await sio.emit("adversaire_deconnecte", {}, room=code)
        supprimer_room(code)
```

#### 2. `rejoindre` — un joueur entre dans une room
```python
# Client envoie :
{ "code": "AS58", "prenom": "Bob" }

# Serveur fait :
@sio.event
async def rejoindre(sid, data):
    ok, msg = rejoindre_room(sid, data["code"], data["prenom"])

    if not ok:
        await sio.emit("erreur", {"code": msg}, to=sid)
        return

    await sio.enter_room(sid, data["code"])  # Socket.io room

    if room_est_pleine(data["code"]):
        game = rooms[data["code"]]["game"]
        await sio.emit("partie_demarree", game.etat(), room=data["code"])
```

#### 3. `jouer` — un joueur fait un coup
```python
# Client envoie :
{ "type": "poser",       "row": 3, "col": 3 }
{ "type": "deplacement", "coup": ["glisser", 2, 2, 2, 3, 0, 1] }

@sio.event
async def jouer(sid, data):
    code = trouver_room_par_sid(sid)
    room = rooms[code]
    game = room["game"]

    # Vérifie que c'est bien le tour de ce joueur
    couleur_sid = "clair" if room["joueurs"]["clair"] == sid else "fonce"
    if couleur_sid != game.joueur_actif.couleur:
        await sio.emit("erreur", {"code": "ERR_NOT_YOUR_TURN"}, to=sid)
        return

    # Applique le coup via les vraies règles Python
    if data["type"] == "poser":
        ok, msg = game.jouer_poser(data["row"], data["col"])
    else:
        ok, msg = game.jouer_deplacement(data["coup"])

    if not ok:
        await sio.emit("erreur", {"code": "ERR_ILLEGAL_MOVE", "msg": msg}, to=sid)
        return

    # Broadcast le nouvel état aux 2 joueurs de cette room UNIQUEMENT
    await sio.emit("etat", game.etat(), room=code)

    # Vérifie la victoire
    if game.termine:
        await sio.emit("fin_partie", {"gagnant": game.gagnant.nom}, room=code)
        supprimer_room(code)
```

#### 4. `etat` — état envoyé par le serveur (pas un événement client)
```python
# Le serveur émet après chaque coup :
await sio.emit("etat", {
    "plateau":       {"0,0": "clair", "3,3": "fonce", ...},
    "joueur_actif":  "Alice",
    "j1":            "Alice (clair) — en main: 5 | sur plateau: 2",
    "j2":            "Bob (fonce) — en main: 6 | sur plateau: 1",
    "termine":       False,
    "gagnant":       None
}, room=code)
```

#### 5. Erreurs possibles
```
ERR_ROOM_NOT_FOUND   → code de room inexistant
ERR_ROOM_FULL        → room déjà pleine (2 joueurs)
ERR_NOT_YOUR_TURN    → ce n'est pas le tour de ce joueur
ERR_ILLEGAL_MOVE     → coup refusé par rules.py
```

### Pourquoi N-03 est le ticket le plus important
C'est le seul ticket qui utilise réellement `backend/game/rules.py`.
Toute la logique de validation (anti-annulation, poussée, carré gagnant)
est appliquée ici via Python, côté serveur, de façon autoritaire.

---

## N-04 — Routes HTTP

### Rôle
Exposer des endpoints REST pour les actions ponctuelles qui n'ont pas besoin
de temps réel — créer une room, vérifier un code.

### Fichier produit
```
backend/api/routes.py
```

### Pourquoi HTTP et pas Socket.io pour ça ?
Socket.io nécessite une connexion persistante. Vérifier si un code existe
ou créer une room sont des actions **ponctuelles** — un appel suffit,
pas besoin de garder la connexion ouverte.

### Les 3 routes

```python
POST /parties
# Corps : { "prenom": "Alice" }
# Réponse : { "code": "AS58", "message": "Room créée" }
# Utilisé par : bouton "Créer une partie" dans F-04

GET /parties/{code}
# Réponse : { "existe": true, "joueurs_connectes": 1 }
# Utilisé par : vérification avant que Bob tape son code

GET /parties/{code}/etat
# Réponse : état complet du jeu (game.etat())
# Utilisé par : debug, reconnexion après coupure
```

### Lien avec N-02
```
POST /parties  →  appelle creer_room()  de manager.py
GET /parties/{code}  →  consulte rooms{}  de manager.py
```

---

## N-05 — Branchement frontend ↔ backend

### Rôle
Remplacer toutes les données mock du frontend par les vraies données du serveur.
C'est le ticket final qui rend le jeu multijoueur réel.

### Ce qui change côté React

**Avant N-05 (mock) :**
```javascript
// Les règles sont recalculées en JS côté client
setCoupsValides(getCasesAccessibles(plateau, r, c))
appliquerMouvement(plateau, from, to)
```

**Après N-05 (réel) :**
```javascript
// On envoie le coup au serveur, il répond avec le nouvel état
socket.emit("jouer", { type: "deplacement", coup: [...] })
socket.on("etat", (data) => {
    setPlateau(data.plateau)
    setJoueurs([...])
})
```

### Le hook `useSocket.js`
```javascript
function useSocket(serverUrl) {
    useEffect(() => {
        const socket = io(serverUrl)

        socket.on("etat", (data) => {
            // Met à jour tout le store Zustand
        })

        socket.on("partie_demarree", (data) => {
            // Navigation vers /jeu
        })

        socket.on("adversaire_deconnecte", () => {
            // Affiche écran victoire par forfait
        })

        socket.on("erreur", (data) => {
            // Affiche le message d'erreur
        })

        return () => socket.disconnect()
    }, [])

    return socket
}
```

### Ce qui est supprimé à N-05
| Avant | Après |
|---|---|
| `rulesClient.js` (mock JS) | Supprimé — règles Python côté serveur |
| `getCasesAccessibles()` local | Demande au serveur les coups valides |
| `appliquerMouvement()` local | Serveur applique et retourne nouvel état |
| Phase pose/déplacement manuelle | Gérée par `game.py` côté serveur |

---

## Dépendances entre tickets

```
N-01 ──────────────────────────────────────────────────────────→ base
  │
  └──→ N-02 ──────────────────────────────────────────────────→ rooms
         │
         ├──→ N-03 ──────────────────────────────────────────→ WebSocket
         │      │
         └──→ N-04                                            → HTTP
                │
                └──→ N-05 ────────────────────────────────────→ branchement
```

**Parallélisme possible :**
- N-03 et N-04 peuvent être développés simultanément (fichiers différents)
- N-05 peut commencer dès que N-03 est fonctionnel

---

## Robustesse pour la soutenance

| Scénario d'attaque | Ce qui se passe | Comment c'est géré |
|---|---|---|
| Couper le WiFi | Déconnexion Socket.io | `disconnect` → "adversaire_deconnecté" |
| Code invalide | Erreur côté serveur | `ERR_ROOM_NOT_FOUND` affiché |
| Jouer hors tour | Refus serveur | `ERR_NOT_YOUR_TURN` affiché |
| Coup illégal | Refus serveur | `ERR_ILLEGAL_MOVE` via `rules.py` |
| Deux parties en même temps | Rooms indépendantes | Chaque room = sa propre `Game()` |

---

## Flux complet d'une partie — du début à la fin

```
1. Alice ouvre l'app → GET /health → serveur répond ✅

2. Alice clique "Créer une partie"
   → POST /parties {"prenom": "Alice"}
   → serveur crée rooms["AS58"]
   → affiche code "AS58" sur son écran

3. Alice communique "AS58" à Bob (voix / affichage)

4. Bob clique "Rejoindre" et tape "AS58"
   → socket.emit("rejoindre", {code: "AS58", prenom: "Bob"})
   → serveur associe Bob à la room
   → room pleine → serveur émet "partie_demarree" aux deux
   → les deux navigateurs affichent le plateau

5. Alice joue (pose une étoile en 3,3)
   → socket.emit("jouer", {type: "poser", row: 3, col: 3})
   → serveur : game.jouer_poser(3, 3)
   → serveur : game.etat() → broadcast aux deux
   → les deux écrans se mettent à jour simultanément

6. Bob joue...  (même cycle)

7. Alice forme un carré gagnant
   → serveur détecte via rules.verifier_victoire()
   → serveur émet "fin_partie" aux deux
   → écran victoire / défaite s'affiche

8. rooms["AS58"] est supprimée
```
