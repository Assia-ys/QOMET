const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const { spawn }  = require('child_process')
const path       = require('path')
const http       = require('http')
const net        = require('net')
const os         = require('os')

const isDev  = process.env.NODE_ENV === 'development'
const PORT   = 7777
let   win    = null
let   server = null

// ── Utilitaires réseau ─────────────────────────────────────────────────────────

function getLocalIP() {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const iface of nets[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return '127.0.0.1'
}

function getSubnet() {
  const ip = getLocalIP()
  return ip.split('.').slice(0, 3).join('.')
}

function checkPort(ip, port, timeout = 300) {
  return new Promise((resolve) => {
    const sock = new net.Socket()
    sock.setTimeout(timeout)
    sock.on('connect', () => { sock.destroy(); resolve(true) })
    sock.on('error',   () => { sock.destroy(); resolve(false) })
    sock.on('timeout', () => { sock.destroy(); resolve(false) })
    sock.connect(port, ip)
  })
}

function fetchInfo(ip) {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: ip, port: PORT, path: '/info', timeout: 1000 },
      (res) => {
        let data = ''
        res.on('data', d => data += d)
        res.on('end', () => {
          try { resolve(JSON.parse(data)) }
          catch { resolve(null) }
        })
      }
    )
    req.on('error',   () => resolve(null))
    req.on('timeout', () => { req.destroy(); resolve(null) })
  })
}

async function scanReseau() {
  const subnet  = getSubnet()
  const results = []
  const ips     = Array.from({ length: 254 }, (_, i) => `${subnet}.${i + 1}`)

  // Scan par groupes de 30 en parallèle
  for (let i = 0; i < ips.length; i += 30) {
    const groupe = ips.slice(i, i + 30)
    const checks = groupe.map(async (ip) => {
      const ouvert = await checkPort(ip, PORT, 300)
      if (!ouvert) return null
      const info = await fetchInfo(ip)
      if (info?.app === 'QOMET') return { ip, ...info }
      return null
    })
    const trouves = (await Promise.all(checks)).filter(Boolean)
    results.push(...trouves)
  }
  return results
}

// ── Démarrer le backend Python ─────────────────────────────────────────────

function demarrerBackend() {
  const exe = isDev
    ? (process.platform === 'win32' ? 'python' : 'python3')
    : path.join(process.resourcesPath, 'qomet-server.exe')

  const args = isDev ? [path.join(__dirname, '..', 'app.py')] : []

  console.log('[Backend] Démarrage...', exe, args)
  server = spawn(exe, args, {
    env:   { ...process.env, PORT: String(PORT) },
    stdio: 'pipe',
  })

  server.stdout.on('data', d => console.log('[Backend]', d.toString()))
  server.stderr.on('data', d => console.error('[Backend ERR]', d.toString()))
  server.on('close', code => console.log('[Backend] Arrêté, code:', code))
}

function arreterBackend() {
  if (server) {
    server.kill()
    server = null
  }
}

// ── Attendre que le backend réponde ────────────────────────────────────────

function attendreBackend(tentatives = 0) {
  return new Promise((resolve, reject) => {
    const essai = () => {
      http.get(`http://127.0.0.1:${PORT}/health`, res => {
        if (res.statusCode === 200) resolve()
        else retry()
      }).on('error', retry)
    }

    const retry = () => {
      if (tentatives > 30) { reject(new Error('Backend timeout')); return }
      tentatives++
      setTimeout(essai, 500)
    }

    essai()
  })
}

// ── Créer la fenêtre principale ─────────────────────────────────────────────

function creerFenetre() {
  win = new BrowserWindow({
    width:  1280,
    height: 800,
    minWidth:  1024,
    minHeight: 700,
    title: 'QOMET',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  Menu.setApplicationMenu(null)

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '..', 'frontend', 'src', 'dist', 'index.html'))
  }

  win.on('closed', () => { win = null })
}

// ── Cycle de vie de l'app ──────────────────────────────────────────────────

app.whenReady().then(async () => {
  demarrerBackend()
  try {
    await attendreBackend()
    console.log('[Backend] Prêt ✓')
  } catch {
    console.error('[Backend] Timeout — lancement quand même')
  }
  creerFenetre()
})

app.on('window-all-closed', () => {
  arreterBackend()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (win === null) creerFenetre()
})

app.on('will-quit', () => arreterBackend())

// ── IPC ────────────────────────────────────────────────────────────────────

ipcMain.on('close-app',  () => app.quit())
ipcMain.on('minimize',   () => win?.minimize())
ipcMain.on('maximize',   () => win?.isMaximized() ? win.unmaximize() : win.maximize())
ipcMain.handle('scan-reseau', () => scanReseau())
ipcMain.handle('get-local-ip', () => getLocalIP())
