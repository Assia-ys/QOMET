import { useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from '../pages/Home'
import Game from '../pages/Game'
import IA from '../pages/IA'
import Reseau from '../pages/Reseau/index'
import Parametres from '../pages/Parametres'
import { getSocket, resetSocketToServer } from '../hooks/useSocket'

const LOCAL_URL = 'http://127.0.0.1:7777'

export default function AppRouter() {
  const location = useLocation()
  const prevPath  = useRef(location.pathname)

  useEffect(() => {
    const ancienne = prevPath.current
    const nouvelle = location.pathname
    prevPath.current = nouvelle

    // Dès qu'on quitte /jeu => reset socket vers local si nécessaire
    if (ancienne === '/jeu' && nouvelle !== '/jeu' && window.electronAPI) {
      const current = getSocket()
      if (current.io?.uri !== LOCAL_URL) {
        current.disconnect()
        resetSocketToServer(LOCAL_URL)
      }
    }
  }, [location])

  return (
    <div key={location.key} style={{ animation: 'pageEnter 0.3s ease forwards' }}>
      <Routes location={location}>
        <Route path="/"           element={<Home />} />
        <Route path="/jeu"        element={<Game />} />
        <Route path="/ia"         element={<IA />} />
        <Route path="/reseau"     element={<Reseau />} />
        <Route path="/parametres" element={<Parametres />} />
      </Routes>
    </div>
  )
}
