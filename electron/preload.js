const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  closeApp:      () => ipcRenderer.send('close-app'),
  minimize:      () => ipcRenderer.send('minimize'),
  maximize:      () => ipcRenderer.send('maximize'),
  isElectron:    true,
})
