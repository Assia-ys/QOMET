import { Routes, Route, useLocation } from 'react-router-dom'
import Home from '../pages/Home'
import Game from '../pages/Game'
import IA from '../pages/IA'
import Reseau from '../pages/Reseau'
import Parametres from '../pages/Parametres'

export default function AppRouter() {
  const location = useLocation()
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
