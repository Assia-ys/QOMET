import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import Game from '../pages/Game'
import IA from '../pages/IA'
import Reseau from '../pages/Reseau'
import Parametres from '../pages/Parametres'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/"           element={<Home />} />
      <Route path="/jeu"        element={<Game />} />
      <Route path="/ia"         element={<IA />} />
      <Route path="/reseau"     element={<Reseau />} />
      <Route path="/parametres" element={<Parametres />} />
    </Routes>
  )
}
