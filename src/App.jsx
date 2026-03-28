import { useState } from 'react'
import Board from './components/Board'
import PlayerInfo from './components/PlayerInfo'

const grilleTest = Array.from({ length: 7 }, (_, r) =>
  Array.from({ length: 7 }, (_, c) => {
    if (r === 0 && c === 0) return "clair"
    if (r === 3 && c === 3) return "fonce"
    if (r === 6 && c === 6) return "clair"
    return null
  })
)

const j1 = { nom: "Alice", couleur: "clair", en_main: 5, sur_plateau: 2 }
const j2 = { nom: "Bob", couleur: "fonce", en_main: 6, sur_plateau: 1 }

export default function App() {
  const [selectionne, setSelectionne] = useState(null)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#030712',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 32,
      fontFamily: 'sans-serif',
    }}>
      <PlayerInfo joueur={j1} estActif={true} />
      <Board
        grille={grilleTest}
        selectionne={selectionne}
        coupsValides={[]}
        onCellClick={(r, c) => setSelectionne([r, c])}
      />
      <PlayerInfo joueur={j2} estActif={false} />
    </div>
  )
}