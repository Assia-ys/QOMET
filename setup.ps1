# ============================================================
#  QOMET — Script d'installation et lancement (Windows)
#  Lance depuis la racine du projet QOMET :
#    Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force
#    .\setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [!]  $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "  [X]  $msg" -ForegroundColor Red; exit 1 }

# Recharge le PATH sans redemarrer le terminal
function Refresh-Path {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path","User")
}

# ── Autorise l'execution des scripts PowerShell ───────────────────────────────
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force

# ── Verifie qu'on est bien dans le dossier QOMET ──────────────────────────────
if (-not (Test-Path "package.json") -or -not (Test-Path "requirements.txt")) {
    Write-Fail "Lance ce script depuis la racine du projet QOMET"
}

Write-Host ""
Write-Host "  QOMET - Installation automatique (Windows)" -ForegroundColor Magenta
Write-Host "  ============================================" -ForegroundColor Magenta
Write-Host ""

# ══════════════════════════════════════════════════════════════
# WINGET — verifie que le gestionnaire de paquets est disponible
# ══════════════════════════════════════════════════════════════
Write-Step "Verification de winget..."
$wingetOk = $false
try {
    $wg = winget --version 2>$null
    if ($wg) { Write-Ok "winget disponible : $wg"; $wingetOk = $true }
} catch {}

if (-not $wingetOk) {
    Write-Warn "winget non disponible. Installation manuelle requise :"
    Write-Host "  1. Node.js   : https://nodejs.org" -ForegroundColor Yellow
    Write-Host "  2. Python    : https://www.python.org (cocher 'Add to PATH')" -ForegroundColor Yellow
    Write-Host "  Puis relance ce script." -ForegroundColor Yellow
    exit 1
}

# ══════════════════════════════════════════════════════════════
# ETAPE 1 — Git
# ══════════════════════════════════════════════════════════════
Write-Step "Verification Git..."
$gitOk = $false
try { $v = git --version 2>$null; if ($v) { Write-Ok "Git : $v"; $gitOk = $true } } catch {}

if (-not $gitOk) {
    Write-Warn "Git non trouve — installation..."
    winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
    Refresh-Path
    try { $v = git --version 2>$null; if ($v) { Write-Ok "Git installe : $v"; $gitOk = $true } } catch {}
    if (-not $gitOk) { Write-Warn "Git installe mais non detecte. Continue quand meme..." }
}

# ══════════════════════════════════════════════════════════════
# ETAPE 2 — Node.js
# ══════════════════════════════════════════════════════════════
Write-Step "Verification Node.js..."
$nodeOk = $false
try { $v = node --version 2>$null; if ($v) { Write-Ok "Node.js : $v"; $nodeOk = $true } } catch {}

if (-not $nodeOk) {
    Write-Warn "Node.js non trouve — installation..."
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    Refresh-Path
    try { $v = node --version 2>$null; if ($v) { Write-Ok "Node.js installe : $v"; $nodeOk = $true } } catch {}
    if (-not $nodeOk) { Write-Fail "Node.js installe mais non detecte. Ferme et reouvre ce terminal puis relance le script." }
}

# Verifie npm
try { $v = npm --version 2>$null; Write-Ok "npm : $v" } catch { Write-Fail "npm non detecte apres installation de Node.js" }

# ══════════════════════════════════════════════════════════════
# ETAPE 3 — Python 3.11
# ══════════════════════════════════════════════════════════════
Write-Step "Verification Python..."
$pythonCmd = $null

foreach ($cmd in @("python", "python3", "py")) {
    try {
        $ver = & $cmd --version 2>$null
        if ($ver -match "Python 3") {
            Write-Ok "Python trouve ($cmd) : $ver"
            $pythonCmd = $cmd
            break
        }
    } catch {}
}

if (-not $pythonCmd) {
    Write-Warn "Python non trouve — installation de Python 3.11..."
    winget install -e --id Python.Python.3.11 --accept-source-agreements --accept-package-agreements
    Refresh-Path
    foreach ($cmd in @("python", "python3", "py")) {
        try {
            $ver = & $cmd --version 2>$null
            if ($ver -match "Python 3") {
                Write-Ok "Python installe ($cmd) : $ver"
                $pythonCmd = $cmd
                break
            }
        } catch {}
    }
    if (-not $pythonCmd) { Write-Fail "Python installe mais non detecte. Ferme et reouvre ce terminal puis relance." }
}

# ══════════════════════════════════════════════════════════════
# ETAPE 4 — Visual C++ Build Tools (requis par certains modules npm)
# ══════════════════════════════════════════════════════════════
Write-Step "Verification des outils de compilation C++..."
try {
    $vs = Get-Command "cl.exe" -ErrorAction SilentlyContinue
    if ($vs) { Write-Ok "Outils C++ disponibles" }
    else {
        Write-Warn "Outils C++ non detectes — installation des Build Tools..."
        winget install -e --id Microsoft.VisualStudio.2022.BuildTools --accept-source-agreements --accept-package-agreements
        Write-Ok "Build Tools installes"
    }
} catch { Write-Warn "Verification C++ ignoree — continue..." }

# ══════════════════════════════════════════════════════════════
# ETAPE 5 — Dependances npm (racine — Electron)
# ══════════════════════════════════════════════════════════════
Write-Step "Installation des dependances Electron (racine)..."
npm install
if ($LASTEXITCODE -ne 0) { Write-Fail "npm install racine a echoue" }
Write-Ok "Dependances Electron installees"

# ══════════════════════════════════════════════════════════════
# ETAPE 6 — Dependances npm (frontend/src — React)
# ══════════════════════════════════════════════════════════════
Write-Step "Installation des dependances React (frontend/src)..."
Set-Location "frontend\src"
npm install
if ($LASTEXITCODE -ne 0) { Set-Location "..\.."; Write-Fail "npm install frontend a echoue" }
Set-Location "..\.."
Write-Ok "Dependances React installees"

# ══════════════════════════════════════════════════════════════
# ETAPE 7 — Environnement virtuel Python
# ══════════════════════════════════════════════════════════════
Write-Step "Creation de l'environnement virtuel Python..."
if (Test-Path "venv") {
    Write-Ok "Environnement virtuel deja present — reutilise"
} else {
    & $pythonCmd -m venv venv
    if ($LASTEXITCODE -ne 0) { Write-Fail "Creation du venv echouee" }
    Write-Ok "Environnement virtuel cree dans ./venv"
}

# ══════════════════════════════════════════════════════════════
# ETAPE 8 — Dependances Python
# ══════════════════════════════════════════════════════════════
Write-Step "Installation des dependances Python..."
$pip = ".\venv\Scripts\pip.exe"
& $pip install --upgrade pip -q
& $pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) { Write-Fail "pip install a echoue" }
Write-Ok "Dependances Python installees (FastAPI, socketio, uvicorn...)"

# ══════════════════════════════════════════════════════════════
# RESUME + PROPOSITION DE LANCEMENT
# ══════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   Installation terminee avec succes !" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""

$reponse = Read-Host "  Lancer QOMET maintenant ? (O/N)"
if ($reponse -match "^[Oo]$") {
    Write-Host ""
    Write-Host "  Lancement de QOMET..." -ForegroundColor Cyan
    Write-Host "  (Ctrl+C pour arreter l'application)" -ForegroundColor Yellow
    Write-Host ""
    npm run electron:dev
} else {
    Write-Host ""
    Write-Host "  Pour lancer plus tard :" -ForegroundColor White
    Write-Host "    npm run electron:dev" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Pour builder le .exe :" -ForegroundColor White
    Write-Host "    npm run electron:build" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Pour les tests :" -ForegroundColor White
    Write-Host "    .\venv\Scripts\activate  puis  pytest tests/" -ForegroundColor Yellow
    Write-Host ""
}
