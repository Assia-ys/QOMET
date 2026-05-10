import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../../components/ui/Button'
import { LangueProvider } from '../../hooks/useLangue'

// Wrapper minimal pour le contexte langue
const wrapper = ({ children }) => <LangueProvider>{children}</LangueProvider>

describe('Button', () => {
  it('affiche le label', () => {
    render(<Button label="Tester" couleur="#333" />, { wrapper })
    expect(screen.getByText('Tester')).toBeInTheDocument()
  })

  it('appelle onClick au clic', () => {
    const fn = vi.fn()
    render(<Button label="Clic" couleur="#333" onClick={fn} />, { wrapper })
    fireEvent.click(screen.getByText('Clic'))
    expect(fn).toHaveBeenCalledOnce()
  })

  it('ne déclenche pas onClick si disabled', () => {
    const fn = vi.fn()
    render(<Button label="Off" couleur="#333" onClick={fn} disabled />, { wrapper })
    fireEvent.click(screen.getByText('Off'))
    expect(fn).not.toHaveBeenCalled()
  })

  it('affiche l icone si fournie', () => {
    render(<Button label="Icone" couleur="#333" icone="⭐" />, { wrapper })
    expect(screen.getByText('⭐')).toBeInTheDocument()
  })
})
