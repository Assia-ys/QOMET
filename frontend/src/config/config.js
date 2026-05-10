const LOCAL_URL = 'http://127.0.0.1:7777'

// SERVER_URL dynamique : lit l'IP choisie dans localStorage (mode réseau 2 machines)
export function getServerURL() {
  if (typeof window !== 'undefined') {
    const ip = localStorage.getItem('qomet_server_ip')
    if (ip) return `http://${ip}:7777`
  }
  return import.meta.env?.VITE_SERVER_URL || LOCAL_URL
}

// Constante pour compatibilité backwards (IA, dev, localhost)
export const SERVER_URL = LOCAL_URL

export const IS_ELECTRON =
  typeof window !== 'undefined' &&
  typeof window.electronAPI !== 'undefined'

export function closeApp() {
  if (IS_ELECTRON) {
    window.electronAPI.closeApp()
  } else {
    window.close()
  }
}
