# 📘 Guide d'installation complet — QOMET

> Guide destiné à un ordinateur **totalement vide**. Suit les étapes dans l'ordre exact, sans en sauter une seule.

---

## 🔍 Analyse automatique du projet

| Élément | Valeur détectée |
|---|---|
| **Langages** | JavaScript (Electron + React) · Python 3.11 |
| **Frameworks** | React 19 · FastAPI · Vite 8 · Electron 36 |
| **Gestionnaires de paquets** | npm (racine + frontend/src) · pip (Python) |
| **Fichiers de config détectés** | `package.json` × 2 · `requirements.txt` · `vite.config.js` · `config/settings.py` |
| **Port utilisé** | 7777 (backend Python) |
| **Systèmes cibles** | ✅ Windows · ✅ macOS · ✅ Linux |

---

## Étape 1 — 🖥️ Installer l'éditeur de code (VS Code)

⏱️ *Temps estimé : 5 minutes*

### Téléchargement

Ouvre ton navigateur et va sur : **https://code.visualstudio.com**

- **Windows** : clique sur "Download for Windows" → lance le `.exe` → clique "Suivant" jusqu'à la fin
- **macOS** : clique sur "Download for Mac" → ouvre le `.dmg` → glisse VS Code dans Applications
- **Linux** : clique sur ".deb" (Ubuntu/Debian) ou ".rpm" (Fedora) → installe le fichier téléchargé

### ✅ Vérification

Ouvre VS Code. Si la fenêtre s'affiche, l'installation a réussi.

### 📦 Extensions recommandées pour QOMET

Une fois VS Code ouvert, installe ces extensions (clic sur l'icône Extensions à gauche, cherche chaque nom) :

| Extension | Utilité |
|---|---|
| **Python** (Microsoft) | Coloration + debug Python |
| **ES7+ React/Redux** (dsznajder) | Raccourcis React |
| **Prettier** | Formatage automatique du code |
| **ESLint** | Détection d'erreurs JavaScript |
| **GitLens** | Visualisation Git |

---

## Étape 2 — 📦 Installer Node.js

⏱️ *Temps estimé : 5 minutes*

Node.js est nécessaire pour faire tourner Electron et React.

### Téléchargement

Va sur : **https://nodejs.org**

Clique sur **"LTS"** (la version stable recommandée — pas "Current").

- **Windows** : lance le `.msi` → "Next" jusqu'à la fin → ✅ coche "Automatically install necessary tools"
- **macOS** : lance le `.pkg` → suis les étapes
- **Linux (Ubuntu/Debian)** :
```bash
# Ajoute le dépôt Node.js officiel
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -

# Installe Node.js
sudo apt-get install -y nodejs
```

### ✅ Vérification

Ouvre un terminal (sur Windows : touche Windows → tape "cmd" → Entrée) et tape :

```bash
# Vérifie que Node.js est bien installé
node --version
```

Tu dois voir quelque chose comme `v22.x.x`. Si tu vois un numéro, c'est bon.

```bash
# Vérifie que npm est bien installé
npm --version
```

Tu dois voir quelque chose comme `10.x.x`.

> ⚠️ **Si la commande n'est pas reconnue sur Windows** : ferme le terminal et rouvre-le. Les changements de PATH nécessitent un redémarrage du terminal.

---

## Étape 3 — 📦 Installer Python 3.11

⏱️ *Temps estimé : 5 minutes*

Python est nécessaire pour faire tourner le serveur de jeu.

> ⚠️ **Version importante** : le projet utilise Python **3.11**. N'installe pas une version trop récente (3.13+) qui peut causer des incompatibilités.

### Téléchargement

Va sur : **https://www.python.org/downloads/release/python-3119/**

Fais défiler vers le bas et télécharge :
- **Windows 64 bits** : "Windows installer (64-bit)"
- **macOS** : "macOS 64-bit universal2 installer"
- **Linux** : Python 3.11 est souvent déjà présent, sinon : `sudo apt install python3.11`

### ✅ Installation Windows — IMPORTANT

Quand le programme d'installation s'ouvre :

> ⚠️ **COCHE ABSOLUMENT** la case **"Add Python to PATH"** en bas avant de cliquer "Install Now"

Sans cette case cochée, Python ne sera pas reconnu dans le terminal.

### ✅ Vérification

```bash
# Vérifie la version de Python
python --version
```

Sur macOS/Linux, la commande peut être `python3` :

```bash
python3 --version
```

Tu dois voir `Python 3.11.x`.

```bash
# Vérifie que pip (gestionnaire de paquets Python) est installé
pip --version
```

---

## Étape 4 — 📦 Installer Git

⏱️ *Temps estimé : 3 minutes*

Git permet de télécharger le code source depuis GitHub.

### Téléchargement

Va sur : **https://git-scm.com/downloads**

- **Windows** : télécharge et installe le `.exe` (clique "Next" à chaque étape, laisse les options par défaut)
- **macOS** : tape dans le terminal `xcode-select --install` (installe les outils développeur Apple incluant Git)
- **Linux** : `sudo apt install git` (Ubuntu/Debian) ou `sudo dnf install git` (Fedora)

### ✅ Vérification

```bash
# Vérifie que Git est installé
git --version
```

Tu dois voir `git version 2.x.x`.

---

## Étape 5 — 📥 Télécharger le projet

⏱️ *Temps estimé : 2 minutes*

### Option A — Via Git (recommandé)

```bash
# Télécharge le code source depuis GitHub
git clone https://github.com/Assia-ys/QOMET.git

# Entre dans le dossier du projet
cd QOMET
```

### Option B — Via ZIP

1. Va sur **https://github.com/Assia-ys/QOMET**
2. Clique sur le bouton vert **"Code"**
3. Clique sur **"Download ZIP"**
4. Extrais le ZIP :
   - **Windows** : clic droit sur le ZIP → "Extraire tout" → choisis un dossier → "Extraire"
   - **macOS** : double-clic sur le ZIP (extraction automatique)
   - **Linux** :
```bash
# Extrait le ZIP
unzip QOMET-main.zip

# Entre dans le dossier extrait
cd QOMET-main
```

---

## Étape 6 — 📦 Installer les dépendances

⏱️ *Temps estimé : 5 à 10 minutes*

> ⚠️ **Assure-toi d'être dans le dossier QOMET** avant de taper les commandes. Tu dois voir `package.json` si tu fais `ls` (macOS/Linux) ou `dir` (Windows).

### 6.1 — Dépendances Electron (racine du projet)

```bash
# Installe les dépendances Electron et de construction
npm install
```

Tu verras beaucoup de texte défiler. C'est normal. Attends que la commande se termine.

### 6.2 — Dépendances React (frontend)

```bash
# Entre dans le dossier frontend
cd frontend/src

# Installe les dépendances React
npm install

# Revient à la racine du projet
cd ../..
```

### 6.3 — Environnement virtuel Python (recommandé)

Un environnement virtuel isole les paquets Python de ton système.

**Windows :**
```bash
# Crée un environnement virtuel nommé "venv"
python -m venv venv

# Active l'environnement virtuel
venv\Scripts\activate
```

**macOS / Linux :**
```bash
# Crée un environnement virtuel nommé "venv"
python3 -m venv venv

# Active l'environnement virtuel
source venv/bin/activate
```

> ✅ Quand l'environnement est actif, tu vois `(venv)` au début de ta ligne de commande.

### 6.4 — Dépendances Python

```bash
# Installe tous les paquets Python nécessaires
pip install -r requirements.txt
```

### ✅ Vérification complète

```bash
# Vérifie que FastAPI est bien installé
pip show fastapi
```

Tu dois voir `Name: fastapi` dans la réponse.

---

## Étape 7 — 🚀 Lancer le projet en mode développement

⏱️ *Temps estimé : 1 minute*

> ⚠️ Cette commande lance **trois choses simultanément** : le serveur Python (port 7777), le serveur Vite (React), et la fenêtre Electron. Ne ferme pas le terminal pendant que tu joues.

```bash
# Lance l'application complète en mode développement
npm run electron:dev
```

### ✅ Comment savoir que ça fonctionne

Dans le terminal, tu dois voir apparaître ces messages dans cet ordre :

```
[Backend] Démarrage...
[Backend] Uvicorn running on http://0.0.0.0:7777
[Backend] Prêt ✓
```

Puis la **fenêtre QOMET s'ouvre automatiquement**.

> ⚠️ **La première fois**, le démarrage peut prendre 15 à 30 secondes. C'est normal — Electron installe ses binaires internes.

---

## Étape 8 — 🔨 Générer l'installateur (build de production)

⏱️ *Temps estimé : 3 à 5 minutes*

### 8.1 — Build Windows (.exe)

```bash
# Génère l'installateur Windows
npm run electron:build
```

**Fichier généré :**
```
dist/QOMET Setup 1.0.0.exe
```

Double-clique sur ce fichier pour installer QOMET sur Windows. L'installateur demande les droits administrateur pour configurer le pare-feu (nécessaire pour le mode réseau).

### 8.2 — Build macOS (.dmg)

```bash
# Génère l'image disque macOS
npm run electron:mac
```

**Fichier généré :**
```
dist/QOMET-1.0.0.dmg
```

Double-clique sur le `.dmg` → glisse QOMET dans Applications.

### 8.3 — Build Linux (.AppImage)

```bash
# Génère l'AppImage Linux
npm run electron:linux
```

**Fichier généré :**
```
dist/QOMET-1.0.0.AppImage
```

```bash
# Rend le fichier exécutable
chmod +x dist/QOMET-1.0.0.AppImage

# Lance l'application
./dist/QOMET-1.0.0.AppImage
```

> ⚠️ **Pour cross-compiler** (ex : générer le `.exe` Windows depuis macOS), il faut une machine Windows. electron-builder ne peut pas créer des installateurs natifs pour un autre OS que celui sur lequel il tourne.

---

## Étape 9 — 🧪 Lancer les tests

### Tests Python (backend)

```bash
# Lance tous les tests unitaires Python
pytest tests/
```

Tu dois voir quelque chose comme `115 passed` à la fin.

### Tests JavaScript (frontend)

```bash
# Entre dans le dossier frontend
cd frontend/src

# Lance les tests React
npm test

# Revient à la racine
cd ../..
```

---

## ⚠️ Résolution des 5 erreurs les plus fréquentes

---

### Erreur 1 — `python` n'est pas reconnu comme commande

**Message d'erreur :**
```
'python' is not recognized as an internal or external command
```

**Cause :** Python n'a pas été ajouté au PATH lors de l'installation.

**Solution Windows :**
```bash
# Option 1 : utilise py à la place de python
py --version

# Option 2 : réinstalle Python en cochant "Add Python to PATH"
# Panneau de configuration → Désinstaller Python → Réinstalle depuis python.org
```

**Solution macOS/Linux :**
```bash
# Utilise python3 au lieu de python
python3 --version
```

---

### Erreur 2 — `npm install` échoue avec des erreurs de permissions

**Message d'erreur :**
```
EACCES: permission denied
```

**Cause :** npm essaie d'écrire dans un dossier protégé.

**Solution macOS/Linux :**
```bash
# Répare les permissions du dossier npm
sudo chown -R $(whoami) ~/.npm

# Relance l'installation
npm install
```

**Solution Windows :** Lance le terminal en tant qu'administrateur (clic droit sur "Invite de commandes" → "Exécuter en tant qu'administrateur").

---

### Erreur 3 — Port 7777 déjà utilisé

**Message d'erreur :**
```
[WinError 10048] Only one usage of each socket address is normally permitted
```
ou
```
address already in use :::7777
```

**Cause :** Une instance précédente de QOMET tourne encore en arrière-plan.

**Solution Windows :**
```bash
# Trouve et tue le processus sur le port 7777
for /f "tokens=5" %a in ('netstat -aon ^| findstr :7777') do taskkill /F /PID %a
```

**Solution macOS/Linux :**
```bash
# Trouve et tue le processus sur le port 7777
lsof -ti:7777 | xargs kill -9
```

---

### Erreur 4 — `ModuleNotFoundError` au lancement du backend Python

**Message d'erreur :**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Cause :** L'environnement virtuel n'est pas activé, ou `pip install` n'a pas été fait.

**Solution :**
```bash
# Active l'environnement virtuel (Windows)
venv\Scripts\activate

# Active l'environnement virtuel (macOS/Linux)
source venv/bin/activate

# Réinstalle les dépendances Python
pip install -r requirements.txt
```

---

### Erreur 5 — Fenêtre Electron blanche ou application qui ne démarre pas

**Message d'erreur :**
```
[Backend] Timeout — lancement quand même
```
ou fenêtre blanche qui reste vide.

**Cause :** Le backend Python met trop de temps à démarrer, ou le build frontend n'existe pas.

**Solution — Rebuild le frontend :**
```bash
# Entre dans le dossier frontend
cd frontend/src

# Rebuild le frontend
npm run build

# Revient à la racine
cd ../..

# Relance l'application
npm run electron:dev
```

**Si le problème persiste :**
```bash
# Supprime et réinstalle tous les modules Node
# Windows :
rd /s /q node_modules
rd /s /q frontend\src\node_modules

# macOS/Linux :
rm -rf node_modules frontend/src/node_modules

# Réinstalle tout
npm install
cd frontend/src && npm install && cd ../..
```

---

## 📋 Récapitulatif des commandes

```bash
# 1. Cloner le projet
git clone https://github.com/Assia-ys/QOMET.git && cd QOMET

# 2. Installer toutes les dépendances
npm install
cd frontend/src && npm install && cd ../..
python -m venv venv && venv\Scripts\activate   # Windows
# source venv/bin/activate                     # macOS/Linux
pip install -r requirements.txt

# 3. Lancer en développement
npm run electron:dev

# 4. Builder pour Windows
npm run electron:build

# 5. Lancer les tests
pytest tests/
```

---

*QOMET — L3 DANT · Sorbonne Université · 2025–2026*
*Assia YOUNSI · Sara AIT OUAHIOUNE · Maissa SACI*
