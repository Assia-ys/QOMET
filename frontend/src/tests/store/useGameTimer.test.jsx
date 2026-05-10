import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useGameTimer from '../../hooks/useGameTimer'

describe('useGameTimer — timer de jeu', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('tempsJeu démarre à 00:00', () => {
    const { result } = renderHook(() => useGameTimer({
      gagnant: null, pauseVisible: false, adversaireEnPause: false,
      onPauseExpire: () => {},
    }))
    expect(result.current.tempsJeu).toBe('00:00')
  })

  it('tempsJeu avance après 1 seconde', () => {
    const { result } = renderHook(() => useGameTimer({
      gagnant: null, pauseVisible: false, adversaireEnPause: false,
      onPauseExpire: () => {},
    }))
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.tempsJeu).toBe('00:01')
  })

  it('timer s arrête quand gagnant est défini', () => {
    const { result, rerender } = renderHook(
      ({ gagnant }) => useGameTimer({
        gagnant, pauseVisible: false, adversaireEnPause: false,
        onPauseExpire: () => {},
      }),
      { initialProps: { gagnant: null } }
    )
    act(() => { vi.advanceTimersByTime(2000) })
    rerender({ gagnant: { nom: 'Alice' } })
    const temps = result.current.tempsJeu
    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current.tempsJeu).toBe(temps)  // n'a pas bougé
  })

  it('timer s arrête pendant la pause', () => {
    const { result, rerender } = renderHook(
      ({ pauseVisible }) => useGameTimer({
        gagnant: null, pauseVisible, adversaireEnPause: false,
        onPauseExpire: () => {},
      }),
      { initialProps: { pauseVisible: false } }
    )
    act(() => { vi.advanceTimersByTime(1000) })
    rerender({ pauseVisible: true })
    const temps = result.current.tempsJeu
    act(() => { vi.advanceTimersByTime(2000) })
    expect(result.current.tempsJeu).toBe(temps)
  })

  it('dureePartie fixée à la fin de partie', () => {
    const { result, rerender } = renderHook(
      ({ gagnant }) => useGameTimer({
        gagnant, pauseVisible: false, adversaireEnPause: false,
        onPauseExpire: () => {},
      }),
      { initialProps: { gagnant: null } }
    )
    act(() => { vi.advanceTimersByTime(5000) })
    rerender({ gagnant: { nom: 'Alice' } })
    expect(result.current.dureePartie).toBe('00:05')
  })
})

describe('useGameTimer — compte à rebours pause', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('tempsPause démarre à 60', () => {
    const { result } = renderHook(() => useGameTimer({
      gagnant: null, pauseVisible: false, adversaireEnPause: false,
      onPauseExpire: () => {},
    }))
    expect(result.current.tempsPause).toBe(60)
  })

  it('tempsPause décrémente pendant la pause', () => {
    const { result, rerender } = renderHook(
      ({ pauseVisible }) => useGameTimer({
        gagnant: null, pauseVisible, adversaireEnPause: false,
        onPauseExpire: () => {},
      }),
      { initialProps: { pauseVisible: true } }
    )
    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current.tempsPause).toBe(57)
  })

  it('onPauseExpire appelé quand tempsPause atteint 0', () => {
    const onExpire = vi.fn()
    const { rerender } = renderHook(
      ({ pauseVisible }) => useGameTimer({
        gagnant: null, pauseVisible, adversaireEnPause: false,
        onPauseExpire: onExpire,
      }),
      { initialProps: { pauseVisible: true } }
    )
    act(() => { vi.advanceTimersByTime(61000) })
    expect(onExpire).toHaveBeenCalled()
  })
})
