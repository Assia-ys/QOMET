import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { LangueProvider, useLangue } from '../../hooks/useLangue'

const wrapper = ({ children }) => <LangueProvider>{children}</LangueProvider>

describe('useLangue — langue par défaut', () => {
  beforeEach(() => localStorage.removeItem('qomet_langue'))

  it('langue par défaut est fr', () => {
    const { result } = renderHook(() => useLangue(), { wrapper })
    expect(result.current.langue).toBe('fr')
  })

  it('t.home.quitter vaut "Quitter" en français', () => {
    const { result } = renderHook(() => useLangue(), { wrapper })
    expect(result.current.t.home.quitter).toBe('Quitter')
  })
})

describe('useLangue — changement de langue', () => {
  beforeEach(() => localStorage.removeItem('qomet_langue'))
  afterEach(() => localStorage.removeItem('qomet_langue'))

  it('setLangue passe en anglais', () => {
    const { result } = renderHook(() => useLangue(), { wrapper })
    act(() => result.current.setLangue('en'))
    expect(result.current.langue).toBe('en')
    expect(result.current.t.home.quitter).toBe('Quit')
  })

  it('persiste la langue dans localStorage', () => {
    const { result } = renderHook(() => useLangue(), { wrapper })
    act(() => result.current.setLangue('en'))
    expect(localStorage.getItem('qomet_langue')).toBe('en')
  })

  it('relit la langue depuis localStorage au montage', () => {
    localStorage.setItem('qomet_langue', 'en')
    const { result } = renderHook(() => useLangue(), { wrapper })
    expect(result.current.langue).toBe('en')
    expect(result.current.t.params.titre).toBe('Settings')
  })
})

describe('useLangue — traductions complètes', () => {
  it('toutes les clés game existent en FR et EN', () => {
    localStorage.removeItem('qomet_langue')
    const { result } = renderHook(() => useLangue(), { wrapper })
    const keysFr = Object.keys(result.current.t.game)
    act(() => result.current.setLangue('en'))
    const keysEn = Object.keys(result.current.t.game)
    expect(keysFr.sort()).toEqual(keysEn.sort())
  })

  it('toutes les clés modal existent en FR et EN', () => {
    localStorage.removeItem('qomet_langue')
    const { result } = renderHook(() => useLangue(), { wrapper })
    const keysFr = Object.keys(result.current.t.modal)
    act(() => result.current.setLangue('en'))
    const keysEn = Object.keys(result.current.t.modal)
    expect(keysFr.sort()).toEqual(keysEn.sort())
  })
})
