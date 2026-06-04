# Audit de code — QOMET

> Date : juin 2026  
> Périmètre : backend Python, frontend React, couche Electron  
> Branche auditée : `maissa/main`

---

## 1. Architecture générale

```
QOMET/
├── backend/           Python FastAPI + Socket.io (logique de jeu, IA, réseau)
│   ├── main.py        Serveur principal, événements WS, signaling Railway
│   ├── api/routes.py  Routes HTTP REST (/parties)
│   ├── network/       Gestion des rooms (manager.py)
│   ├── game/          Moteur de jeu (board, rules, game, player)
│   └── ai/            Minimax + évaluateur
├── frontend/src/      React + Vite
│   ├── pages/         Home, Game, IA, Reseau, Parametres
│   ├── hooks/         useSocket, useGameActions, useGameTimer…
│   ├── store/         Zustand (useGameStore)
│   └── api/           Appels HTTP (parties.js)
├── electron/          Electron main process + preload
│   ├── main.js        Backend spawn, IPC, UDP broadcast, scan réseau
│   └── preload.js     Bridge contextBridge → window.electronAPI
└── config/settings.py HOST/PORT depuis variables d'environnement
```

**Points positifs :**
- Séparation claire backend / frontend / couche Electron
- Socket.io uniquement pour le temps réel, REST pour la découverte
- Le moteur de jeu (rules, board, game) est pur et testable indépendamment
- La copie de jeu pour le Minimax évite deepcopy (performance)

---

## 2. Backend Python

### 2.1 `backend/main.py`

**Problèmes identifiés :**

| Sévérité | Problème | Localisation |
|----------|----------|--------------|
| 🔴 Élevée | Fuite de room en salle d'attente : si le créateur seul se déconnecte, `quitter_room(sid)` est appelé mais la room reste dans `rooms` indéfiniment sans joueurs | `disconnect()` — branche `else` |
| 🟡 Moyenne | `_local_registry` n'est purgé que sur écriture (`POST /local/register`) — si aucune nouvelle partie n'est créée, les entrées expirées s'accumulent en mémoire | `local_register()` |
| 🟡 Moyenne | CORS `allow_origins=["*"]` acceptable en local mais dangereux si l'API est exposée publiquement (Railway) | `app.add_middleware(...)` |
| 🟡 Moyenne | `POST /local/register` n'a aucune validation du format d'IP — n'importe quel string peut être enregistré | `local_register()` |
| 🟢 Faible | Pas de rate-limiting sur `POST /parties` — possibilité de créer des milliers de rooms | `routes.py` |
| 🟢 Faible | Le thread UDP daemon ne gère pas proprement l'arrêt (mais `daemon=True` le tue avec le processus) | `_udp_server_thread()` |

**Correction fuite de room :**
```python
# Dans disconnect(), remplacer la branche else par :
else:
    quitter_room(sid)
    # Supprimer la room si elle n'a plus aucun joueur
    if code in rooms:
        r = rooms[code]
        if r["joueurs"]["clair"] is None and r["joueurs"]["fonce"] is None:
            supprimer_room(code)
```

**Correction purge périodique du registre Railway :**
```python
# Ajouter un endpoint de purge ou purger aussi sur GET :
@app.get("/local/find/{code}")
async def local_find(code: str):
    entry = _local_registry.get(code.upper().strip())
    now = time.time()
    # Purge opportuniste
    for k in list(_local_registry):
        if now - _local_registry[k]["at"] > _LOCAL_TTL:
            del _local_registry[k]
    if not entry or now - entry["at"] > _LOCAL_TTL:
        raise HTTPException(status_code=404, detail="not_found")
    return {"ip": entry["ip"], "port": entry["port"]}
```

---

### 2.2 `backend/network/manager.py`

**Points positifs :**
- Code court et lisible
- `quitter_room` appelle `rejoindre_room` pour éviter qu'un SID soit dans 2 rooms simultanément

**Problèmes identifiés :**

| Sévérité | Problème |
|----------|----------|
| 🟡 Moyenne | `rooms` est un dict global — pas de verrou (`Lock`), mais asyncio est single-threaded donc OK en pratique. Le thread UDP daemon y accède (`room_est_pleine`) depuis un autre thread → risque de race condition théorique |
| 🟢 Faible | Les noms des joueurs (`prenoms`) ne sont pas utilisés en dehors de la room — redondance avec `game.joueur1.nom` |

**Correction thread-safety pour le thread UDP :**
```python
import threading
_rooms_lock = threading.Lock()

# Entourer les accès depuis _udp_server_thread avec le lock
with _rooms_lock:
    if code in rooms and not room_est_pleine(code): ...
```

---

### 2.3 `backend/game/rules.py`

**Points positifs :**
- Pré-calcul des 15 carrés au chargement du module (`CARRES_POSSIBLES`) — correct et efficace
- Détection d'annulation de coup implémentée pour `glisser` et `pousser`
- Les directions diagonales sont correctement contraintes aux cases appropriées

**Problème identifié :**

| Sévérité | Problème |
|----------|----------|
| 🟡 Moyenne | `_est_annulation` ne couvre pas le cas `pousser_ejecter` → un joueur pourrait théoriquement annuler un `pousser_ejecter` avec un coup inverse si la pièce éjectée était récupérée |
| 🟢 Faible | `_calculer_carres` itère sur toutes les paires de cases jouables — correct mais O(n²), acceptable car exécuté une seule fois |

---

### 2.4 `backend/ai/minimax.py`

**Points positifs :**
- Alpha-bêta bien implémenté avec `move ordering` superficiel
- Profondeur adaptative : depth=2 en phase de pose (branching élevé), depth=4 en déplacement
- `asyncio.to_thread` évite de bloquer la boucle événements

**Problèmes identifiés :**

| Sévérité | Problème |
|----------|----------|
| 🟡 Moyenne | `_appliquer_board` (version légère pour move ordering) ne met pas à jour `dernier_coup` → les coups légaux calculés dessus ignorent la règle d'annulation pendant le tri |
| 🟢 Faible | `coup_facile` utilise `random.choice` sans vérifier si `coups` est non-vide — corrigé par le `if coups else None` mais sans log d'avertissement |
| 🟢 Faible | La profondeur effective en phase de pose est plafonnée à 2 même pour le niveau Difficile — comportement documenté mais pas évident |

---

## 3. Frontend React

### 3.1 `hooks/useSocket.js`

**Problème critique identifié (corrigé en session) :**

Le socket est un singleton de module. `useSocket()` attache les handlers sur le socket existant au moment du `useEffect` (mount). Si `resetSocketToServer()` est appelé après le mount (ce qu'on faisait dans Reseau/index.jsx), les handlers de `useSocket` restent sur l'ancien socket déconnecté. **Résolu** en faisant toujours `resetSocketToServer` dans `connecterSocket`.

**Problème résiduel :**

| Sévérité | Problème |
|----------|----------|
| 🟡 Moyenne | `getSocketIA()` crée un socket séparé vers `SERVER_URL` mais n'est jamais explicitement fermé — fuite de connexion en mode IA si on revient au menu |
| 🟢 Faible | `useSocket` appelle `s.connect()` à chaque mount même si le socket est déjà connecté — sans effet négatif (socket.io ignore les doubles connect) |

**Correction socketIA :**
```js
// Dans Game.jsx, au unmount :
useEffect(() => {
  return () => {
    const sIA = getSocketIA()
    if (sIA.connected) sIA.disconnect()
  }
}, [])
```

---

### 3.2 `pages/Reseau/index.jsx`

**Points positifs :**
- Fallback Railway → UDP → scan en cascade bien structuré
- Arrêt du broadcast côté hôte quand la partie démarre

**Problèmes identifiés :**

| Sévérité | Problème |
|----------|----------|
| 🟡 Moyenne | Race condition : A essaie de rejoindre Railway avant que B ait terminé l'enregistrement (la promesse `demarrerBroadcast` peut prendre jusqu'à 5s si DHCP lent) → A tombe sur UDP en fallback, ce qui devrait fonctionner |
| 🟢 Faible | `resetSocketLocal()` vérifie `current.io?.uri !== LOCAL_URL` avant de reset, mais après notre fix de `connecterSocket`, le socket est toujours recréé — la vérification dans `resetSocketLocal` est devenue superflue |
| 🟢 Faible | Pas de message explicite quand `broadcastIP` est null (IP non trouvée) — l'utilisateur est en salle d'attente sans feedback que la découverte échouera |

---

### 3.3 `store/useGameStore.js`

**Points positifs :**
- `reinitialiser()` remet bien tous les champs à leur valeur initiale (spread `etatInitial`)
- `setEtatServeur` utilise `couleur_active` plutôt que le nom du joueur pour identifier l'actif — robuste même si les deux joueurs ont le même prénom

**Problème identifié :**

| Sévérité | Problème |
|----------|----------|
| 🟢 Faible | `setEtatServeur` ignore `adversaireEnPause` — si la pause est active au moment d'une mise à jour d'état, le flag n'est pas réinitialisé (peut rester `true` entre parties en cas de déconnexion rapide). Corrigé dans `onAdversaireDeconnecte` mais pas dans `setEtatServeur` |

---

### 3.4 `pages/Game.jsx`

**Points positifs :**
- Gestion séparée de l'IA (socketIA distinct)
- Timer de pause côté client avec expiration automatique
- Sons de victoire/défaite avec délai

**Problèmes identifiés :**

| Sévérité | Problème |
|----------|----------|
| 🟡 Moyenne | `useEffect([indexJoueurActif, gagnant, joueurs])` pour le tour IA — `joueurs` est un tableau, React compare par référence. Chaque `setEtatServeur` crée un nouveau tableau `joueurs`, ce qui peut déclencher le `useEffect` plus souvent que nécessaire → l'IA peut jouer deux fois |
| 🟡 Moyenne | Le timer de jeu et le timer de pause sont purement côté client — un joueur malveillant qui manipule le client peut ignorer la limite |
| 🟢 Faible | `navigate('/')` si `etatPartie === 'en_attente'` au mount — si on arrive sur `/jeu` directement depuis l'URL, on est redirigé. Cas normal |
| 🟢 Faible | `handleAbandonner` émet `abandonner` puis navigue immédiatement — le socket event part mais on ne vérifie pas qu'il a bien été reçu |

**Correction double IA :**
```js
// Utiliser un ref pour tracker si le coup IA est déjà en cours
const iaPending = useRef(false)
useEffect(() => {
  if (!estTourIA || gagnant || iaPending.current) return
  iaPending.current = true
  const timer = setTimeout(() => {
    sIA.emit('coup_ia', { niveau: niveauIA })
    iaPending.current = false
  }, delay)
  return () => { clearTimeout(timer); iaPending.current = false }
}, [indexJoueurActif, gagnant])
```

---

### 3.5 `router/index.jsx`

**Points positifs :**
- Reset socket vers LOCAL_URL dès qu'on quitte `/jeu` — évite que le socket reste sur l'IP de l'hôte adverse

**Problème identifié :**

| Sévérité | Problème |
|----------|----------|
| 🟢 Faible | `key={location.key}` sur le container force un remount de toute l'arborescence à chaque navigation — propre mais peut causer des flashs sur les transitions |

---

## 4. Electron (main.js)

### 4.1 Réseau et découverte

**Points positifs :**
- Cascade Railway → UDP → ARP → scan HTTP
- Scoring des IPs (hotspot iPhone > WiFi maison > réseau entreprise)
- Retry DHCP async jusqu'à 5s

**Problèmes identifiés :**

| Sévérité | Problème |
|----------|----------|
| 🔴 Élevée | `fixerParefeuWindows()` échoue silencieusement sans droits admin → la machine ne peut jamais être hôte sur Windows. Aucun feedback utilisateur |
| 🟡 Moyenne | Double broadcast (`255.255.255.255` + `subnet.255`) → certains réseaux reçoivent deux paquets par cycle de 500ms, ce qui peut saturer les logs |
| 🟡 Moyenne | `getArpIPs()` parse des IPs sans filtrer les adresses de passerelles réseau — peut inclure l'IP du routeur dans le scan |
| 🟢 Faible | `getArpIPs()` fait un `require('child_process')` en local alors qu'il est déjà importé en haut de fichier |
| 🟢 Faible | Pas de timeout global sur `trouverServeur` — si le réseau est très lent, la fonction peut prendre plusieurs dizaines de secondes |

**Correction feedback pare-feu Windows :**
```js
function fixerParefeuWindows() {
  if (process.platform !== 'win32') return
  const cmds = [
    'netsh advfirewall firewall delete rule name="QOMET"',
    'netsh advfirewall firewall delete rule name="QOMET-UDP"',
    'netsh advfirewall firewall add rule name="QOMET" dir=in action=allow protocol=TCP localport=7777 profile=any',
    'netsh advfirewall firewall add rule name="QOMET-UDP" dir=in action=allow protocol=UDP localport=7778 profile=any',
  ].join(' & ')
  exec(cmds, (err) => {
    if (err) log('[Pare-feu] Règles non appliquées (droits insuffisants) — lancer en admin si connexion LAN impossible')
    else log('[Pare-feu] Règles appliquées ✓')
  })
}
```

### 4.2 Backend spawn

**Problèmes identifiés :**

| Sévérité | Problème |
|----------|----------|
| 🟡 Moyenne | Si le backend crash après le démarrage, l'app continue sans le relancer — aucun mécanisme de restart automatique |
| 🟢 Faible | `attendreBackend` a un maximum de 30 tentatives × 500ms = 15s. Si le backend est lent (machine lente), l'app s'ouvre avec une page blanche |

**Correction restart automatique :**
```js
server.on('close', (code) => {
  console.log('[Backend] Arrêté, code:', code)
  if (code !== 0 && code !== null) {
    console.log('[Backend] Crash détecté, redémarrage dans 2s...')
    setTimeout(demarrerBackend, 2000)
  }
})
```

---

## 5. Sécurité

| Sévérité | Problème | Recommandation |
|----------|----------|---------------|
| 🟡 Moyenne | Railway `/local/register` sans authentification — un attaquant connaissant le code de partie peut enregistrer sa propre IP (MITM) | Ajouter un secret partagé ou un token de session |
| 🟡 Moyenne | CORS `*` sur Railway — acceptable pour une API publique de signaling mais expose tous les endpoints | Restreindre aux origines connues si sensible |
| 🟢 Faible | Codes de room : 4 chars × alphabet 32 = 1 048 576 combinaisons — pas bruteforçable en pratique sur un serveur local, mais vulnérable sur Railway | Augmenter à 6 chars ou ajouter un rate-limit sur `/parties/{code}` |
| 🟢 Faible | Les événements Socket.io ne valident pas la structure des données (`data.get("row")` sans vérifier le type) | Ajouter validation Pydantic ou isinstance checks côté serveur |

---

## 6. Tests

### Couverture existante

| Module | Tests présents |
|--------|---------------|
| `backend/game/board.py` | ✅ `test_board.py` |
| `backend/game/rules.py` | ✅ `test_rules.py` |
| `backend/game/game.py` | ✅ `test_game.py` |
| `backend/game/player.py` | ✅ `test_player.py` |
| `backend/ai/minimax.py` | ✅ `test_minimax.py`, `test_evaluator.py` |
| `backend/network/manager.py` | ✅ `test_manager_routes.py` |
| `frontend/store/useGameStore` | ✅ `useGameStore.test.js` |
| `frontend/hooks/useGameActions` | ✅ `useGameActions.test.js` |
| `frontend/components/` | ✅ plusieurs tests composants |

### Manques identifiés

| Manque | Impact |
|--------|--------|
| Pas de test d'intégration Socket.io (événement `jouer` → réponse `etat`) | Régression possible sur le protocole WS |
| Pas de test pour `disconnect` → purge de room | Fuite de room non couverte |
| Pas de test pour l'éjection volontaire + récupération d'étoile | Règle complexe non vérifiée |
| Pas de test pour `_est_annulation` avec `pousser_ejecter` | Cas limite non couvert |
| Electron/main.js zéro test | Code réseau et IPC non testé |

---

## 7. Performance

| Zone | Observation |
|------|------------|
| **Minimax** | Profondeur 4 avec move ordering : acceptable (~1-2s). `asyncio.to_thread` évite le blocage WS ✅ |
| **Scan réseau** | 254 IPs × 30 en parallèle × timeout 400ms = ~3-4s max ✅ |
| **`CARRES_POSSIBLES`** | Pré-calculé au chargement du module, pas recalculé à chaque coup ✅ |
| **`game.copier()`** | Copie manuelle des champs Player au lieu de `deepcopy` — gain de performance pour le Minimax ✅ |
| **`setEtatServeur`** | Recrée le tableau `joueurs` à chaque appel → referential inequality → useEffect IA peut se déclencher inutilement ⚠️ |

---

## 8. Récapitulatif par priorité

### 🔴 À corriger en priorité

1. **Fuite de room en salle d'attente** (`backend/main.py` → `disconnect`) — les rooms sans joueurs ne sont jamais nettoyées
2. **Pare-feu Windows silencieux** (`electron/main.js` → `fixerParefeuWindows`) — machine impossible à hôter sans feedback

### 🟡 À corriger avant diffusion

3. **Race condition thread UDP ↔ dict `rooms`** — ajouter un `threading.Lock`
4. **`socketIA` jamais fermé en mode IA** — fuite de connexion WS
5. **Pas de restart automatique du backend** — crash = page blanche
6. **Purge du `_local_registry` uniquement à l'écriture** — entrées périmées en mémoire
7. **Double IA possible** — `useEffect` sur `joueurs` se déclenche à chaque `setEtatServeur`

### 🟢 Améliorations optionnelles

8. Augmenter le code de room à 6 chars
9. Ajouter tests d'intégration Socket.io
10. Rate-limiting sur `POST /parties`
11. Valider le format IP dans `POST /local/register`
12. Timeout global sur `trouverServeur`
