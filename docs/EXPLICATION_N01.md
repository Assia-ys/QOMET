# Explication du code — `backend/main.py` + `config/settings.py` + `requirements.txt`

> Ticket N-01 — Setup backend : FastAPI + Socket.io + configuration serveur.

---

## Structure générale

```
requirements.txt   → liste des librairies Python à installer
config/settings.py → constantes de configuration (HOST, PORT)
backend/main.py    → point d'entrée du serveur (FastAPI + Socket.io)
```

---

## `requirements.txt` — Les dépendances Python

```
fastapi==0.115.0
uvicorn==0.30.6
python-socketio==5.11.3
python-multipart==0.0.9
```

**Pourquoi ces versions sont fixées ?**
Fixer les versions (`==`) garantit que tout le monde (Alice, Bob, Sara) a exactement
la même version installée. Sans ça, une mise à jour automatique pourrait casser le code.

| Librairie | Rôle |
|---|---|
| `fastapi` | Framework qui crée les routes HTTP (`GET /health`, `POST /parties`) |
| `uvicorn` | Serveur ASGI qui fait tourner FastAPI (c'est lui qui "écoute" sur le port) |
| `python-socketio` | Gère les connexions WebSocket temps réel entre joueurs |
| `python-multipart` | Permet à FastAPI de recevoir des formulaires (requis par FastAPI) |

**Installation :**
```bash
pip install -r requirements.txt
```

---

## `config/settings.py` — La configuration

```python
HOST = "0.0.0.0"
PORT = 7777
```

### Pourquoi `0.0.0.0` et pas `127.0.0.1` ?

```
127.0.0.1 → localhost → accessible UNIQUEMENT depuis ta machine
0.0.0.0   → toutes interfaces → accessible depuis tout le réseau local
```

En mode LAN, Bob doit se connecter au serveur d'Alice depuis sa machine.
Avec `127.0.0.1`, Bob ne pourrait pas — il serait bloqué.
Avec `0.0.0.0`, Alice devient le serveur accessible de toute la salle.

### Pourquoi un fichier séparé ?

**Principe DRY** (Don't Repeat Yourself) — si on veut changer le port,
on modifie un seul endroit. Sans ce fichier, `7777` serait écrit dans
`main.py`, `Reseau.jsx`, les scripts de build... Un cauchemar à maintenir.

---

## `backend/main.py` — Le serveur

### 1. Socket.io

```python
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
)
```

**`AsyncServer`** = version asynchrone de Socket.io.
Pourquoi asynchrone ? Le serveur doit gérer plusieurs joueurs en même temps
sans bloquer. Avec `async/await`, il peut traiter la connexion d'Alice
pendant qu'il attend la réponse de Bob.

**`async_mode='asgi'`** = le "langage" que FastAPI parle.
ASGI (Asynchronous Server Gateway Interface) est le standard moderne Python
pour les serveurs web asynchrones.

**`cors_allowed_origins='*'`** = autorise React (port 5173) à contacter
le serveur (port 7777). Sans ça, le navigateur bloquerait la connexion
car les deux applications sont sur des ports différents (politique CORS).

---

### 2. FastAPI + CORS

```python
app = FastAPI(title="QOMET API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**`FastAPI(title="QOMET API")`** crée l'application. Le `title` apparaît
dans la documentation automatique accessible sur `http://127.0.0.1:7777/docs`.

**`CORSMiddleware`** = même raison que pour Socket.io.
Un middleware s'exécute sur **chaque requête** avant qu'elle n'arrive
à la route concernée — c'est comme un filtre/garde à l'entrée.

---

### 3. Fusionner Socket.io et FastAPI — La ligne clé

```python
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
```

Socket.io et FastAPI sont deux applications séparées.
`ASGIApp` les fusionne en **une seule application** qui écoute sur le même port.

```
Port 7777
├── /socket.io/...   → Socket.io (WebSocket, temps réel)
└── /health          → FastAPI (HTTP classique)
└── /parties         → FastAPI (HTTP classique) ← à venir (N-04)
```

Sans cette fusion, il faudrait deux ports différents — un pour les routes HTTP,
un autre pour WebSocket. Ici tout passe par 7777.

---

### 4. Les événements Socket.io de base

```python
@sio.event
async def connect(sid, environ):
    print(f"[WS] Client connecté : {sid}")

@sio.event
async def disconnect(sid):
    print(f"[WS] Client déconnecté : {sid}")
```

`@sio.event` = décorateur qui dit "cette fonction est déclenchée automatiquement
par Socket.io quand cet événement arrive".

**`sid`** (Session ID) = identifiant unique généré automatiquement pour chaque client.
Quand Alice se connecte → `sid = "abc123"`.
Quand Bob se connecte → `sid = "def456"`.
C'est comme ça qu'on sait à qui envoyer les messages — on ne connaît pas
les noms des joueurs à ce stade, juste leur `sid`.

Ces deux événements sont les **fondations** — N-02 et N-03 vont construire
dessus en ajoutant `rejoindre`, `jouer`, `adversaire_deconnecte`, etc.

---

### 5. La route `/health`

```python
@app.get("/health")
async def health():
    return {"status": "ok", "port": PORT}
```

Route de vérification — permet de confirmer que le serveur est bien démarré.

**Deux usages :**
1. En développement : `curl http://127.0.0.1:7777/health` pour vérifier que tout tourne
2. Dans le frontend : l'écran de chargement de Home.jsx pourra appeler cette route
   pour afficher "Initialisation des services..." jusqu'à ce que le serveur réponde

C'est une **convention universelle** — tous les services web exposent `/health`.

---

### 6. Le lancement

```python
if __name__ == "__main__":
    uvicorn.run("backend.main:socket_app", host=HOST, port=PORT, reload=True)
```

`"backend.main:socket_app"` = chemin vers l'objet à servir.
Format : `"module:objet"` → dans `backend/main.py`, prends `socket_app`.

**Pourquoi passer une chaîne et pas l'objet directement ?**
Avec `reload=True`, uvicorn redémarre automatiquement quand tu modifies le code.
Pour faire ça, il a besoin du chemin en texte pour recharger le module — pas d'une
référence mémoire qui deviendrait obsolète après le rechargement.

`reload=True` = uniquement en développement. En production on enlève ça.

---

## Comment tout sera utilisé

```
Mode solo (contre IA) :
React (5173) ──HTTP POST /ia/coup──→ FastAPI (7777) ──→ backend/ai/
                                                         ↓
                                                   backend/game/rules.py

Mode LAN :
Alice React ──WebSocket──→ Socket.io (7777) ──WebSocket──→ Bob React
                                ↓
                         backend/game/game.py
                         (valide et applique les coups)
```

N-01 c'est la fondation. Les tickets suivants construisent dessus :

| Ticket | Ce qu'il ajoute |
|---|---|
| N-02 | Système de rooms (code à 4 chars, association joueurs) |
| N-03 | Événements Socket.io (jouer, broadcaster l'état) |
| N-04 | Routes HTTP (`POST /parties`, `GET /parties/{code}`) |
| N-05 | Branchement React ↔ backend (remplace les mocks) |
