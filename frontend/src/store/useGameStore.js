import { create } from 'zustand'
import { GRILLE_VIDE, JOUEUR_1_MOCK, JOUEUR_2_MOCK } from '../data/mockData'

const etatInitial = {
  plateau: GRILLE_VIDE,
  joueurs: [{ ...JOUEUR_1_MOCK }, { ...JOUEUR_2_MOCK }],
  indexJoueurActif: 0,
  etatPartie: 'en_attente',
  gagnant: null,
  selectionne: null,
  coupsValides: [],
  dernierCoup: null,
  niveauIA: 'facile',   
  prenomJoueur: '',
}

const useGameStore = create((set, get) => ({
  ...etatInitial,

  joueurActif: () => get().joueurs[get().indexJoueurActif],

  selectionnerCase: (row, col) =>
    set({ selectionne: row === null ? null : [row, col] }),

  setCoupsValides: (coups) => set({ coupsValides: coups }),
  setPlateau:      (plateau) => set({ plateau }),
  setEtatPartie:   (etat) => set({ etatPartie: etat }),
  setGagnant:      (joueur) => set({ gagnant: joueur, etatPartie: 'terminee' }),

  changerTour: () =>
    set((state) => ({
      indexJoueurActif: state.indexJoueurActif === 0 ? 1 : 0,
      selectionne: null,
      coupsValides: [],
      dernierCoup: state.selectionne,
    })),

  poserEtoile: (indexJoueur) =>
    set((state) => ({
      joueurs: state.joueurs.map((j, i) =>
        i === indexJoueur ? { ...j, en_main: j.en_main - 1, sur_plateau: j.sur_plateau + 1 } : j
      ),
    })),

  recupererEtoile: (couleur) =>
    set((state) => ({
      joueurs: state.joueurs.map(j =>
        j.couleur === couleur ? { ...j, en_main: j.en_main + 1, sur_plateau: j.sur_plateau - 1 } : j
      ),
    })),

  setConfigIA: (niveau, prenom) => set({ niveauIA: niveau, prenomJoueur: prenom }),

  reinitialiser: () => set({ ...etatInitial }),
}))

export default useGameStore
