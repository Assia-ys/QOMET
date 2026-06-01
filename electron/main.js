const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron')
const { spawn, exec }  = require('child_process')
const path       = require('path')
const fs         = require('fs')
const http       = require('http')
const net        = require('net')
const os         = require('os')

const isDev  = process.env.NODE_ENV === 'development'
const PORT   = 7777
let   win    = null
let   server = null

// ── Utilitaires réseau ─────────────────────────────────────────────────────────

const ADAPTATEURS_VIRTUELS = ['hyper', 'vethernet', 'vmware', 'virtualbox', 'wsl', 'bluetooth', 'virtual', 'vpn', 'tap', 'tunnel']

function getLocalIPs() {
  const nets = os.networkInterfaces()
  const result = []
  for (const [name, ifaces] of Object.entries(nets)) {
    const lower = name.toLowerCase()
    if (ADAPTATEURS_VIRTUELS.some(s => lower.includes(s))) continue
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) result.push(iface.address)
    }
  }
  return result.length ? result : ['127.0.0.1']
}

function getLocalIP() {
  return getLocalIPs()[0]
}

function getSubnets() {
  const ips = getLocalIPs()
  return [...new Set(ips.map(ip => ip.split('.').slice(0, 3).join('.')))]
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
      { hostname: ip, port: PORT, path: '/health', timeout: 1000 },
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

function getArpIPs() {
  return new Promise((resolve) => {
    const { exec } = require('child_process')
    const cmd = process.platform === 'win32' ? 'arp -a' : 'arp -n'
    exec(cmd, (err, stdout) => {
      if (err) { resolve([]); return }
      const ips = []
      const regex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g
      let match
      while ((match = regex.exec(stdout)) !== null) {
        const ip = match[1]
        if (!ip.endsWith('.255') && !ip.startsWith('127.') && !ip.startsWith('224.') && !ip.startsWith('239.'))
          ips.push(ip)
      }
      resolve([...new Set(ips)])
    })
  })
}

async function scanReseau() {
  const [arpIPs, subnets] = await Promise.all([getArpIPs(), Promise.resolve(getSubnets())])

  const subnetIPs = subnets.flatMap(subnet =>
    Array.from({ length: 254 }, (_, i) => `${subnet}.${i + 1}`)
  )

  const allIPs = [...new Set([...arpIPs, ...subnetIPs])]
  const results = []

  for (let i = 0; i < allIPs.length; i += 30) {
    const groupe = allIPs.slice(i, i + 30)
    const checks = groupe.map(async (ip) => {
      const ouvert = await checkPort(ip, PORT, 500)
      if (!ouvert) return null
      const info = await fetchInfo(ip)
      if (info?.status === 'ok') return { ip, hostname: info.hostname || ip, ...info }
      return null
    })
    const trouves = (await Promise.all(checks)).filter(Boolean)
    results.push(...trouves)
  }
  return results
}

// ── Découverte serveur ─────────────────────────────────────────────────────────

function serverHasRoom(ip, code) {
  return new Promise((resolve) => {
    const req = http.get(
      { hostname: ip, port: PORT, path: `/parties/${encodeURIComponent(code)}`, timeout: 1000 },
      (res) => {
        let data = ''
        res.on('data', d => data += d)
        res.on('end', () => {
          if (res.statusCode !== 200) { resolve(false); return }
          try { resolve(!JSON.parse(data).pleine) }
          catch { resolve(false) }
        })
      }
    )
    req.on('error',   () => resolve(false))
    req.on('timeout', () => { req.destroy(); resolve(false) })
  })
}

// Retourne : URL string = trouvé | 'INVALID_CODE' = serveur trouvé mais code inexistant | null = pas de serveur
async function trouverServeur(code) {
  const upperCode = code.toUpperCase()
  const localIPs  = getLocalIPs()

  // Étape 1 : scan complet ARP + sous-réseau pour trouver tous les serveurs QOMET
  const [arpIPs, subnets] = await Promise.all([getArpIPs(), Promise.resolve(getSubnets())])
  const subnetIPs = subnets.flatMap(s =>
    Array.from({ length: 254 }, (_, i) => `${s}.${i + 1}`)
  ).filter(ip => !arpIPs.includes(ip))
  const allIPs = [...arpIPs, ...subnetIPs].filter(ip => !localIPs.includes(ip))

  const servers = []
  for (let i = 0; i < allIPs.length; i += 30) {
    const batch = allIPs.slice(i, i + 30)
    const found = await Promise.all(batch.map(async ip => {
      const ouvert = await checkPort(ip, PORT, 400)
      if (!ouvert) return null
      const info = await fetchInfo(ip)
      return info?.status === 'ok' ? ip : null
    }))
    servers.push(...found.filter(Boolean))
  }

  if (servers.length === 0) return null

  // Étape 2 : chercher la room exacte (3 tentatives, délai 1s — la room peut ne pas être encore créée)
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const ip of servers) {
      if (await serverHasRoom(ip, upperCode)) return `http://${ip}:${PORT}`
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 1000))
  }

  return 'INVALID_CODE'
}

// ── Démarrer le backend Python ─────────────────────────────────────────────

function demarrerBackend() {
  const binName = process.platform === 'win32' ? 'qomet-server.exe' : 'qomet-server'
  const exe = isDev
    ? (process.platform === 'win32' ? 'python' : 'python3')
    : path.join(process.resourcesPath, binName)

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

  // Ctrl+Shift+I pour ouvrir les DevTools (debug réseau)
  win.webContents.on('before-input-event', (_, input) => {
    if (input.control && input.shift && input.key === 'I')
      win.webContents.openDevTools()
  })
}

// ── Pare-feu Windows (fix silencieux, une seule fois) ─────────────────────
// Tente de mettre à jour les règles sans UAC. Si l'app tourne en admin
// (cas courant pour un installeur NSIS one-click), ça passe silencieusement.
// Sinon, l'utilisateur devra réinstaller avec le nouveau setup.exe.

function fixerParefeuWindows() {
  if (process.platform !== 'win32') return
  const flagPath = path.join(app.getPath('userData'), '.fw-any')
  if (fs.existsSync(flagPath)) return  // Déjà fait
  const cmds = [
    'netsh advfirewall firewall delete rule name="QOMET"',
    'netsh advfirewall firewall delete rule name="QOMET-UDP"',
    'netsh advfirewall firewall add rule name="QOMET" dir=in action=allow protocol=TCP localport=7777 profile=any',
    'netsh advfirewall firewall add rule name="QOMET-UDP" dir=in action=allow protocol=UDP localport=7778 profile=any',
  ].join(' & ')
  exec(cmds, (err) => {
    if (!err) fs.writeFileSync(flagPath, '1')
  })
}

// ── Cycle de vie de l'app ──────────────────────────────────────────────────

app.whenReady().then(async () => {
  fixerParefeuWindows()
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
ipcMain.handle('scan-reseau',      () => scanReseau())
ipcMain.handle('get-local-ip',     () => getLocalIP())
ipcMain.handle('ouvrir-url',       (_, url) => shell.openExternal(url))
ipcMain.handle('trouver-serveur',  (_, code) => trouverServeur(code))
ipcMain.handle('get-network-info', async () => ({
  localIPs: getLocalIPs(),
  subnets:  getSubnets(),
  arpIPs:   await getArpIPs(),
}))
ipcMain.handle('set-fullscreen',   (_, val) => win?.setFullScreen(!!val))
ipcMain.handle('get-fullscreen',   () => win?.isFullScreen() ?? false)
