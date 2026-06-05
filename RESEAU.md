# Architecture réseau de QOMET

> Document de référence pour la soutenance — couvre l'intégralité de la couche réseau de l'application.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Le serveur backend (Python / FastAPI / Socket.IO)](#2-le-serveur-backend)
3. [Le client frontend (React / Socket.IO-client)](#3-le-client-frontend)
4. [La couche réseau Electron (IPC + découverte)](#4-la-couche-réseau-electron)
5. [Modes de connexion : local vs Railway](#5-modes-de-connexion)
6. [Découverte de l'hôte en 3 niveaux](#6-découverte-de-lhôte-en-3-niveaux)
7. [Signaling Railway (relais d'annonce)](#7-signaling-railway)
8. [Détection et sélection de l'IP locale](#8-détection-et-sélection-de-lip-locale)
9. [Pare-feu Windows](#9-pare-feu-windows)
10. [Cycle de vie complet d'une partie réseau](#10-cycle-de-vie-complet)
11. [Événements Socket.IO](#11-événements-socketio)
12. [Problèmes réels résolus et pourquoi](#12-problèmes-résolus)
13. [Limites connues](#13-limites-connues)

---

## 1. Vue d'ensemble

QOMET est une application de jeu de plateau en temps réel qui fonctionne dans **deux contextes très différents** :

| Contexte | Backend | Transport | Découverte |
|---|---|---|---|
| **Application Electron (réseau local)** | Serveur Python embarqué sur la machine hôte | Socket.IO vers `localhost:7777` ou IP locale | UDP broadcast + ARP + scan HTTP + signaling Railway |
| **Navigateur web (Railway)** | Instance Railway partagée | Socket.IO vers `window.location.origin` | Aucune (URL fixe) |

La particularité de QOMET est que **l'hôte embarque le serveur de jeu directement sur sa machine**. Il n'y a pas de serveur central dédié aux parties — chaque partie tourne sur l'ordinateur de l'hôte, et le rejoignant s'y connecte directement.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Réseau local (LAN / hotspot)                 │
│                                                                  │
│  ┌──────────────────┐              ┌──────────────────────────┐  │
│  │   Machine HÔTE   │              │    Machine REJOIGNANT    │  │
│  │                  │              │                          │  │
│  │  Electron        │   Socket.IO  │  Electron                │  │
│  │  React UI  ◄────►│◄────────────►│  React UI                │  │
│  │  Python srv      │  port 7777   │  (pas de serveur local)  │  │
│  │  port 7777       │              │                          │  │
│  └──────────────────┘              └──────────────────────────┘  │
│           │                                  │                   │
│           │        UDP broadcast             │                   │
│           └─────── port 7778 ───────────────►│                   │
│                                                                  │
│                       ┌──────────────┐                          │
│                       │ Railway      │  (signaling uniquement)  │
│                       │ /local/reg.  │                          │
│                       └──────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Le serveur backend

**Fichiers :** `backend/main.py`, `backend/network/manager.py`, `app.py`

### Stack technique

- **FastAPI** : framework HTTP asynchrone Python
- **python-socketio** : serveur Socket.IO asynchrone (mode ASGI)
- **uvicorn** : serveur ASGI
- **socketio.ASGIApp** : wrapping de FastAPI dans Socket.IO (les deux partagent le même port)

### Démarrage

```python
# app.py — point d'entrée en développement
uvicorn.run(socket_app, host="0.0.0.0", port=7777)
```

En production Electron, le binaire `qomet-server.exe` (Windows) ou `qomet-server` (Mac/Linux) est compilé avec PyInstaller. Electron le lance via `child_process.spawn` et attend qu'il réponde sur `/health` avant d'ouvrir la fenêtre.

### Routes HTTP exposées

| Méthode | Route | Usage |
|---|---|---|
| `GET` | `/health` | Vérification de vie (polling Electron au démarrage) |
| `GET` | `/info` | Hostname + version (utilisé par scan réseau) |
| `POST` | `/parties` | Créer une room de jeu |
| `GET` | `/parties/{code}` | Vérifier si la room existe et si elle est pleine |
| `POST` | `/local/register` | Hôte enregistre son IP sur Railway |
| `GET` | `/local/find/{code}` | Rejoignant récupère l'IP de l'hôte depuis Railway |
| `GET` | `/assets/*` | Frontend statique (Railway uniquement) |
| `GET` | `/*` | SPA fallback (Railway uniquement) |

### Gestion des rooms (`backend/network/manager.py`)

Une **room** est un dictionnaire Python en mémoire :
```python
rooms["AB3K"] = {
    "game":    Game(...),           # logique de jeu
    "joueurs": {"clair": sid1, "fonce": sid2},  # socket IDs
    "prenoms": {"clair": "Alice",  "fonce": "Bob"},
}
```

Le code de room est généré aléatoirement (4 caractères, alphabet sans ambigus I/O/0/1).

### Serveur UDP embarqué dans le backend

Le backend Python écoute aussi en UDP sur le port **7778** (thread daemon) pour répondre aux sondes de découverte :
```python
# Reçoit {"type":"find","code":"AB3K"}
# Répond  {"type":"found","code":"AB3K"} si la room existe et n'est pas pleine
```
Ce serveur UDP est une **couche de fallback** — en pratique, c'est l'Electron côté hôte qui envoie les broadcasts UDP depuis le processus main, pas le backend Python.

---

## 3. Le client frontend

**Fichiers :** `frontend/src/hooks/useSocket.js`, `frontend/src/pages/Reseau/index.jsx`, `frontend/src/config/config.js`

### Résolution d'URL au démarrage

```javascript
// config/config.js
export const SERVER_URL =
  typeof window !== 'undefined' && !window.electronAPI && window.location.origin.startsWith('http')
    ? window.location.origin   // navigateur → Railway
    : LOCAL_URL                // Electron → localhost
```

La présence de `window.electronAPI` (injectée par le preload Electron) est le seul signal qui différencie les deux environnements.

### Singleton socket

```javascript
let socket = null

export function getSocket() {
  if (!socket) socket = io(SERVER_URL, { autoConnect: false })
  return socket
}
```

Le socket est un **singleton global** : une seule connexion WebSocket existe à tout instant dans l'application. Cela évite les connexions fantômes si le composant se remonte.

### Changement de serveur dynamique

```javascript
export function resetSocketToServer(serverUrl) {
  if (socket) { socket.disconnect(); socket = null }
  socket = io(serverUrl, { autoConnect: false })
  return socket
}
```

Appelée au moment de rejoindre une partie (pour pointer vers l'IP de l'hôte au lieu de `localhost`). Appelée aussi au retour vers l'accueil (pour revenir sur `localhost`).

### Reset automatique en quittant /jeu

```javascript
// router/index.jsx
if (ancienne === '/jeu' && nouvelle !== '/jeu' && window.electronAPI) {
  const current = getSocket()
  if (current.io?.uri !== LOCAL_URL) {
    current.disconnect()
    resetSocketToServer(LOCAL_URL)
  }
}
```

Garantit que quitter la page de jeu réinitialise toujours le socket, même si le joueur n'est pas passé par la page Réseau.

---

## 4. La couche réseau Electron

**Fichier :** `electron/main.js`  
**Fichier :** `electron/preload.js`

### Architecture IPC

Electron sépare strictement le processus **main** (Node.js, accès OS) du processus **renderer** (React, sandboxé). La communication passe par IPC :

```
React (renderer)
    │  window.electronAPI.trouverServeur(code)
    │
    ▼
preload.js  →  ipcRenderer.invoke('trouver-serveur', code)
    │
    ▼
main.js     →  ipcMain.handle('trouver-serveur', (_, code) => trouverServeur(code))
    │
    ▼
Résultat renvoyé via Promise
```

Le preload expose uniquement les fonctions explicitement listées dans `contextBridge.exposeInMainWorld` — aucun accès Node direct depuis React.

### Fonctions réseau exposées via IPC

| API React (`window.electronAPI`) | Implémentation `main.js` |
|---|---|
| `getLocalIP()` | Retourne la meilleure IP locale filtrée |
| `trouverServeur(code)` | Découverte multi-étapes (UDP → ARP → scan) |
| `demarrerBroadcast(code)` | Lance le broadcast UDP hôte, retourne l'IP |
| `arreterBroadcast()` | Arrête le broadcast UDP |
| `scanReseau()` | Scan complet ARP + HTTP du sous-réseau |
| `getNetworkInfo()` | Diagnostic : IPs locales, sous-réseaux, voisins ARP |

---

## 5. Modes de connexion

### Mode local (Electron)

1. L'hôte démarre son serveur Python sur `0.0.0.0:7777`
2. Le client React de l'hôte se connecte à `http://127.0.0.1:7777`
3. Le rejoignant découvre l'IP de l'hôte (voir section 6)
4. Le client React du rejoignant se connecte à `http://<IP_HÔTE>:7777`

### Mode en ligne (navigateur ou Railway)

1. Le frontend et le backend sont hébergés ensemble sur Railway
2. `SERVER_URL = window.location.origin` (ex : `https://qomet-production.up.railway.app`)
3. Pas de découverte, pas d'IP locale — tout passe par Railway
4. Les deux joueurs se connectent à la même URL publique

### Cohabitation des deux modes

Il est possible pour l'hôte de créer une partie en local (Electron) et d'avoir un rejoignant depuis un navigateur Railway. Dans ce cas, Railway n'a pas accès au serveur de l'hôte — les deux joueurs doivent être sur le **même réseau local**, ou l'hôte doit rendre son port accessible (ce qui n'est pas prévu).

---

## 6. Découverte de l'hôte en 3 niveaux

**Fichier :** `electron/main.js` — fonction `trouverServeur(code)`

Quand un joueur tente de rejoindre une partie en local, l'application cherche le serveur de l'hôte selon trois stratégies ordonnées par rapidité.

### Niveau 0 : Signaling Railway (préalable à `trouverServeur`)

Avant même d'appeler `trouverServeur`, le frontend interroge Railway pour obtenir l'IP de l'hôte :

```javascript
const res = await fetch(`${ONLINE_URL}/local/find/${code}`, { signal: AbortSignal.timeout(4000) })
if (res.ok) {
  const info = await res.json()
  if (info.ip && info.ip !== '127.0.0.1') {
    resolvedURL = `http://${info.ip}:${info.port}`
    // → connexion directe, pas de découverte locale
  }
}
```

Si Railway retourne une IP valide, les trois niveaux suivants sont **court-circuités**.

### Niveau 1 : UDP broadcast (4 secondes)

L'hôte envoie en boucle (toutes les 500 ms) un datagramme UDP en broadcast :

```json
{ "type": "QOMET_HOST", "ip": "192.168.1.42", "port": 7777, "code": "AB3K" }
```

Le rejoignant ouvre une socket UDP et écoute sur le port **7778** pendant 4 secondes. Dès qu'il reçoit un paquet avec le bon code, il se connecte à l'IP annoncée.

```
HÔTE                          REJOIGNANT
  │                                │
  ├──UDP 255.255.255.255:7778──────►│  { type:"QOMET_HOST", ip:"...", code:"AB3K" }
  ├──UDP 192.168.1.255:7778─────────►│
  │                                │
  │◄── connexion TCP 7777 ─────────┤
```

**Avantage :** aucune configuration, fonctionne instantanément sur un réseau sans restrictions broadcast (la plupart des hotspots personnels).

**Limite :** certains routeurs/WiFi d'entreprise bloquent les broadcasts UDP (client isolation). Dans ce cas, passage au niveau 2.

### Niveau 2 : ARP (cache réseau)

Si l'UDP n'a rien donné, l'application lit la table ARP du système d'exploitation :

```bash
# Windows
arp -a
# macOS/Linux
arp -n
```

La table ARP liste les machines avec lesquelles on a récemment communiqué. Si l'hôte et le rejoignant ont déjà échangé du trafic réseau (même un simple ping), l'IP de l'hôte apparaît ici. L'application teste ensuite le port 7777 sur chaque IP ARP :

```
Pour chaque IP dans arp -a :
  1. TCP connect port 7777 (timeout 500ms) → port ouvert ?
  2. GET /health (timeout 1000ms) → serveur QOMET ?
  3. GET /parties/{code} → room disponible ?
```

**Avantage :** plus rapide qu'un scan complet, exploite les connexions existantes.

**Limite :** si les deux machines n'ont jamais communiqué, la table ARP est vide.

### Niveau 3 : Scan HTTP du sous-réseau

Dernier recours : l'application calcule le(s) sous-réseau(s) de l'hôte et teste toutes les 254 IPs possibles, par batches de 30 en parallèle (timeout TCP 400ms, puis HTTP /health 1000ms).

```
Sous-réseau 192.168.1.0/24 → 254 IPs
Batch 1 : 192.168.1.1–30  (parallèle, ~400ms)
Batch 2 : 192.168.1.31–60 (parallèle, ~400ms)
...
Arrêt dès qu'un serveur QOMET est trouvé
```

S'il trouve un serveur QOMET mais que le code n'y existe pas → retourne `'INVALID_CODE'` (message d'erreur distinct : "code invalide" plutôt que "serveur introuvable").

---

## 7. Signaling Railway

**Fichier :** `backend/main.py` — routes `/local/register` et `/local/find/{code}`

Railway joue le rôle de **relais d'annonce** : l'hôte y publie son IP locale, le rejoignant la récupère. C'est une alternative plus rapide et plus fiable que la découverte locale quand les deux machines ont accès à internet.

### Enregistrement (côté hôte)

Après avoir créé la partie, l'hôte démarre le broadcast UDP et utilise l'IP retournée pour s'enregistrer sur Railway :

```javascript
window.electronAPI.demarrerBroadcast(data.code)
  .then(broadcastIP => {
    if (!broadcastIP) return  // pas d'IP valide → pas d'enregistrement
    fetch(`${ONLINE_URL}/local/register`, {
      method: 'POST',
      body: JSON.stringify({ code: data.code, ip: broadcastIP, port: 7777 }),
    })
  })
```

L'IP enregistrée est **la même** que celle broadcastée en UDP — cohérence garantie.

### Stockage côté Railway

```python
_local_registry: dict[str, dict] = {}  # code → { ip, port, at }
_LOCAL_TTL = 600  # 10 minutes
```

Les entrées expirent après 10 minutes. Purge automatique à chaque POST.

### Récupération (côté rejoignant)

```javascript
const res = await fetch(`${ONLINE_URL}/local/find/${code}`, { signal: AbortSignal.timeout(4000) })
// → { "ip": "192.168.1.42", "port": 7777 }
```

Validation : si l'IP retournée est `127.0.0.1`, elle est ignorée (cela signifierait que l'hôte a enregistré son loopback par erreur).

---

## 8. Détection et sélection de l'IP locale

**Fichier :** `electron/main.js` — fonctions `getLocalIPs()`, `scoreIP()`, `getLocalIPsAsync()`

C'est l'un des problèmes les plus complexes de l'application : sur Windows/Mac, `os.networkInterfaces()` retourne tous les adaptateurs réseau dans un ordre non déterministe. Sans traitement, l'application peut retourner une IP de VirtualBox, de Docker ou de Bluetooth au lieu de l'IP WiFi réelle.

### Filtrage des adaptateurs par nom

```javascript
const ADAPTATEURS_VIRTUELS = [
  'hyper', 'vethernet', 'vmware', 'virtualbox', 'vbox',
  'wsl', 'bluetooth', 'virtual', 'vpn', 'tap', 'tunnel', 'loopback'
]
// Exemple : "VirtualBox Host-Only Network" → lower = "virtualbox host-only network" → exclu
```

### Filtrage des plages IP réservées

```javascript
const PLAGES_VIRTUELLES = [
  '192.0.0.',   // IANA réservé / USB Apple (iPhone tethering USB Windows)
  '169.254.',   // APIPA link-local — pas de DHCP répondu
  '192.168.56.' // VirtualBox Host-Only (plage par défaut, jamais utilisée par de vrais routeurs)
]
```

**Pourquoi `192.168.56.x` et pas `192.168.100.x` ?**  
`192.168.56.x` est la plage par défaut des adaptateurs Host-Only VirtualBox — aucun vrai routeur grand public ne l'utilise. En revanche, `192.168.100.x` est utilisée par les Box Bouygues (Bbox) pour les connexions WiFi réelles : la filtrer casserait l'application sur ce réseau.

### Scoring et tri

```javascript
function scoreIP(ip) {
  if (ip.startsWith('172.')) return 3   // hotspot iPhone — typiquement 172.20.10.x
  if (ip.startsWith('192.168.')) return 2  // WiFi maison / box
  if (ip.startsWith('10.')) return 1    // réseau d'entreprise
  return 0
}
// getLocalIPs() retourne result.sort((a, b) => scoreIP(b) - scoreIP(a))
```

La meilleure IP est toujours en premier. `getLocalIP()` retourne simplement `getLocalIPs()[0]`.

### Attente DHCP

```javascript
async function getLocalIPsAsync() {
  for (let i = 0; i < 5; i++) {
    const ips = getLocalIPs()
    if (ips.length > 0) return ips
    await new Promise(r => setTimeout(r, 1000))
  }
  return []
}
```

Utilisée exclusivement par `demarrerBroadcastHote`. Attend jusqu'à **5 secondes** après connexion au hotspot pour que le DHCP assigne une IP. Évite de broadcaster `null` ou de stocker `127.0.0.1` dans Railway.

---

## 9. Pare-feu Windows

Le pare-feu Windows bloque par défaut les connexions entrantes. Sans règle explicite, l'hôte reçoit les paquets mais ne répond pas — la connexion **pend silencieusement pendant 10 secondes** (DROP) avant le timeout côté rejoignant.

### Règles installées via NSIS (`installer.nsh`)

```nsis
!macro customInstall
  nsExec::Exec 'netsh advfirewall firewall delete rule name="QOMET"'
  nsExec::Exec 'netsh advfirewall firewall add rule name="QOMET" dir=in action=allow protocol=TCP localport=7777 profile=any'
  nsExec::Exec 'netsh advfirewall firewall add rule name="QOMET-UDP" dir=in action=allow protocol=UDP localport=7778 profile=any'
!macroend
```

- **TCP 7777** : connexions Socket.IO des joueurs rejoignants
- **UDP 7778** : réception des broadcasts de découverte
- `profile=any` : s'applique aux profils Domaine, Privé **et Public** — indispensable pour les hotspots (classés "Public" par Windows)

### Pourquoi `perMachine: true` dans `package.json`

```json
"nsis": {
  "oneClick": true,
  "perMachine": true,
  "runAfterFinish": true,
  "include": "installer.nsh"
}
```

Sans `perMachine`, l'installeur s'exécute en contexte utilisateur sans élévation UAC. Les commandes `netsh` échouent silencieusement car elles nécessitent des droits administrateur. Avec `perMachine`, l'installeur demande l'UAC et les règles sont ajoutées avec les droits suffisants.

### Correction au démarrage de l'app

```javascript
function fixerParefeuWindows() {
  if (process.platform !== 'win32') return
  const cmds = [
    'netsh advfirewall firewall delete rule name="QOMET"',
    'netsh advfirewall firewall delete rule name="QOMET-UDP"',
    'netsh advfirewall firewall add rule name="QOMET" dir=in action=allow protocol=TCP localport=7777 profile=any',
    'netsh advfirewall firewall add rule name="QOMET-UDP" dir=in action=allow protocol=UDP localport=7778 profile=any',
  ].join(' & ')
  exec(cmds, () => {})
}
```

Tentative silencieuse à chaque démarrage. Réussit si l'app a les droits admin (cas de l'installeur `perMachine`), ignorée sinon.

---

## 10. Cycle de vie complet

### Côté hôte

```
1. Electron démarre → demarrerBackend() → attendreBackend() (polling /health toutes 500ms)
2. Fenêtre ouverte → React monte → socket connecté à localhost:7777
3. Hôte saisit prénom → handleCreer()
4.   → POST /parties (crée la room, retourne le code)
5.   → connecterSocket(LOCAL_URL)  → écoute "partie_demarree"
6.   → s.emit("rejoindre", { code, prenom })
7.   → setVue("attente")  [affiche le code à l'écran]
8.   → demarrerBroadcast(code)  → UDP 255.255.255.255:7778 toutes 500ms
9.   → POST /local/register { code, ip: broadcastIP, port: 7777 }  [Railway]
10. Rejoignant se connecte → "partie_demarree" reçu → navigate("/jeu")
11. arreterBroadcast()  [automatique via "partie_demarree" event]
```

### Côté rejoignant

```
1. Rejoignant saisit code + prénom → handleRejoindre()
2.   → GET /local/find/{code} sur Railway (timeout 4s)
     Si IP valide → resolvedURL = "http://<IP>:7777" → aller en 6
     Sinon → aller en 3
3.   → trouverServeur(code) [IPC → main.js]
4.     → ecouterBroadcastUDP(code, 4000)
       Si hôte trouvé → aller en 6
       Sinon → aller en 5
5.     → Scan ARP + HTTP
       Si trouvé → aller en 6
       Si INVALID_CODE → setVue("code_invalide")
       Si null → setVue("erreur")
6.   → verifierPartie(code, resolvedURL)  [GET /parties/{code}]
     Si pleine → setVue("erreur")
7.   → resetSocketToServer(resolvedURL)  [socket pointe vers l'IP de l'hôte]
8.   → s.connect() → s.emit("rejoindre", { code, prenom })
9.   → Serveur émet "partie_demarree" → navigate("/jeu")
```

### Fin de partie

```
Scénario A — victoire normale
  → sio.emit("fin_partie", { gagnant: "Alice" })  [backend vers les 2 joueurs]
  → setGagnant({ nom: "Alice" }) dans le store
  → ModalFinPartie s'affiche, popups pause/abandon disparaissent (condition !gagnant)

Scénario B — abandon
  → s.emit("abandonner")
  → sio.emit("adversaire_deconnecte", {...})  [aux 2 joueurs]
  → setGagnant({ nom: prenomJoueur, forfait: true })  [victoire par forfait]
  → navigate("/")  [hôte rentré au menu]

Scénario C — déconnexion réseau
  → event "adversaire_deconnecte" socket.io
  → même comportement que scénario B
```

---

## 11. Événements Socket.IO

### Client → Serveur

| Événement | Données | Action |
|---|---|---|
| `rejoindre` | `{ code, prenom }` | Entrer dans la room |
| `quitter` | — | Quitter la room (salle d'attente) |
| `jouer` | `{ type, row, col }` ou `{ type, coup }` | Jouer un coup |
| `deplacements_valides` | `{ row, col }` | Demander les coups légaux |
| `abandonner` | — | Abandonner la partie |
| `pause` | — | Mettre en pause |
| `reprendre` | — | Reprendre après pause |
| `coup_ia` | `{ niveau }` | Déclencher le coup de l'IA |

### Serveur → Client

| Événement | Données | Signification |
|---|---|---|
| `room_rejointe` | `{ code }` | Confirmation d'entrée dans la room |
| `partie_demarree` | état complet | Les 2 joueurs sont là, la partie commence |
| `etat` | état complet du plateau | Après chaque coup |
| `coups_valides` | `{ destinations, peut_ejecter }` | Réponse à `deplacements_valides` |
| `carre_gagnant` | `{ cellules, gagnant }` | Carré gagnant à mettre en surbrillance |
| `fin_partie` | `{ gagnant }` | La partie est terminée |
| `adversaire_deconnecte` | `{ message }` | Adversaire parti → victoire par forfait |
| `adversaire_en_pause` | — | Adversaire a mis en pause |
| `adversaire_a_repris` | — | Adversaire a repris |
| `erreur` | `{ code, msg }` | Erreur serveur |

---

## 12. Problèmes résolus

### Erreur "signal is aborted without reason" (asymétrique Windows–Windows)

**Symptôme :** A peut rejoindre B, mais B ne peut pas rejoindre A.  
**Cause :** la machine A avait VirtualBox installé. `os.networkInterfaces()` retournait `192.168.56.1` (adaptateur Host-Only VirtualBox) **avant** l'IP WiFi réelle. Cette IP était broadcastée et enregistrée sur Railway. Côté B, la connexion vers `192.168.56.1:7777` tentait de joindre une IP du réseau interne de A, injoignable depuis B → timeout de 10s → "signal is aborted without reason".  
**Fix :** ajout de `192.168.56.` dans `PLAGES_VIRTUELLES` + scoring IP pour toujours mettre la meilleure IP en premier.

### 127.0.0.1 stocké sur Railway (Mac sur Bouygues)

**Symptôme :** le rejoignant récupère `127.0.0.1` depuis Railway → connexion vers lui-même → échec.  
**Cause :** `192.168.100.x` était dans les plages filtrées. Bouygues Bbox assigne cette plage en WiFi. Le filtre éliminait la seule IP valide → `getLocalIP()` retournait `127.0.0.1` (fallback) → cette valeur était enregistrée sur Railway.  
**Fix :** suppression de `192.168.100.` des plages filtrées + `demarrerBroadcastHote` retourne `null` si IP = `127.0.0.1` (pas d'enregistrement Railway) + le rejoignant ignore l'IP Railway si elle vaut `127.0.0.1`.

### ERR_ADDRESS_IN_USE au rejoint

**Symptôme :** erreur Chrome sur l'hôte quand le rejoignant tentait plusieurs fois.  
**Cause :** `connecterSocket(url)` était appelé **avant** `verifierPartie`. Si la vérification échouait (réseau lent, code invalide), le socket restait connecté sur l'URL distante. À la tentative suivante, un nouveau socket était créé sur la même URL → conflit de port côté Chrome.  
**Fix :** `verifierPartie` est maintenant appelé en premier. Si la vérification échoue → retour accueil sans créer de socket. Si elle réussit → `connecterSocket` est appelé, puis `resetSocketLocal` en cas d'erreur ultérieure.

### Popups pause/abandon qui restent affichées après fin de partie

**Symptôme :** si l'adversaire abandonnait pendant que la popup "Abandonner ?" était ouverte, les deux modals s'empilaient.  
**Fix :** conditions `{pauseVisible && !gagnant && ...}` et `{abandonVisible && !gagnant && ...}` — dès que `gagnant` est défini, les popups disparaissent automatiquement.

---

## 13. Limites connues

### Réseaux avec client isolation (WiFi université / entreprise)

Sur ces réseaux, chaque appareil est isolé des autres (filtrage L2). Les broadcasts UDP ne passent pas et les connexions TCP directes entre clients sont bloquées. **Solution :** utiliser le mode en ligne via Railway (`https://qomet-production.up.railway.app`) depuis un navigateur.

### VMs en mode NAT

Une VM en mode NAT obtient une IP interne (`10.0.2.15`) qui n'est accessible que depuis la machine hôte. Les autres joueurs ne peuvent pas s'y connecter. C'est une limitation de la couche réseau de la VM, pas de QOMET. **Solution :** basculer la VM en réseau "bridged" (ponté) pour obtenir une vraie IP du routeur.

### Sous-réseaux différents

Si l'hôte est sur `192.168.1.x` et le rejoignant sur `10.0.0.x` (ex : deux interfaces réseau actives, ou deux routeurs), le scan de sous-réseau du rejoignant ne couvrira jamais le sous-réseau de l'hôte. Railway contourne ce problème si les deux machines ont internet.

### Ports

- **TCP 7777** : serveur de jeu (WebSocket + HTTP)
- **UDP 7778** : découverte broadcast
- Ces ports doivent être ouverts en entrée sur la machine hôte.
