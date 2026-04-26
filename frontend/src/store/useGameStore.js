import { create } from 'zustand'
import { GRILLE_VIDE, JOUEUR_1_MOCK, JOUEUR_2_MOCK } from '../data/mockData'

const etatInitial = {
  plateau: GRILLE_VIDE,
  joueurs: [{ ...JOUEUR_1_MOCK }, { ...JOUEUR_2_MOCK }],
  indexJoueurActif: 0,
  etatPartie: 'en_attente', // 'en_attente' | 'en_cours' | 'terminee'
  gagnant: null,
  selectionne: null,
  coupsValides: [],
  dernierCoup: null,
}

const useGameStore = create((set, get) => ({
  ...etatInitial,

  joueurActif: () => get().joueurs[get().indexJoueurActif],

  selectionnerCase: (row, col) =>
    set({ selectionne: [row, col] }),

  setCoupsValides: (coups) =>
    set({ coupsValides: coups }),

  setPlateau: (plateau) =>
    set({ plateau }),

  setEtatPartie: (etat) =>
    set({ etatPartie: etat }),

  setGagnant: (joueur) =>
    set({ gagnant: joueur, etatPartie: 'terminee' }),

  changerTour: () =>
    set((state) => ({
      indexJoueurActif: state.indexJoueurActif === 0 ? 1 : 0,
      selectionne: null,
      coupsValides: [],
      dernierCoup: state.selectionne,
    })),

  reinitialiser: () =>
    set({
      ...etatInitial,
      plateau: GRILLE_VIDE,
      joueurs: [{ ...JOUEUR_1_MOCK }, { ...JOUEUR_2_MOCK }],
    }),
}))

export default useGameStore
