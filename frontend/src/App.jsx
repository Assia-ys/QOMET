import { useEffect } from 'react'
import AppRouter from './router'

export default function App() {
  useEffect(() => {
    const pref = localStorage.getItem('qomet_plein_ecran') === 'true'
    if (window.electronAPI?.setFullScreen) {
      window.electronAPI.setFullScreen(pref)
    }
    if (window.electronAPI?.onMainLog) {
      window.electronAPI.onMainLog((msg) => console.log('[Main]', msg))
    }
  }, [])

  return <AppRouter />
}
