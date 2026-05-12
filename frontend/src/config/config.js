export const LOCAL_URL  = 'http://127.0.0.1:7777'
export const ONLINE_URL = import.meta.env?.VITE_SERVER_URL || 'https://qomet-production.up.railway.app'

// En navigateur web : utilise le serveur Railway. En Electron : localhost.
export const SERVER_URL =
  typeof window !== 'undefined' && !window.electronAPI && window.location.origin.startsWith('http')
    ? window.location.origin
    : LOCAL_URL

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
