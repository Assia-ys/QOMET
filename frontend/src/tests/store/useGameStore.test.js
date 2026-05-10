import { describe, it, expect, beforeEach } from 'vitest'
import useGameStore from '../../store/useGameStore'

beforeEach(() => {
  useGameStore.getState().reinitialiser()
})

describe('useGameStore — état initial', () => {
  it('plateau est une grille 7x7 de null', () => {
    const { plateau } = useGameStore.getState()
    expect(plateau).toHaveLength(7)
    plateau.forEach(row => {
      expect(row).toHaveLength(7)
      row.forEach(cell => expect(cell).toBeNull())
    })
  })

  it('joueurs initiaux ont 7 étoiles en main', () => {
    const { joueurs } = useGameStore.getState()
    expect(joueurs[0].en_main).toBe(7)
    expect(joueurs[1].en_main).toBe(7)
  })

  it('indexJoueurActif commence à 0', () => {
    expect(useGameStore.getState().indexJoueurActif).toBe(0)
  })

  it('gagnant null au départ', () => {
    expect(useGameStore.getState().gagnant).toBeNull()
  })

  it('etatPartie en_attente au départ', () => {
    expect(useGameStore.getState().etatPartie).toBe('en_attente')
  })
})

describe('useGameStore — setGagnant', () => {
  it('setGagnant met à jour gagnant et etatPartie', () => {
    useGameStore.getState().setGagnant({ nom: 'Alice' })
    const { gagnant, etatPartie } = useGameStore.getState()
    expect(gagnant.nom).toBe('Alice')
    expect(etatPartie).toBe('terminee')
  })

  it('setGagnant forfait', () => {
    useGameStore.getState().setGagnant({ nom: 'Bob', forfait: true })
    expect(useGameStore.getState().gagnant.forfait).toBe(true)
  })
})

describe('useGameStore — setEtatServeur', () => {
  it('normalise gagnant en objet avec nom', () => {
    useGameStore.getState().setEtatServeur({
      plateau: {},
      joueurs: [
        { nom: 'Alice', couleur: 'clair', en_main: 0, sur_plateau: 7 },
        { nom: 'Bob',   couleur: 'fonce', en_main: 0, sur_plateau: 7 },
      ],
      joueur_actif:   'Alice',
      couleur_active: 'clair',
      termine:        true,
      gagnant:        'Alice',
    })
    const { gagnant } = useGameStore.getState()
    expect(gagnant).toBeDefined()
    expect(gagnant.nom).toBe('Alice')
  })

  it('gagnant null si partie non terminée', () => {
    useGameStore.getState().setEtatServeur({
      plateau: {},
      joueurs: [
        { nom: 'Alice', couleur: 'clair', en_main: 7, sur_plateau: 0 },
        { nom: 'Bob',   couleur: 'fonce', en_main: 7, sur_plateau: 0 },
      ],
      joueur_actif: 'Alice',
      couleur_active: 'clair',
      termine: false,
      gagnant: null,
    })
    expect(useGameStore.getState().gagnant).toBeNull()
  })
})

describe('useGameStore — setConfigIA', () => {
  it('setConfigIA met à jour niveauIA et prenomJoueur', () => {
    useGameStore.getState().setConfigIA('difficile', 'Alice')
    const { niveauIA, prenomJoueur } = useGameStore.getState()
    expect(niveauIA).toBe('difficile')
    expect(prenomJoueur).toBe('Alice')
  })

  it('setConfigIA nomme IA le joueur 2', () => {
    useGameStore.getState().setConfigIA('moyen', 'Bob')
    expect(useGameStore.getState().joueurs[1].nom).toBe('IA')
  })
})

describe('useGameStore — reinitialiser', () => {
  it('reinitialiser reset tout', () => {
    useGameStore.getState().setGagnant({ nom: 'Alice' })
    useGameStore.getState().setMaCouleur('clair')
    useGameStore.getState().reinitialiser()
    const state = useGameStore.getState()
    expect(state.gagnant).toBeNull()
    expect(state.maCouleur).toBeNull()
    expect(state.etatPartie).toBe('en_attente')
  })
})

describe('useGameStore — coupsValides / peutEjecter', () => {
  it('setCoupsValides met à jour la liste', () => {
    useGameStore.getState().setCoupsValides([[1,1],[2,2]])
    expect(useGameStore.getState().coupsValides).toHaveLength(2)
  })

  it('setPeutEjecter met à jour le flag', () => {
    useGameStore.getState().setPeutEjecter(true)
    expect(useGameStore.getState().peutEjecter).toBe(true)
  })
})
