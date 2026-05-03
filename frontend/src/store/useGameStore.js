import { create } from 'zustand'
import { GRILLE_VIDE, JOUEUR_1_MOCK, JOUEUR_2_MOCK } from '../data/mockData'

const etatInitial = {
  plateau:          GRILLE_VIDE,
  joueurs:          [{ ...JOUEUR_1_MOCK }, { ...JOUEUR_2_MOCK }],
  indexJoueurActif: 0,
  etatPartie:       'en_attente',
  gagnant:          null,
  selectionne:      null,
  coupsValides:     [],
  dernierCoup:      null,
  niveauIA:         'facile',
  prenomJoueur:     '',
  codeRoom:         null,
  maCouleur:        null,
}

const useGameStore = create((set, get) => ({
  ...etatInitial,

  joueurActif: () => get().joueurs[get().indexJoueurActif],

  selectionnerCase: (row, col) =>
    set({ selectionne: row === null ? null : [row, col] }),

  setCoupsValides: (coups) => set({ coupsValides: coups }),
  setPlateau:       (plateau) => set({ plateau }),
  setEtatPartie:    (etat) => set({ etatPartie: etat }),
  setCodeRoom:      (code) => set({ codeRoom: code }),
  setMaCouleur:     (couleur) => set({ maCouleur: couleur }),
  setPrenomJoueur:  (prenom) => set({ prenomJoueur: prenom }),

  setGagnant: (gagnant) =>
    set({ gagnant, etatPartie: 'terminee' }),

  // Appelée par useSocket quand le serveur envoie "etat" ou "partie_demarree"
  setEtatServeur: (data) =>
    set((state) => {
      // Plateau : convertit dict serveur {"r,c": val} → tableau 2D
      let plateau = state.plateau
      if (data.plateau) {
        plateau = Array.from({ length: 7 }, () => Array(7).fill(null))
        for (const [key, val] of Object.entries(data.plateau)) {
          const [r, c] = key.split(',').map(Number)
          plateau[r][c] = val === 'hors_plateau' ? null : val
        }
      }

      // Joueurs : données structurées depuis le serveur
      const joueurs = data.joueurs
        ? data.joueurs.map((j, i) => ({
            ...state.joueurs[i],
            nom:         j.nom,
            couleur:     j.couleur,
            en_main:     j.en_main,
            sur_plateau: j.sur_plateau,
          }))
        : state.joueurs

      const indexActif = joueurs.findIndex(j => j.nom === data.joueur_actif)

      return {
        plateau,
        joueurs,
        indexJoueurActif: indexActif >= 0 ? indexActif : state.indexJoueurActif,
        gagnant:          data.gagnant || null,
        etatPartie:       data.termine ? 'terminee' : 'en_cours',
        selectionne:      null,
        coupsValides:     [],
      }
    }),

  changerTour: () =>
    set((state) => ({
      indexJoueurActif: state.indexJoueurActif === 0 ? 1 : 0,
      selectionne:      null,
      coupsValides:     [],
      dernierCoup:      state.selectionne,
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

  setConfigIA: (niveau, prenom) =>
    set((state) => ({
      niveauIA:     niveau,
      prenomJoueur: prenom,
      joueurs: [
        { ...state.joueurs[0], nom: prenom },
        { ...state.joueurs[1], nom: 'IA' },
      ],
    })),

  reinitialiser: () => set({ ...etatInitial }),
}))

export default useGameStore
