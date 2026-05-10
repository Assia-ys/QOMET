const LOCAL_URL = 'http://127.0.0.1:7777'

export const SERVER_URL =
  import.meta.env?.VITE_SERVER_URL || LOCAL_URL

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
