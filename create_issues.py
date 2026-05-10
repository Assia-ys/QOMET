"""
Script de creation des issues + tableau de bord GitHub Projects pour QOMET.
Lancer sur hotspot (proxy desactive) :
  python create_issues.py
"""

import urllib.request
import urllib.error
import json
import time

TOKEN = "VOTRE_TOKEN_GITHUB_ICI"
REPO  = "Assia-ys/QOMET"
API   = f"https://api.github.com/repos/{REPO}/issues"

HEADERS = {
    "Authorization": f"token {TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/vnd.github.v3+json"
}

TICKETS = [
    # PHASE 1 - FRONTEND
    {
        "title": "[F-01] Setup frontend - Router, Zustand, mock data",
        "body": "## Description\nBase du frontend - a finir avant tous les autres tickets frontend.\n\n## Taches\n- Configurer React Router avec toutes les routes\n- Creer le store Zustand `useGameStore`\n- Definir les donnees mockees reutilisables\n\n## Dependances\nAucune - a faire en premier\n\n## Estimation\n3h",
        "labels": ["frontend", "priorite haute"],
        "milestone": None
    },
    {
        "title": "[F-02] Page Home - menu principal",
        "body": "## Description\nPremiere page visible au lancement.\n\n## Taches\n- Ecran de chargement\n- Menu : Jouer en reseau, Jouer contre IA, Parametres, Quitter\n- Navigation React Router\n\n## Dependances\nF-01\n\n## Estimation\n2h",
        "labels": ["frontend"],
        "milestone": None
    },
    {
        "title": "[F-03] Page AIMode - selection niveau IA",
        "body": "## Description\nPage de configuration avant une partie contre l'IA.\n\n## Taches\n- Selection niveau : Facile / Moyen / Difficile\n- Saisie prenom\n- Bouton Commencer\n\n## Dependances\nF-01\n\n## Estimation\n2h",
        "labels": ["frontend"],
        "milestone": None
    },
    {
        "title": "[F-04] Page Lobby - mode reseau local",
        "body": "## Description\nCreation et jointure de partie en reseau local.\n\n## Taches\n- Creer une partie : code 4 caracteres + attente\n- Rejoindre : saisie code + prenom\n- Erreur si code invalide (ERR_ROOM_NOT_FOUND)\n\n## Dependances\nF-01\n\n## Estimation\n4h",
        "labels": ["frontend"],
        "milestone": None
    },
    {
        "title": "[F-05] Page Game - plateau de jeu complet",
        "body": "## Description\nPage principale de jeu.\n\n## Taches\n- Integrer Board.jsx et PlayerInfo.jsx avec Zustand\n- Bandeau Ton tour / Tour adversaire\n- Boutons Retour, Pause, Abandonner\n- Phases pose et deplacement\n\n## Dependances\nF-01, F-06\n\n## Estimation\n5h",
        "labels": ["frontend"],
        "milestone": None
    },
    {
        "title": "[F-06] Board interactif - selection et surbrillance",
        "body": "## Description\nRendre le plateau cliquable.\n\n## Taches\n- Clic etoile -> selection bleue\n- Cases valides en vert\n- Clic case valide -> action au store\n- Distinction pose vs deplacement\n\n## Dependances\nF-01\n\n## Estimation\n5h",
        "labels": ["frontend"],
        "milestone": None
    },
    {
        "title": "[F-07] Ecrans de fin et modales",
        "body": "## Description\nEcrans de fin de partie et fenetres de confirmation.\n\n## Taches\n- Victoire : trophee, duree, Rejouer/Menu\n- Defaite : duree, Rejouer/Menu\n- Pause, Abandon, Adversaire deconnecte\n\n## Dependances\nF-01\n\n## Estimation\n3h",
        "labels": ["frontend"],
        "milestone": None
    },
    {
        "title": "[F-08] Page Parametres",
        "body": "## Description\nConfiguration de l'application.\n\n## Taches\n- Volume musique et effets\n- Port reseau (defaut 7777)\n- Plein ecran, langue\n- Sauvegarde JSON local\n\n## Dependances\nF-01\n\n## Estimation\n2h",
        "labels": ["frontend"],
        "milestone": None
    },
    {
        "title": "[F-09] Animations et transitions",
        "body": "## Description\nAnimations pour une experience fluide.\n\n## Taches\n- Transitions entre pages\n- Animation pose et ejection d'etoile\n- Surbrillance carre gagnant\n\n## Dependances\nF-05, F-06, F-07\n\n## Estimation\n4h",
        "labels": ["frontend"],
        "milestone": None
    },
    # PHASE 2 - NETWORK
    {
        "title": "[N-01] Setup backend - requirements.txt + main.py",
        "body": "## Description\nPoint d'entree du serveur FastAPI + Socket.io.\n\n## Taches\n- requirements.txt : fastapi, uvicorn, python-socketio\n- config/settings.py : HOST, PORT 7777\n- backend/main.py : FastAPI + Socket.io + uvicorn\n\n## Dependances\nAucune\n\n## Estimation\n3h",
        "labels": ["backend", "network"],
        "milestone": None
    },
    {
        "title": "[N-02] Systeme de rooms - manager.py",
        "body": "## Description\nGestion des salons avec code a 4 caracteres.\n\n## Taches\n- Generer code unique 4 caracteres\n- Creer room : instancier Game(), stocker dans dict\n- Associer les deux joueurs\n- Demarrer quand les deux sont connectes\n\n## Dependances\nN-01\n\n## Estimation\n5h",
        "labels": ["backend", "network"],
        "milestone": None
    },
    {
        "title": "[N-03] Gestion WebSocket - evenements Socket.io",
        "body": "## Description\nTous les evenements Socket.io.\n\n## Taches\n- `rejoindre` : associer joueur a une room\n- `jouer` : valider, appliquer, broadcaster\n- `adversaire_deconnecte` : notifier\n- `erreur` : code invalide, coup illegal\n\n## Dependances\nN-02\n\n## Estimation\n5h",
        "labels": ["backend", "network"],
        "milestone": None
    },
    {
        "title": "[N-04] Routes HTTP - api/routes.py",
        "body": "## Description\nEndpoints REST pour la gestion des parties.\n\n## Taches\n- POST /parties : creer partie, retourner code\n- GET /parties/{code} : verifier si room existe\n- GET /parties/{code}/etat : etat actuel\n\n## Dependances\nN-02\n\n## Estimation\n2h",
        "labels": ["backend", "network"],
        "milestone": None
    },
    {
        "title": "[N-05] Branchement frontend - backend",
        "body": "## Description\nConnecter React au serveur Socket.io.\n\n## Taches\n- Installer socket.io-client\n- Creer hook useSocket.js\n- Remplacer mock data par vraies donnees\n- Tester avec deux fenetres navigateur\n\n## Dependances\nN-03, F-05\n\n## Estimation\n5h",
        "labels": ["frontend", "network"],
        "milestone": None
    },
    # PHASE 3 - IA
    {
        "title": "[IA-01] Fonction d'evaluation du plateau",
        "body": "## Description\nEvaluer la qualite d'une position.\n\n## Taches\n- Pour chaque carre possible (15 au total), compter les coins occupes\n- Retourner score numerique\n\n## Dependances\nAucune\n\n## Estimation\n4h",
        "labels": ["ia"],
        "milestone": None
    },
    {
        "title": "[IA-02] IA Niveau Facile - coups aleatoires",
        "body": "## Description\nL'IA choisit un coup au hasard.\n\n## Taches\n- Recuperer tous les coups valides\n- Choisir aleatoirement\n\n## Dependances\nIA-01\n\n## Estimation\n2h",
        "labels": ["ia"],
        "milestone": None
    },
    {
        "title": "[IA-03] IA Niveau Moyen - Minimax profondeur 2",
        "body": "## Description\nL'IA anticipe 2 demi-coups.\n\n## Taches\n- Implementer Minimax\n- Profondeur 2\n- Utiliser fonction evaluation\n\n## Dependances\nIA-01\n\n## Estimation\n5h",
        "labels": ["ia"],
        "milestone": None
    },
    {
        "title": "[IA-04] IA Niveau Difficile - Minimax alpha-beta profondeur 4",
        "body": "## Description\nIA expert avec elagage alpha-beta.\n\n## Taches\n- Ajouter elagage alpha-beta\n- Profondeur 4\n- Temps reponse < 2 secondes\n\n## Dependances\nIA-03\n\n## Estimation\n6h",
        "labels": ["ia"],
        "milestone": None
    },
    {
        "title": "[IA-05] Branchement IA dans le jeu",
        "body": "## Description\nIntegrer l'IA dans le flux complet.\n\n## Taches\n- Endpoint POST /ia/coup\n- Brancher sur page AIMode\n- Tester les 3 niveaux\n\n## Dependances\nIA-04, N-04\n\n## Estimation\n3h",
        "labels": ["ia"],
        "milestone": None
    },

    # ── PHASE ELECTRON ────────────────────────────────────────────────────────

    {
        "title": "[E-01] Setup Electron + dependances",
        "body": """## Description
Initialiser l'environnement Electron et connecter le frontend React existant.

## Taches
- Installer les dependances : `electron`, `electron-builder`, `vite-plugin-electron`
- Creer `electron/main.js` : process principal (BrowserWindow, lifecycle)
- Creer `electron/preload.js` : contextBridge pour exposer ipcRenderer
- Ajouter scripts npm dans `package.json` :
  - `dev:electron` : lance Vite + Electron en parallele
  - `build:electron` : build Vite puis package Electron
- Mettre `base: './'` dans `vite.config.js` pour compatibilite `file://`
- Verifier que `HashRouter` charge correctement en mode Electron

## Definition of Done
- `npm run dev:electron` ouvre une fenetre Electron avec l'app React
- Navigation entre pages fonctionne sans erreur
- Console sans erreur critique

## Dependances
Aucune (premier ticket Electron)

## Estimation
2h""",
        "labels": ["electron"],
        "milestone": None
    },
    {
        "title": "[E-02] Lancement et gestion du backend Python depuis Electron",
        "body": """## Description
Bundler le backend FastAPI+Socket.io en executable autonome et le gerer depuis le process Electron.

## Taches
- Bundler le backend avec **PyInstaller** :
  - `pyinstaller --onefile backend/main.py --name qomet-server`
  - Tester l'executable sans Python installe
- Dans `electron/main.js` :
  - Demarrer le process backend au lancement de l'app (`child_process.spawn`)
  - Passer le port via variable d'environnement (`QOMET_PORT=7777`)
  - Attendre que le serveur reponde (`/health`) avant d'ouvrir la fenetre
  - Arreter proprement le process Python a la fermeture (`app.on('will-quit')`)
- Gestion des erreurs :
  - Port deja occupe → retry sur port suivant
  - Executable introuvable → message d'erreur utilisateur
- Mettre a jour `config.js` : `SERVER_URL` lit le port dynamique

## Definition of Done
- Lancer l'app Electron sans Python installe
- Le serveur backend demarre et repond sur `/health`
- La fermeture de l'app tue proprement le process backend
- Aucun process zombie apres fermeture

## Dependances
E-01

## Estimation
3h""",
        "labels": ["electron"],
        "milestone": None
    },
    {
        "title": "[E-03] Communication IPC et controles fenetre",
        "body": """## Description
Mettre en place la communication IPC securisee entre le renderer (React) et le main process Electron.

## Taches
- `electron/preload.js` : exposer via `contextBridge` :
  - `window.electronAPI.closeApp()` → `ipcRenderer.send('close-app')`
  - `window.electronAPI.minimize()` → `ipcRenderer.send('minimize')`
  - `window.electronAPI.maximize()` → `ipcRenderer.send('maximize')`
- `electron/main.js` : handlers IPC correspondants
- Mettre a jour `config.js` `closeApp()` :
  - Si `window.electronAPI` disponible → `window.electronAPI.closeApp()`
  - Sinon → `window.close()` (fallback web)
- Securite : `nodeIntegration: false`, `contextIsolation: true`
- DevTools uniquement en `NODE_ENV=development`

## Definition of Done
- Bouton Quitter ferme proprement l'app Electron
- Le bouton fonctionne aussi en mode navigateur (fallback)
- Aucune alerte de securite dans la console

## Dependances
E-01

## Estimation
1h""",
        "labels": ["electron"],
        "milestone": None
    },
    {
        "title": "[E-04] Configuration et apparence de la fenetre",
        "body": """## Description
Configurer la fenetre principale Electron : dimensions, titre, icone, comportement.

## Taches
- `BrowserWindow` options :
  - Dimensions initiales : 1280×800, minimum 1024×700
  - Titre : "QOMET"
  - Icone : `assets/icon.ico` (Windows), `icon.icns` (Mac), `icon.png` (Linux)
  - `frame: true` (garde la barre native OS)
- Supprimer le menu applicatif natif : `Menu.setApplicationMenu(null)`
- Comportement de fermeture :
  - `app.on('window-all-closed')` : quitter sur Windows/Linux, garder actif sur Mac
  - `app.on('activate')` : recreer fenetre sur Mac si dock clique
- Ecran de chargement (splash screen) pendant le demarrage du backend

## Definition of Done
- L'app a le bon titre et la bonne icone
- Pas de menu natif visible
- Comportement MacOS conforme aux conventions (Cmd+Q, dock)

## Dependances
E-02

## Estimation
1h""",
        "labels": ["electron"],
        "milestone": None
    },
    {
        "title": "[E-05] Build et packaging multi-plateforme",
        "body": """## Description
Generer des installeurs natifs pour Windows, Linux et macOS via electron-builder.

## Taches
- Configurer `electron-builder` dans `package.json` :
  ```json
  {
    "build": {
      "appId": "com.triova.qomet",
      "productName": "QOMET",
      "files": ["dist/**", "electron/**", "backend-dist/**"],
      "win":   { "target": "nsis",   "icon": "assets/icon.ico"  },
      "linux": { "target": "AppImage","icon": "assets/icon.png"  },
      "mac":   { "target": "dmg",    "icon": "assets/icon.icns" }
    }
  }
  ```
- Inclure l'executable PyInstaller dans le package final
- Script de build CI :
  - Windows : `electron-builder --win`
  - Linux   : `electron-builder --linux`
  - macOS   : `electron-builder --mac`
- Tester l'installeur genere sur chaque plateforme

## Definition of Done
- Installeur Windows `.exe` fonctionnel (sans Python ni Node)
- Paquet Linux `.AppImage` fonctionnel
- DMG macOS fonctionnel
- L'app se lance et joue une partie complete apres installation

## Dependances
E-02, E-03, E-04

## Estimation
3h""",
        "labels": ["electron"],
        "milestone": None
    },
    {
        "title": "[E-06] Script d'installation cross-platform",
        "body": """## Description
Creer un script unique que le client execute pour installer QOMET sans connaissance technique.
Le script detecte automatiquement l'OS et installe la bonne version.

## Taches

### Script principal `install.sh` (Linux / macOS) :
```bash
#!/bin/bash
OS=$(uname -s)
if [ "$OS" = "Darwin" ]; then
    # macOS : ouvre le DMG et installe
    open QOMET-mac.dmg
elif [ "$OS" = "Linux" ]; then
    # Linux : rend AppImage executable et lance
    chmod +x QOMET-linux.AppImage
    ./QOMET-linux.AppImage
fi
```

### Script principal `install.bat` (Windows) :
```batch
@echo off
start QOMET-Setup.exe
```

### Script universel `install.py` :
- Detecte OS automatiquement (`platform.system()`)
- Telecharge la bonne version depuis les releases GitHub
- Lance l'installeur correspondant
- Affiche une barre de progression

### Contenu du README d'installation :
- 3 etapes maximum pour l'utilisateur final
- Aucun prerequis (pas de Python, pas de Node.js)
- Support Windows 10+, Ubuntu 20.04+, macOS 12+

## Definition of Done
- Un utilisateur peut installer QOMET en executant UN seul fichier
- Script teste sur Windows, Linux et macOS
- Documentation utilisateur claire (README ou PDF)

## Dependances
E-05

## Estimation
2h""",
        "labels": ["electron"],
        "milestone": None
    },
    {
        "title": "[E-07] Tests et validation Electron multi-plateforme",
        "body": """## Description
Valider le bon fonctionnement de l'application Electron sur les 3 plateformes cibles.

## Taches

### Tests fonctionnels (sur chaque OS) :
- [ ] L'app se lance sans erreur
- [ ] Le backend Python demarre (verifier via `/health`)
- [ ] Mode IA : lancer une partie Facile/Moyen/Difficile jusqu'a la fin
- [ ] Mode Reseau : 2 instances Electron sur la meme machine, partie complete
- [ ] Modal gagne/perdu s'affiche correctement
- [ ] Bouton Quitter ferme l'app proprement (pas de process zombie)
- [ ] Parametres : changement langue FR/EN persiste apres redemarrage
- [ ] Fermeture forcee (Alt+F4 / Cmd+Q) : backend s'arrete aussi

### Tests de performance :
- [ ] Temps de lancement < 5 secondes
- [ ] IA Difficile repond en < 2 secondes

### Tests de robustesse :
- [ ] Port 7777 occupe → l'app utilise un autre port
- [ ] Relancer l'app immediatement apres fermeture → pas de conflit de port

### Plateformes cibles :
- Windows 10 / 11
- Ubuntu 20.04 / 22.04
- macOS 12 (Monterey) / 13 (Ventura)

## Definition of Done
- Tous les tests fonctionnels passent sur les 3 OS
- Aucun process zombie detecte
- Rapport de validation signe

## Dependances
E-06

## Estimation
3h""",
        "labels": ["electron"],
        "milestone": None
    },
]


def requete(url, data=None, method="GET"):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode() if data else None,
        headers=HEADERS,
        method=method
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def creer_labels():
    labels = [
        ("frontend",       "0075ca", "Tickets interface React"),
        ("backend",        "e4e669", "Tickets serveur Python FastAPI"),
        ("network",        "d93f0b", "Tickets reseau et WebSocket"),
        ("ia",             "0e8a16", "Tickets intelligence artificielle"),
        ("electron",       "6f42c1", "Tickets packaging et distribution Electron"),
        ("priorite haute", "b60205", "A traiter en priorite"),
    ]
    print("Labels...")
    for nom, couleur, desc in labels:
        try:
            requete(
                f"https://api.github.com/repos/{REPO}/labels",
                {"name": nom, "color": couleur, "description": desc},
                "POST"
            )
            print(f"  cree : {nom}")
        except urllib.error.HTTPError:
            print(f"  existant : {nom}")


def creer_issues():
    print("Issues...")
    numeros = []
    for ticket in TICKETS:
        try:
            issue = requete(API, {"title": ticket["title"], "body": ticket["body"], "labels": ticket["labels"]}, "POST")
            numeros.append(issue["number"])
            print(f"  #{issue['number']} - {issue['title']}")
            time.sleep(0.5)
        except urllib.error.HTTPError as e:
            print(f"  ERREUR {e.code} : {ticket['title']}")
            numeros.append(None)
    return numeros


def creer_projet(numeros_issues):
    print("Projet GitHub...")
    try:
        projet = requete(
            f"https://api.github.com/repos/{REPO}/projects",
            {"name": "QOMET - Tableau de bord", "body": "Suivi des tickets Frontend, Network et IA"},
            "POST"
        )
        projet_id = projet["id"]
        print(f"  Projet cree : #{projet_id}")

        colonnes = ["A faire", "En cours", "En review", "Termine"]
        colonne_ids = {}
        for nom in colonnes:
            col = requete(
                f"https://api.github.com/projects/{projet_id}/columns",
                {"name": nom},
                "POST"
            )
            colonne_ids[nom] = col["id"]
            print(f"  Colonne creee : {nom}")

        print("  Ajout des issues dans 'A faire'...")
        col_todo = colonne_ids["A faire"]
        for num in numeros_issues:
            if num:
                try:
                    requete(
                        f"https://api.github.com/projects/columns/{col_todo}/cards",
                        {"content_id": num, "content_type": "Issue"},
                        "POST"
                    )
                    time.sleep(0.3)
                except Exception as e:
                    print(f"    Issue #{num} non ajoutee : {e}")

        print(f"\n  Tableau disponible sur :")
        print(f"  https://github.com/Assia-ys/QOMET/projects")

    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ERREUR projet {e.code} : {body}")


if __name__ == "__main__":
    creer_labels()
    numeros = creer_issues()
    creer_projet(numeros)
    print("\nTermine !")
