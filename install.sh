#!/bin/bash

echo ""
echo " ╔══════════════════════════════════╗"
echo " ║     Installation de QOMET        ║"
echo " ╚══════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OS="$(uname -s)"

# ── Détecter l'OS et définir les chemins ──────────────────────────────

if [ "$OS" = "Darwin" ]; then
    INSTALL_DIR="$HOME/Applications/QOMET"
    APP_SRC="$SCRIPT_DIR/QOMET-darwin-x64"
    DESKTOP="$HOME/Desktop"
    APP_EXEC="$INSTALL_DIR/QOMET.app/Contents/MacOS/QOMET"
elif [ "$OS" = "Linux" ]; then
    INSTALL_DIR="$HOME/.local/share/QOMET"
    APP_SRC="$SCRIPT_DIR/QOMET-linux-x64"
    DESKTOP="$HOME/Desktop"
    APP_EXEC="$INSTALL_DIR/QOMET"
else
    echo "[ERREUR] OS non supporté : $OS"
    exit 1
fi

# ── Vérifier que le dossier source existe ─────────────────────────────

if [ ! -d "$APP_SRC" ]; then
    echo "[ERREUR] Dossier $APP_SRC introuvable."
    echo "Assurez-vous que le bon dossier est à côté de ce script."
    exit 1
fi

# ── Copier l'application ──────────────────────────────────────────────

echo "[1/3] Copie de l'application..."
rm -rf "$INSTALL_DIR"
cp -r "$APP_SRC" "$INSTALL_DIR"
chmod +x "$APP_EXEC" 2>/dev/null
echo "      OK → $INSTALL_DIR"

# ── Créer le raccourci bureau ─────────────────────────────────────────

echo "[2/3] Création du raccourci bureau..."
mkdir -p "$DESKTOP"

if [ "$OS" = "Linux" ]; then
    cat > "$DESKTOP/QOMET.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=QOMET
Comment=Jeu de stratégie QOMET
Exec=$APP_EXEC
Icon=$INSTALL_DIR/resources/app/assets/icon.png
Terminal=false
Categories=Game;
EOF
    chmod +x "$DESKTOP/QOMET.desktop"
elif [ "$OS" = "Darwin" ]; then
    ln -sf "$INSTALL_DIR" "$DESKTOP/QOMET"
fi

echo "      OK → $DESKTOP"

# ── Terminer ──────────────────────────────────────────────────────────

echo "[3/3] Installation terminée !"
echo ""
echo " QOMET a été installé dans :"
echo " $INSTALL_DIR"
echo ""
echo " Un raccourci a été créé sur votre Bureau."
echo " Double-cliquez sur QOMET pour jouer !"
echo ""
