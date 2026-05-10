import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import useGameActions from '../../hooks/useGameActions'

const mockSocket = () => ({ emit: vi.fn() })

describe('useGameActions', () => {
  it('jouerPoser émet jouer/poser avec les bonnes coords', () => {
    const socket = mockSocket()
    const { result } = renderHook(() => useGameActions(socket))
    result.current.jouerPoser(3, 3)
    expect(socket.emit).toHaveBeenCalledWith('jouer', { type: 'poser', row: 3, col: 3 })
  })

  it('jouerDeplacement émet jouer/deplacement avec from et to', () => {
    const socket = mockSocket()
    const { result } = renderHook(() => useGameActions(socket))
    result.current.jouerDeplacement([1, 1], [2, 2])
    expect(socket.emit).toHaveBeenCalledWith('jouer', {
      type: 'deplacement',
      coup: [1, 1, 2, 2],
    })
  })

  it('jouerEjecter émet jouer/ejecter avec row et col', () => {
    const socket = mockSocket()
    const { result } = renderHook(() => useGameActions(socket))
    result.current.jouerEjecter(0, 0)
    expect(socket.emit).toHaveBeenCalledWith('jouer', { type: 'ejecter', row: 0, col: 0 })
  })

  it('demanderCoups émet deplacements_valides', () => {
    const socket = mockSocket()
    const { result } = renderHook(() => useGameActions(socket))
    result.current.demanderCoups(2, 3)
    expect(socket.emit).toHaveBeenCalledWith('deplacements_valides', { row: 2, col: 3 })
  })

  it('abandonner émet abandonner', () => {
    const socket = mockSocket()
    const { result } = renderHook(() => useGameActions(socket))
    result.current.abandonner()
    expect(socket.emit).toHaveBeenCalledWith('abandonner')
  })

  it('mettreEnPause émet pause', () => {
    const socket = mockSocket()
    const { result } = renderHook(() => useGameActions(socket))
    result.current.mettreEnPause()
    expect(socket.emit).toHaveBeenCalledWith('pause')
  })

  it('reprendre émet reprendre', () => {
    const socket = mockSocket()
    const { result } = renderHook(() => useGameActions(socket))
    result.current.reprendre()
    expect(socket.emit).toHaveBeenCalledWith('reprendre')
  })
})
