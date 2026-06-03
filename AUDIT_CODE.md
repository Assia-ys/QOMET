# Audit de Code — QOMET
> Rédigé le 2026-06-02 · Branche analysée : `maissa/main`

---

## 1. VUE D'ENSEMBLE DE L'ARCHITECTURE

### Schéma d'architecture global

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION QOMET                        │
│                                                             │
│  ┌─────────────────┐         ┌─────────────────────────┐   │
│  │  Electron Shell │         │   Navigateur (Railway)  │   │
│  │  electron/      │         │   URL publique          │   │
│  │  main.js        │         └──────────┬──────────────┘   │
│  │  preload.js     │                    │                   │
│  └────────┬────────┘                    │                   │
│           │ IPC Bridge                  │ HTTP/WS           │
│           │ contextBridge               │                   │
│           ▼                             ▼                   │
│  ┌─────────────────────────────────────────────────┐        │
│  │         Frontend React (Vite)                    │        │
│  │  frontend/src/                                   │        │
│  │  ├── pages/  (Home, Game, IA, Reseau, Params)   │        │
│  │  ├── hooks/  (useSocket, useGameActions, ...)    │        │
│  │  ├── store/  (Zustand — useGameStore)            │        │
│  │  ├── router/ (React Router v6)                   │        │
│  │  └── api/    (fetch REST + Socket.IO)            │        │
│  └───────────────────┬─────────────────────────────┘        │
│                      │ HTTP REST + WebSocket                 │
│                      ▼                                       │
│  ┌─────────────────────────────────────────────────┐        │
│  │         Backend Python (FastAPI + Socket.IO)     │        │
│  │  backend/                                        │        │
│  │  ├── main.py        (point d'entrée, tout-en-un) │        │
│  │  ├── api/routes.py  (REST /parties)              │        │
│  │  ├── network/manager.py (rooms en mémoire)       │        │
│  │  ├── game/          (Board, Game, Rules, Player) │        │
│  │  └── ai/            (minimax, evaluator)         │        │
│  └─────────────────────────────────────────────────┘        │
│                                                             │
│  Découverte LAN :                                           │
│  ┌──────────────┐   UDP 7778   ┌──────────────────┐        │
│  │  Hôte Electron│ ──broadcast─▶│  Rejoignant      │        │
│  │  demarrerBroadcast()        │  ecouterBroadcast()│       │
│  └──────────────┘              └──────────────────┘        │
│                                                             │
│  Signaling fallback :                                       │
│  ┌──────────────┐  POST /local/register  ┌──────────────┐  │
│  │  Hôte        │ ──────────────────────▶│  Railway     │  │
│  └──────────────┘                        │  (mémoire)   │  │
│  ┌──────────────┐  GET /local/find/{code}│              │  │
│  │  Rejoignant  │ ◀──────────────────────└──────────────┘  │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

### Stack technique

| Couche | Technologie | Version |
|---|---|---|
| Desktop shell | Electron | 36.x |
| Frontend | React + Vite | React 19, Vite 8 |
| Routing | React Router v6 | — |
| État global | Zustand | — |
| Temps réel | Socket.IO client | — |
| Langage frontend | JavaScript (JSX) — pas de TypeScript | — |
| Backend | FastAPI + python-socketio | — |
| ASGI | Uvicorn | — |
| Validation données | Pydantic v2 | — |
| IA | Minimax alpha-bêta maison | — |
| Build desktop | electron-builder (NSIS / DMG) | — |
| Déploiement web | Railway | — |
| i18n | react-i18next | — |

### Arborescence et rôle de chaque élément

```
QOMET/
├── electron/
│   ├── main.js          ← Processus principal Electron : backend Python,
│   │                       pare-feu, broadcast UDP, IPC handlers, BrowserWindow
│   └── preload.js       ← Pont contextBridge : expose electronAPI au renderer
│
├── frontend/src/
│   ├── pages/
│   │   ├── Home.jsx         ← Menu principal avec écran de chargement 2s
│   │   ├── Game.jsx         ← Plateau de jeu (réseau + IA)
│   │   ├── IA.jsx           ← Configuration et démarrage d'une partie IA
│   │   ├── Parametres.jsx   ← Langue, sons, thème
│   │   └── Reseau/
│   │       ├── index.jsx        ← Orchestrateur réseau (créer/rejoindre)
│   │       ├── VueAccueil.jsx   ← UI création/rejoindre (local + online)
│   │       ├── SalleAttente.jsx ← Salle d'attente hôte
│   │       └── EcranErreur.jsx  ← Écran d'erreur réseau
│   ├── hooks/
│   │   ├── useSocket.js     ← Singleton Socket.IO + abonnements globaux
│   │   ├── useGameActions.js← emit socket (jouer, déplacer, éjecter…)
│   │   ├── useGameTimer.js  ← Chrono de partie et de pause
│   │   ├── useSounds.js     ← Sons victoire/défaite
│   │   └── useIsMobile.js   ← Détection mobile
│   ├── store/
│   │   └── useGameStore.js  ← Store Zustand : état complet du plateau
│   ├── api/
│   │   └── parties.js       ← fetch REST (creerPartie, verifierPartie) + timeout
│   ├── config/
│   │   └── config.js        ← LOCAL_URL, ONLINE_URL, SERVER_URL, IS_ELECTRON
│   ├── router/
│   │   └── index.jsx        ← Routes + reset socket au retour de /jeu
│   └── styles/              ← Fichiers de styles inline (objets JS)
│
├── backend/
│   ├── main.py              ← Point d'entrée : FastAPI, Socket.IO, UDP thread,
│   │                           signaling /local/*, routes statiques
│   ├── api/routes.py        ← REST CRUD /parties
│   ├── network/manager.py   ← Gestion des rooms en mémoire (dict global)
│   ├── game/
│   │   ├── board.py         ← Plateau 7×7, cases jouables, copie
│   │   ├── game.py          ← Logique de partie, copier(), etat()
│   │   ├── rules.py         ← Déplacements valides, victoire, anti-annulation
│   │   └── player.py        ← Modèle joueur (étoiles en main / sur plateau)
│   └── ai/
│       ├── minimax.py       ← Minimax alpha-bêta, 3 niveaux
│       └── evaluator.py     ← Fonction d'évaluation heuristique
│
├── config/
│   └── settings.py          ← HOST, PORT depuis variables d'environnement
│
├── package.json             ← Scripts Electron + build config electron-builder
├── docker-compose.yml       ← Configuration Docker (non utilisée en prod)
└── .gitignore
```

### Flux de données

```
[Utilisateur clique "Créer"]
    → handleCreer() dans Reseau/index.jsx
    → POST /parties  (fetch REST, parties.js)
    → backend crée room en mémoire, retourne {code}
    → socket.emit('rejoindre', {code, prenom})
    → backend: rejoindre_room(), room_est_pleine() → émet 'partie_demarree'
    → store Zustand mis à jour (setEtatServeur)
    → navigate('/jeu')
    → Game.jsx lit le store (plateau, joueurs, etc.)
    → handleCellClick → actions.jouerPoser/jouerDeplacement
    → socket.emit('jouer', data)
    → backend valide + applique coup → emit('etat', ...) room entière
    → useSocket.js onEtat → store.setEtatServeur()
    → React re-render Board
```

### Points d'entrée et séquence de démarrage

**Electron :**
1. `app.whenReady()` → `fixerParefeuWindows()` → `demarrerBackend()` → `attendreBackend()` → `creerFenetre()`
2. En dev : charge `http://localhost:5173` ; en prod : charge `frontend/src/dist/index.html`
3. `preload.js` expose `window.electronAPI` via `contextBridge`

**Web (Railway) :**
1. `uvicorn backend.main:socket_app` → FastAPI + Socket.IO ASGI
2. Route catch-all `/{full_path:path}` sert `dist/index.html`
3. React Bootstrap → `main.jsx` → `<App>` → `<AppRouter>` → page initiale `/`

---

## 2. AUDIT BACKEND

### Patterns d'architecture utilisés

Le backend suit une **architecture en couches légères** :
- `routes.py` = couche API REST (Controller)
- `manager.py` = couche données (Repository en mémoire)
- `game/` = logique métier (Domain)
- `ai/` = services IA

**Problème :** `main.py` viole ce découpage. Il contient simultanément : les événements Socket.IO, les routes signaling, le démarrage UDP, le montage statique — c'est un **God File** de ~390 lignes.

---

### Conception de l'API REST

**Structure des routes :**
```
POST   /parties              → créer une partie
GET    /parties/{code}       → vérifier si une room existe
GET    /parties/{code}/etat  → état complet du jeu
DELETE /parties/{code}       → supprimer une room
POST   /local/register       → signaling hôte (IP)
GET    /local/find/{code}    → signaling rejoignant
GET    /health               → healthcheck
GET    /info                 → infos serveur
```

**Points positifs :** nommage cohérent, préfixes logiques, Pydantic pour validation des corps.

**Problèmes identifiés :**

---

**[CRITIQUE] Emplacement : `backend/main.py:86-102` · Problème : Endpoint signaling sans authentification**

```python
@app.post("/local/register")
async def local_register(body: LocalRegisterBody):
    # N'importe qui peut enregistrer une IP pour n'importe quel code
```

**Pourquoi c'est important :** Un attaquant peut POSTer `{"code": "ABCD", "ip": "192.168.1.100", "port": 7777}` et hijacker la session de quelqu'un. Le rejoignant se connecterait à une machine non-QOMET.

**Correctif :** Ajouter un token secret partagé (`X-QOMET-Secret`) généré à la création de la room, passé à la fois par l'hôte et le rejoignant.

---

**[CRITIQUE] Emplacement : `backend/api/routes.py:53` · Problème : DELETE /parties/{code} sans authentification**

```python
@router.delete("/{code}")
async def supprimer_partie(code: str):
    supprimer_room(code)
```

**Pourquoi c'est important :** N'importe qui connaissant un code (4 chars alphanumériques) peut supprimer une partie en cours. Surface d'attaque : 32⁴ = ~1 million de combinaisons, trivialement bruteforceable.

**Correctif :** Supprimer cet endpoint ou le protéger par un token admin. Il ne sert qu'au debug.

---

**[MINEUR] Emplacement : `backend/api/routes.py:17-20` · Problème : Pas de validation sur `prenom`**

```python
class CreerPartieBody(BaseModel):
    prenom: str   # longueur illimitée, contenu quelconque
```

**Pourquoi c'est important :** Un prenom de 10 000 caractères est diffusé à tous les clients via `emit('etat', ...)`. Risque DoS mémoire et surcharge réseau.

**Correctif :**
```python
from pydantic import Field
class CreerPartieBody(BaseModel):
    prenom: str = Field(min_length=1, max_length=30)
```

---

### Organisation de la logique métier

La séparation `board/game/rules/player` est **bien faite** : chaque classe a une responsabilité claire. `Rules` est pur (stateless, méthodes statiques), `Game` orchestre. C'est le point fort de l'architecture.

**[MOYEN] Emplacement : `backend/game/board.py:50` · Problème : `assert` en code de production**

```python
def set(self, row, col, valeur):
    assert self.est_jouable(row, col), f"Tentative d'écriture sur case non jouable ({row},{col})"
```

**Pourquoi c'est important :** En Python optimisé (`python -O`), les `assert` sont désactivés. PyInstaller peut compiler avec optimisations, rendant cette garde silencieuse. Une `AssertionError` non catchée fait planter le serveur.

**Correctif :**
```python
def set(self, row, col, valeur):
    if not self.est_jouable(row, col):
        raise ValueError(f"Case non jouable ({row},{col})")
    self.grille[row][col] = valeur
```

---

### Couche données — Gestion des rooms

**[CRITIQUE] Emplacement : `backend/network/manager.py:6` · Problème : État global mutable non thread-safe**

```python
rooms = {}  # dictionnaire Python global
```

FastAPI est async/ASGI et peut traiter des requêtes en parallèle. Les opérations `rooms[code] = ...` et `del rooms[code]` ne sont **pas atomiques** sous asyncio en présence de threads (le thread UDP lit `rooms`).

**Pourquoi c'est important :** Le thread `_udp_server_thread` (main.py:29) lit `rooms` pendant que les coroutines FastAPI le modifient → race condition possible sur les dicts Python.

**Correctif :** Utiliser `asyncio.Lock()` pour les accès au dict depuis les coroutines, ou passer à une solution comme Redis pour un vrai déploiement multi-worker.

---

**[MOYEN] Emplacement : `backend/network/manager.py` · Problème : Pas de nettoyage des rooms orphelines**

Les rooms créées mais jamais rejointes (l'hôte ferme l'app avant qu'un joueur arrive) restent en mémoire indéfiniment. Après N parties, la RAM croît sans limite.

**Correctif :** Ajouter un timestamp de création dans la room et un nettoyage périodique (TTL 10 minutes).

---

### Mécanismes d'authentification et d'autorisation

**Il n'existe aucun mécanisme d'authentification.** Toutes les routes HTTP et tous les événements Socket.IO sont publics. C'est acceptable pour un prototype de jeu local, mais :

- N'importe qui peut jouer un coup à la place d'un autre (si le `sid` est deviné — ce qui est difficile mais pas impossible)
- Le signaling Railway (`/local/register`) est complètement ouvert (voir section critique ci-dessus)

---

### Stratégie de gestion des erreurs

**Points positifs :** Les routes REST lèvent `HTTPException` correctement. Les événements Socket.IO émettent `erreur` avec des codes explicites (`ERR_ROOM_NOT_FOUND`, `ERR_NOT_YOUR_TURN`...).

**[MINEUR] Emplacement : `backend/main.py:29-52` · Problème : Thread UDP sans arrêt propre**

```python
threading.Thread(target=_udp_server_thread, daemon=True).start()
```

Le thread est `daemon=True` donc il meurt avec le process, mais il n'y a aucun moyen de l'arrêter proprement (par exemple pour les tests). Le `sock.bind()` peut échouer silencieusement si le port 7778 est déjà occupé — l'erreur est avalée par le `except Exception`.

---

### Validation et assainissement des entrées

**[MOYEN] Emplacement : `backend/main.py:81-95` · Problème : Pas de validation du format IP dans `/local/register`**

```python
class LocalRegisterBody(BaseModel):
    code: str
    ip:   str   # aucune validation de format
    port: int = 7777
```

Un IP comme `"; rm -rf /"` ou une URL externe sera stocké et renvoyé au rejoignant qui l'utilisera pour se connecter.

**Correctif :**
```python
from pydantic import IPvAnyAddress
class LocalRegisterBody(BaseModel):
    code: str = Field(min_length=4, max_length=4, pattern=r'^[A-Z0-9]+$')
    ip:   IPvAnyAddress
    port: int = Field(default=7777, ge=1024, le=65535)
```

---

### Gestion de la configuration

`config/settings.py` lit `HOST` et `PORT` depuis `os.getenv` — c'est correct. Mais `ONLINE_URL` est hardcodé dans `frontend/src/config/config.js` comme fallback string : `'https://qomet-production.up.railway.app'`. Si le domaine Railway change, il faut modifier le code source.

---

## 3. AUDIT COUCHE IA / ML

L'IA de QOMET est un **algorithme Minimax classique** (pas de LLM, pas d'apprentissage automatique). L'audit porte donc sur la qualité algorithmique.

### Qualité de l'implémentation Minimax

**Points positifs :**
- Élagage alpha-bêta correctement implémenté (`backend/ai/minimax.py:126-163`)
- Move ordering par score superficiel pour maximiser les coupures (`_trier_coups`)
- Profondeur adaptative : réduit à 2 en phase de pose pour limiter le branching factor
- Copie légère du board seul pour le tri (`_appliquer_board`) — optimisation pertinente

**[MOYEN] Emplacement : `backend/ai/minimax.py:126` · Problème : Pas de transposition table**

Le Minimax recalcule les mêmes positions (même board, même joueur actif) de multiples chemins différents. Pour le niveau difficile (profondeur 4), cela représente une quantité significative de travail redondant.

**Pourquoi c'est important :** La table de transposition réduirait le temps de calcul de 30 à 50% en profondeur 4, améliorant la réactivité de l'IA difficile.

**Correctif :** Ajouter un `dict` de transposition indexé par le hash du board (Zobrist hashing).

---

**[MINEUR] Emplacement : `backend/ai/evaluator.py:1` · Problème : Fonction d'évaluation trop simple**

```python
score += friendly * friendly  # friendly² par carré sans adversaire
```

Cette heuristique ne prend pas en compte la mobilité (nombre de coups disponibles), le contrôle des cases centrales, ou la menace imminente de victoire à 1 coup. Cela rend l'IA difficile beatable par des stratégies de mobilité.

---

**[MOYEN] Emplacement : `backend/main.py:244` · Problème : Calcul IA bloquant dans un thread asyncio**

```python
coup = await asyncio.to_thread(coup_minimax, game, 4)
```

`asyncio.to_thread` est correctement utilisé pour ne pas bloquer l'event loop. Mais si plusieurs parties avec IA difficile tournent simultanément, le thread pool sera saturé (par défaut : `min(32, os.cpu_count() + 4)` threads).

---

## 4. AUDIT RÉSEAU / INFRASTRUCTURE

### Couche WebSocket (Socket.IO)

**[CRITIQUE] Emplacement : `frontend/src/hooks/useSocket.js:6-7` · Problème : Singletons module-level au lieu de singletons React**

```javascript
let socket   = null
let socketIA = null
```

Ces variables vivent au niveau du module ES, en dehors de React. En Hot Module Replacement (dev), elles ne sont pas réinitialisées entre les rechargements. En test, il est impossible de les isoler.

**Pourquoi c'est important :** Des événements peuvent rester attachés à un socket zombie après `resetSocketToServer()` si un composant ne s'est pas démonté proprement.

---

**[MOYEN] Emplacement : `frontend/src/hooks/useSocket.js:39` · Problème : Accès direct au store Zustand depuis un handler Socket.IO**

```javascript
function onAdversaireDeconnecte() {
    const { prenomJoueur } = useGameStore.getState()  // ← OK
```

C'est techniquement correct (appel à `.getState()` en dehors d'un composant React est supporté par Zustand), mais c'est fragile car cela crée un couplage fort entre le hook socket et le store.

---

### Découverte réseau (electron/main.js)

**[MOYEN] Emplacement : `electron/main.js:94-117` · Problème : `scanReseau` crée ~254 connexions TCP simultanées**

```javascript
for (let i = 0; i < allIPs.length; i += 30) {
    // 30 connexions TCP par batch, timeout 500ms
```

Sur un réseau /24, cela génère ~254 tentatives de connexion TCP. Sur un réseau /16 (université), c'est potentiellement 65 000 IPs — le scan est inutilisable.

**Pourquoi c'est important :** Ce scan peut déclencher les IDS/IPS du réseau, et n'est pas nécessaire depuis l'ajout du signaling Railway.

---

**[MOYEN] Emplacement : `electron/main.js:75-92` · Problème : Parsing fragile de la sortie `arp -a`**

```javascript
const regex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g
exec(cmd, (err, stdout) => { ... })
```

La sortie de `arp -a` varie selon l'OS (Windows, macOS, Linux), la locale système et la version. Ce regex peut capturer des IPs de gateway ou de broadcast selon le format de sortie.

---

**[MINEUR] Emplacement : `electron/main.js:376-385` · Problème : `fixerParefeuWindows` exécute `netsh` sans vérifier les droits admin**

```javascript
exec(cmds, () => {})  // erreur silencieuse
```

Si l'app ne tourne pas en admin, `netsh` échoue silencieusement. L'utilisateur n'est pas informé que le pare-feu n'a pas été configuré.

---

### Sécurité CORS

**[MOYEN] Emplacement : `backend/main.py:63-68` · Problème : CORS trop permissif**

```python
CORSMiddleware(allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
```

En déploiement Railway, accepter toutes les origines permet à n'importe quel site web d'appeler l'API et de créer/supprimer des rooms.

**Correctif :**
```python
allow_origins=[
    "https://qomet-production.up.railway.app",
    "http://127.0.0.1:7777",
    "http://localhost:5173",
]
```

---

### Configuration des environnements

Il n'existe **pas de séparation formelle dev/staging/prod** :
- Pas de fichier `.env.example`
- `VITE_SERVER_URL` est utilisé mais jamais documenté
- Le frontend utilise `import.meta.env?.VITE_SERVER_URL` avec `?.` (optional chaining) ce qui masque silencieusement l'absence de la variable

---

### Docker

`docker-compose.yml` est présent mais **non utilisé en production**. La production Railway utilise `uvicorn` directement. Le fichier Docker n'a pas été audité en détail mais sa présence non maintenue est un risque de confusion.

---

## 5. AUDIT FRONTEND

### Architecture et organisation des composants

L'organisation `pages/components/hooks/store/styles` est **conventionnelle et lisible**.

**[MOYEN] Emplacement : `frontend/src/pages/Reseau/VueAccueil.jsx` · Problème : God Component (369 lignes, 3 composants internes)**

Le fichier contient `VueAccueil`, `VueOnline`, `VueLocal`, plus 4 icônes SVG inline. Ces composants devraient être dans des fichiers séparés.

---

**[MOYEN] Emplacement : `VueAccueil.jsx:71-89` et `VueAccueil.jsx:207-226` · Problème : Duplication du handler de saisie de code**

```javascript
// VueOnline (ligne 71)
function handleCodeInput(i, val) { ... }
function handleCodeKeyDown(i, e) { ... }
function handlePaste(e) { ... }

// VueLocal (ligne 207) — copié-collé identique
function handleCodeInput(i, val) { ... }
function handleCodeKeyDown(i, e) { ... }
function handlePaste(e) { ... }
```

**Pourquoi c'est important :** Toute correction de bug dans un handler doit être appliquée deux fois.

**Correctif :** Extraire un composant `<CodeInput value={...} onChange={...} />`.

---

### Gestion d'état

Zustand est utilisé correctement pour l'état global. Les `useState` locaux sont appropriés pour l'état de formulaire. La séparation est bonne.

**[MOYEN] Emplacement : `frontend/src/store/useGameStore.js:90-94` · Problème : `reinitialiser()` crée de nouveaux objets à chaque appel**

```javascript
reinitialiser: () => set({
    ...etatInitial,
    plateau: GRILLE_VIDE(),          // nouvelle instance
    joueurs: [joueurInitial(...), joueurInitial(...)],  // nouvelles instances
})
```

`etatInitial` est défini une seule fois à l'initialisation du module avec `GRILLE_VIDE()`. Lors d'un `reinitialiser()`, un nouveau plateau et de nouveaux joueurs sont créés — c'est **correct** (les références ne doivent pas être partagées). Mais `etatInitial.plateau` pointe vers l'instance initiale qui n'est jamais réutilisée. Ceci est une micro-inefficacité sans impact réel.

---

### Routing et navigation

**[MINEUR] Emplacement : `frontend/src/router/index.jsx:10` · Problème : `LOCAL_URL` dupliqué**

```javascript
const LOCAL_URL = 'http://127.0.0.1:7777'  // hardcodé ici
```

Cette constante existe déjà dans `frontend/src/config/config.js`. Si le port change, il faut le modifier à deux endroits.

**Correctif :** `import { LOCAL_URL } from '../config/config'`

---

### Couche de communication API

**[MOYEN] Emplacement : `frontend/src/pages/Reseau/index.jsx:98-99` · Problème : `AbortSignal.timeout()` non supporté partout**

```javascript
signal: AbortSignal.timeout(4000),
```

`AbortSignal.timeout()` n'est pas supporté dans les environnements Electron anciens ou les navigateurs antérieurs à 2022. Si l'utilisateur a une version d'Electron antérieure, cela lève une TypeError.

**Correctif :** Utiliser le pattern existant de `withTimeout()` dans `parties.js`.

---

**[MOYEN] Emplacement : `frontend/src/pages/Reseau/VueAccueil.jsx:228` · Problème : Port 7777 hardcodé**

```javascript
const joinURL = ipHote.trim() ? `http://${ipHote.trim()}:7777` : undefined
```

Si le port change dans `config/settings.py`, cette ligne est oubliée.

**Correctif :**
```javascript
import { LOCAL_URL } from '../../config/config'
const joinURL = ipHote.trim() ? `http://${ipHote.trim()}:${new URL(LOCAL_URL).port}` : undefined
```

---

### Performance

**[MINEUR] Emplacement : `frontend/src/pages/Home.jsx:12-14` · Problème : Délai de chargement artificiel de 2 secondes**

```javascript
useEffect(() => {
    const timer = setTimeout(() => setChargement(false), 2000)
```

Ce délai fixe ne correspond à aucune opération réelle. Il ralentit l'accès au menu sans raison technique.

---

### Formulaires et validation

**[MINEUR] Emplacement : `VueAccueil.jsx:228-231`, `VueLocal` · Problème : Pas de validation du format IP en frontend**

Le champ IP manuelle (`ipHote`) accepte n'importe quelle chaîne. Une saisie comme `abc` produit `http://abc:7777` qui échoue silencieusement au niveau réseau.

---

### i18n — Cohérence

**[MINEUR] Problème : Strings hardcodées en français dans les fichiers i18n**

Dans `SalleAttente.jsx:44` :
```jsx
{showIP ? 'Masquer mon adresse IP' : 'Afficher mon adresse IP'}
```

Dans `VueAccueil.jsx` (plusieurs endroits) :
```jsx
{isLoading ? 'Création…' : t('reseau.creer_btn')}
{isLoading ? 'Connexion…' : t('reseau.rejoindre_btn')}
```

Ces chaînes échappent au système de traduction.

---

### Accessibilité

- Aucun attribut `aria-label` sur les boutons icônes
- Les cases du plateau (Board.jsx) utilisent des `div` cliquables sans `role="button"` ni `tabIndex`
- Le focus keyboard n'est pas géré sur le plateau de jeu

---

## 6. ASPECTS TRANSVERSAUX

### Stratégie de tests

**[CRITIQUE] Problème : Zéro test dans le projet**

Aucun fichier de test n'a été trouvé. Pas de tests unitaires, pas de tests d'intégration, pas de tests e2e. Le projet entier dépend de tests manuels.

**Pourquoi c'est important :** Chaque bug réseau corrigé dans les dernières semaines aurait pu être détecté plus tôt avec des tests. La règle d'or "on ne casse rien" est difficile à tenir sans filet de sécurité automatisé.

**Recommandation :**
- Backend : `pytest` + `httpx` pour les routes REST, `pytest-asyncio` pour les événements Socket.IO
- Logique de jeu : tests unitaires sur `Rules.deplacements_valides()` et `Rules.verifier_victoire()`
- Frontend : Vitest pour les hooks (useGameStore, logique de découverte)

---

### Logging et observabilité

Le logging est **minimal et inconsistant** :
- `electron/main.js` : `log()` envoie aussi au renderer via IPC — utile en debug
- `backend/main.py` : `print()` au lieu d'un logger Python (`logging` module)
- Aucune traçabilité des erreurs en production Railway (pas de Sentry, pas de structured logging)

**[MINEUR] Emplacement : `backend/main.py:299-307` (spawn backend)** Les logs du backend Python (`server.stdout`) sont redirigés vers `console.log` d'Electron — ils ne sont pas persistés sur disque.

---

### TypeScript

Le projet est entièrement en JavaScript sans TypeScript. Cela conduit à :
- Aucune vérification de type sur les données Socket.IO (le serveur peut envoyer une forme inattendue)
- `useGameStore.getState()` retourne `any` implicitement
- Aucune autocomplete sur `window.electronAPI`

La migration vers TypeScript serait un investissement significatif mais réduirait la classe entière des bugs de régression.

---

### Duplication de code

| Code dupliqué | Emplacements | Impact |
|---|---|---|
| `handleCodeInput/KeyDown/Paste` | VueOnline + VueLocal dans VueAccueil.jsx | Bug à corriger 2× |
| `LOCAL_URL = 'http://127.0.0.1:7777'` | config.js + router/index.jsx | Désync si port change |
| Logique socket reset | Reseau/index.jsx + router/index.jsx | Comportement potentiellement incohérent |
| Vérification `window.electronAPI?.xxx?.()` | Partout dans le code | Verbeux mais acceptable |

---

### Audit des dépendances

**[MOYEN] `package.json` · Problème : `tailwindcss` et `postcss` installés mais apparemment non utilisés**

Les styles sont définis via des objets JS inline (voir `frontend/src/styles/`). Tailwind est dans `devDependencies` mais si aucune classe Tailwind n'est utilisée dans les JSX, c'est une dépendance morte qui alourdit le bundle de build.

**[MINEUR]** `electron` v36 est récent. `react` v19 est la dernière version majeure. Pas de dépendances manifestement obsolètes ou vulnérables détectées.

---

### Documentation

- `README.md` est le **template par défaut de Vite** — il ne décrit pas QOMET
- Aucun document d'installation, de configuration des variables d'environnement, ou de procédure de build
- Les commentaires inline sont en français, ce qui est cohérent mais réduit la contributabilité internationale
- Pas de `.env.example` documentant `VITE_SERVER_URL`

---

## 7. AUDIT SÉCURITÉ

### OWASP Top 10

**A01 — Broken Access Control**

**[CRITIQUE]** `DELETE /parties/{code}` (routes.py:53) : aucune autorisation. Quiconque peut supprimer n'importe quelle partie. Voir section 2.

**[CRITIQUE]** `POST /local/register` (main.py:86) : aucune authentification. Hijacking de session possible. Voir section 2.

---

**A03 — Injection**

**[MOYEN] Emplacement : `electron/main.js:376-384` · Problème : Commandes shell via `exec()` — risque faible mais pattern dangereux**

```javascript
const cmds = [
    'netsh advfirewall firewall delete rule name="QOMET"',
    ...
].join(' & ')
exec(cmds, () => {})
```

Les chaînes sont **hardcodées**, donc pas d'injection possible ici. Mais le pattern `exec(cmd)` avec `.join(' & ')` est dangereux si des variables utilisateur sont jamais incluses. À surveiller.

**[CRITIQUE] Emplacement : `electron/preload.js:11` · Problème : `shell.openExternal(url)` sans validation**

```javascript
ouvrirURL: (url) => ipcRenderer.invoke('ouvrir-url', url),
// Dans main.js :
ipcMain.handle('ouvrir-url', (_, url) => shell.openExternal(url))
```

**Pourquoi c'est extrêmement important :** Si le renderer est compromis (XSS dans une dépendance, injection de code), un attaquant peut appeler `window.electronAPI.ouvrirURL('file:///etc/passwd')` ou un schéma arbitraire (`ms-settings:`, `steam://`...). `shell.openExternal` avec un schéma `file://` peut exécuter du code arbitraire sur Windows.

**Correctif obligatoire :**
```javascript
// Dans main.js
ipcMain.handle('ouvrir-url', (_, url) => {
    if (!/^https?:\/\//.test(url)) return  // uniquement HTTP/HTTPS
    shell.openExternal(url)
})
```

---

**A05 — Security Misconfiguration**

- CORS `allow_origins=["*"]` (voir section 4)
- DevTools accessibles via Ctrl+Shift+I en production (`electron/main.js:365-367`) — fonctionnalité debug laissée en prod

---

**A06 — Vulnerable and Outdated Components**

Pas de `package-lock.json` audité. Recommandation : exécuter `npm audit` et `pip-audit` régulièrement.

---

**A08 — Software and Data Integrity Failures**

**[MOYEN]** Le binaire Python `qomet-server.exe` est distribué sans signature de code. Sur Windows, le SmartScreen peut bloquer son exécution. Sur macOS, le binaire est contourné via `xattr -d com.apple.quarantine` au runtime — ce qui bypasse la vérification d'intégrité de Gatekeeper.

---

**A10 — Server-Side Request Forgery**

**[MOYEN] Emplacement : `backend/api/routes.py:23-38`** · Le backend ne fait pas de SSRF lui-même, mais l'endpoint `/local/find/{code}` retourne une IP fournie par un client tiers. Le frontend de l'utilisateur rejoignant fait ensuite une connexion vers cette IP. Si l'IP est `127.0.0.1:3306` (MySQL local de Railway), le rejoignant tenterait une connexion vers la DB interne. Risque faible en pratique mais réel.

**Correctif :** Valider que l'IP retournée est une IP privée RFC1918 (10.x, 172.16-31.x, 192.168.x) et non loopback, ni une IP Railway interne.

---

**Données sensibles exposées**

- `ONLINE_URL` hardcodé dans `config.js` — acceptable, c'est une URL publique
- Aucun secret, token, ou clé API n'est visible dans le code source — **bien**
- L'IP locale de l'hôte est stockée sur Railway sans TTL court ni chiffrement — exposition de l'IP privée d'un utilisateur à quiconque connaît son code de 4 caractères

---

## 8. SYNTHÈSE EXÉCUTIVE

### Score de santé global de l'architecture : **6 / 10**

**Justification :** L'architecture core (séparation domain/API, Zustand, routing) est propre et bien pensée. La logique de jeu Python est solide. Le projet est fonctionnel et les choix techniques sont cohérents. Le score est pénalisé par : l'absence totale de tests, plusieurs failles de sécurité critiques, le God File `main.py`, et la duplication de code dans le frontend.

---

### Top 5 des problèmes critiques à corriger immédiatement

| # | Problème | Fichier | Risque |
|---|---|---|---|
| 1 | `shell.openExternal(url)` sans validation du schéma | `electron/main.js:419`, `preload.js:11` | Exécution de code arbitraire si XSS |
| 2 | `DELETE /parties/{code}` sans auth — suppression de parties en cours | `backend/api/routes.py:53` | Perturbation de service |
| 3 | `POST /local/register` sans auth — hijacking de session réseau | `backend/main.py:86` | Man-in-the-middle sur LAN |
| 4 | Race condition sur `rooms` dict entre thread UDP et coroutines FastAPI | `backend/network/manager.py:6` | Corruption état en conditions concurrentes |
| 5 | `assert` en production dans `board.py:50` — désactivable par optimiseur Python | `backend/game/board.py:50` | Crash serveur silencieux en production |

---

### Top 5 des améliorations à moyen terme

| # | Amélioration | Impact |
|---|---|---|
| 1 | Ajouter des tests (pytest backend + Vitest frontend) | Éviter les régressions à chaque modification |
| 2 | Éclater `backend/main.py` en modules séparés (events.py, signaling.py, static.py) | Maintenabilité, lisibilité |
| 3 | Extraire le composant `<CodeInput>` pour éliminer la duplication dans VueAccueil | DRY, cohérence UX |
| 4 | Restreindre CORS à l'origine Railway en production | Sécurité API |
| 5 | Ajouter un TTL court (5 min) et nettoyage des rooms orphelines | Stabilité mémoire en production Railway |

---

### Points positifs à conserver

- **Séparation domain model** : `board/game/rules/player` — exemplaire pour un projet de cette taille
- **Minimax avec alpha-bêta et move ordering** : implémentation correcte et optimisée
- **Stratégie de découverte réseau multi-couches** (UDP → ARP → scan → Railway) : robuste face aux différentes topologies
- **Zustand** : utilisé de façon appropriée, store bien structuré avec `reinitialiser()`
- **`contextBridge` avec `contextIsolation: true`** : sécurité Electron correcte (pas de `nodeIntegration: true`)
- **Profondeur adaptative du Minimax** en phase de pose : bonne décision d'optimisation
- **Gestion de la déconnexion** : salle d'attente vs partie en cours traitées différemment (`manager.py:133-139`)

---

### Priorités de refactoring recommandées

**Sprint 1 — Sécurité (1 semaine)**
1. Valider `url` dans `shell.openExternal`
2. Supprimer ou sécuriser `DELETE /parties/{code}`
3. Ajouter validation IP dans `/local/register`
4. Restreindre CORS

**Sprint 2 — Fiabilité (2 semaines)**
1. Remplacer `assert` par `ValueError` dans `board.py`
2. Ajouter `asyncio.Lock` pour `rooms`
3. Ajouter TTL et nettoyage rooms orphelines
4. Premiers tests pytest sur `Rules` et les routes REST

**Sprint 3 — Qualité code (2 semaines)**
1. Éclater `main.py` en modules
2. Extraire `<CodeInput>` dans VueAccueil
3. Importer `LOCAL_URL` depuis config dans router
4. Corriger les strings hardcodées en français dans i18n
5. Écrire le vrai `README.md` avec guide d'installation

---

*Audit réalisé sur la base du code source du dépôt — branche `maissa/main` — commit de référence `eab285b`.*
