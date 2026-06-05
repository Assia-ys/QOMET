# ============================================================
#  QOMET — Script d'installation et lancement (Windows)
#  Lance depuis la racine du projet QOMET :
#    powershell -ExecutionPolicy Bypass -File .\setup.ps1
# ============================================================

$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok   { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "  [!]  $msg" -ForegroundColor Yellow }
function Write-Fail { param($msg) Write-Host "  [X]  $msg" -ForegroundColor Red; exit 1 }

function Refresh-Path {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path","User")
}

Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force

if (-not (Test-Path "package.json") -or -not (Test-Path "requirements.txt")) {
    Write-Fail "Lance ce script depuis la racine du projet QOMET"
}

Write-Host ""
Write-Host "  QOMET - Installation automatique (Windows)" -ForegroundColor Magenta
Write-Host "  ============================================" -ForegroundColor Magenta
Write-Host ""

# ══════════════════════════════════════════════════════════════
# WINGET
# ══════════════════════════════════════════════════════════════
Write-Step "Verification de winget..."
try {
    $wg = winget --version 2>$null
    if ($wg) { Write-Ok "winget : $wg" }
} catch {
    Write-Host "  winget non disponible. Installe Node.js et Python manuellement puis relance." -ForegroundColor Yellow
    exit 1
}

# ══════════════════════════════════════════════════════════════
# GIT
# ══════════════════════════════════════════════════════════════
Write-Step "Verification Git..."
try { $v = git --version 2>$null; Write-Ok "Git : $v" } catch {
    Write-Warn "Git non trouve — installation..."
    winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
    Refresh-Path
}

# ══════════════════════════════════════════════════════════════
# NODE.JS
# ══════════════════════════════════════════════════════════════
Write-Step "Verification Node.js..."
$nodeOk = $false
try { $v = node --version 2>$null; if ($v) { Write-Ok "Node.js : $v"; $nodeOk = $true } } catch {}

if (-not $nodeOk) {
    Write-Warn "Node.js non trouve — installation..."
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    Refresh-Path
    try { $v = node --version 2>$null; if ($v) { Write-Ok "Node.js installe : $v"; $nodeOk = $true } } catch {}
    if (-not $nodeOk) { Write-Fail "Ferme et reouvre ce terminal puis relance le script." }
}
try { $v = npm --version 2>$null; Write-Ok "npm : $v" } catch { Write-Fail "npm non detecte" }

# ══════════════════════════════════════════════════════════════
# PYTHON
# ══════════════════════════════════════════════════════════════
Write-Step "Verification Python..."
$pythonCmd = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $ver = & $cmd --version 2>$null
        if ($ver -match "Python 3") { Write-Ok "Python ($cmd) : $ver"; $pythonCmd = $cmd; break }
    } catch {}
}
if (-not $pythonCmd) {
    Write-Warn "Python non trouve — installation..."
    winget install -e --id Python.Python.3.11 --accept-source-agreements --accept-package-agreements
    Refresh-Path
    foreach ($cmd in @("python", "py")) {
        try {
            $ver = & $cmd --version 2>$null
            if ($ver -match "Python 3") { Write-Ok "Python installe : $ver"; $pythonCmd = $cmd; break }
        } catch {}
    }
    if (-not $pythonCmd) { Write-Fail "Python non detecte apres installation. Relance le script." }
}

# ══════════════════════════════════════════════════════════════
# DEPENDANCES NPM — ELECTRON (racine)
# ELECTRON_MIRROR evite l'echec de telechargement du binaire
# ══════════════════════════════════════════════════════════════
Write-Step "Installation des dependances Electron (racine)..."
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
npm install
if ($LASTEXITCODE -ne 0) { Write-Fail "npm install a echoue" }

# Verifie que le binaire Electron est bien present apres npm install
$electronBin = "node_modules\electron\dist\electron.exe"
if (-not (Test-Path $electronBin)) {
    Write-Warn "Binaire Electron manquant — reinstallation forcee..."
    Remove-Item -Recurse -Force "node_modules\electron" -ErrorAction SilentlyContinue
    $env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
    npm install electron
}

if (-not (Test-Path $electronBin)) {
    Write-Warn "npmmirror echoue — tentative miroir officiel GitHub..."
    Remove-Item -Recurse -Force "node_modules\electron" -ErrorAction SilentlyContinue
    Remove-Item -Force "node_modules\electron" -ErrorAction SilentlyContinue
    $env:ELECTRON_MIRROR = "https://github.com/electron/electron/releases/download/"
    npm install electron
}

if (Test-Path $electronBin) {
    Write-Ok "Binaire Electron OK"
} else {
    Write-Fail "Binaire Electron introuvable. Verifie ta connexion internet et relance."
}
Write-Ok "Dependances Electron installees"

# ══════════════════════════════════════════════════════════════
# DEPENDANCES NPM — REACT (frontend/src)
# ══════════════════════════════════════════════════════════════
Write-Step "Installation des dependances React (frontend/src)..."
Set-Location "frontend\src"
npm install
if ($LASTEXITCODE -ne 0) { Set-Location "..\.."; Write-Fail "npm install frontend a echoue" }
Set-Location "..\.."
Write-Ok "Dependances React installees"

# ══════════════════════════════════════════════════════════════
# ENVIRONNEMENT VIRTUEL PYTHON
# ══════════════════════════════════════════════════════════════
Write-Step "Creation de l'environnement virtuel Python..."
if (Test-Path "venv") {
    $venvVer = & ".\venv\Scripts\python.exe" --version 2>$null
    if ($venvVer -match "3\.([0-9]+)" -and [int]$Matches[1] -lt 10) {
        Write-Warn "Venv trop ancien ($venvVer) — recreation..."
        Remove-Item -Recurse -Force "venv"
        & $pythonCmd -m venv venv
        Write-Ok "Venv recree"
    } else {
        Write-Ok "Venv OK ($venvVer) — reutilise"
    }
} else {
    & $pythonCmd -m venv venv
    if ($LASTEXITCODE -ne 0) { Write-Fail "Creation du venv echouee" }
    Write-Ok "Venv cree dans ./venv"
}

# ══════════════════════════════════════════════════════════════
# DEPENDANCES PYTHON
# ══════════════════════════════════════════════════════════════
Write-Step "Installation des dependances Python..."
$pip = ".\venv\Scripts\pip.exe"
& $pip install --upgrade pip -q 2>$null
& $pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) { Write-Fail "pip install a echoue" }
Write-Ok "Dependances Python installees"

# ══════════════════════════════════════════════════════════════
# RESUME + LANCEMENT
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
    Write-Host "  (Ctrl+C pour arreter)" -ForegroundColor Yellow
    Write-Host ""
    npm run electron:dev
} else {
    Write-Host ""
    Write-Host "  Pour lancer :"      -ForegroundColor White
    Write-Host "    npm run electron:dev"   -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Pour builder .exe :" -ForegroundColor White
    Write-Host "    npm run electron:build" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Pour les tests :"    -ForegroundColor White
    Write-Host "    .\venv\Scripts\activate ; pytest tests/" -ForegroundColor Yellow
    Write-Host ""
}
