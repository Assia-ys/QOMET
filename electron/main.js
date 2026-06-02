const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron')
const { spawn, exec }  = require('child_process')
const path       = require('path')
const fs         = require('fs')
const http       = require('http')
const net        = require('net')
const dgram      = require('dgram')
const os         = require('os')

const isDev  = process.env.NODE_ENV === 'development'
const PORT   = 7777
let   win    = null
let   server = null

// ── Utilitaires réseau ─────────────────────────────────────────────────────────

const ADAPTATEURS_VIRTUELS = ['hyper', 'vethernet', 'vmware', 'virtualbox', 'vbox', 'wsl', 'bluetooth', 'virtual', 'vpn', 'tap', 'tunnel', 'loopback']

// Plages IP réservées aux adaptateurs virtuels ou non-routables
// 192.0.0.x = USB Apple (iPhone tethering USB sur Windows) — jamais une IP LAN réelle
// 169.254.x.x = APIPA link-local (pas de DHCP) — jamais utilisable
const PLAGES_VIRTUELLES = ['192.168.56.', '192.168.99.', '192.168.100.', '10.0.2.', '192.0.0.', '169.254.']

function getLocalIPs() {
  const nets = os.networkInterfaces()
  const result = []
  for (const [name, ifaces] of Object.entries(nets)) {
    const lower = name.toLowerCase()
    if (ADAPTATEURS_VIRTUELS.some(s => lower.includes(s))) continue
    for (const iface of ifaces) {
      if (iface.family !== 'IPv4' || iface.internal) continue
      if (PLAGES_VIRTUELLES.some(p => iface.address.startsWith(p))) continue
      result.push(iface.address)
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

// ── Logs vers renderer (visibles dans DevTools via Ctrl+Shift+I) ──────────────
function log(msg) {
  console.log(msg)
  try { win?.webContents?.send('main-log', msg) } catch {}
}

// ── Broadcast hôte UDP ────────────────────────────────────────────────────────
// L'hôte broadcaste son IP + code toutes les 500ms dès qu'il crée la partie.
// Le rejoignant écoute ce broadcast et se connecte directement.

const UDP_PORT = 7778
let _broadcastSocket   = null
let _broadcastInterval = null

function demarrerBroadcastHote(code) {
  arreterBroadcastHote()
  const ip = getLocalIP()
  if (ip === '127.0.0.1') return null  // aucune IP LAN valide — ne pas broadcaster ni enregistrer
  const msg = Buffer.from(JSON.stringify({ type: 'QOMET_HOST', ip, port: PORT, code: code.toUpperCase() }))

  _broadcastSocket = dgram.createSocket('udp4')
  _broadcastSocket.on('error', () => {})
  _broadcastSocket.bind(0, () => {
    _broadcastSocket.setBroadcast(true)
    log(`[UDP] Broadcast hôte démarré — IP: ${ip}, code: ${code}`)
  })

  _broadcastInterval = setInterval(() => {
    if (!_broadcastSocket) return
    _broadcastSocket.send(msg, 0, msg.length, UDP_PORT, '255.255.255.255', () => {})
    const subnet = ip.split('.').slice(0, 3).join('.')
    _broadcastSocket.send(msg, 0, msg.length, UDP_PORT, `${subnet}.255`, () => {})
  }, 500)

  return ip
}

function arreterBroadcastHote() {
  if (_broadcastInterval) { clearInterval(_broadcastInterval); _broadcastInterval = null }
  if (_broadcastSocket)   { try { _broadcastSocket.close() } catch {} ; _broadcastSocket = null }
}

// ── Écoute UDP rejoignant ─────────────────────────────────────────────────────
// Écoute les broadcasts de l'hôte pendant `timeoutMs` ms.
// Retourne l'URL du serveur si le code correspond, sinon null.

function ecouterBroadcastUDP(code, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const upperCode = code.toUpperCase()
    const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true })
    let done = false

    const finish = (result) => {
      if (done) return
      done = true
      try { sock.close() } catch {}
      resolve(result)
    }

    sock.on('message', (buf) => {
      try {
        const data = JSON.parse(buf.toString())
        if (data.type === 'QOMET_HOST' && data.code === upperCode) {
          log(`[UDP] Hôte trouvé: ${data.ip}`)
          finish(`http://${data.ip}:${data.port}`)
        }
      } catch {}
    })

    sock.on('error', () => finish(null))

    sock.bind(UDP_PORT, () => {
      sock.setBroadcast(true)
      log(`[UDP] Écoute broadcast sur port ${UDP_PORT}...`)
    })

    setTimeout(() => finish(null), timeoutMs)
  })
}

// ── Découverte serveur ─────────────────────────────────────────────────────────
// Retourne : URL string = trouvé | 'INVALID_CODE' = code inexistant | null = pas de serveur

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

async function trouverServeur(code) {
  const upperCode = code.toUpperCase()
  const localIPs  = getLocalIPs()
  log(`[Découverte] Démarrage — code: ${upperCode} | IP locale: ${localIPs[0]}`)

  // ── 1. UDP — écoute le broadcast de l'hôte (4s) ────────────────────────────
  const udpResult = await ecouterBroadcastUDP(upperCode, 4000)
  if (udpResult) {
    log(`[UDP] Connexion directe: ${udpResult}`)
    return udpResult
  }
  log('[UDP] Aucun broadcast reçu — passage ARP')

  // ── 2. ARP — voisins récents ────────────────────────────────────────────────
  const arpIPs = (await getArpIPs()).filter(ip => !localIPs.includes(ip))
  log(`[ARP] ${arpIPs.length} voisins`)

  const arpServers = (await Promise.all(
    arpIPs.map(async ip => {
      if (!await checkPort(ip, PORT, 500)) return null
      const info = await fetchInfo(ip)
      if (info?.status === 'ok') log(`[ARP] Serveur QOMET: ${ip}`)
      return info?.status === 'ok' ? ip : null
    })
  )).filter(Boolean)

  for (const ip of arpServers) {
    if (await serverHasRoom(ip, upperCode)) return `http://${ip}:${PORT}`
  }
  if (arpServers.length > 0) return 'INVALID_CODE'
  log('[ARP] Aucun serveur — passage scan HTTP')

  // ── 3. HTTP scan du sous-réseau ─────────────────────────────────────────────
  const subnets = getSubnets()
  const subnetIPs = subnets
    .flatMap(s => Array.from({ length: 254 }, (_, i) => `${s}.${i + 1}`))
    .filter(ip => !localIPs.includes(ip) && !arpIPs.includes(ip))
  log(`[HTTP] Scan ${subnetIPs.length} IPs sur ${subnets.join(', ')}`)

  const servers = []
  for (let i = 0; i < subnetIPs.length; i += 30) {
    const batch = subnetIPs.slice(i, i + 30)
    const found = (await Promise.all(batch.map(async ip => {
      if (!await checkPort(ip, PORT, 400)) return null
      const info = await fetchInfo(ip)
      if (info?.status === 'ok') log(`[HTTP] Serveur QOMET: ${ip}`)
      return info?.status === 'ok' ? ip : null
    }))).filter(Boolean)
    servers.push(...found)
    if (servers.length > 0) break
  }

  if (servers.length === 0) return null

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

  // Sur macOS, le binaire téléchargé est mis en quarantaine par Gatekeeper —
  // on supprime cet attribut avant de le lancer.
  if (!isDev && process.platform === 'darwin') {
    try { require('child_process').execSync(`xattr -d com.apple.quarantine "${exe}" 2>/dev/null`) } catch {}
    try { require('child_process').execSync(`chmod +x "${exe}"`) } catch {}
  }

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
  const cmds = [
    'netsh advfirewall firewall delete rule name="QOMET"',
    'netsh advfirewall firewall delete rule name="QOMET-UDP"',
    'netsh advfirewall firewall add rule name="QOMET" dir=in action=allow protocol=TCP localport=7777 profile=any',
    'netsh advfirewall firewall add rule name="QOMET-UDP" dir=in action=allow protocol=UDP localport=7778 profile=any',
  ].join(' & ')
  exec(cmds, () => {})
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
ipcMain.handle('scan-reseau',         () => scanReseau())
ipcMain.handle('get-local-ip',        () => getLocalIP())
ipcMain.handle('ouvrir-url',          (_, url) => shell.openExternal(url))
ipcMain.handle('trouver-serveur',     (_, code) => trouverServeur(code))
ipcMain.handle('demarrer-broadcast',  (_, code) => demarrerBroadcastHote(code))
ipcMain.handle('arreter-broadcast',   () => arreterBroadcastHote())
ipcMain.handle('get-network-info', async () => ({
  localIPs: getLocalIPs(),
  subnets:  getSubnets(),
  arpIPs:   await getArpIPs(),
}))
ipcMain.handle('set-fullscreen',      (_, val) => win?.setFullScreen(!!val))
ipcMain.handle('get-fullscreen',      () => win?.isFullScreen() ?? false)
