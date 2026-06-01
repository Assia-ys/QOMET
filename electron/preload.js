const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  closeApp:   () => ipcRenderer.send('close-app'),
  minimize:   () => ipcRenderer.send('minimize'),
  maximize:   () => ipcRenderer.send('maximize'),
  isElectron: true,
  scanReseau:      () => ipcRenderer.invoke('scan-reseau'),
  getLocalIP:      () => ipcRenderer.invoke('get-local-ip'),
  ouvrirURL:       (url) => ipcRenderer.invoke('ouvrir-url', url),
  trouverServeur:  (code) => ipcRenderer.invoke('trouver-serveur', code),
  getNetworkInfo:  ()     => ipcRenderer.invoke('get-network-info'),
  setFullScreen:   (val)  => ipcRenderer.invoke('set-fullscreen', val),
  getFullScreen:   ()     => ipcRenderer.invoke('get-fullscreen'),
  onMainLog:       (cb)   => ipcRenderer.on('main-log', (_, msg) => cb(msg)),
})
