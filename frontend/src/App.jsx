import { useEffect } from 'react'
import AppRouter from './router'

export default function App() {
  useEffect(() => {
    const pref = localStorage.getItem('qomet_plein_ecran') === 'true'
    if (window.electronAPI?.setFullScreen) {
      window.electronAPI.setFullScreen(pref)
    }
    // Affiche les logs du processus principal dans la console DevTools
    if (window.electronAPI?.onMainLog) {
      window.electronAPI.onMainLog((msg) => console.log('[Main]', msg))
    }
  }, [])

  return <AppRouter />
}
