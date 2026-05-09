import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LangueProvider } from '../../hooks/useLangue'
import BoutonRetour from '../../components/layout/BoutonRetour'
import BoutonMenu from '../../components/layout/BoutonMenu'

const wrapper = ({ children }) => <LangueProvider>{children}</LangueProvider>

describe('BoutonRetour', () => {
  it('affiche le label traduit par défaut (FR)', () => {
    render(<BoutonRetour onClick={() => {}} />, { wrapper })
    expect(screen.getByText(/Retour/i)).toBeInTheDocument()
  })

  it('affiche un label personnalisé si fourni', () => {
    render(<BoutonRetour onClick={() => {}} label="← Annuler" />, { wrapper })
    expect(screen.getByText('← Annuler')).toBeInTheDocument()
  })

  it('appelle onClick au clic', () => {
    const fn = vi.fn()
    render(<BoutonRetour onClick={fn} />, { wrapper })
    fireEvent.click(screen.getByRole('button'))
    expect(fn).toHaveBeenCalledOnce()
  })
})

describe('BoutonMenu', () => {
  it('affiche le label Menu par défaut', () => {
    render(<BoutonMenu onClick={() => {}} />, { wrapper })
    expect(screen.getByText('Menu')).toBeInTheDocument()
  })

  it('affiche un label personnalisé', () => {
    render(<BoutonMenu onClick={() => {}} label="Accueil" />, { wrapper })
    expect(screen.getByText('Accueil')).toBeInTheDocument()
  })

  it('appelle onClick au clic', () => {
    const fn = vi.fn()
    render(<BoutonMenu onClick={fn} />, { wrapper })
    fireEvent.click(screen.getByRole('button'))
    expect(fn).toHaveBeenCalledOnce()
  })

  it('prend toute la largeur avec fullWidth', () => {
    const { container } = render(<BoutonMenu onClick={() => {}} fullWidth />, { wrapper })
    const btn = container.querySelector('button')
    expect(btn.style.width).toBe('100%')
  })
})
