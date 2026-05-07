// URL du serveur backend
// Priorité : variable d'env > window global (Electron) > défaut local
export const SERVER_URL =
  import.meta.env?.VITE_SERVER_URL ||
  (typeof window !== 'undefined' && window.QOMET_SERVER_URL) ||
  window.location.origin 
  // Détecte si l'app tourne dans Electron
export const IS_ELECTRON =
  typeof window !== 'undefined' &&
  typeof window.process === 'object' &&
  window.process.type === 'renderer'

// Ferme l'application (compatible web + Electron)
export function closeApp() {
  if (IS_ELECTRON && window.ipcRenderer) {
    window.ipcRenderer.send('close-app')
  } else {
    window.close()
  }
}
