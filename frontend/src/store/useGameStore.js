import { create } from 'zustand'
import { GRILLE_VIDE } from '../constants/board'
import { joueurInitial } from '../constants/game'

const etatInitial = {
  plateau:           GRILLE_VIDE(),
  joueurs:           [joueurInitial('Joueur 1', 'clair'), joueurInitial('Joueur 2', 'fonce')],
  indexJoueurActif:  0,
  etatPartie:        'en_attente',
  gagnant:           null,
  selectionne:       null,
  coupsValides:      [],
  peutEjecter:       false,
  niveauIA:          'facile',
  prenomJoueur:      '',
  codeRoom:          null,
  maCouleur:         null,
  adversaireEnPause: false,
  cellulesGagnantes: [],
}

const useGameStore = create((set, get) => ({
  ...etatInitial,

  joueurActif: () => get().joueurs[get().indexJoueurActif],

  selectionnerCase: (row, col) =>
    set({ selectionne: row === null ? null : [row, col] }),

  setCoupsValides:  (coups)   => set({ coupsValides: coups }),
  setPeutEjecter:   (val)     => set({ peutEjecter: val }),
  setEtatPartie:    (etat)    => set({ etatPartie: etat }),
  setCodeRoom:         (code)    => set({ codeRoom: code }),
  setMaCouleur:        (couleur) => set({ maCouleur: couleur }),
  setPrenomJoueur:     (prenom)  => set({ prenomJoueur: prenom }),
  setAdversaireEnPause:(val)     => set({ adversaireEnPause: val }),
  setCellulesGagnantes:(cellules) => set({ cellulesGagnantes: cellules }),

  setGagnant: (gagnant) =>
    set({ gagnant, etatPartie: 'terminee' }),

  // Mise à jour complète depuis le serveur
  setEtatServeur: (data) =>
    set((state) => {
      let plateau = state.plateau
      if (data.plateau) {
        plateau = Array.from({ length: 7 }, () => Array(7).fill(null))
        for (const [key, val] of Object.entries(data.plateau)) {
          const [r, c] = key.split(',').map(Number)
          plateau[r][c] = val === 'hors_plateau' ? null : val
        }
      }

      const joueurs = data.joueurs
        ? data.joueurs.map((j, i) => ({
            ...state.joueurs[i],
            nom:         j.nom,
            couleur:     j.couleur,
            en_main:     j.en_main,
            sur_plateau: j.sur_plateau,
          }))
        : state.joueurs

      // Utilise couleur_active pour identifier le joueur actif (même si les noms sont identiques)
      const indexActif = data.couleur_active
        ? joueurs.findIndex(j => j.couleur === data.couleur_active)
        : joueurs.findIndex(j => j.nom === data.joueur_actif)

      return {
        plateau,
        joueurs,
        indexJoueurActif: indexActif >= 0 ? indexActif : state.indexJoueurActif,
        gagnant:          data.gagnant ? { nom: data.gagnant } : null,
        etatPartie:       data.termine ? 'terminee' : 'en_cours',
        selectionne:      null,
        coupsValides:     [],
      }
    }),

  setConfigIA: (niveau, prenom) =>
    set((state) => ({
      niveauIA:     niveau,
      prenomJoueur: prenom,
      joueurs: [
        { ...state.joueurs[0], nom: prenom },
        { ...state.joueurs[1], nom: 'IA' },
      ],
    })),

  reinitialiser: () => set({
    ...etatInitial,
    plateau: GRILLE_VIDE(),
    joueurs: [joueurInitial('Joueur 1', 'clair'), joueurInitial('Joueur 2', 'fonce')],
  }),
}))

export default useGameStore