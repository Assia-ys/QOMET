import { describe, it, expect, vi, beforeEach } from 'vitest'
import { creerPartie, verifierPartie } from '../../api/parties'

// Mock global fetch
beforeEach(() => {
  vi.resetAllMocks()
})

describe('creerPartie', () => {
  it('retourne le code en cas de succès', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok:   true,
      json: async () => ({ code: 'AB12', message: 'Partie créée' }),
    })
    const data = await creerPartie('Alice')
    expect(data.code).toBe('AB12')
  })

  it('lève une erreur si la réponse n est pas ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok:     false,
      status: 500,
      json:   async () => ({}),
    })
    await expect(creerPartie('Alice')).rejects.toThrow()
  })

  it('lève une erreur si fetch lève une exception réseau', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    await expect(creerPartie('Alice')).rejects.toThrow('Network error')
  })
})

describe('verifierPartie', () => {
  it('retourne les données en cas de succès', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok:   true,
      json: async () => ({ code: 'AB12', existe: true, pleine: false }),
    })
    const data = await verifierPartie('AB12')
    expect(data.existe).toBe(true)
  })

  it('lève une erreur si code inexistant (404)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok:     false,
      status: 404,
      json:   async () => ({}),
    })
    await expect(verifierPartie('ZZZZ')).rejects.toThrow()
  })
})
