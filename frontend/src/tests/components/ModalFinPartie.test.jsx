import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LangueProvider } from '../../hooks/useLangue'
import ModalFinPartie from '../../components/game/ModalFinPartie'
import useGameStore from '../../store/useGameStore'

vi.mock('../hooks/useSocket', () => ({
  default:   () => ({ emit: vi.fn() }),
  getSocket: () => ({ emit: vi.fn() }),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

const wrapper = ({ children }) => <LangueProvider>{children}</LangueProvider>

beforeEach(() => {
  useGameStore.getState().reinitialiser()
  useGameStore.getState().setMaCouleur('clair')
  useGameStore.getState().setPrenomJoueur('Alice')
  useGameStore.setState({
    joueurs: [
      { nom: 'Alice', couleur: 'clair', en_main: 0, sur_plateau: 7 },
      { nom: 'Bob',   couleur: 'fonce', en_main: 0, sur_plateau: 7 },
    ],
  })
})

describe('ModalFinPartie — gagnant', () => {
  it('affiche "Tu as gagné" pour le gagnant', () => {
    render(
      <ModalFinPartie gagnant={{ nom: 'Alice' }} duree="01:23" />,
      { wrapper }
    )
    expect(screen.getByText(/Tu as gagné/i)).toBeInTheDocument()
  })

  it('affiche "Tu as perdu" pour le perdant', () => {
    useGameStore.getState().setPrenomJoueur('Bob')
    render(
      <ModalFinPartie gagnant={{ nom: 'Alice' }} duree="01:23" />,
      { wrapper }
    )
    expect(screen.getByText(/Tu as perdu/i)).toBeInTheDocument()
  })

  it('affiche la durée de partie', () => {
    render(
      <ModalFinPartie gagnant={{ nom: 'Alice' }} duree="02:45" />,
      { wrapper }
    )
    expect(screen.getByText('02:45')).toBeInTheDocument()
  })
})

describe('ModalFinPartie — forfait', () => {
  it('affiche l écran adversaire déconnecté', () => {
    render(
      <ModalFinPartie gagnant={{ nom: 'Alice', forfait: true }} duree="" />,
      { wrapper }
    )
    expect(screen.getByText(/Adversaire déconnecté/i)).toBeInTheDocument()
  })
})
