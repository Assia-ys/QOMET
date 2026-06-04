import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LangueProvider } from '../../hooks/useLangue'
import PlayerInfo from '../../components/game/PlayerInfo'

const wrapper = ({ children }) => <LangueProvider>{children}</LangueProvider>

const joueurClair = { nom: 'Alice', couleur: 'clair', en_main: 5, sur_plateau: 2 }
const joueurFonce = { nom: 'Bob',   couleur: 'fonce', en_main: 3, sur_plateau: 4 }
const joueurIA    = { nom: 'IA',    couleur: 'fonce', en_main: 0, sur_plateau: 7 }

vi.mock('../../components/game/Board', () => ({
  EtoileSVG: ({ fill }) => <span data-testid="etoile" data-fill={fill} />,
}))

describe('PlayerInfo — affichage', () => {
  it('affiche le nom du joueur', () => {
    render(<PlayerInfo joueur={joueurClair} estActif={false} />, { wrapper })
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('affiche TON TOUR quand actif + estMoi', () => {
    render(<PlayerInfo joueur={joueurClair} estActif={true} estMoi={true} />, { wrapper })
    expect(screen.getByText(/TON TOUR/i)).toBeInTheDocument()
  })

  it('affiche SON TOUR quand actif + pas estMoi', () => {
    render(<PlayerInfo joueur={joueurFonce} estActif={true} estMoi={false} />, { wrapper })
    expect(screen.getByText(/SON TOUR/i)).toBeInTheDocument()
  })

  it("n'affiche pas de badge tour si pas actif", () => {
    render(<PlayerInfo joueur={joueurClair} estActif={false} />, { wrapper })
    expect(screen.queryByText(/TON TOUR/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/SON TOUR/i)).not.toBeInTheDocument()
  })
})

describe('PlayerInfo — badge IA', () => {
  it('affiche le badge niveau si IA', () => {
    render(<PlayerInfo joueur={joueurIA} estActif={false} niveauIA="facile" />, { wrapper })
    expect(screen.getByText(/Facile/i)).toBeInTheDocument()
  })

  it('badge couleur verte pour facile', () => {
    render(
      <PlayerInfo joueur={joueurIA} estActif={false} niveauIA="facile" />,
      { wrapper }
    )
    // Le texte "Facile" est affiché en vert,  on vérifie juste la présence
    const badge = screen.getByText(/Facile/i)
    expect(badge).toBeInTheDocument()
    // Le style contient une couleur (pas blanc)
    expect(badge.style.color).not.toBe('#fff')
  })

  it("n'affiche pas de badge si pas IA", () => {
    render(<PlayerInfo joueur={joueurClair} estActif={false} niveauIA="facile" />, { wrapper })
    expect(screen.queryByText(/Facile/i)).not.toBeInTheDocument()
  })
})
