# Fonctionnement réseau de QOMET

Ce document explique comment deux joueurs se trouvent et communiquent dans QOMET.

---

## Vue d'ensemble

Il y a **trois couches réseau** distinctes :

```
┌─────────────────────────────────────────────────────────┐
│  1. Découverte  — comment les machines se trouvent      │
│     UDP broadcast + Railway (signaling cloud)           │
├─────────────────────────────────────────────────────────┤
│  2. Vérification — est-ce que la partie existe ?        │
│     HTTP REST  GET /parties/{code}                      │
├─────────────────────────────────────────────────────────┤
│  3. Jeu en temps réel — coups, pause, fin               │
│     Socket.io (WebSocket)                               │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Découverte — comment les machines se trouvent

Quand le joueur B veut rejoindre le joueur A, il doit d'abord trouver l'adresse IP de A sur le réseau. Il n'y a pas d'IP fixe connue à l'avance — il faut la découvrir.

### 1a. UDP Broadcast (découverte locale)

**Principe :** A crie son IP sur le réseau, B écoute.

```
Machine A (hôte)                    Machine B (rejoignant)
     │                                       │
     │  demarrerBroadcast(code)              │
     │  → getLocalIPsAsync()                 │
     │    attend DHCP si besoin (jusqu'à 5s) │
     │  → IP trouvée : 172.20.10.3           │
     │                                       │
     │  toutes les 500ms :                   │
     │  envoie UDP sur port 7778             │
     │  vers 255.255.255.255                 │
     │  et vers 172.20.10.255                │
     │  { type:"QOMET_HOST",                 │
     │    ip:"172.20.10.3",                  │  ecouterBroadcastUDP(code, 4000ms)
     │    port:7777,          ─────────────► │  reçoit le paquet
     │    code:"ABCD" }                      │  → retourne "http://172.20.10.3:7777"
```

**Fichier concerné :** `electron/main.js` → `demarrerBroadcastHote()` et `ecouterBroadcastUDP()`

**Pourquoi ça marche (ou pas) :**
- ✅ Même sous-réseau WiFi / hotspot → les paquets broadcast atteignent tous les appareils
- ❌ Réseaux avec isolation AP (certains hotspots, réseau universitaire) → les broadcasts sont bloqués entre appareils
- ❌ Deux réseaux différents (ex: A sur WiFi, B sur 4G) → pas de broadcast possible

---

### 1b. Railway Signaling (découverte cloud)

**Principe :** A dépose son IP sur un serveur cloud, B vient la récupérer.

```
Machine A (hôte)              Railway (cloud)         Machine B (rejoignant)
     │                             │                         │
     │  POST /local/register       │                         │
     │  { code:"ABCD",             │                         │
     │    ip:"172.20.10.3",  ────► │  stocke en mémoire      │
     │    port:7777 }              │  { ABCD → 172.20.10.3 } │
     │                             │                         │
     │                             │   GET /local/find/ABCD  │
     │                             │ ◄───────────────────────│
     │                             │  { ip:"172.20.10.3",    │
     │                             │    port:7777 }    ─────►│
     │                             │                         │  → résolu !
```

**Fichier concerné :**
- Enregistrement : `frontend/src/pages/Reseau/index.jsx` → `handleCreer()`
- Récupération : `frontend/src/pages/Reseau/index.jsx` → `handleRejoindre()`
- Serveur : `backend/main.py` → `/local/register` et `/local/find/{code}`

**Pourquoi ça marche même sur des réseaux différents :**
Railway est accessible depuis Internet. A et B n'ont pas besoin d'être sur le même réseau pour communiquer avec Railway. En revanche, une fois l'IP connue, la connexion de jeu (Socket.io) est directe A ↔ B — elle nécessite toujours que les deux soient sur le même réseau local.

**Durée de vie :** une entrée Railway expire après 10 minutes (`_LOCAL_TTL = 600`).

---

### 1c. Ordre de priorité dans `handleRejoindre()`

```
B entre le code et clique "Rejoindre"
         │
         ▼
   1. Railway  ──────────────► IP trouvée ? ──► oui → connexion directe
         │ non / timeout 4s
         ▼
   2. UDP broadcast ──────────► IP trouvée ? ──► oui → connexion directe
         │ non / timeout 4s
         ▼
   3. Scan ARP + HTTP  ──────► IP trouvée ? ──► oui → connexion directe
         │ non
         ▼
   Affiche erreur "serveur introuvable"
```

**Fichier concerné :** `frontend/src/pages/Reseau/index.jsx` → `handleRejoindre()` + `electron/main.js` → `trouverServeur()`

---

## 2. Vérification — est-ce que la partie existe ?

Une fois l'IP trouvée, B fait une requête HTTP pour confirmer que la room existe et n'est pas déjà pleine.

```
B  →  GET http://172.20.10.3:7777/parties/ABCD
A  ←  { code:"ABCD", existe:true, joueurs_connectes:1, pleine:false }
```

Si `pleine: true` → B affiche une erreur.
Si 404 → la room n'existe plus (A a annulé).

**Fichiers concernés :**
- Côté B : `frontend/src/api/parties.js` → `verifierPartie()`
- Côté A : `backend/api/routes.py` → `GET /parties/{code}`

---

## 3. Jeu en temps réel — Socket.io

Une fois l'IP trouvée et la partie vérifiée, **tout passe par Socket.io** (WebSocket).

### 3a. Connexion et rejoindre la room

```
B  →  socket.connect("http://172.20.10.3:7777")
B  →  emit("rejoindre", { code:"ABCD", prenom:"Alice" })
A  ←  emit("room_rejointe", { code:"ABCD" })   (confirmation à B)

Si la room est maintenant pleine (2 joueurs) :
A  →  emit("partie_demarree", { plateau, joueurs, ... })  ← broadcast à toute la room
```

### 3b. Pendant la partie

```
Joueur actif                    Serveur (backend de A)              Adversaire
     │                                  │                               │
     │  emit("deplacements_valides",    │                               │
     │        { row:3, col:3 })   ────► │  calcule les coups légaux     │
     │  ◄────────────────────────────── │  emit("coups_valides", {...}) │
     │                                  │                               │
     │  emit("jouer",                   │                               │
     │        { type:"deplacement",     │                               │
     │          coup:[3,3,4,4] }) ────► │  vérifie le coup              │
     │                                  │  applique sur le board        │
     │  ◄────────────────────────────── │  emit("etat", {...})  ───────►│
     │                                  │                               │
     │  (si fin de partie)              │                               │
     │  ◄────────────────────────────── │  emit("carre_gagnant", {...}) │
     │  ◄────────────────────────────── │  emit("fin_partie", {...}) ──►│
```

### 3c. Pause et déconnexion

```
Joueur A met en pause :
A  →  emit("pause")
B  ←  emit("adversaire_en_pause")   (B voit le modal pause)

Joueur B se déconnecte brutalement :
serveur détecte disconnect(sid)
A  ←  emit("adversaire_deconnecte")  → A gagne par forfait
```

**Fichiers concernés :**
- Événements serveur : `backend/main.py`
- Événements client : `frontend/src/hooks/useSocket.js` (écoute) + `frontend/src/hooks/useGameActions.js` (envoi)

---

## 4. Architecture Socket unique (singleton)

Le socket est un **singleton de module** dans `useSocket.js` :

```js
let socket = null  // une seule instance dans toute l'app

export function getSocket() {
  if (!socket) socket = io(SERVER_URL, { autoConnect: false })
  return socket
}

export function resetSocketToServer(serverUrl) {
  if (socket) { socket.disconnect(); socket = null }
  socket = io(serverUrl, { autoConnect: false })
  return socket
}
```

**Pourquoi un singleton :** Socket.io maintient une connexion persistante. Si on créait un nouveau socket à chaque composant, on aurait des dizaines de connexions en parallèle.

**Problème de changement de serveur :** En mode LAN, B doit passer du serveur LOCAL (son propre backend) au serveur de A. On appelle `resetSocketToServer(IP_de_A)` pour couper l'ancien et en créer un nouveau.

**Règle importante :** Quand on quitte `/jeu`, le router (`router/index.jsx`) reset automatiquement le socket vers `LOCAL_URL` pour que la prochaine partie reparte proprement.

---

## 5. Le pont Electron (IPC)

L'Electron main process et le renderer (React) ne peuvent pas se parler directement pour des raisons de sécurité. Tout passe par le **bridge IPC** :

```
React (renderer)                    Electron (main process)
      │                                      │
      │  window.electronAPI                  │
      │    .demarrerBroadcast("ABCD") ─────► │  ipcMain.handle('demarrer-broadcast')
      │                                      │  → demarrerBroadcastHote("ABCD")
      │                                      │  → getLocalIPsAsync()
      │                                      │  → start UDP every 500ms
      │  ◄──────────────────────────────────  │  return "172.20.10.3"
      │                                      │
      │    .trouverServeur("ABCD")   ─────► │  trouverServeur("ABCD")
      │                                      │  → ecouterBroadcastUDP (4s)
      │                                      │  → getArpIPs()
      │                                      │  → scan HTTP subnet
      │  ◄──────────────────────────────────  │  return "http://172.20.10.3:7777"
```

**Fichiers concernés :**
- Déclaration des fonctions exposées : `electron/preload.js`
- Implémentation : `electron/main.js` → section `ipcMain.handle(...)`

---

## 6. Pourquoi ça ne marche pas dans certains cas

| Scénario | Raison | Solution |
|----------|--------|----------|
| Réseau universitaire | Isolation AP bloque UDP + TCP entre appareils | Hotspot personnel |
| Hotspot iPhone (certains) | UDP broadcast non relayé entre appareils | Vérifier que Railway a bien l'IP |
| Windows — machine ne peut pas être hôte | Pare-feu bloque TCP entrant sur port 7777 | Lancer PowerShell admin + `netsh advfirewall firewall add rule name="QOMET" dir=in action=allow protocol=TCP localport=7777 profile=any` |
| IP `127.0.0.1` enregistrée sur Railway | DHCP pas encore assigné au moment du broadcast | Notre fix `getLocalIPsAsync()` attend jusqu'à 5s |
| Mac "address in use" | Ancienne instance du backend toujours sur le port | Notre fix kill-port avant de démarrer |
| Rôles inversés (2ème partie) | Socket avec listeners périmés de la 1ère partie | Notre fix `connecterSocket` recrée toujours un socket frais |

---

## 7. Schéma global d'une session complète

```
A lance l'app          B lance l'app
      │                      │
      │  backend démarre      │  backend démarre
      │  sur 127.0.0.1:7777  │  sur 127.0.0.1:7777
      │                      │
A clique "Créer"             │
      │                      │
      │  POST /parties        │
      │  ← { code:"ABCD" }   │
      │                      │
      │  socket → LOCAL:7777  │
      │  emit("rejoindre")    │
      │                      │
      │  UDP broadcast toutes │
      │  les 500ms sur :7778  │
      │                      │
      │  POST Railway         │
      │  /local/register      │  B entre "ABCD" et clique "Rejoindre"
      │                      │
      │                      │  GET Railway /local/find/ABCD
      │                      │  ← IP de A
      │                      │
      │                      │  GET http://IP_A:7777/parties/ABCD
      │                      │  ← { pleine:false }
      │                      │
      │                      │  socket → IP_A:7777
      │                      │  emit("rejoindre")
      │                      │
      │◄─────────────────────│─ emit("partie_demarree") broadcast room
      │                      │
      │      JEU EN COURS — tout passe par socket vers IP_A:7777
      │                      │
      │  emit("jouer")  ────►│
      │◄──── emit("etat") ───┤
      │                      │
      │  fin de partie        │
      │◄─ emit("fin_partie") ►│
      │                      │
A clique "Retour"    B clique "Retour"
      │                      │
      │  router reset socket  │  router reset socket
      │  vers LOCAL:7777      │  vers LOCAL:7777
      │                      │
      │    Prêts pour une nouvelle partie (rôles peuvent s'inverser)
```
