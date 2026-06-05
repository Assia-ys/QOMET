#!/usr/bin/env bash
# ============================================================
#  QOMET — Script d'installation et lancement (macOS / Linux)
#  Lance depuis la racine du projet QOMET :
#    chmod +x setup.sh && ./setup.sh
# ============================================================

set -e

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; MAGENTA='\033[0;35m'; NC='\033[0m'

step() { echo -e "\n${CYAN}==> $1${NC}"; }
ok()   { echo -e "  ${GREEN}[OK]${NC} $1"; }
warn() { echo -e "  ${YELLOW}[!] ${NC} $1"; }
fail() { echo -e "  ${RED}[X] ${NC} $1"; exit 1; }

# ── Detecte l'OS ──────────────────────────────────────────────────────────────
OS="$(uname -s)"
if [ "$OS" = "Darwin" ]; then
    DISTRO="macos"
elif [ -f /etc/debian_version ]; then
    DISTRO="debian"
elif [ -f /etc/fedora-release ]; then
    DISTRO="fedora"
else
    DISTRO="linux"
fi

# ── Verifie qu'on est bien dans le dossier QOMET ──────────────────────────────
if [ ! -f "package.json" ] || [ ! -f "requirements.txt" ]; then
    fail "Lance ce script depuis la racine du projet QOMET"
fi

echo ""
echo -e "  ${MAGENTA}QOMET - Installation automatique ($DISTRO)${NC}"
echo    "  ==========================================="
echo ""

# ══════════════════════════════════════════════════════════════
# ETAPE 1 — Outils de base (curl, git, build-essential)
# ══════════════════════════════════════════════════════════════
step "Installation des outils de base..."

if [ "$DISTRO" = "macos" ]; then
    # Homebrew
    if ! command -v brew &>/dev/null; then
        warn "Homebrew non trouve — installation..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        # Ajoute brew au PATH selon la puce (Apple Silicon vs Intel)
        if [ -f "/opt/homebrew/bin/brew" ]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        fi
        ok "Homebrew installe"
    else
        ok "Homebrew : $(brew --version | head -1)"
    fi

    # Outils Xcode (git, make, cc)
    if ! command -v git &>/dev/null; then
        warn "Outils Xcode non trouves — installation..."
        xcode-select --install 2>/dev/null || true
        ok "Outils Xcode installes"
    else
        ok "Git : $(git --version)"
    fi

elif [ "$DISTRO" = "debian" ]; then
    sudo apt-get update -qq
    sudo apt-get install -y curl git build-essential python3-venv python3-pip unzip
    ok "Outils de base installes (curl, git, build-essential, python3-venv)"

elif [ "$DISTRO" = "fedora" ]; then
    sudo dnf install -y curl git gcc gcc-c++ make python3-pip unzip
    ok "Outils de base installes"

else
    warn "Distribution Linux non reconnue — assure-toi que curl, git et build-essential sont installes"
fi

# ══════════════════════════════════════════════════════════════
# ETAPE 2 — Node.js
# ══════════════════════════════════════════════════════════════
step "Verification Node.js..."

if command -v node &>/dev/null; then
    ok "Node.js deja installe : $(node --version)"
else
    warn "Node.js non trouve — installation..."
    if [ "$DISTRO" = "macos" ]; then
        brew install node@22
        # node@22 est keg-only sur Homebrew → on ajoute son chemin au PATH manuellement
        export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
        # Persiste le PATH dans le profil shell pour les prochaines sessions
        SHELL_PROFILE="$HOME/.zshrc"
        [ -f "$HOME/.bash_profile" ] && SHELL_PROFILE="$HOME/.bash_profile"
        grep -qxF 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"' "$SHELL_PROFILE" 2>/dev/null \
            || echo 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"' >> "$SHELL_PROFILE"
        ok "PATH node@22 configure dans $SHELL_PROFILE"
    elif [ "$DISTRO" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$DISTRO" = "fedora" ]; then
        sudo dnf install -y nodejs npm
    fi
    ok "Node.js installe : $(node --version)"
fi

ok "npm : $(npm --version)"

# ══════════════════════════════════════════════════════════════
# ETAPE 3 — Python 3.11
# ══════════════════════════════════════════════════════════════
step "Verification Python (>= 3.10 requis)..."

PYTHON_CMD=""
# Cherche Python >= 3.10 en priorite (anyio 4.13+ le requiert)
for cmd in python3.11 python3.12 python3.10 python3 python; do
    if command -v "$cmd" &>/dev/null; then
        ver=$($cmd --version 2>&1 | grep -oE '[0-9]+\.[0-9]+')
        major=$(echo "$ver" | cut -d. -f1)
        minor=$(echo "$ver" | cut -d. -f2)
        if [ "$major" -ge 3 ] && [ "$minor" -ge 10 ]; then
            ok "Python compatible trouve ($cmd) : $($cmd --version)"
            PYTHON_CMD="$cmd"
            break
        fi
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    warn "Python >= 3.10 non trouve (version systeme trop ancienne) — installation Python 3.11..."
    if [ "$DISTRO" = "macos" ]; then
        brew install python@3.11
        export PATH="/opt/homebrew/opt/python@3.11/bin:$PATH"
        SHELL_PROFILE="$HOME/.zshrc"
        grep -qxF 'export PATH="/opt/homebrew/opt/python@3.11/bin:$PATH"' "$SHELL_PROFILE" 2>/dev/null \
            || echo 'export PATH="/opt/homebrew/opt/python@3.11/bin:$PATH"' >> "$SHELL_PROFILE"
        PYTHON_CMD="python3.11"
    elif [ "$DISTRO" = "debian" ]; then
        sudo apt-get install -y python3.11 python3.11-venv python3-pip
        PYTHON_CMD="python3.11"
    elif [ "$DISTRO" = "fedora" ]; then
        sudo dnf install -y python3.11
        PYTHON_CMD="python3.11"
    fi
    ok "Python installe : $($PYTHON_CMD --version)"
fi

# Verifie que le module venv est disponible
if ! $PYTHON_CMD -m venv --help &>/dev/null; then
    warn "Module venv manquant — installation..."
    if [ "$DISTRO" = "debian" ]; then
        sudo apt-get install -y python3-venv python3.11-venv
    fi
fi

# ══════════════════════════════════════════════════════════════
# ETAPE 4 — Dependances npm (racine — Electron)
# ══════════════════════════════════════════════════════════════
step "Installation des dependances Electron (racine)..."
npm install
ok "Dependances Electron installees"

# ══════════════════════════════════════════════════════════════
# ETAPE 5 — Dependances npm (frontend/src — React)
# ══════════════════════════════════════════════════════════════
step "Installation des dependances React (frontend/src)..."
cd frontend/src
npm install
cd ../..
ok "Dependances React installees"

# ══════════════════════════════════════════════════════════════
# ETAPE 6 — Environnement virtuel Python
# ══════════════════════════════════════════════════════════════
step "Creation de l'environnement virtuel Python..."
if [ -d "venv" ]; then
    # Verifie que le venv utilise bien Python >= 3.10
    VENV_VER=$(./venv/bin/python --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
    VENV_MINOR=$(echo "$VENV_VER" | cut -d. -f2)
    if [ -n "$VENV_MINOR" ] && [ "$VENV_MINOR" -ge 10 ]; then
        ok "Environnement virtuel OK (Python $VENV_VER) — reutilise"
    else
        warn "Venv existant utilise Python $VENV_VER (trop ancien) — suppression et recreation avec $($PYTHON_CMD --version)..."
        rm -rf venv
        $PYTHON_CMD -m venv venv
        ok "Environnement virtuel recree avec Python $($PYTHON_CMD --version)"
    fi
else
    $PYTHON_CMD -m venv venv
    ok "Environnement virtuel cree dans ./venv"
fi

# ══════════════════════════════════════════════════════════════
# ETAPE 7 — Dependances Python
# ══════════════════════════════════════════════════════════════
step "Installation des dependances Python..."
./venv/bin/pip install --upgrade pip -q
./venv/bin/pip install -r requirements.txt
ok "Dependances Python installees (FastAPI, socketio, uvicorn...)"

# macOS — supprime la quarantaine du binaire backend si present
if [ "$DISTRO" = "macos" ] && [ -f "backend-dist/qomet-server-mac" ]; then
    xattr -d com.apple.quarantine backend-dist/qomet-server-mac 2>/dev/null || true
    chmod +x backend-dist/qomet-server-mac
    ok "Binaire backend macOS configure"
fi

# Linux — rend le binaire executable si present
if [ "$DISTRO" != "macos" ] && [ -f "backend-dist/qomet-server-static" ]; then
    chmod +x backend-dist/qomet-server-static
    ok "Binaire backend Linux configure"
fi

# ══════════════════════════════════════════════════════════════
# RESUME + PROPOSITION DE LANCEMENT
# ══════════════════════════════════════════════════════════════
echo ""
echo -e "  ${GREEN}==========================================${NC}"
echo -e "  ${GREEN} Installation terminee avec succes !${NC}"
echo -e "  ${GREEN}==========================================${NC}"
echo ""
echo -e "  ${YELLOW}⚠️  IMPORTANT — Recharge ton terminal avant de continuer :${NC}"
echo -e "    ${CYAN}source ~/.zshrc${NC}   (ou ouvre un nouveau terminal)"
echo -e "  Cela active le PATH de node et python correctement."
echo ""

read -rp "  As-tu deja lance 'source ~/.zshrc' ou veux-tu lancer QOMET maintenant ? (o/n) : " reponse
if [[ "$reponse" =~ ^[Oo]$ ]]; then
    # Recharge le PATH dans ce script avant de lancer
    export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
    export PATH="/opt/homebrew/opt/python@3.11/bin:$PATH"
    export PATH="/opt/homebrew/bin:$PATH"

    # Demande si on veut le mode dev ou builder un executable de production
    echo ""
    echo -e "  ${CYAN}Que veux-tu faire ?${NC}"
    echo -e "    ${YELLOW}1${NC} — Lancer en mode developpement (npm run electron:dev)"
    echo -e "    ${YELLOW}2${NC} — Construire l'application de production (.dmg / .AppImage)"
    read -rp "  Ton choix (1 ou 2) : " choix_mode

    if [[ "$choix_mode" == "2" ]]; then
        # ── BUILD DE PRODUCTION ─────────────────────────────────────────
        # Desactive les erreurs fatales : electron-builder emet des warnings
        # qui feraient planter le script avec set -e
        set +e

        # 1. Build du frontend React
        step "Build du frontend React..."
        (cd frontend/src && npm run build)
        if [ $? -ne 0 ]; then fail "Build frontend echoue"; fi
        ok "Frontend construit dans frontend/src/dist/"

        # 2. Build du binaire Python (PyInstaller)
        step "Construction du binaire Python (PyInstaller)..."
        ./venv/bin/pip install pyinstaller -q
        if [ $? -ne 0 ]; then fail "Impossible d'installer PyInstaller"; fi
        ok "PyInstaller installe"

        ./venv/bin/pyinstaller qomet-server.spec \
            --distpath dist-py \
            --workpath build-py \
            --noconfirm \
            --clean
        if [ $? -ne 0 ]; then fail "PyInstaller a echoue — voir les erreurs ci-dessus"; fi
        ok "Binaire Python construit dans dist-py/qomet-server"

        mkdir -p backend-dist

        if [ "$DISTRO" = "macos" ]; then
            # 3a. Copie du binaire Mac
            cp dist-py/qomet-server backend-dist/qomet-server-mac
            chmod +x backend-dist/qomet-server-mac
            # Supprime la quarantaine Gatekeeper si presente
            xattr -d com.apple.quarantine backend-dist/qomet-server-mac 2>/dev/null || true
            ok "Binaire copie dans backend-dist/qomet-server-mac"

            # 4a. electron-builder sans signature de code
            step "Construction de l'application macOS (.dmg)..."
            export CSC_IDENTITY_AUTO_DISCOVERY=false
            export CSC_LINK=""
            ./node_modules/.bin/electron-builder --mac --publish never
            BUILD_STATUS=$?
        else
            # 3b. Copie du binaire Linux
            cp dist-py/qomet-server backend-dist/qomet-server-static
            chmod +x backend-dist/qomet-server-static
            ok "Binaire copie dans backend-dist/qomet-server-static"

            # 4b. electron-builder Linux
            step "Construction de l'application Linux (.AppImage)..."
            export CSC_IDENTITY_AUTO_DISCOVERY=false
            ./node_modules/.bin/electron-builder --linux --publish never
            BUILD_STATUS=$?
        fi

        if [ $BUILD_STATUS -eq 0 ]; then
            echo ""
            echo -e "  ${GREEN}============================================${NC}"
            echo -e "  ${GREEN} Build termine avec succes !${NC}"
            echo -e "  ${GREEN} Executable dans le dossier dist/${NC}"
            echo -e "  ${GREEN}============================================${NC}"
            echo ""
            ls -lh dist/*.dmg dist/*.AppImage 2>/dev/null || true
        else
            fail "electron-builder a echoue (code $BUILD_STATUS)"
        fi

        set -e
    else
        # ── MODE DEVELOPPEMENT ───────────────────────────────────────
        echo ""
        echo -e "  ${CYAN}Lancement de QOMET...${NC}"
        echo -e "  ${YELLOW}(Ctrl+C pour arreter l'application)${NC}"
        echo ""
        npm run electron:dev
    fi
else
    echo ""
    echo -e "  Etapes pour lancer QOMET :"
    echo -e "    1. ${CYAN}source ~/.zshrc${NC}          ← recharge le PATH"
    echo -e "    2. ${YELLOW}npm run electron:dev${NC}     ← lance l'application"
    echo ""
    echo -e "  Pour builder l'appli de production manuellement :"
    echo -e "    ${YELLOW}./venv/bin/pip install pyinstaller${NC}"
    echo -e "    ${YELLOW}./venv/bin/pyinstaller qomet-server.spec --distpath dist-py --workpath build-py --noconfirm --clean${NC}"
    echo -e "    macOS  : ${YELLOW}cp dist-py/qomet-server backend-dist/qomet-server-mac${NC}"
    echo -e "    Linux  : ${YELLOW}cp dist-py/qomet-server backend-dist/qomet-server-static${NC}"
    echo -e "    ${YELLOW}export CSC_IDENTITY_AUTO_DISCOVERY=false${NC}"
    echo -e "    macOS  : ${YELLOW}./node_modules/.bin/electron-builder --mac --publish never${NC}"
    echo -e "    Linux  : ${YELLOW}./node_modules/.bin/electron-builder --linux --publish never${NC}"
    echo ""
    echo -e "  Pour les tests :"
    echo -e "    ${YELLOW}source venv/bin/activate && pytest tests/${NC}"
    echo ""
fi
